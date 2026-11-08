import { isPriceTier } from '../../src/revenue/price-guard.ts';
import type { PrismaClient } from '@prisma/client';
import type { SeedData } from './data/types.ts';
import { SKILL_ABILITIES } from './data/skill-abilities.ts';
import { SKILL_BANK_TOPICS } from '../skill-bank/types.ts';
import { MIN_ACTIVE_QUESTIONS } from '../../src/skills/skill-elo.ts';

export const SEED_EMAIL_DOMAIN = '@skillpath.test';
export const MIN_VIDEO_SEC = 120;
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const inRange = (n: number, min: number, max: number) => n >= min && n <= max;

// Trả mọi lỗi một lượt để sửa data một lần, không sửa-chạy-sửa từng lỗi.
export function validateData({ users, courses }: SeedData): string[] {
  const errors: string[] = [];
  const emails = new Set<string>();
  for (const u of users) {
    if (!u.email.endsWith(SEED_EMAIL_DOMAIN)) errors.push(`${u.email}: email phải có đuôi ${SEED_EMAIL_DOMAIN}`);
    if (emails.has(u.email)) errors.push(`${u.email}: email trùng`);
    emails.add(u.email);
    if (!inRange(u.targetTopics.length, 2, 5)) errors.push(`${u.email}: cần 2–5 target topic`);
    const bank = u.profile?.bank;
    // Khớp CHECK chk_bank_account trong DB.
    if (bank && !/^\d{6}$/.test(bank.bin)) errors.push(`${u.email}: bankBin phải 6 số`);
    if (bank && !/^\d{6,19}$/.test(bank.accountNo)) errors.push(`${u.email}: bankAccountNo phải 6–19 số`);
    if (bank && !/^[A-Z ]{2,50}$/.test(bank.accountName)) errors.push(`${u.email}: bankAccountName IN HOA không dấu`);
  }

  const byEmail = new Map(users.map((u) => [u.email, u]));
  const titles = new Set<string>();
  for (const c of courses) {
    const id = `[${c.title}]`;
    const teacher = byEmail.get(c.instructorEmail);
    if (!teacher) errors.push(`${id} instructorEmail ${c.instructorEmail} không có trong users`);
    if (!isPriceTier(c.priceAmount)) errors.push(`${id} priceAmount ${c.priceAmount} không thuộc PRICE_TIERS`);
    if (c.priceAmount > 0 && teacher && !teacher.profile) errors.push(`${id} khoá có phí nhưng giảng viên chưa xác minh`);
    if (titles.has(c.title)) errors.push(`${id} tiêu đề trùng`);
    if (!inRange(c.subtitle.length, 60, 120)) errors.push(`${id} subtitle cần 60–120 ký tự`);
    // Giới hạn để chữ trên ảnh bìa 1280×720 không tràn.
    if (c.thumbnail.label.length > 14) errors.push(`${id} thumbnail.label dài quá 14 ký tự`);
    if (c.thumbnail.tagline.length > 32) errors.push(`${id} thumbnail.tagline dài quá 32 ký tự`);
    titles.add(c.title);
    if (c.topics.filter((t) => t.primary).length !== 1) errors.push(`${id} cần đúng 1 topic chính`);
    if (!inRange(c.topics.length, 2, 4)) errors.push(`${id} cần 2–4 topic`);
    if (words(c.description) < 200) errors.push(`${id} mô tả phải ≥ 200 từ (đang ${words(c.description)})`);
    if (!inRange(c.learningObjectives.length, 4, 6)) errors.push(`${id} cần 4–6 mục tiêu`);
    if (c.learningObjectives.some((o) => o.length > 160)) errors.push(`${id} mục tiêu dài quá 160 ký tự`);
    if (!inRange(c.requirements.length, 1, 3)) errors.push(`${id} cần 1–3 yêu cầu`);
    if (!inRange(c.targetAudience.length, 1, 3)) errors.push(`${id} cần 1–3 đối tượng`);
    if (!inRange(c.sections.length, 3, 4)) errors.push(`${id} cần 3–4 chương`);
    const lectureCount = c.sections.reduce((n, s) => n + s.lectures.length, 0);
    if (!inRange(lectureCount, 6, 10)) errors.push(`${id} cần 6–10 bài giảng (đang ${lectureCount})`);
    if (c.status === 'rejected' && !c.rejectReason) errors.push(`${id} khoá bị từ chối cần rejectReason`);

    if (c.quiz.questions.length !== 5) errors.push(`${id} quiz cần đúng 5 câu`);
    c.quiz.questions.forEach((qq, i) => {
      const correct = qq.options.filter((o) => o.correct).length;
      if (!inRange(qq.options.length, 3, 5)) errors.push(`${id} câu ${i + 1} cần 3–5 đáp án`);
      if (correct === 0) errors.push(`${id} câu ${i + 1} không có đáp án đúng`);
      if (qq.type === 'single_choice' && correct !== 1) errors.push(`${id} câu ${i + 1} single_choice phải đúng 1 đáp án`);
      if (!inRange(qq.relatedLecture, 0, lectureCount - 1)) errors.push(`${id} câu ${i + 1} relatedLecture ngoài phạm vi`);
    });

    const ex = c.exercise;
    if (ex) {
      if (!ex.code.length || ex.code.some((k) => !['javascript', 'python'].includes(k.language)))
        errors.push(`${id} bài code chỉ dùng javascript/python`);
      if (!inRange(ex.tests.length, 3, 5)) errors.push(`${id} bài code cần 3–5 test`);
      if (!ex.tests.some((t) => t.isPublic)) errors.push(`${id} bài code cần ≥ 1 test công khai`);
      if (!ex.tests.some((t) => !t.isPublic)) errors.push(`${id} bài code cần ≥ 1 test ẩn`);
      if (!inRange(ex.relatedLecture, 0, lectureCount - 1)) errors.push(`${id} bài code relatedLecture ngoài phạm vi`);
    }
  }
  return errors;
}

