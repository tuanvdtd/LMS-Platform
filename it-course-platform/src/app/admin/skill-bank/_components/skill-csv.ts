// CSV ngân hàng câu kỹ năng = CSV quiz + cột difficulty. Dùng lại bộ đọc của quiz, chỉ đọc thêm 1 cột.
// File thuần, chỉ import tương đối → test bằng node:test.
import { type CsvError, csvToQuestions, parseCsv } from '../../../instructor/(manage)/courses/[id]/manage/_components/curriculum/quiz-csv.ts';
import type { QuestionPayload } from '../../../../types/curriculum.ts';
import type { SkillDifficulty } from '../../../../types/skills.ts';

const ALIASES: Record<string, SkillDifficulty> = { easy: 'easy', medium: 'medium', hard: 'hard', dễ: 'easy', vừa: 'medium', khó: 'hard' };

type Parsed = { questions: (QuestionPayload & { difficulty: SkillDifficulty })[]; rows: number[]; errors: CsvError[] };

export function csvToSkillQuestions(text: string): Parsed {
  const base = csvToQuestions(text);
  const [header = [], ...rows] = parseCsv(text);
  const col = header.findIndex((h) => h.trim().toLowerCase() === 'difficulty');
  // Lỗi cả file (không phải UTF-8, thiếu cột quiz) giữ nguyên, không chồng thêm lỗi cột difficulty.
  if (base.errors.some((e) => e.row <= 1) && !base.questions.length) return { questions: [], rows: [], errors: base.errors };
  if (col < 0) return { questions: [], rows: [], errors: [{ row: 1, message: 'Thiếu cột: difficulty' }] };
  const errors = [...base.errors];
  const questions: Parsed['questions'] = [];
  const okRows: number[] = [];
  base.questions.forEach((q, i) => {
    const row = base.rows[i];
    const key = (rows[row - 2]?.[col] ?? '').trim().toLowerCase();
    const d = Object.hasOwn(ALIASES, key) ? ALIASES[key] : undefined;
    if (!d) errors.push({ row, message: 'Cột difficulty phải là easy, medium hoặc hard' });
    else {
      questions.push({ ...q, difficulty: d });
      okRows.push(row);
    }
  });
  return { questions, rows: okRows, errors: errors.sort((a, b) => a.row - b.row) };
}
