import prismaPkg from '@prisma/client';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import { excerptOf, readingMinutes } from '../../src/posts/post-text.ts';
import { slugify } from '../../src/instructor-courses/slugify.ts';
import { showcaseOwnerId } from './clean.ts';
import { SHOWCASE } from './data/analytics-demo.ts';
import { POSTS } from './data/posts.ts';
import { DAY, HOUR, between, int, mulberry32, shuffle } from './rng.ts';
import { r2, renderPostCover } from './thumbnails.ts';

// pnpm seed:blog — bài blog mẫu của tài khoản SEED_SHOWCASE_OWNER, kèm lượt thích / bình luận của học viên seed.
// Chạy sau seed:demo; chạy lại seed:demo thì chạy lại lệnh này (học viên seed bị xoá kéo theo lượt thích, số đếm sẽ lệch).
// Chạy lại được: bài cũ cùng slug của tác giả bị thay, ảnh bìa cũ đánh dấu mồ côi để job dọn xoá file sau 24 giờ.
// Bài nháp (draft) thay theo tiêu đề. `--cover-dir <thư mục>`: xuất ảnh bìa của bài nháp ra file để tự tải lên lúc demo.
const { PrismaClient } = prismaPkg;
const argAt = process.argv.indexOf('--cover-dir');
const COVER_DIR = argAt > 0 ? process.argv[argAt + 1] : null;

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Không chạy seed demo trên production');
  const prisma = new PrismaClient();
  try {
    const authorId = await showcaseOwnerId(prisma);
    if (!authorId) throw new Error('Thiếu SEED_SHOWCASE_OWNER trong .env (email tài khoản đứng tên bài)');
    const readers = await prisma.user.findMany({ where: { email: { endsWith: '@skillpath.test' } }, select: { id: true }, orderBy: { email: 'asc' } });
    if (readers.length < 60) throw new Error('Chưa có học viên seed để thích / bình luận — chạy pnpm seed:demo trước');
    const topicId = new Map((await prisma.topic.findMany({ select: { id: true, slug: true } })).map((t) => [t.slug, t.id]));
    const missing = POSTS.flatMap((p) => p.topics).filter((s) => !topicId.has(s));
    if (missing.length) throw new Error(`Topic không có trong DB: ${missing.join(', ')}`);
    const showcase = await prisma.course.findFirst({
      where: { instructorId: authorId, title: SHOWCASE.courseTitle, status: 'published' }, select: { id: true },
    });

    const old = await prisma.post.findMany({
      where: {
        authorId,
        OR: [
          { slug: { in: POSTS.filter((p) => !p.draft).map((p) => slugify(p.title)) } },
          { status: 'draft', title: { in: POSTS.filter((p) => p.draft).map((p) => p.title) } },
        ],
      },
      select: { id: true, imageUses: { select: { key: true } } },
    });
    if (old.length) {
      await prisma.post.deleteMany({ where: { id: { in: old.map((p) => p.id) } } });
      await prisma.postImage.updateMany({
        where: { key: { in: old.flatMap((p) => p.imageUses.map((u) => u.key)) }, orphanedAt: null, uses: { none: {} } },
        data: { orphanedAt: new Date() },
      });
      console.log(`Đã thay ${old.length} bài cũ`);
    }

    const storage = r2();
    const rng = mulberry32(20261124);
    const now = new Date();
    const today20h = Math.floor(now.getTime() / DAY) * DAY + 13 * HOUR; // 20:00 giờ VN
    for (const p of POSTS) {
      if (p.draft) {
        // Nháp gần xong: đủ mọi mục trừ ảnh bìa. Sửa lần cuối 2 giờ trước.
        await prisma.post.create({
          data: {
            authorId, title: p.title, excerpt: p.excerpt, autoExcerpt: excerptOf(p.body), bodyHtml: p.body,
            readingMinutes: readingMinutes(p.body), status: 'draft', relatedCourseId: p.relatedShowcase ? (showcase?.id ?? null) : null,
            createdAt: new Date(now.getTime() - DAY), updatedAt: new Date(now.getTime() - 2 * HOUR),
            topics: { create: p.topics.map((s) => ({ topicId: topicId.get(s)! })) },
          },
        });
        if (COVER_DIR) {
          mkdirSync(COVER_DIR, { recursive: true });
          const file = join(COVER_DIR, `${slugify(p.title)}.png`);
          writeFileSync(file, renderPostCover(p.cover));
          console.log(`  ảnh bìa để tải lên: ${file}`);
        }
        console.log(`✓ Nháp: ${p.title} — thiếu ảnh bìa`);
        continue;
      }
      const postId = uuidv7();
      const key = `posts/${authorId}/${uuidv7()}.png`;
      const coverUrl = await storage.upload(key, renderPostCover(p.cover));
      const publishedAt = new Date(Math.min(today20h - p.daysAgo * DAY, now.getTime() - HOUR));
      const [likers, commenters] = [shuffle(rng, readers).slice(0, p.likes), shuffle(rng, readers).slice(0, p.comments.length)];
      let t = publishedAt.getTime();
      const comments = p.comments.flatMap((c, i) => {
        t += int(rng, 2, 20) * HOUR;
        const root = { id: uuidv7(), postId, userId: commenters[i].id, body: c.body, createdAt: new Date(Math.min(t, now.getTime() - HOUR)) };
        if (!c.reply) return [{ ...root, parentId: null, replyCount: 0 }];
        const reply = { id: uuidv7(), postId, userId: authorId, body: c.reply, parentId: root.id, replyCount: 0, createdAt: new Date(Math.min(t + int(rng, 1, 6) * HOUR, now.getTime() - HOUR / 2)) };
        return [{ ...root, parentId: null, replyCount: 1 }, reply];
      });

      await prisma.$transaction(async (tx) => {
        await tx.post.create({
          data: {
            id: postId, authorId, slug: slugify(p.title), title: p.title, excerpt: p.excerpt, autoExcerpt: excerptOf(p.body),
            coverUrl, bodyHtml: p.body, readingMinutes: readingMinutes(p.body), status: 'published',
            relatedCourseId: p.relatedShowcase ? (showcase?.id ?? null) : null,
            publishedAt, createdAt: new Date(publishedAt.getTime() - 2 * HOUR), updatedAt: publishedAt,
            likeCount: likers.length, commentCount: comments.length,
            topics: { create: p.topics.map((s) => ({ topicId: topicId.get(s)! })) },
          },
        });
        await tx.postImage.create({ data: { key } });
        await tx.postImageUse.create({ data: { postId, key } });
        await tx.postLike.createMany({ data: likers.map((u) => ({ postId, userId: u.id, createdAt: between(rng, publishedAt, now) })) });
        // Gốc trước rồi mới tới trả lời (khoá ngoại parentId).
        await tx.postComment.createMany({ data: comments.filter((c) => !c.parentId) });
        await tx.postComment.createMany({ data: comments.filter((c) => c.parentId) });
      });
      console.log(`✓ ${p.title} — ${readingMinutes(p.body)} phút đọc, ${likers.length} thích, ${comments.length} bình luận`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
