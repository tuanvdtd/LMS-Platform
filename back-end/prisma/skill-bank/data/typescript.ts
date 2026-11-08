import type { SkillSeedQuestion } from '../types.ts';

// 13 easy · 14 medium · 13 hard; 10 câu multiple_choice.
// Mọi đáp án đã được biên dịch thử bằng TypeScript 6.0.3 (`tsc --strict`) và đối chiếu typescriptlang.org (2026-11-04).
// Vị trí đúng và độ dài đáp án rải có chủ ý (validateBank strict kiểm).
export const TYPESCRIPT: SkillSeedQuestion[] = [
  // ───── easy (13) ─────
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Với \`strict: true\`, những dòng nào bị TypeScript báo lỗi?

\`\`\`ts
const a: any = JSON.parse('"hi"');
const u: unknown = JSON.parse('"hi"');
a.toUpperCase();        // (1)
u.toUpperCase();        // (2)
const s1: string = a;   // (3)
const s2: string = u;   // (4)
\`\`\``,
    options: [
      { content: 'Chỉ dòng (2)' },
      { content: 'Dòng (2) và (4)', correct: true },
      { content: 'Dòng (1), (2) và (4)' },
      { content: 'Dòng (2), (3) và (4)' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Hàm dưới đây bị báo lỗi ở \`v.toFixed(2)\`. Yêu cầu: số thì làm tròn 2 chữ số, chuỗi thì trả nguyên. Thân hàm nào vừa hết lỗi biên dịch vừa chạy đúng với cả hai kiểu?

\`\`\`ts
function format(v: string | number): string {
  return v.toFixed(2);
}
\`\`\``,
    options: [
      { content: "`return v instanceof Number ? v.toFixed(2) : v;`" },
      { content: '`return (v as number).toFixed(2);`' },
      { content: "`return typeof v === 'number' ? v.toFixed(2) : v;`", correct: true },
      { content: '`return Number.isFinite(v) ? v.toFixed(2) : v;`' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Kết quả kiểm tra kiểu của hai lời gọi \`send\` là gì?

\`\`\`ts
type Method = 'GET' | 'POST';
function send(m: Method) {}

let a = 'GET';
const b = 'GET';
send(a);
send(b);
\`\`\``,
    options: [
      { content: '`send(a)` lỗi, `send(b)` hợp lệ', correct: true },
      { content: '`send(b)` lỗi, `send(a)` hợp lệ' },
      { content: 'Cả hai lời gọi đều lỗi' },
      { content: 'Cả hai lời gọi đều hợp lệ' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Với \`strict: true\`, đoạn code sau thế nào?

\`\`\`ts
function greet(name?: string) {
  return 'Hi ' + name.toUpperCase();
}
\`\`\``,
    options: [
      { content: 'Biên dịch được; gọi `greet()` trả về `"Hi UNDEFINED"`' },
      { content: 'Biên dịch được; `?` cho phép bỏ đối số khi gọi, trong thân hàm `name` vẫn là `string`' },
      { content: 'Lỗi biên dịch: tham số có `?` cần giá trị mặc định mới dùng được trong thân hàm' },
      { content: 'Lỗi biên dịch: `name` có kiểu `string | undefined`, không gọi thẳng `.toUpperCase()` được', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: `Những câu lệnh nào đặt trong thân hàm \`act\` biên dịch không lỗi?

\`\`\`ts
type Cat = { name: string; meow(): void };
type Dog = { name: string; bark(): void };

function act(p: Cat | Dog) {
  // ...
}
\`\`\``,
    options: [
      { content: '`console.log(p.name);`', correct: true },
      { content: '`p.meow();`' },
      { content: "`if ('meow' in p) p.meow();`", correct: true },
      { content: '`if (p.meow !== undefined) p.meow();`' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Kiểu suy ra của \`items\` là gì, và dòng thứ hai có lỗi không?

\`\`\`ts
const items = [1, 'two'];
items.push(true);
\`\`\``,
    options: [
      { content: '`[number, string]`, và `push(true)` bị báo lỗi' },
      { content: '`(string | number)[]`, và `push(true)` bị báo lỗi', correct: true },
      { content: '`any[]`, và `push(true)` hợp lệ' },
      { content: '`readonly [number, string]`, và `push` không tồn tại' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Đoạn code biên dịch không lỗi. Khi chạy, nó in ra gì?

\`\`\`ts
const n: number = JSON.parse('"5"');
console.log(typeof n, n + 1);
\`\`\``,
    options: [
      { content: '`number 6`' },
      { content: '`number 51`' },
      { content: '`string 51`', correct: true },
      { content: 'Ném `TypeError` vì giá trị không khớp kiểu `number`' },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: `Những phép gán nào biên dịch không lỗi?

\`\`\`ts
type HasId = { id: number };
type HasName = { name: string };
type A = HasId | HasName;
type B = HasId & HasName;
\`\`\``,
    options: [
      { content: "`const x: B = { id: 1, email: 'a@b.c' };`" },
      { content: "`const x: A = { name: 'An' };`", correct: true },
      { content: "`const x: B = { name: 'An' };`" },
      { content: "`const x: B = { id: 1, name: 'An' };`", correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Kiểu của \`x\` là gì?

\`\`\`ts
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
const x = first(['a', 'b']);
\`\`\``,
    options: [
      { content: '`T | undefined`' },
      { content: '`"a" | "b" | undefined`' },
      { content: '`unknown`' },
      { content: '`string | undefined`', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: `Với \`strict: true\` (không bật \`exactOptionalPropertyTypes\`), những lời gọi nào bị báo lỗi?

\`\`\`ts
interface User { id: number; name: string; email: string }
function update(id: number, patch: Partial<User>) {}
\`\`\``,
    options: [
      { content: '`update(1, {})`' },
      { content: '`update(1)`', correct: true },
      { content: "`update(1, { id: '2' })`", correct: true },
      { content: '`update(1, { email: undefined })`' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Biết `let i = 0` đã được khai báo trước. Hàm nào dưới đây biên dịch không lỗi với kiểu trả về `never`?',
    options: [
      { content: "`(): never => { throw new Error('x'); }`", correct: true },
      { content: "`(): never => { console.error('Lỗi nghiêm trọng'); }`" },
      { content: '`(): never => { return; }`' },
      { content: '`(): never => { while (i < 3) i++; }`' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: "Cho `let pair: [string, number] = ['age', 30];`. Câu lệnh nào sau đó bị báo lỗi?",
    options: [
      { content: "`pair = ['x', 1];`" },
      { content: '`pair[1] = 31;`' },
      { content: "`pair = [30, 'age'];`", correct: true },
      { content: "`pair[0] = 'full name';`" },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Kiểu nào KHÔNG khai báo được bằng `interface` mà phải dùng `type`?',
    options: [
      { content: 'Kiểu hàm nhận `number` và trả về `string`' },
      { content: 'Kiểu mã định danh là `string` hoặc `number`', correct: true },
      { content: 'Kiểu có index signature `[key: string]: number`' },
      { content: 'Kiểu hàm có hai chữ ký overload' },
    ],
  },

  // ───── medium (14) ─────
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: `Những câu lệnh nào đặt trong thân hàm \`show\` biên dịch không lỗi?

\`\`\`ts
type Result =
  | { ok: true; value: number }
  | { ok: false; error: string };

function show(r: Result) {
  // ...
}
\`\`\``,
    options: [
      { content: '`console.log(r.value ?? r.error);`' },
      { content: '`if (r.ok) console.log(r.value);`', correct: true },
      { content: "`if ('value' in r) console.log(r.error);`" },
      { content: '`console.log(r.ok ? r.value : r.error);`', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: `Những phát biểu nào đúng?

\`\`\`ts
const ROLES = ['admin', 'editor', 'viewer'] as const;
type Role = (typeof ROLES)[number];
\`\`\``,
    options: [
      { content: '`Role` là `"admin" | "editor" | "viewer"`', correct: true },
      { content: "`ROLES.push('guest')` hợp lệ, vì `as const` khoá kiểu của từng phần tử" },
      { content: 'Khi chạy, `ROLES` bị đóng băng giống như khi gọi `Object.freeze`' },
      { content: 'Nếu bỏ `as const` thì `Role` chỉ còn là `string`', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Kết quả kiểm tra kiểu là gì?

\`\`\`ts
function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const user = { id: 1, name: 'An', active: true };
const a = pluck(user, 'name');
const b = pluck(user, 'email');
\`\`\``,
    options: [
      { content: '`a` có kiểu `string | number | boolean`; dòng của `b` báo lỗi' },
      { content: '`a` có kiểu `string`; dòng của `b` báo lỗi', correct: true },
      { content: '`a` có kiểu `string`; `b` có kiểu `undefined`' },
      { content: '`a` và `b` đều có kiểu `unknown`' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Kết quả kiểm tra kiểu của lời gọi \`parse(v)\` là gì?

\`\`\`ts
function parse(x: string): string[];
function parse(x: number): number[];
function parse(x: string | number) {
  return typeof x === 'string' ? x.split(',') : [x];
}

declare const v: string | number;
parse(v);
\`\`\``,
    options: [
      { content: 'Trả về `string[] | number[]`, gộp từ hai overload' },
      { content: 'Trả về `string[]`, vì overload đầu tiên được thử trước' },
      { content: 'Báo lỗi: không overload nào nhận `string | number`', correct: true },
      { content: 'Trả về `(string | number)[]`, theo chữ ký cài đặt' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Những dòng nào bị báo lỗi?

\`\`\`ts
type Theme = { primary: string; radius: number };

const a = { primary: '#000' } satisfies Theme; // (1)
const b = { primary: '#000' } as Theme;        // (2)
const c: Theme = { primary: '#000' };          // (3)
\`\`\``,
    options: [
      { content: 'Chỉ (3)' },
      { content: 'Cả (1), (2) và (3)' },
      { content: 'Chỉ (1) và (2)' },
      { content: 'Chỉ (1) và (3)', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Với \`strict: true\`, kết quả biên dịch là gì?

\`\`\`ts
function size(x: string[] | string | null) {
  if (typeof x === 'object') {
    return x.length;
  }
  return x.length;
}
\`\`\``,
    options: [
      { content: 'Không lỗi: hai nhánh đã tách riêng mảng và chuỗi' },
      { content: 'Lỗi ở `return` thứ nhất: `x` có thể là `null`', correct: true },
      { content: 'Lỗi ở `return` thứ hai: `x` có thể là `null`' },
      { content: 'Lỗi ở cả hai `return`: `x` có thể là `null`' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Với \`strict: true\` (\`input\` là \`string\`), kết quả biên dịch là gì?

\`\`\`ts
try {
  JSON.parse(input);
} catch (e) {
  console.log(e.message);
}
\`\`\``,
    options: [
      { content: 'Lỗi: `e` có kiểu `unknown`, phải thu hẹp trước khi dùng', correct: true },
      { content: 'Không lỗi: biến của `catch` có kiểu `Error`' },
      { content: 'Không lỗi: biến của `catch` có kiểu `any`' },
      { content: 'Lỗi: phải viết `catch (e: Error)` mới đọc được `message`' },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: 'Những phát biểu nào đúng khi so sánh `interface` và `type`?',
    options: [
      { content: '`type` tạo được kiểu đệ quy (như cây), còn `interface` thì không' },
      { content: 'Class có thể `implements` một `type` mô tả object', correct: true },
      { content: "Với `User` có `id: number`, `type X = User & { id: string }` không báo lỗi, `X['id']` là `never`", correct: true },
      { content: '`interface` có thể `extends` một `type` là union của các object' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Những dòng nào bị báo lỗi?

\`\`\`ts
type Cfg = Readonly<{
  name: string;
  tags: string[];
  db: { host: string };
}>;
declare const c: Cfg;

c.name = 'x';       // (1)
c.tags.push('y');   // (2)
c.db.host = 'z';    // (3)
\`\`\``,
    options: [
      { content: 'Cả (1), (2) và (3)' },
      { content: 'Chỉ (1) và (3)' },
      { content: 'Chỉ (1)', correct: true },
      { content: 'Chỉ (1) và (2)' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Với \`strict: true\` (không bật \`noUncheckedIndexedAccess\`), kết quả là gì?

\`\`\`ts
const stock: Record<string, number> = { apple: 3 };
const n = stock.banana;
console.log(n.toFixed(1));
\`\`\``,
    options: [
      { content: 'Lỗi biên dịch: `banana` không phải khoá có trong `stock`' },
      { content: 'Lỗi biên dịch: `n` có thể là `undefined`' },
      { content: 'Biên dịch được; khi chạy ném `TypeError`', correct: true },
      { content: 'Biên dịch được; khi chạy in ra `NaN`' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Những phép gán nào bị báo lỗi?

\`\`\`ts
type Cb = (item: string, index: number) => void;

const a: Cb = (item) => console.log(item);                        // (1)
const b: Cb = (item: string, index: number, arr: string[]) => {}; // (2)
const c: Cb = (item) => item.length;                              // (3)
\`\`\``,
    options: [
      { content: 'Chỉ (2)', correct: true },
      { content: 'Chỉ (2) và (3)' },
      { content: 'Chỉ (1) và (2)' },
      { content: 'Chỉ (3)' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Kết quả biên dịch là gì?

\`\`\`ts
type Status = 'idle' | 'loading' | 'done';

function text(s: Status): string {
  switch (s) {
    case 'idle': return 'Chờ';
    case 'loading': return 'Đang tải';
    default: {
      const check: never = s;
      return check;
    }
  }
}
\`\`\``,
    options: [
      { content: 'Không lỗi; TypeScript bỏ qua nhánh `default` vì `s` đã được thu hẹp hết' },
      { content: 'Lỗi tại `const check: never = s`: `"done"` không gán được cho `never`', correct: true },
      { content: 'Lỗi tại `return check`: `never` không gán được cho `string`' },
      { content: "Lỗi ở chữ ký hàm: thiếu `return` cho trường hợp `'done'`" },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Với \`strict: true\`, kết quả biên dịch là gì?

\`\`\`ts
const user = { name: 'An', age: 20 };
Object.keys(user).forEach((k) => {
  console.log(user[k]);
});
\`\`\``,
    options: [
      { content: 'Không lỗi: `k` có kiểu `"name" | "age"`' },
      { content: 'Không lỗi: `user[k]` có kiểu `string | number`' },
      { content: 'Lỗi: `Object.keys` yêu cầu đối số kiểu `Record<string, unknown>`' },
      { content: 'Lỗi: `k` có kiểu `string`, không phải `keyof typeof user`', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Kết quả biên dịch là gì?

\`\`\`ts
function padTo<T extends { length: number }>(value: T, size: number): T {
  if (value.length >= size) return value;
  return { length: size };
}
\`\`\``,
    options: [
      { content: 'Không lỗi, vì object `{ length: size }` thoả mãn ràng buộc `{ length: number }`' },
      { content: 'Lỗi ở `value.length`: không đọc được thuộc tính của tham số generic' },
      { content: 'Lỗi ở `return { length: size }`: `T` do nơi gọi quyết định, ví dụ `string`', correct: true },
      { content: 'Không lỗi, nhưng kiểu trả về bị nới thành `{ length: number }`' },
    ],
  },

  // ───── hard (13) ─────
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: `Những phát biểu nào đúng?

\`\`\`ts
type ToArray<T> = T extends unknown ? T[] : never;
type ToArrayND<T> = [T] extends [unknown] ? T[] : never;
\`\`\``,
    options: [
      { content: '`ToArray<string | number>` là `string[] | number[]`', correct: true },
      { content: '`ToArrayND<string | number>` là `string[] | number[]`' },
      { content: '`ToArray<boolean>` là `boolean[]`' },
      { content: '`ToArray<never>` là `never`', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `\`R\` là kiểu gì?

\`\`\`ts
type Ret<F> = F extends (...args: any[]) => infer R ? R : never;

declare function load(id: number): Promise<string>;
declare function load(ids: number[]): Promise<string[]>;

type R = Awaited<Ret<typeof load>>;
\`\`\``,
    options: [
      { content: '`string`' },
      { content: '`string[]`', correct: true },
      { content: '`string | string[]`' },
      { content: '`never`' },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: `Những lời gọi nào bị báo lỗi?

\`\`\`ts
interface Point { x: number; y: number }
function draw(p: Point) {}
const extra = { x: 1, y: 2, z: 3 };
\`\`\``,
    options: [
      { content: '`draw({ x: 1, y: 2, z: 3 })`', correct: true },
      { content: '`draw({ ...extra })`' },
      { content: '`draw({ x: 1, y: 2, z: 3 } as Point)`' },
      { content: '`draw({ ...extra, w: 4 })`', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Với \`strict: true\` (có \`strictFunctionTypes\`), những dòng nào bị báo lỗi?

\`\`\`ts
type Animal = { name: string };
type Dog = Animal & { bark(): void };

interface A { handle(a: Animal): void }
interface B { handle: (a: Animal) => void }
const onlyDogs = (d: Dog) => d.bark();

const a: A = { handle: onlyDogs }; // (1)
const b: B = { handle: onlyDogs }; // (2)
\`\`\``,
    options: [
      { content: 'Cả (1) và (2)' },
      { content: 'Chỉ (1)' },
      { content: 'Không dòng nào' },
      { content: 'Chỉ (2)', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `\`K1\` và \`K2\` là kiểu gì?

\`\`\`ts
type A = { id: number; name: string };
type B = { id: number; price: number };
type K1 = keyof (A | B);
type K2 = keyof (A & B);
\`\`\``,
    options: [
      { content: '`K1` là `"id"`, `K2` là `"id" | "name" | "price"`', correct: true },
      { content: '`K1` là `"id" | "name" | "price"`, `K2` là `"id"`' },
      { content: 'Cả hai đều là `"id" | "name" | "price"`' },
      { content: 'Cả hai đều là `"id"`' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Với \`strict: true\`, những dòng nào bị báo lỗi?

\`\`\`ts
function track(user: { email?: string }, ids: number[]) {
  const email = user.email;
  if (!user.email || !email) return;
  ids.forEach(() => {
    console.log(user.email.length); // (1)
    console.log(email.length);      // (2)
  });
}
\`\`\``,
    options: [
      { content: 'Cả (1) và (2)' },
      { content: 'Không dòng nào' },
      { content: 'Chỉ (1)', correct: true },
      { content: 'Chỉ (2)' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `\`P\` và \`K\` là kiểu gì?

\`\`\`ts
type Route = { path: string; auth: boolean };

const routes = {
  home: { path: '/', auth: false },
  admin: { path: '/admin', auth: true },
} as const satisfies Record<string, Route>;

type P = typeof routes.admin.path;
type K = keyof typeof routes;
\`\`\``,
    options: [
      { content: '`P` là `string`, `K` là `string`' },
      { content: '`P` là `"/admin"`, `K` là `"home" | "admin"`', correct: true },
      { content: '`P` là `"/admin"`, `K` là `string`' },
      { content: '`P` là `string`, `K` là `"home" | "admin"`' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Với \`strict: true\`, \`M\` tương đương kiểu nào?

\`\`\`ts
type Src = { readonly id: number; name?: string };
type M = { -readonly [K in keyof Src]-?: Src[K] };
\`\`\``,
    options: [
      { content: '`{ id: number; name: string }`', correct: true },
      { content: '`{ id: number; name: string | undefined }`' },
      { content: '`{ readonly id: number; name: string }`' },
      { content: '`{ id: number; name?: string }`' },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: 'Những phát biểu nào đúng về việc gộp khai báo (declaration merging) của `interface`?',
    options: [
      { content: '`interface Box` gộp được với một `type Box` cùng tên trong cùng phạm vi' },
      { content: 'Hai khai báo cùng có thuộc tính `width` nhưng khác kiểu thì báo lỗi', correct: true },
      { content: 'Phương thức trùng tên được gộp thành overload, nhóm của khai báo viết sau đứng trước', correct: true },
      { content: 'Trong file module, khai báo `interface Window { v: string }` thì mở rộng được `Window` toàn cục' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Những dòng nào bị báo lỗi?

\`\`\`ts
interface IUser { name: string }
type TUser = { name: string };
declare const i: IUser;
declare const t: TUser;

const r1: Record<string, string> = i; // (1)
const r2: Record<string, string> = t; // (2)
\`\`\``,
    options: [
      { content: 'Cả (1) và (2)' },
      { content: 'Chỉ (2)' },
      { content: 'Chỉ (1)', correct: true },
      { content: 'Không dòng nào' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Với \`strict: true\`, những dòng nào bị báo lỗi?

\`\`\`ts
type P = { readonly x: number };
type M = { x: number };
declare const p: P;
declare const ro: readonly number[];
declare const rw: number[];

const m: M = p;                     // (1)
const arr: number[] = ro;           // (2)
const back: readonly number[] = rw; // (3)
\`\`\``,
    options: [
      { content: 'Chỉ (1) và (2)' },
      { content: 'Chỉ (1)' },
      { content: 'Chỉ (3)' },
      { content: 'Chỉ (2)', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Với \`strict: true\`, kết quả là gì?

\`\`\`ts
const nums: number[] = [1, 2];
const xs: (number | string)[] = nums;
xs.push('3');
console.log(nums.length, typeof nums[2]);
\`\`\``,
    options: [
      { content: 'Biên dịch được; in ra `3 string`', correct: true },
      { content: 'Biên dịch được; in ra `2 undefined`' },
      { content: 'Lỗi biên dịch ở dòng khai báo `xs`' },
      { content: "Lỗi biên dịch ở `xs.push('3')`" },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: `Với \`strict: true\`, những phát biểu nào đúng?

\`\`\`ts
class A { x = 1 }
class B { x = 2 }
class P { private x = 1 }
class Q { private x = 1 }
\`\`\``,
    options: [
      { content: '`const b: B = new A();` biên dịch được', correct: true },
      { content: '`const q: Q = new P();` biên dịch được' },
      { content: '`const a: A = { x: 5 };` biên dịch được', correct: true },
      { content: 'Sau `const a: A = { x: 5 };`, biểu thức `a instanceof A` là `true`' },
    ],
  },
];
