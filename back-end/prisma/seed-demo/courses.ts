import { v7 as uuidv7 } from 'uuid';
import type { PrismaClient } from '@prisma/client';
import { slugify } from '../../src/instructor-courses/slugify.ts';
import type { CourseLevel, Lang, SeedCourse, SeedStatus } from './data/types.ts';
import type { SeededUser } from './users.ts';
import { DAY, HOUR, addMs, between, int, maxDate, slugSuffix, type Rng } from './rng.ts';

export type CourseDates = { createdAt: Date; submittedAt: Date | null; reviewedAt: Date | null; publishedAt: Date | null };

export function planCourseDates(
  rng: Rng, now: Date, teacher: { createdAt: Date; verifiedAt: Date | null }, status: SeedStatus, paid: boolean,
): CourseDates {
  const ago = (d: number) => new Date(now.getTime() - d * DAY);
  if (status === 'published') {
    const earliest = maxDate(addMs(teacher.createdAt, 20 * DAY), ago(300), ...(paid && teacher.verifiedAt ? [addMs(teacher.verifiedAt, DAY)] : []));
    const publishedAt = between(rng, earliest, ago(7));
    const submittedAt = addMs(publishedAt, -int(rng, 2, 4) * DAY);
    return {
      createdAt: maxDate(addMs(teacher.createdAt, DAY), addMs(submittedAt, -int(rng, 10, 40) * DAY)),
      submittedAt, reviewedAt: addMs(publishedAt, -HOUR), publishedAt,
    };
  }
  if (status === 'in_review') return { createdAt: ago(int(rng, 20, 60)), submittedAt: ago(int(rng, 1, 3)), reviewedAt: null, publishedAt: null };
  if (status === 'rejected') {
    const submittedAt = ago(int(rng, 10, 20));
    return { createdAt: ago(int(rng, 30, 90)), submittedAt, reviewedAt: addMs(submittedAt, int(rng, 1, 2) * DAY), publishedAt: null };
  }
  return { createdAt: ago(int(rng, 5, 45)), submittedAt: null, reviewedAt: null, publishedAt: null };
}

export type CourseCtx = {
  rng: Rng; now: Date; adminId: string;
  users: Map<string, SeededUser>;
  categoryBySlug: Map<string, { id: string; rootSlug: string }>;
  topicIdBySlug: Map<string, string>;
  videos: { id: string; durationSec: number }[];
  videoCursor: { i: number };
};

export type SeededCourse = {
  id: string; instructorId: string; status: SeedStatus; publishedAt: Date | null; priceAmount: number;
  level: CourseLevel; language: Lang; label: string; lectureTitles: string[]; topicIds: string[];
  // Item published theo thứ tự chương trình: học viên đi qua đúng thứ tự này.
  items: { id: string; durationSec: number }[];
};

export function courseSlug(rng: Rng, title: string) {
  return `${slugify(title)}-${slugSuffix(rng)}`;
}

