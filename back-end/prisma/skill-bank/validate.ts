import { PER_TOPIC, SKILL_BANK_TOPICS, type SkillSeedQuestion } from './types.ts';

// Cùng giới hạn với quiz (QUIZ_LIMITS / quiz.schemas.ts): đề ≤ 5000, 2–5 đáp án, đáp án ≤ 500.
const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
const RANGE = { easy: [12, 14], medium: [13, 15], hard: [12, 14] } as const;

export function validateBank(bank: Record<string, SkillSeedQuestion[]>, { strict }: { strict: boolean }): string[] {
  const errs: string[] = [];
  if (strict) {
    for (const slug of SKILL_BANK_TOPICS) if (!bank[slug]) errs.push(`Thiếu topic ${slug}`);
  }
  for (const [slug, qs] of Object.entries(bank)) {
    if (strict && qs.length !== PER_TOPIC) errs.push(`${slug}: có ${qs.length} câu, cần ${PER_TOPIC}`);
    if (strict) {
      for (const d of ['easy', 'medium', 'hard'] as const) {
        const n = qs.filter((q) => q.difficulty === d).length;
        if (n < RANGE[d][0] || n > RANGE[d][1]) errs.push(`${slug}: ${n} câu ${d}, cần ${RANGE[d][0]}–${RANGE[d][1]}`);
      }
    }
    if (strict) errs.push(...answerLeakErrors(slug, qs));
    const stems = new Set<string>();
    qs.forEach((q, i) => {
      const at = `${slug} #${i + 1}`;
      if (!q.stem.trim() || q.stem.length > 5000) errs.push(`${at}: đề trống hoặc > 5000 ký tự`);
      if (stems.has(norm(q.stem))) errs.push(`${at}: đề trùng`);
      stems.add(norm(q.stem));
      if (q.options.length < 2 || q.options.length > 5) errs.push(`${at}: cần 2–5 đáp án`);
      if (new Set(q.options.map((o) => norm(o.content))).size !== q.options.length) errs.push(`${at}: đáp án trùng`);
      if (q.options.some((o) => !o.content.trim() || o.content.length > 500)) errs.push(`${at}: đáp án trống hoặc > 500 ký tự`);
      const correct = q.options.filter((o) => o.correct).length;
      if (q.type === 'single_choice' && correct !== 1) errs.push(`${at}: câu một đáp án phải có đúng 1 đáp án đúng`);
      if (q.type === 'multiple_choice' && correct < 2) errs.push(`${at}: câu nhiều đáp án cần ≥ 2 đáp án đúng`);
    });
  }
  return errs;
}

// Guard chống lộ đáp án (R4): máy bắt thay cho mắt người khi soạn hàng trăm câu.
function answerLeakErrors(slug: string, qs: SkillSeedQuestion[]): string[] {
  const errs: string[] = [];
  const singles = qs.filter((q) => q.type === 'single_choice');
  const multis = qs.filter((q) => q.type === 'multiple_choice');
  if (multis.length < 8 || multis.length > 10) errs.push(`${slug}: cần 8–10 câu multiple_choice, có ${multis.length}`);
  // Đáp án đúng là phương án dài nhất duy nhất → đoán được nhờ độ dài.
  const longest = singles.filter((q) => {
    const c = q.options.find((o) => o.correct);
    if (!c) return false; // câu lỗi đã bị báo ở nơi khác, không ném
    return q.options.every((o) => o === c || o.content.length < c.content.length);
  }).length;
  if (singles.length && longest / singles.length > 0.35) {
    errs.push(`${slug}: ${longest}/${singles.length} câu single_choice có đáp án đúng dài nhất duy nhất (tối đa 35%)`);
  }
  for (let p = 0; p < 5; p++) {
    const s = singles.filter((q) => q.options[p]?.correct).length;
    if (singles.length && s / singles.length > 0.4) errs.push(`${slug}: vị trí ${p + 1} chứa ${s}/${singles.length} đáp án đúng của single_choice (tối đa 40%)`);
    const m = multis.filter((q) => q.options[p]?.correct).length;
    if (multis.length && m / multis.length > 0.7) errs.push(`${slug}: vị trí ${p + 1} đúng ở ${m}/${multis.length} câu multiple_choice (tối đa 70%)`);
  }
  return errs;
}
