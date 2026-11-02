import type { SeedCourse } from '../types.ts';

// Mã nguồn bài code viết bằng String.raw để giữ nguyên "\n" trong code, không bị JS hiểu thành xuống dòng thật.
export const COURSES: SeedCourse[] = [
  {
    instructorEmail: 'minh.nguyen@skillpath.test',
    categorySlug: 'web-development',
    topics: [{ slug: 'react', primary: true }, { slug: 'javascript' }],
    language: 'vi',
    level: 'beginner',
    priceAmount: 499_000,
    status: 'published',
    title: 'React từ cơ bản đến thực chiến với Hooks',
    subtitle: 'Tự tay dựng ứng dụng quản lý công việc với React, Hooks và gọi API thật',
    description:
      'Bạn đã viết được JavaScript nhưng mỗi lần mở một dự án React lại thấy rối: state nằm ở đâu, vì sao component render lại liên tục, useEffect chạy lúc nào và tại sao danh sách hiển thị sai thứ tự. Khoá học này đi thẳng vào những câu hỏi đó bằng cách cùng bạn xây một ứng dụng quản lý công việc hoàn chỉnh, từ màn hình trống đến bản build sẵn sàng deploy.\n\n' +
      'Thay vì học rời rạc từng API, mỗi bài đều gắn với một tính năng thật của dự án:\n' +
      '• Chia giao diện thành component nhỏ, truyền dữ liệu bằng props và giữ state ở đúng chỗ\n' +
      '• Dùng useState đúng cách, hiểu vì sao cập nhật dạng hàm tránh được lỗi mất dữ liệu\n' +
      '• Gọi API bằng fetch trong useEffect, xử lý trạng thái loading, lỗi và huỷ request khi rời trang\n' +
      '• Tách logic ra custom hook để component gọn và dễ kiểm thử\n\n' +
      'Mỗi chương kết thúc bằng một phần việc cụ thể trên dự án, và trong khoá có bài code chạy tự động giúp bạn luyện kỹ năng biến đổi mảng dữ liệu trước khi render, việc mà lập trình viên React làm gần như mỗi ngày. Mình giải thích từng dòng code, chỉ ra những lỗi người mới hay gặp như quên key, gọi setState trong vòng lặp render hay để effect chạy vô hạn, và cách đọc thông báo lỗi để tự sửa.\n\n' +
      'Khoá học phù hợp với bạn đã nắm cú pháp JavaScript ES6 và muốn có nền tảng React vững để đi tiếp lên Next.js hoặc đi làm frontend. Học xong, bạn tự tin đọc hiểu một dự án React có sẵn, tự dựng giao diện từ bản thiết kế và biết cách tổ chức code để dự án lớn dần mà không rối.',
    learningObjectives: [
      'Xây component có props và state rõ ràng, tái sử dụng được ở nhiều màn hình',
      'Dùng useState và cập nhật state dạng hàm để tránh lỗi đọc giá trị cũ',
      'Viết useEffect có mảng phụ thuộc đúng và hàm dọn dẹp khi component unmount',
      'Gọi API bằng fetch, hiển thị loading, thông báo lỗi và huỷ request đang chạy',
      'Tách logic dùng chung thành custom hook và build ứng dụng để deploy',
    ],
    requirements: [
      'Nắm cú pháp JavaScript ES6: let/const, arrow function, destructuring, map/filter',
      'Biết HTML và CSS cơ bản',
    ],
    targetAudience: [
      'Lập trình viên mới muốn chuyển sang frontend với React',
      'Sinh viên CNTT cần nền tảng React cho đồ án hoặc đi thực tập',
    ],
    thumbnail: { label: 'React', tagline: 'Hooks thực chiến' },
    sections: [
      {
        title: 'Làm quen với React',
        lectures: [
          'Giới thiệu khoá học và ứng dụng quản lý công việc sẽ xây',
          'Cài đặt môi trường với Node.js và Vite',
          'JSX hoạt động thế nào và khác HTML ở đâu',
        ],
      },
      {
        title: 'Component, props và state',
        lectures: [
          'Chia giao diện thành component và truyền dữ liệu qua props',
          'useState: quản lý state và cập nhật dạng hàm',
          'Render danh sách với key và gom nhóm dữ liệu trước khi hiển thị',
        ],
      },
      {
        title: 'Side effect và dữ liệu từ server',
        lectures: [
          'useEffect, mảng phụ thuộc và hàm dọn dẹp',
          'Gọi API bằng fetch: trạng thái loading, lỗi và huỷ request',
        ],
      },
      {
        title: 'Tổ chức ứng dụng',
        lectures: ['Custom hook useTodos để tách logic khỏi giao diện', 'Hoàn thiện dự án và build để deploy'],
      },
    ],
    quiz: {
      title: 'Kiểm tra: React và Hooks cơ bản',
      description: 'Ôn lại JSX, props, state, effect và cách React render danh sách.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Khi gọi setCount(count + 1) hai lần liên tiếp trong cùng một handler, count tăng bao nhiêu sau lần render tiếp theo?',
          relatedLecture: 4,
          options: [
            { content: 'Tăng 1', correct: true, explanation: 'Cả hai lần gọi đều đọc cùng giá trị count của lần render hiện tại, nên kết quả chỉ là count + 1.' },
            { content: 'Tăng 2', explanation: 'Chỉ tăng 2 khi dùng dạng hàm setCount(c => c + 1), vì mỗi lần nhận giá trị mới nhất.' },
            { content: 'Không tăng', explanation: 'State vẫn được cập nhật, React chỉ gom các lần gọi lại và render một lần.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Trong JSX, bạn gán class CSS cho một thẻ div bằng thuộc tính nào?',
          relatedLecture: 2,
          options: [
            { content: 'class', explanation: 'class là từ khoá của JavaScript, JSX không dùng tên này cho thuộc tính.' },
            { content: 'className', correct: true, explanation: 'JSX biên dịch thành lời gọi JavaScript nên dùng className, khớp với thuộc tính DOM cùng tên.' },
            { content: 'cssClass', explanation: 'Không có thuộc tính cssClass trong React, giá trị này sẽ bị bỏ qua.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Component con nhận danh sách todo qua props và muốn đánh dấu một todo là đã xong. Cách làm đúng là gì?',
          relatedLecture: 3,
          options: [
            { content: 'Sửa trực tiếp mảng props.todos', explanation: 'Props là chỉ đọc. Sửa trực tiếp không làm React render lại và gây lỗi khó tìm.' },
            { content: 'Component cha truyền thêm một hàm callback, component con gọi hàm đó', correct: true, explanation: 'State nằm ở cha thì chỉ cha được đổi. Truyền callback xuống là cách chuẩn để con báo cho cha cập nhật.' },
            { content: 'Copy props vào state riêng của component con rồi sửa', explanation: 'Làm vậy tạo hai nguồn dữ liệu, cha không biết thay đổi và hai bên sẽ lệch nhau.' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Những phát biểu nào đúng về useEffect?',
          relatedLecture: 6,
          options: [
            { content: 'Mảng phụ thuộc rỗng [] làm effect chỉ chạy sau lần render đầu tiên', correct: true, explanation: 'Không có phụ thuộc nào thay đổi nên effect không chạy lại sau lần mount.' },
            { content: 'Hàm return trong effect chạy khi component unmount hoặc trước lần chạy effect kế tiếp', correct: true, explanation: 'Đây là hàm dọn dẹp, dùng để huỷ timer, subscription hoặc request đang chạy.' },
            { content: 'Effect chạy trước khi React vẽ giao diện lên màn hình', explanation: 'useEffect chạy sau khi giao diện đã được vẽ. Muốn chạy trước khi vẽ thì dùng useLayoutEffect.' },
            { content: 'Bỏ hẳn mảng phụ thuộc thì effect không bao giờ chạy', explanation: 'Ngược lại, không có mảng phụ thuộc thì effect chạy sau mọi lần render.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Vì sao không nên dùng index của mảng làm key khi danh sách có thể thêm, xoá hoặc sắp xếp lại?',
          relatedLecture: 5,
          options: [
            { content: 'Vì index không phải chuỗi', explanation: 'key chấp nhận cả số, kiểu dữ liệu không phải vấn đề.' },
            { content: 'Vì khi thứ tự đổi, cùng một index trỏ sang phần tử khác nên React gắn nhầm state và DOM', correct: true, explanation: 'key giúp React nhận ra phần tử nào là phần tử nào giữa các lần render. Index đổi theo vị trí nên không ổn định.' },
            { content: 'Vì React cấm dùng index làm key', explanation: 'React không cấm, chỉ cảnh báo khi thiếu key. Index vẫn chấp nhận được với danh sách tĩnh.' },
          ],
        },
      ],
    },
    exercise: {
      title: 'Gom todo theo trạng thái',
      learningObjective: 'Biến đổi mảng dữ liệu thành cấu trúc nhóm để render danh sách theo từng cột trạng thái',
      instructions:
        'Ứng dụng quản lý công việc cần hiển thị todo theo từng cột trạng thái. Hãy viết chương trình gom todo theo trạng thái.\n\n' +
        'Input (stdin):\n' +
        '• Dòng đầu là số n (0 ≤ n ≤ 1000).\n' +
        '• n dòng tiếp theo, mỗi dòng có dạng "<trạng thái> <tiêu đề>". Trạng thái là một từ không có dấu cách, tiêu đề là phần còn lại của dòng.\n\n' +
        'Output (stdout): mỗi trạng thái một dòng theo thứ tự xuất hiện lần đầu, dạng "<trạng thái>: <tiêu đề 1>, <tiêu đề 2>". Các tiêu đề giữ đúng thứ tự trong input.\n\n' +
        'Ví dụ input:\n3\ntodo Viết test\ndone Sửa bug\ntodo Review PR\n\n' +
        'Output:\ntodo: Viết test, Review PR\ndone: Sửa bug',
      hints: [
        'Dùng Map để giữ thứ tự xuất hiện của trạng thái',
        'Tách trạng thái và tiêu đề tại dấu cách đầu tiên bằng indexOf, vì tiêu đề có thể chứa dấu cách',
      ],
      solutionExplanation:
        'Duyệt các dòng một lần, gom tiêu đề vào Map<trạng thái, tiêu đề[]>. Map giữ thứ tự chèn nên khi duyệt lại để in, các trạng thái tự đúng thứ tự xuất hiện lần đầu. Độ phức tạp O(n).',
      difficulty: 'easy',
      relatedLecture: 5,
      code: [
        {
          language: 'javascript',
          starter: String.raw`const input = require('fs').readFileSync(0, 'utf8');

// Trả về chuỗi kết quả, mỗi trạng thái một dòng.
function groupTodos(input) {
  const lines = input.split('\n');
  // Viết code của bạn ở đây
  return '';
}

console.log(groupTodos(input));
`,
          solution: String.raw`const input = require('fs').readFileSync(0, 'utf8');

function groupTodos(input) {
  const lines = input.split('\n').map((line) => line.trim());
  const n = Number(lines[0]);
  const groups = new Map();
  for (let i = 1; i <= n; i++) {
    const space = lines[i].indexOf(' ');
    const status = lines[i].slice(0, space);
    const title = lines[i].slice(space + 1);
    if (!groups.has(status)) groups.set(status, []);
    groups.get(status).push(title);
  }
  const out = [];
  for (const [status, titles] of groups) out.push(status + ': ' + titles.join(', '));
  return out.join('\n');
}

console.log(groupTodos(input));
`,
        },
      ],
      tests: [
        {
          input: '3\ntodo Viết test\ndone Sửa bug\ntodo Review PR\n',
          expectedOutput: 'todo: Viết test, Review PR\ndone: Sửa bug',
          isPublic: true,
        },
        {
          input: '5\ndoing Thiết kế form đăng nhập\ntodo Viết API giỏ hàng\ndone Cài đặt Vite\ndoing Gọi API danh sách\ntodo Viết test cho hook\n',
          expectedOutput: 'doing: Thiết kế form đăng nhập, Gọi API danh sách\ntodo: Viết API giỏ hàng, Viết test cho hook\ndone: Cài đặt Vite',
          isPublic: true,
        },
        { input: '1\nblocked Chờ backend trả schema\n', expectedOutput: 'blocked: Chờ backend trả schema', isPublic: false },
        { input: '4\ndone A\ndone B\ndone C\ntodo D\n', expectedOutput: 'done: A, B, C\ntodo: D', isPublic: false },
      ],
    },
  },
  {
    instructorEmail: 'minh.nguyen@skillpath.test',
    categorySlug: 'web-development',
    topics: [{ slug: 'nextjs', primary: true }, { slug: 'react' }, { slug: 'typescript' }],
    language: 'vi',
    level: 'intermediate',
    priceAmount: 799_000,
    status: 'published',
    title: 'Next.js App Router: xây ứng dụng fullstack',
    subtitle: 'Xây ứng dụng fullstack với Server Component, Server Actions và Route Handler, sẵn sàng lên production',
    description:
      'Bạn đã làm React được một thời gian và giờ muốn bước sang Next.js, nhưng App Router thay đổi khá nhiều so với Pages Router cũ: component mặc định chạy trên server, dữ liệu được cache theo nhiều tầng, form có thể gửi thẳng lên server mà không cần viết API riêng. Nếu chỉ đọc tài liệu, rất dễ trộn lẫn hai mô hình và gặp lỗi kiểu "useState only works in Client Components" mà không hiểu vì sao.\n\n' +
      'Khoá học này xây trọn một ứng dụng quản lý bài viết có đăng nhập, trang công khai và trang quản trị. Qua dự án, bạn sẽ hiểu rõ:\n' +
      '• Routing theo thư mục, layout lồng nhau, route động và catch-all, cách Next.js chọn route khi nhiều route cùng khớp\n' +
      '• Ranh giới Server Component và Client Component, khi nào cần "use client"\n' +
      '• Fetch dữ liệu trên server, cache, revalidate và streaming với Suspense\n' +
      '• Server Actions cho form, Route Handler cho client bên ngoài và proxy (middleware) bảo vệ trang cần đăng nhập\n\n' +
      'Mỗi chương có phần giải thích cơ chế bên dưới bằng sơ đồ đơn giản, sau đó áp dụng ngay vào dự án. Bài code cuối chương routing yêu cầu bạn tự viết bộ so khớp URL theo đúng quy tắc ưu tiên của App Router, để không còn đoán mò khi route của mình không chạy như ý.\n\n' +
      'Khoá học dành cho bạn đã vững React và biết TypeScript ở mức cơ bản. Học xong, bạn có thể tự thiết kế cấu trúc thư mục cho một dự án Next.js thật, chọn đúng cách lấy và ghi dữ liệu cho từng màn hình, và build ứng dụng để deploy lên máy chủ của mình.',
    learningObjectives: [
      'Thiết kế cấu trúc thư mục app với layout lồng nhau, route động và catch-all',
      'Phân biệt Server Component và Client Component, đặt "use client" đúng chỗ',
      'Lấy dữ liệu trên server với cache, revalidate và hiển thị dần bằng Suspense',
      'Viết Server Actions xử lý form và Route Handler phục vụ client bên ngoài',
      'Bảo vệ route cần đăng nhập bằng proxy (middleware) và build ứng dụng cho production',
    ],
    requirements: [
      'Đã làm dự án nhỏ với React và Hooks',
      'Biết TypeScript cơ bản: type, interface, generic đơn giản',
    ],
    targetAudience: [
      'Lập trình viên React muốn chuyển sang Next.js App Router',
      'Lập trình viên frontend muốn tự làm được cả phần server cho dự án nhỏ',
    ],
    thumbnail: { label: 'Next.js', tagline: 'Fullstack với App Router' },
    sections: [
      {
        title: 'Nền tảng App Router',
        lectures: [
          'Giới thiệu khoá học và kiến trúc ứng dụng mẫu',
          'Khởi tạo dự án Next.js với TypeScript và cấu trúc thư mục app',
          'Routing theo thư mục: page, layout, route động và catch-all',
        ],
      },
      {
        title: 'Server Component và lấy dữ liệu',
        lectures: [
          'Server Component và Client Component: ranh giới "use client"',
          'Fetch dữ liệu trên server, cache và revalidate',
          'loading.tsx, error.tsx và Suspense streaming',
        ],
      },
      {
        title: 'Ghi dữ liệu và xác thực',
        lectures: [
          'Server Actions cho form thêm và sửa bài viết',
          'Route Handler làm API cho client bên ngoài',
          'Proxy (trước đây là middleware) bảo vệ route cần đăng nhập',
        ],
      },
      {
        title: 'Đưa lên production',
        lectures: ['Metadata, tối ưu ảnh và build production'],
      },
    ],
    quiz: {
      title: 'Kiểm tra: App Router',
      description: 'Ôn lại routing, Server Component, cache và Server Actions.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Dự án có hai route app/blog/new/page.tsx và app/blog/[slug]/page.tsx. Người dùng mở /blog/new thì trang nào được render?',
          relatedLecture: 2,
          options: [
            { content: 'app/blog/new/page.tsx', correct: true, explanation: 'Segment tĩnh luôn được ưu tiên hơn segment động khi cùng khớp URL.' },
            { content: 'app/blog/[slug]/page.tsx với slug = "new"', explanation: 'Route động chỉ dùng khi không có segment tĩnh nào khớp ở cùng vị trí.' },
            { content: 'Next.js báo lỗi xung đột route khi build', explanation: 'Route tĩnh và route động cùng cấp là hợp lệ, Next.js có quy tắc ưu tiên rõ ràng.' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Những việc nào làm được trực tiếp trong một Server Component?',
          relatedLecture: 3,
          options: [
            { content: 'Truy vấn cơ sở dữ liệu bằng await', correct: true, explanation: 'Server Component chạy trên server và có thể là hàm async, nên gọi DB trực tiếp được.' },
            { content: 'Đọc biến môi trường bí mật như khoá API', correct: true, explanation: 'Code chỉ chạy trên server nên biến bí mật không bị gửi xuống trình duyệt.' },
            { content: 'Dùng useState để lưu giá trị ô input', explanation: 'Hook có state chỉ chạy trong Client Component, cần thêm "use client".' },
            { content: 'Gắn onClick cho nút bấm', explanation: 'Sự kiện trình duyệt cần JavaScript phía client, Server Component không gắn được handler.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'fetch(url, { next: { revalidate: 60 } }) trong Server Component có ý nghĩa gì?',
          relatedLecture: 4,
          options: [
            { content: 'Gọi lại API mỗi 60 giây kể cả khi không có ai truy cập', explanation: 'Next.js không chạy nền theo lịch, việc làm mới chỉ xảy ra khi có request.' },
            { content: 'Dùng dữ liệu đã cache, sau 60 giây request kế tiếp sẽ kích hoạt lấy dữ liệu mới', correct: true, explanation: 'Đây là cơ chế stale-while-revalidate: người dùng nhận bản cache, bản mới được tạo ở nền.' },
            { content: 'Huỷ request nếu API phản hồi chậm hơn 60 giây', explanation: 'revalidate không liên quan đến timeout, muốn huỷ request cần dùng AbortController.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'File loading.tsx đặt cạnh page.tsx dùng để làm gì?',
          relatedLecture: 5,
          options: [
            { content: 'Hiển thị giao diện tạm trong lúc page đang chờ dữ liệu', correct: true, explanation: 'Next.js tự bọc page trong Suspense và dùng loading.tsx làm fallback.' },
            { content: 'Tải trước JavaScript cho các trang khác', explanation: 'Việc prefetch do thẻ Link đảm nhận, không liên quan loading.tsx.' },
            { content: 'Bắt lỗi khi page ném exception', explanation: 'Bắt lỗi là việc của error.tsx.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Muốn một hàm async được gọi từ form như Server Action, bạn cần làm gì?',
          relatedLecture: 6,
          options: [
            { content: 'Đặt hàm trong thư mục app/api', explanation: 'app/api là nơi đặt Route Handler, không biến hàm thành Server Action.' },
            { content: 'Đánh dấu "use server" ở đầu hàm hoặc đầu file chứa hàm', correct: true, explanation: 'Chỉ thị "use server" báo cho Next.js tạo endpoint ẩn để form gọi hàm này trên server.' },
            { content: 'Đánh dấu "use client" để form gọi được', explanation: '"use client" đánh dấu code chạy ở trình duyệt, ngược với mục đích của Server Action.' },
          ],
        },
      ],
    },
    exercise: {
      title: 'Bộ so khớp route kiểu App Router',
      learningObjective: 'Hiểu cách App Router chọn route khi nhiều route cùng khớp và tách params từ URL',
      instructions:
        'Viết chương trình chọn route cho mỗi URL theo quy tắc của App Router.\n\n' +
        'Input (stdin):\n' +
        '• Dòng đầu là số r, r dòng tiếp theo là các route. Mỗi segment của route là tĩnh (blog), động ([slug]) hoặc catch-all ([...path]). Route "/" là trang chủ.\n' +
        '• Dòng tiếp theo là số m, m dòng sau là các URL cần kiểm tra.\n\n' +
        'Quy tắc khớp: segment tĩnh phải giống hệt, segment động khớp đúng một segment của URL, catch-all khớp một hoặc nhiều segment còn lại. Nếu nhiều route cùng khớp, so sánh từng segment từ trái sang phải: tĩnh ưu tiên hơn động, động ưu tiên hơn catch-all. Hai route giống hệt về loại segment thì lấy route khai báo trước.\n\n' +
        'Output (stdout): mỗi URL một dòng "<url> -> <route>" kèm params theo thứ tự trong route dạng " tên=giá_trị" (catch-all nối các segment bằng "/"). Không route nào khớp thì in "<url> -> 404".\n\n' +
        'Ví dụ input:\n3\n/blog\n/blog/[slug]\n/docs/[...path]\n3\n/blog/hello\n/docs/a/b\n/docs\n\n' +
        'Output:\n/blog/hello -> /blog/[slug] slug=hello\n/docs/a/b -> /docs/[...path] path=a/b\n/docs -> 404',
      hints: [
        'Tách route và URL thành mảng segment bằng split("/") rồi bỏ phần tử rỗng',
        'Gán hạng cho từng segment: tĩnh = 0, động = 1, catch-all = 2, rồi so sánh mảng hạng của các route khớp',
      ],
      solutionExplanation:
        'Với mỗi URL, thử khớp lần lượt từng route và thu params. Route khớp được biểu diễn bằng mảng hạng segment; so sánh hai mảng theo thứ tự từ điển, hạng nhỏ hơn ở vị trí khác nhau đầu tiên là route cụ thể hơn. Giữ route tốt nhất, nếu không có route nào khớp thì in 404.',
      difficulty: 'medium',
      relatedLecture: 2,
      code: [
        {
          language: 'javascript',
          starter: String.raw`const input = require('fs').readFileSync(0, 'utf8');

// Trả về các dòng kết quả, mỗi URL một dòng.
function resolveRoutes(input) {
  const lines = input.split('\n').map((line) => line.trim());
  // Viết code của bạn ở đây
  return '';
}

console.log(resolveRoutes(input));
`,
          solution: String.raw`const input = require('fs').readFileSync(0, 'utf8');

function segments(path) {
  return path.split('/').filter(Boolean);
}

function rank(seg) {
  if (seg.startsWith('[...')) return 2;
  if (seg.startsWith('[')) return 1;
  return 0;
}

function match(routeSegs, urlSegs) {
  const params = [];
  let j = 0;
  for (const seg of routeSegs) {
    if (j >= urlSegs.length) return null;
    const r = rank(seg);
    if (r === 2) {
      params.push(seg.slice(4, -1) + '=' + urlSegs.slice(j).join('/'));
      j = urlSegs.length;
    } else {
      if (r === 0 && seg !== urlSegs[j]) return null;
      if (r === 1) params.push(seg.slice(1, -1) + '=' + urlSegs[j]);
      j++;
    }
  }
  return j === urlSegs.length ? params : null;
}

function moreSpecific(a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) return a[i] < b[i];
  }
  return a.length > b.length;
}

function resolveRoutes(input) {
  const lines = input.split('\n').map((line) => line.trim());
  const r = Number(lines[0]);
  const routes = lines.slice(1, r + 1).map((path) => ({ path, segs: segments(path) }));
  const m = Number(lines[r + 1]);
  const out = [];
  for (const url of lines.slice(r + 2, r + 2 + m)) {
    const urlSegs = segments(url);
    let best = null;
    for (const route of routes) {
      const params = match(route.segs, urlSegs);
      if (!params) continue;
      const ranks = route.segs.map(rank);
      if (!best || moreSpecific(ranks, best.ranks)) best = { route, params, ranks };
    }
    if (!best) out.push(url + ' -> 404');
    else out.push([url + ' -> ' + best.route.path, ...best.params].join(' '));
  }
  return out.join('\n');
}

console.log(resolveRoutes(input));
`,
        },
      ],
      tests: [
        {
          input: '5\n/\n/blog\n/blog/[slug]\n/blog/new\n/docs/[...path]\n5\n/\n/blog/new\n/blog/hoc-nextjs\n/docs/routing/dynamic\n/docs\n',
          expectedOutput:
            '/ -> /\n/blog/new -> /blog/new\n/blog/hoc-nextjs -> /blog/[slug] slug=hoc-nextjs\n/docs/routing/dynamic -> /docs/[...path] path=routing/dynamic\n/docs -> 404',
          isPublic: true,
        },
        {
          input: '4\n/shop/[category]/[id]\n/shop/[category]/sale\n/shop/[...rest]\n/account\n5\n/shop/laptop/sale\n/shop/laptop/42\n/shop/laptop\n/account/settings\n/account\n',
          expectedOutput:
            '/shop/laptop/sale -> /shop/[category]/sale category=laptop\n/shop/laptop/42 -> /shop/[category]/[id] category=laptop id=42\n/shop/laptop -> /shop/[...rest] rest=laptop\n/account/settings -> 404\n/account -> /account',
          isPublic: false,
        },
        {
          input: '3\n/[lang]\n/[lang]/about\n/[...all]\n3\n/vi\n/en/about\n/en/blog/post-1\n',
          expectedOutput: '/vi -> /[lang] lang=vi\n/en/about -> /[lang]/about lang=en\n/en/blog/post-1 -> /[...all] all=en/blog/post-1',
          isPublic: false,
        },
        { input: '1\n/dashboard\n2\n/\n/dashboard\n', expectedOutput: '/ -> 404\n/dashboard -> /dashboard', isPublic: false },
      ],
    },
  },
  {
    instructorEmail: 'minh.nguyen@skillpath.test',
    categorySlug: 'web-development',
    topics: [{ slug: 'typescript', primary: true }, { slug: 'javascript' }],
    language: 'en',
    level: 'intermediate',
    priceAmount: 0,
    status: 'published',
    title: 'TypeScript for JavaScript Developers',
    subtitle: 'Add strict, practical types to your JavaScript projects and catch bugs before they reach users',
    description:
      'You already ship JavaScript, and you have probably lost an afternoon to a bug that came down to undefined being passed where a string was expected. TypeScript removes a whole class of these mistakes, but many developers bounce off it: the compiler errors feel cryptic, the type system looks endless, and it is not obvious which features matter in day-to-day work.\n\n' +
      'This course focuses on the part of TypeScript you will use every week. We start from a plain JavaScript project, turn on strict mode, and fix the errors one by one so you understand what the compiler is protecting you from. Along the way you will learn:\n' +
      '• How inference works, and why unknown is safer than any for data you do not control\n' +
      '• Union types, narrowing and discriminated unions for modelling states such as loading, success and error\n' +
      '• Interfaces, type aliases, generics and the built-in utility types Partial, Pick, Omit and Record\n' +
      '• Why types disappear at runtime, and how to validate JSON from an API or a form at the boundary\n\n' +
      'Every lesson is built around a small, realistic example instead of abstract puzzles. The coding exercise asks you to write a tiny runtime validator for JSON objects, which shows exactly where static types stop and runtime checks must take over. The final module walks through migrating an existing JavaScript codebase file by file, so you can introduce TypeScript at work without a risky big-bang rewrite.\n\n' +
      'By the end you will read TypeScript errors with confidence, design types that describe your data honestly, and know when a type annotation adds value and when inference already does the job for you.',
    learningObjectives: [
      'Configure tsconfig.json with strict mode and fix the errors it reports in an existing project',
      'Model application states with union types and discriminated unions, and narrow them safely',
      'Write generic functions and reuse types with Partial, Pick, Omit and Record',
      'Validate untrusted JSON at runtime before treating it as a typed value',
      'Plan an incremental migration of a JavaScript codebase to TypeScript',
    ],
    requirements: [
      'Comfortable with modern JavaScript: modules, arrow functions, destructuring and promises',
      'Node.js installed and basic command-line experience',
    ],
    targetAudience: [
      'JavaScript developers who want to adopt TypeScript at work',
      'Frontend or Node.js developers joining a team that already uses TypeScript',
    ],
    thumbnail: { label: 'TypeScript', tagline: 'Types that catch real bugs' },
    sections: [
      {
        title: 'Getting started',
        lectures: ['Course overview and why teams adopt TypeScript', 'Setting up tsc, tsconfig.json and strict mode'],
      },
      {
        title: 'Everyday types',
        lectures: [
          'Type annotations, inference and the any vs unknown trade-off',
          'Union types, narrowing and discriminated unions',
          'Interfaces vs type aliases for object shapes',
        ],
      },
      {
        title: 'Reusable types',
        lectures: [
          'Generics in functions and data structures',
          'Utility types: Partial, Pick, Omit and Record',
          'Validating untrusted data at runtime boundaries',
        ],
      },
      {
        title: 'TypeScript in real projects',
        lectures: ['Migrating an existing JavaScript codebase file by file'],
      },
    ],
    quiz: {
      title: 'Quiz: TypeScript essentials',
      description: 'Check your understanding of narrowing, generics, utility types and runtime validation.',
      questions: [
        {
          type: 'single_choice',
          stem: 'A function receives a value typed as unknown. What must you do before calling value.toUpperCase()?',
          relatedLecture: 2,
          options: [
            { content: 'Nothing, unknown allows any operation', explanation: 'That describes any. unknown blocks every operation until the type is narrowed.' },
            { content: 'Narrow it first, for example with typeof value === "string"', correct: true, explanation: 'After the typeof check the compiler knows the value is a string inside that branch.' },
            { content: 'Cast it with as unknown[]', explanation: 'An array cast does not give you string methods and hides the real problem.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Given type Result = { kind: "ok"; data: string } | { kind: "error"; message: string }, how does TypeScript know that data exists?',
          relatedLecture: 3,
          options: [
            { content: 'By checking result.kind === "ok" in an if or switch', correct: true, explanation: 'kind is the discriminant. Comparing it narrows the union to the matching member.' },
            { content: 'By checking result.data !== undefined', explanation: 'Accessing data is a compile error on the union before it is narrowed, so this check is rejected.' },
            { content: 'It always knows, because both members are objects', explanation: 'Only properties shared by every member are accessible without narrowing.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'What is the inferred return type of first(["a", "b"]) for function first<T>(items: T[]): T | undefined?',
          relatedLecture: 5,
          options: [
            { content: 'string', explanation: 'The signature explicitly adds undefined because the array might be empty.' },
            { content: 'string | undefined', correct: true, explanation: 'T is inferred as string from the argument, then substituted into T | undefined.' },
            { content: 'unknown', explanation: 'Generic inference picks string from the argument, so the result is not unknown.' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Given interface User { id: number; name: string; email: string }, which types accept the object literal { id: 1, name: "Lan" }?',
          relatedLecture: 6,
          options: [
            { content: 'Partial<User>', correct: true, explanation: 'Partial makes every property optional, so a missing email is fine.' },
            { content: 'Omit<User, "email">', correct: true, explanation: 'Omit removes email, leaving exactly id and name.' },
            { content: 'Pick<User, "id">', explanation: 'Pick keeps only id, and the excess property check rejects name in an object literal.' },
            { content: 'Required<User>', explanation: 'Required keeps email mandatory, so the literal is missing a property.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Why do you still need runtime validation for JSON returned by an API, even with strict TypeScript?',
          relatedLecture: 7,
          options: [
            { content: 'Because strict mode is disabled for fetch calls', explanation: 'Strict mode applies to all code. The issue is what happens after compilation.' },
            { content: 'Because types are erased at compile time and the server can send any shape', correct: true, explanation: 'A type annotation on response.json() is only a promise to the compiler. Nothing checks the real data unless you validate it.' },
            { content: 'Because JSON.parse always returns a string', explanation: 'JSON.parse returns any parsed value. The problem is that its shape is not verified.' },
          ],
        },
      ],
    },
    exercise: {
      title: 'Validate JSON against a simple schema',
      learningObjective: 'Check untrusted data at runtime the way a schema validator does before trusting a static type',
      instructions:
        'Types disappear at runtime, so data from an API must be validated before you treat it as typed. Write a tiny validator.\n\n' +
        'Input (stdin):\n' +
        '• Line 1 is the schema: space-separated fields in the form name:type. A field marked name?:type is optional. Supported types are string, number, boolean, string[], number[] and boolean[].\n' +
        '• Every following non-empty line is one JSON value to check.\n\n' +
        'Rules, checked in order for each value: if the line is not valid JSON, report "invalid JSON". If the value is not a plain object, report "expected object, got <actual>". Then check schema fields from left to right and report only the first problem: a required field that is absent gives "<field>: missing"; a present field with the wrong type gives "<field>: expected <type>, got <actual>"; for array types, a wrong element gives "<field>[<index>]: expected <item type>, got <actual>". An optional field may be absent, but if present it must match. Extra fields are ignored. <actual> is null, array, or the JavaScript typeof result.\n\n' +
        'Output (stdout): one line per value, "#<n> OK" or "#<n> <problem>", numbered from 1.\n\n' +
        'Example input:\nname:string age:number\n{"name":"Lan","age":28}\n{"name":"Minh","age":"30"}\n\n' +
        'Output:\n#1 OK\n#2 age: expected number, got string',
      hints: [
        'Write a describe(value) helper that returns "null", "array" or typeof value',
        'Wrap JSON.parse in try/catch to detect invalid JSON',
        'Strip the trailing "[]" from a type to get the expected element type',
      ],
      solutionExplanation:
        'Parse the schema once into a list of { name, type, optional }. For each line, parse the JSON, reject non-objects, then walk the schema in order and return the first problem found. Array types check Array.isArray first and then each element. Returning early keeps the output to one problem per value, like most validators do by default.',
      difficulty: 'medium',
      relatedLecture: 7,
      code: [
        {
          language: 'javascript',
          starter: String.raw`const input = require('fs').readFileSync(0, 'utf8');

// Return one result line per JSON value.
function validateAll(input) {
  const lines = input.split('\n').map((line) => line.trim());
  // Write your code here
  return '';
}

console.log(validateAll(input));
`,
          solution: String.raw`const input = require('fs').readFileSync(0, 'utf8');

function describe(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function parseSchema(line) {
  return line.split(/\s+/).filter(Boolean).map((part) => {
    const colon = part.indexOf(':');
    const rawName = part.slice(0, colon);
    const optional = rawName.endsWith('?');
    return { name: optional ? rawName.slice(0, -1) : rawName, type: part.slice(colon + 1), optional };
  });
}

function check(schema, value) {
  if (describe(value) !== 'object') return 'expected object, got ' + describe(value);
  for (const field of schema) {
    const v = value[field.name];
    if (v === undefined) {
      if (field.optional) continue;
      return field.name + ': missing';
    }
    if (field.type.endsWith('[]')) {
      const item = field.type.slice(0, -2);
      if (!Array.isArray(v)) return field.name + ': expected ' + field.type + ', got ' + describe(v);
      for (let i = 0; i < v.length; i++) {
        if (describe(v[i]) !== item) return field.name + '[' + i + ']: expected ' + item + ', got ' + describe(v[i]);
      }
    } else if (describe(v) !== field.type) {
      return field.name + ': expected ' + field.type + ', got ' + describe(v);
    }
  }
  return 'OK';
}

function validateAll(input) {
  const lines = input.split('\n').map((line) => line.trim());
  const schema = parseSchema(lines[0]);
  const values = lines.slice(1).filter(Boolean);
  return values
    .map((line, i) => {
      let value;
      try {
        value = JSON.parse(line);
      } catch {
        return '#' + (i + 1) + ' invalid JSON';
      }
      return '#' + (i + 1) + ' ' + check(schema, value);
    })
    .join('\n');
}

console.log(validateAll(input));
`,
        },
      ],
      tests: [
        {
          input:
            'name:string age:number tags:string[] email?:string\n{"name":"Lan","age":28,"tags":["admin","dev"]}\n{"name":"Minh","age":"30","tags":[]}\n{"name":"Huy","tags":["ops"],"email":"huy@example.com"}\n',
          expectedOutput: '#1 OK\n#2 age: expected number, got string\n#3 age: missing',
          isPublic: true,
        },
        {
          input:
            'id:number active:boolean scores:number[]\n{"id":1,"active":true,"scores":[9,7.5]}\n{"id":2,"active":"yes","scores":[]}\n{"id":3,"active":false,"scores":[8,"10"]}\n[1,2,3]\n',
          expectedOutput:
            '#1 OK\n#2 active: expected boolean, got string\n#3 scores[1]: expected number, got string\n#4 expected object, got array',
          isPublic: true,
        },
        {
          input: 'title:string note?:string\n{"title":"Draft","note":null}\n{"title":null}\n{"title":"Ship it","note":"v2"}\n',
          expectedOutput: '#1 note: expected string, got null\n#2 title: expected string, got null\n#3 OK',
          isPublic: false,
        },
        {
          input: 'code:string\n{"code":"A1"}\n{code: "B2"}\n42\n',
          expectedOutput: '#1 OK\n#2 invalid JSON\n#3 expected object, got number',
          isPublic: false,
        },
      ],
    },
  },
  {
    instructorEmail: 'huy.do@skillpath.test',
    categorySlug: 'web-development',
    topics: [{ slug: 'html', primary: true }, { slug: 'css' }, { slug: 'web-development' }],
    language: 'vi',
    level: 'beginner',
    priceAmount: 0,
    status: 'published',
    title: 'HTML & CSS cho người mới bắt đầu',
    subtitle: 'Tự dựng trang web cá nhân responsive bằng HTML ngữ nghĩa, Flexbox và CSS Grid từ con số không',
    description:
      'Bạn muốn làm web nhưng chưa biết bắt đầu từ đâu, hoặc đã thử copy vài đoạn HTML trên mạng mà trang vẫn vỡ bố cục khi mở trên điện thoại. Khoá học này dành cho người hoàn toàn mới, đi từ việc tạo file HTML đầu tiên đến khi bạn tự dựng được một trang giới thiệu cá nhân gọn gàng, hiển thị tốt trên cả máy tính lẫn điện thoại.\n\n' +
      'Mình không bắt bạn học thuộc danh sách thẻ hay thuộc tính. Mỗi bài giải quyết một vấn đề cụ thể bạn sẽ gặp khi làm trang thật:\n' +
      '• Viết HTML có cấu trúc rõ ràng với header, main, section, footer để trình duyệt và công cụ tìm kiếm hiểu đúng nội dung\n' +
      '• Làm form có label đầy đủ để người dùng bàn phím và trình đọc màn hình vẫn dùng được\n' +
      '• Hiểu selector, độ ưu tiên và box model để biết vì sao CSS của mình "không ăn"\n' +
      '• Dàn trang bằng Flexbox và CSS Grid thay vì float và căn lề thủ công\n\n' +
      'Mỗi chương đều có phần thực hành ngay trên dự án trang cá nhân, kèm code mẫu trong bài để bạn so sánh khi bị kẹt. Mình cũng chỉ cách dùng DevTools của trình duyệt để soi từng phần tử, xem CSS nào đang áp dụng và sửa trực tiếp, kỹ năng giúp bạn tự gỡ lỗi thay vì đoán mò.\n\n' +
      'Khoá học không yêu cầu kiến thức lập trình trước đó. Học xong, bạn có một trang web của riêng mình để đưa vào hồ sơ, nắm chắc nền tảng HTML và CSS để học tiếp JavaScript, React hay bất kỳ framework frontend nào sau này.',
    learningObjectives: [
      'Viết trang HTML đúng cấu trúc với các thẻ ngữ nghĩa header, nav, main, section, footer',
      'Tạo form có label và thuộc tính phù hợp để mọi người dùng đều thao tác được',
      'Giải thích độ ưu tiên selector và box model để sửa lỗi CSS không áp dụng',
      'Dàn bố cục bằng Flexbox và CSS Grid, căn giữa phần tử theo cả hai chiều',
      'Làm trang responsive theo hướng mobile-first với media query',
    ],
    requirements: ['Máy tính cài trình duyệt hiện đại, không cần biết lập trình trước'],
    targetAudience: [
      'Người mới hoàn toàn muốn bước đầu vào nghề lập trình web',
      'Sinh viên năm nhất cần nền tảng HTML, CSS cho môn học và đồ án',
    ],
    thumbnail: { label: 'HTML & CSS', tagline: 'Trang web đầu tay' },
    sections: [
      {
        title: 'HTML nền tảng',
        lectures: [
          'Giới thiệu khoá học và cài đặt VS Code, Live Server',
          'Cấu trúc trang HTML và các thẻ ngữ nghĩa header, main, footer',
          'Form, input, label và thuộc tính giúp trang dễ truy cập',
        ],
      },
      {
        title: 'CSS cơ bản',
        lectures: ['Selector, độ ưu tiên và cách CSS cascade', 'Box model: margin, padding, border và box-sizing'],
      },
      {
        title: 'Bố cục hiện đại',
        lectures: [
          'Flexbox: căn hàng ngang, dọc và chia khoảng cách',
          'CSS Grid cho bố cục nhiều cột',
          'Responsive với media query và thiết kế mobile-first',
        ],
      },
      {
        title: 'Dự án cuối khoá',
        lectures: ['Dựng trang giới thiệu cá nhân và đưa lên hosting miễn phí'],
      },
    ],
    quiz: {
      title: 'Kiểm tra: HTML và CSS nền tảng',
      description: 'Ôn lại thẻ ngữ nghĩa, độ ưu tiên selector, box model và bố cục.',
      questions: [
        {
          type: 'multiple_choice',
          stem: 'Những thẻ nào là thẻ ngữ nghĩa, cho biết vai trò của vùng nội dung?',
          relatedLecture: 1,
          options: [
            { content: '<nav>', correct: true, explanation: 'nav đánh dấu vùng chứa liên kết điều hướng chính.' },
            { content: '<main>', correct: true, explanation: 'main chứa nội dung chính, mỗi trang chỉ nên có một.' },
            { content: '<div>', explanation: 'div chỉ là khối chứa chung, không mang ý nghĩa gì về nội dung.' },
            { content: '<span>', explanation: 'span là phần tử inline chung, dùng để gắn style, không có ngữ nghĩa.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Vì sao mỗi ô input trong form nên có thẻ <label for="..."> tương ứng?',
          relatedLecture: 2,
          options: [
            { content: 'Để trình đọc màn hình đọc được tên ô và bấm vào chữ cũng focus được ô', correct: true, explanation: 'label gắn với id của input giúp cả người dùng khiếm thị lẫn người dùng chuột thao tác dễ hơn.' },
            { content: 'Vì thiếu label thì form không gửi được', explanation: 'Form vẫn gửi bình thường, nhưng trải nghiệm và khả năng truy cập kém đi.' },
            { content: 'Để input tự có viền đẹp hơn', explanation: 'label không thay đổi giao diện của input.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Hai rule "#menu a { color: red }" và ".nav a { color: blue }" cùng áp lên một liên kết. Liên kết có màu gì?',
          relatedLecture: 3,
          options: [
            { content: 'Đỏ', correct: true, explanation: 'Selector có id có độ ưu tiên cao hơn selector chỉ có class, bất kể thứ tự viết.' },
            { content: 'Xanh', explanation: 'Thứ tự viết chỉ quyết định khi hai selector có cùng độ ưu tiên.' },
            { content: 'Màu mặc định của trình duyệt', explanation: 'Cả hai rule đều khớp nên chắc chắn một trong hai được áp dụng.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Một hộp có box-sizing: border-box; width: 200px; padding: 20px; border: 2px solid. Chiều rộng hiển thị là bao nhiêu?',
          relatedLecture: 4,
          options: [
            { content: '200px', correct: true, explanation: 'Với border-box, width đã bao gồm padding và border.' },
            { content: '244px', explanation: 'Đây là kết quả với content-box, khi padding và border cộng thêm vào width.' },
            { content: '240px', explanation: 'Cách tính này cộng padding nhưng bỏ quên border, và vẫn sai với border-box.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Theo hướng mobile-first, bạn viết CSS cho màn hình nhỏ trước, rồi mở rộng cho màn hình lớn bằng media query nào?',
          relatedLecture: 7,
          options: [
            { content: '@media (min-width: 768px)', correct: true, explanation: 'min-width áp dụng từ kích thước đó trở lên, đúng tinh thần thêm dần cho màn hình lớn.' },
            { content: '@media (max-width: 768px)', explanation: 'max-width dùng cho cách desktop-first, khi thu gọn dần cho màn hình nhỏ.' },
            { content: '@media print', explanation: 'print chỉ áp dụng khi in trang, không liên quan đến kích thước màn hình.' },
          ],
        },
      ],
    },
  },
  {
    instructorEmail: 'huy.do@skillpath.test',
    categorySlug: 'programming-languages',
    topics: [{ slug: 'javascript', primary: true }, { slug: 'web-development' }],
    language: 'vi',
    level: 'beginner',
    priceAmount: 0,
    status: 'published',
    title: 'JavaScript nền tảng cho người mới',
    subtitle: 'Nắm chắc biến, hàm, mảng, object và bất đồng bộ để tự viết chương trình JavaScript đầu tiên',
    description:
      'JavaScript là ngôn ngữ chạy trong mọi trình duyệt và cũng là cửa ngõ vào React, Node.js hay React Native. Nhưng nhiều bạn học JavaScript theo kiểu chắp vá: thuộc vài cú pháp, copy vài đoạn code, rồi bối rối khi gặp == và ===, khi mảng bị thay đổi ngoài ý muốn hay khi console.log in ra theo thứ tự lạ.\n\n' +
      'Khoá học này xây nền tảng theo đúng thứ tự một người mới cần, mỗi khái niệm đi kèm ví dụ nhỏ chạy được ngay:\n' +
      '• Biến, kiểu dữ liệu, toán tử so sánh và câu lệnh điều kiện\n' +
      '• Vòng lặp, hàm, tham số mặc định và arrow function\n' +
      '• Mảng và object, cùng bộ ba map, filter, reduce để xử lý dữ liệu gọn gàng\n' +
      '• Thao tác DOM, bắt sự kiện và viết code bất đồng bộ với Promise, async/await\n\n' +
      'Mình dùng Node.js để chạy các bài tập xử lý dữ liệu và trình duyệt cho phần DOM, nên bạn thấy JavaScript hoạt động ở cả hai môi trường. Bài code cuối khoá là chương trình xếp loại học sinh: đọc dữ liệu đầu vào, tính toán và in kết quả, được chấm tự động để bạn biết ngay mình làm đúng hay chưa.\n\n' +
      'Khoá học không yêu cầu kinh nghiệm lập trình, chỉ cần bạn biết dùng máy tính và sẵn sàng gõ code theo từng bài. Học xong, bạn đọc hiểu được code JavaScript thông thường, tự giải các bài toán xử lý dữ liệu đơn giản và đủ nền tảng để bước tiếp sang một framework frontend hoặc backend.',
    learningObjectives: [
      'Khai báo biến với let, const và phân biệt các kiểu dữ liệu cơ bản',
      'Viết điều kiện và vòng lặp, giải thích khác biệt giữa == và ===',
      'Viết hàm, arrow function và xử lý mảng bằng map, filter, reduce',
      'Chọn phần tử DOM, đổi nội dung và bắt sự kiện click, submit',
      'Dùng Promise và async/await để gọi dữ liệu bất đồng bộ',
    ],
    requirements: ['Biết dùng máy tính cơ bản, không cần kinh nghiệm lập trình'],
    targetAudience: [
      'Người mới bắt đầu học lập trình với JavaScript',
      'Bạn đã học HTML, CSS và muốn làm trang web có tương tác',
    ],
    thumbnail: { label: 'JavaScript', tagline: 'Nền tảng vững từ đầu' },
    sections: [
      {
        title: 'Bắt đầu với JavaScript',
        lectures: [
          'Giới thiệu khoá học và chạy JavaScript trong trình duyệt, Node.js',
          'Biến let, const và các kiểu dữ liệu cơ bản',
          'Toán tử, so sánh == và === và câu lệnh if',
        ],
      },
      {
        title: 'Hàm và cấu trúc dữ liệu',
        lectures: [
          'Vòng lặp for, while và for...of',
          'Hàm, tham số mặc định và arrow function',
          'Mảng và object: map, filter, reduce',
        ],
      },
      {
        title: 'JavaScript trên trang web',
        lectures: ['DOM: chọn phần tử, đổi nội dung và bắt sự kiện', 'Bất đồng bộ với Promise và async/await'],
      },
    ],
    quiz: {
      title: 'Kiểm tra: JavaScript nền tảng',
      description: 'Ôn lại so sánh, biến, vòng lặp, xử lý mảng và bất đồng bộ.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Biểu thức "5" === 5 cho kết quả gì?',
          relatedLecture: 2,
          options: [
            { content: 'true', explanation: 'Đây là kết quả của "5" == 5, vì == ép kiểu trước khi so sánh.' },
            { content: 'false', correct: true, explanation: '=== so sánh cả kiểu dữ liệu, chuỗi và số khác kiểu nên kết quả là false.' },
            { content: 'Báo lỗi TypeError', explanation: 'So sánh hai kiểu khác nhau là hợp lệ, không gây lỗi.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Với const items = [1, 2]; câu lệnh items.push(3) cho kết quả gì?',
          relatedLecture: 1,
          options: [
            { content: 'Báo lỗi vì items là const', explanation: 'const chỉ cấm gán lại biến, không cấm thay đổi nội dung mảng.' },
            { content: 'items trở thành [1, 2, 3]', correct: true, explanation: 'push thay đổi chính mảng mà biến đang trỏ tới, biến vẫn trỏ cùng một mảng.' },
            { content: 'items vẫn là [1, 2]', explanation: 'push thay đổi mảng gốc, không tạo bản sao.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Khi duyệt mảng ["a", "b"], vòng lặp for...of trả về gì ở mỗi lượt?',
          relatedLecture: 3,
          options: [
            { content: 'Giá trị "a" rồi "b"', correct: true, explanation: 'for...of duyệt giá trị của đối tượng có thể lặp như mảng, chuỗi.' },
            { content: 'Chỉ số "0" rồi "1"', explanation: 'Đây là hành vi của for...in, vốn duyệt tên thuộc tính.' },
            { content: 'Cặp [chỉ số, giá trị]', explanation: 'Muốn có cặp này phải duyệt arr.entries().' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Những phương thức nào trả về một mảng mới và không thay đổi mảng gốc?',
          relatedLecture: 5,
          options: [
            { content: 'map', correct: true, explanation: 'map tạo mảng mới chứa kết quả của hàm với từng phần tử.' },
            { content: 'filter', correct: true, explanation: 'filter tạo mảng mới chỉ gồm các phần tử thoả điều kiện.' },
            { content: 'forEach', explanation: 'forEach chỉ chạy hàm cho từng phần tử và trả về undefined.' },
            { content: 'push', explanation: 'push thay đổi mảng gốc và trả về độ dài mới.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Đoạn code console.log("A"); setTimeout(() => console.log("B"), 0); console.log("C"); in ra theo thứ tự nào?',
          relatedLecture: 7,
          options: [
            { content: 'A, B, C', explanation: 'setTimeout dù 0ms vẫn đưa callback vào hàng đợi, chỉ chạy khi code đồng bộ đã xong.' },
            { content: 'A, C, B', correct: true, explanation: 'Code đồng bộ chạy hết trước, sau đó event loop mới lấy callback của setTimeout ra chạy.' },
            { content: 'B, A, C', explanation: 'Callback không bao giờ chạy trước code đồng bộ đứng trước nó.' },
          ],
        },
      ],
    },
    exercise: {
      title: 'Xếp loại học sinh và tính điểm trung bình',
      learningObjective: 'Đọc dữ liệu dạng văn bản, dùng điều kiện và reduce để xếp loại và tính trung bình',
      instructions:
        'Viết chương trình xếp loại học sinh theo điểm.\n\n' +
        'Input (stdin):\n' +
        '• Dòng đầu là số n (1 ≤ n ≤ 100).\n' +
        '• n dòng tiếp theo, mỗi dòng gồm họ tên rồi đến điểm, cách nhau bằng dấu cách. Họ tên có thể nhiều từ, điểm là số từ 0 đến 10, có thể có phần thập phân.\n\n' +
        'Xếp loại: điểm ≥ 8 là "Giỏi", ≥ 6.5 là "Khá", ≥ 5 là "Trung bình", còn lại là "Yếu".\n\n' +
        'Output (stdout): n dòng dạng "<họ tên>: <xếp loại>" theo thứ tự input, rồi dòng cuối "Điểm trung bình lớp: <x>" với x làm tròn 2 chữ số thập phân.\n\n' +
        'Ví dụ input:\n2\nNguyễn Văn An 8.5\nLê Hoàng Cường 4\n\n' +
        'Output:\nNguyễn Văn An: Giỏi\nLê Hoàng Cường: Yếu\nĐiểm trung bình lớp: 6.25',
      hints: [
        'Điểm là từ cuối cùng của dòng: dùng lastIndexOf(" ") để tách họ tên và điểm',
        'Dùng reduce để cộng tổng điểm và toFixed(2) để làm tròn',
      ],
      solutionExplanation:
        'Với mỗi dòng, tách tại dấu cách cuối cùng để lấy họ tên và điểm, đổi điểm sang số bằng Number. Hàm grade trả về xếp loại bằng chuỗi if theo ngưỡng từ cao xuống thấp. Cuối cùng cộng tổng bằng reduce, chia cho n và in với toFixed(2).',
      difficulty: 'easy',
      relatedLecture: 5,
      code: [
        {
          language: 'javascript',
          starter: String.raw`const input = require('fs').readFileSync(0, 'utf8');

// Trả về chuỗi kết quả gồm n dòng xếp loại và dòng điểm trung bình.
function rankStudents(input) {
  const lines = input.split('\n').map((line) => line.trim());
  // Viết code của bạn ở đây
  return '';
}

console.log(rankStudents(input));
`,
          solution: String.raw`const input = require('fs').readFileSync(0, 'utf8');

function grade(score) {
  if (score >= 8) return 'Giỏi';
  if (score >= 6.5) return 'Khá';
  if (score >= 5) return 'Trung bình';
  return 'Yếu';
}

function rankStudents(input) {
  const lines = input.split('\n').map((line) => line.trim());
  const n = Number(lines[0]);
  const students = lines.slice(1, n + 1).map((line) => {
    const space = line.lastIndexOf(' ');
    return { name: line.slice(0, space), score: Number(line.slice(space + 1)) };
  });
  const out = students.map((s) => s.name + ': ' + grade(s.score));
  const total = students.reduce((sum, s) => sum + s.score, 0);
  out.push('Điểm trung bình lớp: ' + (total / n).toFixed(2));
  return out.join('\n');
}

console.log(rankStudents(input));
`,
        },
      ],
      tests: [
        {
          input: '4\nNguyễn Văn An 8.5\nTrần Thị Bình 6.5\nLê Hoàng Cường 4\nPhạm Thu Dung 7\n',
          expectedOutput:
            'Nguyễn Văn An: Giỏi\nTrần Thị Bình: Khá\nLê Hoàng Cường: Yếu\nPhạm Thu Dung: Khá\nĐiểm trung bình lớp: 6.50',
          isPublic: true,
        },
        {
          input: '2\nNgô Hải 6.4\nĐỗ Mai 7.6\n',
          expectedOutput: 'Ngô Hải: Trung bình\nĐỗ Mai: Khá\nĐiểm trung bình lớp: 7.00',
          isPublic: true,
        },
        {
          input: '3\nHồ Minh Khang 10\nVũ Thảo 5\nĐặng Quốc Bảo 8\n',
          expectedOutput: 'Hồ Minh Khang: Giỏi\nVũ Thảo: Trung bình\nĐặng Quốc Bảo: Giỏi\nĐiểm trung bình lớp: 7.67',
          isPublic: false,
        },
        { input: '1\nBùi Lan 4.9\n', expectedOutput: 'Bùi Lan: Yếu\nĐiểm trung bình lớp: 4.90', isPublic: false },
      ],
    },
  },
  {
    instructorEmail: 'huy.do@skillpath.test',
    categorySlug: 'web-development',
    topics: [{ slug: 'angular', primary: true }, { slug: 'typescript' }],
    language: 'vi',
    level: 'intermediate',
    priceAmount: 0,
    status: 'published',
    title: 'Angular thực chiến cho dự án doanh nghiệp',
    subtitle: 'Xây ứng dụng quản trị bằng Angular với Signals, RxJS, Reactive Forms và kiến trúc dễ bảo trì',
    description:
      'Angular thường được chọn cho các hệ thống nội bộ lớn: màn hình quản trị nhiều form, nhiều quyền, nhiều nhóm cùng làm trên một codebase. Khi vào dự án như vậy, thứ làm bạn chậm lại không phải cú pháp mà là kiến trúc: service đặt ở đâu, dữ liệu chảy thế nào giữa các component, gọi API sao cho không trùng lặp và form phức tạp validate ra sao.\n\n' +
      'Khoá học này xây một ứng dụng quản lý đơn hàng nội bộ theo cách một dự án doanh nghiệp thật vẫn làm:\n' +
      '• Standalone component, routing có lazy loading và route guard theo quyền\n' +
      '• Service và dependency injection chia theo tầng, tránh component ôm hết logic\n' +
      '• Signals cho state cục bộ, RxJS cho luồng sự kiện như ô tìm kiếm với debounceTime và switchMap\n' +
      '• HttpClient với interceptor gắn token, xử lý lỗi tập trung và Reactive Forms có validator tự viết\n\n' +
      'Mỗi bài đều giải thích lý do đằng sau lựa chọn, ví dụ khi nào dùng signal thay vì BehaviorSubject, để bạn tự quyết định được trong dự án của mình. Bài code của khoá yêu cầu bạn mô phỏng lại hành vi debounceTime kết hợp distinctUntilChanged, giúp bạn hiểu chính xác vì sao ô tìm kiếm chỉ gửi đúng một request khi người dùng ngừng gõ.\n\n' +
      'Khoá học phù hợp với bạn đã biết TypeScript và từng làm qua một framework frontend. Học xong, bạn có thể tham gia một dự án Angular có sẵn, đọc hiểu cấu trúc component và service, tự xây màn hình mới đúng chuẩn và viết unit test cho phần logic quan trọng.',
    learningObjectives: [
      'Tổ chức ứng dụng bằng standalone component, routing lazy loading và route guard',
      'Thiết kế service theo tầng và dùng dependency injection đúng phạm vi',
      'Quản lý state bằng signal, computed và xử lý luồng sự kiện bằng RxJS',
      'Gọi API qua HttpClient với interceptor gắn token và xử lý lỗi tập trung',
      'Xây Reactive Forms có validator tự viết và viết unit test cho component, service',
    ],
    requirements: [
      'Biết TypeScript cơ bản: class, interface, generic',
      'Đã làm qua ít nhất một dự án frontend nhỏ',
    ],
    targetAudience: [
      'Lập trình viên frontend sắp tham gia dự án Angular ở doanh nghiệp',
      'Lập trình viên Angular muốn cập nhật Signals và standalone component',
    ],
    thumbnail: { label: 'Angular', tagline: 'Kiến trúc cho dự án lớn' },
    sections: [
      {
        title: 'Khởi động',
        lectures: ['Giới thiệu khoá học và cài Angular CLI', 'Standalone component, template và data binding'],
      },
      {
        title: 'Kiến trúc ứng dụng',
        lectures: [
          'Service và dependency injection theo từng tầng',
          'Routing, lazy loading và route guard',
          'Signals: signal, computed và effect',
        ],
      },
      {
        title: 'Dữ liệu và form',
        lectures: [
          'HttpClient, interceptor gắn token và xử lý lỗi',
          'RxJS trong Angular: debounceTime, switchMap cho ô tìm kiếm',
          'Reactive Forms và validator tự viết',
        ],
      },
      {
        title: 'Chất lượng mã',
        lectures: ['Viết unit test cho component và service'],
      },
    ],
    quiz: {
      title: 'Kiểm tra: Angular thực chiến',
      description: 'Ôn lại dependency injection, routing, Signals, HttpClient và RxJS.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Service khai báo @Injectable({ providedIn: "root" }) có đặc điểm gì?',
          relatedLecture: 2,
          options: [
            { content: 'Có một instance dùng chung cho toàn ứng dụng', correct: true, explanation: 'providedIn root đăng ký service ở injector gốc nên mọi nơi inject đều nhận cùng instance.' },
            { content: 'Mỗi component inject sẽ nhận một instance mới', explanation: 'Muốn instance riêng cho component phải khai báo trong mảng providers của component đó.' },
            { content: 'Phải thêm vào providers của AppModule mới dùng được', explanation: 'providedIn root đã tự đăng ký, không cần khai báo thêm.' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Những phát biểu nào đúng về route dùng loadComponent để lazy loading?',
          relatedLecture: 3,
          options: [
            { content: 'Code của component chỉ được tải khi người dùng vào route đó', correct: true, explanation: 'loadComponent trả về một import động, bundler tách code thành file riêng.' },
            { content: 'Giúp giảm dung lượng JavaScript tải ở lần mở trang đầu tiên', correct: true, explanation: 'Các màn hình chưa dùng không nằm trong bundle ban đầu.' },
            { content: 'Route guard không chạy với route lazy loading', explanation: 'Guard vẫn chạy bình thường, thậm chí chạy trước khi tải code của route.' },
            { content: 'Bắt buộc component phải thuộc một NgModule', explanation: 'loadComponent được thiết kế cho standalone component, không cần NgModule.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Với const price = signal(100); const total = computed(() => price() * 2); gọi price.set(150) thì total() trả về gì?',
          relatedLecture: 4,
          options: [
            { content: '200', explanation: 'computed không lưu giá trị cũ vĩnh viễn, nó được đánh dấu cần tính lại khi signal phụ thuộc đổi.' },
            { content: '300', correct: true, explanation: 'computed theo dõi price và tính lại khi được đọc sau thay đổi.' },
            { content: 'Báo lỗi vì computed là chỉ đọc', explanation: 'computed chỉ đọc nghĩa là không gọi set được trên total, còn đọc giá trị thì vẫn bình thường.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Nên đặt logic gắn header Authorization cho mọi request ở đâu?',
          relatedLecture: 5,
          options: [
            { content: 'Trong từng service gọi API', explanation: 'Lặp lại ở nhiều nơi, dễ sót và khó đổi khi cách xác thực thay đổi.' },
            { content: 'Trong một HTTP interceptor', correct: true, explanation: 'Interceptor chạy cho mọi request qua HttpClient, đặt ở một chỗ duy nhất.' },
            { content: 'Trong route guard', explanation: 'Guard quyết định có vào route hay không, không can thiệp vào request HTTP.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Trong ô tìm kiếm, vì sao dùng switchMap thay vì mergeMap để gọi API theo từ khoá?',
          relatedLecture: 6,
          options: [
            { content: 'switchMap huỷ request cũ khi có từ khoá mới, tránh kết quả cũ về muộn ghi đè kết quả mới', correct: true, explanation: 'Chỉ request của từ khoá mới nhất còn được theo dõi, nên giao diện luôn khớp với ô nhập.' },
            { content: 'switchMap gửi request nhanh hơn', explanation: 'Tốc độ gửi như nhau, khác biệt nằm ở việc huỷ request cũ.' },
            { content: 'mergeMap không dùng được với HttpClient', explanation: 'mergeMap vẫn dùng được, nhưng các request chạy song song và có thể về sai thứ tự.' },
          ],
        },
      ],
    },
    exercise: {
      title: 'Mô phỏng debounceTime và distinctUntilChanged',
      learningObjective: 'Hiểu chính xác khi nào ô tìm kiếm dùng debounceTime và distinctUntilChanged phát ra từ khoá',
      instructions:
        'Ô tìm kiếm dùng pipe(debounceTime(D), distinctUntilChanged()). Hãy tính các từ khoá thực sự được phát ra.\n\n' +
        'Input (stdin):\n' +
        '• Dòng đầu là D (mili giây).\n' +
        '• Mỗi dòng tiếp theo là "<t> <từ khoá>": thời điểm t (mili giây, tăng dần) và nội dung ô nhập lúc đó. Từ khoá có thể chứa dấu cách.\n\n' +
        'Quy tắc: một giá trị được debounce cho qua nếu giá trị kế tiếp đến sau nó ít nhất D mili giây, hoặc nó là giá trị cuối cùng. Giá trị cho qua được phát tại thời điểm t + D, trừ khi nó giống hệt từ khoá vừa phát trước đó.\n\n' +
        'Output (stdout): mỗi từ khoá được phát một dòng "<thời điểm phát> <từ khoá>".\n\n' +
        'Ví dụ input:\n300\n0 rx\n400 rxjs\n500 rxj\n600 rxjs\n1000 rxjs\n\n' +
        'Output:\n300 rx\n900 rxjs',
      hints: [
        'So sánh thời điểm của mỗi giá trị với giá trị ngay sau nó để biết có bị debounce bỏ qua không',
        'Lưu từ khoá vừa phát để bỏ qua giá trị trùng liền kề',
      ],
      solutionExplanation:
        'Đọc toàn bộ sự kiện vào mảng. Với sự kiện thứ i, nếu là sự kiện cuối hoặc t[i+1] - t[i] ≥ D thì debounce cho qua. Sau đó so với từ khoá đã phát gần nhất, chỉ in khi khác. Mỗi sự kiện xét một lần nên độ phức tạp O(n).',
      difficulty: 'medium',
      relatedLecture: 6,
      code: [
        {
          language: 'javascript',
          starter: String.raw`const input = require('fs').readFileSync(0, 'utf8');

// Trả về các dòng "<thời điểm phát> <từ khoá>".
function debounceSearch(input) {
  const lines = input.split('\n').map((line) => line.trim()).filter(Boolean);
  // Viết code của bạn ở đây
  return '';
}

console.log(debounceSearch(input));
`,
          solution: String.raw`const input = require('fs').readFileSync(0, 'utf8');

function debounceSearch(input) {
  const lines = input.split('\n').map((line) => line.trim()).filter(Boolean);
  const delay = Number(lines[0]);
  const events = lines.slice(1).map((line) => {
    const space = line.indexOf(' ');
    return { t: Number(line.slice(0, space)), text: line.slice(space + 1) };
  });
  const out = [];
  let last = null;
  events.forEach((e, i) => {
    const next = events[i + 1];
    if (next && next.t - e.t < delay) return;
    if (e.text === last) return;
    last = e.text;
    out.push(e.t + delay + ' ' + e.text);
  });
  return out.join('\n');
}

console.log(debounceSearch(input));
`,
        },
      ],
      tests: [
        {
          input: '300\n0 rx\n400 rxjs\n500 rxj\n600 rxjs\n1000 rxjs\n',
          expectedOutput: '300 rx\n900 rxjs',
          isPublic: true,
        },
        {
          input: '300\n0 a\n100 an\n250 ang\n700 angular\n900 angular\n1500 angular signals\n',
          expectedOutput: '550 ang\n1200 angular\n1800 angular signals',
          isPublic: true,
        },
        { input: '200\n0 vi\n200 viet\n350 viet nam\n', expectedOutput: '200 vi\n550 viet nam', isPublic: false },
        { input: '500\n1000 hello world\n', expectedOutput: '1500 hello world', isPublic: false },
      ],
    },
  },
  {
    instructorEmail: 'bao.le@skillpath.test',
    categorySlug: 'web-development',
    topics: [{ slug: 'nodejs', primary: true }, { slug: 'javascript' }],
    language: 'vi',
    level: 'beginner',
    priceAmount: 0,
    status: 'published',
    title: 'Node.js & Express: xây REST API',
    subtitle: 'Tự xây REST API hoàn chỉnh với Node.js và Express: định tuyến, middleware, validate và JWT',
    description:
      'Phần lớn ứng dụng web và mobile hiện nay nói chuyện với server qua REST API. Nếu bạn đã biết JavaScript, Node.js và Express là con đường ngắn nhất để tự viết được phần backend đó. Nhưng tự học thường dừng ở mức "chạy được": route nằm hết trong một file, status code trả lung tung, dữ liệu sai vẫn lọt vào cơ sở dữ liệu và lỗi làm sập cả server.\n\n' +
      'Khoá học này xây một API quản lý thư viện sách từ đầu, đi qua đúng những việc một backend developer làm hằng ngày:\n' +
      '• Thiết kế endpoint theo chuẩn REST: chọn phương thức, đường dẫn và status code phù hợp\n' +
      '• Viết middleware cho log, parse JSON và xử lý lỗi tập trung\n' +
      '• Validate dữ liệu đầu vào trước khi lưu, trả thông báo lỗi rõ ràng cho client\n' +
      '• Tách tầng route, service, kết nối cơ sở dữ liệu và bảo vệ route bằng JWT\n\n' +
      'Mỗi bài có code mẫu chạy được và bài tập nhỏ để bạn tự mở rộng API. Bài code chấm tự động mô phỏng một API CRUD sách: bạn nhận chuỗi request, trả về status code và JSON đúng quy ước, qua đó luyện cách suy nghĩ như một server trước khi đụng tới framework.\n\n' +
      'Khoá học dành cho người đã nắm JavaScript cơ bản và chưa từng làm backend. Học xong, bạn tự dựng được một REST API có cấu trúc rõ ràng, biết kiểm thử API bằng công cụ gửi request, cấu hình biến môi trường và chuẩn bị ứng dụng để deploy lên server.',
    learningObjectives: [
      'Tạo server Express, định tuyến theo tài nguyên và trả status code đúng chuẩn REST',
      'Viết middleware cho log, parse body và xử lý lỗi tập trung',
      'Validate dữ liệu đầu vào và trả thông báo lỗi rõ ràng cho client',
      'Tách tầng route, service và kết nối cơ sở dữ liệu',
      'Bảo vệ route bằng JWT và cấu hình biến môi trường để deploy',
    ],
    requirements: [
      'Nắm JavaScript cơ bản: hàm, mảng, object, async/await',
      'Biết dùng terminal ở mức chạy lệnh đơn giản',
    ],
    targetAudience: [
      'Lập trình viên frontend muốn tự viết backend cho dự án của mình',
      'Sinh viên muốn bắt đầu con đường backend với JavaScript',
    ],
    thumbnail: { label: 'Node.js', tagline: 'REST API với Express' },
    sections: [
      {
        title: 'Node.js căn bản',
        lectures: ['Giới thiệu khoá học và cài Node.js, npm', 'Module, npm script và event loop ở mức đủ dùng'],
      },
      {
        title: 'Express và REST',
        lectures: [
          'Tạo server Express đầu tiên và định tuyến',
          'Thiết kế endpoint REST: phương thức, status code và JSON',
          'Middleware: log request, parse body và xử lý lỗi tập trung',
        ],
      },
      {
        title: 'Dữ liệu và bảo mật',
        lectures: [
          'Validate dữ liệu đầu vào trước khi lưu',
          'Kết nối cơ sở dữ liệu và tách tầng route, service',
          'Xác thực bằng JWT và phân quyền route',
        ],
      },
      {
        title: 'Hoàn thiện',
        lectures: ['Viết test API và cấu hình biến môi trường để deploy'],
      },
    ],
    quiz: {
      title: 'Kiểm tra: REST API với Express',
      description: 'Ôn lại status code, phương thức HTTP, middleware và JWT.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Endpoint POST /books tạo sách mới thành công nên trả status code nào?',
          relatedLecture: 3,
          options: [
            { content: '200 OK', explanation: '200 vẫn chạy được nhưng không nói rõ là có tài nguyên mới được tạo.' },
            { content: '201 Created', correct: true, explanation: '201 báo tài nguyên đã được tạo, thường kèm dữ liệu của tài nguyên mới.' },
            { content: '204 No Content', explanation: '204 dùng khi không trả nội dung, ví dụ sau khi xoá thành công.' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Những phương thức HTTP nào là idempotent, tức gọi nhiều lần cho cùng kết quả như gọi một lần?',
          relatedLecture: 3,
          options: [
            { content: 'GET', correct: true, explanation: 'GET chỉ đọc dữ liệu, không thay đổi trạng thái server.' },
            { content: 'PUT', correct: true, explanation: 'PUT ghi đè tài nguyên bằng cùng dữ liệu, gọi lại vẫn ra cùng trạng thái.' },
            { content: 'DELETE', correct: true, explanation: 'Xoá một lần hay nhiều lần thì tài nguyên vẫn ở trạng thái đã bị xoá.' },
            { content: 'POST', explanation: 'Mỗi lần gọi POST /books có thể tạo thêm một bản ghi mới.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Một middleware Express quên gọi next() và cũng không gửi response. Chuyện gì xảy ra?',
          relatedLecture: 4,
          options: [
            { content: 'Express tự chuyển sang middleware tiếp theo', explanation: 'Express chỉ đi tiếp khi next() được gọi.' },
            { content: 'Request bị treo cho đến khi client hết thời gian chờ', correct: true, explanation: 'Không có ai gửi response và chuỗi middleware dừng lại ở đó.' },
            { content: 'Express trả về 404', explanation: '404 mặc định chỉ xảy ra khi request đi hết chuỗi mà không route nào xử lý.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Vì sao req.body là undefined khi client gửi JSON tới route POST?',
          relatedLecture: 4,
          options: [
            { content: 'Chưa đăng ký middleware app.use(express.json())', correct: true, explanation: 'Express không tự parse body, cần middleware express.json() để đọc JSON.' },
            { content: 'Route POST không đọc được body', explanation: 'POST là phương thức phổ biến nhất để gửi body.' },
            { content: 'Phải đọc dữ liệu qua req.query', explanation: 'req.query chứa tham số trên URL, không phải nội dung body.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Phát biểu nào đúng về payload của JWT?',
          relatedLecture: 7,
          options: [
            { content: 'Payload được mã hoá nên có thể chứa mật khẩu', explanation: 'Payload chỉ được mã hoá base64url, ai có token cũng đọc được.' },
            { content: 'Payload ai cũng đọc được, chữ ký chỉ chống sửa đổi', correct: true, explanation: 'Server kiểm tra chữ ký bằng secret để biết token không bị sửa, nên không đặt dữ liệu nhạy cảm vào payload.' },
            { content: 'Payload chỉ server mới giải mã được', explanation: 'Không cần secret để đọc payload, secret chỉ dùng để ký và xác minh.' },
          ],
        },
      ],
    },
    exercise: {
      title: 'Mô phỏng API CRUD sách',
      learningObjective: 'Áp dụng đúng phương thức, status code và validate dữ liệu khi xử lý request REST',
      instructions:
        'Viết chương trình mô phỏng API quản lý sách lưu trong bộ nhớ.\n\n' +
        'Input (stdin): mỗi dòng là một request dạng "<METHOD> <path>" và có thể kèm body JSON sau một dấu cách.\n\n' +
        'Các endpoint:\n' +
        '• GET /books: trả 200 và mảng mọi sách theo thứ tự tạo.\n' +
        '• POST /books: body cần title và author là chuỗi khác rỗng. Hợp lệ thì tạo sách với id tăng dần từ 1, trả 201 và sách vừa tạo. Không hợp lệ thì trả 400 {"error":"title and author are required"} và không dùng hết id.\n' +
        '• GET /books/<id>: trả 200 và sách.\n' +
        '• PUT /books/<id>: cập nhật title, author nếu trong body có giá trị là chuỗi khác rỗng, bỏ qua trường khác. Trả 200 và sách sau khi sửa.\n' +
        '• DELETE /books/<id>: xoá và trả 204, không có body. id đã dùng không được cấp lại.\n' +
        '• Với /books/<id> mà không có sách, trả 404 {"error":"book not found"}.\n\n' +
        'Output (stdout): mỗi request một dòng "<status> <JSON>" (riêng 204 chỉ in "204"). Sách in theo thứ tự khoá id, title, author, JSON không có dấu cách thừa.\n\n' +
        'Ví dụ input:\nPOST /books {"title":"Nhập môn Node.js","author":"Trần An"}\nGET /books/2\n\n' +
        'Output:\n201 {"id":1,"title":"Nhập môn Node.js","author":"Trần An"}\n404 {"error":"book not found"}',
      hints: [
        'Dùng Map<id, sách> để vừa giữ thứ tự tạo vừa tra cứu nhanh theo id',
        'Tách request bằng regex /^(\\S+) (\\S+)(?: (.*))?$/ để body JSON chứa dấu cách vẫn giữ nguyên',
        'JSON.stringify giữ thứ tự khoá theo thứ tự bạn tạo object',
      ],
      solutionExplanation:
        'Giữ một Map lưu sách và biến nextId. Mỗi dòng được tách thành method, path và body. Path /books xử lý GET danh sách và POST tạo mới có validate; path /books/<id> tra sách trước, không có thì trả 404, có thì xử lý GET, PUT hoặc DELETE. Tách hàm handle trả về chuỗi kết quả giúp logic giống một route handler thật.',
      difficulty: 'medium',
      relatedLecture: 3,
      code: [
        {
          language: 'javascript',
          starter: String.raw`const input = require('fs').readFileSync(0, 'utf8');

// Xử lý toàn bộ request và trả về các dòng "<status> <JSON>".
function runApi(input) {
  const requests = input.split('\n').map((line) => line.trim()).filter(Boolean);
  // Viết code của bạn ở đây
  return '';
}

console.log(runApi(input));
`,
          solution: String.raw`const input = require('fs').readFileSync(0, 'utf8');

const isText = (v) => typeof v === 'string' && v.trim() !== '';
const reply = (status, data) => status + ' ' + JSON.stringify(data);
const NOT_FOUND = { error: 'book not found' };

function handle(store, method, path, body) {
  const parts = path.split('/').filter(Boolean);
  if (parts[0] !== 'books' || parts.length > 2) return reply(404, { error: 'route not found' });
  if (parts.length === 1) {
    if (method === 'GET') return reply(200, [...store.books.values()]);
    if (method === 'POST') {
      if (!isText(body.title) || !isText(body.author)) return reply(400, { error: 'title and author are required' });
      const book = { id: store.nextId++, title: body.title, author: body.author };
      store.books.set(book.id, book);
      return reply(201, book);
    }
    return reply(405, { error: 'method not allowed' });
  }
  const id = Number(parts[1]);
  const book = store.books.get(id);
  if (!book) return reply(404, NOT_FOUND);
  if (method === 'GET') return reply(200, book);
  if (method === 'PUT') {
    if (isText(body.title)) book.title = body.title;
    if (isText(body.author)) book.author = body.author;
    return reply(200, book);
  }
  if (method === 'DELETE') {
    store.books.delete(id);
    return '204';
  }
  return reply(405, { error: 'method not allowed' });
}

function runApi(input) {
  const store = { books: new Map(), nextId: 1 };
  const requests = input.split('\n').map((line) => line.trim()).filter(Boolean);
  return requests
    .map((line) => {
      const [, method, path, raw] = line.match(/^(\S+) (\S+)(?: (.*))?$/);
      return handle(store, method, path, raw ? JSON.parse(raw) : {});
    })
    .join('\n');
}

console.log(runApi(input));
`,
        },
      ],
      tests: [
        {
          input:
            'POST /books {"title":"Nhập môn Node.js","author":"Trần An"}\nPOST /books {"title":"Thiếu tác giả"}\nGET /books/1\nGET /books/2\n',
          expectedOutput:
            '201 {"id":1,"title":"Nhập môn Node.js","author":"Trần An"}\n400 {"error":"title and author are required"}\n200 {"id":1,"title":"Nhập môn Node.js","author":"Trần An"}\n404 {"error":"book not found"}',
          isPublic: true,
        },
        {
          input:
            'POST /books {"title":"Express cơ bản","author":"Lê Minh"}\nPOST /books {"title":"REST API thực chiến","author":"Phạm Hà"}\nPUT /books/2 {"title":"REST API thực chiến (bản 2)"}\nDELETE /books/1\nGET /books\n',
          expectedOutput:
            '201 {"id":1,"title":"Express cơ bản","author":"Lê Minh"}\n201 {"id":2,"title":"REST API thực chiến","author":"Phạm Hà"}\n200 {"id":2,"title":"REST API thực chiến (bản 2)","author":"Phạm Hà"}\n204\n200 [{"id":2,"title":"REST API thực chiến (bản 2)","author":"Phạm Hà"}]',
          isPublic: true,
        },
        {
          input:
            'GET /books\nDELETE /books/5\nPUT /books/1 {"author":"Ai đó"}\nPOST /books {"title":"","author":"Vô danh"}\nPOST /books {"title":"Sách A","author":"Tác giả A"}\nDELETE /books/1\nDELETE /books/1\n',
          expectedOutput:
            '200 []\n404 {"error":"book not found"}\n404 {"error":"book not found"}\n400 {"error":"title and author are required"}\n201 {"id":1,"title":"Sách A","author":"Tác giả A"}\n204\n404 {"error":"book not found"}',
          isPublic: false,
        },
        {
          input: 'POST /books {"title":"Một","author":"A"}\nDELETE /books/1\nPOST /books {"title":"Hai","author":"B"}\nGET /books/abc\n',
          expectedOutput: '201 {"id":1,"title":"Một","author":"A"}\n204\n201 {"id":2,"title":"Hai","author":"B"}\n404 {"error":"book not found"}',
          isPublic: false,
        },
      ],
    },
  },
  {
    instructorEmail: 'phuong.bui@skillpath.test',
    categorySlug: 'web-development',
    topics: [{ slug: 'fastapi', primary: true }, { slug: 'python' }],
    language: 'vi',
    level: 'intermediate',
    priceAmount: 499_000,
    status: 'published',
    title: 'FastAPI: xây API Python hiện đại',
    subtitle: 'Xây API Python nhanh, có kiểu rõ ràng với FastAPI, Pydantic, SQLAlchemy và xác thực JWT',
    description:
      'Bạn viết Python thành thạo và cần dựng API cho ứng dụng web, mobile hoặc phục vụ một mô hình máy học. FastAPI là lựa chọn ngày càng phổ biến vì code ngắn, dùng type hint để vừa validate dữ liệu vừa sinh tài liệu OpenAPI tự động. Nhưng để đi từ ví dụ "hello world" đến một API dùng được trong dự án thật, bạn cần hiểu dependency injection, cách tổ chức model, phân trang, xác thực và test.\n\n' +
      'Khoá học xây một API quản lý sản phẩm và đơn hàng, mỗi chương thêm một lớp năng lực:\n' +
      '• Path parameter, query parameter và cách FastAPI chuyển kiểu, trả lỗi 422 khi dữ liệu sai\n' +
      '• Pydantic model cho request body, response_model để ẩn trường nhạy cảm\n' +
      '• Depends cho DB session, người dùng hiện tại và phân quyền\n' +
      '• SQLAlchemy với phân trang, xác thực OAuth2 password flow và JWT\n' +
      '• async def đúng chỗ, background task và test bằng TestClient\n\n' +
      'Mỗi bài có phần "vì sao" trước phần "làm thế nào": vì sao query parameter cần giới hạn ge, le; vì sao gọi thư viện đồng bộ trong async def làm nghẽn server. Bài code của khoá yêu cầu bạn tự viết logic phân trang và validate query mô phỏng cách FastAPI xử lý, chỉ với thư viện chuẩn Python, để hiểu những gì framework làm hộ mình.\n\n' +
      'Khoá học phù hợp với bạn đã vững Python và biết khái niệm HTTP cơ bản. Học xong, bạn tự thiết kế và triển khai được một API FastAPI có cấu trúc rõ ràng, có kiểm thử và sẵn sàng tích hợp với frontend hoặc dịch vụ khác.',
    learningObjectives: [
      'Khai báo path, query parameter và body bằng type hint, Pydantic và nhận lỗi 422 đúng chỗ',
      'Giới hạn dữ liệu đầu vào bằng Query, Path, Field với ge, le, max_length',
      'Dùng Depends để cấp DB session, người dùng hiện tại và kiểm tra quyền',
      'Phân trang danh sách với SQLAlchemy và xác thực bằng OAuth2 password flow, JWT',
      'Phân biệt def và async def, viết test API bằng TestClient',
    ],
    requirements: [
      'Viết Python thành thạo: hàm, class, type hint cơ bản',
      'Hiểu HTTP ở mức phương thức, status code và JSON',
    ],
    targetAudience: [
      'Lập trình viên Python muốn xây API cho ứng dụng web, mobile',
      'Người làm dữ liệu, máy học cần đưa mô hình ra thành API',
    ],
    thumbnail: { label: 'FastAPI', tagline: 'API Python hiện đại' },
    sections: [
      {
        title: 'Khởi đầu',
        lectures: [
          'Giới thiệu khoá học, cài Python, virtualenv và FastAPI',
          'Endpoint đầu tiên và tài liệu OpenAPI tự sinh',
        ],
      },
      {
        title: 'Dữ liệu vào và ra',
        lectures: [
          'Path parameter, query parameter và chuyển kiểu dữ liệu',
          'Pydantic model cho request body và response_model',
          'Validate với Query, Path và Field: ge, le, max_length',
        ],
      },
      {
        title: 'Ứng dụng thật',
        lectures: [
          'Dependency injection với Depends: DB session và người dùng hiện tại',
          'SQLAlchemy và phân trang danh sách',
          'Xác thực OAuth2 password flow với JWT',
        ],
      },
      {
        title: 'Vận hành',
        lectures: ['async def, background task và test bằng TestClient'],
      },
    ],
    quiz: {
      title: 'Kiểm tra: FastAPI cốt lõi',
      description: 'Ôn lại tham số, Pydantic, validate, Depends và async.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Với route @app.get("/items/{item_id}") và hàm def get_item(item_id: int, q: str | None = None), tham số q được lấy từ đâu?',
          relatedLecture: 2,
          options: [
            { content: 'Từ query string, ví dụ /items/5?q=ban-phim', correct: true, explanation: 'Tham số kiểu đơn giản không có trong đường dẫn được FastAPI hiểu là query parameter.' },
            { content: 'Từ request body', explanation: 'Body chỉ dùng cho tham số có kiểu Pydantic model hoặc khai báo Body().' },
            { content: 'Từ header', explanation: 'Muốn đọc header phải khai báo rõ bằng Header().' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Endpoint trả về object User có trường hashed_password nhưng khai báo response_model=UserOut không có trường đó. Kết quả là gì?',
          relatedLecture: 3,
          options: [
            { content: 'Response chỉ chứa các trường của UserOut, hashed_password bị lọc bỏ', correct: true, explanation: 'response_model dùng để validate và lọc dữ liệu trả ra, rất hữu ích để ẩn trường nhạy cảm.' },
            { content: 'FastAPI báo lỗi 500 vì dữ liệu thừa trường', explanation: 'Trường thừa được bỏ qua, chỉ thiếu trường bắt buộc mới gây lỗi.' },
            { content: 'Response chứa đầy đủ mọi trường của User', explanation: 'Khi có response_model, dữ liệu luôn đi qua model đó trước khi trả về.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Endpoint khai báo limit: int = Query(10, ge=1, le=50). Client gọi ?limit=100 thì nhận được gì?',
          relatedLecture: 4,
          options: [
            { content: 'Status 422 kèm chi tiết lỗi của tham số limit', correct: true, explanation: 'Giá trị vi phạm ràng buộc le=50 nên validate thất bại trước khi vào hàm xử lý.' },
            { content: 'limit tự bị giảm về 50', explanation: 'FastAPI không tự sửa dữ liệu, nó từ chối request không hợp lệ.' },
            { content: 'Status 400 Bad Request', explanation: 'Lỗi validate của FastAPI mặc định trả 422 Unprocessable Entity.' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Những việc nào phù hợp để làm bằng Depends?',
          relatedLecture: 5,
          options: [
            { content: 'Mở DB session cho mỗi request và đóng lại khi xong', correct: true, explanation: 'Dependency dùng yield cho phép dọn dẹp sau khi xử lý xong request.' },
            { content: 'Lấy người dùng hiện tại từ token', correct: true, explanation: 'Nhiều endpoint dùng chung dependency get_current_user thay vì lặp lại code.' },
            { content: 'Đọc tham số phân trang dùng chung cho nhiều endpoint', correct: true, explanation: 'Gom skip, limit vào một dependency giúp validate thống nhất.' },
            { content: 'Định nghĩa đường dẫn URL của route', explanation: 'Đường dẫn khai báo trong decorator như @app.get, không phải qua Depends.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Gọi một thư viện đồng bộ chạy lâu (ví dụ requests.get) bên trong async def gây ra vấn đề gì?',
          relatedLecture: 8,
          options: [
            { content: 'Không sao, FastAPI tự chạy nó trong thread riêng', explanation: 'FastAPI chỉ đưa vào threadpool khi chính hàm endpoint là def thường.' },
            { content: 'Chặn event loop, các request khác phải chờ', correct: true, explanation: 'Trong async def, lời gọi đồng bộ giữ event loop, nên dùng thư viện async hoặc khai báo def thường.' },
            { content: 'Python báo SyntaxError', explanation: 'Cú pháp hoàn toàn hợp lệ, vấn đề nằm ở hiệu năng lúc chạy.' },
          ],
        },
      ],
    },
    exercise: {
      title: 'Phân trang và validate query như FastAPI',
      learningObjective: 'Hiểu cách FastAPI validate query parameter với ràng buộc và phân trang kết quả',
      instructions:
        'Mô phỏng endpoint GET /items có các query parameter skip: int = Query(0, ge=0), limit: int = Query(10, ge=1, le=50), min_price: int = Query(0, ge=0).\n\n' +
        'Input (stdin):\n' +
        '• Dòng đầu là số n, n dòng tiếp theo là "<tên sản phẩm> <giá>". Tên có thể chứa dấu cách, giá là số nguyên ở cuối dòng.\n' +
        '• Dòng tiếp theo là số m, m dòng sau là URL dạng /items hoặc /items?key=value&key=value.\n\n' +
        'Validate theo thứ tự skip, limit, min_price và chỉ báo lỗi đầu tiên:\n' +
        '• Giá trị không phải số nguyên (chỉ gồm chữ số, có thể có dấu trừ): "422 <tên>: must be an integer".\n' +
        '• skip hoặc min_price âm: "422 <tên>: must be >= 0".\n' +
        '• limit ngoài khoảng 1 đến 50: "422 limit: must be between 1 and 50".\n' +
        'Tham số không có trong danh sách thì bỏ qua.\n\n' +
        'Nếu hợp lệ: lọc sản phẩm có giá ≥ min_price, giữ thứ tự input, lấy limit sản phẩm bắt đầu từ vị trí skip. In "200 total=<số sản phẩm sau khi lọc> items=[<tên 1>, <tên 2>]".\n\n' +
        'Ví dụ input:\n2\nSách Python 250000\nKhoá học FastAPI 499000\n2\n/items?limit=1\n/items?limit=0\n\n' +
        'Output:\n200 total=2 items=[Sách Python]\n422 limit: must be between 1 and 50',
      hints: [
        'Dùng str.rsplit(" ", 1) để tách tên sản phẩm và giá',
        'Tách query bằng split("&") rồi str.partition("=") cho từng cặp',
        'Kiểm tra số nguyên bằng re.fullmatch(r"-?\\d+", value) trước khi gọi int()',
      ],
      solutionExplanation:
        'Đọc danh sách sản phẩm, rồi với mỗi URL tách query thành dict. Hàm read_int trả về giá trị mặc định khi thiếu tham số, hoặc lỗi khi giá trị không phải số nguyên. Kiểm tra lần lượt skip, limit, min_price và dừng ở lỗi đầu tiên, giống cách FastAPI trả 422. Sau đó lọc theo giá và cắt danh sách bằng slicing [skip:skip + limit].',
      difficulty: 'medium',
      relatedLecture: 4,
      code: [
        {
          language: 'python',
          starter: String.raw`import sys


def solve(data: str) -> str:
    lines = [line.strip() for line in data.split('\n')]
    # Viết code của bạn ở đây
    return ''


print(solve(sys.stdin.read()))
`,
          solution: String.raw`import re
import sys


def parse_query(url):
    params = {}
    if '?' in url:
        for pair in url.split('?', 1)[1].split('&'):
            if pair:
                key, _, value = pair.partition('=')
                params[key] = value
    return params


def read_int(params, name, default):
    raw = params.get(name)
    if raw is None:
        return default, None
    if not re.fullmatch(r'-?\d+', raw):
        return None, name + ': must be an integer'
    return int(raw), None


def list_items(items, url):
    params = parse_query(url)
    skip, err = read_int(params, 'skip', 0)
    if err:
        return '422 ' + err
    if skip < 0:
        return '422 skip: must be >= 0'
    limit, err = read_int(params, 'limit', 10)
    if err:
        return '422 ' + err
    if not 1 <= limit <= 50:
        return '422 limit: must be between 1 and 50'
    min_price, err = read_int(params, 'min_price', 0)
    if err:
        return '422 ' + err
    if min_price < 0:
        return '422 min_price: must be >= 0'
    matched = [name for name, price in items if price >= min_price]
    page = matched[skip:skip + limit]
    return '200 total=%d items=[%s]' % (len(matched), ', '.join(page))


def solve(data):
    lines = [line.strip() for line in data.split('\n')]
    n = int(lines[0])
    items = []
    for line in lines[1:n + 1]:
        name, price = line.rsplit(' ', 1)
        items.append((name, int(price)))
    m = int(lines[n + 1])
    return '\n'.join(list_items(items, url) for url in lines[n + 2:n + 2 + m])


print(solve(sys.stdin.read()))
`,
        },
      ],
      tests: [
        {
          input:
            '5\nBàn phím cơ 1200000\nChuột không dây 350000\nTai nghe 890000\nLót chuột 90000\nMàn hình 27 inch 4500000\n3\n/items\n/items?skip=1&limit=2\n/items?min_price=500000&limit=2\n',
          expectedOutput:
            '200 total=5 items=[Bàn phím cơ, Chuột không dây, Tai nghe, Lót chuột, Màn hình 27 inch]\n200 total=5 items=[Chuột không dây, Tai nghe]\n200 total=3 items=[Bàn phím cơ, Tai nghe]',
          isPublic: true,
        },
        {
          input: '2\nSách Python 250000\nKhoá học FastAPI 499000\n4\n/items?limit=0\n/items?skip=-1\n/items?limit=abc\n/items?skip=5\n',
          expectedOutput:
            '422 limit: must be between 1 and 50\n422 skip: must be >= 0\n422 limit: must be an integer\n200 total=2 items=[]',
          isPublic: true,
        },
        {
          input: '3\nA 100\nB 200\nC 300\n4\n/items?min_price=200&skip=1\n/items?limit=51\n/items?min_price=-5\n/items?q=abc&limit=1&min_price=1.5\n',
          expectedOutput:
            '200 total=2 items=[C]\n422 limit: must be between 1 and 50\n422 min_price: must be >= 0\n422 min_price: must be an integer',
          isPublic: false,
        },
        {
          input: '0\n3\n/items\n/items?skip=0&limit=50\n/items?skip=x&limit=0\n',
          expectedOutput: '200 total=0 items=[]\n200 total=0 items=[]\n422 skip: must be an integer',
          isPublic: false,
        },
      ],
    },
  },
  {
    instructorEmail: 'tri.ho@skillpath.test',
    categorySlug: 'web-development',
    topics: [{ slug: 'aspnet-core', primary: true }, { slug: 'c-sharp' }],
    language: 'vi',
    level: 'intermediate',
    priceAmount: 0,
    status: 'published',
    title: 'ASP.NET Core Web API từ A đến Z',
    subtitle: 'Xây Web API bằng ASP.NET Core và Entity Framework Core, có xác thực JWT và chạy trong container',
    description:
      'ASP.NET Core là nền tảng backend quen thuộc ở nhiều công ty phần mềm, đặc biệt trong các hệ thống tài chính, quản trị doanh nghiệp và outsourcing. Nếu bạn đã biết C# nhưng chưa từng làm Web API, hoặc từng làm với .NET Framework cũ, khoá học này giúp bạn nắm cách làm hiện đại: cấu hình trong Program.cs, middleware pipeline, dependency injection có sẵn và Entity Framework Core.\n\n' +
      'Chúng ta cùng xây một API quản lý kho hàng, đi qua từng phần mà dự án thật nào cũng cần:\n' +
      '• Chọn giữa Controller và Minimal API, model binding và validate bằng Data Annotations\n' +
      '• Dependency injection với ba vòng đời Singleton, Scoped, Transient và lỗi hay gặp khi trộn lẫn\n' +
      '• Entity Framework Core: DbContext, migration, quan hệ một nhiều và truy vấn LINQ hiệu quả\n' +
      '• Xác thực JWT Bearer, phân quyền theo policy, ghi log và xử lý lỗi toàn cục\n\n' +
      'Mỗi bài đều có code chạy được và giải thích vì sao chọn cách làm đó, chẳng hạn vì sao UseAuthentication phải đứng trước UseAuthorization hay khi nào nên dùng AsNoTracking. Cuối khoá, bạn đóng gói API vào container để chạy giống nhau trên máy mình và trên server.\n\n' +
      'Khoá học dành cho bạn đã nắm C# cơ bản và lập trình hướng đối tượng. Học xong, bạn tự xây được một Web API có cấu trúc rõ ràng, làm việc với cơ sở dữ liệu qua EF Core, bảo vệ endpoint bằng JWT và đủ tự tin tham gia một dự án .NET đang chạy.',
    learningObjectives: [
      'Cấu hình Program.cs và sắp xếp middleware pipeline đúng thứ tự',
      'Xây endpoint bằng Controller hoặc Minimal API với model binding và validation',
      'Đăng ký service với vòng đời Singleton, Scoped, Transient phù hợp',
      'Làm việc với Entity Framework Core: migration, quan hệ và truy vấn LINQ có phân trang',
      'Bảo vệ API bằng JWT Bearer, phân quyền theo policy và đóng gói vào container',
    ],
    requirements: [
      'Nắm C# cơ bản và lập trình hướng đối tượng',
      'Biết SQL ở mức SELECT, INSERT, JOIN',
    ],
    targetAudience: [
      'Lập trình viên C# muốn chuyển sang làm backend Web API',
      'Lập trình viên .NET Framework cần cập nhật lên ASP.NET Core',
    ],
    thumbnail: { label: 'ASP.NET Core', tagline: 'Web API từ A đến Z' },
    sections: [
      {
        title: 'Nền tảng',
        lectures: [
          'Giới thiệu khoá học, cài .NET SDK và tạo dự án Web API',
          'Cấu trúc Program.cs, middleware pipeline và cấu hình',
        ],
      },
      {
        title: 'Xây API',
        lectures: [
          'Controller và Minimal API: chọn cách nào',
          'Model binding và validation với Data Annotations',
          'Dependency injection: Singleton, Scoped và Transient',
        ],
      },
      {
        title: 'Dữ liệu với EF Core',
        lectures: [
          'Entity Framework Core: DbContext, migration và quan hệ',
          'Truy vấn LINQ hiệu quả, AsNoTracking và phân trang',
        ],
      },
      {
        title: 'Bảo mật và triển khai',
        lectures: [
          'Xác thực JWT Bearer và phân quyền theo policy',
          'Ghi log, xử lý lỗi toàn cục và chạy trong container',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: ASP.NET Core Web API',
      description: 'Ôn lại middleware, validation, dependency injection và EF Core.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Trong Program.cs, app.UseAuthentication() và app.UseAuthorization() nên đặt theo thứ tự nào?',
          relatedLecture: 1,
          options: [
            { content: 'UseAuthentication trước, UseAuthorization sau', correct: true, explanation: 'Phải biết người dùng là ai trước, rồi mới kiểm tra họ có quyền gì.' },
            { content: 'UseAuthorization trước, UseAuthentication sau', explanation: 'Khi đó bước phân quyền chạy lúc chưa có thông tin người dùng nên luôn từ chối.' },
            { content: 'Thứ tự không quan trọng', explanation: 'Middleware chạy theo đúng thứ tự đăng ký, nên thứ tự quyết định kết quả.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Controller có thuộc tính [ApiController] nhận model vi phạm [Required]. Điều gì xảy ra?',
          relatedLecture: 3,
          options: [
            { content: 'Tự động trả 400 kèm chi tiết lỗi, action không được gọi', correct: true, explanation: '[ApiController] bật kiểm tra ModelState tự động trước khi vào action.' },
            { content: 'Action vẫn chạy với giá trị null', explanation: 'Đó là hành vi khi không có [ApiController] và không tự kiểm tra ModelState.IsValid.' },
            { content: 'Trả 500 Internal Server Error', explanation: 'Dữ liệu sai là lỗi của client nên trả 400, không phải lỗi server.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'AddDbContext đăng ký DbContext với vòng đời mặc định nào?',
          relatedLecture: 5,
          options: [
            { content: 'Singleton', explanation: 'DbContext không an toàn khi dùng chung giữa nhiều request chạy song song.' },
            { content: 'Scoped', correct: true, explanation: 'Mỗi request có một DbContext riêng, dùng chung trong suốt request đó.' },
            { content: 'Transient', explanation: 'Transient tạo instance mới mỗi lần inject, các service trong cùng request sẽ không chia sẻ được transaction.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Sau khi thêm thuộc tính mới vào entity, bạn cần làm gì để cập nhật schema cơ sở dữ liệu bằng EF Core?',
          relatedLecture: 5,
          options: [
            { content: 'Tạo migration mới rồi áp dụng bằng dotnet ef database update', correct: true, explanation: 'Migration ghi lại thay đổi schema có phiên bản, áp dụng được giống nhau ở mọi môi trường.' },
            { content: 'Không cần làm gì, EF Core tự thêm cột khi chạy', explanation: 'EF Core không tự đổi schema khi chạy, truy vấn sẽ lỗi vì thiếu cột.' },
            { content: 'Xoá cơ sở dữ liệu và tạo lại từ đầu', explanation: 'Làm vậy mất dữ liệu, chỉ chấp nhận được ở môi trường thử nghiệm.' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Những phát biểu nào đúng về AsNoTracking()?',
          relatedLecture: 6,
          options: [
            { content: 'Phù hợp cho truy vấn chỉ đọc để hiển thị', correct: true, explanation: 'Không cần theo dõi thay đổi nên dùng cho API trả danh sách là hợp lý.' },
            { content: 'Giảm chi phí bộ nhớ và CPU vì DbContext không lưu snapshot entity', correct: true, explanation: 'Change tracker không phải ghi nhận từng entity được tải.' },
            { content: 'Sửa entity lấy bằng AsNoTracking rồi gọi SaveChanges sẽ tự cập nhật', explanation: 'Entity không được theo dõi nên SaveChanges không thấy thay đổi, phải Attach hoặc Update.' },
            { content: 'Bắt buộc phải dùng khi phân trang', explanation: 'Phân trang dùng Skip và Take, không phụ thuộc AsNoTracking.' },
          ],
        },
      ],
    },
  },
];
