import type { SeedCourse } from '../types.ts';

export const COURSES: SeedCourse[] = [
  {
    instructorEmail: 'tram.ngo@skillpath.test',
    categorySlug: 'web-design',
    topics: [{ slug: 'user-interface', primary: true }, { slug: 'css' }],
    language: 'vi',
    level: 'beginner',
    priceAmount: 0,
    status: 'published',
    title: 'Thiết kế giao diện người dùng cho lập trình viên',
    subtitle: 'Tự làm giao diện gọn gàng, dễ đọc bằng CSS mà không cần chờ designer vẽ từng màn hình',
    description:
      'Bạn viết code chạy đúng, API trả dữ liệu đủ, nhưng mỗi lần dựng màn hình lại thấy nó "trông không ổn" mà không biết sửa từ đâu. Chữ to nhỏ lộn xộn, khoảng cách chỗ rộng chỗ hẹp, màu nào cũng muốn nổi bật. Khoá học này dành cho lập trình viên muốn tự tin làm ra giao diện tử tế khi dự án không có designer, hoặc khi cần trao đổi với designer bằng cùng một ngôn ngữ.\n\n' +
      'Thay vì học lý thuyết mỹ thuật, chúng ta đi từ những quy tắc cụ thể có thể áp dụng ngay khi viết CSS. Mỗi bài bắt đầu từ một màn hình "xấu" điển hình, rất hay gặp trong dự án thật, phân tích vì sao nó khó đọc, rồi sửa từng bước:\n' +
      '• Phân cấp thị giác: làm thông tin chính nổi lên bằng độ đậm, màu và vị trí thay vì chỉ tăng cỡ chữ.\n' +
      '• Hệ khoảng cách 4/8px và bố cục bằng CSS Grid, Flexbox để màn hình thẳng hàng, thoáng mắt.\n' +
      '• Thang cỡ chữ, bảng màu HSL, kiểm tra tương phản theo WCAG và tổ chức màu bằng biến CSS để làm chế độ tối.\n' +
      '• Thiết kế nút, ô nhập cùng các trạng thái hover, focus, disabled, rỗng, đang tải và lỗi.\n\n' +
      'Xuyên suốt khoá, bạn sẽ làm lại giao diện một trang quản lý đơn hàng đơn giản: từ bản chỉ có HTML thô đến bản hoàn chỉnh có bảng dữ liệu, bộ lọc, form và chế độ tối. Mỗi chương có bài tập "sửa màn hình" để bạn tự áp dụng trước khi xem lời giải, và có bản so sánh trước, sau để thấy rõ từng quyết định thay đổi điều gì.\n\n' +
      'Khoá không yêu cầu Figma hay năng khiếu vẽ. Mọi thứ đều làm trực tiếp bằng HTML và CSS trong trình duyệt, nên học xong bạn có ngay một bộ quy tắc và một file biến CSS mang sang dự án thật của mình.',
    learningObjectives: [
      'Sắp xếp phân cấp thông tin trên một màn hình bằng cỡ chữ, độ đậm, màu và vị trí',
      'Áp dụng hệ khoảng cách 4/8px và CSS Grid để dựng bố cục thẳng hàng, nhất quán',
      'Xây thang cỡ chữ và bảng màu HSL đạt tương phản tối thiểu 4.5:1 theo WCAG AA',
      'Tổ chức màu và khoảng cách bằng biến CSS, chuyển sang chế độ tối chỉ bằng ghi đè biến',
      'Thiết kế nút và ô nhập có đủ trạng thái hover, focus-visible, disabled và lỗi',
      'Hoàn thiện màn danh sách với trạng thái rỗng, đang tải và báo lỗi rõ ràng',
    ],
    requirements: [
      'Viết được HTML cơ bản và biết dùng selector, thuộc tính CSS thông dụng',
      'Có trình duyệt Chrome hoặc Firefox và một trình soạn code như VS Code',
    ],
    targetAudience: [
      'Lập trình viên frontend, fullstack muốn tự làm giao diện đẹp hơn khi không có designer',
      'Sinh viên IT làm đồ án cần giao diện rõ ràng, chuyên nghiệp',
    ],
    thumbnail: { label: 'UI Design', tagline: 'Giao diện đẹp bằng CSS' },
    sections: [
      {
        title: 'Tư duy thiết kế cho người viết code',
        lectures: [
          'Giới thiệu khoá học và dự án trang quản lý đơn hàng',
          'Phân cấp thị giác: cỡ chữ, độ đậm, màu và vị trí',
        ],
      },
      {
        title: 'Khoảng cách và bố cục',
        lectures: [
          'Hệ khoảng cách 4/8px và nguyên tắc gần nhóm, xa tách',
          'Bố cục trang với CSS Grid và Flexbox',
        ],
      },
      {
        title: 'Chữ và màu sắc',
        lectures: [
          'Chọn font, thang cỡ chữ và line-height dễ đọc',
          'Bảng màu HSL, màu trung tính và tương phản theo WCAG',
          'Biến CSS (custom properties) và chế độ tối',
        ],
      },
      {
        title: 'Thành phần và trạng thái',
        lectures: [
          'Nút và ô nhập: hover, focus-visible, disabled và lỗi',
          'Trạng thái rỗng, đang tải và báo lỗi cho màn danh sách',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: nguyên tắc giao diện cơ bản',
      description: 'Ôn lại phân cấp thị giác, khoảng cách, tương phản màu và trạng thái focus.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Trong một thẻ đơn hàng, tên khách hàng chưa đủ nổi so với các dòng phụ. Cách nào thường hiệu quả nhất mà không làm thẻ rối thêm?',
          relatedLecture: 1,
          options: [
            {
              content: 'Giữ cỡ chữ, làm các dòng phụ nhạt màu hơn và nhẹ hơn',
              correct: true,
              explanation: 'Giảm độ nổi của thông tin phụ tạo ra chênh lệch rõ mà không phải phóng to, thẻ vẫn gọn.',
            },
            {
              content: 'Tăng cỡ chữ cho tất cả các dòng trong thẻ',
              explanation: 'Mọi thứ cùng to lên thì chênh lệch không đổi, tên khách vẫn không nổi hơn.',
            },
            {
              content: 'Viết hoa toàn bộ tên khách hàng và gạch chân',
              explanation: 'Chữ in hoa khó đọc hơn và gạch chân dễ bị hiểu nhầm là liên kết.',
            },
            {
              content: 'Đổi tên khách hàng sang màu đỏ',
              explanation: 'Màu đỏ thường mang nghĩa lỗi hoặc cảnh báo, dùng cho thông tin bình thường sẽ gây hiểu sai.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Theo nguyên tắc gần nhóm, xa tách, khoảng cách giữa label và ô nhập của chính nó nên thế nào so với khoảng cách giữa hai trường trong form?',
          relatedLecture: 2,
          options: [
            {
              content: 'Nhỏ hơn rõ rệt, ví dụ 8px so với 24px',
              correct: true,
              explanation: 'Label đứng sát ô nhập của nó và cách xa trường kế tiếp, nên mắt tự ghép đúng cặp.',
            },
            {
              content: 'Bằng nhau để form trông đều',
              explanation: 'Khoảng cách đều khiến label lơ lửng giữa hai ô, người dùng không biết nó thuộc ô nào.',
            },
            {
              content: 'Lớn hơn để label dễ đọc',
              explanation: 'Khi đó label lại gần trường phía trên hơn, gây ghép nhầm cặp.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Theo WCAG 2.x mức AA, những phát biểu nào đúng về tương phản màu chữ?',
          relatedLecture: 5,
          options: [
            {
              content: 'Chữ cỡ thường cần tỉ lệ tương phản tối thiểu 4.5:1 với nền',
              correct: true,
              explanation: 'Đây là ngưỡng AA cho văn bản thông thường.',
            },
            {
              content: 'Chữ lớn (từ 24px, hoặc từ khoảng 18.66px khi in đậm) chỉ cần tối thiểu 3:1',
              correct: true,
              explanation: 'Chữ lớn dễ đọc hơn nên WCAG cho phép ngưỡng thấp hơn.',
            },
            {
              content: 'Chữ xám #999999 trên nền trắng đạt chuẩn cho đoạn văn',
              explanation: 'Cặp màu này chỉ đạt khoảng 2.85:1, thấp hơn ngưỡng 4.5:1.',
            },
            {
              content: 'Tỉ lệ tương phản chỉ phụ thuộc màu chữ, không phụ thuộc màu nền',
              explanation: 'Tỉ lệ được tính từ độ sáng tương đối của cả màu chữ và màu nền.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Cách nào gọn nhất để thêm chế độ tối khi màu đã được khai báo bằng biến CSS?',
          relatedLecture: 6,
          options: [
            {
              content: 'Khai báo biến trong :root rồi ghi đè giá trị biến trong @media (prefers-color-scheme: dark)',
              correct: true,
              explanation: 'Các component vẫn dùng var(--...) như cũ, chỉ giá trị biến thay đổi theo chế độ.',
            },
            {
              content: 'Viết lại toàn bộ selector của từng component trong một file CSS riêng',
              explanation: 'Làm được nhưng phải bảo trì hai bản CSS, dễ lệch khi thêm component mới.',
            },
            {
              content: 'Dùng filter: invert(1) cho thẻ body',
              explanation: 'Đảo màu làm hỏng ảnh, màu thương hiệu và thường cho tương phản khó chịu.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Vì sao nên dùng :focus-visible thay vì xoá outline bằng outline: none?',
          relatedLecture: 7,
          options: [
            {
              content: 'Trình duyệt chỉ hiện viền focus khi người dùng điều hướng bằng bàn phím, người dùng chuột không bị làm phiền',
              correct: true,
              explanation: 'Người dùng bàn phím vẫn thấy mình đang ở đâu, còn giao diện không hiện viền thừa khi click.',
            },
            {
              content: 'Vì :focus-visible làm trang tải nhanh hơn',
              explanation: 'Pseudo-class này không ảnh hưởng tốc độ tải trang.',
            },
            {
              content: 'Vì outline: none không có tác dụng trên nút bấm',
              explanation: 'outline: none có tác dụng, chính vì vậy nó làm mất dấu focus của người dùng bàn phím.',
            },
          ],
        },
      ],
    },
  },
  {
    instructorEmail: 'tram.ngo@skillpath.test',
    categorySlug: '3d-and-animation',
    topics: [{ slug: 'blender', primary: true }, { slug: '3d-modeling' }],
    language: 'vi',
    level: 'beginner',
    priceAmount: 0,
    status: 'published',
    title: 'Blender: dựng mô hình 3D low-poly cho game',
    subtitle: 'Dựng, trải UV, tô màu và xuất mô hình low-poly từ Blender sang Unity, Godot dùng được ngay',
    description:
      'Bạn đang làm game indie hoặc đồ án môn học và cần vài mô hình 3D riêng: một chiếc rương, cái thùng gỗ, cây đèn đường. Kho tài nguyên miễn phí không có đúng thứ bạn cần, còn mở Blender lần đầu thì gặp cả trăm nút bấm và không biết bắt đầu từ đâu. Khoá học này đưa bạn đi hết quy trình dựng một mô hình low-poly và đưa nó vào game engine, với lượng kiến thức vừa đủ để tự làm tiếp.\n\n' +
      'Chúng ta học Blender theo đúng thứ tự công việc của người làm asset cho game, không học lan man từng menu:\n' +
      '• Điều hướng viewport, chọn đối tượng và nhóm phím tắt dùng hằng ngày.\n' +
      '• Edit Mode với extrude, inset, loop cut, bevel và các modifier Mirror, Subdivision Surface, Solidify.\n' +
      '• Đánh dấu seam, trải UV và tô màu bằng vật liệu Principled BSDF kết hợp texture paint.\n' +
      '• Kiểm tra topology, normal, số polygon, apply transform rồi xuất FBX hoặc glTF.\n\n' +
      'Dự án xuyên suốt là một bộ đạo cụ low-poly gồm thùng gỗ, rương kho báu và cây đèn đường. Mỗi bài có file .blend khởi đầu để bạn làm theo, kèm bản hoàn chỉnh để so sánh khi bị kẹt. Cuối khoá, bạn đưa bộ đạo cụ vào một scene trong Unity hoặc Godot và kiểm tra kích thước, hướng trục, vật liệu hiển thị đúng hay chưa.\n\n' +
      'Khoá học tập trung vào phong cách low-poly vì nó nhẹ, dễ học và hợp với game nhỏ. Bạn sẽ không học sculpt hay dựng nhân vật chi tiết, nhưng sẽ nắm chắc nền tảng dựng mô hình và quy trình xuất asset sạch, đủ để tự học tiếp các kỹ thuật nâng cao sau này.',
    learningObjectives: [
      'Điều hướng viewport và thao tác đối tượng trong Blender bằng phím tắt thay vì menu',
      'Dựng mô hình low-poly bằng extrude, inset, loop cut, bevel và modifier Mirror',
      'Đánh dấu seam, trải UV và tô màu mô hình bằng vật liệu Principled BSDF',
      'Kiểm tra normal, đỉnh trùng và số polygon để mô hình hiển thị đúng trong game',
      'Apply transform, đặt origin và xuất mô hình sang FBX hoặc glTF cho Unity, Godot',
    ],
    requirements: [
      'Máy tính cài được Blender bản 4.x, nên có chuột ba nút',
      'Không cần kinh nghiệm 3D, chỉ cần quen thao tác máy tính cơ bản',
    ],
    targetAudience: [
      'Lập trình viên game indie muốn tự làm asset 3D đơn giản cho dự án',
      'Sinh viên làm đồ án game cần mô hình riêng thay vì tải sẵn',
    ],
    thumbnail: { label: 'Blender', tagline: 'Mô hình low-poly cho game' },
    sections: [
      {
        title: 'Làm quen với Blender',
        lectures: [
          'Giới thiệu khoá học và cài đặt Blender',
          'Giao diện, điều hướng viewport và phím tắt cần nhớ',
        ],
      },
      {
        title: 'Dựng mô hình low-poly',
        lectures: [
          'Edit Mode: extrude, inset, loop cut và bevel',
          'Modifier Mirror, Subdivision Surface và Solidify',
          'Dựng thùng gỗ và rương kho báu low-poly',
        ],
      },
      {
        title: 'UV và vật liệu',
        lectures: [
          'Đánh dấu seam và trải UV',
          'Vật liệu Principled BSDF và texture paint cơ bản',
        ],
      },
      {
        title: 'Đưa mô hình vào game engine',
        lectures: [
          'Kiểm tra topology, normal và số polygon',
          'Apply transform, đặt origin và xuất FBX, glTF',
        ],
      },
    ],
    quiz: {
      title: 'Kiểm tra: quy trình dựng mô hình cho game',
      description: 'Ôn lại công cụ dựng hình, modifier, UV và các bước chuẩn bị trước khi xuất.',
      questions: [
        {
          type: 'single_choice',
          stem: 'Bạn muốn thêm một vòng cạnh chạy quanh thân chiếc thùng để có thêm chi tiết. Công cụ nào phù hợp?',
          relatedLecture: 2,
          options: [
            {
              content: 'Loop Cut (Ctrl+R)',
              correct: true,
              explanation: 'Loop Cut cắt một vòng cạnh mới chạy quanh dải mặt tứ giác, đúng nhu cầu này.',
            },
            {
              content: 'Extrude (E)',
              explanation: 'Extrude đẩy mặt hoặc cạnh ra để tạo khối mới, không cắt vòng cạnh trên khối có sẵn.',
            },
            {
              content: 'Inset (I)',
              explanation: 'Inset tạo một mặt nhỏ hơn bên trong mặt đang chọn, chỉ tác động lên mặt đó.',
            },
            {
              content: 'Merge (M)',
              explanation: 'Merge gộp các đỉnh lại với nhau, làm giảm chứ không thêm hình học.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Mô hình đối xứng trái phải như chiếc rương. Modifier nào giúp bạn chỉ cần dựng một nửa?',
          relatedLecture: 3,
          options: [
            {
              content: 'Mirror',
              correct: true,
              explanation: 'Mirror tự sinh nửa còn lại theo trục chọn, sửa một bên thì bên kia cập nhật theo.',
            },
            {
              content: 'Array',
              explanation: 'Array nhân bản đối tượng theo hàng, không tạo bản đối xứng.',
            },
            {
              content: 'Solidify',
              explanation: 'Solidify thêm độ dày cho bề mặt mỏng, không liên quan đến đối xứng.',
            },
            {
              content: 'Decimate',
              explanation: 'Decimate giảm số polygon của mesh, không tạo nửa đối xứng.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Seam trong Blender dùng để làm gì?',
          relatedLecture: 5,
          options: [
            {
              content: 'Đánh dấu đường cắt để Blender trải mesh 3D thành các mảnh phẳng khi unwrap UV',
              correct: true,
              explanation: 'Seam giống đường may trên áo, cho biết chỗ được phép cắt khi trải phẳng mô hình.',
            },
            {
              content: 'Làm cạnh trông sắc hơn khi bật Shade Smooth',
              explanation: 'Việc đó là của Mark Sharp hoặc Shade Auto Smooth (Smooth by Angle), seam không ảnh hưởng cách đổ bóng.',
            },
            {
              content: 'Gộp hai đối tượng thành một mesh',
              explanation: 'Gộp đối tượng dùng lệnh Join (Ctrl+J), không liên quan đến seam.',
            },
          ],
        },
        {
          type: 'multiple_choice',
          stem: 'Những dấu hiệu nào cho thấy mesh cần sửa trước khi đưa vào game engine?',
          relatedLecture: 7,
          options: [
            {
              content: 'Một số mặt bị lật normal, biến mất khi engine bật backface culling',
              correct: true,
              explanation: 'Engine thường chỉ vẽ mặt trước, normal lật sẽ để lại lỗ trên mô hình. Sửa bằng Recalculate Outside.',
            },
            {
              content: 'Nhiều đỉnh nằm chồng cùng vị trí nhưng chưa được gộp',
              correct: true,
              explanation: 'Đỉnh trùng gây đường nứt khi đổ bóng và làm UV khó xử lý. Dùng Merge by Distance để gộp.',
            },
            {
              content: 'Mesh chủ yếu gồm các mặt tứ giác',
              explanation: 'Mặt tứ giác là topology tốt, dễ chỉnh sửa và được engine chia tam giác ổn định.',
            },
            {
              content: 'Một đạo cụ nhỏ chỉ có vài trăm tam giác',
              explanation: 'Số polygon thấp là mục tiêu của low-poly, giúp game chạy nhẹ.',
            },
          ],
        },
        {
          type: 'single_choice',
          stem: 'Vì sao nên Apply Scale (Ctrl+A) trước khi xuất mô hình sang game engine?',
          relatedLecture: 8,
          options: [
            {
              content: 'Để kích thước thật được ghi vào đỉnh và scale trở về 1, engine không phải nhân thêm tỉ lệ',
              correct: true,
              explanation: 'Scale khác 1 dễ làm collider, vật lý và modifier như Bevel tính sai trong engine.',
            },
            {
              content: 'Để giảm số polygon của mô hình',
              explanation: 'Apply Scale không thay đổi số đỉnh hay số mặt.',
            },
            {
              content: 'Để Blender tự động trải UV lại',
              explanation: 'Apply Scale không đụng đến UV, bạn vẫn phải unwrap riêng.',
            },
          ],
        },
      ],
    },
  },
];
