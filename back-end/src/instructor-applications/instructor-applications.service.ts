import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Notification } from '@prisma/client';
import { AVATAR_MIN, imageProblem, THUMBNAIL_MAX_BYTES } from '../assets/file-check.js';
import { AUTH, type Auth } from '../auth/auth.js';
import { isGuid, validationError } from '../common/zod.pipe.js';
import { TX_OPTIONS } from '../instructor-courses/instructor-courses.service.js';
import { PrismaService } from '../infra/prisma.service.js';
import { StorageService } from '../infra/storage.service.js';
import { MailService } from '../mail/mail.service.js';
import { NotificationsGateway } from '../notifications/notifications.gateway.js';
import type { PayoutAccountInput } from '../revenue/revenue.schemas.js';
import { RevenueService } from '../revenue/revenue.service.js';
import { applicationMissing, maskAccountNo, type MissingStep } from './application-rules.js';
import type { ApplicationsQuery, InfoInput } from './instructor-applications.schemas.js';

const EDITABLE = ['draft', 'rejected'] as const;
type Socials = { linkedin?: string; github?: string };

const PAGE_SIZE = 20;
const DETAIL_SELECT = {
  id: true,
  status: true,
  headline: true,
  bio: true,
  website: true,
  socials: true,
  termsAcceptedAt: true,
  bankBin: true,
  bankAccountNo: true,
  bankAccountName: true,
  submittedAt: true,
  reviewedAt: true,
  rejectReason: true,
  reviewedBy: { select: { id: true, name: true } },
  user: { select: { id: true, name: true, email: true, image: true, createdAt: true } },
} satisfies Prisma.InstructorApplicationSelect;
const notPending = () =>
  new ConflictException({ statusCode: 409, code: 'APPLICATION_NOT_PENDING', message: 'Đơn này đã được xử lý' });

const locked = () =>
  new ConflictException({
    statusCode: 409,
    code: 'APPLICATION_LOCKED',
    message: 'Đơn đang chờ duyệt hoặc đã duyệt, không sửa được',
  });
const alreadyPremium = (message = 'Bạn đã là giảng viên cao cấp') =>
  new ConflictException({ statusCode: 409, code: 'ALREADY_PREMIUM', message });
const incomplete = (missing: MissingStep[]) =>
  new BadRequestException({ statusCode: 400, code: 'APPLICATION_INCOMPLETE', message: 'Đơn chưa đủ thông tin', missing });

