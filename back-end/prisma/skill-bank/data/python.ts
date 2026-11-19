import type { SkillSeedQuestion } from '../types.ts';

// 13 easy · 14 medium · 13 hard; 9 câu multiple_choice (3 mỗi mức).
// Mọi đoạn code đã chạy thật bằng `python -I` (Python 3.13.15); câu import/package chạy trong thư mục tạm.
// Khái niệm đối chiếu docs.python.org (data model, reference/compound_stmts, reference/import, library/contextlib, dataclasses).
// Câu "in ra gì" chỉ để kết quả ở cả 4 phương án (không giải thích) để không lộ khoá qua hình thức.
// Vị trí đúng và độ dài đáp án rải có chủ ý (validateBank strict kiểm).
export const PYTHON: SkillSeedQuestion[] = [
  // ───── easy (13) ─────
  {
    domain: 'Data types & collections', difficulty: 'easy', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`python
a = [1, 2]
b = a
c = a[:]
print(a == c, a is c, a is b)
\`\`\``,
    options: [
      { content: '`False True False`' },
      { content: '`True True False`' },
      { content: '`True False True`', correct: true },
      { content: '`False False True`' },
    ],
  },
  {
    domain: 'Data types & collections', difficulty: 'easy', type: 'multiple_choice',
    stem: `Cho \`s = "hello"\` (Python 3). Chọn **tất cả** phát biểu đúng.`,
    options: [
      { content: '`s[0] = "H"` ném `TypeError`, vì `str` không cho sửa từng ký tự tại chỗ', correct: true },
      { content: '`s.upper()` trả về chuỗi mới `"HELLO"`, còn `s` vẫn là `"hello"`', correct: true },
      { content: '`s.append("!")` thêm dấu `!` vào cuối chuỗi ngay trên chính `s`' },
      { content: '`del s[0]` xoá ký tự đầu, sau đó `s` còn lại `"ello"`' },
      { content: '`s += "!"` làm `s` trỏ tới một chuỗi mới, chuỗi cũ không bị sửa', correct: true },
    ],
  },
  {
    domain: 'Functions & scope', difficulty: 'easy', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`python
def f(*args):
    return args

print(f(1, 2), f())
\`\`\``,
    options: [
      { content: '`(1, 2) ()`', correct: true },
      { content: '`[1, 2] []`' },
      { content: '`(1, 2) None`' },
      { content: '`[1, 2] ()`' },
    ],
  },
  {
    domain: 'Functions & scope', difficulty: 'easy', type: 'single_choice',
    stem: `Đoạn code sau chạy thế nào?

\`\`\`python
count = 0

def inc():
    count += 1

inc()
print(count)
\`\`\``,
    options: [
      { content: 'Chạy được và in `1`' },
      { content: 'Chạy được và in `0`' },
      { content: 'Ném `NameError` ở dòng `count += 1`' },
      { content: 'Ném `UnboundLocalError` ở dòng `count += 1`', correct: true },
    ],
  },
  {
    domain: 'OOP', difficulty: 'easy', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`python
class Dog:
    sound = 'woof'

d1 = Dog()
d2 = Dog()
d1.sound = 'grr'
print(d1.sound, d2.sound, Dog.sound)
\`\`\``,
    options: [
      { content: '`grr grr grr`' },
      { content: '`grr woof woof`', correct: true },
      { content: '`woof woof woof`' },
      { content: 'Ném `AttributeError` ở dòng `d1.sound = \'grr\'`' },
    ],
  },
  {
    domain: 'OOP', difficulty: 'easy', type: 'single_choice',
    stem: `Lớp \`P\` chỉ định nghĩa \`__repr__\`. Đoạn code sau in ra gì?

\`\`\`python
class P:
    def __repr__(self):
        return 'P!'

print(P(), [P()])
\`\`\``,
    options: [
      { content: '`<__main__.P object at 0x...> [<__main__.P object at 0x...>]`' },
      { content: '`P! [<__main__.P object at 0x...>]`' },
      { content: '`P! [P!]`', correct: true },
      { content: '`<__main__.P object at 0x...> [P!]`' },
    ],
  },
  {
    domain: 'OOP', difficulty: 'easy', type: 'single_choice',
    stem: `Đoạn code sau chạy thế nào?

\`\`\`python
class C:
    @property
    def x(self):
        return 1

c = C()
c.x = 5
print(c.x)
\`\`\``,
    options: [
      { content: 'Ném `AttributeError` ở dòng `c.x = 5`, vì `x` là property chưa có setter', correct: true },
      { content: 'In `5`, vì phép gán tạo thuộc tính `x` mới trên instance `c`' },
      { content: 'In `1`, vì phép gán bị bỏ qua mà không báo lỗi gì cả' },
      { content: 'Ném `TypeError` ở dòng `c.x = 5`, vì `x` là phương thức không gán được' },
    ],
  },
  {
    domain: 'Error handling & context managers', difficulty: 'easy', type: 'single_choice',
    stem: `Đoạn code sau in ra những dòng nào (theo thứ tự)?

\`\`\`python
try:
    print('a')
    x = 1 / 0
    print('b')
except ZeroDivisionError:
    print('c')
else:
    print('d')
finally:
    print('e')
\`\`\``,
    options: [
      { content: '`a`, `b`, `d`, `e`' },
      { content: '`e`, `a`, `c`' },
      { content: '`a`, `c`, `d`, `e`' },
      { content: '`a`, `c`, `e`', correct: true },
    ],
  },
  {
    domain: 'Error handling & context managers', difficulty: 'easy', type: 'multiple_choice',
    stem: `Đoạn code sau chạy \`int('x')\` (ném \`ValueError\`). Chọn **tất cả** phát biểu đúng.

\`\`\`python
try:
    int('x')
except Exception:
    print('E')
except ValueError:
    print('V')
\`\`\``,
    options: [
      { content: 'Đoạn code in ra `E`', correct: true },
      { content: 'Khối `except ValueError` không chạy với bất kỳ đầu vào nào của `int(...)` trong đoạn này', correct: true },
      { content: 'Cả hai khối `except` đều chạy, theo thứ tự từ trên xuống dưới' },
      { content: 'Đổi chỗ hai khối `except` cho nhau thì đoạn code in ra `V`', correct: true },
      { content: 'Python ném `SyntaxError` vì khối `except` phía sau bị khối trước che mất' },
    ],
  },
  {
    domain: 'Iterators & generators', difficulty: 'easy', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`python
g = (x * x for x in range(3))
print(list(g), list(g))
\`\`\``,
    options: [
      { content: '`[] [0, 1, 4]`' },
      { content: '`[0, 1, 4] []`', correct: true },
      { content: '`[0, 1, 4] [0, 1, 4]`' },
      { content: '`[] []`' },
    ],
  },
  {
    domain: 'Iterators & generators', difficulty: 'easy', type: 'multiple_choice',
    stem: `So sánh \`a = [x * x for x in range(1000)]\` và \`b = (x * x for x in range(1000))\`. Chọn **tất cả** phát biểu đúng.`,
    options: [
      { content: '`len(b)` trả về `1000` mà không cần duyệt qua từng phần tử của `b`, giống `len(a)`' },
      { content: 'Có thể lấy phần tử thứ 10 của `b` bằng `b[10]`, giống như với `a[10]` của list' },
      { content: '`a` đã có đủ 1000 phần tử ngay sau dòng định nghĩa, còn `b` chưa tính phần tử nào', correct: true },
      { content: '`iter(b) is b` là `True`, còn `iter(a) is a` là `False`', correct: true },
    ],
  },
  {
    domain: 'Modules & environment', difficulty: 'easy', type: 'single_choice',
    stem: `Tệp \`util.py\`:

\`\`\`python
print('util loaded', __name__)
if __name__ == '__main__':
    print('chay truc tiep')
\`\`\`

Tệp \`main.py\` chỉ có một dòng \`import util\`. Chạy \`python main.py\` in ra gì?`,
    options: [
      { content: '`util loaded __main__` rồi `chay truc tiep`' },
      { content: '`util loaded __main__`' },
      { content: '`util loaded util`', correct: true },
      { content: '`util loaded util` rồi `chay truc tiep`' },
    ],
  },
  {
    domain: 'Modules & environment', difficulty: 'easy', type: 'single_choice',
    stem: `Một virtual environment (\`venv\`) đã được kích hoạt trong terminal, rồi chạy \`pip install requests\`. Sau đó chạy \`C:\\Python313\\python.exe app.py\`, trong đó Python hệ thống này chưa cài \`requests\` và \`app.py\` có dòng \`import requests\`. Kết quả là gì?`,
    options: [
      { content: 'Chạy bình thường, vì `pip` cài gói dùng chung cho các bản Python trên máy' },
      { content: 'Ném `ModuleNotFoundError`, vì gói vừa cài chỉ dùng được sau khi mở terminal mới' },
      { content: 'Ném `ModuleNotFoundError`, vì `requests` được cài vào `site-packages` của venv', correct: true },
      { content: 'Chạy bình thường, vì venv đang kích hoạt nên lệnh này cũng dùng Python của venv' },
    ],
  },

  // ───── medium (14) ─────
  {
    domain: 'Data types & collections', difficulty: 'medium', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`python
x = [0, 1, 2, 3, 4, 5]
print(x[1:5:2], x[::-2])
\`\`\``,
    options: [
      { content: '`[1, 3, 5] [0, 2, 4]`' },
      { content: '`[1, 3] [5, 3, 1]`', correct: true },
      { content: '`[1, 3, 5] [5, 3, 1]`' },
      { content: '`[1, 3] [0, 2, 4]`' },
    ],
  },
  {
    domain: 'Data types & collections', difficulty: 'medium', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`python
a = [[1, 2], [3]]
b = a.copy()
b[0].append(9)
b.append([7])
print(a, len(b))
\`\`\``,
    options: [
      { content: '`[[1, 2], [3]] 3`' },
      { content: '`[[1, 2, 9], [3], [7]] 3`' },
      { content: '`[[1, 2], [3], [7]] 3`' },
      { content: '`[[1, 2, 9], [3]] 3`', correct: true },
    ],
  },
  {
    domain: 'Data types & collections', difficulty: 'medium', type: 'single_choice',
    stem: `Trong Python 3.7+, đoạn code sau in ra gì?

\`\`\`python
d = {'a': 1, 'b': 2}
d['c'] = 3
del d['a']
d['a'] = 9
print(list(d))
\`\`\``,
    options: [
      { content: "`['b', 'c', 'a']`", correct: true },
      { content: "`['a', 'b', 'c']`" },
      { content: "`['c', 'b', 'a']`" },
      { content: "`['c', 'a', 'b']`" },
    ],
  },
  {
    domain: 'Functions & scope', difficulty: 'medium', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`python
def add(x, bag=[]):
    bag.append(x)
    return bag

print(add(1), add(2), add(3, []))
\`\`\``,
    options: [
      { content: '`[1] [2] [3]`' },
      { content: '`[1] [1, 2] [1, 2, 3]`' },
      { content: '`[1, 2] [1, 2] [3]`', correct: true },
      { content: '`[1, 2] [1, 2] [1, 2, 3]`' },
    ],
  },
  {
    domain: 'Functions & scope', difficulty: 'medium', type: 'multiple_choice',
    stem: `Cho hàm \`def f(a, /, b, *, c): ...\`. Chọn **tất cả** lời gọi hợp lệ (không ném \`TypeError\`).`,
    options: [
      { content: '`f(1, 2, 3)`' },
      { content: '`f(1, b=2, c=3)`', correct: true },
      { content: '`f(a=1, b=2, c=3)`' },
      { content: '`f(1, 2, c=3)`', correct: true },
      { content: '`f(1, 2)`' },
    ],
  },
  {
    domain: 'OOP', difficulty: 'medium', type: 'multiple_choice',
    stem: `Cho đoạn code sau. Chọn **tất cả** phát biểu đúng.

\`\`\`python
from dataclasses import dataclass

@dataclass
class Point:
    x: int
    y: int
\`\`\``,
    options: [
      { content: '`Point(1, 2) == Point(1, 2)` là `True`, vì `__eq__` được sinh sẵn', correct: true },
      { content: '`Point(1, 2).x = 5` ném `FrozenInstanceError`, vì dataclass mặc định là bất biến và không cho sửa bất kỳ field nào' },
      { content: 'Khai báo thêm field `tags: list = []` thì ném `ValueError` khi định nghĩa class, vì cần `default_factory`', correct: true },
      { content: '`Point(1, "a")` ném `TypeError`, vì field `y` được khai báo kiểu `int` và dataclass kiểm tra kiểu' },
    ],
  },
  {
    domain: 'OOP', difficulty: 'medium', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`python
class Temp:
    def __init__(self, c):
        self.c = c

    @classmethod
    def from_f(cls, f):
        return cls((f - 32) * 5 / 9)

class Sub(Temp):
    pass

print(type(Sub.from_f(212)).__name__)
\`\`\``,
    options: [
      { content: '`Temp`' },
      { content: '`Sub`', correct: true },
      { content: '`float`' },
      { content: 'Ném `TypeError`' },
    ],
  },
  {
    domain: 'Error handling & context managers', difficulty: 'medium', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`python
def parse(s):
    try:
        n = int(s)
    except ValueError:
        return -1
    else:
        return n * 2
    finally:
        print('f', end=' ')

print(parse('4'), parse('x'))
\`\`\``,
    options: [
      { content: '`8 -1 f`' },
      { content: '`8 -1 f f`' },
      { content: '`f 8 -1`' },
      { content: '`f f 8 -1`', correct: true },
    ],
  },
  {
    domain: 'Error handling & context managers', difficulty: 'medium', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`python
try:
    try:
        1 / 0
    except ZeroDivisionError as e:
        raise ValueError('bad') from e
except ValueError as e:
    print(type(e.__cause__).__name__, e.__context__ is e.__cause__)
\`\`\``,
    options: [
      { content: '`ZeroDivisionError True`', correct: true },
      { content: '`ZeroDivisionError False`' },
      { content: '`None True`' },
      { content: '`None False`' },
    ],
  },
  {
    domain: 'Error handling & context managers', difficulty: 'medium', type: 'multiple_choice',
    stem: `Cho hàm sau. Chọn **tất cả** phát biểu đúng.

\`\`\`python
from contextlib import contextmanager

@contextmanager
def cm():
    print('in')
    yield 1
    print('out')
\`\`\``,
    options: [
      { content: 'Với `with cm() as v: pass`, `v` bằng `1` và `out` được in khi thoát khối' , correct: true },
      { content: 'Nếu thân `with` ném `KeyError`, ngoại lệ bị nuốt và chương trình tiếp tục chạy phần sau khối `with` bình thường' },
      { content: 'Đặt `print("out")` trong `finally` quanh `yield 1` thì `out` được in cả khi thân `with` ném lỗi', correct: true },
      { content: 'Hàm `cm()` phải được gọi hai lần: một lần cho phần vào `with` và một lần nữa cho phần thoát' },
    ],
  },
  {
    domain: 'Iterators & generators', difficulty: 'medium', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`python
from itertools import groupby

print([(k, len(list(g))) for k, g in groupby('aabaa')])
\`\`\``,
    options: [
      { content: "`[('a', 4), ('b', 1)]`" },
      { content: "`[('a', 1), ('a', 1), ('b', 1), ('a', 1), ('a', 1)]`" },
      { content: "`[('a', 2), ('b', 1), ('a', 2)]`", correct: true },
      { content: "`[('a', 2), ('b', 1)]`" },
    ],
  },
  {
    domain: 'Iterators & generators', difficulty: 'medium', type: 'single_choice',
    stem: `Đoạn code sau in ra những dòng nào (theo thứ tự)?

\`\`\`python
def check(x):
    print('c', x)
    return x > 1

print(any(check(x) for x in [1, 2, 3]))
\`\`\``,
    options: [
      { content: '`c 1`, `c 2`, `c 3`, `True`' },
      { content: '`c 1`, `c 2`, `True`', correct: true },
      { content: '`c 1`, `True`' },
      { content: '`True`' },
    ],
  },
  {
    domain: 'Modules & environment', difficulty: 'medium', type: 'single_choice',
    stem: `Tệp \`mod.py\`:

\`\`\`python
print('init')
counter = 0
\`\`\`

Tệp \`main.py\`:

\`\`\`python
import mod
import mod as m2
mod.counter += 1
from mod import counter
print(counter, m2 is mod)
\`\`\`

Chạy \`python main.py\` in ra gì?`,
    options: [
      { content: '`init` ba lần, rồi `1 True`' },
      { content: '`init`, rồi `0 True`' },
      { content: '`init` ba lần, rồi `0 True`' },
      { content: '`init`, rồi `1 True`', correct: true },
    ],
  },
  {
    domain: 'Modules & environment', difficulty: 'medium', type: 'single_choice',
    stem: `Cấu trúc thư mục: \`pkg/__init__.py\` (rỗng), \`pkg/sub.py\` (có \`VAL = 1\`) và \`pkg/run.py\`:

\`\`\`python
from .sub import VAL
print(VAL)
\`\`\`

Từ thư mục chứa \`pkg\`, chạy \`python pkg/run.py\` cho kết quả nào?`,
    options: [
      { content: 'Ném `ImportError: attempted relative import with no known parent package`', correct: true },
      { content: "Ném `ModuleNotFoundError: No module named 'sub'`" },
      { content: 'Chạy được và in `1`' },
      { content: 'Ném `SyntaxError: relative import outside a package`' },
    ],
  },

  // ───── hard (13) ─────
  {
    domain: 'Data types & collections', difficulty: 'hard', type: 'multiple_choice',
    stem: `Cho \`t = ([1], 2)\`. Chọn **tất cả** phát biểu đúng (mỗi phát biểu xét với \`t\` vừa khởi tạo).`,
    options: [
      { content: '`hash(t)` trả về một số nguyên, vì `t` là tuple nên bất biến, do đó dùng làm khoá dict được' },
      { content: '`t[0].append(5)` chạy thành công, vì tuple cố định tham chiếu, không cố định đối tượng được trỏ tới', correct: true },
      { content: '`t[1] += 1` chạy được, vì `2` là `int` bất biến nên phép cộng chỉ tạo số mới thay thế' },
      { content: '`t[0] += [5]` ném `TypeError`, nhưng `t[0]` đã là `[1, 5]`, vì `+=` sửa tại chỗ rồi mới gán', correct: true },
    ],
  },
  {
    domain: 'Data types & collections', difficulty: 'hard', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`python
d = {1: 'a'}
d[True] = 'b'
d[1.0] = 'c'
print(d, len(d))
\`\`\``,
    options: [
      { content: "`{1: 'a'} 1`" },
      { content: "`{1: 'a', True: 'b', 1.0: 'c'} 3`" },
      { content: "`{1: 'c'} 1`", correct: true },
      { content: "`{True: 'c'} 1`" },
    ],
  },
  {
    domain: 'Functions & scope', difficulty: 'hard', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`python
def make():
    fs = []
    for i in range(3):
        fs.append(lambda x=i: x + i)
    return fs

print([f() for f in make()])
\`\`\``,
    options: [
      { content: '`[2, 3, 4]`', correct: true },
      { content: '`[0, 2, 4]`' },
      { content: '`[4, 4, 4]`' },
      { content: '`[0, 1, 2]`' },
    ],
  },
  {
    domain: 'Functions & scope', difficulty: 'hard', type: 'single_choice',
    stem: `Đoạn code sau chạy thế nào?

\`\`\`python
class A:
    n = 3
    xs = [1, 2]
    ys = [x * 2 for x in xs]
    zs = [x * n for x in xs]
\`\`\``,
    options: [
      { content: 'Chạy bình thường và `A.zs` là `[3, 6]`' },
      { content: 'Ném `NameError` ở dòng `ys`' },
      { content: 'Ném `SyntaxError`' },
      { content: 'Ném `NameError` ở dòng `zs`', correct: true },
    ],
  },
  {
    domain: 'Functions & scope', difficulty: 'hard', type: 'single_choice',
    stem: `Đoạn code sau in ra những dòng nào (theo thứ tự)?

\`\`\`python
def tag(n):
    def deco(fn):
        print('apply', n)
        return lambda: n + fn()
    return deco

@tag('a')
@tag('b')
def f():
    return '!'

print(f())
\`\`\``,
    options: [
      { content: '`apply a`, `apply b`, `ba!`' },
      { content: '`apply b`, `apply a`, `ab!`', correct: true },
      { content: '`apply a`, `apply b`, `ab!`' },
      { content: '`apply b`, `apply a`, `ba!`' },
    ],
  },
  {
    domain: 'OOP', difficulty: 'hard', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`python
class A:
    def f(self): return ['A']
class B(A):
    def f(self): return ['B'] + super().f()
class C(A):
    def f(self): return ['C'] + super().f()
class D(B, C):
    def f(self): return ['D'] + super().f()

print(D().f())
\`\`\``,
    options: [
      { content: "`['D', 'B', 'A']`" },
      { content: "`['D', 'C', 'B', 'A']`" },
      { content: "`['D', 'B', 'C', 'A']`", correct: true },
      { content: "`['D', 'B', 'A', 'C', 'A']`" },
    ],
  },
  {
    domain: 'OOP', difficulty: 'hard', type: 'multiple_choice',
    stem: `Cho lớp chỉ định nghĩa \`__eq__\` (Python 3). Chọn **tất cả** phát biểu đúng.

\`\`\`python
class P:
    def __init__(self, x):
        self.x = x

    def __eq__(self, other):
        return self.x == other.x
\`\`\``,
    options: [
      { content: '`P(1) != P(1)` là `False`, vì `__ne__` mặc định đảo kết quả của `__eq__`', correct: true },
      { content: '`{P(1)}` ném `TypeError`, vì khi chỉ định nghĩa `__eq__`, `__hash__` bị đặt thành `None`', correct: true },
      { content: 'Thêm `__hash__ = object.__hash__` vào lớp thì `len({P(1), P(1)})` là `1`, vì hai đối tượng bằng nhau' },
      { content: '`len({P(1), P(1)})` là `2`, vì `set` mặc định băm theo `id` của đối tượng' },
    ],
  },
  {
    domain: 'Error handling & context managers', difficulty: 'hard', type: 'single_choice',
    stem: `Đoạn code sau in ra những dòng nào (theo thứ tự)?

\`\`\`python
class Quiet:
    def __enter__(self):
        print('enter')

    def __exit__(self, et, ev, tb):
        print('exit', et.__name__)
        return True

with Quiet():
    raise KeyError
    print('after')
print('done')
\`\`\``,
    options: [
      { content: '`enter`, `exit KeyError`, `done`', correct: true },
      { content: '`enter`, `exit KeyError`, rồi `KeyError` được ném ra ngoài' },
      { content: '`enter`, `exit KeyError`, `after`, `done`' },
      { content: '`enter`, `after`, `exit None`, `done`' },
    ],
  },
  {
    domain: 'Error handling & context managers', difficulty: 'hard', type: 'single_choice',
    stem: `Đoạn code sau chạy thế nào?

\`\`\`python
e = 'keep'
try:
    1 / 0
except ZeroDivisionError as e:
    pass
print(e)
\`\`\``,
    options: [
      { content: 'In `keep`' },
      { content: 'Ném `NameError`', correct: true },
      { content: 'In `division by zero`' },
      { content: 'Ném `UnboundLocalError`' },
    ],
  },
  {
    domain: 'Iterators & generators', difficulty: 'hard', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`python
def inner():
    yield 1
    return 'r'

def outer():
    x = yield from inner()
    yield x

print(list(outer()))
\`\`\``,
    options: [
      { content: '`[1]`' },
      { content: '`[1, None]`' },
      { content: "`[1, 'r']`", correct: true },
      { content: 'Ném `SyntaxError`' },
    ],
  },
  {
    domain: 'Iterators & generators', difficulty: 'hard', type: 'single_choice',
    stem: `Đoạn code sau in ra gì?

\`\`\`python
a = iter([1, 2, 3])
print(list(zip(a, 'xy')))
print(list(a))
\`\`\``,
    options: [
      { content: "`[(1, 'x'), (2, 'y')]` rồi `[3]`" },
      { content: "`[(1, 'x'), (2, 'y'), (3, 'x')]` rồi `[]`" },
      { content: "`[(1, 'x'), (2, 'y')]` rồi `[]`", correct: true },
      { content: "`[(1, 'x'), (2, 'y'), (3, None)]` rồi `[]`" },
    ],
  },
  {
    domain: 'Modules & environment', difficulty: 'hard', type: 'single_choice',
    stem: `Tệp \`a.py\` và \`b.py\` nằm cùng thư mục:

\`\`\`python
# a.py
print('a start')
import b
x = 1
print('a end')

# b.py
print('b start')
from a import x
print('b end')
\`\`\`

Chạy \`python a.py\` in ra những dòng nào (theo thứ tự)?`,
    options: [
      { content: '`a start`, `b start`, `a start`, `a end`, `b end`, `a end`', correct: true },
      { content: '`a start`, `b start`, rồi `ImportError`' },
      { content: '`a start`, `b start`, `b end`, `a end`' },
      { content: '`a start`, `a end`, `b start`, `b end`' },
    ],
  },
  {
    domain: 'Modules & environment', difficulty: 'hard', type: 'multiple_choice',
    stem: `Package \`pkg\` có \`pkg/__init__.py\` rỗng và \`pkg/sub.py\` chứa \`VAL = 1\`. Chọn **tất cả** phát biểu đúng (mỗi phát biểu xét độc lập, trong một chương trình mới).`,
    options: [
      { content: 'Sau `import pkg.sub`, dùng trực tiếp tên `sub.VAL` được, vì `import` gắn module cuối vào tên riêng, không cần tiền tố `pkg.`' },
      { content: 'Sau `import pkg`, `pkg.sub` ném `AttributeError`, vì `__init__.py` rỗng nên submodule chưa được nạp', correct: true },
      { content: '`from pkg import sub` ném `ImportError`, vì `__init__.py` rỗng không khai báo `sub`, nên phải viết `import pkg.sub`' },
      { content: 'Nếu `c.py` có `import pkg.sub`, `main.py` có `import pkg` và `import c` là dùng được `pkg.sub.VAL`, vì package dùng chung', correct: true },
    ],
  },
];
