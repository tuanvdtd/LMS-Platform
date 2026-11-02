import type { SeedCourse } from '../types.ts';

const GRID_PY_STARTER = `import sys


def shortest_path(grid):
    # grid là list các chuỗi, mỗi chuỗi là một hàng của bản đồ
    # TODO: tìm S, chạy BFS và trả về số bước ít nhất tới E, không tới được thì trả -1
    return -1


def main():
    tokens = sys.stdin.read().split()
    rows = int(tokens[0])
    grid = tokens[2:2 + rows]
    print(shortest_path(grid))


main()
`;

const GRID_PY_SOLUTION = `import sys
from collections import deque


def shortest_path(grid):
    rows, cols = len(grid), len(grid[0])
    start = None
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 'S':
                start = (r, c)
    dist = {start: 0}
    queue = deque([start])
    while queue:
        r, c = queue.popleft()
        if grid[r][c] == 'E':
            return dist[(r, c)]
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != '#' and (nr, nc) not in dist:
                dist[(nr, nc)] = dist[(r, c)] + 1
                queue.append((nr, nc))
    return -1


def main():
    tokens = sys.stdin.read().split()
    rows = int(tokens[0])
    grid = tokens[2:2 + rows]
    print(shortest_path(grid))


main()
`;

const GRID_JS_STARTER = `const tokens = require('fs').readFileSync(0, 'utf8').split(/\\s+/).filter(Boolean);

function shortestPath(grid) {
  // grid là mảng chuỗi, mỗi chuỗi là một hàng của bản đồ
  // TODO: tìm S, chạy BFS và trả về số bước ít nhất tới E, không tới được thì trả -1
  return -1;
}

const rows = Number(tokens[0]);
const grid = tokens.slice(2, 2 + rows);
console.log(shortestPath(grid));
`;

const GRID_JS_SOLUTION = `const tokens = require('fs').readFileSync(0, 'utf8').split(/\\s+/).filter(Boolean);

function shortestPath(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  let start = null;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 'S') start = [r, c];
    }
  }
  const dist = Array.from({ length: rows }, () => new Array(cols).fill(-1));
  dist[start[0]][start[1]] = 0;
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const [r, c] = queue[head++];
    if (grid[r][c] === 'E') return dist[r][c];
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] !== '#' && dist[nr][nc] === -1) {
        dist[nr][nc] = dist[r][c] + 1;
        queue.push([nr, nc]);
      }
    }
  }
  return -1;
}

const rows = Number(tokens[0]);
const grid = tokens.slice(2, 2 + rows);
console.log(shortestPath(grid));
`;

