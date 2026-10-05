import { Injectable, NotFoundException } from '@nestjs/common';
import type { AssetKind, Prisma } from '@prisma/client';
import { isGuid, validationError } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import {
  type CourseRow,
  InstructorCoursesService,
  TX_OPTIONS,
} from '../instructor-courses/instructor-courses.service.js';
import type {
  AddResourceInput,
  CreateItemInput,
  CreateSectionInput,
  UpdateItemInput,
  UpdateSectionInput,
} from './curriculum.schemas.js';
import { reorder } from './reorder.js';

type Tx = Prisma.TransactionClient;
export const MAX_RESOURCES = 10;
// moveItem sang phần khác ~7 query trong transaction; DB dev ~1-2s/query → 15s của TX_OPTIONS không đủ.
const MUTATE_TX = { ...TX_OPTIONS, timeout: 30_000 };

const ASSET_REF = { select: { id: true, fileName: true, sizeBytes: true } } as const;
const ITEM_SELECT = {
  id: true,
  type: true,
  title: true,
  position: true,
  isPublished: true,
  lectureKind: true,
  description: true,
  isPreview: true,
  isDownloadable: true,
  durationSec: true,
  documentAsset: ASSET_REF,
  videoAsset: { select: { ...ASSET_REF.select, durationSec: true } },
  resources: { orderBy: { position: 'asc' }, select: { id: true, title: true, asset: ASSET_REF } },
} satisfies Prisma.CurriculumItemSelect;
const LECTURE_ONLY = ['description', 'isPreview', 'isDownloadable'] as const;
// chk_item_payload: lecture chưa có nội dung thì 3 cột nội dung NULL và không xuất bản.
const NO_CONTENT = {
  lectureKind: null,
  videoAssetId: null,
  documentAssetId: null,
  durationSec: 0,
  isPublished: false,
} as const;

const toRef = (a: { id: string; fileName: string; sizeBytes: bigint }) => ({
  id: a.id,
  fileName: a.fileName,
  sizeBytes: Number(a.sizeBytes),
});

