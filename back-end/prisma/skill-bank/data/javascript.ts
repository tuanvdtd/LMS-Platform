import type { SkillSeedQuestion } from '../types.ts';

// 13 easy · 14 medium · 13 hard; 10 câu multiple_choice.
// Mọi đoạn code đã chạy thử bằng Node.js 24 để kiểm khoá; khái niệm đối chiếu MDN / ECMA-262 (2026-11-04).
// Vị trí đúng và độ dài đáp án rải có chủ ý (validateBank strict kiểm).
export const JAVASCRIPT: SkillSeedQuestion[] = [
  // ───── easy (13) ─────
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`js
const user = { name: 'An' };
user.name = 'Bình';
console.log(user.name);
\`\`\``,
    options: [
      { content: '`Bình`, vì `const` chặn gán lại biến, không khoá thuộc tính', correct: true },
      { content: '`An`, vì thuộc tính của đối tượng `const` không đổi được' },
      { content: 'Ném `TypeError`, vì `user` là hằng nên không sửa được' },
      { content: '`undefined`, vì phép gán vào hằng bị bỏ qua lặng lẽ' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`js
console.log('5' + 3, '5' - 3);
\`\`\``,
    options: [
      { content: '`8 2`' },
      { content: '`53 NaN`' },
      { content: '`53 2`', correct: true },
      { content: '`8 NaN`' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Đoạn code sau chạy thế nào?

\`\`\`js
if (true) {
  var a = 1;
  let b = 2;
}
console.log(a);
console.log(b);
\`\`\``,
    options: [
      { content: 'In `1` rồi `2`, vì cả hai nằm trong khối `if` đã chạy' },
      { content: 'In `1`, rồi ném `ReferenceError` ở dòng in `b`', correct: true },
      { content: 'Ném `ReferenceError` ngay ở dòng in `a`' },
      { content: 'In `1` rồi `undefined`, vì `b` được đưa lên đầu như `var`' },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: 'Xét riêng từng dòng, mỗi lần `a` đều bắt đầu là `[3, 1, 2]`. Sau những dòng nào thì `a` vẫn còn nguyên `[3, 1, 2]`?',
    options: [
      { content: '`const b = a.sort((x, y) => x - y);`' },
      { content: '`const b = a.map((x) => x * 2);`', correct: true },
      { content: '`const b = a.reverse();`' },
      { content: '`const b = a.filter((x) => x > 1);`', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`js
const a = { x: 1 };
const b = { x: 1 };
const c = a;
console.log(a === b, a === c, a.x === b.x);
\`\`\``,
    options: [
      { content: '`true true true`' },
      { content: '`false false true`' },
      { content: '`false false false`' },
      { content: '`false true true`', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`js
const user = {
  name: 'An',
  hi() { return this.name; },
};
const admin = { name: 'Bình', hi: user.hi };
console.log(admin.hi());
\`\`\``,
    options: [
      { content: '`An`, vì `hi` được định nghĩa bên trong `user`' },
      { content: '`undefined`, vì `hi` đã bị tách khỏi đối tượng `user` gốc' },
      { content: '`Bình`, vì `this` lấy theo đối tượng đứng trước dấu chấm', correct: true },
      { content: 'Ném `TypeError`, vì `this` mất liên kết khi sao chép' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Số in ra xấp xỉ bao nhiêu?

\`\`\`js
const start = Date.now();
setTimeout(() => console.log(Date.now() - start), 100);
while (Date.now() - start < 500) {} // vòng lặp bận khoảng 500 ms
\`\`\``,
    options: [
      { content: 'Khoảng 100 ms: callback chen vào giữa vòng lặp khi hết hạn' },
      { content: 'Khoảng 500 ms: callback chờ đến khi vòng lặp chạy xong', correct: true },
      { content: 'Khoảng 600 ms: 500 ms của vòng lặp cộng thêm 100 ms hẹn giờ' },
      { content: 'Không in gì, vì callback đã quá hạn 100 ms nên bị bỏ' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`js
async function getUser() {
  return { name: 'An' };
}
const user = getUser();
console.log(user.name);
\`\`\``,
    options: [
      { content: '`An`, vì hàm trả về object ngay lập tức' },
      { content: 'Ném `TypeError`, vì `user` vẫn là `undefined` lúc đó' },
      { content: 'Chờ `getUser()` chạy xong rồi mới in ra `An`' },
      { content: '`undefined`, vì `user` đang là một Promise', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Đoạn code sau in ra những gì?

\`\`\`js
try {
  JSON.parse('{ten: "An"}');
  console.log('A');
} catch (e) {
  console.log('B');
} finally {
  console.log('C');
}
\`\`\``,
    options: [
      { content: '`B`, `C`', correct: true },
      { content: '`A`, `C`' },
      { content: '`A`, `B`, `C`' },
      { content: '`B`' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`js
function makeCounter() {
  let count = 0;
  return () => ++count;
}
const c1 = makeCounter();
const c2 = makeCounter();
c1();
c1();
console.log(c1(), c2());
\`\`\``,
    options: [
      { content: '`3 4`' },
      { content: '`2 1`' },
      { content: '`2 0`' },
      { content: '`3 1`', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`js
function show() {
  console.log(msg);
  var msg = 'Xin chào';
}
show();
\`\`\``,
    options: [
      { content: '`undefined`', correct: true },
      { content: '`Xin chào`' },
      { content: 'Ném `ReferenceError`' },
      { content: 'Không in gì, vì biến chưa được gán' },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: 'Với `if (x) { ... }`, những giá trị nào của `x` khiến khối lệnh KHÔNG chạy?',
    options: [
      { content: '`0` (số không)', correct: true },
      { content: '`\'0\'` (chuỗi chứa ký tự 0)' },
      { content: '`[]` (mảng rỗng)' },
      { content: '`\'\'` (chuỗi rỗng)', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: `File \`math.js\` (ES module) như dưới đây. Những câu import nào trong \`main.js\` cùng thư mục nạp được mà không lỗi?

\`\`\`js
// math.js
export default function add(a, b) { return a + b; }
export const PI = 3.14;
\`\`\``,
    options: [
      { content: '`import { add, PI } from \'./math.js\';`' },
      { content: '`import sum, { PI } from \'./math.js\';`', correct: true },
      { content: '`import { PI: myPi } from \'./math.js\';`' },
      { content: '`import { PI as pi } from \'./math.js\';`', correct: true },
    ],
  },

  // ───── medium (14) ─────
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Đoạn code sau chạy thế nào?

\`\`\`js
class Logger {
  prefix = '[log]';
  print(msg) {
    console.log(this.prefix, msg);
  }
}
const logger = new Logger();
['a', 'b'].forEach(logger.print);
\`\`\``,
    options: [
      { content: 'In `[log] a` rồi `[log] b`' },
      { content: 'In `undefined a` rồi `undefined b`' },
      { content: 'Ném `ReferenceError: prefix is not defined`' },
      { content: 'Ném `TypeError` ngay ở lần gọi đầu tiên', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Đoạn code sau chạy thế nào?

\`\`\`js
class Animal {
  constructor(name) { this.name = name; }
}
class Cat extends Animal {
  constructor(name) {
    this.sound = 'meo';
    super(name);
  }
}
const c = new Cat('Mun');
console.log(c.name, c.sound);
\`\`\``,
    options: [
      { content: 'In `Mun meo`, thứ tự gán không quan trọng' },
      { content: 'In `Mun undefined`, vì `super()` tạo `this` mới' },
      { content: 'Ném `ReferenceError` khi chạy dòng `this.sound`', correct: true },
      { content: 'Ném `SyntaxError` ngay khi phân tích lớp `Cat`' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Node in ra gì?

\`\`\`js
const base = { greet: 'hi', tags: [] };
const child = Object.create(base);
child.greet = 'hello';
child.tags.push('x');
console.log(base.greet, base.tags.length, Object.keys(child));
\`\`\``,
    options: [
      { content: '`hello 1 [ \'greet\', \'tags\' ]`' },
      { content: '`hi 1 [ \'greet\' ]`', correct: true },
      { content: '`hi 0 [ \'greet\' ]`' },
      { content: '`hi 1 [ \'greet\', \'tags\' ]`' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Node in ra gì?

\`\`\`js
const nums = [10, 1, 21, 2];
nums.sort();
console.log(nums);
\`\`\``,
    options: [
      { content: '`[ 1, 2, 10, 21 ]`' },
      { content: '`[ 10, 1, 21, 2 ]`' },
      { content: '`[ \'1\', \'10\', \'2\', \'21\' ]`' },
      { content: '`[ 1, 10, 2, 21 ]`', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: 'Những phát biểu nào đúng?',
    options: [
      { content: '`[1, 2, 3].reduce((s, n) => s + n)` trả về `6`', correct: true },
      { content: '`[].reduce((total, n) => total + n)` trả về `0`' },
      { content: '`[[1], [2, [3]]].flat()` trả về `[1, 2, [3]]`', correct: true },
      { content: '`[1, 2, 3].find((num) => num > 5)` trả về `-1`' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`js
function greet({ name = 'Khách', age = 18 } = {}) {
  return \`\${name}-\${age}\`;
}
console.log(greet({ name: null, age: undefined }));
console.log(greet());
\`\`\``,
    options: [
      { content: '`null-18` rồi `Khách-18`', correct: true },
      { content: '`Khách-18` rồi `Khách-18`' },
      { content: '`null-undefined` rồi `Khách-18`' },
      { content: '`null-18` rồi ném `TypeError`' },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: 'Những phát biểu nào đúng về spread / rest?',
    options: [
      { content: '`[...\'hi\']` cho ra `[\'hi\']`' },
      { content: '`const { a, ...rest } = { a: 1, b: 2, c: 3 };` cho `rest` là `{ b: 2, c: 3 }`', correct: true },
      { content: '`const [first, ...mid, last] = [1, 2, 3, 4];` gán `last` là `4`' },
      { content: '`{ ...{ x: 1, y: 2 }, x: 3 }` cho ra `{ x: 3, y: 2 }`', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Đoạn code sau in ra những gì, theo thứ tự?

\`\`\`js
Promise.reject(new Error('x'))
  .then(() => console.log('A'))
  .catch(() => {
    console.log('B');
    return 1;
  })
  .then((v) => console.log('C', v))
  .finally(() => console.log('D'));
\`\`\``,
    options: [
      { content: '`B`, `D`' },
      { content: '`A`, `B`, `C 1`, `D`' },
      { content: '`B`, `C 1`, `D`', correct: true },
      { content: '`B`, `C undefined`, `D`' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Giá trị in ra xấp xỉ bao nhiêu?

\`\`\`js
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function run() {
  const start = Date.now();
  await wait(100);
  await wait(100);
  const p1 = wait(100);
  const p2 = wait(100);
  await p1;
  await p2;
  console.log(Date.now() - start);
}
run();
\`\`\``,
    options: [
      { content: 'Khoảng 400 ms: bốn lần `wait` chạy nối tiếp nhau' },
      { content: 'Khoảng 200 ms: mỗi cặp `await` liền nhau chạy song song' },
      { content: 'Khoảng 100 ms: cả bốn `wait` khởi động cùng lúc khi gọi `run()`' },
      { content: 'Khoảng 300 ms: 100 + 100 nối tiếp, rồi `p1`/`p2` song song', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Thứ tự in ra là gì?

\`\`\`js
console.log('A');
setTimeout(() => console.log('B'), 0);
new Promise((resolve) => {
  console.log('C');
  resolve();
}).then(() => console.log('D'));
console.log('E');
\`\`\``,
    options: [
      { content: '`A C E B D`' },
      { content: '`A E C D B`' },
      { content: '`A C E D B`', correct: true },
      { content: '`A E C B D`' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Thứ tự in ra là gì?

\`\`\`js
const save = (x) =>
  new Promise((r) => setTimeout(() => { console.log('lưu', x); r(); }, 10));

async function saveAll(items) {
  items.forEach(async (x) => {
    await save(x);
  });
  console.log('xong');
}
saveAll([1, 2]);
\`\`\``,
    options: [
      { content: '`lưu 1`, `lưu 2`, `xong`' },
      { content: '`xong`, `lưu 1`, `lưu 2`', correct: true },
      { content: '`lưu 1`, `xong`, `lưu 2`' },
      { content: 'Chỉ `xong`, các callback `async` không được chạy' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Ba file ES module dưới đây, chạy \`node main.mjs\`. Thứ tự in ra là gì?

\`\`\`js
// log.mjs
console.log('log');

// a.mjs
import './log.mjs';
console.log('a');

// main.mjs
console.log('main');
import './a.mjs';
import './log.mjs';
\`\`\``,
    options: [
      { content: '`main`, `log`, `a`, `log`' },
      { content: '`main`, `log`, `a`' },
      { content: '`log`, `a`, `log`, `main`' },
      { content: '`log`, `a`, `main`', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Đoạn code sau chạy thế nào?

\`\`\`js
let x = 1;
function show() {
  console.log(x);
  let x = 2;
}
show();
\`\`\``,
    options: [
      { content: 'In `1`' },
      { content: 'Ném `ReferenceError`', correct: true },
      { content: 'In `undefined`' },
      { content: 'Ném `SyntaxError`' },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: 'Những phát biểu nào đúng về xử lý lỗi trong JavaScript?',
    options: [
      { content: 'Lỗi ném trong callback của `setTimeout` được `try/catch` bao quanh lời gọi `setTimeout` bắt' },
      { content: '`throw \'lỗi\'` hợp lệ; trong `catch (e)` thì `e` chính là chuỗi `\'lỗi\'`', correct: true },
      { content: '`try/catch` trong một file bắt được `SyntaxError` do chính file đó viết sai cú pháp' },
      { content: 'Viết `try { ... } catch { ... }` (không có tham số lỗi) là cú pháp hợp lệ', correct: true },
    ],
  },

  // ───── hard (13) ─────
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Thứ tự in ra là gì?

\`\`\`js
console.log(1);
setTimeout(() => console.log(2), 0);
Promise.resolve().then(() => console.log(3));
(async () => {
  console.log(4);
  await null;
  console.log(5);
})();
queueMicrotask(() => console.log(6));
console.log(7);
\`\`\``,
    options: [
      { content: '`1 4 7 3 6 5 2`' },
      { content: '`1 7 4 3 5 6 2`' },
      { content: '`1 4 7 3 5 6 2`', correct: true },
      { content: '`1 7 4 3 6 5 2`' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Node in ra gì?

\`\`\`js
const a = [];
const b = [];
for (var i = 0; i < 3; i++) a.push(() => i);
for (let j = 0; j < 3; j++) {
  b.push(() => j);
  j++;
}
console.log(a.map((f) => f()), b.map((f) => f()));
\`\`\``,
    options: [
      { content: '`[ 3, 3, 3 ] [ 1, 3 ]`', correct: true },
      { content: '`[ 3, 3, 3 ] [ 0, 2 ]`' },
      { content: '`[ 0, 1, 2 ] [ 0, 2 ]`' },
      { content: '`[ 3, 3, 3 ] [ 4, 4 ]`' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Chạy bằng Node, đoạn code sau cho kết quả thế nào?

\`\`\`js
function f(a = b, b = 2) {
  return [a, b];
}
console.log(f(1));
console.log(f(undefined, 3));
\`\`\``,
    options: [
      { content: 'In `[ 1, 2 ]` rồi `[ 3, 3 ]`' },
      { content: 'In `[ 1, 2 ]` rồi ném `ReferenceError`', correct: true },
      { content: 'In `[ 1, 2 ]` rồi `[ undefined, 3 ]`' },
      { content: 'Ném `ReferenceError` ngay ở lời gọi `f(1)`' },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: `Với đoạn code dưới đây, những phát biểu nào đúng?

\`\`\`js
class Btn {
  label = 'OK';
  a() { return this.label; }
  b = () => this.label;
}
const btn = new Btn();
const x = { label: 'X' };
\`\`\``,
    options: [
      { content: '`btn.b.call(x)` trả về `\'X\'`' },
      { content: '`btn.a.bind(x).bind(btn)()` trả về `\'X\'`', correct: true },
      { content: '`Btn.prototype.b` là `undefined`', correct: true },
      { content: '`new Btn().a === new Btn().a` là `false`' },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: `Cho hai hàm tạo promise dưới đây. Những phát biểu nào đúng?

\`\`\`js
const ok = (v, ms) => new Promise((r) => setTimeout(() => r(v), ms));
const fail = (ms) =>
  new Promise((_, j) => setTimeout(() => j(new Error('x')), ms));
\`\`\``,
    options: [
      { content: '`Promise.all([ok(1, 100), fail(50)])` reject sau ~50 ms', correct: true },
      { content: 'Khi `Promise.all` reject, timer của `ok(1, 100)` bị huỷ và không chạy' },
      { content: '`Promise.allSettled([ok(1, 100), fail(50)])` fulfilled sau ~100 ms', correct: true },
      { content: '`Promise.any([fail(50), fail(80)])` reject với chính `Error(\'x\')` đến sớm nhất' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Hai dòng nào được in ra (không xét thứ tự)?

\`\`\`js
async function load() {
  throw new Error('boom');
}
async function a() {
  try { return load(); } catch { return 'a bắt'; }
}
async function b() {
  try { return await load(); } catch { return 'b bắt'; }
}
a().then((v) => console.log(v), (e) => console.log('a reject', e.message));
b().then((v) => console.log(v), (e) => console.log('b reject', e.message));
\`\`\``,
    options: [
      { content: '`a bắt` và `b bắt`' },
      { content: '`a reject boom` và `b reject boom`' },
      { content: '`a bắt` và `b reject boom`' },
      { content: '`a reject boom` và `b bắt`', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Node in ra gì?

\`\`\`js
const values = [null, undefined, 0, '', NaN, false];
console.log(values.map((v) => v == null));
\`\`\``,
    options: [
      { content: '`[ true, true, true, true, true, true ]`' },
      { content: '`[ true, true, false, false, false, false ]`', correct: true },
      { content: '`[ true, false, false, false, false, false ]`' },
      { content: '`[ true, true, true, true, false, true ]`' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: 'Mỗi dòng dưới đây được chạy riêng, trong Node.js hiện đại. Dòng nào ném `TypeError`?',
    options: [
      { content: '`const [a, b] = new Set([1, 1, 2]);`' },
      { content: '`const { x } = 5;`' },
      { content: '`const [y] = { 0: \'a\', length: 1 };`', correct: true },
      { content: '`(function () { const [c] = arguments; })(1);`' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`js
class Person {
  constructor() {
    this.first = 'An';
    this.last = 'Lê';
  }
  get full() { return \`\${this.first} \${this.last}\`; }
}
const p = new Person();
const copy = { ...p };
console.log(p.full, copy.full, JSON.stringify(p));
\`\`\``,
    options: [
      { content: '`An Lê An Lê {"first":"An","last":"Lê","full":"An Lê"}`' },
      { content: '`An Lê undefined {"first":"An","last":"Lê"}`', correct: true },
      { content: '`An Lê An Lê {"first":"An","last":"Lê"}`' },
      { content: '`An Lê undefined {"first":"An","last":"Lê","full":"An Lê"}`' },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: `Hai file ES module dưới đây. Những phát biểu nào đúng?

\`\`\`js
// counter.mjs
export let count = 0;
export function inc() { count++; }

// main.mjs
import { count, inc } from './counter.mjs';
inc();
console.log(count);
\`\`\``,
    options: [
      { content: 'Viết lại bằng CommonJS (`module.exports = { count, inc }`, `const { count, inc } = require(...)`) thì vẫn in `1`' },
      { content: '`main.mjs` in ra `1` dù `count` được import trước khi `inc()` chạy', correct: true },
      { content: 'Module khác cũng `import` `counter.mjs` thì thân `counter.mjs` chạy thêm một lần nữa' },
      { content: 'Thêm dòng `count = 5;` vào `main.mjs` thì ném `TypeError` khi chạy dòng đó', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`js
function f() {
  let x = 1;
  try { return x; } finally { x = 2; }
}
function g() {
  try { return 'try'; } finally { return 'finally'; }
}
console.log(f(), g());
\`\`\``,
    options: [
      { content: '`1 try`' },
      { content: '`2 finally`' },
      { content: '`2 try`' },
      { content: '`1 finally`', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: `Với đoạn code dưới đây, những phát biểu nào đúng?

\`\`\`js
function Dog() {}
Dog.prototype.speak = function () { return 'gâu'; };
const a = new Dog();
Dog.prototype = { speak() { return 'meo'; } };
const b = new Dog();
\`\`\``,
    options: [
      { content: '`a.speak()` trả về `\'gâu\'`', correct: true },
      { content: '`b.speak()` trả về `\'gâu\'`' },
      { content: '`a instanceof Dog` là `false`', correct: true },
      { content: '`b.constructor === Dog` là `true`' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`js
const arr = [NaN, -0];
console.log(
  arr.indexOf(NaN),
  arr.includes(NaN),
  arr.includes(0),
  Object.is(arr[1], 0),
);
\`\`\``,
    options: [
      { content: '`0 true false false`' },
      { content: '`-1 true true false`', correct: true },
      { content: '`-1 false true true`' },
      { content: '`0 true true true`' },
    ],
  },
];