export const COURSES: SeedCourse[] = [
  // L1
  {
    instructorEmail: 'bao.le@skillpath.test',
    categorySlug: 'programming-languages',
    topics: [{ slug: 'java', primary: true }, { slug: 'data-structures' }],
    language: 'vi',
    level: 'beginner',
    priceAmount: 0,
    status: 'published',
    title: 'Java Core cho lập trình viên Backend',
    subtitle: 'Nắm chắc cú pháp, OOP, Collections và xử lý exception để sẵn sàng học Spring Boot',
    description: [
      'Rất nhiều bạn muốn làm Backend với Java nhưng lại nhảy thẳng vào Spring Boot, rồi bị ngợp bởi annotation, Bean và hàng loạt khái niệm mà không hiểu bên dưới đang chạy gì. Khi gặp lỗi NullPointerException hay một HashMap trả về sai giá trị, các bạn không biết bắt đầu từ đâu để tìm nguyên nhân. Khoá học này lấp đúng khoảng trống đó: dạy phần Java Core mà một lập trình viên Backend dùng hằng ngày, theo thứ tự dễ tiếp thu và không lan man sang những phần ít gặp khi đi làm.',
      'Chúng ta đi từ cài đặt JDK và IntelliJ IDEA, viết chương trình đầu tiên, rồi tới kiểu dữ liệu, luồng điều khiển và lập trình hướng đối tượng. Phần OOP không dừng ở định nghĩa mà đi qua ví dụ quản lý tài khoản ngân hàng và giỏ hàng, để bạn thấy đóng gói, kế thừa, interface và đa hình giúp code dễ sửa thế nào. Sau đó là Collections Framework, phần quan trọng nhất với dân Backend:\n• Khi nào chọn ArrayList, khi nào LinkedList, và chi phí của từng thao tác\n• Vì sao HashMap cần equals và hashCode đi cùng nhau\n• Dùng Stream API để lọc, biến đổi và gom dữ liệu gọn gàng',
      'Mỗi bài đều có đoạn code chạy được ngay, kèm bài tập nhỏ để bạn tự gõ lại và sửa. Cuối khoá có bài kiểm tra trắc nghiệm giúp bạn tự đánh giá mình đã hiểu tới đâu, thay vì chỉ xem video cho xong.',
      'Học xong, bạn đọc hiểu được code Java trong các dự án Backend, tự viết class và xử lý dữ liệu bằng Collections một cách tự tin, và có nền tảng vững để bước sang Spring Boot mà không còn cảm giác học vẹt.',
    ].join('\n\n'),
    learningObjectives: [
      'Cài đặt JDK, cấu hình IntelliJ IDEA và chạy, debug chương trình Java từ dòng lệnh lẫn IDE',
      'Thiết kế class có đóng gói, kế thừa và interface hợp lý cho một bài toán nghiệp vụ nhỏ',
      'Chọn đúng List, Set, Map cho từng tình huống và giải thích được độ phức tạp của thao tác chính',
      'Viết equals và hashCode đúng hợp đồng để dùng object làm key trong HashMap',
      'Dùng Stream API để lọc, biến đổi và nhóm dữ liệu thay cho vòng lặp lồng nhau',
      'Xử lý exception bằng try-with-resources và tự tạo exception nghiệp vụ có ý nghĩa',
    ],
    requirements: [
      'Biết dùng máy tính cơ bản, cài được phần mềm trên Windows, macOS hoặc Linux',
      'Đã từng viết vài chương trình nhỏ bằng bất kỳ ngôn ngữ nào là một lợi thế, nhưng không bắt buộc',
    ],
    targetAudience: [
      'Sinh viên CNTT muốn chọn Java làm ngôn ngữ chính để theo hướng Backend',
      'Lập trình viên từ ngôn ngữ khác cần nắm nhanh Java trước khi học Spring Boot',
    ],
    thumbnail: { label: 'Java', tagline: 'Nền tảng cho Backend' },
    sections: [
      {
        title: 'Khởi động với Java',
        lectures: [
          'Giới thiệu khoá học và lộ trình trở thành Java Backend Developer',
          'Cài JDK 21, IntelliJ IDEA và chạy chương trình đầu tiên',
        ],
      },
      {
        title: 'Cú pháp và lập trình hướng đối tượng',
        lectures: [
          'Kiểu dữ liệu nguyên thuỷ, String và luồng điều khiển',
          'Class, object, constructor và tính đóng gói',
          'Kế thừa, interface và đa hình qua ví dụ giỏ hàng',
        ],
      },
      {
        title: 'Collections Framework',
        lectures: [
          'ArrayList và LinkedList: chọn cái nào khi nào',
          'HashMap, HashSet và hợp đồng equals/hashCode',
          'Stream API: filter, map, collect và groupingBy',
        ],
      },
      {
        title: 'Xử lý lỗi',
        lectures: ['Exception checked, unchecked và try-with-resources'],
      },
    ],
    quiz: {
      title: 'Kiểm tra: Java Core',
      description: 'Ôn lại OOP, Collections và cách Java xử lý exception.',
      questions: [
        {
          type: 'single_choice',
          stem: 'So sánh hai String bằng toán tử == trong Java thực chất là so sánh gì?',
          relatedLecture: 2,
          options: [
            { content: 'So sánh tham chiếu, tức hai biến có trỏ tới cùng một object hay không', correct: true, explanation: 'Với kiểu tham chiếu, == chỉ kiểm tra địa chỉ object. Muốn so nội dung phải dùng equals().' },
            { content: 'So sánh từng ký tự của hai chuỗi', explanation: 'Đó là việc của String.equals(), không phải toán tử ==.' },
            { content: 'So sánh độ dài hai chuỗi', explanation: 'Độ dài lấy bằng length(); == không hề xét tới độ dài.' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Những phát biểu nào đúng về interface trong Java hiện đại (Java 8 trở lên)?',
          relatedLecture: 4,
          options: [
            { content: 'Một class có thể implement nhiều interface', correct: true, explanation: 'Java không cho đa kế thừa class nhưng cho phép implement nhiều interface.' },
            { content: 'Interface có thể có phương thức default kèm phần thân', correct: true, explanation: 'Từ Java 8, phương thức default cho phép thêm hành vi mà không làm vỡ các class đang implement.' },
            { content: 'Interface có thể khai báo biến instance để lưu trạng thái riêng của từng object', explanation: 'Mọi field trong interface đều ngầm định là public static final, nên không lưu được trạng thái riêng của object.' },
            { content: 'Có thể tạo object trực tiếp bằng new TênInterface() mà không cần cài đặt', explanation: 'Interface không khởi tạo trực tiếp được; cần một class cài đặt hoặc một anonymous class/lambda.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Bạn cần thường xuyên truy cập phần tử theo chỉ số trong một danh sách lớn. Nên chọn cấu trúc nào?',
          relatedLecture: 5,
          options: [
            { content: 'ArrayList', correct: true, explanation: 'ArrayList dựa trên mảng nên get(i) là O(1).' },
            { content: 'LinkedList', explanation: 'LinkedList phải duyệt từ đầu hoặc cuối để tới vị trí i, tốn O(n).' },
            { content: 'HashSet', explanation: 'HashSet không có khái niệm chỉ số và không giữ thứ tự phần tử.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Điều gì xảy ra nếu class Product override equals() nhưng không override hashCode() rồi dùng làm key trong HashMap?',
          relatedLecture: 6,
          options: [
            { content: 'Hai object bằng nhau theo equals có thể rơi vào bucket khác nhau, nên get() không tìm thấy giá trị', correct: true, explanation: 'HashMap dùng hashCode để chọn bucket trước, rồi mới gọi equals. hashCode mặc định khác nhau sẽ phá vỡ việc tìm kiếm.' },
            { content: 'Trình biên dịch báo lỗi và không cho chạy', explanation: 'Code vẫn biên dịch bình thường; lỗi chỉ lộ ra lúc chạy, nên rất khó phát hiện.' },
            { content: 'HashMap tự động gọi equals cho mọi key nên vẫn chạy đúng', explanation: 'HashMap không quét toàn bộ key; nó chỉ gọi equals trong bucket đã chọn theo hashCode.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Lợi ích chính của try-with-resources so với try-finally tự viết là gì?',
          relatedLecture: 8,
          options: [
            { content: 'Tài nguyên implement AutoCloseable được đóng tự động, kể cả khi có exception', correct: true, explanation: 'Trình biên dịch sinh sẵn lệnh close() và giữ lại exception bị che (suppressed), tránh rò rỉ file hay kết nối.' },
            { content: 'Chương trình chạy nhanh hơn vì không cần bắt exception', explanation: 'try-with-resources không bỏ qua exception; nó chỉ lo việc đóng tài nguyên.' },
            { content: 'Biến mọi checked exception thành unchecked exception', explanation: 'Checked exception vẫn phải được khai báo hoặc bắt như bình thường.' },
          ],
        },
      ],
    },
  },
  // L2
  {
    instructorEmail: 'bao.le@skillpath.test',
    categorySlug: 'programming-languages',
    topics: [{ slug: 'spring-framework', primary: true }, { slug: 'java' }, { slug: 'postgresql' }],
    language: 'vi',
    level: 'intermediate',
    priceAmount: 999_000,
    status: 'published',
    title: 'Spring Boot REST API thực chiến',
    subtitle: 'Xây API quản lý đơn hàng với Spring Boot 3, PostgreSQL, JWT và integration test bài bản',
    description: [
      'Các tutorial Spring Boot trên mạng thường dừng ở một controller trả về "Hello World" và một entity đơn giản. Khi vào dự án thật, bạn phải trả lời những câu hỏi khó hơn nhiều: chia package thế nào cho dễ bảo trì, validate dữ liệu đầu vào ở đâu, xử lý lỗi sao cho client nhận được thông báo nhất quán, phân trang ra sao để không kéo cả bảng lên bộ nhớ, và vì sao một API đang chạy nhanh bỗng chậm hẳn khi dữ liệu nhiều lên.',
      'Khoá học này đi qua toàn bộ vòng đời của một API quản lý đơn hàng, từ lúc tạo dự án bằng Spring Initializr tới khi có bộ test chạy với database thật. Bạn sẽ làm việc với:\n• @RestController, ResponseEntity và thiết kế endpoint theo chuẩn REST\n• Bean Validation và @ControllerAdvice để trả lỗi có cấu trúc\n• Spring Data JPA với PostgreSQL, quan hệ giữa các bảng và cách tránh lỗi N+1 query\n• Flyway để quản lý thay đổi schema theo phiên bản\n• Spring Security với JWT cho đăng nhập và phân quyền theo vai trò\n• Testcontainers để viết integration test với PostgreSQL thật',
      'Mỗi chương xây thêm một phần cho cùng một dự án, nên cuối khoá bạn có một codebase hoàn chỉnh để đưa vào CV hoặc dùng làm khung cho dự án tiếp theo. Mình giải thích lý do đằng sau từng lựa chọn thiết kế, kèm những lỗi hay gặp khi review code của các bạn mới vào nghề.',
      'Khoá này phù hợp khi bạn đã nắm Java Core và muốn bước lên mức có thể tự nhận một tính năng Backend, viết API đúng chuẩn và tự tin giải thích code của mình trong buổi phỏng vấn.',
    ].join('\n\n'),
    learningObjectives: [
      'Thiết kế và cài đặt REST API CRUD với status code, DTO và cấu trúc package theo tầng rõ ràng',
      'Validate request bằng Bean Validation và trả lỗi thống nhất qua @ControllerAdvice',
      'Ánh xạ quan hệ bảng PostgreSQL bằng JPA, phân trang và loại bỏ lỗi N+1 query bằng fetch join',
      'Quản lý migration schema bằng Flyway thay cho ddl-auto',
      'Bảo vệ API bằng Spring Security và JWT, phân quyền endpoint theo vai trò người dùng',
      'Viết integration test cho repository và controller với Testcontainers',
    ],
    requirements: [
      'Nắm vững Java Core: OOP, Collections, exception',
      'Biết SQL cơ bản: SELECT, JOIN, INSERT, UPDATE',
      'Đã cài Docker để chạy PostgreSQL và Testcontainers',
    ],
    targetAudience: [
      'Lập trình viên Java muốn chuyển sang làm Backend với Spring Boot',
      'Fresher Backend cần một dự án API hoàn chỉnh để đi phỏng vấn',
    ],
    thumbnail: { label: 'Spring Boot', tagline: 'REST API thực chiến' },
    sections: [
      {
        title: 'Khởi tạo dự án',
        lectures: [
          'Giới thiệu khoá học và kiến trúc API quản lý đơn hàng',
          'Tạo dự án với Spring Initializr và cấu trúc package theo tầng',
        ],
      },
      {
        title: 'Xây dựng REST API',
        lectures: [
          '@RestController, @RequestMapping và ResponseEntity',
          'Validate request với Bean Validation và @ControllerAdvice',
          'Dependency Injection, scope và vòng đời Bean',
        ],
      },
      {
        title: 'Làm việc với PostgreSQL',
        lectures: [
          'Spring Data JPA: Entity, Repository và quan hệ @OneToMany',
          'Phân trang, sắp xếp và tránh lỗi N+1 query',
          'Quản lý schema bằng Flyway migration',
        ],
      },
      {
        title: 'Bảo mật và kiểm thử',
        lectures: [
          'Spring Security với JWT: đăng nhập và phân quyền',
          'Integration test với Testcontainers và PostgreSQL thật',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: Spring Boot REST API',
      description: 'Ôn lại controller, validation, JPA và bảo mật trong Spring Boot.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Khi tạo mới thành công một đơn hàng qua POST /orders, status code nào phù hợp nhất?',
          relatedLecture: 2,
          options: [
            { content: '201 Created', correct: true, explanation: 'Theo chuẩn HTTP, 201 báo tài nguyên mới đã được tạo, thường kèm header Location trỏ tới nó.' },
            { content: '200 OK', explanation: '200 vẫn chạy được nhưng không nói rõ là có tài nguyên mới, nên kém chính xác hơn 201.' },
            { content: '204 No Content', explanation: '204 dùng khi không trả body, thường cho DELETE; client tạo đơn thường cần nhận lại dữ liệu đơn.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Vai trò của @ControllerAdvice kết hợp @ExceptionHandler là gì?',
          relatedLecture: 3,
          options: [
            { content: 'Bắt exception từ mọi controller ở một chỗ và trả response lỗi có cấu trúc thống nhất', correct: true, explanation: 'Nhờ đó mỗi controller không phải tự try-catch, và client luôn nhận cùng một định dạng lỗi.' },
            { content: 'Tự động validate mọi request mà không cần @Valid', explanation: 'Validation vẫn phải bật bằng @Valid hoặc @Validated; @ControllerAdvice chỉ xử lý lỗi phát sinh.' },
            { content: 'Ghi log mọi request đi vào ứng dụng', explanation: 'Đó là việc của filter hoặc interceptor, không phải mục đích chính của @ControllerAdvice.' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Những cách nào giúp tránh lỗi N+1 query khi lấy danh sách đơn hàng kèm các dòng sản phẩm?',
          relatedLecture: 6,
          options: [
            { content: 'Dùng JOIN FETCH trong câu JPQL', correct: true, explanation: 'JOIN FETCH nạp đơn hàng và các dòng sản phẩm trong một câu SQL duy nhất.' },
            { content: 'Dùng @EntityGraph trên phương thức repository', correct: true, explanation: '@EntityGraph khai báo các quan hệ cần nạp sẵn, Hibernate sẽ sinh câu JOIN tương ứng.' },
            { content: 'Đổi mọi quan hệ sang FetchType.EAGER', explanation: 'EAGER không loại bỏ N+1 trong truy vấn danh sách mà còn làm mọi truy vấn khác nạp thừa dữ liệu.' },
            { content: 'Tăng kích thước connection pool', explanation: 'Số câu query vẫn y nguyên; pool lớn hơn không giảm được số lượt đi về database.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Vì sao nên dùng Flyway thay cho spring.jpa.hibernate.ddl-auto=update ở môi trường production?',
          relatedLecture: 7,
          options: [
            { content: 'Mỗi thay đổi schema là một file SQL có phiên bản, review được và chạy giống nhau ở mọi môi trường', correct: true, explanation: 'Flyway ghi lại lịch sử migration, giúp tái lập schema chính xác và tránh thay đổi ngầm.' },
            { content: 'Flyway giúp truy vấn chạy nhanh hơn', explanation: 'Flyway chỉ quản lý thay đổi schema, không ảnh hưởng tốc độ truy vấn lúc chạy.' },
            { content: 'ddl-auto=update không hỗ trợ PostgreSQL', explanation: 'ddl-auto vẫn chạy với PostgreSQL, vấn đề là nó không kiểm soát được và không xoá hay đổi tên cột an toàn.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Trong luồng xác thực bằng JWT không trạng thái, server kiểm tra request tiếp theo của người dùng bằng cách nào?',
          relatedLecture: 8,
          options: [
            { content: 'Xác minh chữ ký và hạn dùng của token gửi trong header Authorization', correct: true, explanation: 'Token tự chứa thông tin người dùng; server chỉ cần khoá bí mật để xác minh, không cần tra session.' },
            { content: 'Tra session ID trong bộ nhớ server', explanation: 'Đó là cơ chế session truyền thống, trái với mục đích không trạng thái của JWT.' },
            { content: 'Gửi lại username và password trong mỗi request', explanation: 'Đó là Basic Auth; JWT được sinh ra để tránh gửi mật khẩu liên tục.' },
          ],
        },
      ],
    },
  },
  // L3
  {
    instructorEmail: 'phuong.bui@skillpath.test',
    categorySlug: 'software-engineering',
    topics: [{ slug: 'data-structures', primary: true }, { slug: 'algorithms' }, { slug: 'python' }],
    language: 'vi',
    level: 'intermediate',
    priceAmount: 499_000,
    status: 'published',
    title: 'Cấu trúc dữ liệu & Giải thuật',
    subtitle: 'Hiểu bản chất và tự cài đặt các cấu trúc dữ liệu, giải thuật hay gặp khi phỏng vấn và đi làm',
    description: [
      'Bạn có thể đã học cấu trúc dữ liệu ở trường, nhưng khi ngồi trước một bài phỏng vấn coding hay một đoạn code chạy chậm trong dự án thì vẫn lúng túng không biết nên dùng gì. Vấn đề thường không nằm ở việc thiếu kiến thức mà ở chỗ chưa luyện cách nhìn bài toán và nhận ra mẫu giải phù hợp. Khoá học này tập trung vào đúng kỹ năng đó.',
      'Mỗi cấu trúc dữ liệu được dạy theo ba bước: hiểu nó lưu dữ liệu ra sao, tự cài đặt bằng Python, rồi áp dụng vào bài toán thật. Nội dung chính gồm:\n• Phân tích độ phức tạp Big-O để so sánh các cách giải\n• Stack, queue, hash table và heap cùng các bài toán kinh điển đi kèm\n• Cây nhị phân tìm kiếm, BFS, DFS và Dijkstra trên đồ thị và lưới\n• Two pointers, sliding window và quy hoạch động',
      'Bài tập lập trình trong khoá có thể nộp bằng Python hoặc JavaScript, chấm tự động với test công khai và test ẩn, giống cách các vòng thi online đánh giá. Ở mỗi bài giảng, mình giải từng bước trên bảng trước khi viết code, nói rõ vì sao chọn hướng này và những hướng nào bị loại, để bạn học được cách suy nghĩ chứ không chỉ học thuộc lời giải.',
      'Học xong, bạn tự tin phân tích độ phức tạp của code mình viết, chọn đúng cấu trúc dữ liệu cho từng tình huống và giải được phần lớn bài ở mức trung bình trên các nền tảng luyện thuật toán.',
    ].join('\n\n'),
    learningObjectives: [
      'Phân tích độ phức tạp thời gian và bộ nhớ của một đoạn code bằng ký hiệu Big-O',
      'Tự cài đặt stack, queue, hash table và heap, biết chi phí của từng thao tác',
      'Giải bài toán đường đi ngắn nhất bằng BFS trên lưới và Dijkstra trên đồ thị có trọng số',
      'Nhận diện và áp dụng two pointers, sliding window cho bài toán trên mảng và chuỗi',
      'Chuyển lời giải đệ quy có nhớ sang quy hoạch động dạng bảng',
    ],
    requirements: [
      'Viết được chương trình Python cơ bản: vòng lặp, hàm, list và dict',
      'Nắm toán phổ thông, không cần kiến thức toán rời rạc chuyên sâu',
    ],
    targetAudience: [
      'Lập trình viên chuẩn bị phỏng vấn vòng coding',
      'Sinh viên muốn hiểu sâu cấu trúc dữ liệu thay vì học thuộc để thi',
    ],
    thumbnail: { label: 'DSA', tagline: 'Tư duy giải thuật' },
    sections: [
      {
        title: 'Nền tảng phân tích thuật toán',
        lectures: [
          'Giới thiệu khoá học và cách luyện giải thuật hiệu quả',
          'Độ phức tạp Big-O: phân tích thời gian và bộ nhớ',
        ],
      },
      {
        title: 'Cấu trúc dữ liệu cơ bản',
        lectures: [
          'Stack và queue: cài đặt và bài toán kiểm tra ngoặc hợp lệ',
          'Hash table: xử lý va chạm và bài toán đếm tần suất',
          'Heap và hàng đợi ưu tiên với heapq',
        ],
      },
      {
        title: 'Cây và đồ thị',
        lectures: [
          'Cây nhị phân tìm kiếm: chèn, xoá và các kiểu duyệt',
          'BFS và DFS trên đồ thị và trên lưới',
          'Dijkstra: đường đi ngắn nhất có trọng số',
        ],
      },
      {
        title: 'Kỹ thuật giải bài',
        lectures: [
          'Two pointers và sliding window',
          'Quy hoạch động: từ đệ quy có nhớ đến bảng',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: cấu trúc dữ liệu và giải thuật',
      description: 'Ôn lại Big-O, các cấu trúc dữ liệu cơ bản và giải thuật trên đồ thị.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Hai vòng for lồng nhau, mỗi vòng chạy n lần và thân vòng lặp là O(1). Độ phức tạp thời gian là bao nhiêu?',
          relatedLecture: 1,
          options: [
            { content: 'O(n²)', correct: true, explanation: 'Thân vòng lặp chạy n × n lần, mỗi lần tốn hằng số thời gian.' },
            { content: 'O(n)', explanation: 'O(n) chỉ đúng nếu có một vòng lặp hoặc hai vòng lặp chạy nối tiếp, không lồng nhau.' },
            { content: 'O(n log n)', explanation: 'n log n xuất hiện khi mỗi bước chia đôi bài toán, như merge sort, không phải hai vòng lặp đầy đủ.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Cấu trúc dữ liệu nào phù hợp nhất để kiểm tra một chuỗi ngoặc như "([]{})" có hợp lệ hay không?',
          relatedLecture: 2,
          options: [
            { content: 'Stack', correct: true, explanation: 'Ngoặc mở gần nhất phải được đóng trước, đúng nguyên tắc vào sau ra trước của stack.' },
            { content: 'Queue', explanation: 'Queue vào trước ra trước, sẽ ghép ngoặc đóng với ngoặc mở đầu tiên thay vì gần nhất.' },
            { content: 'Heap', explanation: 'Heap sắp theo độ ưu tiên, không giữ được thứ tự lồng nhau của ngoặc.' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Những phát biểu nào đúng về heap nhị phân (min-heap) cài bằng mảng?',
          relatedLecture: 4,
          options: [
            { content: 'Lấy phần tử nhỏ nhất ra khỏi heap tốn O(log n)', correct: true, explanation: 'Sau khi lấy gốc, phần tử cuối được đưa lên và đẩy xuống theo chiều cao cây, tức log n bước.' },
            { content: 'Xem phần tử nhỏ nhất mà không lấy ra tốn O(1)', correct: true, explanation: 'Phần tử nhỏ nhất luôn nằm ở vị trí 0 của mảng.' },
            { content: 'Tìm một phần tử bất kỳ trong heap tốn O(log n)', explanation: 'Heap không sắp xếp toàn phần, nên tìm phần tử bất kỳ phải duyệt O(n).' },
            { content: 'Duyệt mảng của heap từ đầu đến cuối cho ra dãy đã sắp xếp', explanation: 'Heap chỉ đảm bảo cha nhỏ hơn con, các phần tử anh em không có thứ tự.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Vì sao BFS tìm được đường đi ngắn nhất trên lưới mà mọi bước đi đều có chi phí bằng nhau?',
          relatedLecture: 6,
          options: [
            { content: 'BFS duyệt theo từng lớp khoảng cách, nên lần đầu chạm tới một ô chính là bằng số bước ít nhất', correct: true, explanation: 'Queue đảm bảo mọi ô cách k bước được xử lý trước mọi ô cách k + 1 bước.' },
            { content: 'BFS luôn đi theo hướng gần đích nhất', explanation: 'BFS không dùng heuristic hướng đích; đó là ý tưởng của A*.' },
            { content: 'BFS thử mọi đường đi rồi chọn đường ngắn nhất', explanation: 'BFS đánh dấu ô đã thăm và không quay lại, nên không liệt kê mọi đường đi.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Dijkstra cho kết quả sai trong trường hợp nào?',
          relatedLecture: 7,
          options: [
            { content: 'Đồ thị có cạnh trọng số âm', correct: true, explanation: 'Dijkstra giả định khoảng cách đã chốt không thể giảm nữa, giả định này sai khi có cạnh âm. Khi đó dùng Bellman-Ford.' },
            { content: 'Đồ thị có hướng', explanation: 'Dijkstra chạy tốt trên cả đồ thị có hướng lẫn vô hướng.' },
            { content: 'Đồ thị có chu trình', explanation: 'Chu trình với trọng số không âm không ảnh hưởng tới tính đúng của Dijkstra.' },
          ],
        },
      ],
    },
    exercise: {
      title: 'Thoát mê cung bằng BFS',
      learningObjective: 'Áp dụng BFS trên lưới để tìm số bước ít nhất từ điểm xuất phát tới đích',
      instructions: [
        'Cho bản đồ mê cung dạng lưới. Dòng đầu gồm hai số R và C là số hàng và số cột. R dòng tiếp theo, mỗi dòng có đúng C ký tự:',
        '• "." là ô trống\n• "#" là tường, không đi vào được\n• "S" là điểm xuất phát (đúng một ô)\n• "E" là đích (đúng một ô)',
        'Mỗi bước được đi sang một ô kề cạnh (lên, xuống, trái, phải). In ra số bước ít nhất để đi từ S tới E. Nếu không có đường đi thì in -1.',
        'Ví dụ input:\n3 4\nS..#\n.#..\n...E\n\nOutput:\n5',
      ].join('\n\n'),
      hints: [
        'Dùng queue (collections.deque trong Python, mảng kèm con trỏ đầu trong JavaScript) để duyệt theo từng lớp khoảng cách',
        'Đánh dấu ô đã thăm ngay khi đưa vào queue, không đợi lúc lấy ra, để tránh một ô bị thêm nhiều lần',
        'Lưu khoảng cách của từng ô; khi lấy ra ô E thì đó chính là đáp án',
      ],
      solutionExplanation:
        'Tìm toạ độ S rồi chạy BFS từ đó. Mỗi ô lấy ra khỏi queue sẽ mở rộng sang bốn ô kề còn nằm trong lưới, không phải tường và chưa thăm, với khoảng cách bằng khoảng cách hiện tại cộng 1. Vì BFS xử lý các ô theo thứ tự khoảng cách tăng dần, lần đầu lấy ra ô E chính là số bước ít nhất. Nếu queue rỗng mà chưa gặp E thì không có đường đi. Mỗi ô vào queue tối đa một lần nên độ phức tạp là O(R × C).',
      difficulty: 'medium',
      relatedLecture: 6,
      code: [
        { language: 'python', starter: GRID_PY_STARTER, solution: GRID_PY_SOLUTION },
        { language: 'javascript', starter: GRID_JS_STARTER, solution: GRID_JS_SOLUTION },
      ],
      tests: [
        { input: '3 4\nS..#\n.#..\n...E\n', expectedOutput: '5', isPublic: true },
        { input: '3 3\nS#.\n##.\n..E\n', expectedOutput: '-1', isPublic: true },
        { input: '1 2\nSE\n', expectedOutput: '1', isPublic: false },
        { input: '5 6\nS.#...\n.##.#.\n...#..\n#....#\n...#.E\n', expectedOutput: '9', isPublic: false },
      ],
    },
  },
  // L4
  {
    instructorEmail: 'phuong.bui@skillpath.test',
    categorySlug: 'software-engineering',
    topics: [{ slug: 'software-architecture', primary: true }, { slug: 'system-design-interview' }],
    language: 'vi',
    level: 'advanced',
    priceAmount: 999_000,
    status: 'published',
    title: 'Kiến trúc phần mềm: từ monolith đến microservices',
    subtitle: 'Biết khi nào giữ monolith, khi nào tách service và cách tách an toàn mà hệ thống vẫn chạy',
    description: [
      'Microservices đã trở thành từ khoá quen thuộc, nhưng không ít đội chuyển sang microservices quá sớm rồi phải gánh chi phí vận hành, lỗi giao dịch phân tán và những buổi debug kéo dài qua nhiều service. Ngược lại, có những monolith lớn tới mức mỗi lần deploy là một lần hồi hộp. Câu hỏi đúng không phải là "monolith hay microservices" mà là kiến trúc nào phù hợp với đội ngũ và bài toán của bạn ở thời điểm hiện tại.',
      'Khoá học dùng một case study xuyên suốt là hệ thống bán vé sự kiện, đi từ một monolith viết vội tới một kiến trúc có thể mở rộng. Bạn sẽ học:\n• Cách xác định đặc tính kiến trúc quan trọng: khả năng mở rộng, độ sẵn sàng, khả năng bảo trì\n• Layered architecture, Clean Architecture và modular monolith chia theo bounded context\n• Strangler Fig để tách dần service mà không phải viết lại từ đầu\n• Giao tiếp đồng bộ, bất đồng bộ qua message broker và Saga cho giao dịch phân tán\n• API Gateway, circuit breaker và observability để vận hành nhiều service',
      'Mỗi quyết định kiến trúc trong khoá đều đi kèm phần đánh đổi: được gì, mất gì, và dấu hiệu nào cho thấy đã đến lúc thay đổi. Bạn sẽ thực hành viết Architecture Decision Record và vẽ sơ đồ theo mô hình C4 cho chính case study, để quen với cách trình bày kiến trúc trước đội ngũ.',
      'Khoá này dành cho người đã có vài năm làm Backend và bắt đầu phải tham gia các quyết định thiết kế hệ thống. Học xong, bạn có đủ lý lẽ để bảo vệ một lựa chọn kiến trúc trước đồng nghiệp và cấp trên.',
    ].join('\n\n'),
    learningObjectives: [
      'Xác định và xếp ưu tiên các đặc tính kiến trúc từ yêu cầu nghiệp vụ của một hệ thống',
      'Tổ chức modular monolith theo bounded context để sẵn sàng tách service khi cần',
      'Lập kế hoạch tách service từ monolith bằng Strangler Fig mà không dừng hệ thống',
      'Chọn giữa giao tiếp đồng bộ và bất đồng bộ, cài đặt Saga cho luồng đặt vé nhiều bước',
      'Thiết kế lớp vận hành gồm API Gateway, circuit breaker, log tập trung và distributed tracing',
      'Viết Architecture Decision Record nêu rõ bối cảnh, lựa chọn và đánh đổi',
    ],
    requirements: [
      'Có ít nhất 2 năm kinh nghiệm phát triển Backend với một framework bất kỳ',
      'Hiểu REST API, database quan hệ và đã từng deploy ứng dụng lên server',
    ],
    targetAudience: [
      'Backend developer muốn lên vị trí senior hoặc tech lead',
      'Kỹ sư phần mềm đang tham gia dự án tách monolith sang microservices',
    ],
    thumbnail: { label: 'Architecture', tagline: 'Từ monolith đến microservices' },
    sections: [
      {
        title: 'Tư duy kiến trúc',
        lectures: [
          'Giới thiệu khoá học và case study hệ thống bán vé',
          'Đặc tính kiến trúc: scalability, availability, maintainability',
        ],
      },
      {
        title: 'Monolith có tổ chức',
        lectures: [
          'Layered architecture và Clean Architecture',
          'Modular monolith: chia module theo bounded context của DDD',
        ],
      },
      {
        title: 'Tách sang microservices',
        lectures: [
          'Strangler Fig: tách dần service khỏi monolith',
          'Giao tiếp đồng bộ REST/gRPC và bất đồng bộ qua message broker',
          'Saga pattern và quản lý giao dịch phân tán',
        ],
      },
      {
        title: 'Vận hành hệ thống phân tán',
        lectures: [
          'API Gateway, service discovery và circuit breaker',
          'Observability: log tập trung, metrics và distributed tracing',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: kiến trúc phần mềm',
      description: 'Ôn lại các mẫu kiến trúc và đánh đổi khi tách microservices.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Trong Clean Architecture, chiều phụ thuộc giữa các lớp phải tuân theo quy tắc nào?',
          relatedLecture: 2,
          options: [
            { content: 'Lớp ngoài phụ thuộc vào lớp trong; domain không biết gì về framework hay database', correct: true, explanation: 'Đây là Dependency Rule: nghiệp vụ cốt lõi ổn định nhất nên không được phụ thuộc vào chi tiết hạ tầng.' },
            { content: 'Lớp trong gọi trực tiếp lớp ngoài để truy cập database', explanation: 'Làm vậy khiến domain dính chặt vào hạ tầng, đúng điều Clean Architecture muốn tránh.' },
            { content: 'Các lớp phụ thuộc lẫn nhau tự do miễn là cùng một repository code', explanation: 'Phụ thuộc vòng sẽ phá vỡ ranh giới lớp và làm khó kiểm thử từng phần.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Strangler Fig pattern giúp tách microservice khỏi monolith theo cách nào?',
          relatedLecture: 4,
          options: [
            { content: 'Đặt một lớp định tuyến phía trước, chuyển dần từng chức năng sang service mới cho tới khi phần cũ không còn được dùng', correct: true, explanation: 'Việc chuyển đổi diễn ra từng bước, có thể quay lui, và hệ thống vẫn chạy suốt quá trình.' },
            { content: 'Viết lại toàn bộ hệ thống rồi chuyển đổi trong một lần', explanation: 'Đó là big-bang rewrite, rủi ro cao và chính là điều Strangler Fig tránh.' },
            { content: 'Sao chép database của monolith cho mọi service dùng chung', explanation: 'Database dùng chung tạo ràng buộc chặt giữa các service, đi ngược mục tiêu tách độc lập.' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Những lợi ích nào có được khi các service giao tiếp bất đồng bộ qua message broker?',
          relatedLecture: 5,
          options: [
            { content: 'Service gửi không bị chặn khi service nhận đang chậm hoặc tạm ngừng', correct: true, explanation: 'Message nằm trong broker cho tới khi bên nhận xử lý, nên hai bên không phải sẵn sàng cùng lúc.' },
            { content: 'Dễ thêm service mới lắng nghe cùng một sự kiện mà không sửa service gửi', correct: true, explanation: 'Mô hình publish/subscribe cho phép mở rộng bên tiêu thụ độc lập với bên phát.' },
            { content: 'Dữ liệu giữa các service luôn nhất quán ngay lập tức', explanation: 'Giao tiếp bất đồng bộ dẫn tới nhất quán cuối cùng, không phải nhất quán tức thì.' },
            { content: 'Việc debug luồng xử lý trở nên đơn giản hơn gọi trực tiếp', explanation: 'Luồng đi qua broker khó theo dõi hơn, cần thêm tracing và correlation ID.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Trong Saga dạng orchestration cho luồng đặt vé, khi bước thanh toán thất bại thì hệ thống xử lý thế nào?',
          relatedLecture: 6,
          options: [
            { content: 'Orchestrator gọi các compensating transaction để huỷ giữ chỗ đã thực hiện ở bước trước', correct: true, explanation: 'Saga không rollback như transaction đơn lẻ mà chạy hành động bù trừ theo chiều ngược lại.' },
            { content: 'Database tự rollback mọi thay đổi ở tất cả service', explanation: 'Mỗi service có database riêng, không có transaction chung để rollback tự động.' },
            { content: 'Bỏ qua lỗi và đánh dấu đơn là thành công', explanation: 'Làm vậy gây sai lệch dữ liệu giữa các service, đúng vấn đề Saga phải giải quyết.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Circuit breaker giải quyết vấn đề gì trong hệ thống microservices?',
          relatedLecture: 7,
          options: [
            { content: 'Ngăn lỗi lan dây chuyền bằng cách ngừng gọi tạm thời tới service đang lỗi liên tục', correct: true, explanation: 'Khi mạch mở, request thất bại nhanh thay vì chờ timeout, giúp service gọi không cạn tài nguyên.' },
            { content: 'Cân bằng tải giữa các instance của một service', explanation: 'Đó là việc của load balancer, không phải circuit breaker.' },
            { content: 'Mã hoá dữ liệu truyền giữa các service', explanation: 'Mã hoá đường truyền thuộc về TLS hoặc service mesh, không liên quan circuit breaker.' },
          ],
        },
      ],
    },
  },
  // L5
  {
    instructorEmail: 'phuong.bui@skillpath.test',
    categorySlug: 'software-engineering',
    topics: [{ slug: 'system-design-interview', primary: true }, { slug: 'software-architecture' }],
    language: 'vi',
    level: 'advanced',
    priceAmount: 799_000,
    status: 'published',
    title: 'Luyện phỏng vấn System Design',
    subtitle: 'Trả lời vòng System Design có cấu trúc, ước lượng nhanh và bảo vệ được từng lựa chọn thiết kế',
    description: [
      'Vòng System Design thường là vòng khó nhất khi phỏng vấn vị trí senior. Không có đáp án đúng duy nhất, đề bài rất rộng, và chỉ trong khoảng 45 phút bạn phải vừa làm rõ yêu cầu, vừa vẽ kiến trúc, vừa trả lời các câu hỏi đào sâu. Nhiều ứng viên giỏi kỹ thuật vẫn trượt vì trả lời lan man, nhảy ngay vào chi tiết hoặc không giải thích được vì sao chọn giải pháp này mà không chọn giải pháp khác.',
      'Khoá học trang bị cho bạn một khung trả lời 4 bước: làm rõ yêu cầu, ước lượng quy mô, thiết kế tổng quan và đào sâu vào điểm nghẽn. Sau đó chúng ta luyện khung này qua các đề kinh điển:\n• Dịch vụ rút gọn URL\n• News feed kiểu mạng xã hội\n• Hệ thống chat thời gian thực\n• Rate limiter cho API công khai',
      'Trước khi vào đề, khoá ôn lại các khối xây dựng mà đề nào cũng cần: load balancer, cache, CDN, chọn SQL hay NoSQL, sharding, replication và message queue. Mỗi khối được giải thích kèm câu hỏi người phỏng vấn hay hỏi tiếp và cách trả lời ngắn gọn mà đủ ý.',
      'Điểm khác của khoá là phần phỏng vấn thử: bạn xem một buổi phỏng vấn mẫu từ đầu đến cuối, kèm phần phân tích chỗ nào ứng viên làm tốt, chỗ nào bỏ lỡ tín hiệu từ người phỏng vấn. Học xong, bạn có một quy trình trả lời rõ ràng, biết ước lượng con số nhanh và tự tin trình bày đánh đổi của từng thiết kế.',
    ].join('\n\n'),
    learningObjectives: [
      'Áp dụng khung 4 bước để dẫn dắt buổi phỏng vấn System Design trong 45 phút',
      'Ước lượng QPS, dung lượng lưu trữ và băng thông từ số người dùng giả định',
      'Chọn và giải thích đánh đổi giữa SQL, NoSQL, sharding và replication cho từng đề',
      'Thiết kế hoàn chỉnh dịch vụ rút gọn URL, news feed và hệ thống chat thời gian thực',
      'Cài đặt ý tưởng rate limiter bằng token bucket và sliding window',
    ],
    requirements: [
      'Có kinh nghiệm làm Backend và hiểu cách một web app gọi database, cache',
      'Đã nghe qua khái niệm load balancer, message queue là một lợi thế',
    ],
    targetAudience: [
      'Kỹ sư Backend chuẩn bị phỏng vấn vị trí senior hoặc tech lead',
      'Lập trình viên muốn hệ thống hoá kiến thức thiết kế hệ thống phân tán',
    ],
    thumbnail: { label: 'System Design', tagline: 'Vượt vòng phỏng vấn' },
    sections: [
      {
        title: 'Chiến lược trả lời',
        lectures: [
          'Giới thiệu khoá học và khung trả lời 4 bước',
          'Ước lượng nhanh: QPS, dung lượng lưu trữ và băng thông',
        ],
      },
      {
        title: 'Các khối xây dựng',
        lectures: [
          'Load balancer, cache và CDN',
          'Chọn database: SQL, NoSQL, sharding và replication',
          'Message queue và xử lý bất đồng bộ',
        ],
      },
      {
        title: 'Đề phỏng vấn kinh điển',
        lectures: [
          'Thiết kế dịch vụ rút gọn URL',
          'Thiết kế news feed kiểu mạng xã hội',
          'Thiết kế hệ thống chat thời gian thực',
        ],
      },
      {
        title: 'Đào sâu và phỏng vấn thử',
        lectures: [
          'Thiết kế rate limiter: token bucket và sliding window',
          'Phỏng vấn thử và phân tích phản hồi',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: System Design',
      description: 'Ôn lại ước lượng quy mô, khối xây dựng và các đề kinh điển.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Một dịch vụ có 10 triệu lượt ghi mỗi ngày. QPS ghi trung bình xấp xỉ bao nhiêu?',
          relatedLecture: 1,
          options: [
            { content: 'Khoảng 115', correct: true, explanation: 'Một ngày có 86.400 giây, 10.000.000 / 86.400 ≈ 115. Khi phỏng vấn có thể làm tròn 1 ngày ≈ 100.000 giây cho nhanh.' },
            { content: 'Khoảng 1.150', explanation: 'Con số này lệch 10 lần, thường do nhầm số giây trong ngày.' },
            { content: 'Khoảng 11', explanation: 'Con số này quá thấp; 11 QPS chỉ tương ứng khoảng 1 triệu lượt mỗi ngày.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Với chiến lược cache-aside, khi đọc dữ liệu mà cache không có thì ứng dụng làm gì?',
          relatedLecture: 2,
          options: [
            { content: 'Đọc từ database rồi ghi kết quả vào cache cho lần sau', correct: true, explanation: 'Ứng dụng tự quản lý cache: miss thì đọc nguồn chính và nạp lại cache.' },
            { content: 'Trả lỗi cho client và chờ cache được nạp', explanation: 'Cache miss là chuyện bình thường, không phải lỗi cần trả cho client.' },
            { content: 'Cache tự gọi database rồi trả về', explanation: 'Đó là mô hình read-through, nơi cache chịu trách nhiệm nạp dữ liệu, khác với cache-aside.' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Những lựa chọn nào hợp lý khi thiết kế dịch vụ rút gọn URL ở quy mô lớn?',
          relatedLecture: 5,
          options: [
            { content: 'Sinh mã ngắn bằng cách mã hoá base62 một ID tăng dần', correct: true, explanation: 'Base62 cho mã ngắn, không trùng và dễ sinh nếu có bộ đếm ID phân tán.' },
            { content: 'Đặt cache trước database cho chiều đọc', correct: true, explanation: 'Tỉ lệ đọc lớn hơn ghi rất nhiều, cache giúp giảm tải database và giảm độ trễ chuyển hướng.' },
            { content: 'Dùng mã MD5 đầy đủ 32 ký tự của URL gốc làm mã ngắn', explanation: '32 ký tự không còn là URL ngắn; nếu cắt bớt thì phải xử lý trùng mã.' },
            { content: 'Lưu mọi URL trong bộ nhớ của một server duy nhất', explanation: 'Một server là điểm lỗi duy nhất và không đủ bộ nhớ khi dữ liệu tăng.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Trong hệ thống chat thời gian thực, giao thức nào thường dùng để server đẩy tin nhắn tới client ngay khi có?',
          relatedLecture: 7,
          options: [
            { content: 'WebSocket', correct: true, explanation: 'WebSocket giữ kết nối hai chiều lâu dài, server gửi tin mà không cần client hỏi lại.' },
            { content: 'Short polling mỗi 30 giây', explanation: 'Độ trễ cao và tốn tài nguyên do nhiều request rỗng, không phù hợp chat.' },
            { content: 'Gửi email thông báo', explanation: 'Email không phải kênh thời gian thực và không dùng để hiển thị tin nhắn trong ứng dụng.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Ưu điểm của thuật toán token bucket so với fixed window counter khi làm rate limiter là gì?',
          relatedLecture: 8,
          options: [
            { content: 'Cho phép burst ngắn trong giới hạn dung lượng bucket mà vẫn giữ tốc độ trung bình', correct: true, explanation: 'Token được nạp đều đặn; client có thể dùng dồn số token tích luỹ, phù hợp lưu lượng thực tế.' },
            { content: 'Không cần lưu bất kỳ trạng thái nào', explanation: 'Token bucket vẫn cần lưu số token và thời điểm nạp gần nhất cho từng client.' },
            { content: 'Chặn hoàn toàn mọi request vượt mức trong cả ngày', explanation: 'Token bucket giới hạn theo tốc độ nạp, không khoá client cả ngày.' },
          ],
        },
      ],
    },
  },
  // L6
  {
    instructorEmail: 'lucas.meyer@skillpath.test',
    categorySlug: 'game-development',
    topics: [{ slug: 'unity', primary: true }, { slug: 'c-sharp' }, { slug: 'game-development' }],
    language: 'en',
    level: 'beginner',
    priceAmount: 799_000,
    status: 'published',
    title: 'Unity Game Development: 2D & 3D',
    subtitle: 'Build and ship a 2D platformer and a small 3D game in Unity while learning C# from scratch',
    description: [
      "Most people who want to make games open Unity, follow a video that drags a cube around, and then stall when it is time to turn that cube into an actual game with levels, enemies, a score and a menu. This course is designed to get you past that wall. Instead of a tour of every editor panel, you build two complete projects and learn each feature at the moment the game needs it.",
      "The first project is a 2D platformer. You will lay out levels with Tilemaps, animate a character with the Animator, handle jumping and collisions with Rigidbody2D, and wire up collectibles, hazards and a score display. The second project moves into 3D: a third-person exploration game with a Cinemachine camera, physics-based movement and simple interactions. Along the way you will learn:\n• C# fundamentals in the context of MonoBehaviour scripts\n• The component-based way Unity structures every object in a scene\n• The new Input System for keyboard and gamepad controls\n• Prefabs, spawning and organising a project so it stays maintainable",
      "Every lecture ends with a working build you can play, and the source for each step is provided so you can compare your project if something goes wrong. I explain why things work, not just which buttons to press, so you can debug problems that do not appear in the videos.",
      "No prior programming experience is required. By the end you will have two playable games exported for desktop and the browser, and the confidence to start your own project or join a game jam.",
    ].join('\n\n'),
    learningObjectives: [
      'Navigate the Unity editor and organise scenes, assets and prefabs in a clean project structure',
      'Write C# MonoBehaviour scripts that use Start, Update and FixedUpdate correctly',
      'Build a 2D platformer level with Tilemaps, sprite animation, collisions and a score UI',
      'Set up a third-person 3D controller with Cinemachine and physics-based movement',
      'Handle keyboard and gamepad input through the Input System package',
      'Export a finished game for Windows, macOS and WebGL',
    ],
    requirements: [
      'A computer able to run Unity 6 (Windows, macOS or Linux)',
      'No programming experience needed; C# is taught from the basics',
    ],
    targetAudience: [
      'Beginners who want to make their first complete game',
      'Developers from other fields curious about game programming with C#',
    ],
    thumbnail: { label: 'Unity', tagline: 'Ship your first 2D & 3D games' },
    sections: [
      {
        title: 'Getting Started',
        lectures: [
          'Course introduction and the two games we will build',
          'Installing Unity Hub and touring the editor',
        ],
      },
      {
        title: 'C# Scripting Fundamentals',
        lectures: [
          'GameObjects, components and the MonoBehaviour lifecycle',
          'Handling player input with the Input System',
          'Rigidbody physics, colliders and triggers',
        ],
      },
      {
        title: 'Building a 2D Platformer',
        lectures: [
          'Tilemaps and level layout',
          'Sprite animation with the Animator controller',
          'Prefabs, spawning and a simple score UI',
        ],
      },
      {
        title: 'Into 3D',
        lectures: [
          '3D character controller with Rigidbody and a Cinemachine third-person camera',
          'Building and exporting your game for desktop and WebGL',
        ],
      },
    ],
    quiz: {
      title: 'Quiz: Unity fundamentals',
      description: 'Check your understanding of scripting, physics and prefabs in Unity.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Which MonoBehaviour method is the right place to apply forces to a Rigidbody?',
          relatedLecture: 2,
          options: [
            { content: 'FixedUpdate', correct: true, explanation: 'FixedUpdate runs in step with the physics simulation, so forces are applied consistently regardless of frame rate.' },
            { content: 'Update', explanation: 'Update runs once per rendered frame, so applying forces there makes physics depend on frame rate.' },
            { content: 'Awake', explanation: 'Awake runs once when the object is created; it is for initialisation, not continuous movement.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Why should movement in Update be multiplied by Time.deltaTime?',
          relatedLecture: 2,
          options: [
            { content: 'So the object moves at the same speed in units per second whatever the frame rate is', correct: true, explanation: 'deltaTime is the time since the last frame, turning "per frame" movement into "per second" movement.' },
            { content: 'To make the game run at a fixed 60 frames per second', explanation: 'deltaTime does not limit frame rate; it compensates for whatever frame rate you have.' },
            { content: 'Because the Input System requires it', explanation: 'The Input System returns input values; scaling by time is a separate concern.' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Which conditions are needed for OnTriggerEnter2D to be called when the player touches a coin?',
          relatedLecture: 4,
          options: [
            { content: 'The coin has a Collider2D with Is Trigger enabled', correct: true, explanation: 'Trigger callbacks only fire when at least one of the colliders is marked as a trigger.' },
            { content: 'At least one of the two objects has a Rigidbody2D', correct: true, explanation: 'Unity only detects contacts between colliders when a Rigidbody2D is involved.' },
            { content: 'The coin and player are on the same sorting layer', explanation: 'Sorting layers control drawing order, not physics detection.' },
            { content: 'The script method is marked public', explanation: 'Unity finds message methods like OnTriggerEnter2D by name; the access modifier does not matter.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'What is the main benefit of turning an enemy into a prefab?',
          relatedLecture: 7,
          options: [
            { content: 'You can spawn many copies and update all of them by editing the prefab once', correct: true, explanation: 'Prefab instances share the same source asset, so changes propagate to every instance.' },
            { content: 'Prefabs render faster than normal GameObjects', explanation: 'Rendering cost is the same; prefabs are an authoring and reuse tool.' },
            { content: 'Prefabs cannot be destroyed at runtime, so they are safer', explanation: 'Prefab instances can be destroyed like any other GameObject.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'What does a Cinemachine virtual camera give you compared with a hand-written camera follow script?',
          relatedLecture: 8,
          options: [
            { content: 'Configurable follow, look-at, damping and collision handling without writing camera code', correct: true, explanation: 'Cinemachine drives the real camera from virtual camera settings, covering most third-person needs out of the box.' },
            { content: 'Automatic level-of-detail for every mesh in the scene', explanation: 'LOD is handled by LOD Group components, not by Cinemachine.' },
            { content: 'Multiplayer split-screen without any extra setup', explanation: 'Split-screen still needs multiple cameras and viewport setup; Cinemachine only helps control each one.' },
          ],
        },
      ],
    },
  },
  // L7
  {
    instructorEmail: 'lucas.meyer@skillpath.test',
    categorySlug: 'game-development',
    topics: [{ slug: 'unreal-engine', primary: true }, { slug: 'c-plus-plus' }],
    language: 'en',
    level: 'intermediate',
    priceAmount: 999_000,
    status: 'published',
    title: 'Unreal Engine 5: Blueprints & C++',
    subtitle: 'Combine Blueprints and C++ in Unreal Engine 5 to build gameplay systems that scale beyond a prototype',
    description: [
      "Unreal Engine 5 makes it easy to prototype with Blueprints, but many projects hit a point where the node graphs become impossible to follow and performance starts to suffer. The usual advice is to \"move it to C++\", yet the jump from Blueprints to Unreal C++ is steep: reflection macros, garbage collection rules, build errors that span pages. This course teaches you how the two fit together so you can decide where each piece of logic belongs.",
      "We build a small action game step by step. You start with Blueprint fundamentals and communication patterns, then create your first C++ Actor and expose it to Blueprints so designers can still tweak values in the editor. From there you will:\n• Use UPROPERTY and UFUNCTION specifiers correctly and understand what they do under the hood\n• Build a reusable health component with delegates that Blueprints can bind to\n• Create enemy AI with Behavior Trees, the Blackboard and custom C++ tasks\n• Profile frame time with Unreal Insights and package a shipping build",
      "Each lecture explains the reasoning behind the engine's conventions, so the C++ stops looking like magic and you can read engine source when the documentation runs out. The finished project is structured the way a small team would organise a real game, with gameplay rules in C++ and tuning in Blueprints.",
      "You should already be comfortable with basic programming and have opened Unreal before. By the end you will be able to design gameplay features that split cleanly between C++ and Blueprints and ship a packaged build of your game.",
    ].join('\n\n'),
    learningObjectives: [
      'Structure Blueprint logic with interfaces and event dispatchers instead of hard casts',
      'Create C++ Actor and Component classes and expose them to Blueprints with UPROPERTY and UFUNCTION',
      'Implement a reusable health component that broadcasts events through dynamic multicast delegates',
      'Build enemy behaviour with Behavior Trees, Blackboard keys and a custom C++ task',
      'Profile frame time with Unreal Insights and package a shipping build for Windows',
    ],
    requirements: [
      'Basic programming knowledge in any language; some C++ exposure helps',
      'A PC that meets Unreal Engine 5 requirements, with Visual Studio or Rider installed',
    ],
    targetAudience: [
      'Blueprint users ready to move core gameplay into C++',
      'C++ programmers who want to start working in Unreal Engine',
    ],
    thumbnail: { label: 'Unreal Engine', tagline: 'Blueprints meets C++' },
    sections: [
      {
        title: 'Setting Up',
        lectures: [
          'Course introduction and project overview',
          'Setting up Unreal Engine 5 with Visual Studio or Rider',
        ],
      },
      {
        title: 'Blueprint Foundations',
        lectures: [
          'Blueprint visual scripting: events, variables and flow control',
          'Blueprint communication: casting, interfaces and event dispatchers',
        ],
      },
      {
        title: 'Gameplay in C++',
        lectures: [
          'Creating your first Actor class in C++',
          'UPROPERTY and UFUNCTION: exposing C++ to Blueprints',
          'Building a health component with delegates',
        ],
      },
      {
        title: 'AI and Shipping',
        lectures: [
          'Enemy AI with Behavior Trees and the Blackboard',
          'Profiling with Unreal Insights and packaging a shipping build',
        ],
      },
    ],
    quiz: {
      title: 'Quiz: Unreal Engine 5 gameplay',
      description: 'Review Blueprint communication, C++ reflection and AI in Unreal Engine 5.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Why prefer a Blueprint Interface over casting to a specific class when the player interacts with objects?',
          relatedLecture: 3,
          options: [
            { content: 'The caller does not need to know the concrete class, so any actor implementing the interface can respond', correct: true, explanation: 'Interfaces remove hard dependencies between Blueprints and avoid loading unrelated assets through cast references.' },
            { content: 'Interfaces run on the GPU and are faster', explanation: 'Interface calls run on the game thread like any other Blueprint call.' },
            { content: 'Casting is not allowed in Unreal Engine 5', explanation: 'Casting is allowed; it just creates tight coupling when overused.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'What does marking a UObject pointer member with UPROPERTY() do for memory management?',
          relatedLecture: 5,
          options: [
            { content: 'It lets the garbage collector see the reference, so the object is not collected while still in use', correct: true, explanation: 'Raw pointers without UPROPERTY are invisible to the garbage collector and may end up dangling.' },
            { content: 'It turns the pointer into a std::shared_ptr', explanation: 'Unreal uses its own reflection-based garbage collection, not standard smart pointers, for UObjects.' },
            { content: 'It allocates the object on the stack', explanation: 'UObjects are always heap-allocated through NewObject or spawn functions.' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Which specifiers make a C++ property editable in the Details panel and readable from Blueprints?',
          relatedLecture: 5,
          options: [
            { content: 'EditAnywhere', correct: true, explanation: 'EditAnywhere allows editing the value on both the class defaults and placed instances.' },
            { content: 'BlueprintReadOnly', correct: true, explanation: 'BlueprintReadOnly exposes a getter node to Blueprint graphs.' },
            { content: 'Transient', explanation: 'Transient means the value is not saved; it does not expose anything to the editor.' },
            { content: 'BlueprintCallable', explanation: 'BlueprintCallable is a UFUNCTION specifier for functions, not for properties.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Why use a dynamic multicast delegate such as OnHealthChanged in the health component?',
          relatedLecture: 6,
          options: [
            { content: 'Several listeners, including Blueprints like the HUD, can subscribe without the component knowing about them', correct: true, explanation: 'Multicast delegates broadcast to any number of bound functions, and the dynamic variant is visible to Blueprints.' },
            { content: 'Delegates make health replicate automatically in multiplayer', explanation: 'Replication needs Replicated properties or RPCs; delegates only handle local notifications.' },
            { content: 'It is the only way to call a function every tick', explanation: 'Ticking is handled by the Tick function, not by delegates.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'In a Behavior Tree, what is the role of the Blackboard?',
          relatedLecture: 7,
          options: [
            { content: 'It stores the data the tree reads and writes, such as the target actor or last known location', correct: true, explanation: 'Decorators and tasks query Blackboard keys to decide which branch to run.' },
            { content: 'It draws debug lines for the navigation mesh', explanation: 'Navigation debugging is a separate visualisation feature.' },
            { content: 'It replaces the AI Controller', explanation: 'The AI Controller still runs the Behavior Tree; the Blackboard is its memory.' },
          ],
        },
      ],
    },
  },
  // L8
  {
    instructorEmail: 'lucas.meyer@skillpath.test',
    categorySlug: 'programming-languages',
    topics: [{ slug: 'c-plus-plus', primary: true }, { slug: 'algorithms' }],
    language: 'en',
    level: 'intermediate',
    priceAmount: 499_000,
    status: 'in_review',
    title: 'Modern C++ for Game Programmers',
    subtitle: 'Write safe, fast C++17 and C++20 code for game loops, memory management and collision systems',
    description: [
      "Game code has to be fast every single frame, and C++ is still the language most engines rely on for that. But a lot of C++ taught online is either decades old, full of raw new and delete, or so academic that it never touches the problems game programmers face: frame budgets, cache misses, thousands of short-lived objects and collision checks that grow out of control.",
      "This course teaches modern C++ through the lens of game systems. We start with a clean CMake project with warnings and sanitizers enabled, then work through ownership and memory before moving on to performance. Topics include:\n• RAII, unique_ptr and shared_ptr, and when each one is the right choice\n• Move semantics and how to avoid hidden copies in hot paths\n• Data-oriented layout: arrays of structs versus structs of arrays\n• STL containers and algorithms that suit per-frame updates\n• Object pools, templates and constexpr for compile-time work\n• A uniform grid for broad-phase collision instead of checking every pair",
      "Each topic is shown with small benchmarks you can run yourself, so you see the difference rather than take it on trust. The examples are engine-agnostic, so the skills transfer whether you later work with Unreal, a custom engine or a simulation project.",
      "You should already know basic C++ syntax such as classes, references and loops. By the end you will write C++ that is easier to reason about, avoids common memory bugs and keeps per-frame work within budget.",
    ].join('\n\n'),
    learningObjectives: [
      'Manage object lifetimes with RAII and smart pointers instead of manual new and delete',
      'Apply move semantics to remove unnecessary copies in performance-critical code',
      'Restructure game data from arrays of structs to structs of arrays and measure the effect',
      'Implement an object pool for frequently spawned entities such as bullets and particles',
      'Replace O(n²) collision checks with a uniform grid broad phase',
    ],
    requirements: [
      'Comfortable with basic C++ syntax: classes, references, loops and functions',
      'A C++20-capable compiler (GCC, Clang or MSVC) and CMake installed',
    ],
    targetAudience: [
      'Game programmers who learned older C++ and want to modernise their style',
      'Developers preparing to work on engine or gameplay code in C++',
    ],
    thumbnail: { label: 'C++', tagline: 'Fast, safe code for games' },
    sections: [
      {
        title: 'Foundations',
        lectures: [
          'Course introduction: why modern C++ still powers game engines',
          'Setting up a CMake project with warnings and sanitizers',
        ],
      },
      {
        title: 'Memory and Ownership',
        lectures: [
          'RAII, unique_ptr and shared_ptr',
          'Move semantics and rvalue references',
          'Value categories and avoiding hidden copies',
        ],
      },
      {
        title: 'Performance-Minded Code',
        lectures: [
          'Cache-friendly data layout: arrays of structs vs structs of arrays',
          'STL containers and algorithms for game loops',
          'Object pools and custom allocators',
        ],
      },
      {
        title: 'Advanced Techniques',
        lectures: [
          'Templates, constexpr and compile-time computation',
          'Spatial partitioning with a uniform grid for collision checks',
        ],
      },
    ],
    quiz: {
      title: 'Quiz: Modern C++ for games',
      description: 'Review ownership, move semantics and performance techniques covered in the course.',
      questions: [
        {
          type: 'single_choice',
          stem: 'An enemy owns exactly one AI controller that should be destroyed with it. Which smart pointer fits best?',
          relatedLecture: 2,
          options: [
            { content: 'std::unique_ptr', correct: true, explanation: 'Single ownership with automatic destruction is exactly what unique_ptr expresses, with no reference-counting cost.' },
            { content: 'std::shared_ptr', explanation: 'shared_ptr adds atomic reference counting and suggests shared ownership that does not exist here.' },
            { content: 'A raw pointer created with new', explanation: 'A raw owning pointer requires a manual delete and leaks if an exception or early return skips it.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'What does std::move actually do?',
          relatedLecture: 3,
          options: [
            { content: 'It casts its argument to an rvalue reference so a move constructor or move assignment can be chosen', correct: true, explanation: 'std::move performs no work itself; the move happens only if a function accepting an rvalue is selected.' },
            { content: 'It copies the object into new memory', explanation: 'Copying is the opposite of what moving is meant to avoid.' },
            { content: 'It frees the memory of the source object immediately', explanation: 'The source stays alive in a valid but unspecified state until it goes out of scope.' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Why can a structs-of-arrays layout speed up a loop that only updates particle positions?',
          relatedLecture: 5,
          options: [
            { content: 'Positions are stored contiguously, so each cache line holds only data the loop needs', correct: true, explanation: 'Fewer bytes are loaded per particle, which reduces cache misses.' },
            { content: 'Contiguous arrays of the same type are easier for the compiler to vectorise with SIMD', correct: true, explanation: 'Uniform, tightly packed data lets the compiler process several elements per instruction.' },
            { content: 'It reduces the total number of particles in memory', explanation: 'The particle count is unchanged; only the arrangement in memory differs.' },
            { content: 'It removes the need for bounds checks in C++', explanation: 'Layout has no effect on bounds checking, which standard arrays do not perform anyway.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'What problem does an object pool solve for bullets that are spawned and destroyed many times per second?',
          relatedLecture: 7,
          options: [
            { content: 'It reuses preallocated objects, avoiding repeated heap allocation and fragmentation', correct: true, explanation: 'Allocation is done once up front; spawning just reactivates a free slot.' },
            { content: 'It makes bullets render with fewer draw calls', explanation: 'Draw calls depend on rendering and batching, not on how objects are allocated.' },
            { content: 'It guarantees bullets never collide with each other', explanation: 'Collision behaviour is unrelated to memory management.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'With n objects spread fairly evenly, how does a uniform grid broad phase improve on checking every pair?',
          relatedLecture: 9,
          options: [
            { content: 'Each object is tested only against objects in its own and neighbouring cells, bringing the cost close to O(n)', correct: true, explanation: 'Pairs that are far apart are never considered, removing most of the O(n²) work.' },
            { content: 'It sorts all objects so collisions can be found by binary search', explanation: 'That describes a sweep-and-prune approach, not a uniform grid.' },
            { content: 'It makes narrow-phase collision tests unnecessary', explanation: 'The grid only finds candidate pairs; precise shape tests are still needed.' },
          ],
        },
      ],
    },
  },
  // L9
  {
    instructorEmail: 'dang.trinh@skillpath.test',
    categorySlug: 'game-development',
    topics: [{ slug: 'godot', primary: true }, { slug: 'game-development' }],
    language: 'vi',
    level: 'beginner',
    priceAmount: 0,
    status: 'published',
    title: 'Làm game đầu tay với Godot',
    subtitle: 'Tự tay làm một game 2D hoàn chỉnh bằng Godot 4 và GDScript, xuất bản để bạn bè chơi thử',
    description: [
      'Nhiều bạn ấp ủ làm game nhưng ngại bắt đầu vì nghĩ phải học một engine nặng nề, máy phải mạnh hoặc phải giỏi lập trình từ trước. Godot là một engine mã nguồn mở, nhẹ, miễn phí hoàn toàn và rất thân thiện với người mới. Khoá học này giúp bạn đi từ con số không tới một game 2D chơi được, có điểm số, có màn hình kết thúc và chạy được trên trình duyệt.',
      'Game chúng ta làm là một trò chơi nhặt sao: nhân vật di chuyển trên bản đồ, tránh chướng ngại và thu thập càng nhiều sao càng tốt trước khi hết giờ. Trong quá trình làm, bạn sẽ học:\n• Cách Godot tổ chức game bằng scene và node\n• GDScript cơ bản: biến, hàm, điều kiện, _process và _physics_process\n• Di chuyển nhân vật với CharacterBody2D và xử lý va chạm\n• Signal để các phần của game giao tiếp với nhau\n• Giao diện điểm số, màn hình Game Over và xuất game ra Windows, HTML5',
      'Mỗi bài học đều thêm một phần nhìn thấy được vào game, nên bạn luôn có cảm giác tiến bộ sau từng video. Mình giải thích bằng ngôn ngữ đời thường, tránh thuật ngữ khó khi chưa cần, và chia sẻ cả những lỗi mình từng gặp khi mới học Godot để bạn tránh mất thời gian.',
      'Khoá học không yêu cầu kinh nghiệm lập trình. Học xong, bạn có một game của riêng mình để chia sẻ, hiểu cách một game 2D được ghép lại từ các mảnh nhỏ và đủ nền tảng để tự làm những ý tưởng tiếp theo.',
    ].join('\n\n'),
    learningObjectives: [
      'Cài đặt Godot 4 và sử dụng thành thạo các bảng chính của editor',
      'Tổ chức game thành các scene và node có thể tái sử dụng',
      'Viết GDScript để điều khiển nhân vật bằng bàn phím với CharacterBody2D',
      'Dùng Area2D và signal để xử lý nhặt vật phẩm, va chạm và cộng điểm',
      'Xuất game ra bản Windows và HTML5 để chia sẻ cho người khác chơi',
    ],
    requirements: [
      'Máy tính chạy Windows, macOS hoặc Linux, không cần card đồ hoạ rời',
      'Không cần biết lập trình trước',
    ],
    targetAudience: [
      'Người mới muốn tự làm game 2D đầu tiên',
      'Học sinh, sinh viên yêu thích game và muốn thử sức với lập trình',
    ],
    thumbnail: { label: 'Godot', tagline: 'Game 2D đầu tay' },
    sections: [
      {
        title: 'Làm quen với Godot',
        lectures: [
          'Giới thiệu khoá học và game nhặt sao sẽ làm',
          'Cài Godot 4 và làm quen giao diện editor',
        ],
      },
      {
        title: 'Scene, node và GDScript',
        lectures: [
          'Scene và node: cách Godot tổ chức một game',
          'GDScript cơ bản: biến, hàm, _process và _physics_process',
          'Di chuyển nhân vật với CharacterBody2D và move_and_slide()',
        ],
      },
      {
        title: 'Hoàn thiện gameplay',
        lectures: [
          'Area2D và nhặt vật phẩm',
          'Signal: kết nối sự kiện giữa các node',
          'Giao diện điểm số, đồng hồ đếm ngược và màn hình Game Over',
        ],
      },
      {
        title: 'Xuất bản',
        lectures: ['Xuất game ra Windows và HTML5'],
      },
    ],
    quiz: {
      title: 'Kiểm tra: Godot cơ bản',
      description: 'Ôn lại scene, node, GDScript và signal trong Godot 4.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Trong Godot, một scene thực chất là gì?',
          relatedLecture: 2,
          options: [
            { content: 'Một cây node được lưu lại và có thể tái sử dụng như một khối', correct: true, explanation: 'Nhân vật, đồng xu hay cả màn chơi đều là scene; scene có thể lồng vào scene khác.' },
            { content: 'Chỉ là màn chơi lớn nhất của game', explanation: 'Scene có thể nhỏ như một viên đạn, không nhất thiết là cả màn chơi.' },
            { content: 'Một file hình ảnh nền', explanation: 'Hình ảnh chỉ là tài nguyên mà node như Sprite2D sử dụng, không phải scene.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Khi tự cộng tốc độ vào position của ngôi sao trôi lơ lửng trong _process(delta), vì sao phải nhân với delta?',
          relatedLecture: 3,
          options: [
            { content: 'Để nhân vật đi cùng một quãng đường mỗi giây dù máy chạy nhanh hay chậm', correct: true, explanation: 'delta là thời gian giữa hai khung hình, giúp chuyển tốc độ từ mỗi khung hình sang mỗi giây.' },
            { content: 'Để game luôn chạy đúng 60 khung hình mỗi giây', explanation: 'delta không khoá số khung hình, nó chỉ bù cho tốc độ khung hình thay đổi.' },
            { content: 'Vì GDScript bắt buộc mọi phép tính phải dùng delta', explanation: 'Không có quy định đó; delta chỉ cần cho chuyển động phụ thuộc thời gian.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Node nào phù hợp nhất cho nhân vật người chơi cần di chuyển và va vào tường?',
          relatedLecture: 4,
          options: [
            { content: 'CharacterBody2D', correct: true, explanation: 'CharacterBody2D được điều khiển bằng code trong _physics_process và có move_and_slide() để trượt dọc tường.' },
            { content: 'Area2D', explanation: 'Area2D chỉ phát hiện vật thể đi vào, không chặn chuyển động.' },
            { content: 'Label', explanation: 'Label dùng để hiển thị chữ trên giao diện, không có vật lý.' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Những phát biểu nào đúng về signal trong Godot?',
          relatedLecture: 6,
          options: [
            { content: 'Node phát signal không cần biết node nào đang lắng nghe', correct: true, explanation: 'Signal giúp các node giao tiếp mà không phụ thuộc chặt vào nhau.' },
            { content: 'Có thể kết nối signal trong editor hoặc bằng code với connect()', correct: true, explanation: 'Cả hai cách đều được hỗ trợ, tuỳ tình huống mà chọn.' },
            { content: 'Bạn có thể tự khai báo signal riêng bằng từ khoá signal', correct: true, explanation: 'Ví dụ signal star_collected giúp thông báo cho giao diện cộng điểm.' },
            { content: 'Mỗi signal chỉ được kết nối tới đúng một hàm', explanation: 'Một signal có thể kết nối tới nhiều hàm ở nhiều node khác nhau.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Khi người chơi chạm vào ngôi sao, signal nào của Area2D thường được dùng để phát hiện?',
          relatedLecture: 5,
          options: [
            { content: 'body_entered', correct: true, explanation: 'body_entered phát ra khi một physics body như CharacterBody2D đi vào vùng của Area2D.' },
            { content: 'ready', explanation: 'ready được gọi khi node vào cây scene, không liên quan tới va chạm.' },
            { content: 'pressed', explanation: 'pressed là signal của Button khi được bấm.' },
          ],
        },
      ],
    },
  },
  // L10
  {
    instructorEmail: 'dang.trinh@skillpath.test',
    categorySlug: 'game-development',
    topics: [{ slug: 'game-development', primary: true }, { slug: 'godot' }],
    language: 'vi',
    level: 'beginner',
    priceAmount: 0,
    status: 'draft',
    title: 'Thiết kế màn chơi và game loop',
    subtitle: 'Hiểu game loop và tự thiết kế màn chơi có nhịp độ, độ khó hợp lý rồi dựng thử bằng Godot',
    description: [
      'Làm được một nhân vật chạy nhảy trên màn hình chưa phải là làm được một game hay. Rất nhiều game đầu tay có cơ chế ổn nhưng người chơi bỏ cuộc sau vài phút vì màn chơi quá khó, quá dễ, hoặc đơn giản là nhàm chán. Thiết kế màn chơi là kỹ năng giúp biến một cơ chế thành trải nghiệm khiến người chơi muốn tiếp tục, và kỹ năng này hoàn toàn học được qua các nguyên tắc cụ thể.',
      'Khoá học bắt đầu bằng game loop, nhịp tim của mọi trò chơi: đọc input, cập nhật trạng thái và vẽ lại màn hình. Hiểu game loop giúp bạn biết vì sao game giật, vì sao vật lý phải chạy theo bước cố định và cách sắp xếp logic cho gọn. Sau đó chúng ta đi vào thiết kế màn chơi:\n• Đường cong độ khó và nhịp độ căng, nghỉ trong một màn\n• Dạy người chơi qua cách bố trí màn chơi thay vì đoạn hướng dẫn dài\n• Phác thảo trên giấy trước khi dựng để tiết kiệm thời gian\n• Checkpoint, hồi sinh và lưu tiến độ sao cho công bằng',
      'Phần thực hành dùng Godot 4 để dựng lại các màn chơi đã phác thảo bằng TileMap và các scene tái sử dụng. Cuối khoá là quy trình playtest: quan sát người chơi thật, ghi chép chỗ họ bị kẹt và cân bằng lại màn chơi dựa trên những gì quan sát được.',
      'Khoá học phù hợp với người đã làm quen Godot ở mức cơ bản và muốn game của mình chơi vui hơn. Học xong, bạn có một quy trình rõ ràng để thiết kế, dựng và tinh chỉnh màn chơi.',
    ].join('\n\n'),
    learningObjectives: [
      'Giải thích ba bước của game loop và phân biệt cập nhật theo khung hình với cập nhật vật lý cố định',
      'Thiết kế đường cong độ khó cho một chuỗi màn chơi có nhịp căng và nghỉ hợp lý',
      'Bố trí màn chơi để người chơi tự học cơ chế mới mà không cần hướng dẫn bằng chữ',
      'Dựng màn chơi trong Godot bằng TileMap và scene tái sử dụng, có checkpoint hoạt động',
      'Tổ chức một buổi playtest và cân bằng lại màn chơi từ ghi chép quan sát',
    ],
    requirements: [
      'Đã cài Godot 4 và biết tạo scene, node cơ bản',
      'Biết viết GDScript đơn giản như di chuyển nhân vật',
    ],
    targetAudience: [
      'Người mới làm game muốn màn chơi của mình hấp dẫn hơn',
      'Bạn đã học xong khoá Godot nhập môn và muốn đi tiếp',
    ],
    thumbnail: { label: 'Level Design', tagline: 'Màn chơi có nhịp điệu' },
    sections: [
      {
        title: 'Game loop',
        lectures: [
          'Giới thiệu khoá học: thế nào là một màn chơi hay',
          'Game loop là gì: input, update và render',
        ],
      },
      {
        title: 'Nguyên tắc thiết kế màn chơi',
        lectures: [
          'Đường cong độ khó và nhịp độ màn chơi',
          'Dạy người chơi qua bố cục màn chơi, không cần hướng dẫn chữ',
          'Phác thảo màn chơi trên giấy trước khi dựng',
        ],
      },
      {
        title: 'Dựng màn chơi trong Godot',
        lectures: [
          'Dựng màn chơi bằng TileMap và tái sử dụng scene',
          'Checkpoint, hồi sinh và lưu tiến độ',
        ],
      },
      {
        title: 'Playtest và tinh chỉnh',
        lectures: [
          'Playtest: quan sát người chơi và ghi chép',
          'Cân bằng lại màn chơi từ phản hồi playtest',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: game loop và thiết kế màn chơi',
      description: 'Ôn lại game loop, nguyên tắc thiết kế màn chơi và quy trình playtest.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Trong Godot, vì sao logic vật lý nên đặt trong _physics_process thay vì _process?',
          relatedLecture: 1,
          options: [
            { content: '_physics_process chạy theo bước thời gian cố định nên vật lý ổn định, không phụ thuộc tốc độ khung hình', correct: true, explanation: 'Bước cố định giúp va chạm và lực tính toán nhất quán trên mọi máy.' },
            { content: '_process không được phép đọc input', explanation: '_process vẫn đọc input bình thường; khác biệt nằm ở nhịp gọi hàm.' },
            { content: '_physics_process chỉ chạy một lần khi game bắt đầu', explanation: 'Hàm này được gọi liên tục, mặc định 60 lần mỗi giây.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Một đường cong độ khó tốt trong một màn chơi thường trông như thế nào?',
          relatedLecture: 2,
          options: [
            { content: 'Tăng dần nhưng xen kẽ các đoạn nghỉ ngắn trước thử thách lớn tiếp theo', correct: true, explanation: 'Nhịp căng và nghỉ giúp người chơi hồi sức và cảm nhận được tiến bộ.' },
            { content: 'Khó nhất ngay từ đầu để giữ chân người chơi giỏi', explanation: 'Người mới sẽ bỏ cuộc trước khi kịp hiểu cơ chế.' },
            { content: 'Giữ nguyên độ khó từ đầu đến cuối', explanation: 'Độ khó đứng yên khiến người chơi nhanh chán khi đã thành thạo.' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Những cách nào giúp người chơi tự học một cơ chế mới mà không cần đọc hướng dẫn?',
          relatedLecture: 3,
          options: [
            { content: 'Giới thiệu cơ chế trong một tình huống an toàn, thất bại không bị phạt nặng', correct: true, explanation: 'Người chơi dám thử nghiệm khi cái giá của sai lầm thấp.' },
            { content: 'Sau đó đặt cơ chế vào thử thách khó hơn để người chơi vận dụng', correct: true, explanation: 'Lặp lại với độ khó tăng dần giúp củng cố điều vừa học.' },
            { content: 'Dùng ánh sáng, màu sắc hoặc vật phẩm để dẫn mắt người chơi tới hướng cần đi', correct: true, explanation: 'Tín hiệu thị giác dẫn đường một cách tự nhiên, không làm gián đoạn trải nghiệm.' },
            { content: 'Đặt cơ chế mới ngay trước trận đánh trùm mà chưa từng giới thiệu', explanation: 'Người chơi chưa có cơ hội làm quen nên dễ thấy bất công và bỏ cuộc.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Khi đặt checkpoint trong màn chơi, nguyên tắc nào hợp lý nhất?',
          relatedLecture: 6,
          options: [
            { content: 'Đặt ngay trước đoạn thử thách khó để người chơi không phải đi lại phần dễ quá lâu', correct: true, explanation: 'Thất bại ở đoạn khó là chuyện bình thường; bắt đi lại quá xa gây ức chế.' },
            { content: 'Chỉ đặt một checkpoint ở cuối màn', explanation: 'Checkpoint cuối màn không giúp ích khi người chơi thất bại giữa chừng.' },
            { content: 'Đặt checkpoint sau mỗi bước chân', explanation: 'Quá dày sẽ làm mất hoàn toàn cảm giác thử thách.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Trong buổi playtest, người thiết kế nên làm gì khi người chơi bị kẹt?',
          relatedLecture: 7,
          options: [
            { content: 'Im lặng quan sát và ghi lại vị trí, thời gian bị kẹt cùng hành động người chơi đã thử', correct: true, explanation: 'Giải thích ngay sẽ che mất vấn đề thật mà người chơi ngoài đời sẽ gặp.' },
            { content: 'Chỉ ngay cách vượt qua để buổi test nhanh hơn', explanation: 'Người chơi thật sẽ không có ai bên cạnh chỉ dẫn, nên dữ liệu thu được bị sai lệch.' },
            { content: 'Dừng buổi test và sửa màn chơi ngay lập tức', explanation: 'Nên ghi chép hết rồi sửa sau, để thấy được toàn bộ các điểm vướng trong màn.' },
          ],
        },
      ],
    },
  },
];
