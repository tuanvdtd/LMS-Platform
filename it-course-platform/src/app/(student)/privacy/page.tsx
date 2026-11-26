import type { Metadata } from 'next';
import Link from 'next/link';
import { CookieSettingsButton } from '@/components/cookie-consent';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LegalNote, LegalPage, type LegalSection, SupportEmail } from '../_components/legal-page';

export const metadata: Metadata = {
  title: 'Chính sách bảo mật | Aolumi',
  description: 'Aolumi thu thập dữ liệu gì, dùng vào việc gì, chia sẻ với ai, và bạn kiểm soát dữ liệu của mình thế nào.',
};

// Bảng này phải khớp với thứ trang thật sự lưu trên trình duyệt. Thêm cookie/khoá localStorage mới thì thêm dòng.
const STORAGE = [
  { name: 'Cookie phiên đăng nhập', group: 'Thiết yếu', purpose: 'Giữ bạn ở trạng thái đăng nhập và bảo vệ tài khoản.', ttl: 'Đến khi đăng xuất hoặc phiên hết hạn' },
  { name: 'Giao diện sáng/tối', group: 'Thiết yếu', purpose: 'Nhớ giao diện bạn đã chọn.', ttl: 'Đến khi bạn xoá dữ liệu trình duyệt' },
  { name: 'Lựa chọn cookie', group: 'Thiết yếu', purpose: 'Nhớ bạn đã đồng ý hay từ chối để không hỏi lại.', ttl: 'Đến khi bạn xoá dữ liệu trình duyệt' },
  { name: 'Bản nháp bài làm', group: 'Thiết yếu', purpose: 'Giữ đáp án trắc nghiệm đang làm dở, mã bạn đang viết và cách bạn sắp xếp trang học (mục lục, kiểu xem tài liệu, tiếng lật trang).', ttl: 'Đến khi nộp bài hoặc xoá dữ liệu trình duyệt' },
  { name: 'Cookie của Stripe', group: 'Thiết yếu', purpose: 'Chống gian lận trên trang thanh toán của Stripe. Chỉ xuất hiện khi bạn thanh toán.', ttl: 'Theo chính sách của Stripe' },
  { name: 'Chẩn đoán lỗi (Sentry)', group: 'Cần đồng ý', purpose: 'Ghi nhận lỗi, tốc độ tải trang và bản ghi thao tác quanh thời điểm xảy ra lỗi.', ttl: 'Trong phiên duyệt web' },
  { name: 'Mã khách ẩn danh', group: 'Cần đồng ý', purpose: 'Nhận ra cùng một trình duyệt khi bạn quay lại trang khoá học, để giảng viên đếm đúng số người xem. Không chứa tên hay email.', ttl: 'Đến khi bạn xoá dữ liệu trình duyệt' },
];