// Đơn giảng viên cao cấp. Duyệt xong mới có instructor_profiles → price-guard / gửi duyệt / chi trả không phải đổi.
@Injectable()
export class InstructorApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly revenue: RevenueService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsGateway,
    @Inject(AUTH) private readonly auth: Auth,
  ) {}

  // ---- Giảng viên ----

  // Đọc DB chứ không đọc user của session: ngay sau PUT, session trong request vẫn là bản cũ.
  async view(userId: string) {
    const [user, profile, app, { sharePct }, own] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, image: true } }),
      this.prisma.instructorProfile.findUnique({ where: { userId }, select: { userId: true } }),
      this.prisma.instructorApplication.findUnique({ where: { userId } }),
      this.revenue.getSharePct(),
      // Điền sẵn bước "Thông tin cá nhân" bằng hồ sơ đã có ở Cài đặt, để không phải gõ lại.
      this.prisma.userProfile.findUnique({ where: { userId }, select: { headline: true, bio: true } }),
    ]);
    const done = !!profile;
    const a = done ? null : app;
    return {
      // Có profile (luồng cũ hoặc đơn đã duyệt) → approved, không trả dữ liệu đơn.
      displayStatus: done ? ('approved' as const) : (app?.status ?? ('none' as const)),
      name: user.name,
      image: user.image,
      headline: a?.headline ?? (done ? null : (own?.headline ?? null)),
      bio: a?.bio ?? (done ? null : (own?.bio ?? null)),
      website: a?.website ?? null,
      socials: (a?.socials ?? {}) as Socials,
      termsAccepted: !!a?.termsAcceptedAt,
      bank: a?.bankBin
        ? { bankBin: a.bankBin, bankAccountNo: a.bankAccountNo!, bankAccountName: a.bankAccountName! }
        : null,
      submittedAt: a?.submittedAt ?? null,
      rejectReason: a?.rejectReason ?? null,
      rejectedAt: a?.rejectReason ? a.reviewedAt : null, // ngày bị từ chối, hiện cùng lý do
      missing: done ? [] : applicationMissing(a, user.image),
      revenueSharePct: sharePct,
    };
  }

  async saveInfo(userId: string, { name, ...info }: InfoInput) {
    await this.assertEditable(userId);
    await this.updateUser(userId, { name });
    await this.write(userId, {
      headline: info.headline,
      bio: info.bio,
      website: info.website ?? null,
      socials: info.socials,
    });
    return this.view(userId);
  }

  // Key do POST /instructor/assets/uploads (kind avatar) sinh, ảnh đã nằm trên R2 public.
  async saveAvatar(userId: string, key: string) {
    const ext = new RegExp(`^avatars/${userId}/[0-9a-f-]{36}\\.(jpg|png|webp)$`).exec(key)?.[1];
    // Key sai / của người khác: không xoá gì — avatar public nên ai cũng đọc được key người khác.
    if (!ext) throw validationError([{ path: ['key'], message: 'Ảnh không hợp lệ' }]);
    try {
      await this.assertEditable(userId);
    } catch (e) {
      // Key chắc chắn của user này → dọn object vừa tải để khỏi thành rác.
      await this.storage.delete('public', key).catch(() => undefined);
      throw e;
    }
    const problem = await this.checkAvatar(key, ext);
    if (problem) {
      await this.storage.delete('public', key).catch(() => undefined);
      throw validationError([{ path: ['key'], message: problem }]);
    }
    const { image: old } = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { image: true } });
    await this.updateUser(userId, { image: this.storage.publicUrl(key) });
    await this.write(userId, {});
    // Chỉ xoá ảnh cũ do mình sinh; ảnh Google OAuth là URL ngoài → keyOfPublicUrl trả null.
    const oldKey = this.storage.keyOfPublicUrl(old);
    if (oldKey?.startsWith(`avatars/${userId}/`) && oldKey !== key) {
      await this.storage.delete('public', oldKey).catch(() => undefined);
    }
    return this.view(userId);
  }

  async acceptTerms(userId: string) {
    await this.assertEditable(userId);
    await this.write(userId, { termsAcceptedAt: new Date() });
    return this.view(userId);
  }

  async savePayout(userId: string, input: PayoutAccountInput) {
    await this.assertEditable(userId);
    await this.write(userId, input);
    return this.view(userId);
  }

  async submit(userId: string) {
    const [user, profile, app] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { image: true } }),
      this.prisma.instructorProfile.findUnique({ where: { userId }, select: { userId: true } }),
      this.prisma.instructorApplication.findUnique({ where: { userId } }),
    ]);
    if (profile) throw alreadyPremium();
    if (!app) throw incomplete(applicationMissing(null, user.image));
    if (!(EDITABLE as readonly string[]).includes(app.status)) throw locked();
    const missing = applicationMissing(app, user.image);
    if (missing.length) throw incomplete(missing);
    const res = await this.prisma.instructorApplication.updateMany({
      where: { userId, status: { in: [...EDITABLE] } },
      data: { status: 'pending', submittedAt: new Date(), rejectReason: null },
    });
    if (res.count === 0) throw locked();
    return this.view(userId);
  }

  // ---- Admin ----

  // Pending: cũ nhất trước (xử lý theo thứ tự nộp); đã xử lý: mới duyệt nhất trước.
  async list(q: ApplicationsQuery) {
    const where = { status: q.status };
    const [items, total] = await Promise.all([
      this.prisma.instructorApplication.findMany({
        where,
        orderBy: q.status === 'pending' ? { submittedAt: 'asc' } : { reviewedAt: 'desc' },
        skip: (q.page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          status: true,
          headline: true,
          submittedAt: true,
          reviewedAt: true,
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      }),
      this.prisma.instructorApplication.count({ where }),
    ]);
    return { items, total, page: q.page, pageSize: PAGE_SIZE };
  }

  // Đơn nháp coi như không tồn tại với admin. Số TK chỉ trả dạng đã che.
  async detail(id: string) {
    const row = isGuid(id)
      ? await this.prisma.instructorApplication.findFirst({ where: { id, status: { not: 'draft' } }, select: DETAIL_SELECT })
      : null;
    if (!row) throw new NotFoundException();
    const courseCount = await this.prisma.course.count({ where: { instructorId: row.user.id } });
    const { bankAccountNo, ...rest } = row;
    return { ...rest, bankAccountNoMasked: maskAccountNo(bankAccountNo), courseCount };
  }

  async approve(id: string, reviewerId: string) {
    if (!isGuid(id)) throw new NotFoundException();
    let done: { email: string; notification: Notification };
    try {
      done = await this.prisma.$transaction(async (tx) => {
        // WHERE status = pending: hai admin bấm cùng lúc thì người sau count = 0.
        const res = await tx.instructorApplication.updateMany({
          where: { id, status: 'pending' },
          data: { status: 'approved', reviewedById: reviewerId, reviewedAt: new Date() },
        });
        // Đọc sau khi chuyển approved: dòng đang bị transaction khoá nên giảng viên không sửa chen vào được;
        // đọc trước thì có thể lấy phải dữ liệu cũ. Phải đọc trước khi xoá bank vì profile cần số TK đầy đủ.
        const app = await tx.instructorApplication.findUnique({
          where: { id },
          select: {
            userId: true,
            headline: true,
            bio: true,
            website: true,
            socials: true,
            bankBin: true,
            bankAccountNo: true,
            bankAccountName: true,
            user: { select: { email: true } },
          },
        });
        if (!app) throw new NotFoundException();
        if (res.count === 0) throw notPending();
        // Nội dung đơn vừa duyệt thành hồ sơ công khai (user_profiles là nguồn duy nhất); sau này giảng viên tự sửa ở Cài đặt.
        const identity = {
          headline: app.headline,
          bio: app.bio,
          website: app.website,
          socials: app.socials as Prisma.InputJsonValue,
        };
        await tx.userProfile.upsert({
          where: { userId: app.userId },
          create: { userId: app.userId, ...identity },
          update: identity,
        });
        await tx.instructorProfile.create({
          data: {
            userId: app.userId,
            bankBin: app.bankBin,
            bankAccountNo: app.bankAccountNo,
            bankAccountName: app.bankAccountName,
          },
        });
        // Từ đây số TK chỉ còn ở instructor_profiles.
        await tx.instructorApplication.update({
          where: { id },
          data: { bankBin: null, bankAccountNo: null, bankAccountName: null },
        });
        const notification = await tx.notification.create({
          data: {
            userId: app.userId,
            type: 'instructor_application',
            title: 'Bạn đã là giảng viên cao cấp',
            body: 'Đơn đăng ký đã được duyệt. Giờ bạn có thể đặt giá cho khoá học.',
            link: '/instructor/verification',
            data: { applicationId: id, approved: true },
          },
        });
        return { email: app.user.email, notification };
      }, TX_OPTIONS);
    } catch (e) {
      // Profile đã có (giảng viên lên cao cấp bằng đường khác) → transaction rollback.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw alreadyPremium('Người dùng đã là giảng viên cao cấp');
      throw e;
    }
    this.notifications.push(done.notification); // sau commit
    // Không await: MailService không throw, lỗi chỉ ghi log.
    void this.mail.sendInstructorApplicationReviewed(done.email, true, null);
    return this.detail(id);
  }

  async reject(id: string, reviewerId: string, reason: string) {
    if (!isGuid(id)) throw new NotFoundException();
    // Trong transaction để thông báo đi cùng việc chuyển trạng thái.
    const { email, notification } = await this.prisma.$transaction(async (tx) => {
      const res = await tx.instructorApplication.updateMany({
        where: { id, status: 'pending' },
        data: { status: 'rejected', rejectReason: reason, reviewedById: reviewerId, reviewedAt: new Date() },
      });
      const row = await tx.instructorApplication.findUnique({
        where: { id },
        select: { userId: true, user: { select: { email: true } } },
      });
      if (!row) throw new NotFoundException();
      if (res.count === 0) throw notPending();
      const notification = await tx.notification.create({
        data: {
          userId: row.userId,
          type: 'instructor_application',
          title: 'Đơn giảng viên cao cấp chưa được duyệt',
          body: `Lý do: ${reason}`,
          link: '/instructor/verification',
          data: { applicationId: id, approved: false },
        },
      });
      return { email: row.user.email, notification };
    }, TX_OPTIONS);
    this.notifications.push(notification); // sau commit
    void this.mail.sendInstructorApplicationReviewed(email, false, reason);
    return this.detail(id);
  }

  // Có profile → 409; chưa có đơn → tạo nháp; đơn pending / approved → 409.
  // Gọi trước mọi lệnh ghi user.name / user.image (2 lệnh đó nằm ngoài transaction).
  // Chỉ best-effort: internalAdapter.updateUser chạy ngoài transaction nên submit từ tab khác vẫn có thể chen vào giữa.
  private async assertEditable(userId: string) {
    const profile = await this.prisma.instructorProfile.findUnique({ where: { userId }, select: { userId: true } });
    if (profile) throw alreadyPremium();
    let app = await this.prisma.instructorApplication.findUnique({ where: { userId }, select: { status: true } });
    if (!app) {
      try {
        app = await this.prisma.instructorApplication.create({ data: { userId }, select: { status: true } });
      } catch (e) {
        // 2 PUT đầu tiên chạy song song: request sau đụng unique userId → đọc lại.
        if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
        app = await this.prisma.instructorApplication.findUniqueOrThrow({ where: { userId }, select: { status: true } });
      }
    }
    if (!(EDITABLE as readonly string[]).includes(app.status)) throw locked();
  }

  // Sửa đơn bị từ chối → về nháp (giữ rejectReason cho FE hiện tới lúc nộp lại).
  // WHERE theo trạng thái: submit chạy song song đã chuyển pending thì count 0.
  private async write(userId: string, data: Prisma.InstructorApplicationUpdateManyMutationInput) {
    const res = await this.prisma.instructorApplication.updateMany({
      where: { userId, status: { in: [...EDITABLE] } },
      data: { ...data, status: 'draft' },
    });
    if (res.count === 0) throw locked();
  }

  // Qua internalAdapter để cache {session, user} trong Redis được làm mới (như become-instructor).
  private async updateUser(userId: string, data: { name?: string; image?: string }) {
    const ctx = await this.auth.$context;
    await ctx.internalAdapter.updateUser(userId, data);
  }

  private async checkAvatar(key: string, ext: string): Promise<string | null> {
    const head = await this.storage.head('public', key);
    if (!head) return 'Chưa tải ảnh lên';
    if (head.size > THUMBNAIL_MAX_BYTES) return 'Ảnh tối đa 5 MB';
    return imageProblem(await this.storage.read('public', key), ext, AVATAR_MIN);
  }
}
