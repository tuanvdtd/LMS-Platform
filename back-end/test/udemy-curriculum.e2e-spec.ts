import '../src/env.js';
import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
afterAll(() => prisma.$disconnect());

// Mỗi test chạy trong transaction rồi rollback, không để lại rác trong DB dev.
// Postgres huỷ cả transaction sau lệnh lỗi đầu tiên → mỗi test chỉ có MỘT lệnh bị từ chối, đặt cuối.
class Rollback extends Error {}
async function inRollback(fn: (tx: Prisma.TransactionClient) => Promise<void>) {
  await prisma
    .$transaction(
      async (tx) => {
        await fn(tx);
        throw new Rollback();
      },
      { timeout: 20_000 },
    )
    .catch((e: unknown) => {
      if (!(e instanceof Rollback)) throw e;
    });
}

const uid = () => randomUUID().slice(0, 8);
const DAY = 86_400_000;

async function makeCourse(tx: Prisma.TransactionClient) {
  const user = await tx.user.create({
    data: { id: randomUUID(), name: 't', email: `cur-${uid()}@example.com` },
  });
  const root = await tx.category.create({ data: { slug: `r-${uid()}`, name: 'r' } });
  const leaf = await tx.category.create({
    data: { slug: `l-${uid()}`, name: 'l', parentId: root.id },
  });
  const course = await tx.course.create({
    data: {
      instructorId: user.id,
      slug: `c-${uid()}`,
      title: 't',
      categoryId: leaf.id,
      level: 'beginner',
    },
  });
  const section = await tx.section.create({
    data: { courseId: course.id, title: 's1', position: 1 },
  });
  return { user, course, section };
}

function makeAsset(
  tx: Prisma.TransactionClient,
  ownerId: string,
  kind: 'video' | 'document',
  mimeType = kind === 'video' ? 'video/mp4' : 'application/pdf',
) {
  return tx.asset.create({
    data: {
      ownerId,
      kind,
      fileName: 'f',
      mimeType,
      sizeBytes: 1000n,
      storageKey: `k-${uid()}`,
      status: 'ready',
    },
  });
}

function couponData(
  courseId: string,
  createdById: string,
  over: Partial<Prisma.CouponUncheckedCreateInput> = {},
): Prisma.CouponUncheckedCreateInput {
  return {
    courseId,
    createdById,
    code: `CODE${uid().toUpperCase()}`,
    type: 'fixed_price',
    priceAmount: 199_000,
    startsAt: new Date(Date.now() - DAY),
    endsAt: new Date(Date.now() + DAY),
    ...over,
  };
}

describe('curriculum_items — chk_item_payload', () => {
  it('đối chứng: lecture chưa có nội dung, lecture video, lecture PDF, quiz đều hợp lệ', () =>
    inRollback(async (tx) => {
      const { user, course, section } = await makeCourse(tx);
      const video = await makeAsset(tx, user.id, 'video');
      const pdf = await makeAsset(tx, user.id, 'document');
      const base = { sectionId: section.id, courseId: course.id, title: 'x' };
      await tx.curriculumItem.create({ data: { ...base, type: 'lecture', position: 1 } });
      await tx.curriculumItem.create({
        data: { ...base, type: 'lecture', position: 2, lectureKind: 'video', videoAssetId: video.id, isPublished: true },
      });
      await tx.curriculumItem.create({
        data: { ...base, type: 'lecture', position: 3, lectureKind: 'document', documentAssetId: pdf.id },
      });
      await tx.curriculumItem.create({ data: { ...base, type: 'quiz', position: 4 } });
    }));

  it('lecture chưa có nội dung thì không được xuất bản', () =>
    inRollback(async (tx) => {
      const { course, section } = await makeCourse(tx);
      await expect(
        tx.curriculumItem.create({
          data: { sectionId: section.id, courseId: course.id, title: 'x', type: 'lecture', position: 1, isPublished: true },
        }),
      ).rejects.toThrow(/chk_item_payload/);
    }));

  it('lecture video phải có videoAssetId', () =>
    inRollback(async (tx) => {
      const { course, section } = await makeCourse(tx);
      await expect(
        tx.curriculumItem.create({
          data: { sectionId: section.id, courseId: course.id, title: 'x', type: 'lecture', position: 1, lectureKind: 'video' },
        }),
      ).rejects.toThrow(/chk_item_payload/);
    }));

  it('lecture không có lectureKind thì không được gắn asset', () =>
    inRollback(async (tx) => {
      const { user, course, section } = await makeCourse(tx);
      const video = await makeAsset(tx, user.id, 'video');
      await expect(
        tx.curriculumItem.create({
          data: { sectionId: section.id, courseId: course.id, title: 'x', type: 'lecture', position: 1, videoAssetId: video.id },
        }),
      ).rejects.toThrow(/chk_item_payload/);
    }));

  it('item không phải lecture thì không có lectureKind', () =>
    inRollback(async (tx) => {
      const { course, section } = await makeCourse(tx);
      await expect(
        tx.curriculumItem.create({
          data: { sectionId: section.id, courseId: course.id, title: 'x', type: 'quiz', position: 1, lectureKind: 'video' },
        }),
      ).rejects.toThrow(/chk_item_payload/);
    }));
});

