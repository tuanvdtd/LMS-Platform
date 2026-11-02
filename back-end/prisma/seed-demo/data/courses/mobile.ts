import type { SeedCourse } from '../types.ts';

export const COURSES: SeedCourse[] = [
  {
    instructorEmail: 'linh.vu@skillpath.test',
    categorySlug: 'mobile-apps',
    topics: [{ slug: 'google-flutter', primary: true }, { slug: 'dart-programming-language' }, { slug: 'mobile-development' }],
    language: 'vi',
    level: 'beginner',
    priceAmount: 799_000,
    status: 'published',
    title: 'Flutter & Dart: xây ứng dụng di động đa nền tảng',
    subtitle: 'Tự dựng ứng dụng ghi chép chi tiêu chạy trên cả Android và iOS chỉ với một bộ code Flutter',
    description:
      'Bạn muốn làm một ứng dụng di động chạy được cả trên Android lẫn iOS nhưng chưa biết bắt đầu từ đâu, hoặc đã thử vài hướng dẫn rời rạc rồi bị kẹt ở chỗ widget lồng nhau quá sâu, state không cập nhật, gọi API xong mà màn hình không đổi. Khoá học này đi từ con số không: cài Flutter SDK, học đủ Dart để đọc hiểu code, rồi dựng dần một ứng dụng ghi chép chi tiêu cá nhân hoàn chỉnh, có nhiều màn hình, có danh sách dài và có dữ liệu lấy từ API.\n\n' +
      'Thay vì học thuộc từng widget, bạn sẽ hiểu cách Flutter suy nghĩ: mọi thứ là widget, giao diện là hàm của state, và khi state đổi thì phần cây widget liên quan được dựng lại. Nắm được mô hình này rồi thì việc đọc tài liệu hay tự tìm hiểu widget mới nhẹ nhàng hơn nhiều. Mỗi bài đều gắn với một phần của ứng dụng cuối khoá, nên bạn luôn biết mình học cái này để làm gì.\n\n' +
      'Học xong khoá, bạn có thể:\n' +
      '• Viết Dart với null safety, hàm, class và async/await mà không phải đoán\n' +
      '• Chia giao diện thành widget nhỏ, dùng Row, Column, Stack và Expanded để dựng bố cục co giãn theo màn hình\n' +
      '• Hiển thị danh sách dài mượt mà bằng ListView.builder\n' +
      '• Điều hướng giữa các màn hình, truyền dữ liệu qua lại và quản lý state chung bằng Provider\n' +
      '• Gọi REST API, xử lý trạng thái đang tải và lỗi mạng bằng FutureBuilder\n\n' +
      'Khoá học dành cho người mới với lập trình di động, chỉ cần bạn đã biết một ngôn ngữ lập trình bất kỳ ở mức cơ bản. Mỗi chương kết thúc bằng một phần việc cụ thể trên ứng dụng chi tiêu: bạn tự làm trước rồi mới đối chiếu với lời giải của giảng viên. Cuối khoá có bài kiểm tra ngắn để bạn biết mình đã vững phần nào và cần xem lại phần nào trước khi bắt tay vào dự án riêng.',
    learningObjectives: [
      'Viết code Dart có null safety, class, hàm bất đồng bộ với async/await và Future',
      'Dựng bố cục co giãn bằng Row, Column, Stack, Expanded và chia màn hình thành widget tái sử dụng',
      'Hiển thị danh sách hàng trăm mục mượt mà bằng ListView.builder',
      'Điều hướng nhiều màn hình bằng Navigator, truyền tham số và nhận kết quả trả về',
      'Quản lý state dùng chung giữa các màn hình bằng Provider và ChangeNotifier',
      'Gọi REST API, hiển thị trạng thái đang tải, lỗi và dữ liệu bằng FutureBuilder',
    ],
    requirements: [
      'Biết cơ bản một ngôn ngữ lập trình bất kỳ: biến, câu lệnh điều kiện, vòng lặp, hàm',
      'Máy tính có ít nhất 8 GB RAM để chạy máy ảo Android',
    ],
    targetAudience: [
      'Người mới muốn làm ứng dụng di động cho cả Android và iOS từ một bộ code',
      'Lập trình viên web muốn mở rộng sang mảng di động',
    ],
    thumbnail: { label: 'Flutter', tagline: 'Một code, hai nền tảng' },
    sections: [
      {
        title: 'Làm quen với Flutter và Dart',
        lectures: [
          'Giới thiệu khoá học và ứng dụng ghi chép chi tiêu cuối khoá',
          'Cài Flutter SDK, Android Studio và chạy ứng dụng đầu tiên trên máy ảo',
          'Dart cho người mới: biến, kiểu dữ liệu, null safety và hàm',
        ],
      },
      {
        title: 'Widget và bố cục',
        lectures: [
          'StatelessWidget, StatefulWidget và cây widget',
          'Bố cục với Row, Column, Stack và Expanded',
          'ListView.builder: hiển thị danh sách giao dịch dài',
        ],
      },
      {
        title: 'Điều hướng, state và dữ liệu',
        lectures: [
          'Điều hướng với Navigator: push, pop và truyền tham số',
          'Quản lý state dùng chung với Provider và ChangeNotifier',
          'Gọi API bằng package http, async/await và FutureBuilder',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: nền tảng Flutter và Dart',
      description: 'Ôn lại null safety, widget, bố cục, danh sách và cách hiển thị dữ liệu bất đồng bộ.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Trong Dart có null safety, khai báo String? name; có nghĩa là gì?',
          relatedLecture: 2,
          options: [
            { content: 'Biến name có thể chứa một chuỗi hoặc null', correct: true, explanation: 'Dấu ? sau kiểu biến kiểu đó thành nullable, nên null là giá trị hợp lệ.' },
            { content: 'Biến name bắt buộc phải gán giá trị ngay khi khai báo', explanation: 'Đó là yêu cầu với biến non-nullable không có late; biến nullable mặc định là null.' },
            { content: 'Biến name là hằng số, không gán lại được', explanation: 'Muốn không gán lại thì dùng final hoặc const, dấu ? không liên quan.' },
            { content: 'Kiểu của name sẽ được xác định lúc chạy', explanation: 'Kiểu vẫn là String và được kiểm tra lúc biên dịch; ? chỉ cho phép thêm giá trị null.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Màn hình nhập khoản chi có ô số tiền thay đổi theo thao tác người dùng. Nên dùng loại widget nào?',
          relatedLecture: 3,
          options: [
            { content: 'StatefulWidget, gọi setState khi giá trị thay đổi', correct: true, explanation: 'StatefulWidget giữ state riêng và setState báo Flutter dựng lại phần giao diện đó.' },
            { content: 'StatelessWidget, gán lại biến trực tiếp', explanation: 'StatelessWidget không có state; gán lại biến không làm giao diện dựng lại.' },
            { content: 'Một const widget để tối ưu hiệu năng', explanation: 'Widget const không bao giờ thay đổi sau khi tạo, không phù hợp với dữ liệu nhập liệu.' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Những phát biểu nào đúng về Expanded?',
          relatedLecture: 4,
          options: [
            { content: 'Expanded phải là con trực tiếp của Row, Column hoặc Flex', correct: true, explanation: 'Expanded chỉ hoạt động trong widget Flex; đặt chỗ khác sẽ báo lỗi ParentDataWidget.' },
            { content: 'Expanded chia phần không gian còn trống theo hệ số flex', correct: true, explanation: 'Các Expanded cùng cấp chia phần dư theo tỉ lệ flex, mặc định là 1.' },
            { content: 'Expanded dùng trong Stack để căn giữa widget con', explanation: 'Trong Stack dùng Positioned hoặc Align; Expanded không hợp lệ ở đó.' },
            { content: 'Expanded tự làm nội dung cuộn được khi bị tràn', explanation: 'Muốn cuộn phải dùng ListView hoặc SingleChildScrollView; Expanded chỉ phân chia kích thước.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Vì sao nên dùng ListView.builder thay vì ListView(children: ...) cho danh sách 1.000 giao dịch?',
          relatedLecture: 5,
          options: [
            { content: 'Nó chỉ dựng widget cho những mục sắp hiển thị trên màn hình', correct: true, explanation: 'builder tạo item theo nhu cầu khi cuộn, nên không phải dựng sẵn cả 1.000 widget.' },
            { content: 'Nó tự sắp xếp các mục theo thứ tự thời gian', explanation: 'ListView.builder không sắp xếp; thứ tự do dữ liệu bạn truyền vào quyết định.' },
            { content: 'ListView thường không cuộn được khi có hơn 100 mục', explanation: 'ListView thường vẫn cuộn được, chỉ là tốn bộ nhớ vì dựng mọi phần tử ngay từ đầu.' },
            { content: 'Nó tự lưu danh sách vào bộ nhớ máy', explanation: 'ListView chỉ hiển thị; lưu trữ là việc của tầng dữ liệu.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Trong FutureBuilder, snapshot.connectionState == ConnectionState.waiting cho biết điều gì?',
          relatedLecture: 8,
          options: [
            { content: 'Future đang chạy và chưa có kết quả', correct: true, explanation: 'Đây là lúc nên hiển thị vòng xoay tải dữ liệu.' },
            { content: 'Future đã thất bại', explanation: 'Lỗi được báo qua snapshot.hasError khi trạng thái là done.' },
            { content: 'Future đã xong nhưng trả về null', explanation: 'Khi đã xong thì trạng thái là done, dù dữ liệu có null hay không.' },
            { content: 'Widget đã bị gỡ khỏi cây', explanation: 'connectionState mô tả Future, không mô tả vòng đời của widget.' },
          ],
        },
      ],
    },
  },
  {
    instructorEmail: 'linh.vu@skillpath.test',
    categorySlug: 'mobile-apps',
    topics: [{ slug: 'react-native', primary: true }, { slug: 'javascript' }, { slug: 'mobile-development' }],
    language: 'vi',
    level: 'intermediate',
    priceAmount: 499_000,
    status: 'published',
    title: 'React Native: từ ý tưởng đến App Store',
    subtitle: 'Dựng ứng dụng quản lý chi tiêu bằng React Native và Expo, build bản release sẵn sàng nộp lên store',
    description:
      'Nếu bạn đã quen React trên web, React Native cho phép dùng lại phần lớn tư duy đó để làm ứng dụng di động thật, không phải trang web bọc trong khung app. Nhưng chuyển sang di động có những chỗ khác hẳn: không có thẻ div hay CSS đầy đủ, danh sách dài dễ giật, điều hướng hoạt động theo ngăn xếp màn hình, mạng chập chờn, và cuối cùng là cả một quy trình build, ký ứng dụng rồi nộp lên store. Khoá học này đi qua đúng những điểm đó.\n\n' +
      'Dự án xuyên suốt là một ứng dụng quản lý chi tiêu cá nhân: nhập khoản chi, xem lịch sử theo ngày, thống kê theo danh mục và lưu dữ liệu ngay trên máy để dùng khi không có mạng. Bạn bắt đầu bằng Expo để chạy app lên điện thoại thật trong vài phút, sau đó lần lượt thêm giao diện, điều hướng, lưu trữ và gọi API.\n\n' +
      'Sau khoá học, bạn có thể:\n' +
      '• Dựng giao diện bằng View, Text, Pressable, StyleSheet và Flexbox theo cách của React Native\n' +
      '• Làm danh sách hàng nghìn dòng cuộn mượt với FlatList, SectionList và các kỹ thuật tối ưu render\n' +
      '• Tổ chức điều hướng nhiều màn hình bằng React Navigation với stack và bottom tabs\n' +
      '• Lưu dữ liệu cục bộ, gọi API và xử lý trạng thái mất mạng một cách tử tế\n' +
      '• Cấu hình icon, splash screen, quyền truy cập và build bản release bằng EAS\n\n' +
      'Khoá học có một bài code chạy trực tiếp trên nền tảng: bạn viết hàm chuẩn bị dữ liệu cho SectionList từ danh sách giao dịch thô, đúng việc phải làm trong màn hình lịch sử của app. Mỗi chương đều có phần giải thích lỗi thường gặp trên thiết bị thật, thứ mà máy ảo hay che mất. Phần phát hành được trình bày theo từng bước có checklist để bạn tự áp dụng cho ứng dụng của mình.',
    learningObjectives: [
      'Dựng giao diện di động bằng core component và Flexbox, giải thích được khác biệt so với CSS trên web',
      'Tối ưu FlatList và SectionList bằng keyExtractor, getItemLayout và React.memo cho danh sách dài',
      'Tổ chức điều hướng stack và bottom tabs, truyền và đọc params giữa các màn hình',
      'Lưu dữ liệu cục bộ với AsyncStorage và đồng bộ lại khi thiết bị có mạng',
      'Build bản release bằng EAS và chuẩn bị đủ icon, splash, mô tả quyền trước khi nộp lên store',
    ],
    requirements: [
      'Đã dùng React với function component và Hooks (useState, useEffect)',
      'Nắm JavaScript ES6+: arrow function, destructuring, async/await',
      'Có một điện thoại Android hoặc iOS để chạy thử ứng dụng',
    ],
    targetAudience: [
      'Lập trình viên React muốn chuyển sang làm ứng dụng di động',
      'Người đã học React Native qua video ngắn và muốn làm trọn một app đến lúc phát hành',
    ],
    thumbnail: { label: 'React Native', tagline: 'Từ ý tưởng đến store' },
    sections: [
      {
        title: 'Khởi động dự án',
        lectures: [
          'Giới thiệu khoá học và ứng dụng quản lý chi tiêu cuối khoá',
          'Khởi tạo dự án với Expo, chạy trên máy ảo và điện thoại thật',
        ],
      },
      {
        title: 'Giao diện và danh sách',
        lectures: [
          'Core component: View, Text, Pressable và StyleSheet',
          'Flexbox trong React Native khác gì trên web',
          'FlatList và SectionList: keyExtractor, getItemLayout và hiệu năng',
        ],
      },
      {
        title: 'Điều hướng và dữ liệu',
        lectures: [
          'React Navigation: stack, bottom tabs và truyền params',
          'Lưu dữ liệu cục bộ với AsyncStorage và đồng bộ khi có mạng',
          'Gọi API, xử lý loading và lỗi mạng trên thiết bị di động',
        ],
      },
      {
        title: 'Hoàn thiện và phát hành',
        lectures: [
          'Icon, splash screen và khai báo quyền truy cập',
          'Build bản release với EAS và chuẩn bị hồ sơ nộp lên store',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: giao diện, danh sách và điều hướng',
      description: 'Ôn lại Flexbox, tối ưu danh sách, React Navigation và lưu trữ cục bộ.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Giá trị mặc định của flexDirection trong React Native là gì?',
          relatedLecture: 3,
          options: [
            { content: 'column', correct: true, explanation: 'React Native xếp phần tử con theo chiều dọc mặc định, phù hợp với màn hình điện thoại.' },
            { content: 'row', explanation: 'row là mặc định của CSS trên web, không phải của React Native.' },
            { content: 'row-reverse', explanation: 'row-reverse phải khai báo rõ, không bao giờ là mặc định.' },
            { content: 'Không có mặc định, phải luôn khai báo', explanation: 'Mọi View đều dùng Flexbox với flexDirection mặc định là column.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Vì sao keyExtractor của FlatList nên trả về id ổn định của dữ liệu thay vì index?',
          relatedLecture: 4,
          options: [
            { content: 'Để React nhận đúng item khi thêm, xoá hoặc sắp xếp lại danh sách', correct: true, explanation: 'Key ổn định giúp React giữ đúng state và chỉ render lại item thật sự thay đổi.' },
            { content: 'Vì FlatList sắp xếp item theo key', explanation: 'FlatList giữ nguyên thứ tự của mảng data, key không quyết định thứ tự.' },
            { content: 'Vì thiếu keyExtractor thì danh sách không cuộn được', explanation: 'Danh sách vẫn cuộn; thiếu key chỉ gây cảnh báo và render lại kém hiệu quả.' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Cách nào giúp FlatList với hàng nghìn dòng cuộn mượt hơn?',
          relatedLecture: 4,
          options: [
            { content: 'Khai báo getItemLayout khi các dòng có chiều cao cố định', correct: true, explanation: 'FlatList biết trước vị trí từng dòng nên không phải đo lại khi cuộn hoặc nhảy tới vị trí xa.' },
            { content: 'Bọc component của từng dòng bằng React.memo', correct: true, explanation: 'Dòng có props không đổi sẽ không render lại khi danh sách cập nhật.' },
            { content: 'Đặt FlatList bên trong một ScrollView cùng chiều', explanation: 'Làm vậy FlatList mất cơ chế ảo hoá và phải render toàn bộ dòng.' },
            { content: 'Dùng index làm key để đỡ phải tính id', explanation: 'Key theo index khiến item bị nhận nhầm khi danh sách thay đổi, gây render thừa.' },
          ],
        },
        {
          type: 'single_choice',
          stem: "Màn hình danh sách gọi navigation.navigate('Detail', { id: 42 }). Màn Detail đọc id ở đâu?",
          relatedLecture: 5,
          options: [
            { content: 'route.params.id', correct: true, explanation: 'React Navigation truyền params qua prop route hoặc hook useRoute.' },
            { content: 'navigation.params.id', explanation: 'Đối tượng navigation dùng để điều hướng, không chứa params của màn hiện tại.' },
            { content: 'props.id', explanation: 'Params không được trải thẳng thành props của component màn hình.' },
            { content: 'Biến toàn cục do navigate tự tạo', explanation: 'navigate không tạo biến toàn cục; dữ liệu chỉ đi qua route.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Muốn lưu một mảng giao dịch bằng AsyncStorage thì phải làm gì?',
          relatedLecture: 6,
          options: [
            { content: 'Chuyển mảng thành chuỗi bằng JSON.stringify trước khi setItem', correct: true, explanation: 'AsyncStorage chỉ lưu chuỗi; khi đọc ra cần JSON.parse lại.' },
            { content: 'Truyền thẳng mảng vào setItem', explanation: 'setItem nhận giá trị kiểu chuỗi, mảng sẽ không được lưu đúng.' },
            { content: 'Mã hoá mảng vì AsyncStorage chỉ nhận dữ liệu đã mã hoá', explanation: 'AsyncStorage không yêu cầu và cũng không tự mã hoá; dữ liệu nhạy cảm nên dùng kho bảo mật riêng.' },
          ],
        },
      ],
    },
    exercise: {
      title: 'Chuẩn bị dữ liệu cho SectionList lịch sử chi tiêu',
      learningObjective: 'Biến danh sách giao dịch thô thành các section theo ngày để hiển thị bằng SectionList',
      instructions:
        'Màn hình lịch sử của ứng dụng chi tiêu dùng SectionList, mỗi section là một ngày. Hãy viết chương trình gom giao dịch theo ngày.\n\n' +
        'Input (stdin): dòng đầu là số n (0 ≤ n ≤ 1000). n dòng tiếp theo, mỗi dòng có dạng "<YYYY-MM-DD> <HH:MM> <số tiền> <ghi chú>", các trường cách nhau bởi dấu cách, ghi chú có thể chứa dấu cách.\n\n' +
        'Output (stdout):\n' +
        '• Các ngày xếp từ mới nhất đến cũ nhất. Mỗi ngày in một dòng tiêu đề "<ngày> (<số giao dịch> giao dịch, tổng <tổng tiền>)".\n' +
        '• Ngay sau tiêu đề là từng giao dịch trong ngày, mỗi dòng "- <HH:MM> <ghi chú>: <số tiền>", xếp theo giờ tăng dần; cùng giờ thì giữ thứ tự xuất hiện trong input.\n' +
        '• Nếu n = 0, in đúng một dòng "Chưa có giao dịch".\n\n' +
        'Ví dụ input:\n' +
        '3\n2026-10-30 12:10 45000 Cơm trưa\n2026-10-31 08:15 35000 Cà phê\n2026-10-30 07:30 20000 Gửi xe\n\n' +
        'Ví dụ output:\n' +
        '2026-10-31 (1 giao dịch, tổng 35000)\n- 08:15 Cà phê: 35000\n2026-10-30 (2 giao dịch, tổng 65000)\n- 07:30 Gửi xe: 20000\n- 12:10 Cơm trưa: 45000',
      hints: [
        'Dùng Map với khoá là ngày để gom giao dịch trong một lần duyệt',
        'Chuỗi ngày dạng YYYY-MM-DD và giờ dạng HH:MM so sánh theo thứ tự chuỗi là đúng thứ tự thời gian',
        'Array.prototype.sort trong Node là sort ổn định, nên giao dịch cùng giờ tự giữ thứ tự ban đầu',
      ],
      solutionExplanation:
        'Duyệt từng dòng, tách ngày, giờ, số tiền và phần ghi chú còn lại, rồi đẩy vào Map theo ngày. Sau đó lấy danh sách ngày, sắp xếp giảm dần bằng so sánh chuỗi. Với mỗi ngày, sắp xếp giao dịch theo giờ (sort ổn định giữ thứ tự khi trùng giờ), cộng tổng tiền và in tiêu đề rồi từng dòng. Độ phức tạp O(n log n), đúng như khi chuẩn bị mảng sections cho SectionList trong app.',
      difficulty: 'medium',
      relatedLecture: 4,
      code: [
        {
          language: 'javascript',
          starter:
            "const input = require('fs').readFileSync(0, 'utf8');\n\n" +
            '// lines: mảng chuỗi "<YYYY-MM-DD> <HH:MM> <số tiền> <ghi chú>"\n' +
            '// Trả về mảng các dòng cần in ra\n' +
            'function buildSections(lines) {\n' +
            '  // TODO: gom giao dịch theo ngày\n' +
            '  return [];\n' +
            '}\n\n' +
            "const rows = input.split('\\n').map((l) => l.trim()).filter(Boolean);\n" +
            'const n = Number(rows[0] || 0);\n' +
            "console.log(buildSections(rows.slice(1, 1 + n)).join('\\n'));\n",
          solution:
            "const input = require('fs').readFileSync(0, 'utf8');\n\n" +
            'function buildSections(lines) {\n' +
            "  if (lines.length === 0) return ['Chưa có giao dịch'];\n" +
            '  const byDate = new Map();\n' +
            '  for (const line of lines) {\n' +
            '    const [date, time, amount, ...note] = line.split(/\\s+/);\n' +
            '    if (!byDate.has(date)) byDate.set(date, []);\n' +
            "    byDate.get(date).push({ time, amount: Number(amount), note: note.join(' ') });\n" +
            '  }\n' +
            '  const out = [];\n' +
            '  const dates = [...byDate.keys()].sort().reverse();\n' +
            '  for (const date of dates) {\n' +
            '    const items = byDate.get(date).sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));\n' +
            '    const total = items.reduce((sum, t) => sum + t.amount, 0);\n' +
            "    out.push(date + ' (' + items.length + ' giao dịch, tổng ' + total + ')');\n" +
            "    for (const t of items) out.push('- ' + t.time + ' ' + t.note + ': ' + t.amount);\n" +
            '  }\n' +
            '  return out;\n' +
            '}\n\n' +
            "const rows = input.split('\\n').map((l) => l.trim()).filter(Boolean);\n" +
            'const n = Number(rows[0] || 0);\n' +
            "console.log(buildSections(rows.slice(1, 1 + n)).join('\\n'));\n",
        },
      ],
      tests: [
        {
          input: '4\n2026-10-30 12:10 45000 Cơm trưa\n2026-10-31 08:15 35000 Cà phê\n2026-10-30 07:30 20000 Gửi xe\n2026-10-31 19:00 150000 Đi chợ\n',
          expectedOutput:
            '2026-10-31 (2 giao dịch, tổng 185000)\n- 08:15 Cà phê: 35000\n- 19:00 Đi chợ: 150000\n2026-10-30 (2 giao dịch, tổng 65000)\n- 07:30 Gửi xe: 20000\n- 12:10 Cơm trưa: 45000',
          isPublic: true,
        },
        { input: '0\n', expectedOutput: 'Chưa có giao dịch', isPublic: true },
        {
          input: '3\n2026-11-01 09:00 25000 Bánh mì\n2026-11-01 09:00 30000 Trà sữa\n2026-11-01 08:00 12000 Nước suối\n',
          expectedOutput: '2026-11-01 (3 giao dịch, tổng 67000)\n- 08:00 Nước suối: 12000\n- 09:00 Bánh mì: 25000\n- 09:00 Trà sữa: 30000',
          isPublic: false,
        },
        {
          input:
            '5\n2025-12-31 23:30 99000 Tiệc cuối năm\n2026-01-02 10:00 50000 Sách\n2026-01-01 00:15 20000 Taxi về nhà\n2026-01-02 08:45 18000 Phở\n2025-12-31 18:00 120000 Mua quà\n',
          expectedOutput:
            '2026-01-02 (2 giao dịch, tổng 68000)\n- 08:45 Phở: 18000\n- 10:00 Sách: 50000\n2026-01-01 (1 giao dịch, tổng 20000)\n- 00:15 Taxi về nhà: 20000\n2025-12-31 (2 giao dịch, tổng 219000)\n- 18:00 Mua quà: 120000\n- 23:30 Tiệc cuối năm: 99000',
          isPublic: false,
        },
      ],
    },
  },
  {
    instructorEmail: 'linh.vu@skillpath.test',
    categorySlug: 'mobile-apps',
    topics: [{ slug: 'android-development', primary: true }, { slug: 'kotlin' }],
    language: 'vi',
    level: 'beginner',
    priceAmount: 0,
    status: 'published',
    title: 'Android hiện đại với Kotlin và Jetpack Compose',
    subtitle: 'Viết ứng dụng ghi chú Android đầu tiên bằng Kotlin, Jetpack Compose, ViewModel và Room',
    description:
      'Nhiều tài liệu Android trên mạng vẫn dạy XML layout, AsyncTask và những cách làm đã cũ, khiến người mới học xong rồi vẫn bỡ ngỡ khi mở một dự án Android hiện nay. Khoá học này đi thẳng vào bộ công cụ mà các dự án mới đang dùng: Kotlin, Jetpack Compose để dựng giao diện, ViewModel để giữ state và Room để lưu dữ liệu trên máy.\n\n' +
      'Bạn sẽ xây một ứng dụng ghi chú hoàn chỉnh từ đầu: tạo, sửa, xoá ghi chú, đánh dấu ghi chú quan trọng và giữ nguyên dữ liệu sau khi tắt app. Mỗi bài thêm một phần nhỏ vào ứng dụng, nên đến cuối khoá bạn có một sản phẩm chạy được trên điện thoại thật và hiểu vì sao code được tổ chức như vậy.\n\n' +
      'Sau khoá học, bạn có thể:\n' +
      '• Viết Kotlin căn bản: val/var, kiểu nullable, data class, collection và lambda\n' +
      '• Dựng giao diện bằng composable function, Modifier và xem trước bằng Preview\n' +
      '• Hiểu state và recomposition để giao diện luôn khớp với dữ liệu\n' +
      '• Hiển thị danh sách bằng LazyColumn và tách logic vào ViewModel theo hướng MVVM\n' +
      '• Lưu và đọc dữ liệu bằng Room, quan sát thay đổi qua Flow\n\n' +
      'Khoá học miễn phí và dành cho người mới với Android. Phần Kotlin được dạy vừa đủ để viết ứng dụng, không sa vào lý thuyết ngôn ngữ. Mỗi chương có phần "lỗi hay gặp" tổng hợp những thông báo lỗi mà người mới thường thấy trong Android Studio và cách đọc chúng. Cuối khoá có bài kiểm tra 5 câu để bạn tự đánh giá trước khi chuyển sang các chủ đề nâng cao như gọi API hay dependency injection.',
    learningObjectives: [
      'Viết code Kotlin với val/var, kiểu nullable, toán tử ?. và ?:, data class và lambda',
      'Dựng màn hình bằng composable function, Modifier và kiểm tra nhanh bằng Preview',
      'Quản lý state với remember, mutableStateOf và giải thích được khi nào xảy ra recomposition',
      'Hiển thị danh sách ghi chú bằng LazyColumn và tách logic sang ViewModel với StateFlow',
      'Lưu, sửa, xoá ghi chú bằng Room Database và cập nhật giao diện qua Flow',
    ],
    requirements: [
      'Biết cơ bản một ngôn ngữ lập trình bất kỳ',
      'Máy tính chạy được Android Studio, khuyến nghị 16 GB RAM',
    ],
    targetAudience: [
      'Người mới muốn bắt đầu lập trình Android theo cách hiện đại',
      'Sinh viên cần làm đồ án ứng dụng Android',
    ],
    thumbnail: { label: 'Kotlin', tagline: 'Android với Compose' },
    sections: [
      {
        title: 'Bắt đầu với Android',
        lectures: [
          'Giới thiệu khoá học và ứng dụng ghi chú sẽ xây',
          'Cài Android Studio, tạo máy ảo và chạy dự án đầu tiên',
        ],
      },
      {
        title: 'Kotlin vừa đủ dùng',
        lectures: [
          'val, var, kiểu nullable và toán tử ?. với ?:',
          'Data class, collection và lambda: map, filter, sortedBy',
        ],
      },
      {
        title: 'Giao diện với Jetpack Compose',
        lectures: [
          'Composable function, Modifier và Preview',
          'State trong Compose: remember, mutableStateOf và recomposition',
          'LazyColumn: hiển thị danh sách ghi chú',
        ],
      },
      {
        title: 'Kiến trúc và lưu trữ',
        lectures: [
          'ViewModel và StateFlow theo hướng MVVM',
          'Lưu ghi chú bằng Room: Entity, DAO và Database',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: Kotlin và Jetpack Compose cơ bản',
      description: 'Ôn lại null safety, data class, state trong Compose, LazyColumn và Room.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Với val title: String? = null, biểu thức title?.length ?: 0 trả về gì?',
          relatedLecture: 2,
          options: [
            { content: '0', correct: true, explanation: 'title?.length trả về null vì title là null, nên toán tử ?: lấy giá trị dự phòng 0.' },
            { content: 'null', explanation: 'Toán tử Elvis ?: đã thay null bằng 0.' },
            { content: 'Ném NullPointerException', explanation: 'Gọi an toàn ?. không ném lỗi khi gặp null; chỉ !! mới ném.' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Khi khai báo data class Note(val id: Int, val title: String), Kotlin tự sinh những gì?',
          relatedLecture: 3,
          options: [
            { content: 'equals() và hashCode() dựa trên các thuộc tính', correct: true, explanation: 'Hai Note có cùng id và title được coi là bằng nhau.' },
            { content: 'toString() dạng Note(id=1, title=...)', correct: true, explanation: 'Rất tiện khi in log để gỡ lỗi.' },
            { content: 'Hàm copy() để tạo bản sao có thay đổi một vài thuộc tính', correct: true, explanation: 'copy giúp cập nhật dữ liệu bất biến, ví dụ note.copy(title = "Mới").' },
            { content: 'Bảng lưu trữ tương ứng trong cơ sở dữ liệu', explanation: 'Muốn thành bảng phải dùng Room với annotation @Entity, data class không tự làm.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Ô nhập liệu dùng remember { mutableStateOf("") } bị mất nội dung khi xoay màn hình. Cách sửa phù hợp là gì?',
          relatedLecture: 5,
          options: [
            { content: 'Dùng rememberSaveable hoặc đưa state vào ViewModel', correct: true, explanation: 'Xoay màn hình tạo lại Activity; rememberSaveable và ViewModel giữ được giá trị qua lần tạo lại đó.' },
            { content: 'Khai báo state là biến toàn cục', explanation: 'Biến toàn cục không kích hoạt recomposition và dễ gây lỗi rò rỉ dữ liệu giữa các màn hình.' },
            { content: 'Khoá màn hình ở chế độ dọc', explanation: 'Chỉ né triệu chứng; state vẫn mất khi đổi ngôn ngữ hay chế độ tối.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'LazyColumn khác Column ở điểm nào?',
          relatedLecture: 6,
          options: [
            { content: 'Chỉ compose các item đang hoặc sắp hiển thị trên màn hình', correct: true, explanation: 'Nhờ vậy danh sách dài không tốn bộ nhớ và thời gian dựng tất cả item.' },
            { content: 'Tự sắp xếp item theo bảng chữ cái', explanation: 'LazyColumn hiển thị theo thứ tự dữ liệu bạn truyền vào.' },
            { content: 'Chỉ chứa được tối đa 100 item', explanation: 'LazyColumn không giới hạn số item, đó chính là mục đích của nó.' },
            { content: 'Không dùng được Modifier', explanation: 'LazyColumn nhận Modifier như mọi composable khác.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Trong Room, interface đánh dấu @Dao dùng để làm gì?',
          relatedLecture: 8,
          options: [
            { content: 'Khai báo các hàm truy vấn, thêm, sửa, xoá dữ liệu', correct: true, explanation: 'Room sinh code thực thi cho các hàm @Query, @Insert, @Update, @Delete trong DAO.' },
            { content: 'Mô tả cấu trúc một bảng', explanation: 'Cấu trúc bảng khai báo bằng @Entity trên data class.' },
            { content: 'Tạo kết nối mạng tới server', explanation: 'Room chỉ làm việc với SQLite trên máy, không gọi mạng.' },
          ],
        },
      ],
    },
  },
  {
    instructorEmail: 'son.phan@skillpath.test',
    categorySlug: 'mobile-apps',
    topics: [{ slug: 'ios-development', primary: true }, { slug: 'swift' }, { slug: 'swiftui' }],
    language: 'vi',
    level: 'beginner',
    priceAmount: 0,
    status: 'published',
    title: 'Lập trình iOS với Swift & SwiftUI',
    subtitle: 'Học Swift từ đầu và tự làm ứng dụng theo dõi thói quen hằng ngày bằng SwiftUI trên iPhone',
    description:
      'Muốn học lập trình iOS nhưng ngại vì nghĩ phải biết Objective-C hay UIKit với hàng trăm dòng code cho một màn hình? Với Swift và SwiftUI, bạn mô tả giao diện bằng code ngắn gọn, xem kết quả ngay trong Xcode Preview và tập trung vào logic của ứng dụng. Khoá học này dẫn bạn đi từ những dòng Swift đầu tiên đến một ứng dụng hoàn chỉnh chạy trên iPhone.\n\n' +
      'Dự án xuyên suốt là ứng dụng theo dõi thói quen: thêm thói quen mới, đánh dấu đã làm trong ngày, xem chuỗi ngày liên tiếp và lưu dữ liệu lại sau khi tắt app. Mỗi khái niệm được giới thiệu đúng lúc ứng dụng cần đến nó, nên bạn không phải học lý thuyết suông rồi mới được viết code.\n\n' +
      'Học xong khoá, bạn có thể:\n' +
      '• Viết Swift với let/var, optional, struct, enum và protocol\n' +
      '• Dựng giao diện bằng VStack, HStack, ZStack và modifier, hiểu vì sao thứ tự modifier quan trọng\n' +
      '• Truyền dữ liệu giữa các view bằng @State, @Binding và @Observable\n' +
      '• Làm danh sách và điều hướng bằng List, ForEach và NavigationStack\n' +
      '• Lưu dữ liệu đơn giản với Codable và UserDefaults\n\n' +
      'Khoá học miễn phí, dành cho người mới với iOS. Bạn cần một máy Mac để cài Xcode, còn iPhone thật là không bắt buộc vì mọi bài đều chạy được trên Simulator. Giảng viên giải thích kỹ các thông báo lỗi biên dịch thường gặp của Swift, vì đây là chỗ người mới hay bỏ cuộc nhất. Cuối khoá có bài kiểm tra 5 câu giúp bạn tự rà lại kiến thức trước khi làm ứng dụng của riêng mình.',
    learningObjectives: [
      'Viết Swift dùng optional an toàn với if let và guard let, phân biệt struct và class',
      'Dựng giao diện bằng VStack, HStack, ZStack và sắp xếp modifier đúng thứ tự',
      'Truyền và cập nhật dữ liệu giữa các view bằng @State, @Binding và @Observable',
      'Xây màn hình danh sách và chi tiết với List, ForEach và NavigationStack',
      'Lưu và khôi phục dữ liệu ứng dụng bằng Codable và UserDefaults',
    ],
    requirements: [
      'Có máy Mac cài được phiên bản Xcode mới',
      'Không cần biết trước Swift, chỉ cần quen thao tác cơ bản trên máy tính',
    ],
    targetAudience: [
      'Người mới muốn làm ứng dụng iPhone đầu tiên',
      'Lập trình viên ngôn ngữ khác muốn tìm hiểu hệ sinh thái iOS',
    ],
    thumbnail: { label: 'SwiftUI', tagline: 'Ứng dụng iOS đầu tiên' },
    sections: [
      {
        title: 'Làm quen với Xcode',
        lectures: [
          'Giới thiệu khoá học và ứng dụng theo dõi thói quen',
          'Cài Xcode, tạo dự án SwiftUI và chạy trên Simulator',
        ],
      },
      {
        title: 'Swift căn bản',
        lectures: [
          'let, var, optional và unwrap an toàn với if let, guard let',
          'Struct, enum và protocol trong Swift',
        ],
      },
      {
        title: 'Giao diện với SwiftUI',
        lectures: [
          'View và modifier: bố cục với VStack, HStack, ZStack',
          '@State và @Binding: luồng dữ liệu giữa các view',
          'List, ForEach và NavigationStack',
        ],
      },
      {
        title: 'Dữ liệu và hoàn thiện ứng dụng',
        lectures: [
          '@Observable: tách logic khỏi view',
          'Lưu thói quen với Codable và UserDefaults',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: Swift và SwiftUI cơ bản',
      description: 'Ôn lại optional, struct, modifier, luồng dữ liệu và danh sách trong SwiftUI.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Điểm khác biệt chính giữa guard let và if let là gì?',
          relatedLecture: 2,
          options: [
            { content: 'Biến unwrap bằng guard let dùng được ở phần còn lại của hàm', correct: true, explanation: 'guard bắt buộc thoát sớm khi nil, nên sau đó biến chắc chắn có giá trị trong toàn bộ phạm vi phía dưới.' },
            { content: 'guard let không cần nhánh else', explanation: 'guard luôn phải có else và nhánh đó phải thoát khỏi phạm vi bằng return, throw hoặc tương tự.' },
            { content: 'if let nhanh hơn guard let khi chạy', explanation: 'Hai cách khác nhau về luồng điều khiển, không phải về tốc độ.' },
            { content: 'guard let tự gán giá trị mặc định khi nil', explanation: 'Gán giá trị mặc định là việc của toán tử ??, không phải guard.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'var b = a, trong đó a là một struct. Sau đó sửa b.name. Điều gì xảy ra với a?',
          relatedLecture: 3,
          options: [
            { content: 'a không đổi vì struct là value type, phép gán tạo bản sao', correct: true, explanation: 'Mỗi biến struct giữ bản dữ liệu riêng, sửa bản này không ảnh hưởng bản kia.' },
            { content: 'a.name đổi theo vì a và b trỏ cùng một đối tượng', explanation: 'Đó là hành vi của class (reference type), không phải struct.' },
            { content: 'Lỗi biên dịch vì struct không sửa được thuộc tính', explanation: 'Thuộc tính var của struct sửa được khi biến chứa nó là var.' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Những phát biểu nào đúng về modifier trong SwiftUI?',
          relatedLecture: 4,
          options: [
            { content: 'Thứ tự modifier ảnh hưởng đến kết quả hiển thị', correct: true, explanation: '.padding().background(.blue) tô màu cả phần đệm, còn .background(.blue).padding() thì không.' },
            { content: 'Mỗi modifier trả về một view mới bọc view trước đó', correct: true, explanation: 'Vì vậy chuỗi modifier tạo thành nhiều lớp view lồng nhau theo thứ tự gọi.' },
            { content: 'Modifier sửa trực tiếp thuộc tính của view gốc', explanation: 'View trong SwiftUI là struct bất biến; modifier tạo view mới chứ không sửa view cũ.' },
            { content: '.frame bắt buộc phải đặt trước .padding', explanation: 'Không có quy tắc bắt buộc; thứ tự tuỳ kết quả bạn muốn.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'View con cần bật tắt một giá trị @State nằm ở view cha. Nên truyền xuống thế nào?',
          relatedLecture: 5,
          options: [
            { content: 'Khai báo @Binding ở view con và truyền $isDone từ view cha', correct: true, explanation: 'Binding cho phép view con đọc và ghi lại vào state gốc của view cha.' },
            { content: 'Khai báo thêm một @State cùng tên ở view con', explanation: 'Như vậy view con có bản state riêng, thay đổi không đến được view cha.' },
            { content: 'Truyền giá trị Bool thường rồi gán lại', explanation: 'Tham số thường là bản sao chỉ đọc, gán lại không ảnh hưởng view cha.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'ForEach(habits) báo lỗi biên dịch. Dữ liệu habits cần thoả điều kiện gì?',
          relatedLecture: 6,
          options: [
            { content: 'Phần tử tuân theo Identifiable, hoặc truyền thêm tham số id:', correct: true, explanation: 'SwiftUI cần định danh ổn định để biết phần tử nào thêm, xoá hay di chuyển.' },
            { content: 'habits phải là mảng String', explanation: 'ForEach nhận mọi kiểu dữ liệu, miễn là xác định được id cho từng phần tử.' },
            { content: 'habits phải được đánh dấu @State', explanation: '@State liên quan đến việc lưu state, không phải điều kiện để ForEach chạy.' },
            { content: 'habits phải có ít nhất một phần tử', explanation: 'ForEach với mảng rỗng vẫn hợp lệ, chỉ là không hiển thị gì.' },
          ],
        },
      ],
    },
  },
  {
    instructorEmail: 'son.phan@skillpath.test',
    categorySlug: 'mobile-apps',
    topics: [{ slug: 'kotlin', primary: true }, { slug: 'java' }],
    language: 'vi',
    level: 'intermediate',
    priceAmount: 0,
    status: 'draft',
    title: 'Kotlin cho lập trình viên Java',
    subtitle: 'Chuyển từ Java sang Kotlin trong dự án thật: null safety, coroutine và chạy chung với code Java cũ',
    description:
      'Bạn đã viết Java nhiều năm, quen với getter, setter, NullPointerException và những khối code lặp đi lặp lại. Dự án mới yêu cầu Kotlin, hoặc nhóm muốn dần chuyển code Android hay backend sang Kotlin nhưng không thể viết lại từ đầu. Khoá học này dành cho đúng tình huống đó: học Kotlin bằng cách so sánh trực tiếp với Java bạn đã biết, rồi áp dụng vào một codebase đang chạy.\n\n' +
      'Thay vì bắt đầu lại từ biến và vòng lặp, mỗi bài đặt một đoạn Java quen thuộc cạnh phiên bản Kotlin tương ứng và phân tích chỗ khác biệt: vì sao Kotlin bắt bạn xử lý null ngay lúc biên dịch, data class thay được bao nhiêu boilerplate, khi nào nên dùng sealed class thay cho enum hay hệ thống kế thừa, và coroutine khác thread pool ở điểm nào.\n\n' +
      'Sau khoá học, bạn có thể:\n' +
      '• Viết Kotlin đúng phong cách thay vì "Java viết bằng cú pháp Kotlin"\n' +
      '• Xử lý null an toàn, kể cả platform type khi gọi thư viện Java\n' +
      '• Dùng data class, sealed class, extension function và scope function đúng chỗ\n' +
      '• Viết code bất đồng bộ bằng coroutine với structured concurrency\n' +
      '• Cho Kotlin và Java gọi qua lại trong cùng dự án, chuyển dần từng module mà không làm vỡ build\n\n' +
      'Bài cuối khoá hướng dẫn chuyển một module Java nhỏ sang Kotlin theo từng bước: chạy test trước, chuyển từng file, xử lý cảnh báo của trình chuyển đổi tự động và rà lại những chỗ nó sinh code chưa tự nhiên. Khoá học phù hợp cho cả lập trình viên Android lẫn backend, vì các ví dụ không phụ thuộc vào một framework cụ thể nào.',
    learningObjectives: [
      'Chuyển code Java sang Kotlin đúng phong cách, dùng val, biểu thức when và string template',
      'Xử lý null an toàn với ?., ?:, let và nhận diện rủi ro của platform type khi gọi Java',
      'Thay boilerplate Java bằng data class, sealed class, extension function và scope function',
      'Viết code bất đồng bộ bằng suspend, launch, async và giải thích structured concurrency',
      'Cấu hình Gradle cho dự án trộn Java và Kotlin, dùng @JvmStatic, @JvmOverloads khi Java gọi Kotlin',
    ],
    requirements: [
      'Đã làm việc với Java ít nhất 1 năm: class, interface, generic, collection',
      'Biết dùng Gradle hoặc Maven ở mức chạy build và thêm dependency',
    ],
    targetAudience: [
      'Lập trình viên Java chuẩn bị tham gia dự án Kotlin',
      'Nhóm phát triển muốn chuyển dần codebase Java sang Kotlin',
    ],
    thumbnail: { label: 'Kotlin', tagline: 'Từ Java sang Kotlin' },
    sections: [
      {
        title: 'Từ Java sang Kotlin',
        lectures: [
          'Giới thiệu khoá học: Kotlin giải quyết những điểm khó chịu nào của Java',
          'Cấu hình Gradle cho dự án trộn Java và Kotlin',
        ],
      },
      {
        title: 'Cú pháp và hệ thống kiểu',
        lectures: [
          'Null safety: kiểu nullable, ?., ?: và platform type khi gọi Java',
          'Data class, sealed class và when thay cho switch',
          'Extension function và scope function: let, apply, run, also',
        ],
      },
      {
        title: 'Lập trình hàm và coroutine',
        lectures: [
          'Collection API, Sequence và lambda',
          'Coroutine căn bản: suspend, launch, async và structured concurrency',
        ],
      },
      {
        title: 'Sống chung với code Java',
        lectures: [
          'Interop: @JvmStatic, @JvmOverloads và gọi Kotlin từ Java',
          'Chuyển dần một module Java sang Kotlin an toàn',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: Kotlin dưới góc nhìn Java',
      description: 'Ôn lại null safety, sealed class, scope function, Sequence và interop với Java.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Khi gọi một phương thức Java trả về String, Kotlin hiển thị kiểu String!. Điều đó nghĩa là gì?',
          relatedLecture: 2,
          options: [
            { content: 'Kotlin không biết giá trị có thể null hay không, lập trình viên tự chịu trách nhiệm', correct: true, explanation: 'Đây là platform type; nếu coi nó là String mà Java trả null thì vẫn gặp NullPointerException lúc chạy.' },
            { content: 'Giá trị chắc chắn khác null', explanation: 'Kotlin chỉ chắc chắn khi code Java có annotation như @NonNull; String! nghĩa là không có thông tin đó.' },
            { content: 'Giá trị luôn là null', explanation: 'Dấu ! không nói giá trị là null, chỉ nói khả năng null chưa được xác định.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Lợi ích chính khi dùng sealed class với biểu thức when là gì?',
          relatedLecture: 3,
          options: [
            { content: 'Trình biên dịch kiểm tra when đã xử lý đủ mọi lớp con', correct: true, explanation: 'Thêm một lớp con mới mà quên xử lý thì code không biên dịch được, thay vì lỗi lúc chạy.' },
            { content: 'Sealed class chạy nhanh hơn class thường', explanation: 'Sealed chỉ giới hạn tập lớp con, không thay đổi hiệu năng.' },
            { content: 'Sealed class không cần constructor', explanation: 'Sealed class vẫn có constructor; điểm khác là lớp con phải khai báo cùng package và module.' },
            { content: 'when không cần nhánh nào cả', explanation: 'when vẫn cần nhánh cho từng lớp con, chỉ là không cần else khi đã đủ.' },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Những phát biểu nào đúng về scope function?',
          relatedLecture: 4,
          options: [
            { content: 'apply trả về chính đối tượng, thường dùng để cấu hình đối tượng', correct: true, explanation: 'Bên trong apply, this là đối tượng và kết quả trả về là đối tượng đó.' },
            { content: 'let nhận đối tượng qua it và trả về kết quả của lambda', correct: true, explanation: 'Vì vậy x?.let { ... } hay dùng để xử lý giá trị khác null rồi biến đổi nó.' },
            { content: 'also trả về kết quả của lambda', explanation: 'also trả về chính đối tượng, thường dùng cho tác vụ phụ như ghi log.' },
            { content: 'run chỉ gọi được trên biến nullable', explanation: 'run gọi được trên mọi đối tượng, thậm chí dùng độc lập không cần đối tượng.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Với danh sách 1 triệu phần tử, chuỗi .map { }.filter { }.first() trên Sequence khác List ở điểm nào?',
          relatedLecture: 5,
          options: [
            { content: 'Sequence xử lý lười từng phần tử và dừng khi tìm thấy kết quả', correct: true, explanation: 'Không tạo danh sách trung gian, và first() khiến chuỗi dừng ngay ở phần tử khớp đầu tiên.' },
            { content: 'Sequence chạy song song trên nhiều thread', explanation: 'Sequence vẫn chạy tuần tự trên một thread; song song cần công cụ khác.' },
            { content: 'Không có khác biệt, Kotlin tự tối ưu List', explanation: 'Với List, mỗi bước map và filter tạo ra một danh sách mới trên toàn bộ dữ liệu.' },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Hàm Kotlin fun connect(host: String, port: Int = 443) được gọi từ Java. @JvmOverloads giúp gì?',
          relatedLecture: 7,
          options: [
            { content: 'Sinh thêm các overload để Java gọi được connect(host) mà không truyền port', correct: true, explanation: 'Java không hiểu tham số mặc định, nên cần các phiên bản overload được sinh sẵn.' },
            { content: 'Biến hàm thành static', explanation: 'Đó là việc của @JvmStatic trong companion object.' },
            { content: 'Cho phép Java truyền null vào tham số không null', explanation: 'Annotation này không thay đổi kiểm tra null của tham số.' },
          ],
        },
      ],
    },
  },
];
