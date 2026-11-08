import type { SkillSeedQuestion } from '../types.ts';

// 13 easy · 14 medium · 13 hard; 9 câu multiple_choice. Ngữ nghĩa theo PostgreSQL (docs/current).
// Đáp án kiểm theo postgresql.org/docs (2026-11-05). Vị trí đúng và độ dài đáp án rải có chủ ý (validateBank strict kiểm).
export const SQL: SkillSeedQuestion[] = [
  // ───── easy (13) ─────
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Bảng `users` có cột `phone` cho phép NULL. Truy vấn nào lấy đúng những người dùng chưa có số điện thoại (`phone` là NULL)?',
    options: [
      { content: "`SELECT * FROM users WHERE phone = NULL;`" },
      { content: "`SELECT * FROM users WHERE phone IS NULL;`", correct: true },
      { content: "`SELECT * FROM users WHERE phone = '';`" },
      { content: "`SELECT * FROM users WHERE phone IN (NULL);`" },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Truy vấn sau trả về tên theo thứ tự nào?

\`\`\`sql
-- students(name, class, score):
-- ('An', 'A', 8), ('Bình', 'B', 9), ('Chi', 'A', 9), ('Dũng', 'B', 7)
SELECT name FROM students
ORDER BY class, score DESC;
\`\`\``,
    options: [
      { content: 'Chi, Bình, An, Dũng' },
      { content: 'Bình, Dũng, Chi, An' },
      { content: 'Chi, An, Bình, Dũng', correct: true },
      { content: 'An, Chi, Dũng, Bình' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Truy vấn sau trả về bao nhiêu dòng?

\`\`\`sql
-- customers(id, name): (1, 'An'), (2, 'Bình'), (3, 'Chi')
-- orders(id, customer_id): (10, 1), (11, 1), (12, 2)
SELECT c.name, o.id
FROM customers c
JOIN orders o ON o.customer_id = c.id;
\`\`\``,
    options: [
      { content: '2 dòng' },
      { content: '3 dòng', correct: true },
      { content: '4 dòng' },
      { content: '9 dòng' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Bảng `orders(customer_id, amount)`. Cần liệt kê các khách hàng có **tổng** giá trị đơn hàng lớn hơn 1000. Truy vấn nào đúng?',
    options: [
      { content: '`SELECT customer_id, SUM(amount) FROM orders WHERE amount > 1000 GROUP BY customer_id;`' },
      { content: '`SELECT customer_id, SUM(amount) FROM orders WHERE SUM(amount) > 1000 GROUP BY customer_id;`' },
      { content: '`SELECT customer_id, SUM(amount) FROM orders GROUP BY customer_id HAVING amount > 1000;`' },
      { content: '`SELECT customer_id, SUM(amount) FROM orders GROUP BY customer_id HAVING SUM(amount) > 1000;`', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: 'Bảng `orders` có 10 triệu dòng; cột `orders.customer_id` khai báo `REFERENCES customers(id)` (`customers.id` là khoá chính). Truy vấn `SELECT * FROM orders WHERE customer_id = 42` chạy rất chậm, `EXPLAIN` cho thấy Seq Scan trên `orders`. Cách xử lý hợp lý nhất?',
    options: [
      { content: 'Tạo index trên `orders(customer_id)`, vì khoá ngoại không tự tạo index', correct: true },
      { content: 'Tạo thêm index trên `customers(id)` để việc so khớp khoá ngoại nhanh hơn' },
      { content: 'Thêm `ORDER BY customer_id` để PostgreSQL tìm theo thứ tự đã sắp' },
      { content: 'Chạy `ANALYZE orders`, vì khoá ngoại đã tự có index trên `orders.customer_id`' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Khách hàng \`id = 1\` đang có 2 đơn trong \`orders\`. Lệnh \`DELETE\` cuối cho kết quả gì?

\`\`\`sql
CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT REFERENCES customers(id)
);

DELETE FROM customers WHERE id = 1;
\`\`\``,
    options: [
      { content: 'Lệnh báo lỗi vi phạm khoá ngoại, khách hàng 1 vẫn còn', correct: true },
      { content: 'Khách hàng 1 bị xoá, 2 đơn hàng của họ cũng bị xoá theo' },
      { content: 'Khách hàng 1 bị xoá, `customer_id` của 2 đơn chuyển thành NULL' },
      { content: 'Khách hàng 1 bị xoá, 2 đơn vẫn giữ nguyên `customer_id = 1`' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Truy vấn sau trả về bao nhiêu dòng?

\`\`\`sql
-- locations(city, country):
-- ('Hà Nội', 'VN'), ('Hà Nội', 'VN'), ('Paris', 'FR'), ('Paris', 'US')
SELECT DISTINCT city, country FROM locations;
\`\`\``,
    options: [
      { content: '2 dòng' },
      { content: '3 dòng', correct: true },
      { content: '4 dòng' },
      { content: 'Báo lỗi, vì `DISTINCT` chỉ áp dụng cho một cột' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Chạy liên tiếp hai câu lệnh sau trong cùng một phiên (database không có bảng nào tên \`big_orders\`). Câu lệnh thứ hai cho kết quả gì?

\`\`\`sql
WITH big_orders AS (
  SELECT * FROM orders WHERE amount > 1000
)
SELECT COUNT(*) FROM big_orders;

SELECT AVG(amount) FROM big_orders;
\`\`\``,
    options: [
      { content: 'Chạy được, dùng lại kết quả CTE đã tính ở câu thứ nhất' },
      { content: 'Chạy được, PostgreSQL tính lại CTE từ bảng `orders`' },
      { content: 'Báo lỗi: quan hệ `big_orders` không tồn tại', correct: true },
      { content: 'Chạy được nếu cả hai câu nằm trong cùng một transaction' },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: 'Bảng `customers(id, name)` và `orders(id, customer_id)`; một khách có thể có nhiều đơn. Cần liệt kê những khách đã có ít nhất một đơn, **mỗi khách đúng một dòng**. Những truy vấn nào đúng?',
    options: [
      { content: '`SELECT * FROM customers WHERE id IN (SELECT customer_id FROM orders);`', correct: true },
      { content: '`SELECT c.* FROM customers c JOIN orders o ON o.customer_id = c.id;`' },
      { content: '`SELECT * FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);`', correct: true },
      { content: '`SELECT * FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id IS NOT NULL);`' },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: "Trong PostgreSQL (collation mặc định), những giá trị `name` nào thoả điều kiện `name LIKE 'an%'`?",
    options: [
      { content: "`'Ana'`" },
      { content: "`'anh'`", correct: true },
      { content: "`'Lan'`" },
      { content: "`'an'`", correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: 'Bảng `customers(id, name)` và `orders(id, customer_id)`; có khách chưa có đơn nào. Mệnh đề `FROM` nào cho kết quả chứa **mọi** khách hàng, kể cả khách chưa có đơn?',
    options: [
      { content: '`FROM customers c LEFT JOIN orders o ON o.customer_id = c.id`', correct: true },
      { content: '`FROM orders o LEFT JOIN customers c ON o.customer_id = c.id`' },
      { content: '`FROM customers c INNER JOIN orders o ON o.customer_id = c.id`' },
      { content: '`FROM orders o RIGHT JOIN customers c ON o.customer_id = c.id`', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Q1 và Q2 lần lượt trả về bao nhiêu dòng?

\`\`\`sql
-- t1(x): 1, 2, 2        t2(x): 2, 3
SELECT x FROM t1 UNION     SELECT x FROM t2;  -- Q1
SELECT x FROM t1 UNION ALL SELECT x FROM t2;  -- Q2
\`\`\``,
    options: [
      { content: '3 và 5', correct: true },
      { content: '4 và 5' },
      { content: '1 và 5' },
      { content: '5 và 5' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Truy vấn sau trả về những dòng nào?

\`\`\`sql
-- products(name, category, price):
-- ('Sách A', 'book', 50), ('Sách B', 'book', 5),
-- ('Bút C', 'pen', 3), ('Bút D', 'pen', 20)
SELECT name FROM products
WHERE category = 'book' OR category = 'pen' AND price < 10;
\`\`\``,
    options: [
      { content: 'Sách B, Bút C' },
      { content: 'Bút C' },
      { content: 'Sách A, Sách B, Bút C, Bút D' },
      { content: 'Sách A, Sách B, Bút C', correct: true },
    ],
  },

  // ───── medium (14) ─────
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Bảng \`employees\` có 5 dòng: 3 người phòng \`'IT'\`, 2 người phòng \`'HR'\`. Truy vấn sau trả về bao nhiêu dòng?

\`\`\`sql
SELECT name, dept,
       AVG(salary) OVER (PARTITION BY dept) AS dept_avg
FROM employees;
\`\`\``,
    options: [
      { content: '1 dòng' },
      { content: '2 dòng' },
      { content: '5 dòng', correct: true },
      { content: 'Báo lỗi, vì `name` không có trong `GROUP BY`' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Bảng \`products\` có dòng \`(id = 1, price = 100)\`. Hai phiên chạy với cấu hình mặc định của PostgreSQL. Phiên B nhận được gì?

\`\`\`sql
-- Phiên A
BEGIN;
UPDATE products SET price = 200 WHERE id = 1;
-- (A chưa COMMIT)

-- Phiên B, chạy lúc A chưa kết thúc
SELECT price FROM products WHERE id = 1;
\`\`\``,
    options: [
      { content: 'Trả về 100 ngay, không phải chờ', correct: true },
      { content: 'Trả về 200 ngay, không phải chờ' },
      { content: 'Bị chặn đến khi A COMMIT hoặc ROLLBACK' },
      { content: 'Báo lỗi vì dòng đang bị A khoá' },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: `Trong PostgreSQL, ghép mệnh đề nào vào chỗ \`...\` thì câu lệnh chạy được?

\`\`\`sql
-- orders(id, created_at, amount)
SELECT date_trunc('month', created_at) AS m,
       SUM(amount) AS total
FROM orders
...
\`\`\``,
    options: [
      { content: '`GROUP BY m HAVING total > 1000`' },
      { content: '`GROUP BY m ORDER BY total DESC`', correct: true },
      { content: "`WHERE m >= '2026-01-01' GROUP BY m`" },
      { content: '`GROUP BY 1 ORDER BY 2 DESC`', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Trong PostgreSQL, truy vấn sau trả về theo thứ tự nào?

\`\`\`sql
-- products(name, rating): ('A', 5), ('B', NULL), ('C', 3)
SELECT name FROM products ORDER BY rating DESC;
\`\`\``,
    options: [
      { content: 'A, C, B' },
      { content: 'B, A, C', correct: true },
      { content: 'A, C (dòng có `rating` NULL bị loại)' },
      { content: 'Báo lỗi vì không so sánh được NULL' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Truy vấn sau trả về gì?

\`\`\`sql
-- orders(customer_id, amount):
-- (1, 40), (1, 120), (2, 60), (2, 70), (3, 200)
SELECT customer_id, SUM(amount) AS total
FROM orders
WHERE amount > 50
GROUP BY customer_id
HAVING COUNT(*) >= 2;
\`\`\``,
    options: [
      { content: '`(2, 130)`', correct: true },
      { content: '`(1, 120)`, `(2, 130)`' },
      { content: '`(1, 160)`, `(2, 130)`' },
      { content: 'Báo lỗi vì `amount` không có trong `GROUP BY`' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Truy vấn sau trả về gì?

\`\`\`sql
-- tags(name): 'sql', 'sql', 'js', NULL, NULL
SELECT COUNT(*), COUNT(name), COUNT(DISTINCT name) FROM tags;
\`\`\``,
    options: [
      { content: '5, 3, 3' },
      { content: '5, 5, 3' },
      { content: '3, 3, 2' },
      { content: '5, 3, 2', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Truy vấn sau trả về những tên nào?

\`\`\`sql
-- employees(name, dept, salary):
-- ('An', 'IT', 10), ('Bình', 'IT', 40), ('Chi', 'IT', 70),
-- ('Dũng', 'HR', 20), ('Em', 'HR', 30)
SELECT name FROM employees e
WHERE salary > (SELECT AVG(salary) FROM employees
                WHERE dept = e.dept);
\`\`\``,
    options: [
      { content: 'Bình, Chi' },
      { content: 'Chi' },
      { content: 'Chi, Em', correct: true },
      { content: 'Báo lỗi vì subquery trả về nhiều hơn một dòng' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Truy vấn sau trả về những giá trị \`n\` nào?

\`\`\`sql
WITH RECURSIVE t(n) AS (
  SELECT 1
  UNION ALL
  SELECT n * 2 FROM t WHERE n < 10
)
SELECT n FROM t;
\`\`\``,
    options: [
      { content: '1, 2, 4, 8' },
      { content: '1, 2, 4, 8, 16', correct: true },
      { content: '2, 4, 8' },
      { content: '1, 2, 4, 8, 16, 32' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Dòng của Dũng có \`(rn, rk, drk)\` là gì?

\`\`\`sql
-- scores(name, score): ('An', 90), ('Bình', 85), ('Chi', 85), ('Dũng', 80)
SELECT name,
       ROW_NUMBER() OVER (ORDER BY score DESC) AS rn,
       RANK()       OVER (ORDER BY score DESC) AS rk,
       DENSE_RANK() OVER (ORDER BY score DESC) AS drk
FROM scores;
\`\`\``,
    options: [
      { content: '(4, 3, 3)' },
      { content: '(4, 3, 4)' },
      { content: '(4, 4, 4)' },
      { content: '(4, 4, 3)', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Truy vấn sau trả về \`(total_amount, total_paid)\` là gì?

\`\`\`sql
-- orders(id, amount): (1, 100), (2, 50)
-- payments(order_id, paid): (1, 60), (1, 40), (2, 50)
SELECT SUM(o.amount) AS total_amount,
       SUM(p.paid)   AS total_paid
FROM orders o
JOIN payments p ON p.order_id = o.id;
\`\`\``,
    options: [
      { content: '(150, 150)' },
      { content: '(150, 110)' },
      { content: '(250, 150)', correct: true },
      { content: '(250, 250)' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Bảng \`stock(sku PRIMARY KEY, qty)\` đang có \`('A', 10)\`. Sau lệnh sau, \`qty\` của \`'A'\` là bao nhiêu?

\`\`\`sql
INSERT INTO stock (sku, qty) VALUES ('A', 5)
ON CONFLICT (sku) DO UPDATE
SET qty = stock.qty + EXCLUDED.qty;
\`\`\``,
    options: [
      { content: '5' },
      { content: '10' },
      { content: '20' },
      { content: '15', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: `Chạy lần lượt trong psql (mặc định, không bật \`ON_ERROR_ROLLBACK\`). Bảng \`accounts\` có \`CHECK (balance >= 0)\`, đang có \`(1, 500)\` và \`(2, 100)\`. Những phát biểu nào đúng?

\`\`\`sql
BEGIN;
UPDATE accounts SET balance = balance + 200 WHERE id = 1; -- thành công
UPDATE accounts SET balance = balance - 300 WHERE id = 2; -- vi phạm CHECK
SELECT balance FROM accounts WHERE id = 1;
COMMIT;
\`\`\``,
    options: [
      { content: 'Lệnh `SELECT` bị từ chối, báo transaction hiện tại đã bị huỷ (aborted)', correct: true },
      { content: 'Lệnh `SELECT` trả về 700, vì PostgreSQL chỉ huỷ riêng lệnh bị lỗi' },
      { content: 'Sau `COMMIT`, số dư của tài khoản 1 vẫn là 500', correct: true },
      { content: 'Sau `COMMIT`, số dư của tài khoản 1 là 700, vì lệnh UPDATE đó đã thành công' },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: 'Bảng `users` lớn, chỉ có một index `CREATE INDEX ON users (email);` (B-tree mặc định). Với điều kiện `WHERE` nào, planner có thể dùng index này để tìm nhanh (làm Index Cond)?',
    options: [
      { content: "`WHERE lower(email) = 'an@company.vn'`" },
      { content: "`WHERE email = 'an@company.vn'`", correct: true },
      { content: "`WHERE email IN ('a@x.vn', 'b@x.vn')`", correct: true },
      { content: "`WHERE email LIKE '%@company.vn'`" },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: "Bảng `orders` có 1 triệu dòng, index B-tree trên `status`, thống kê vừa được `ANALYZE`, planner dùng cấu hình mặc định. Khoảng 95% dòng có `status = 'done'`, 1% có `status = 'pending'`. Với `SELECT * FROM orders WHERE status = ...` theo từng giá trị, planner nhiều khả năng chọn gì?",
    options: [
      { content: "`'done'` và `'pending'` đều dùng index, vì cột `status` trong `WHERE` đã có index" },
      { content: "`'done'`: Seq Scan; `'pending'`: dùng index (Index Scan hoặc Bitmap Heap Scan)", correct: true },
      { content: "`'done'` và `'pending'` đều Seq Scan, vì `status` có quá ít giá trị khác nhau" },
      { content: "`'done'`: Bitmap Heap Scan vì khớp nhiều dòng; `'pending'`: Index Scan vì khớp ít dòng" },
    ],
  },

  // ───── hard (13) ─────
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Q1 và Q2 lần lượt trả về gì?

\`\`\`sql
-- customers(id): 1, 2, 3
-- orders(customer_id): 1, NULL   -- NULL: đơn của khách vãng lai
-- Q1
SELECT id FROM customers
WHERE id NOT IN (SELECT customer_id FROM orders);
-- Q2
SELECT id FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
\`\`\``,
    options: [
      { content: 'Q1: 2, 3 — Q2: 2, 3' },
      { content: 'Q1: không dòng nào — Q2: 2, 3', correct: true },
      { content: 'Q1: 2, 3 — Q2: không dòng nào' },
      { content: 'Q1: không dòng nào — Q2: không dòng nào' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Q1 và Q2 lần lượt trả về bao nhiêu dòng?

\`\`\`sql
-- customers(id, name): (1, 'An'), (2, 'Bình'), (3, 'Chi')
-- orders(id, customer_id, status):
--   (10, 1, 'paid'), (11, 1, 'cancelled'), (12, 2, 'cancelled')
-- Q1
SELECT c.name, o.id FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.status = 'paid';
-- Q2
SELECT c.name, o.id FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid';
\`\`\``,
    options: [
      { content: 'Q1: 3 dòng — Q2: 3 dòng' },
      { content: 'Q1: 1 dòng — Q2: 1 dòng' },
      { content: 'Q1: 1 dòng — Q2: 3 dòng', correct: true },
      { content: 'Q1: 3 dòng — Q2: 1 dòng' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Trong PostgreSQL, điều gì xảy ra khi chạy Q1 và Q2?

\`\`\`sql
-- customers(id PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT)
-- Q1
SELECT c.id, c.name, COUNT(o.id)
FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id;
-- Q2
SELECT c.email, c.name, COUNT(o.id)
FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.email;
\`\`\``,
    options: [
      { content: 'Cả hai đều báo lỗi vì `c.name` không có trong `GROUP BY`' },
      { content: 'Cả hai đều chạy được vì `id` và `email` đều xác định duy nhất một khách' },
      { content: 'Q1 chạy được; Q2 cũng chạy được nhưng `c.name` lấy từ một dòng bất kỳ của nhóm' },
      { content: 'Q1 chạy được; Q2 báo lỗi vì `c.name` không có trong `GROUP BY`', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Cột \`running\` của hai dòng có \`day = 2\` nhận giá trị gì?

\`\`\`sql
-- sales(day, amount): (1, 10), (2, 20), (2, 30), (3, 40)
SELECT day, amount,
       SUM(amount) OVER (ORDER BY day) AS running
FROM sales;
\`\`\``,
    options: [
      { content: 'Cả hai dòng đều là 60', correct: true },
      { content: 'Một dòng là 30, dòng còn lại là 60' },
      { content: 'Cả hai dòng đều là 100' },
      { content: 'Cả hai dòng đều là 50' },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: 'Bảng `employees(id, name, dept, salary NOT NULL)`; trong mỗi phòng không có hai người cùng lương cao nhất. Những truy vấn nào trả về đúng người lương cao nhất của **mỗi** phòng (mỗi phòng một dòng)?',
    options: [
      { content: '`SELECT id, dept, name, salary FROM employees WHERE ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) = 1`' },
      { content: '`SELECT DISTINCT ON (dept) dept, name, salary FROM employees ORDER BY salary DESC, dept`' },
      { content: '`SELECT DISTINCT ON (dept) dept, name, salary FROM employees ORDER BY dept, salary DESC`', correct: true },
      { content: '`SELECT * FROM (SELECT *, RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS r FROM employees) t WHERE r = 1`', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Câu \`SELECT\` chính trả về gì, và sau lệnh này giá trong bảng là bao nhiêu?

\`\`\`sql
-- products có một dòng (id = 1, price = 100)
WITH t AS (
  UPDATE products SET price = price * 2 WHERE id = 1
  RETURNING price
)
SELECT price FROM products WHERE id = 1;
\`\`\``,
    options: [
      { content: 'Trả về 200; giá trong bảng sau đó là 200' },
      { content: 'Trả về 100; giá trong bảng vẫn là 100 vì `t` không được dùng' },
      { content: 'Trả về 100; giá trong bảng sau đó là 200', correct: true },
      { content: 'Báo lỗi vì CTE `t` không được tham chiếu trong câu chính' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Bảng \`users(id SERIAL PRIMARY KEY, email TEXT UNIQUE)\` đang có dòng \`(7, 'a@x.com')\`. Lệnh sau trả về gì?

\`\`\`sql
INSERT INTO users (email) VALUES ('a@x.com')
ON CONFLICT (email) DO NOTHING
RETURNING id;
\`\`\``,
    options: [
      { content: 'Một dòng `id = 7`, là id của dòng đang có' },
      { content: 'Một dòng có `id` là NULL' },
      { content: 'Lỗi duplicate key, vì `RETURNING` cần một dòng được chèn' },
      { content: 'Không có dòng nào', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Bảng \`counters\` có dòng \`(id = 1, n = 5)\`. Hai phiên dùng READ COMMITTED (mặc định), chạy theo thứ tự thời gian dưới đây. Điều gì xảy ra với lệnh của B và giá trị \`n\` cuối cùng?

\`\`\`sql
-- Phiên A
BEGIN;
UPDATE counters SET n = n + 1 WHERE id = 1;
-- Phiên B (autocommit), chạy khi A chưa COMMIT
UPDATE counters SET n = n + 1 WHERE id = 1;
-- Phiên A
COMMIT;
\`\`\``,
    options: [
      { content: 'B chờ A commit, rồi cập nhật trên bản mới của dòng; n = 7', correct: true },
      { content: 'B chạy ngay trên giá trị đã commit n = 5 và ghi 6; cuối cùng n = 6' },
      { content: 'B chờ A commit, rồi báo lỗi could not serialize access; n = 6' },
      { content: 'B chạy ngay trên bản chưa commit của A (n = 6) và ghi 7; n = 7' },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: `Bảng \`accounts\` có \`(id = 1, balance = 100)\`. Hai phiên chạy theo thứ tự thời gian dưới đây. Những phát biểu nào đúng?

\`\`\`sql
-- Phiên A (isolation mặc định)
BEGIN;
SELECT balance FROM accounts WHERE id = 1;   -- 100
-- Phiên B (autocommit)
UPDATE accounts SET balance = 50 WHERE id = 1;
-- Phiên A
SELECT balance FROM accounts WHERE id = 1;   -- ?
\`\`\``,
    options: [
      { content: 'Lần `SELECT` thứ hai của A trả về 50', correct: true },
      { content: 'Lần `SELECT` thứ hai của A vẫn trả về 100, vì cùng một transaction' },
      { content: 'Nếu A mở bằng `BEGIN ISOLATION LEVEL REPEATABLE READ`, lần `SELECT` thứ hai trả về 100', correct: true },
      { content: 'Nếu A mở bằng `BEGIN ISOLATION LEVEL REPEATABLE READ`, lệnh `UPDATE` của B phải chờ A kết thúc mới chạy' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: "Bảng `orders` rất lớn, có index `CREATE INDEX ON orders (status, created_at);` (thứ tự mặc định) và rất nhiều dòng `status = 'paid'`. Với `SELECT * FROM orders WHERE status = 'paid' ORDER BY created_at DESC LIMIT 20;`, planner xử lý phần sắp xếp thế nào?",
    options: [
      { content: 'Cần Sort, vì index lưu `created_at` tăng dần còn truy vấn yêu cầu giảm dần' },
      { content: 'Không cần Sort: quét ngược index trong đoạn `paid`, đủ 20 dòng thì dừng', correct: true },
      { content: 'Cần Sort, vì `ORDER BY` không bắt đầu từ cột đầu `status` của index' },
      { content: 'Không cần Sort, nhưng vẫn đọc hết mọi dòng `paid` rồi mới áp `LIMIT`' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Q1 và Q2 lần lượt trả về gì?

\`\`\`sql
-- staff(name, dept, bonus): không có dòng nào có dept = 'X'
-- Q1
SELECT COUNT(*), SUM(bonus) FROM staff WHERE dept = 'X';
-- Q2
SELECT dept, COUNT(*), SUM(bonus) FROM staff
WHERE dept = 'X' GROUP BY dept;
\`\`\``,
    options: [
      { content: 'Q1: một dòng (0, 0) — Q2: không dòng nào' },
      { content: "Q1: một dòng (0, NULL) — Q2: một dòng ('X', 0, NULL)" },
      { content: "Q1: một dòng (0, 0) — Q2: một dòng ('X', 0, 0)" },
      { content: 'Q1: một dòng (0, NULL) — Q2: không dòng nào', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Q1 và Q2 lần lượt trả về bao nhiêu dòng?

\`\`\`sql
-- t(x): 1, NULL, NULL
-- Q1
SELECT DISTINCT x FROM t;
-- Q2
SELECT a.x FROM t a JOIN t b ON a.x = b.x;
\`\`\``,
    options: [
      { content: 'Q1: 2 dòng — Q2: 1 dòng', correct: true },
      { content: 'Q1: 3 dòng — Q2: 5 dòng' },
      { content: 'Q1: 2 dòng — Q2: 5 dòng' },
      { content: 'Q1: 3 dòng — Q2: 1 dòng' },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: `Mỗi lệnh \`INSERT\` dưới đây chạy riêng trên dữ liệu ban đầu. Những lệnh nào thành công?

\`\`\`sql
CREATE TABLE products (
  id    INT PRIMARY KEY,
  sku   TEXT UNIQUE,
  price NUMERIC CHECK (price > 0)
);
-- đang có: (1, 'A-01', 10) và (2, NULL, 20)
\`\`\``,
    options: [
      { content: "`INSERT INTO products VALUES (NULL, 'C-01', 5);`" },
      { content: "`INSERT INTO products VALUES (3, NULL, 15);`", correct: true },
      { content: "`INSERT INTO products VALUES (5, 'A-01', 8);`" },
      { content: "`INSERT INTO products VALUES (4, 'B-01', NULL);`", correct: true },
    ],
  },
];
