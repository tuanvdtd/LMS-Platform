import assert from 'node:assert/strict';
import { test } from 'node:test';
import { csvToSkillQuestions } from './skill-csv.ts';

const H = 'type,stem,difficulty,option_1,option_2,option_3,option_4,option_5,correct,explanation_1,explanation_2,explanation_3,explanation_4,explanation_5';
const csv = (...rows: string[]) => [H, ...rows].join('\n');

test('file hợp lệ 2 câu: easy và Khó (không phân biệt hoa thường, có tiếng Việt)', () => {
  const r = csvToSkillQuestions(csv('single,Đề 1,easy,A,B,,,,1,,,,,', 'multiple,Đề 2,Khó,A,B,C,,,"1,3",,,,,'));
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.questions.map((q) => q.difficulty), ['easy', 'hard']);
  assert.deepEqual(r.rows, [2, 3]);
});

test('thiếu cột difficulty → lỗi dòng 1', () => {
  const r = csvToSkillQuestions('type,stem,option_1,option_2,correct\nsingle,Đề,A,B,1');
  assert.deepEqual(r.questions, []);
  assert.deepEqual(r.errors, [{ row: 1, message: 'Thiếu cột: difficulty' }]);
});

test('difficulty sai → lỗi đúng số dòng Excel, câu đúng vẫn được đọc', () => {
  const r = csvToSkillQuestions(csv('single,Đề 1,easy,A,B,,,,1,,,,,', 'single,Đề 2,trung bình,A,B,,,,1,,,,,'));
  assert.deepEqual(r.errors.map((e) => e.row), [3]);
  assert.equal(r.questions.length, 1);
});

test('lỗi của CSV quiz (correct trống) vẫn được báo, kèm lỗi difficulty ở dòng khác', () => {
  const r = csvToSkillQuestions(csv('single,Đề 1,easy,A,B,,,,,,,,,', 'single,Đề 2,x,A,B,,,,1,,,,,'));
  assert.deepEqual(r.errors.map((e) => e.row), [2, 3]);
  assert.match(r.errors[0].message, /correct/);
});

test('ô nhiều dòng không làm lệch dòng difficulty', () => {
  const r = csvToSkillQuestions(csv('single,"Đề\nnhiều dòng",hard,A,B,,,,1,,,,,', 'single,Đề 2,medium,A,B,,,,1,,,,,'));
  assert.deepEqual(r.questions.map((q) => q.difficulty), ['hard', 'medium']);
  assert.deepEqual(r.rows, [2, 3]);
});
