import type { SkillSeedQuestion } from '../types.ts';

// 13 easy · 14 medium · 13 hard; 9 câu multiple_choice.
// Đáp án đối chiếu nodejs.org/api + docs.npmjs.com và chạy thử trên Node 24 (2026-11-04).
// Vị trí đúng và độ dài đáp án rải có chủ ý (validateBank strict kiểm).
export const NODEJS: SkillSeedQuestion[] = [
  // ───── easy (13) ─────
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `File \`a.txt\` tồn tại. Đoạn code sau in ra theo thứ tự nào?

\`\`\`js
const fs = require('node:fs');
console.log('1');
fs.readFile('a.txt', 'utf8', () => console.log('2'));
console.log('3');
\`\`\``,
    options: [
      { content: '`1 2 3`, vì `readFile` đọc xong file rồi mới chạy dòng kế tiếp' },
      { content: '`1 3 2`, vì callback chạy sau khi code đồng bộ đã chạy hết', correct: true },
      { content: '`1 2 3` khi file nhỏ, `1 3 2` khi file đủ lớn để đọc lâu' },
      { content: '`2 1 3`, vì Node ưu tiên chạy callback I/O trước code đồng bộ' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Chạy \`PORT=8080 node app.js\` trong bash. \`app.js\` in ra gì?

\`\`\`js
const port = process.env.PORT || 3000;
console.log(port + 1);
\`\`\``,
    options: [
      { content: '`8081`, vì Node tự đổi biến môi trường dạng số sang number' },
      { content: '`3001`, vì `process.env` đọc biến từ file `.env`, không đọc từ shell' },
      { content: '`80801`, vì giá trị lấy từ `process.env` là chuỗi', correct: true },
      { content: '`NaN`, vì cộng chuỗi `"8080"` với số `1` là phép tính không hợp lệ' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: '`package.json` của dự án có `"type": "module"`. File `app.js` bắt đầu bằng `const fs = require(\'fs\');`. Chạy `node app.js` thì sao?',
    options: [
      { content: 'Chạy bình thường, vì Node tự đổi `require` thành `import` khi nạp file' },
      { content: 'Lỗi `ReferenceError: require is not defined`, vì `app.js` được nạp như ES module', correct: true },
      { content: 'Chạy được nhưng in cảnh báo, vì `require` bị deprecated khi bật ES module' },
      { content: 'Lỗi không tìm thấy module, vì ES module bắt buộc viết `\'node:fs\'`' },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: `\`package.json\` có đoạn dưới đây. Những lệnh nào (chạy ở thư mục dự án) thực thi đúng script tương ứng?

\`\`\`json
"scripts": {
  "dev": "nodemon src/server.js",
  "test": "vitest run"
}
\`\`\``,
    options: [
      { content: '`npm run dev`, vì script tự đặt tên được chạy qua `npm run`', correct: true },
      { content: '`npm dev`, vì npm tự nhận ra tên script trong `package.json`' },
      { content: '`npx dev`, vì `npx` chạy các script khai báo trong `package.json`' },
      { content: '`npm test`, vì `test` là script có lệnh tắt riêng của npm', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Server chạy một process Node. Request \`/slow\` tới ở mốc 0s, \`/fast\` tới ở mốc 1s. \`/fast\` nhận được phản hồi vào lúc nào?

\`\`\`js
const http = require('node:http');
http.createServer((req, res) => {
  if (req.url === '/slow') {
    const start = Date.now();
    while (Date.now() - start < 5000) {}
  }
  res.end('ok');
}).listen(3000);
\`\`\``,
    options: [
      { content: 'Khoảng mốc 1s, vì mỗi request được Node xử lý trên một thread riêng' },
      { content: 'Khoảng mốc 1s, vì event loop tự tạm dừng vòng `while` để phục vụ request mới' },
      { content: 'Khoảng mốc 5s, vì vòng `while` chiếm thread chạy JavaScript tới khi xong', correct: true },
      { content: 'Bị từ chối ngay với `ECONNREFUSED`, vì server đang bận không nhận kết nối mới' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`js
const buf = Buffer.from('Node');
buf[0] = 0x6e; // mã của chữ 'n'
console.log(buf.toString());
\`\`\``,
    options: [
      { content: '`Node`, vì Buffer bất biến giống chuỗi JavaScript' },
      { content: '`node`, vì Buffer là dãy byte có thể sửa tại chỗ', correct: true },
      { content: '`110ode`, vì số gán vào được ghi thành chữ số trong Buffer' },
      { content: 'Lỗi `TypeError`, vì phần tử Buffer không gán lại được' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`js
const EventEmitter = require('node:events');
const e = new EventEmitter();
e.once('x', () => console.log('A'));
e.on('x', () => console.log('B'));
e.emit('x');
e.emit('x');
\`\`\``,
    options: [
      { content: '`A B A B`' },
      { content: '`A B`' },
      { content: '`B A B`' },
      { content: '`A B B`', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Dự án có `/project/src/app.js` và `/project/src/data.json`. Trong `app.js` (đã `require(\'node:fs\')`) có `fs.readFileSync(\'data.json\', \'utf8\')`. Đứng ở `/project` chạy `node src/app.js`. Kết quả là gì?',
    options: [
      { content: 'Đọc được, vì đường dẫn tương đối tính từ thư mục chứa `app.js`' },
      { content: 'Đọc được, vì Node tìm file ở thư mục hiện tại rồi tới các thư mục con' },
      { content: 'Lỗi `ENOENT`, vì đường dẫn tương đối tính từ `process.cwd()` là `/project`', correct: true },
      { content: 'Lỗi `EINVAL`, vì `readFileSync` không nhận đường dẫn tương đối' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `File \`a.txt\` chứa chữ \`hello\`. File \`main.mjs\` in ra gì?

\`\`\`js
import { readFile } from 'node:fs/promises';
const text = readFile('a.txt', 'utf8');
console.log(text);
\`\`\``,
    options: [
      { content: '`hello`' },
      { content: '`undefined`' },
      { content: '`<Buffer 68 65 6c 6c 6f>`' },
      { content: '`Promise { <pending> }`', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: '`package.json` khai báo `"express": "^4.18.2"` và chưa có lockfile. Những phiên bản nào nằm trong khoảng được phép cài?',
    options: [
      { content: '`4.17.3`' },
      { content: '`4.21.2`', correct: true },
      { content: '`5.0.1`' },
      { content: '`4.18.3`', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Client gọi \`const r = await fetch('http://localhost:3000'); const text = await r.text();\` tới server dưới đây. Chuyện gì xảy ra ở client?

\`\`\`js
const http = require('node:http');
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('Hello');
}).listen(3000);
\`\`\``,
    options: [
      { content: '`text` là `"Hello"`, vì Node tự kết thúc response khi handler chạy xong' },
      { content: '`fetch` bị reject ngay, vì thiếu `res.end()` là vi phạm giao thức HTTP' },
      { content: '`r.text()` treo tới khi hết thời gian chờ, vì response chưa được kết thúc', correct: true },
      { content: '`text` là chuỗi rỗng, vì `res.write` không gửi gì khi thiếu `res.end()`' },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: '`p` trỏ tới một file không tồn tại, `fs` là `node:fs`, `fsp` là `node:fs/promises`, code nằm trong một hàm `async`. Những cách nào thực sự bắt được lỗi đọc file, không để process crash?',
    options: [
      { content: '`fs.readFile(p, (err, data) => { if (err) return handle(err); /* ... */ })`', correct: true },
      { content: '`try { fs.readFile(p, (err) => { if (err) throw err; }) } catch (e) { handle(e) }`' },
      { content: '`try { await fsp.readFile(p) } catch (e) { handle(e) }`', correct: true },
      { content: '`try { fsp.readFile(p) } catch (e) { handle(e) }`' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'CI xác định pass/fail theo exit code và cần fail khi cấu hình sai. Bước CI chạy `node check.js`; script phát hiện cấu hình sai, gọi `console.error(\'Config lỗi\')` rồi chạy hết và kết thúc bình thường. Kết quả và cách xử lý đúng?',
    options: [
      { content: 'Fail, vì ghi ra stderr làm exit code tự chuyển thành 1; không cần sửa' },
      { content: 'Fail, vì `console.error` ném lỗi làm process dừng giữa chừng; không cần sửa' },
      { content: 'Pass, vì exit code vẫn là 0; cần thêm `return 1` ở cuối script' },
      { content: 'Pass, vì exit code vẫn là 0; cần đặt `process.exitCode = 1`', correct: true },
    ],
  },

  // ───── medium (14) ─────
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `\`app.js\` in ra gì?

\`\`\`js
// math.js
exports = { add: (a, b) => a + b };

// app.js
const math = require('./math');
console.log(math);
\`\`\``,
    options: [
      { content: '`{ add: [Function: add] }`, vì `exports` và `module.exports` là cùng một biến' },
      { content: '`{}`, vì gán lại `exports` không làm thay đổi `module.exports`', correct: true },
      { content: '`undefined`, vì `math.js` không gán gì cho `module.exports`' },
      { content: 'Lỗi `TypeError`, vì `exports` là hằng, không gán lại được' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `File CommonJS \`main.js\`, chạy \`node main.js\`. Thứ tự in ra là gì?

\`\`\`js
setImmediate(() => console.log('immediate'));
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('tick'));
console.log('sync');
\`\`\``,
    options: [
      { content: '`sync` → `immediate` → `tick` → `promise`' },
      { content: '`sync` → `promise` → `tick` → `immediate`' },
      { content: '`sync` → `tick` → `promise` → `immediate`', correct: true },
      { content: '`tick` → `sync` → `immediate` → `promise`' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: 'Một route cho tải về file log ~1.5 GB, có thể 20 người tải cùng lúc (các hàm đã import từ `node:fs`, `node:fs/promises`, `node:stream`). Cách viết handler nào phù hợp nhất?',
    options: [
      { content: '`pipeline(createReadStream(path), res, onDone)`, vì có backpressure và tự huỷ stream khi lỗi', correct: true },
      { content: '`res.end(await readFile(path))`, vì đọc bằng promise nên không chặn event loop' },
      { content: '`res.end(readFileSync(path))`, vì đọc một lần nhanh hơn đọc thành nhiều lần' },
      { content: '`createReadStream(path).on(\'data\', (c) => res.write(c)).on(\'end\', () => res.end())`, vì mỗi lần giữ một chunk trong bộ nhớ' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Đoạn code sau in ra theo thứ tự nào?

\`\`\`js
const EventEmitter = require('node:events');
const bus = new EventEmitter();
bus.on('saved', () => console.log('listener'));
console.log('before');
bus.emit('saved');
console.log('after');
\`\`\``,
    options: [
      { content: '`before`, `after`, `listener`, vì `emit` đưa listener vào hàng đợi' },
      { content: '`listener`, `before`, `after`, vì listener đăng ký trước nên chạy trước' },
      { content: 'Thứ tự không cố định, vì listener chạy trên một thread khác' },
      { content: '`before`, `listener`, `after`, vì `emit` gọi các listener đồng bộ', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: '`package.json` vừa đổi thành `"ms": "^1.0.0"` nhưng `package-lock.json` vẫn khoá `ms@2.1.3`. Trên CI (thư mục sạch), những phát biểu nào đúng?',
    options: [
      { content: '`npm ci` báo lỗi và dừng, vì `package.json` không khớp lockfile', correct: true },
      { content: '`npm ci` bỏ qua `package.json`, cài đúng `ms@2.1.3` theo lockfile đã khoá' },
      { content: 'Nếu đổi sang `npm install`, lockfile được cập nhật và cài `ms@1.x`', correct: true },
      { content: '`npm ci` tự sửa lockfile theo `package.json` rồi cài `ms@1.x`, giống `npm install`' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `\`app.js\` in ra gì?

\`\`\`js
// counter.js
let count = 0;
module.exports = () => ++count;

// app.js
const a = require('./counter');
const b = require('./counter');
a();
console.log(b());
\`\`\``,
    options: [
      { content: '`2`, vì module được cache nên `a` và `b` là cùng một hàm', correct: true },
      { content: '`1`, vì mỗi lần `require` lại chạy `counter.js` từ đầu' },
      { content: '`NaN`, vì `count` bị giải phóng sau khi `counter.js` chạy xong' },
      { content: 'Lỗi `ReferenceError`, vì `count` không được export nên hàm không đọc được' },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: `Sau đoạn code, những phát biểu nào đúng?

\`\`\`js
const a = Buffer.from('abcd');
const b = Buffer.from(a);
const c = a.subarray(0, 2);
const d = Buffer.allocUnsafe(1024);
a[0] = 0x7a; // mã của chữ 'z'
\`\`\``,
    options: [
      { content: '`b.toString()` là `zbcd`, vì `Buffer.from(buffer)` dùng chung vùng nhớ với `a`' },
      { content: 'Nội dung của `d` không xác định, vì `allocUnsafe` không xoá vùng nhớ được cấp', correct: true },
      { content: '`d` gồm toàn byte 0, vì Node xoá trắng Buffer mới trước khi trả về' },
      { content: '`c.toString()` là `zb`, vì `subarray` dùng chung vùng nhớ với `a`', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: 'File ES module `src/load.mjs` cần đường dẫn thư mục chứa chính nó để đọc `data.json` nằm cạnh (Node LTS hiện hành; `path` và `fileURLToPath` của `node:url` đã import). Những cách nào cho đúng đường dẫn thư mục?',
    options: [
      { content: '`import.meta.dirname`', correct: true },
      { content: '`__dirname`' },
      { content: '`path.dirname(import.meta.url)`' },
      { content: '`path.dirname(fileURLToPath(import.meta.url))`', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`js
process.on('exit', (code) => {
  console.log('exit', code);
  setTimeout(() => console.log('cleanup'), 0);
});
console.log('main');
\`\`\``,
    options: [
      { content: '`main`, `exit 0`, `cleanup`, vì timer 0ms vẫn kịp chạy trước khi thoát' },
      { content: '`main`, `exit 0`, vì sau các listener `\'exit\'` process thoát, timer bị bỏ', correct: true },
      { content: '`main`, `cleanup`, `exit 0`, vì timer được ưu tiên trước sự kiện `\'exit\'`' },
      { content: '`exit 0`, `main`, vì listener `\'exit\'` chạy ngay khi được đăng ký' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Client gửi POST với body \`{"a":1}\` và header \`Content-Type: application/json\`. Server (chỉ dùng \`node:http\`) in ra gì?

\`\`\`js
const http = require('node:http');
http.createServer((req, res) => {
  console.log(req.body);
  res.end('ok');
}).listen(3000);
\`\`\``,
    options: [
      { content: '`{ a: 1 }`, vì Node tự parse body JSON dựa vào `Content-Type`' },
      { content: '`\'{"a":1}\'`, vì Node gom body thành chuỗi trước khi gọi handler' },
      { content: '`undefined`, vì body phải tự đọc từ stream `req`', correct: true },
      { content: '`<Buffer 7b 22 61 22 3a 31 7d>`, vì body thô được gắn sẵn dạng Buffer' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Theo khuyến nghị trong tài liệu Node.js, cách viết dưới đây có vấn đề gì?

\`\`\`js
import { access, readFile } from 'node:fs/promises';

async function loadConfig(p) {
  try {
    await access(p);
  } catch {
    return null; // file không tồn tại
  }
  return readFile(p, 'utf8');
}
\`\`\``,
    options: [
      { content: '`access` mặc định kiểm tra cả quyền ghi, nên file read-only cũng bị coi là không tồn tại' },
      { content: '`access` ném lỗi đồng bộ nên `try/catch` quanh `await` không bắt được' },
      { content: 'Thiếu `await` trước `readFile` nên lỗi đọc file không tới được nơi gọi' },
      { content: 'Có race: file bị xoá giữa `access` và `readFile` vẫn ném lỗi; nên đọc thẳng rồi bắt lỗi', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: 'Thư mục dự án có file `.env` chứa `DB_URL=postgres://...`, dự án không cài `dotenv`. `app.js` có `console.log(process.env.DB_URL)`. Chạy `node app.js` thì in gì, và sửa thế nào?',
    options: [
      { content: '`undefined`; chạy `node --env-file=.env app.js` để Node nạp file', correct: true },
      { content: 'In ra URL, vì Node tự nạp file `.env` trong thư mục hiện tại' },
      { content: '`undefined`; đổi tên file thành `.env.local` để Node tự nạp' },
      { content: '`undefined`; thêm `"envFile": ".env"` vào `package.json` để Node tự nạp' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Khi có request tới, chuyện gì xảy ra?

\`\`\`js
const http = require('node:http');
http.createServer((req, res) => {
  res.write('Hello');
  res.setHeader('X-Request-Id', 'abc');
  res.end();
}).listen(3000);
\`\`\``,
    options: [
      { content: '`setHeader` ném `ERR_HTTP_HEADERS_SENT`, vì `write` đã gửi header đi', correct: true },
      { content: 'Response có header `X-Request-Id`, vì header được gom tới khi `res.end()`' },
      { content: 'Header bị bỏ qua lặng lẽ, response vẫn kết thúc bình thường' },
      { content: '`res.write` ném lỗi, vì phải gọi `writeHead` trước khi ghi body' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Giả sử \`db.findUser(null, cb)\` gọi \`cb(null, undefined)\` một cách bất đồng bộ. Đoạn code in ra gì?

\`\`\`js
function getUser(id, cb) {
  if (!id) cb(new Error('missing id'));
  db.findUser(id, cb);
}
getUser(null, (err, user) => console.log(err ? 'error' : user));
\`\`\``,
    options: [
      { content: '`error` rồi `undefined`, vì thiếu `return` nên `cb` bị gọi hai lần', correct: true },
      { content: 'Chỉ `error`, vì callback nhận lỗi thì hàm `getUser` tự dừng lại' },
      { content: 'Chỉ `undefined`, vì lời gọi `cb` sau ghi đè lời gọi trước' },
      { content: 'Ném `Error: missing id`, vì `cb(new Error())` tương đương `throw`' },
    ],
  },

  // ───── hard (13) ─────
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `File ES module \`main.mjs\`, chạy \`node main.mjs\`. Thứ tự in ra là gì?

\`\`\`js
setTimeout(() => console.log('timeout'), 0);
process.nextTick(() => console.log('tick'));
Promise.resolve().then(() => console.log('promise'));
console.log('sync');
\`\`\``,
    options: [
      { content: '`sync` → `tick` → `promise` → `timeout`' },
      { content: '`sync` → `promise` → `tick` → `timeout`', correct: true },
      { content: '`sync` → `timeout` → `promise` → `tick`' },
      { content: '`tick` → `sync` → `promise` → `timeout`' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Đoạn code sau in ra theo thứ tự nào?

\`\`\`js
const fs = require('node:fs');
fs.readFile(__filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
  process.nextTick(() => console.log('tick'));
});
\`\`\``,
    options: [
      { content: '`tick`, `timeout`, `immediate`, vì pha timers đứng trước pha check trong mỗi vòng' },
      { content: '`tick`, sau đó `timeout` và `immediate` theo thứ tự không xác định' },
      { content: '`immediate`, `tick`, `timeout`, vì `setImmediate` chạy ngay khi được gọi' },
      { content: '`tick`, `immediate`, `timeout`, vì sau pha poll là pha check, timers ở vòng sau', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Dòng \`timeout\` có được in ra không?

\`\`\`js
let n = 0;
function spin() {
  n++;
  process.nextTick(spin);
}
setTimeout(() => console.log('timeout', n), 10);
spin();
\`\`\``,
    options: [
      { content: 'Không bao giờ, vì hàng đợi `nextTick` không cạn nên event loop không sang pha timers', correct: true },
      { content: 'Có, sau khoảng 10ms, vì timer được chen vào giữa các tick; lúc đó `n` rất lớn' },
      { content: 'Có, sau khi Node tự chặn chuỗi đệ quy ở 1000 tick theo giới hạn `process.maxTickDepth`' },
      { content: 'Không, vì process ném `RangeError: Maximum call stack size exceeded` gần như ngay' },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: 'Nén file bằng hai cách: (1) `src.pipe(zlib.createGzip()).pipe(dest)`; (2) `stream.pipeline(src, zlib.createGzip(), dest, cb)`. Những phát biểu nào đúng?',
    options: [
      { content: '`.pipe()` chuyển tiếp lỗi của `src` sang `dest`, nên chỉ cần gắn listener `\'error\'` ở stream cuối' },
      { content: 'Với `.pipe()`, lỗi ở `src` không tự đóng `dest`; phải tự xử lý lỗi và đóng từng stream', correct: true },
      { content: 'Khi `dest` lỗi giữa chừng, `.pipe()` tự huỷ `src` nên không rò file descriptor' },
      { content: 'Khi một stream lỗi, `pipeline` huỷ các stream chưa kết thúc và gọi `cb(err)`', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Vấn đề chính của đoạn code sau là gì?

\`\`\`js
const fs = require('node:fs');
const out = fs.createWriteStream('big.txt');
for (let i = 0; i < 1e7; i++) {
  out.write(\`line \${i}\\n\`);
}
out.end();
\`\`\``,
    options: [
      { content: 'Mất dữ liệu, vì `write()` bỏ các chunk vượt quá `highWaterMark`' },
      { content: 'Bộ nhớ phình to, vì `write()` trả `false` mà vòng lặp vẫn ghi vào bộ đệm', correct: true },
      { content: 'Chạy chậm nhưng an toàn, vì `write()` chặn vòng lặp khi bộ đệm đầy' },
      { content: 'Các dòng bị lộn thứ tự, vì các lệnh `write()` hoàn tất không theo thứ tự' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Máy 8 lõi đang rảnh, Node chạy với cấu hình mặc định. Mỗi \`pbkdf2\` mất khoảng T ms (T ≈ 800); chạy một mình, \`readFile\` này chỉ mất vài ms. Hai dòng in ra có dạng nào?

\`\`\`js
const crypto = require('node:crypto');
const { readFile } = require('node:fs/promises');
const start = Date.now();
for (let i = 0; i < 4; i++) {
  crypto.pbkdf2('pw', 'salt', 1e6, 64, 'sha512', () => {});
}
readFile(__filename).then(() => console.log('read', Date.now() - start));
setTimeout(() => console.log('timer', Date.now() - start), 10);
\`\`\``,
    options: [
      { content: '`timer` đúng hẹn, `read` xong ngay, vì đọc file dùng I/O bất đồng bộ của OS, không qua thread pool' },
      { content: '`timer` và `read` đều trễ tới ~T, vì `pbkdf2` nặng CPU nên chặn event loop tới khi xong' },
      { content: '`timer` đúng hẹn, `read` trễ tới ~T, vì `fs` dùng chung thread pool đang bị `pbkdf2` chiếm hết', correct: true },
      { content: '`timer` trễ tới ~T, `read` xong ngay, vì I/O được ưu tiên còn timer chờ tác vụ CPU xong' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Cổng 3000 đang bị một process khác chiếm. Chạy đoạn code sau thì kết quả là gì?

\`\`\`js
const http = require('node:http');
const handler = (req, res) => res.end();
const server = http.createServer(handler);
try {
  server.listen(3000);
  console.log('started');
} catch (err) {
  console.log('port busy');
}
\`\`\``,
    options: [
      { content: 'In `port busy`, vì `listen` ném `EADDRINUSE` và `try/catch` bắt được' },
      { content: 'In `started`, rồi server tự chuyển sang lắng nghe ở cổng 3001' },
      { content: 'In `started`, server vẫn chạy nhưng không nhận được request nào' },
      { content: 'In `started`, rồi process crash vì sự kiện `\'error\'` không có listener', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Chạy bằng Node LTS hiện hành, không truyền flag nào. Kết quả là gì?

\`\`\`js
async function job() {
  throw new Error('boom');
}
job();
setTimeout(() => console.log('still alive'), 100);
\`\`\``,
    options: [
      { content: 'In cảnh báo `UnhandledPromiseRejectionWarning`, sau đó in `still alive`' },
      { content: 'In `still alive`, lỗi bị bỏ qua lặng lẽ vì không có ai `await` promise' },
      { content: 'In `still alive` rồi mới crash, khi event loop không còn việc gì để làm' },
      { content: 'Process crash với exit code 1, `still alive` không được in ra', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: '`package.json` có `"tiny-lib": "^0.4.2"`, chưa có lockfile. Registry có các bản `0.4.9`, `0.5.0`, `1.0.0` (tag `latest`). `npm install` cài bản nào?',
    options: [
      { content: '`0.4.9`, vì `^0.4.2` nghĩa là `>=0.4.2 <0.5.0`', correct: true },
      { content: '`0.5.0`, vì `^0.4.2` nghĩa là `>=0.4.2 <1.0.0`' },
      { content: '`1.0.0`, vì `^0.4.2` nghĩa là mọi bản `>=0.4.2`' },
      { content: '`0.4.2`, vì major 0 khiến `^0.4.2` thành `=0.4.2`' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Server nhận body JSON UTF-8 tiếng Việt, gửi thành nhiều chunk TCP. Đa số request ổn, nhưng thỉnh thoảng tên bị lẫn ký tự \`�\` còn \`JSON.parse\` vẫn không lỗi. Nguyên nhân và cách sửa?

\`\`\`js
let body = '';
req.on('data', (chunk) => { body += chunk; });
req.on('end', () => save(JSON.parse(body)));
\`\`\``,
    options: [
      { content: '`+=` giải mã Buffer bằng `latin1`; đổi thành `body += chunk.toString(\'utf8\')` là hết lỗi' },
      { content: 'Chunk bị cắt giữa ký tự nhiều byte rồi giải mã riêng; gọi `req.setEncoding(\'utf8\')` trước khi đọc', correct: true },
      { content: 'Thiếu `charset=utf-8` ở `Content-Type` nên Node giải mã sai; bắt client gửi đủ header là hết lỗi' },
      { content: '`JSON.parse` làm hỏng ký tự ngoài ASCII; bắt client gửi body đã qua `encodeURIComponent`' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Máy 8 lõi đang rảnh, Node chạy với cấu hình mặc định. Một lần \`pbkdf2\` như dưới mất khoảng T ms khi chạy một mình. Các mốc thời gian in ra có dạng nào?

\`\`\`js
const crypto = require('node:crypto');
const start = Date.now();
for (let i = 0; i < 8; i++) {
  crypto.pbkdf2('pw', 'salt', 1e6, 64, 'sha512', () => {
    console.log(i, Date.now() - start);
  });
}
\`\`\``,
    options: [
      { content: 'Cả 8 dòng ~T, vì máy 8 lõi chạy song song cả 8 tác vụ' },
      { content: 'Lần lượt ~T, 2T, …, 8T, vì JavaScript chỉ chạy trên một thread' },
      { content: '4 dòng ~T rồi 4 dòng ~2T, vì thread pool libuv mặc định có 4 thread', correct: true },
      { content: 'Cả 8 dòng ~8T, vì 8 tác vụ chia nhau thời gian của một thread' },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: 'Main thread gửi dữ liệu cho worker bằng `worker.postMessage(value, transferList)` (`node:worker_threads`). Những phát biểu nào đúng?',
    options: [
      { content: 'Object được sao chép theo structured clone; worker sửa nó không ảnh hưởng main', correct: true },
      { content: '`Uint8Array` gửi không kèm `transferList` dùng chung vùng nhớ với main, worker ghi vào là main thấy' },
      { content: 'Gửi object có thuộc tính là hàm sẽ ném lỗi `DataCloneError`', correct: true },
      { content: 'Instance của class sang worker vẫn giữ prototype, nên worker gọi được method của class đó' },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: `Dự án có \`"type": "module"\`, cạnh \`app.js\` có hai file CommonJS dưới đây. Những câu import nào đặt trong \`app.js\` chạy được?

\`\`\`js
// legacy.cjs
exports.helper = () => 'ok';

// factory.cjs
function makeApi() {
  return { run: () => 'ran' };
}
module.exports = makeApi();
\`\`\``,
    options: [
      { content: "`import { run } from './factory.cjs'` rồi gọi `run()`" },
      { content: "`import legacy from './legacy.cjs'` rồi gọi `legacy.helper()`", correct: true },
      { content: "`import { helper } from './legacy.cjs'` rồi gọi `helper()`", correct: true },
      { content: "`import { helper } from './legacy'` rồi gọi `helper()`" },
    ],
  },
];