export async function writeCourse(prisma: PrismaClient, c: SeedCourse, ctx: CourseCtx, thumbnailUrl: string, slug: string): Promise<SeededCourse> {
  const teacher = ctx.users.get(c.instructorEmail)!;
  const d = planCourseDates(ctx.rng, ctx.now, teacher, c.status, c.priceAmount > 0);
  const courseId = uuidv7();
  const topicIds = c.topics.map((t) => ctx.topicIdBySlug.get(t.slug)!);
  const lectureIds = c.sections.flatMap((s) => s.lectures.map(() => uuidv7()));
  const lastSection = c.sections.length - 1;
  const items: SeededCourse['items'] = [];

  await prisma.$transaction(async (tx) => {
    await tx.course.create({
      data: {
        id: courseId, instructorId: teacher.id, slug, title: c.title, subtitle: c.subtitle, description: c.description, thumbnailUrl,
        categoryId: ctx.categoryBySlug.get(c.categorySlug)!.id, level: c.level, language: c.language, priceAmount: c.priceAmount,
        status: c.status === 'rejected' ? 'draft' : c.status, publishedAt: d.publishedAt, copyrightConfirmedAt: d.submittedAt,
        learningObjectives: c.learningObjectives, requirements: c.requirements, targetAudience: c.targetAudience,
        createdAt: d.createdAt, updatedAt: d.publishedAt ?? d.submittedAt ?? d.createdAt,
      },
    });
    await tx.courseTopic.createMany({ data: c.topics.map((t, i) => ({ courseId, topicId: topicIds[i], isPrimary: !!t.primary })) });

    let lec = 0;
    for (const [si, s] of c.sections.entries()) {
      const sectionId = uuidv7();
      await tx.section.create({ data: { id: sectionId, courseId, title: s.title, position: si } });
      // Khoá draft: chương cuối chưa xuất bản (đang soạn dở).
      const isPublished = c.status !== 'draft' || si < lastSection;
      let pos = 0;
      for (const title of s.lectures) {
        const v = ctx.videos[ctx.videoCursor.i++ % ctx.videos.length];
        const id = lectureIds[lec];
        await tx.curriculumItem.create({ data: {
          id, sectionId, courseId, type: 'lecture', title, position: pos++, isPublished, lectureKind: 'video',
          videoAssetId: v.id, durationSec: v.durationSec, isPreview: lec === 0, createdAt: d.createdAt,
        } });
        if (isPublished) items.push({ id, durationSec: v.durationSec });
        lec++;
      }
      if (si !== lastSection) continue;

      const quizItemId = uuidv7();
      await tx.curriculumItem.create({ data: { id: quizItemId, sectionId, courseId, type: 'quiz', title: c.quiz.title, position: pos++, isPublished, createdAt: d.createdAt } });
      const quizId = uuidv7();
      await tx.quiz.create({ data: { id: quizId, itemId: quizItemId, courseId, description: c.quiz.description, passScorePct: 70 } });
      for (const [qi, q] of c.quiz.questions.entries()) {
        const questionId = uuidv7();
        await tx.question.create({ data: { id: questionId, quizId, position: qi, type: q.type, stem: q.stem, relatedItemId: lectureIds[q.relatedLecture] } });
        await tx.questionOption.createMany({ data: q.options.map((o, oi) => ({ questionId, content: o.content, isCorrect: !!o.correct, explanation: o.explanation, position: oi })) });
      }
      await tx.quizTopic.createMany({ data: topicIds.slice(0, 3).map((topicId) => ({ quizId, topicId })) });
      if (isPublished) items.push({ id: quizItemId, durationSec: 0 });

      const ex = c.exercise;
      if (ex) {
        const exItemId = uuidv7();
        await tx.curriculumItem.create({ data: { id: exItemId, sectionId, courseId, type: 'coding_exercise', title: ex.title, position: pos++, isPublished, createdAt: d.createdAt } });
        const exerciseId = uuidv7();
        await tx.exercise.create({ data: {
          id: exerciseId, itemId: exItemId, courseId, learningObjective: ex.learningObjective, instructions: ex.instructions, hints: ex.hints,
          solutionExplanation: ex.solutionExplanation, relatedItemId: lectureIds[ex.relatedLecture], difficulty: ex.difficulty,
          languages: ex.code.map((k) => k.language),
        } });
        await tx.exerciseStarterCode.createMany({ data: ex.code.map((k) => ({ exerciseId, language: k.language, code: k.starter, solutionCode: k.solution })) });
        await tx.exerciseTestCase.createMany({ data: ex.tests.map((t, ti) => ({ exerciseId, position: ti, input: t.input, expectedOutput: t.expectedOutput, isPublic: t.isPublic, points: 10 })) });
        if (isPublished) items.push({ id: exItemId, durationSec: 0 });
      }
    }

    if (d.submittedAt) {
      await tx.courseApproval.create({ data: {
        courseId, submittedById: teacher.id, createdAt: d.submittedAt,
        status: c.status === 'published' ? 'approved' : c.status === 'rejected' ? 'rejected' : 'pending',
        reviewedById: d.reviewedAt ? ctx.adminId : null, reviewedAt: d.reviewedAt, reason: c.status === 'rejected' ? c.rejectReason : null,
      } });
    }
  }, { timeout: 30_000 });

  return {
    id: courseId, instructorId: teacher.id, status: c.status, publishedAt: d.publishedAt, priceAmount: c.priceAmount,
    level: c.level, language: c.language, label: c.thumbnail.label,
    lectureTitles: c.sections.flatMap((s) => s.lectures), topicIds, items,
  };
}