const SECTIONS: LegalSection[] = [
  {
    id: 'gioi-thieu',
    title: 'Giới thiệu và phạm vi',
    body: (
      <>
        <p>
          Aolumi tôn trọng quyền riêng tư của bạn. Chính sách này giải thích chúng tôi thu thập dữ liệu gì, dùng vào việc gì, chia sẻ
          với ai và bạn có những quyền gì. Chính sách áp dụng cho mọi người dùng: khách truy cập, học viên, giảng viên.
        </p>
        <p>
          Chính sách này là một phần của <Link href="/terms">Điều khoản sử dụng</Link>. Chúng tôi xử lý dữ liệu cá nhân theo quy định
          của pháp luật Việt Nam về bảo vệ dữ liệu cá nhân.
        </p>
      </>
    ),
  },
  {
    id: 'thu-thap',
    title: 'Dữ liệu chúng tôi thu thập',
    body: (
      <>
        <p><strong>Dữ liệu bạn cung cấp</strong></p>
        <ul>
          <li>Tài khoản: họ tên, email, mật khẩu (chỉ lưu dạng đã băm, chúng tôi không đọc được mật khẩu gốc).</li>
          <li>Hồ sơ: ảnh đại diện, giới thiệu, nghề nghiệp, trình độ và mục tiêu học tập bạn khai khi bắt đầu.</li>
          <li>Hồ sơ giảng viên: thông tin chuyên môn, tài liệu chứng minh năng lực, tên ngân hàng, số tài khoản và tên chủ tài khoản để nhận doanh thu.</li>
          <li>Nội dung bạn đăng: khoá học, câu hỏi, câu trả lời, đánh giá, tin nhắn, ghi chú, bài nộp trắc nghiệm và mã nguồn bài tập.</li>
        </ul>
        <p><strong>Dữ liệu phát sinh khi bạn sử dụng</strong></p>
        <ul>
          <li>Học tập: khoá đã ghi danh, tiến độ từng bài, vị trí đang xem trong video, điểm số, kết quả đánh giá kỹ năng, chứng chỉ.</li>
          <li>Hành vi xem: các đoạn video bạn đã xem (để giảng viên biết đoạn nào khó hiểu), lượt xem trang khoá học và lượt thêm khoá vào giỏ.</li>
          <li>Giao dịch: đơn hàng, số tiền, mã giảm giá đã dùng, trạng thái thanh toán và hoàn tiền.</li>
          <li>Phiên đăng nhập: địa chỉ IP, loại trình duyệt và thiết bị, thời điểm đăng nhập. Bạn xem và thu hồi được từng phiên trong Cài đặt.</li>
          <li>Email hệ thống đã gửi cho bạn (loại email, thời điểm, trạng thái gửi).</li>
        </ul>
        <p><strong>Dữ liệu từ bên thứ ba</strong></p>
        <ul>
          <li>Khi bạn đăng nhập hoặc liên kết Google, GitHub: tên, email, ảnh đại diện và mã định danh tài khoản do bên đó cung cấp.</li>
          <li>Từ Stripe: kết quả giao dịch và mã tham chiếu thanh toán.</li>
        </ul>
        <LegalNote title="Chúng tôi không thu thập:">
          số thẻ thanh toán (Stripe xử lý trực tiếp), mật khẩu Google hay GitHub của bạn, danh bạ, vị trí chính xác, hay bất kỳ dữ liệu
          nào khác trên các tài khoản liên kết ngoài những mục nêu trên.
        </LegalNote>
      </>
    ),
  },
  {
    id: 'muc-dich',
    title: 'Chúng tôi dùng dữ liệu để làm gì',
    body: (
      <>
        <ul>
          <li>Tạo và bảo vệ tài khoản: xác minh email, xác thực hai lớp, phát hiện đăng nhập bất thường.</li>
          <li>Cung cấp việc học: phát video, lưu tiến độ, chấm trắc nghiệm và bài tập lập trình, cấp chứng chỉ.</li>
          <li>Gợi ý khoá học theo mục tiêu bạn khai và kết quả đánh giá kỹ năng, luôn kèm lý do cụ thể.</li>
          <li>Xử lý đơn hàng, hoàn tiền, đối soát và chi trả doanh thu cho giảng viên.</li>
          <li>Cung cấp số liệu phân tích cho giảng viên về khoá học của họ.</li>
          <li>Kiểm duyệt khoá học, hồ sơ xác minh giảng viên và xử lý báo cáo vi phạm.</li>
          <li>Gửi thông báo và email cần thiết cho việc sử dụng dịch vụ (xác minh, đặt lại mật khẩu, kết quả duyệt, trả lời câu hỏi).</li>
          <li>Phát hiện lỗi, đo hiệu năng và cải thiện nền tảng.</li>
        </ul>
        <p>
          Việc chấm bài và gợi ý khoá học được thực hiện tự động. Chúng không tạo ra quyết định có hệ quả pháp lý với bạn; nếu cho rằng
          kết quả chấm sai, bạn có thể liên hệ giảng viên của khoá hoặc đội hỗ trợ.
        </p>
        <LegalNote title="Cam kết:">
          Aolumi không bán, không cho thuê dữ liệu cá nhân của bạn, không dùng dữ liệu của bạn để hiển thị quảng cáo của bên thứ ba
          và không gửi email tiếp thị khi bạn chưa đồng ý.
        </LegalNote>
      </>
    ),
  },
  {
    id: 'chia-se',
    title: 'Dữ liệu được chia sẻ với ai',
    body: (
      <>
        <p><strong>Những người dùng khác trên Aolumi</strong></p>
        <ul>
          <li>Trang cá nhân công khai hiển thị tên, ảnh đại diện và giới thiệu của bạn. Phần học tập (khoá đã học, chứng chỉ, kỹ năng) chỉ hiển thị khi bạn bật công tắc công khai trong Cài đặt.</li>
          <li>Câu hỏi, câu trả lời và đánh giá khoá học hiển thị kèm tên và ảnh đại diện của bạn.</li>
          <li>Giảng viên thấy tiến độ, điểm số và câu hỏi của bạn trong các khoá của họ. Giảng viên không thấy email, thông tin thanh toán hay dữ liệu ở các khoá khác.</li>
          <li>Bất kỳ ai có mã QR hoặc đường dẫn chứng chỉ đều xác thực được tên bạn, tên khoá và ngày cấp.</li>
        </ul>
        <p><strong>Nhà cung cấp dịch vụ xử lý dữ liệu thay chúng tôi</strong></p>
        <ul>
          <li>Stripe: xử lý thanh toán.</li>
          <li>Amazon Web Services: lưu trữ và phát video, tài liệu, ảnh.</li>
          <li>Google và GitHub: xác thực khi bạn chọn đăng nhập bằng các tài khoản này.</li>
          <li>Nhà cung cấp dịch vụ gửi email: gửi email hệ thống tới địa chỉ của bạn.</li>
          <li>Sentry: ghi nhận lỗi kỹ thuật. Dữ liệu gửi đi đã được lược bỏ cookie, nội dung biểu mẫu và tham số trên đường dẫn.</li>
        </ul>
        <p>
          Các bên này chỉ nhận phần dữ liệu tối thiểu cần cho công việc của họ. Ngoài ra, chúng tôi chỉ cung cấp dữ liệu cho cơ quan nhà
          nước có thẩm quyền khi có yêu cầu hợp lệ theo quy định pháp luật.
        </p>
      </>
    ),
  },
  {
    id: 'cookie',
    title: 'Cookie và lưu trữ trên trình duyệt',
    body: (
      <>
        <p>
          Cookie là tệp nhỏ lưu trên thiết bị của bạn. Bên cạnh cookie, Aolumi còn dùng bộ nhớ cục bộ của trình duyệt cho một số
          thiết lập. Chúng tôi chia thành hai nhóm:
        </p>
        <ul>
          <li><strong>Thiết yếu:</strong> cần để đăng nhập, thanh toán và học. Nhóm này luôn bật vì thiếu chúng trang không hoạt động đúng.</li>
          <li><strong>Cần đồng ý:</strong> công cụ chẩn đoán lỗi và mã khách ẩn danh lưu trên trình duyệt. Nhóm này chỉ chạy sau khi bạn bấm “Đồng ý tất cả”. Khi bạn chưa đồng ý, lượt xem trang khoá học vẫn được đếm nhưng không lưu gì trên trình duyệt của bạn.</li>
        </ul>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Nhóm</TableHead>
              <TableHead>Mục đích</TableHead>
              <TableHead>Thời hạn</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {STORAGE.map((r) => (
              <TableRow key={r.name}>
                <TableCell className="font-medium whitespace-normal">{r.name}</TableCell>
                <TableCell className="whitespace-nowrap">{r.group}</TableCell>
                <TableCell className="min-w-56 whitespace-normal">{r.purpose}</TableCell>
                <TableCell className="min-w-40 whitespace-normal">{r.ttl}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p>Aolumi không dùng cookie quảng cáo và không có công cụ theo dõi của mạng xã hội.</p>
        <LegalNote title="Thay đổi lựa chọn của bạn:">
          bạn đổi ý hoặc rút lại sự đồng ý được bất cứ lúc nào. Khi bạn chọn “Từ chối”, công cụ chẩn đoán lỗi dừng ngay trên
          trình duyệt của bạn. Khi bạn bấm Từ chối, mã khách đã lưu (nếu có) bị xoá ngay.{' '}
          <CookieSettingsButton className="font-semibold text-primary underline underline-offset-4" />
        </LegalNote>
      </>
    ),
  },
  {
    id: 'luu-tru',
    title: 'Thời gian lưu trữ',
    body: (
      <ul>
        <li>Dữ liệu tài khoản và học tập: lưu trong suốt thời gian tài khoản còn tồn tại.</li>
        <li>Phiên đăng nhập: tự hết hạn; bạn có thể thu hồi sớm trong Cài đặt.</li>
        <li>Mã xác minh email và đặt lại mật khẩu: hết hạn trong thời gian ngắn và chỉ dùng được một lần.</li>
        <li>Đơn hàng, hoá đơn, chi trả doanh thu: lưu theo thời hạn mà pháp luật về kế toán và thuế yêu cầu, kể cả sau khi tài khoản bị xoá.</li>
        <li>Chứng chỉ đã cấp: giữ lại để người khác vẫn xác thực được, trừ khi bạn yêu cầu xoá.</li>
        <li>Dữ liệu chẩn đoán lỗi: tự xoá theo chu kỳ lưu trữ của Sentry.</li>
      </ul>
    ),
  },
  {
    id: 'bao-mat',
    title: 'Bảo mật dữ liệu',
    body: (
      <>
        <ul>
          <li>Dữ liệu truyền giữa trình duyệt và máy chủ được mã hoá bằng HTTPS.</li>
          <li>Mật khẩu được băm bằng thuật toán một chiều. Bạn có thể bật xác thực hai lớp bằng ứng dụng tạo mã.</li>
          <li>Video khoá học được phát qua đường dẫn có chữ ký và có thời hạn.</li>
          <li>Mã nguồn bạn nộp chạy trong môi trường cô lập, tách khỏi dữ liệu của hệ thống và của người dùng khác.</li>
          <li>Chỉ quản trị viên và kiểm duyệt viên được phân quyền mới truy cập được dữ liệu cần cho công việc của họ.</li>
        </ul>
        <p>
          Không hệ thống nào an toàn tuyệt đối. Nếu xảy ra sự cố ảnh hưởng tới dữ liệu cá nhân của bạn, chúng tôi sẽ thông báo cho bạn và
          cơ quan có thẩm quyền theo quy định của pháp luật.
        </p>
      </>
    ),
  },
  {
    id: 'quyen',
    title: 'Quyền của bạn',
    body: (
      <>
        <p>Đối với dữ liệu cá nhân của mình, bạn có quyền:</p>
        <ul>
          <li>Được biết và đồng ý hoặc không đồng ý với việc xử lý dữ liệu.</li>
          <li>Xem và chỉnh sửa hồ sơ, email, mật khẩu, tài khoản liên kết trong phần Cài đặt.</li>
          <li>Rút lại sự đồng ý, ví dụ với công cụ chẩn đoán lỗi hoặc với việc công khai phần học tập.</li>
          <li>Yêu cầu cung cấp bản sao dữ liệu của bạn.</li>
          <li>Yêu cầu hạn chế xử lý hoặc xoá tài khoản cùng dữ liệu cá nhân.</li>
          <li>Phản đối việc xử lý, khiếu nại hoặc yêu cầu bồi thường theo quy định của pháp luật.</li>
        </ul>
        <p>
          Với những quyền chưa có sẵn trong Cài đặt, hãy gửi yêu cầu từ email đã đăng ký tới <SupportEmail />. Chúng tôi phản hồi trong
          vòng 72 giờ. Một số dữ liệu vẫn phải giữ lại theo nghĩa vụ pháp lý, như nêu ở mục 6.
        </p>
      </>
    ),
  },
  {
    id: 'tre-em',
    title: 'Trẻ em',
    body: (
      <p>
        Aolumi không hướng tới trẻ em. Người dưới 16 tuổi chỉ được dùng dịch vụ khi có sự đồng ý của cha mẹ hoặc người giám hộ. Nếu
        bạn cho rằng một trẻ đã cung cấp dữ liệu cho chúng tôi mà chưa có sự đồng ý đó, hãy liên hệ để chúng tôi xoá dữ liệu.
      </p>
    ),
  },
  {
    id: 'nuoc-ngoai',
    title: 'Chuyển dữ liệu ra nước ngoài',
    body: (
      <p>
        Một số nhà cung cấp nêu ở mục 4 (Stripe, Amazon Web Services, Google, GitHub, Sentry) đặt máy chủ ngoài Việt Nam, nên dữ liệu
        của bạn có thể được xử lý ở nước ngoài. Chúng tôi chỉ chuyển phần dữ liệu cần thiết cho dịch vụ tương ứng và chỉ làm việc với
        nhà cung cấp có cam kết bảo mật phù hợp.
      </p>
    ),
  },
  {
    id: 'thay-doi',
    title: 'Thay đổi chính sách',
    body: (
      <p>
        Khi chính sách thay đổi, chúng tôi cập nhật ngày ở đầu trang. Với thay đổi quan trọng (thêm mục đích xử lý, thêm bên nhận dữ
        liệu), chúng tôi sẽ báo qua email hoặc thông báo trên nền tảng trước khi áp dụng.
      </p>
    ),
  },
  {
    id: 'lien-he',
    title: 'Liên hệ',
    body: (
      <p>
        Câu hỏi về chính sách này hoặc yêu cầu liên quan tới dữ liệu cá nhân, vui lòng gửi tới <SupportEmail />.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Chính sách bảo mật"
      intro="Tóm tắt: chúng tôi chỉ thu thập dữ liệu cần cho việc học, thanh toán và bảo vệ tài khoản; không bán dữ liệu; công cụ chẩn đoán lỗi chỉ chạy khi bạn đồng ý."
      sections={SECTIONS}
      other={{ href: '/terms', label: 'Điều khoản sử dụng' }}
    />
  );
}