// Khung chương trình (spec curriculum-upload §4.2): mỗi thao tác ghi ngay (K5), trả cây + checklist (K12).
@Injectable()
export class CurriculumService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courses: InstructorCoursesService,
  ) {}

  async get(courseId: string, userId: string) {
    return this.tree(await this.courses.assertOwned(courseId, userId));
  }

  addSection(courseId: string, userId: string, body: CreateSectionInput) {
    return this.mutate(courseId, userId, async (tx) => {
      const { _max } = await tx.section.aggregate({ where: { courseId }, _max: { position: true } });
      await tx.section.create({ data: { courseId, ...body, position: (_max.position ?? -1) + 1 } });
    });
  }

  updateSection(courseId: string, userId: string, sectionId: string, body: UpdateSectionInput) {
    return this.mutate(courseId, userId, async (tx) => {
      await this.section(tx, courseId, sectionId);
      await tx.section.update({ where: { id: sectionId }, data: body });
    });
  }

  deleteSection(courseId: string, userId: string, sectionId: string) {
    return this.mutate(courseId, userId, async (tx) => {
      await this.section(tx, courseId, sectionId);
      await tx.section.delete({ where: { id: sectionId } });
    });
  }

  moveSection(courseId: string, userId: string, sectionId: string, index: number) {
    return this.mutate(courseId, userId, async (tx) => {
      await this.section(tx, courseId, sectionId);
      const rows = await tx.section.findMany({ where: { courseId }, orderBy: { position: 'asc' }, select: { id: true } });
      const ids = reorder(rows.map((r) => r.id), sectionId, index);
      // Một câu cho cả danh sách (DB dev ~1-2s/query); unique DEFERRABLE nên trùng tạm không lỗi.
      await tx.$executeRaw`
        UPDATE sections s SET position = (v.ord - 1)::int
        FROM unnest(${ids}::uuid[]) WITH ORDINALITY AS v(id, ord)
        WHERE s.id = v.id`;
    });
  }

  addItem(courseId: string, userId: string, sectionId: string, body: CreateItemInput) {
    return this.mutate(courseId, userId, async (tx) => {
      await this.section(tx, courseId, sectionId);
      const { _max } = await tx.curriculumItem.aggregate({ where: { sectionId }, _max: { position: true } });
      await tx.curriculumItem.create({
        data: { sectionId, courseId, ...body, position: (_max.position ?? -1) + 1 },
      });
    });
  }

  updateItem(courseId: string, userId: string, itemId: string, body: UpdateItemInput) {
    return this.mutate(courseId, userId, async (tx) => {
      const item = await this.item(tx, courseId, itemId);
      if (item.type !== 'lecture') {
        const bad = LECTURE_ONLY.filter((k) => body[k] !== undefined);
        if (bad.length) {
          throw validationError(bad.map((k) => ({ path: [k], message: 'Chỉ áp dụng cho bài giảng' })));
        }
      }
      await tx.curriculumItem.update({ where: { id: itemId }, data: body });
    });
  }

  deleteItem(courseId: string, userId: string, itemId: string) {
    return this.mutate(courseId, userId, async (tx) => {
      await this.item(tx, courseId, itemId);
      await tx.curriculumItem.delete({ where: { id: itemId } });
    });
  }

  moveItem(courseId: string, userId: string, itemId: string, sectionId: string, index: number) {
    return this.mutate(courseId, userId, async (tx) => {
      const item = await this.item(tx, courseId, itemId);
      await this.section(tx, courseId, sectionId);
      const target = await tx.curriculumItem.findMany({
        where: { sectionId },
        orderBy: { position: 'asc' },
        select: { id: true },
      });
      await this.renumberItems(tx, sectionId, reorder(target.map((r) => r.id), itemId, index));
      if (item.sectionId !== sectionId) {
        // Mục đã sang phần mới → đánh số lại phần nguồn cho liền mạch.
        const source = await tx.curriculumItem.findMany({
          where: { sectionId: item.sectionId },
          orderBy: { position: 'asc' },
          select: { id: true },
        });
        await this.renumberItems(tx, item.sectionId, source.map((r) => r.id));
      }
    });
  }

  setContent(courseId: string, userId: string, itemId: string, assetId: string) {
    return this.mutate(courseId, userId, async (tx) => {
      await this.lecture(tx, courseId, itemId);
      const asset = await this.usableAsset(tx, userId, assetId, ['document', 'video']);
      // Video: thời lượng BE đã đo lúc complete, chép vào bài để checklist cộng (spec video-upload §4.5).
      const content =
        asset.kind === 'video'
          ? { lectureKind: 'video' as const, videoAssetId: assetId, durationSec: asset.durationSec ?? 0, isDownloadable: false }
          : { lectureKind: 'document' as const, documentAssetId: assetId };
      // Một câu update: luôn thoả chk_item_payload; bài giảng có nội dung tự xuất bản (K9).
      await tx.curriculumItem.update({
        where: { id: itemId },
        data: { ...NO_CONTENT, ...content, isPublished: true },
      });
    });
  }

  removeContent(courseId: string, userId: string, itemId: string) {
    return this.mutate(courseId, userId, async (tx) => {
      await this.lecture(tx, courseId, itemId);
      await tx.curriculumItem.update({ where: { id: itemId }, data: NO_CONTENT });
    });
  }

  addResource(courseId: string, userId: string, itemId: string, body: AddResourceInput) {
    return this.mutate(courseId, userId, async (tx) => {
      await this.lecture(tx, courseId, itemId);
      const asset = await this.usableAsset(tx, userId, body.assetId, ['document']);
      const agg = await tx.lectureResource.aggregate({
        where: { itemId },
        _count: { _all: true },
        _max: { position: true },
      });
      if (agg._count._all >= MAX_RESOURCES) {
        throw validationError([{ path: ['assetId'], message: `Tối đa ${MAX_RESOURCES} tài nguyên mỗi bài giảng` }]);
      }
      await tx.lectureResource.create({
        data: {
          itemId,
          assetId: body.assetId,
          title: body.title ?? asset.fileName.slice(0, 80),
          position: (agg._max.position ?? -1) + 1,
        },
      });
    });
  }

  removeResource(courseId: string, userId: string, resourceId: string) {
    return this.mutate(courseId, userId, async (tx) => {
      const found = isGuid(resourceId)
        ? await tx.lectureResource.findFirst({ where: { id: resourceId, item: { courseId } }, select: { id: true } })
        : null;
      if (!found) throw new NotFoundException();
      await tx.lectureResource.delete({ where: { id: resourceId } });
    });
  }

  // Mọi mutation: chủ khoá + không in_review, rồi transaction khoá dòng courses (một khoá cho cả khoá học,
  // không deadlock) để max+1 / đánh số lại không đụng nhau giữa 2 tab.
  private async mutate(courseId: string, userId: string, fn: (tx: Tx) => Promise<void>) {
    const course = await this.courses.assertEditable(courseId, userId);
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM courses WHERE id = ${courseId}::uuid FOR UPDATE`;
      await fn(tx);
    }, MUTATE_TX);
    return this.tree(course);
  }

  // Cây + checklist. Checklist không query thêm: dòng khoá đã có, số bài giảng/giây video đếm từ cây.
  private async tree(course: CourseRow) {
    const sections = await this.prisma.section.findMany({
      where: { courseId: course.id },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        position: true,
        items: { orderBy: { position: 'asc' }, select: ITEM_SELECT },
      },
    });
    let published = 0;
    let videoSeconds = 0;
    const out = sections.map((s) => ({
      ...s,
      items: s.items.map(({ documentAsset, videoAsset, resources, ...item }) => {
        if (item.type === 'lecture' && item.isPublished) {
          published++;
          if (item.lectureKind === 'video') videoSeconds += item.durationSec;
        }
        return {
          ...item,
          document: documentAsset && toRef(documentAsset),
          video: videoAsset && { ...toRef(videoAsset), durationSec: videoAsset.durationSec },
          resources: resources.map((r) => ({ id: r.id, title: r.title, asset: toRef(r.asset) })),
        };
      }),
    }));
    return { sections: out, checklist: this.courses.checklistFor(course, { published, videoSeconds }) };
  }

  private renumberItems(tx: Tx, sectionId: string, ids: string[]) {
    return tx.$executeRaw`
      UPDATE curriculum_items i SET "sectionId" = ${sectionId}::uuid, position = (v.ord - 1)::int
      FROM unnest(${ids}::uuid[]) WITH ORDINALITY AS v(id, ord)
      WHERE i.id = v.id`;
  }

  private async section(tx: Tx, courseId: string, id: string) {
    const found = isGuid(id) ? await tx.section.findFirst({ where: { id, courseId }, select: { id: true } }) : null;
    if (!found) throw new NotFoundException();
    return found;
  }

  private async item(tx: Tx, courseId: string, id: string) {
    const found = isGuid(id)
      ? await tx.curriculumItem.findFirst({ where: { id, courseId }, select: { type: true, sectionId: true } })
      : null;
    if (!found) throw new NotFoundException();
    return found;
  }

  private async lecture(tx: Tx, courseId: string, id: string) {
    const item = await this.item(tx, courseId, id);
    if (item.type !== 'lecture') {
      throw validationError([{ path: [], message: 'Chỉ bài giảng mới có nội dung và tài nguyên' }]);
    }
    return item;
  }

  // Asset của mình, đã ready, đúng loại. Tài nguyên đính kèm chỉ nhận document (spec video-upload §4.5).
  private async usableAsset(tx: Tx, userId: string, assetId: string, kinds: AssetKind[]) {
    const asset = await tx.asset.findFirst({
      where: { id: assetId, ownerId: userId, kind: { in: kinds }, status: 'ready' },
      select: { kind: true, fileName: true, durationSec: true },
    });
    if (!asset) throw validationError([{ path: ['assetId'], message: 'File không dùng được' }]);
    return asset;
  }
}