describe('kéo thả — unique DEFERRABLE', () => {
  it('đổi chỗ hai section trong một transaction', () =>
    inRollback(async (tx) => {
      const { course, section: s1 } = await makeCourse(tx);
      const s2 = await tx.section.create({ data: { courseId: course.id, title: 's2', position: 2 } });
      await tx.section.update({ where: { id: s1.id }, data: { position: 2 } }); // tạm trùng với s2
      await tx.section.update({ where: { id: s2.id }, data: { position: 1 } });
      await tx.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`; // ép kiểm ngay vì test sẽ rollback
    }));

  it('hai section trùng position vẫn bị chặn khi kiểm', () =>
    inRollback(async (tx) => {
      const { course } = await makeCourse(tx);
      await tx.section.create({ data: { courseId: course.id, title: 's2', position: 1 } });
      await expect(tx.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`).rejects.toThrow(/uq_sections_position|23505.*Key \("courseId", "position"\)/); // $executeRaw không in tên constraint
    }));

  it('đổi chỗ hai item trong một section', () =>
    inRollback(async (tx) => {
      const { course, section } = await makeCourse(tx);
      const base = { sectionId: section.id, courseId: course.id, title: 'x', type: 'quiz' as const };
      const a = await tx.curriculumItem.create({ data: { ...base, position: 1 } });
      const b = await tx.curriculumItem.create({ data: { ...base, position: 2 } });
      await tx.curriculumItem.update({ where: { id: a.id }, data: { position: 2 } });
      await tx.curriculumItem.update({ where: { id: b.id }, data: { position: 1 } });
      await tx.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`;
    }));
});

describe('assets', () => {
  it('asset document chỉ nhận PDF', () =>
    inRollback(async (tx) => {
      const { user } = await makeCourse(tx);
      await expect(makeAsset(tx, user.id, 'document', 'application/msword')).rejects.toThrow(/chk_asset_pdf/);
    }));

  it('không xoá được asset đang được bài giảng dùng', () =>
    inRollback(async (tx) => {
      const { user, course, section } = await makeCourse(tx);
      const video = await makeAsset(tx, user.id, 'video');
      await tx.curriculumItem.create({
        data: {
          sectionId: section.id, courseId: course.id, title: 'x', type: 'lecture',
          position: 1, lectureKind: 'video', videoAssetId: video.id,
        },
      });
      await expect(tx.asset.delete({ where: { id: video.id } })).rejects.toThrow(/foreign key|P2003/i);
    }));
});

describe('exercises, courses, notes, order_items', () => {
  it('bài tập coding phải có ít nhất 1 ngôn ngữ', () =>
    inRollback(async (tx) => {
      const { course, section } = await makeCourse(tx);
      const item = await tx.curriculumItem.create({
        data: { sectionId: section.id, courseId: course.id, title: 'x', type: 'coding_exercise', position: 1 },
      });
      await expect(
        tx.exercise.create({
          data: { itemId: item.id, courseId: course.id, instructionsHtml: 'x', allowedLanguageIds: [] },
        }),
      ).rejects.toThrow(/chk_exercise_languages/);
    }));

  it('bài tập coding không được để allowedLanguageIds NULL', () =>
    inRollback(async (tx) => {
      const { course, section } = await makeCourse(tx);
      const item = await tx.curriculumItem.create({
        data: { sectionId: section.id, courseId: course.id, title: 'x', type: 'coding_exercise', position: 1 },
      });
      await expect(
        tx.$executeRaw`INSERT INTO exercises (id, "itemId", "courseId", "instructionsHtml", "allowedLanguageIds", "updatedAt")
          VALUES (gen_random_uuid(), ${item.id}::uuid, ${course.id}::uuid, 'x', NULL, now())`,
      ).rejects.toThrow(/chk_exercise_languages|23514/);
    }));

  it('đối chứng: exercise 1 ngôn ngữ, giá 0, ghi chú mốc 0, order_item giá gốc = giá bán đều hợp lệ', () =>
    inRollback(async (tx) => {
      const { user, course, section } = await makeCourse(tx);
      const base = { sectionId: section.id, courseId: course.id, title: 'x' };
      const ex = await tx.curriculumItem.create({ data: { ...base, type: 'coding_exercise', position: 1 } });
      await tx.exercise.create({
        data: { itemId: ex.id, courseId: course.id, instructionsHtml: 'x', allowedLanguageIds: [71] },
      });
      await tx.course.update({ where: { id: course.id }, data: { priceAmount: 0 } });
      const lec = await tx.curriculumItem.create({ data: { ...base, type: 'lecture', position: 2 } });
      const e = await tx.enrollment.create({ data: { userId: user.id, courseId: course.id } });
      await tx.note.create({ data: { enrollmentId: e.id, itemId: lec.id, positionSec: 0, body: 'x' } });
      const order = await tx.order.create({ data: { userId: user.id, subtotalAmount: 100, totalAmount: 100 } });
      await tx.orderItem.create({
        data: {
          orderId: order.id, courseId: course.id, instructorId: user.id,
          listPriceAmount: 100, unitPriceAmount: 100, platformFeeAmount: 30, instructorEarnAmount: 70,
        },
      });
    }));

  it('giá khoá không âm', () =>
    inRollback(async (tx) => {
      const { course } = await makeCourse(tx);
      await expect(
        tx.course.update({ where: { id: course.id }, data: { priceAmount: -1 } }),
      ).rejects.toThrow(/chk_course_price/);
    }));

  it('mốc ghi chú không âm', () =>
    inRollback(async (tx) => {
      const { user, course, section } = await makeCourse(tx);
      const item = await tx.curriculumItem.create({
        data: { sectionId: section.id, courseId: course.id, title: 'x', type: 'lecture', position: 1 },
      });
      const e = await tx.enrollment.create({ data: { userId: user.id, courseId: course.id } });
      await expect(
        tx.note.create({ data: { enrollmentId: e.id, itemId: item.id, positionSec: -1, body: 'x' } }),
      ).rejects.toThrow(/chk_note_position/);
    }));

  it('giá gốc order_item không nhỏ hơn giá bán', () =>
    inRollback(async (tx) => {
      const { user, course } = await makeCourse(tx);
      const order = await tx.order.create({
        data: { userId: user.id, subtotalAmount: 100, totalAmount: 100 },
      });
      await expect(
        tx.orderItem.create({
          data: {
            orderId: order.id, courseId: course.id, instructorId: user.id,
            listPriceAmount: 50, unitPriceAmount: 100, platformFeeAmount: 30, instructorEarnAmount: 70,
          },
        }),
      ).rejects.toThrow(/chk_order_item_list_price/);
    }));
});

describe('coupons', () => {
  it('đối chứng: coupon fixed_price và free hợp lệ', () =>
    inRollback(async (tx) => {
      const { user, course } = await makeCourse(tx);
      await tx.coupon.create({ data: couponData(course.id, user.id) });
      await tx.coupon.create({
        data: couponData(course.id, user.id, { type: 'free', priceAmount: null, maxRedemptions: 100 }),
      });
    }));

  it('mã coupon chữ thường bị từ chối', () =>
    inRollback(async (tx) => {
      const { user, course } = await makeCourse(tx);
      await expect(
        tx.coupon.create({ data: couponData(course.id, user.id, { code: 'abcdef' }) }),
      ).rejects.toThrow(/chk_coupon_code/);
    }));

  it('fixed_price phải có giá', () =>
    inRollback(async (tx) => {
      const { user, course } = await makeCourse(tx);
      await expect(
        tx.coupon.create({ data: couponData(course.id, user.id, { priceAmount: null }) }),
      ).rejects.toThrow(/chk_coupon_price/);
    }));

  it('free không được có giá', () =>
    inRollback(async (tx) => {
      const { user, course } = await makeCourse(tx);
      await expect(
        tx.coupon.create({ data: couponData(course.id, user.id, { type: 'free', maxRedemptions: 10 }) }),
      ).rejects.toThrow(/chk_coupon_price/);
    }));

  it('free bắt buộc có maxRedemptions', () =>
    inRollback(async (tx) => {
      const { user, course } = await makeCourse(tx);
      await expect(
        tx.coupon.create({ data: couponData(course.id, user.id, { type: 'free', priceAmount: null }) }),
      ).rejects.toThrow(/chk_coupon_redemptions/);
    }));

  it('endsAt phải sau startsAt', () =>
    inRollback(async (tx) => {
      const { user, course } = await makeCourse(tx);
      const t = new Date();
      await expect(
        tx.coupon.create({ data: couponData(course.id, user.id, { startsAt: t, endsAt: t }) }),
      ).rejects.toThrow(/chk_coupon_window/);
    }));

  it('trừ lượt atomic: maxRedemptions = 1 thì lần 2 không trả dòng', () =>
    inRollback(async (tx) => {
      const { user, course } = await makeCourse(tx);
      const c = await tx.coupon.create({ data: couponData(course.id, user.id, { maxRedemptions: 1 }) });
      const redeem = () => tx.$queryRaw<{ id: string }[]>`
        UPDATE coupons SET "redeemedCount" = "redeemedCount" + 1
        WHERE id = ${c.id}::uuid AND "disabledAt" IS NULL
          AND now() BETWEEN "startsAt" AND "endsAt"
          AND ("maxRedemptions" IS NULL OR "redeemedCount" < "maxRedemptions")
        RETURNING id`;
      expect(await redeem()).toHaveLength(1);
      expect(await redeem()).toHaveLength(0);
    }));
});
