import type { SkillSeedQuestion } from '../types.ts';

// 13 easy · 14 medium · 13 hard; 9 câu multiple_choice (3 mỗi mức).
// React 19, function component, đối chiếu react.dev (2026-11-05). Vị trí đúng và độ dài đáp án rải có chủ ý (validateBank strict kiểm).
export const REACT: SkillSeedQuestion[] = [
  // ───── easy (13) ─────
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Component dưới đây được render một lần (không bật StrictMode), sau đó người dùng bấm nút hai lần. Hộp thoại \`alert\` xuất hiện mấy lần và vào lúc nào?

\`\`\`jsx
function Greeting() {
  return <button onClick={alert('Xin chào')}>Chào</button>;
}
\`\`\``,
    options: [
      { content: 'Hai lần, mỗi lần đúng lúc người dùng bấm nút' },
      { content: 'Một lần lúc render, bấm nút không hiện thêm lần nào', correct: true },
      { content: 'Ba lần: một lần lúc render và một lần cho mỗi lần bấm' },
      { content: 'Không lần nào, vì JSX không cho gọi hàm trong thuộc tính' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Người dùng bấm nút 3 lần. Nút hiển thị gì?

\`\`\`jsx
function Counter() {
  let count = 0;
  return (
    <button onClick={() => { count = count + 1; }}>
      Đã bấm {count} lần
    </button>
  );
}
\`\`\``,
    options: [
      { content: '"Đã bấm 3 lần", vì `count` được cộng sau mỗi lần bấm' },
      { content: '"Đã bấm 1 lần", vì mỗi lần bấm `count` về 0 rồi cộng 1' },
      { content: '"Đã bấm 0 lần", vì đổi biến cục bộ không làm render lại', correct: true },
      { content: 'Báo lỗi, vì không được gán lại biến khai báo trong component' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Bấm nút lần đầu tiên. Console in gì, và sau đó nút hiển thị gì?

\`\`\`jsx
function Counter() {
  const [count, setCount] = useState(0);
  function handleClick() {
    setCount(count + 1);
    console.log(count);
  }
  return <button onClick={handleClick}>{count}</button>;
}
\`\`\``,
    options: [
      { content: 'In `0`, nút hiển thị `1`', correct: true },
      { content: 'In `1`, nút hiển thị `1`' },
      { content: 'In `0`, nút hiển thị `0`' },
      { content: 'In `1`, nút hiển thị `0`' },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: 'Danh sách `todos` lấy từ API; người dùng có thể sắp xếp lại, thêm và xoá mục. Mỗi todo có `id` duy nhất do server cấp. Trong `todos.map((todo, index) => <TodoItem ... />)`, những cách đặt `key` nào phù hợp?',
    options: [
      { content: '`key={todo.id}`', correct: true },
      { content: '`key={index}` (vị trí trong mảng)' },
      { content: '`key={Math.random()}`' },
      { content: "`key={'todo-' + todo.id}`", correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Bên trong \`Avatar\`, \`size\` nhận giá trị nào?

\`\`\`jsx
function Avatar({ size = 100 }) {
  return <img src="/me.png" width={size} alt="" />;
}

<Avatar size={null} />
\`\`\``,
    options: [
      { content: '`100`, vì truyền `null` được coi như không truyền prop' },
      { content: '`undefined`, vì React bỏ qua các prop có giá trị `null`' },
      { content: '`100`, vì giá trị mặc định thay cho mọi giá trị falsy' },
      { content: '`null`, vì giá trị mặc định không áp dụng cho `null`', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Người dùng gõ thêm chữ vào ô nhập. Điều gì xảy ra?

\`\`\`jsx
function Search() {
  const [text, setText] = useState('react');
  return <input value={text} />;
}
\`\`\``,
    options: [
      { content: 'Ô hiện chữ vừa gõ, còn `text` vẫn giữ giá trị `react`' },
      { content: 'Ô vẫn là `react`, chữ vừa gõ bị React hoàn lại theo `value`', correct: true },
      { content: 'Ô hiện chữ vừa gõ, và React tự cập nhật `text` theo `value`' },
      { content: 'Ô tự chuyển sang uncontrolled nên gõ được như bình thường' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Effect dưới đây chạy vào những lúc nào?

\`\`\`jsx
function Clicker() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    document.title = \`Đã bấm \${count} lần\`;
  });
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
\`\`\``,
    options: [
      { content: 'Sau lần render đầu tiên, giống như truyền mảng rỗng `[]`' },
      { content: 'Mỗi khi `count` đổi, vì React tự suy ra dependency từ code' },
      { content: 'Sau mỗi lần render xong, kể cả lần render đầu tiên', correct: true },
      { content: 'Trước mỗi lần render, để tiêu đề kịp đổi trước khi vẽ' },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: 'Hai component anh em `<SearchBox>` (ô nhập từ khoá) và `<ResultList>` (lọc theo từ khoá) cần dùng chung giá trị `query`. Những cách nào đúng với hướng dẫn của React?',
    options: [
      { content: 'Mỗi component giữ một state `query` riêng, rồi đồng bộ hai state với nhau bằng `useEffect`' },
      { content: 'Đưa state `query` lên cha chung gần nhất, truyền `query` và `setQuery` xuống qua props', correct: true },
      { content: 'Giữ state ở cha chung và cung cấp qua context, khi hai bên cách cha nhiều tầng', correct: true },
      { content: 'Giữ `query` trong object ở cha chung, để hai con đọc và gán trực tiếp `props.state.query`' },
    ],
  },
  {
    difficulty: 'easy', type: 'multiple_choice',
    stem: `Trong component dưới đây, những lời gọi hook nào vi phạm quy tắc hooks?

\`\`\`jsx
function Cart({ items }) {
  const [open, setOpen] = useState(false);
  const total = useTotal(items);
  if (items.length === 0) return <Empty />;
  const [coupon, setCoupon] = useState('');
  function applyCoupon() {
    const [busy, setBusy] = useState(false);
  }
  return <Summary total={total} onApply={applyCoupon} />;
}
\`\`\``,
    options: [
      { content: "`useState('')` của `coupon`", correct: true },
      { content: '`useState(false)` của `open`' },
      { content: '`useState(false)` của `busy`', correct: true },
      { content: '`useTotal(items)` của `total`' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `\`items\` có 3 phần tử. Màn hình hiển thị gì?

\`\`\`jsx
function List({ items }) {
  return (
    <ul>
      {items.map((item) => {
        <li key={item.id}>{item.name}</li>;
      })}
    </ul>
  );
}
\`\`\``,
    options: [
      { content: '`<ul>` rỗng, vì callback có ngoặc nhọn mà thiếu `return`', correct: true },
      { content: 'Ba `<li>`, vì JSX ở dòng cuối callback được trả về tự động' },
      { content: 'Ba `<li>` cùng hiển thị chữ `undefined`' },
      { content: 'Báo lỗi, vì `map` trả về mảng chứ không phải JSX' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Thẻ \`<h2>\` có hiển thị trên màn hình không?

\`\`\`jsx
function Card() {
  return <div className="card" />;
}

export default function App() {
  return <Card><h2>Tiêu đề</h2></Card>;
}
\`\`\``,
    options: [
      { content: 'Có, React tự chèn `<h2>` vào bên trong `<div className="card">`' },
      { content: 'Có, `<h2>` hiển thị ngay sau `<div>` mà `Card` trả về' },
      { content: 'Không, vì JSX báo lỗi khi truyền thẻ con cho component không khai báo `children`' },
      { content: 'Không, vì `Card` không render `children` nhận được qua props', correct: true },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Người dùng gõ "A" vào ô Tên. Sau đó \`form.email\` có giá trị gì?

\`\`\`jsx
const [form, setForm] = useState({ name: '', email: 'an@x.vn' });

// onChange của ô "Tên"
function handleName(e) {
  setForm({ name: e.target.value });
}
\`\`\``,
    options: [
      { content: '`"an@x.vn"`, vì React gộp object mới vào state cũ' },
      { content: '`undefined`, vì `setForm` thay cả state bằng object mới', correct: true },
      { content: '`""`, vì key bị thiếu được đặt về chuỗi rỗng' },
      { content: 'Báo lỗi, vì object truyền vào thiếu key `email`' },
    ],
  },
  {
    difficulty: 'easy', type: 'single_choice',
    stem: `Ba \`<Label />\` hiển thị gì, theo thứ tự trong code?

\`\`\`jsx
const ThemeContext = createContext('light');
function Label() {
  return <span>{useContext(ThemeContext)} </span>;
}
export default function App() {
  return (
    <>
      <ThemeContext value="dark">
        <Label />
        <ThemeContext value="blue"><Label /></ThemeContext>
      </ThemeContext>
      <Label />
    </>
  );
}
\`\`\``,
    options: [
      { content: '`blue` `blue` `blue`' },
      { content: '`dark` `dark` `dark`' },
      { content: '`dark` `blue` `light`', correct: true },
      { content: '`blue` `blue` `light`' },
    ],
  },

  // ───── medium (14) ─────
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `React 19 với \`createRoot\`, không bật StrictMode. Bấm nút một lần và đợi timeout chạy xong. Ngoài lần mount, \`render\` được in thêm mấy lần?

\`\`\`jsx
function App() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  console.log('render');
  function handleClick() {
    setTimeout(() => {
      setA(1);
      setB(1);
    }, 0);
  }
  return <button onClick={handleClick}>{a + b}</button>;
}
\`\`\``,
    options: [
      { content: '1 lần, vì hai cập nhật trong cùng callback `setTimeout` được gộp (batch)', correct: true },
      { content: '2 lần, vì cập nhật trong `setTimeout` nằm ngoài sự kiện React nên không gộp' },
      { content: '2 lần: một lần ngay khi click, một lần khi timeout chạy' },
      { content: '3 lần: một lần khi click và một lần cho mỗi lệnh `setState`' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Bấm nút một lần. Nút hiển thị gì?

\`\`\`jsx
function Tags() {
  const [items, setItems] = useState(['a']);
  function add() {
    items.push('b');
    setItems(items);
  }
  return <button onClick={add}>{items.length}</button>;
}
\`\`\``,
    options: [
      { content: '`2`, vì mỗi lần gọi `setItems` đều xếp lịch render lại' },
      { content: '`2`, vì `push` sửa trực tiếp mảng mà React đang hiển thị' },
      { content: 'Báo lỗi, vì React đóng băng (freeze) mảng state nên không `push` được' },
      { content: '`1`, vì state mới cùng tham chiếu state cũ nên React bỏ qua render', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Không bật StrictMode, không dùng React Compiler. Người dùng gõ 5 ký tự vào ô nhập. Có bao nhiêu dòng \`init\` được in, và cách sửa nào đúng?

\`\`\`jsx
function createInitialTodos() {
  console.log('init');
  return Array.from({ length: 1000 }, (_, i) => ({ id: i }));
}
function TodoList() {
  const [todos, setTodos] = useState(createInitialTodos());
  const [text, setText] = useState('');
  return <input value={text} onChange={(e) => setText(e.target.value)} />;
}
\`\`\``,
    options: [
      { content: '1 dòng, vì React bỏ qua đối số khởi tạo sau lần render đầu; không cần sửa' },
      { content: '6 dòng; đổi thành `useState(createInitialTodos)` để hàm chỉ chạy lúc khởi tạo', correct: true },
      { content: '6 dòng; đổi thành `useState(() => createInitialTodos)` để hàm được chạy lười' },
      { content: '1 dòng; nhưng nếu đổi thành `useState(createInitialTodos)` thì hàm chạy mỗi render' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Bấm nút "ref" 3 lần: \`<p>\` hiển thị gì? Sau đó bấm nút "state" 1 lần: \`<p>\` hiển thị gì?

\`\`\`jsx
function Demo() {
  const ref = useRef(0);
  const [n, setN] = useState(0);
  return (
    <>
      <button onClick={() => { ref.current += 1; }}>ref</button>
      <button onClick={() => setN(n + 1)}>state</button>
      <p>{ref.current} - {n}</p>
    </>
  );
}
\`\`\``,
    options: [
      { content: '`3 - 0`, rồi `3 - 1`' },
      { content: '`0 - 0`, rồi `0 - 1`' },
      { content: '`0 - 0`, rồi `3 - 1`', correct: true },
      { content: '`3 - 0`, rồi `0 - 1`' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `\`userId\` đổi nhanh từ 1 sang 2. Phản hồi của user 2 về trước, phản hồi của user 1 về sau. Cuối cùng \`<h1>\` hiển thị gì?

\`\`\`jsx
function Profile({ userId }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetchUser(userId).then((data) => setUser(data));
  }, [userId]);
  return <h1>{user?.name}</h1>;
}
\`\`\``,
    options: [
      { content: 'Tên user 2, vì React tự huỷ request của effect cũ khi `userId` đổi' },
      { content: 'Tên user 1, vì `setUser` của request cũ chạy sau cùng và ghi đè', correct: true },
      { content: 'Tên user 2, vì React bỏ qua `setUser` gọi từ một effect đã cũ' },
      { content: 'Trống, vì React báo lỗi cập nhật state từ effect đã hết hiệu lực' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Lần hiển thị đầu tiên: \`Header\` render được ngay, còn \`Comments\` suspend vì đang chờ dữ liệu. Người dùng thấy gì?

\`\`\`jsx
<Suspense fallback={<Spinner />}>
  <Header />
  <Comments />
</Suspense>
\`\`\``,
    options: [
      { content: '`Header`, và `Spinner` nằm ở chỗ của `Comments`' },
      { content: '`Header`, còn chỗ của `Comments` để trống' },
      { content: '`Spinner` ở trên, `Header` hiển thị ngay bên dưới' },
      { content: '`Spinner`, thay cho cả `Header` lẫn `Comments`', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: `Cha render \`<EditContact contact={selected} />\` ở cùng một vị trí trong cây, rồi đổi \`selected\` từ An sang Bình (chưa gõ gì vào ô). Những phát biểu nào đúng?

\`\`\`jsx
function EditContact({ contact }) {
  const [name, setName] = useState(contact.name);
  return <input value={name} onChange={(e) => setName(e.target.value)} />;
}
\`\`\``,
    options: [
      { content: 'Ô vẫn hiện "An", vì giá trị khởi tạo của `useState` bị bỏ qua sau lần render đầu', correct: true },
      { content: 'Ô tự hiện "Bình", vì React khởi tạo lại state khi prop dùng để khởi tạo thay đổi' },
      { content: 'Thêm `key={selected.id}` ở cha thì `EditContact` được tạo mới, ô hiện "Bình"', correct: true },
      { content: 'Đồng bộ bằng `useEffect(() => setName(contact.name), [contact])` là cách được khuyến nghị, không gây render thừa' },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: `Cho custom hook \`useCounter\` dưới đây. Những phát biểu nào đúng?

\`\`\`jsx
function useCounter() {
  const [count, setCount] = useState(0);
  const inc = () => setCount((c) => c + 1);
  return { count, inc };
}
\`\`\``,
    options: [
      { content: 'Gọi `inc()` render lại riêng hook `useCounter`, còn component gọi nó thì không' },
      { content: '`<A />` và `<B />` cùng gọi `useCounter()`; tăng ở A thì `count` của B không đổi', correct: true },
      { content: 'Gọi `useCounter()` bên trong callback của `useEffect` là hợp lệ, vì custom hook là hàm JS thường' },
      { content: 'Code trong `useCounter` chạy lại mỗi lần component gọi nó render lại', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'multiple_choice',
    stem: 'Với `count = 0` và `items = []`, những biểu thức JSX nào không render ra nội dung gì (không có chữ hay phần tử nào trên màn hình)?',
    options: [
      { content: '`{count && <Badge />}`' },
      { content: '`{!!count && <Badge />}`', correct: true },
      { content: '`{items.length && <List />}`' },
      { content: '`{items.length ? <List /> : null}`', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Người dùng gõ ký tự đầu tiên vào ô. Console (development) báo gì, và sửa thế nào?

\`\`\`jsx
function Form() {
  const [user, setUser] = useState({});
  return (
    <input
      value={user.name}
      onChange={(e) => setUser({ ...user, name: e.target.value })}
    />
  );
}
\`\`\``,
    options: [
      { content: 'Cảnh báo input đổi từ uncontrolled sang controlled; sửa bằng `value={user.name ?? ""}`', correct: true },
      { content: 'Cảnh báo thiếu `defaultValue`; sửa bằng cách thêm `defaultValue=""` cạnh `value`' },
      { content: 'Lỗi vì spread `...user` khi `user` rỗng; sửa bằng cách khởi tạo `useState(null)`' },
      { content: 'Không cảnh báo gì, vì React coi `value={undefined}` như chuỗi rỗng' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Form đăng ký gửi request qua một Effect như dưới đây. Theo hướng dẫn của react.dev, nhận xét nào đúng nhất?

\`\`\`jsx
function SignupForm() {
  const [payload, setPayload] = useState(null);
  useEffect(() => {
    if (payload !== null) post('/api/register', payload);
  }, [payload]);
  function handleSubmit(e) {
    e.preventDefault();
    setPayload({ email });
  }
  // ...
}
\`\`\``,
    options: [
      { content: 'Hợp lý, vì đặt request trong effect bảo đảm nó chạy sau khi state đã cập nhật' },
      { content: 'Nên giữ effect và thêm cleanup huỷ request, để tránh gửi trùng khi `payload` đổi nhanh' },
      { content: 'Nên gọi `post` ngay trong `handleSubmit`, vì request do thao tác gửi form gây ra', correct: true },
      { content: 'Nên bỏ `payload`, đưa `email` vào dependency để effect tự gửi khi `email` thay đổi' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Không bật StrictMode, không dùng \`memo\` hay React Compiler. Bấm nút 2 lần. Ngoài lần mount, \`Child render\` được in thêm mấy lần?

\`\`\`jsx
function Child() {
  console.log('Child render');
  return <p>Tĩnh</p>;
}
function Parent() {
  const [n, setN] = useState(0);
  return (
    <>
      <button onClick={() => setN(n + 1)}>{n}</button>
      <Child />
    </>
  );
}
\`\`\``,
    options: [
      { content: '0 lần, vì `Child` không nhận prop nào nên React bỏ qua nó' },
      { content: '2 lần, vì mặc định component con render lại khi cha render lại', correct: true },
      { content: '1 lần, vì React gộp hai lần bấm thành một lần render' },
      { content: '0 lần, vì `Child` trả về cùng JSX nên React không gọi lại nó' },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Không bật StrictMode. Component mount, rồi người dùng gõ 1 ký tự. Hai dòng log là gì?

\`\`\`jsx
function Search() {
  const inputRef = useRef(null);
  const [q, setQ] = useState('');
  console.log(inputRef.current);
  return (
    <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} />
  );
}
\`\`\``,
    options: [
      { content: 'Phần tử `<input>` ở cả hai dòng, vì ref được gán trước khi render' },
      { content: '`null` ở cả hai dòng, vì mỗi lần render `useRef(null)` tạo ref mới' },
      { content: 'Phần tử `<input>` rồi `null`, vì ref được gỡ ra trước mỗi lần render lại' },
      { content: '`null` rồi phần tử `<input>`, vì ref chỉ được gán sau khi DOM được tạo', correct: true },
    ],
  },
  {
    difficulty: 'medium', type: 'single_choice',
    stem: `Người dùng bấm nút "Bấm". Console in gì, theo thứ tự?

\`\`\`jsx
<div
  onClickCapture={() => console.log('capture')}
  onClick={() => console.log('div')}
>
  <button onClick={(e) => { e.stopPropagation(); console.log('button'); }}>
    Bấm
  </button>
</div>
\`\`\``,
    options: [
      { content: '`capture`, `button`', correct: true },
      { content: '`button`' },
      { content: '`button`, `capture`' },
      { content: '`capture`, `button`, `div`' },
    ],
  },

  // ───── hard (13) ─────
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Không bật StrictMode. Người dùng bấm nút đúng một lần, ở giây thứ 2,5 sau khi mount. Tới giây thứ 4,5, nút hiển thị gì?

\`\`\`jsx
function Timer() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);
  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => c + step);
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return <button onClick={() => setStep(10)}>{count}</button>;
}
\`\`\``,
    options: [
      { content: '`22`: hai tick đầu cộng 1, hai tick sau cộng 10, vì updater đọc `step` mới nhất' },
      { content: '`1`: mỗi tick đặt `count` thành 0 + 1, vì closure của effect giữ `count` cũ' },
      { content: '`4`: updater nhận `c` mới nhất, còn `step` vẫn là 1 của closure lần mount', correct: true },
      { content: '`2`: `setStep` gây render lại nên cleanup xoá interval, sau đó không tick nữa' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `\`count\` đang là 0. Bấm nút một lần. Giá trị \`count\` ở lần render kế tiếp là bao nhiêu?

\`\`\`jsx
function handleClick() {
  setCount((c) => c + 1);
  setCount(count + 5);
  setCount((c) => c * 2);
}
\`\`\``,
    options: [
      { content: '`10`: 0 → 1 (updater), bị thay bằng 0 + 5 = 5, rồi 5 × 2', correct: true },
      { content: '`12`: 0 → 1 (updater), cộng thêm 5 thành 6, rồi 6 × 2' },
      { content: '`2`: 0 → 1 (updater), lệnh `count + 5` bị bỏ, rồi 1 × 2' },
      { content: '`0`: lệnh cuối ghi đè cả hàng đợi, 0 (snapshot) × 2' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Chạy ở development, app bọc trong \`<StrictMode>\`. \`ChatRoom\` mount với \`roomId="a"\`, sau đó prop đổi thành \`"b"\`. Toàn bộ log theo thứ tự là gì?

\`\`\`jsx
function ChatRoom({ roomId }) {
  useEffect(() => {
    console.log('connect ' + roomId);
    return () => console.log('disconnect ' + roomId);
  }, [roomId]);
  return <h1>{roomId}</h1>;
}
\`\`\``,
    options: [
      { content: '`connect a` → `connect a` → `disconnect a` → `connect b`' },
      { content: '`connect a` → `disconnect a` → `connect b`' },
      { content: '`connect a` → `disconnect a` → `connect a` → `disconnect a` → `connect b` → `disconnect b` → `connect b`' },
      { content: '`connect a` → `disconnect a` → `connect a` → `disconnect a` → `connect b`', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Không bật StrictMode, không dùng React Compiler. \`items\` giữ nguyên tham chiếu; cha lần lượt truyền \`filter\` là \`"a"\` (mount), \`"b"\`, \`"a"\`, rồi lại \`"a"\`. \`expensiveFilter\` được gọi tổng cộng mấy lần?

\`\`\`jsx
function List({ items, filter }) {
  const visible = useMemo(
    () => expensiveFilter(items, filter),
    [items, filter]
  );
  return <Rows rows={visible} />;
}
\`\`\``,
    options: [
      { content: '`2` lần: `useMemo` lưu kết quả theo từng bộ dependency, về `"a"` thì lấy lại từ cache' },
      { content: '`3` lần: React nhớ kết quả gần nhất; `"a"` thứ hai tính lại, `"a"` cuối thì không', correct: true },
      { content: '`4` lần: `useMemo` tính lại mỗi khi cha render lại và truyền prop xuống component' },
      { content: '`1` lần: `items` không đổi, mà `useMemo` tính lại khi mọi dependency cùng đổi một lúc' },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: `Không dùng React Compiler. Gốc ứng dụng render \`<AuthProvider><App /></AuthProvider>\`; \`App\` và \`Clock\` không gọi \`useContext\`, ngoài \`now\` không có state nào khác thay đổi. Những phát biểu nào đúng?

\`\`\`jsx
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <AuthContext value={{ user, setUser }}>
      <Clock time={now} />
      {children}
    </AuthContext>
  );
}
\`\`\``,
    options: [
      { content: 'Mỗi giây, mọi component trong `children` gọi `useContext(AuthContext)` đều render lại dù `user` không đổi', correct: true },
      { content: 'Mỗi giây, `App` vẫn bị render lại theo `AuthProvider`, vì mặc định component con render lại khi cha render lại' },
      { content: 'Bọc component đang gọi `useContext(AuthContext)` trong `memo` giúp nó không còn render lại mỗi giây nữa' },
      { content: 'Bọc `value` bằng `useMemo(() => ({ user, setUser }), [user])` thì consumer trong `children` hết render lại mỗi giây', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: 'Một tooltip đo chiều cao của chính nó trong effect rồi gọi `setState` để đổi vị trí. Trên máy chậm, lần render lại do `setState` này mất khoảng 300 ms. Người dùng thấy gì với `useEffect` và với `useLayoutEffect`?',
    options: [
      { content: '`useEffect`: có thể thấy tooltip ở vị trí sai trong lúc chờ; `useLayoutEffect`: cũng thấy vị trí sai, nhưng ngắn hơn' },
      { content: '`useEffect`: có thể thấy tooltip ở vị trí sai trong lúc chờ; `useLayoutEffect`: tooltip ẩn, phần còn lại của trang vẫn vẽ' },
      { content: '`useEffect`: có thể thấy tooltip ở vị trí sai trong lúc chờ; `useLayoutEffect`: trình duyệt không vẽ lại tới khi xong', correct: true },
      { content: '`useEffect`: trình duyệt không vẽ lại tới khi xong; `useLayoutEffect`: có thể thấy tooltip ở vị trí sai trong lúc chờ' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Bấm nút lần đầu tiên. \`console.log\` in ra giá trị nào của \`count\` và \`textContent\`?

\`\`\`jsx
import { flushSync } from 'react-dom';

function Counter() {
  const [count, setCount] = useState(0);
  const spanRef = useRef(null);
  function handleClick() {
    flushSync(() => setCount(count + 1));
    console.log(count, spanRef.current.textContent);
  }
  return <button onClick={handleClick}><span ref={spanRef}>{count}</span></button>;
}
\`\`\``,
    options: [
      { content: '`count` là 0, `textContent` là "0": `flushSync` xếp lịch render, DOM đổi sau khi handler kết thúc' },
      { content: '`count` là 1, `textContent` là "1": render đã xong nên biến `count` cũng mang giá trị mới' },
      { content: '`count` là 1, `textContent` là "0": biến đổi ngay, còn DOM chờ tới lần vẽ kế tiếp' },
      { content: '`count` là 0, `textContent` là "1": DOM đã cập nhật, nhưng `count` vẫn là snapshot cũ', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: '`Counter` giữ state đếm riêng; người dùng đã bấm tăng tới 3. Sau đó `flag` đổi giá trị và component cha render lại. Với những cách viết nào, số đếm hiển thị về 0?',
    options: [
      { content: '`{flag ? <Counter color="red" /> : <Counter color="blue" />}`' },
      { content: '`{flag ? <div><Counter /></div> : <section><Counter /></section>}`', correct: true },
      { content: '`{flag && <Counter />}{!flag && <Counter />}`', correct: true },
      { content: '`{flag ? <div className="a"><Counter /></div> : <div className="b"><Counter /></div>}`' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `\`Albums\` đọc dữ liệu qua nguồn hỗ trợ Suspense (vd. \`use()\` với promise có cache). Album của nghệ sĩ 1 đang hiển thị, người dùng bấm "Nghệ sĩ 2". Phát biểu nào đúng?

\`\`\`jsx
function ArtistPage() {
  const [artistId, setArtistId] = useState(1);
  return (
    <>
      <button onClick={() => setArtistId(2)}>Nghệ sĩ 2</button>
      <Suspense fallback={<Spinner />}>
        <Albums artistId={artistId} />
      </Suspense>
    </>
  );
}
\`\`\``,
    options: [
      { content: 'Album cũ bị thay bằng `Spinner` tới khi có dữ liệu mới; bọc `setArtistId(2)` trong `startTransition` thì album cũ được giữ lại trong lúc chờ', correct: true },
      { content: 'Album cũ được giữ tới khi có dữ liệu mới, vì Suspense không ẩn nội dung đã hiển thị; bọc trong `startTransition` cũng không thay đổi gì thêm' },
      { content: 'Hiện `Spinner`; bọc trong `startTransition` thì vẫn hiện `Spinner`, chỉ khác là dữ liệu được tải với độ ưu tiên thấp hơn' },
      { content: 'Album cũ được giữ tới khi có dữ liệu mới; bọc trong `startTransition` thì `Spinner` hiện ngay để báo đang chuyển trang' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Gõ "x" vào ô của dòng A, "y" vào ô của dòng B, rồi bấm "Xoá" ở dòng A. Các ô nhập còn lại hiển thị gì?

\`\`\`jsx
function List() {
  const [items, setItems] = useState(['A', 'B', 'C']);
  return (
    <ul>
      {items.map((item, i) => (
        <li key={i}>
          {item} <input />
          <button onClick={() => setItems(items.filter((x) => x !== item))}>Xoá</button>
        </li>
      ))}
    </ul>
  );
}
\`\`\``,
    options: [
      { content: 'Dòng B có "y", dòng C trống: React xoá đúng `<li>` của A' },
      { content: 'Dòng B có "x", dòng C có "y": `<li>` key 0 và 1 được giữ, key 2 bị xoá', correct: true },
      { content: 'Dòng B và C đều trống: danh sách đổi nên mọi `<li>` được tạo lại' },
      { content: 'Dòng B có "x", dòng C trống: React giữ DOM của key 0, tạo mới phần còn lại' },
    ],
  },
  {
    difficulty: 'hard', type: 'multiple_choice',
    stem: `Không dùng React Compiler. Mỗi lần gõ phím, \`Editor\` render lại (\`id\` không đổi). Truyền prop nào dưới đây cho \`Toolbar\` sẽ khiến nó render lại ở mỗi lần gõ?

\`\`\`jsx
const Toolbar = memo(function Toolbar(props) {
  /* ... */
});

function Editor({ id }) {
  const [text, setText] = useState('');
  const save = useCallback(() => saveDoc(id), [id]);
  // ô nhập gọi setText mỗi lần gõ
  return <Toolbar /* prop đang xét */ />;
}
\`\`\``,
    options: [
      { content: '`onSave={() => saveDoc(id)}`', correct: true },
      { content: '`onSave={save}` (`save` lấy từ `useCallback` ở trên)' },
      { content: '`label="Lưu"`' },
      { content: '`icon={<SaveIcon />}`', correct: true },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `Chạy ở development, app bọc trong \`<StrictMode>\`. Ba tiêu đề hiển thị số khách nào?

\`\`\`jsx
let guest = 0;

function Cup() {
  guest = guest + 1;
  return <h2>Tea cup for guest #{guest}</h2>;
}

export default function TeaSet() {
  return <><Cup /><Cup /><Cup /></>;
}
\`\`\``,
    options: [
      { content: '#1, #2, #3: StrictMode phát hiện lỗi qua cảnh báo, không gọi component thêm' },
      { content: '#1, #3, #5: mỗi `Cup` được gọi hai lần, kết quả lần gọi đầu được hiển thị' },
      { content: '#2, #4, #6: mỗi `Cup` được gọi hai lần liền, kết quả lần gọi sau được dùng', correct: true },
      { content: '#4, #5, #6: cả cây được render một lượt nháp rồi mới render lượt thật' },
    ],
  },
  {
    difficulty: 'hard', type: 'single_choice',
    stem: `\`Form\` render lần đầu với \`showAge={false}\`, sau đó cha đổi thành \`showAge={true}\`. Điều gì xảy ra ở lần render thứ hai?

\`\`\`jsx
function Form({ showAge }) {
  const [name, setName] = useState('An');
  if (showAge) {
    const [age, setAge] = useState(20);
  }
  const [email, setEmail] = useState('a@x.vn');
  return <p>{name} {email}</p>;
}
\`\`\``,
    options: [
      { content: '`age` là 20, `email` vẫn "a@x.vn": React nhận diện state theo tên biến' },
      { content: '`age` nhận "a@x.vn" từ ô nhớ cũ, `email` được khởi tạo mới, không lỗi' },
      { content: 'Chạy bình thường ở production; development cảnh báo thứ tự hook thay đổi' },
      { content: 'React ném lỗi: lần render này gọi nhiều hook hơn lần render trước', correct: true },
    ],
  },
];
