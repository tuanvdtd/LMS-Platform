import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { csvToQuestions, parseCsv } from './quiz-csv.ts';

const H = 'type,stem,option_1,option_2,option_3,option_4,option_5,correct,explanation_1,explanation_2,explanation_3,explanation_4,explanation_5';
const csv = (...rows: string[]) => [H, ...rows].join('\n');

test('parseCsv: ngoặc kép, "" thoát, xuống dòng trong ô, CRLF, BOM, dòng cuối không xuống dòng', () => {
  assert.deepEqual(parseCsv('\uFEFFa,"b,c","d ""e"""\r\n"x\r\ny",z'), [
    ['a', 'b,c', 'd "e"'],
    ['x\ny', 'z'],
  ]);
});

test('parseCsv: dấu " giữa ô không có ngoặc kép chỉ là ký tự thường', () => {
  assert.deepEqual(parseCsv('a"b,c'), [['a"b', 'c']]);
  assert.deepEqual(parseCsv('ab"c,d\ne,f'), [['ab"c', 'd'], ['e', 'f']]);
});

test('ô nhiều dòng tính là 1 dòng: lỗi ở dòng sau báo đúng số dòng Excel', () => {
  const { errors } = csvToQuestions(csv('single,"Đề\nnhiều\ndòng",A,B,,,,1,,,,,', 'abc,Đề,A,B,,,,1,,,,,'));
  assert.deepEqual(errors.map((e) => e.row), [3]);
});

test('câu single hợp lệ; cột đáp án trống xen giữa được dồn, correct tính theo số cột', () => {
  const { questions, rows, errors } = csvToQuestions(csv('single,Đề?,A,,C,,,3,,,Vì C,,'));
  assert.deepEqual(errors, []);
  assert.deepEqual(rows, [2]);
  assert.deepEqual(questions, [
    {
      type: 'single_choice',
      stem: 'Đề?',
      relatedItemId: null,
      options: [
        { content: 'A', isCorrect: false, explanation: null },
        { content: 'C', isCorrect: true, explanation: 'Vì C' },
      ],
    },
  ]);
});

test('câu multiple, đề nhiều dòng có code; type không phân biệt hoa thường; tiêu đề có khoảng trắng', () => {
  const header = ' Type , STEM ,option_1,option_2,option_3,correct';
  const text = `${header}\nMULTIPLE,"Chọn số chẵn:\n\n\`\`\`js\nconst a = [2, 3, 4];\n\`\`\`",2,3,4,"1, 3"`;
  const { questions, errors } = csvToQuestions(text);
  assert.deepEqual(errors, []);
  assert.equal(questions[0].type, 'multiple_choice');
  assert.equal(questions[0].stem, 'Chọn số chẵn:\n\n```js\nconst a = [2, 3, 4];\n```');
  assert.deepEqual(questions[0].options.map((o) => o.isCorrect), [true, false, true]);
});

test('lỗi theo dòng, số dòng như Excel (tiêu đề = 1, dòng trống vẫn được đếm)', () => {
  const { questions, errors } = csvToQuestions(
    csv(
      'abc,Đề,A,B,,,,1,,,,,', // 2: type sai
      '', // 3: dòng trống → bỏ qua
      'single,Đề,A,B,,,,,,,,,', // 4: correct trống
      'single,Đề,A,B,,,,3,,,,,', // 5: correct trỏ cột trống
      'single,Đề,A,B,,,,6,,,,,', // 6: correct ngoài 1–5
      'single,Đề,A,B,,,,1,,,Giải thích,,', // 7: explanation_3 mà option_3 trống
      'single,Đề,A,B,,,,"1,2",,,,,', // 8: single có 2 đáp án đúng (luật schema)
      'single,,A,B,,,,1,,,,,', // 9: đề trống (luật schema)
      'single,Đề hợp lệ,A,B,,,,2,,,,,', // 10: hợp lệ
    ),
  );
  assert.deepEqual(
    errors.map((e) => e.row),
    [2, 4, 5, 6, 7, 8, 9],
  );
  assert.match(errors[0].message, /single hoặc multiple/);
  assert.match(errors[5].message, /Chọn đúng 1 đáp án đúng/);
  assert.equal(questions.length, 1);
  assert.equal(questions[0].stem, 'Đề hợp lệ');
});

test('thiếu cột bắt buộc → 1 lỗi dòng 1', () => {
  const { questions, errors } = csvToQuestions('type,stem,option_1\nsingle,Đề,A');
  assert.deepEqual(questions, []);
  assert.deepEqual(errors, [{ row: 1, message: 'Thiếu cột: option_2, correct' }]);
});

test('file không phải UTF-8 / không có câu nào', () => {
  assert.match(csvToQuestions(csv('single,Đ\uFFFDề,A,B,,,,1,,,,,')).errors[0].message, /UTF-8/);
  assert.deepEqual(csvToQuestions(`${H}\n\n`).errors, [{ row: 0, message: 'File chưa có câu hỏi nào' }]);
});

test('file mẫu đọc sạch: 1 câu single + 1 câu multiple, có BOM', () => {
  const text = readFileSync(new URL('../../../../../../../../../public/templates/quiz-questions.csv', import.meta.url), 'utf8');
  assert.ok(text.startsWith('\uFEFF'));
  const { questions, errors } = csvToQuestions(text);
  assert.deepEqual(errors, []);
  assert.deepEqual(questions.map((q) => q.type), ['single_choice', 'multiple_choice']);
  assert.ok(questions[1].stem.includes('```js'));
  assert.ok(questions[1].options.filter((o) => o.isCorrect).length >= 2);
});
