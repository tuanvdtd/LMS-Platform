import { randomUUID } from 'node:crypto';
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type PostStatus } from '@prisma/client';
import { IMAGE_EXT } from '../assets/file-check.js';
import type { AuthSession } from '../auth/auth.js';
import { isGuid, validationError } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { StorageService } from '../infra/storage.service.js';
import { TX_OPTIONS } from '../instructor-courses/instructor-courses.service.js';
import { courseSlug, slugify } from '../instructor-courses/slugify.js';
import { canWriteFrom, excerptOf, publishProblems, readingMinutes } from './post-rules.js';
import type { PostUploadInput, SavePostInput } from './posts.schemas.js';

type User = AuthSession['user'];

export const postNotFound = () =>
  new NotFoundException({ statusCode: 404, code: 'POST_NOT_FOUND', message: 'Không tìm thấy bài viết' });
const writeForbidden = () =>
  new ForbiddenException({ statusCode: 403, code: 'POST_WRITE_FORBIDDEN', message: 'Tài khoản của bạn chưa được viết bài' });
const wrongState = (message: string) => new ConflictException({ statusCode: 409, code: 'POST_STATE', message });

const ROW = {
  id: true,
  title: true,
  slug: true,
  status: true,
  updatedAt: true,
  publishedAt: true,
  removedReason: true,
} satisfies Prisma.PostSelect;
const MINE = {
  ...ROW,
  excerpt: true,
  coverUrl: true,
  bodyHtml: true,
  relatedCourseId: true,
  topics: { select: { topic: { select: { id: true, slug: true, name: true } } } },
} satisfies Prisma.PostSelect;