// Tách khỏi validateData vì spec của validateData dùng bộ user giả, không chứa email trong SKILL_ABILITIES.
export function validateSkillAbilities({ users }: SeedData): string[] {
  const emails = new Set(users.map((u) => u.email));
  const errors: string[] = [];
  for (const [email, abilities] of Object.entries(SKILL_ABILITIES)) {
    if (!emails.has(email)) errors.push(`SKILL_ABILITIES: ${email} không có trong SEED_DATA.users`);
    for (const slug of Object.keys(abilities))
      if (!(SKILL_BANK_TOPICS as readonly string[]).includes(slug)) errors.push(`SKILL_ABILITIES: ${email} có topic "${slug}" ngoài ngân hàng câu kỹ năng`);
  }
  return errors;
}

export function validateCoverage({ courses }: SeedData, occupationTopicSlugs: string[]): string[] {
  const covered = new Set(courses.filter((c) => c.status === 'published').flatMap((c) => c.topics.map((t) => t.slug)));
  return occupationTopicSlugs.filter((s) => !covered.has(s)).map((s) => `topic nghề "${s}" chưa có khoá published`);
}

const R2_ENV = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_PUBLIC_BUCKET', 'R2_PUBLIC_URL'];

export async function validateDb(prisma: PrismaClient, data: SeedData): Promise<string[]> {
  const errors: string[] = [];
  if (!(await prisma.user.findFirst({ where: { role: { contains: 'admin' } }, select: { id: true } }))) errors.push('DB chưa có user admin');

  const catSlugs = [...new Set(data.courses.map((c) => c.categorySlug))];
  const cats = new Set((await prisma.category.findMany({ where: { slug: { in: catSlugs } }, select: { slug: true } })).map((c) => c.slug));
  for (const s of catSlugs) if (!cats.has(s)) errors.push(`DB thiếu danh mục "${s}"`);

  const topicSlugs = [...new Set([...data.courses.flatMap((c) => c.topics.map((t) => t.slug)), ...data.users.flatMap((u) => u.targetTopics)])];
  const topics = new Set((await prisma.topic.findMany({ where: { slug: { in: topicSlugs } }, select: { slug: true } })).map((t) => t.slug));
  for (const s of topicSlugs) if (!topics.has(s)) errors.push(`DB thiếu topic "${s}"`);

  if (!(await prisma.asset.count({ where: { kind: 'video', status: 'ready', durationSec: { gte: MIN_VIDEO_SEC } } })))
    errors.push(`DB không có video ready dài ≥ ${MIN_VIDEO_SEC}s để gắn bài giảng`);
  if (!(await prisma.platformSetting.findUnique({ where: { key: 'revenue_share_pct' } }))) errors.push('Thiếu platform_settings.revenue_share_pct');
  for (const v of R2_ENV) if (!process.env[v]) errors.push(`Thiếu biến môi trường ${v}`);

  for (const slug of SKILL_BANK_TOPICS) {
    const n = await prisma.skillQuestion.count({ where: { archivedAt: null, topic: { slug } } });
    if (n < MIN_ACTIVE_QUESTIONS) errors.push(`Topic "${slug}" chỉ có ${n} câu kỹ năng chưa ẩn. Chưa nạp ngân hàng câu kỹ năng — chạy pnpm seed:skills`);
  }

  const occ = await prisma.occupationTopic.findMany({ select: { topic: { select: { slug: true } } } });
  errors.push(...validateCoverage(data, [...new Set(occ.map((o) => o.topic.slug))]));
  return errors;
}
