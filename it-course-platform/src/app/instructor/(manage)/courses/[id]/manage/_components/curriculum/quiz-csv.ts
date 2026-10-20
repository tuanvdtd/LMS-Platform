// Đọc file CSV câu hỏi quiz (mẫu ở public/templates/quiz-questions.csv) → payload cho API import.
// File thuần, không import alias → test bằng node:test.
import { QUIZ_LIMITS, type QuestionPayload } from '../../../../../../../../types/curriculum.ts';
import { NONE, questionSchema, toPayload } from './question-schema.ts';

export type CsvError = { row: number; message: string };

const REQUIRED = ['type', 'stem', 'option_1', 'option_2', 'correct'];
const TYPES: Record<string, QuestionPayload['type']> = { single: 'single_choice', multiple: 'multiple_choice' };
const OPTION_COLS = Array.from({ length: QUIZ_LIMITS.maxOptions }, (_, i) => i + 1);

// RFC 4180: ô trong "…" được chứa dấu phẩy và xuống dòng; "" là một dấu ". Bỏ BOM, CRLF → LF.
export function parseCsv(text: string): string[][] {
  const s = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && !cell) quoted = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (cell || row.length) rows.push([...row, cell]);
  return rows;
}

// Một dòng = một câu. Số dòng báo lỗi = số dòng Excel hiển thị (tiêu đề là dòng 1); row 0 = lỗi cả file.
// rows[i] = dòng Excel của questions[i].
export function csvToQuestions(text: string): { questions: QuestionPayload[]; rows: number[]; errors: CsvError[] } {
  if (text.includes('\uFFFD')) {
    return { questions: [], rows: [], errors: [{ row: 0, message: 'File không phải UTF-8 — lưu lại bằng kiểu CSV UTF-8' }] };
  }
  const [header = [], ...rows] = parseCsv(text);
  const col = new Map(header.map((h, i) => [h.trim().toLowerCase(), i]));
  const missing = REQUIRED.filter((h) => !col.has(h));
  if (missing.length) return { questions: [], rows: [], errors: [{ row: 1, message: `Thiếu cột: ${missing.join(', ')}` }] };

  const questions: QuestionPayload[] = [];
  const questionRows: number[] = [];
  const errors: CsvError[] = [];
  rows.forEach((cells, i) => {
    if (cells.every((c) => !c.trim())) return;
    const row = i + 2;
    const fail = (message: string) => void errors.push({ row, message });
    const get = (name: string) => (cells[col.get(name) ?? -1] ?? '').trim();

    const typeKey = get('type').toLowerCase();
    if (!Object.hasOwn(TYPES, typeKey)) return fail('Cột type phải là single hoặc multiple');
    const type = TYPES[typeKey];
    const correctCells = get('correct').split(',').map((x) => x.trim()).filter(Boolean);
    if (!correctCells.length) return fail('Cột correct trống — ghi số thứ tự đáp án đúng, ví dụ 2 hoặc 1,3');
    const correct = new Set<number>();
    for (const c of correctCells) {
      const k = Number(c);
      if (!OPTION_COLS.includes(k) || !get(`option_${k}`)) return fail(`correct "${c}" không trỏ tới đáp án nào`);
      correct.add(k);
    }
    const options = [];
    for (const k of OPTION_COLS) {
      const content = get(`option_${k}`);
      const explanation = get(`explanation_${k}`);
      if (content) options.push({ content, isCorrect: correct.has(k), explanation });
      else if (explanation) return fail(`explanation_${k} có nội dung nhưng option_${k} trống`);
    }
    const parsed = questionSchema.safeParse({ type, stem: get('stem'), relatedItemId: NONE, options });
    if (!parsed.success) return fail(parsed.error.issues.map((x) => x.message).join('; '));
    questions.push(toPayload(parsed.data));
    questionRows.push(row);
  });
  if (!questions.length && !errors.length) errors.push({ row: 0, message: 'File chưa có câu hỏi nào' });
  return { questions, rows: questionRows, errors };
}