// Tác giả và admin. Phần đọc công khai ở posts-public.service.ts.
@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async canWrite(user: Pick<User, 'id' | 'role'>): Promise<boolean> {
    const [profile, course] = await Promise.all([
      this.prisma.instructorProfile.findUnique({ where: { userId: user.id }, select: { userId: true } }),
      this.prisma.course.findFirst({ where: { instructorId: user.id, status: 'published' }, select: { id: true } }),
    ]);
    return canWriteFrom({ role: user.role ?? null, hasInstructorProfile: !!profile, hasPublishedCourse: !!course });
  }

  private async assertCanWrite(user: User) {
    if (!(await this.canWrite(user))) throw writeForbidden();
  }

  list(userId: string, status?: PostStatus) {
    return this.prisma.post.findMany({
      where: { authorId: userId, ...(status && { status }) },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      select: ROW,
    });
  }

  async get(userId: string, id: string) {
    const post = isGuid(id) ? await this.prisma.post.findFirst({ where: { id, authorId: userId }, select: MINE }) : null;
    if (!post) throw postNotFound();
    const { topics, ...rest } = post;
    return { ...rest, topics: topics.map((t) => t.topic) };
  }

  async create(user: User) {
    await this.assertCanWrite(user);
    return this.prisma.post.create({ data: { authorId: user.id }, select: { id: true } });
  }

  // Sửa / gỡ / xoá chỉ cần là chủ bài: người mất quyền viết (khoá bị gỡ) vẫn dọn được bài cũ của mình.
  async update(user: User, id: string, input: SavePostInput) {
    const post = await this.get(user.id, id);
    const { topicIds, ...fields } = input;
    if (fields.coverUrl && !this.storage.keyOfPublicUrl(fields.coverUrl)?.startsWith(`posts/${user.id}/`)) {
      throw validationError([{ path: ['coverUrl'], message: 'Ảnh bìa không hợp lệ' }]);
    }
    if (fields.relatedCourseId) {
      const own = await this.prisma.course.findFirst({
        where: { id: fields.relatedCourseId, instructorId: user.id, status: 'published' },
        select: { id: true },
      });
      if (!own) throw validationError([{ path: ['relatedCourseId'], message: 'Chỉ chọn được khoá đã xuất bản của bạn' }]);
    }
    if (topicIds?.length && (await this.prisma.topic.count({ where: { id: { in: topicIds } } })) !== topicIds.length) {
      throw validationError([{ path: ['topicIds'], message: 'Chủ đề không tồn tại' }]);
    }
    // Bài đang công khai không được lưu thành bài thiếu tiêu đề / nội dung / chủ đề / ảnh bìa.
    if (post.status === 'published') {
      const problems = publishProblems({
        title: fields.title ?? post.title,
        bodyHtml: fields.bodyHtml ?? post.bodyHtml,
        topicCount: topicIds?.length ?? post.topics.length,
        coverUrl: fields.coverUrl === undefined ? post.coverUrl : fields.coverUrl,
      });
      if (problems.length) throw validationError(problems);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id },
        data: {
          ...fields,
          ...(fields.bodyHtml !== undefined && {
            readingMinutes: readingMinutes(fields.bodyHtml),
            autoExcerpt: excerptOf(fields.bodyHtml),
          }),
        },
      });
      if (topicIds) {
        await tx.postTopic.deleteMany({ where: { postId: id } });
        await tx.postTopic.createMany({ data: topicIds.map((topicId) => ({ postId: id, topicId })) });
      }
    }, TX_OPTIONS);
    return this.get(user.id, id);
  }

  async publish(user: User, id: string) {
    const post = await this.get(user.id, id);
    if (post.status === 'removed') {
      throw new ConflictException({
        statusCode: 409,
        code: 'POST_REMOVED',
        message: 'Bài đã bị quản trị viên gỡ, không xuất bản lại được',
      });
    }
    if (post.status === 'published') throw wrongState('Bài đã được xuất bản');
    await this.assertCanWrite(user);
    const problems = publishProblems({
      title: post.title,
      bodyHtml: post.bodyHtml,
      topicCount: post.topics.length,
      coverUrl: post.coverUrl,
    });
    if (problems.length) throw validationError(problems);
    const data = { status: 'published' as const, publishedAt: post.publishedAt ?? new Date() };
    if (post.slug) {
      await this.prisma.post.update({ where: { id }, data });
    } else {
      // Slug đẹp trước; trùng (hoặc tiêu đề toàn ký tự lạ) thì thêm hậu tố ngẫu nhiên như slug khoá học.
      const base = slugify(post.title);
      const taken = !base || !!(await this.prisma.post.findUnique({ where: { slug: base }, select: { id: true } }));
      try {
        await this.prisma.post.update({ where: { id }, data: { ...data, slug: taken ? courseSlug(post.title) : base } });
      } catch (err) {
        // Hai bài cùng tiêu đề xuất bản cùng lúc: unique chặn bài sau → thử lại với hậu tố.
        if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== 'P2002') throw err;
        await this.prisma.post.update({ where: { id }, data: { ...data, slug: courseSlug(post.title) } });
      }
    }
    return this.get(user.id, id);
  }

  async unpublish(user: User, id: string) {
    const { count } = isGuid(id)
      ? await this.prisma.post.updateMany({ where: { id, authorId: user.id, status: 'published' }, data: { status: 'draft' } })
      : { count: 0 };
    if (count === 0) {
      await this.get(user.id, id); // không phải bài của mình → 404
      throw wrongState('Bài chưa được xuất bản');
    }
    return this.get(user.id, id);
  }

  // ponytail: không xoá ảnh trên R2 khi xoá bài (ảnh có thể đang dùng ở bài khác của cùng tác giả). Thêm job dọn khi rác đáng kể.
  async remove(user: User, id: string) {
    const { count } = isGuid(id) ? await this.prisma.post.deleteMany({ where: { id, authorId: user.id } }) : { count: 0 };
    if (count === 0) throw postNotFound();
  }

  // Key do BE sinh, nằm trong thư mục của chính người tải; chữ ký gắn Content-Type + Content-Length.
  async createUpload(user: User, body: PostUploadInput) {
    await this.assertCanWrite(user);
    const key = `posts/${user.id}/${randomUUID()}.${IMAGE_EXT[body.mimeType]}`;
    const uploadUrl = await this.storage.presignPut('public', key, body.mimeType, body.sizeBytes);
    return { key, uploadUrl, headers: { 'Content-Type': body.mimeType }, publicUrl: this.storage.publicUrl(key) };
  }

  adminRemove(id: string, reason: string) {
    return this.adminMove(id, 'published', { status: 'removed', removedReason: reason }, 'Chỉ gỡ được bài đang xuất bản');
  }

  adminRestore(id: string) {
    return this.adminMove(id, 'removed', { status: 'draft', removedReason: null }, 'Bài không ở trạng thái bị gỡ');
  }

  private async adminMove(id: string, from: PostStatus, data: Prisma.PostUpdateManyMutationInput, message: string) {
    if (!isGuid(id)) throw postNotFound();
    const { count } = await this.prisma.post.updateMany({ where: { id, status: from }, data });
    if (count === 0) {
      if (!(await this.prisma.post.findUnique({ where: { id }, select: { id: true } }))) throw postNotFound();
      throw wrongState(message);
    }
    return this.prisma.post.findUniqueOrThrow({ where: { id }, select: { id: true, status: true } });
  }
}
