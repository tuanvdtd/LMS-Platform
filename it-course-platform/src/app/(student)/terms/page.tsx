import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalNote, LegalPage, type LegalSection, SupportEmail } from '../_components/legal-page';

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng | SkillPath',
  description: 'Quy định về tài khoản, khoá học, thanh toán, giảng viên và nội dung khi sử dụng SkillPath.',
};

// Nội dung bám theo cách sản phẩm đang chạy thật (Stripe Checkout, kiểm duyệt khoá, chia doanh thu,
// chấm bài trong sandbox). Đổi nghiệp vụ thì sửa mục tương ứng và LEGAL_UPDATED.
const SECTIONS: LegalSection[] = [
  {
    id: 'chap-nhan',
    title: 'Chấp nhận điều khoản',
    body: (
      <>
        <p>
          Khi tạo tài khoản hoặc dùng bất kỳ tính năng nào của SkillPath, bạn xác nhận đã đọc, hiểu và đồng ý với các điều khoản này
          cùng <Link href="/privacy">Chính sách bảo mật</Link>. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.
        </p>
        <p>
          SkillPath là nền tảng khoá học công nghệ thông tin: giảng viên tự đăng khoá của mình, mọi khoá đều qua kiểm duyệt trước khi
          lên danh mục, học viên học qua video, trắc nghiệm và bài tập lập trình được chấm tự động.
        </p>
      </>
    ),
  },
  {
    id: 'tai-khoan',
    title: 'Tài khoản người dùng',
    body: (
      <>
        <ul>
          <li>Bạn cần từ đủ 16 tuổi để tự tạo tài khoản. Người dưới 16 tuổi chỉ được dùng dịch vụ khi có sự đồng ý của cha mẹ hoặc người giám hộ.</li>
          <li>Thông tin đăng ký (họ tên, email) phải chính xác. Bạn cần xác minh email trước khi đăng nhập lần đầu.</li>
          <li>Bạn có thể đăng nhập bằng mật khẩu hoặc liên kết tài khoản Google, GitHub. Chúng tôi khuyến khích bật xác thực hai lớp trong phần Cài đặt.</li>
          <li>Bạn chịu trách nhiệm giữ kín mật khẩu, mã xác thực và mã dự phòng, cũng như mọi hoạt động diễn ra dưới tài khoản của mình.</li>
          <li>Mỗi tài khoản dành cho một cá nhân. Không chia sẻ, cho mượn hay bán lại tài khoản, kể cả tài khoản đã mua khoá học.</li>
          <li>Nếu nghi ngờ tài khoản bị truy cập trái phép, hãy đổi mật khẩu, thu hồi các phiên đăng nhập lạ trong Cài đặt và báo cho chúng tôi.</li>
        </ul>
        <p>
          Tài khoản kiểm duyệt viên và quản trị viên là tài khoản nghiệp vụ do SkillPath cấp, tách riêng khỏi tài khoản cá nhân và không
          dùng để học, mua hay dạy.
        </p>
      </>
    ),
  },
  {
    id: 'khoa-hoc',
    title: 'Khoá học và quyền truy cập',
    body: (
      <>
        <p>
          Khi ghi danh khoá miễn phí hoặc thanh toán thành công khoá có phí, bạn được cấp quyền truy cập khoá học đó cho mục đích học
          tập cá nhân, không độc quyền và không chuyển nhượng.
        </p>
        <ul>
          <li>Không tải xuống, ghi lại, phát lại công khai, chia sẻ hay bán lại video, tài liệu, đề bài và lời giải của khoá học.</li>
          <li>Không dùng công cụ tự động để thu thập nội dung khoá học hoặc vượt qua cơ chế bảo vệ video.</li>
          <li>Giảng viên có thể cập nhật nội dung khoá. Việc cập nhật không làm mất quyền truy cập của bạn.</li>
          <li>
            Một khoá có thể bị gỡ khỏi danh mục vì vi phạm chính sách hoặc theo yêu cầu của giảng viên. Khi điều đó xảy ra với khoá bạn
            đã mua, chúng tôi sẽ cố gắng giữ quyền truy cập cho bạn; nếu không thể, bạn được xem xét hoàn tiền theo mục 4.
          </li>
        </ul>
        <p>
          Nội dung khoá học do giảng viên biên soạn. Kiểm duyệt giúp loại bỏ khoá vi phạm và khoá kém chất lượng rõ ràng, nhưng không
          phải là lời bảo đảm rằng mọi thông tin trong khoá đều chính xác hay phù hợp với mục tiêu của bạn.
        </p>
      </>
    ),
  },
  {
    id: 'thanh-toan',
    title: 'Thanh toán, mã giảm giá và hoàn tiền',
    body: (
      <>
        <ul>
          <li>Giá khoá học niêm yết bằng đồng Việt Nam (₫) và hiển thị rõ trước khi bạn thanh toán.</li>
          <li>
            Thanh toán được xử lý qua Stripe. SkillPath không nhận và không lưu số thẻ của bạn; chúng tôi chỉ nhận kết quả giao dịch để
            ghi nhận đơn hàng.
          </li>
          <li>Bạn được ghi danh sau khi Stripe xác nhận thanh toán thành công. Đơn chưa hoàn tất không tạo ra quyền truy cập.</li>
          <li>Mã giảm giá có điều kiện riêng (khoá áp dụng, số lượt, thời hạn), không quy đổi thành tiền và không cộng dồn trừ khi có ghi rõ.</li>
        </ul>
        <LegalNote title="Hoàn tiền:">
          Nếu bạn bị trừ tiền nhưng không được ghi danh, bị thanh toán trùng, hoặc khoá học sai lệch nghiêm trọng so với mô tả, hãy gửi mã
          đơn hàng tới <SupportEmail /> trong vòng 7 ngày kể từ ngày thanh toán. Chúng tôi xem xét từng trường hợp và hoàn về đúng phương
          thức bạn đã dùng. Yêu cầu có thể bị từ chối nếu bạn đã học phần lớn khoá hoặc đã nhận chứng chỉ của khoá đó.
        </LegalNote>
      </>
    ),
  },
  {
    id: 'cham-bai',
    title: 'Bài tập, đánh giá kỹ năng và chứng chỉ',
    body: (
      <>
        <ul>
          <li>Trắc nghiệm và bài tập lập trình được chấm tự động. Bài code chạy trong môi trường cô lập với giới hạn thời gian và bộ nhớ; kết quả phụ thuộc vào bộ test của đề bài.</li>
          <li>Không gửi mã nhằm phá hoại, dò quét, chiếm tài nguyên hay thoát khỏi môi trường chấm bài.</li>
          <li>Bài đánh giá kỹ năng do SkillPath soạn và là nguồn duy nhất để tính độ thành thạo theo chủ đề. Hãy tự làm bài: kết quả gian lận làm gợi ý khoá học của chính bạn sai lệch.</li>
          <li>Gợi ý khoá học được tạo tự động từ mục tiêu bạn khai và kết quả đánh giá. Đây là gợi ý tham khảo, không phải cam kết về kết quả học tập hay việc làm.</li>
          <li>Chứng chỉ được cấp khi bạn hoàn thành khoá học và xác thực được bằng mã QR. Chứng chỉ xác nhận việc hoàn thành khoá trên SkillPath, không phải văn bằng hay chứng chỉ thuộc hệ thống giáo dục quốc dân.</li>
        </ul>
        <p>Chúng tôi có thể huỷ kết quả hoặc thu hồi chứng chỉ nếu phát hiện gian lận.</p>
      </>
    ),
  },
  {
    id: 'giang-vien',
    title: 'Điều khoản dành cho giảng viên',
    body: (
      <>
        <p>Bất kỳ học viên nào cũng có thể bật vai trò giảng viên. Khi đăng khoá học, bạn đồng ý thêm các điều sau:</p>
        <ul>
          <li>Mọi khoá, kể cả khoá miễn phí, phải qua kiểm duyệt trước khi xuất bản. Người gửi và người duyệt không bao giờ là cùng một người. Khoá bị từ chối sẽ kèm lý do để bạn chỉnh sửa và gửi lại.</li>
          <li>Muốn đặt giá lớn hơn 0 và nhận doanh thu, bạn cần là giảng viên đã xác minh: hồ sơ chuyên môn được duyệt và có tài khoản ngân hàng chính chủ.</li>
          <li>Doanh thu chia theo tỉ lệ hiển thị tại bước đồng ý điều khoản giảng viên (hiện là 70% cho giảng viên), tính trên số tiền học viên thực trả sau mã giảm giá.</li>
          <li>Doanh thu được chốt và chuyển khoản hằng tháng vào tài khoản ngân hàng bạn đã khai. Khoản thuộc đơn hàng bị hoàn tiền sẽ được khấu trừ.</li>
          <li>Giá khoá học cố định từ lần xuất bản đầu tiên; muốn giảm giá sau đó thì dùng mã giảm giá.</li>
          <li>Bạn cam kết sở hữu hoặc có quyền sử dụng toàn bộ nội dung đăng lên (video, hình ảnh, mã nguồn, tài liệu, đề bài) và tự chịu trách nhiệm nếu có khiếu nại về bản quyền.</li>
          <li>Bạn tự chịu trách nhiệm về nghĩa vụ thuế đối với thu nhập nhận được từ SkillPath.</li>
        </ul>
        <p>
          Bạn giữ quyền sở hữu nội dung của mình. Bạn cấp cho SkillPath quyền lưu trữ, xử lý kỹ thuật (ví dụ chuyển mã video), hiển
          thị và phân phối nội dung đó tới học viên đã ghi danh, cũng như dùng tên khoá, mô tả và ảnh bìa để giới thiệu khoá trên nền tảng.
        </p>
        <p>
          Dữ liệu học viên bạn thấy trong bảng phân tích (tiến độ, điểm, câu hỏi) chỉ được dùng để cải thiện khoá học và hỗ trợ học
          viên, không dùng cho mục đích khác và không mang ra ngoài nền tảng.
        </p>
      </>
    ),
  },
  {
    id: 'noi-dung',
    title: 'Nội dung bạn đăng',
    body: (
      <>
        <p>
          Câu hỏi, câu trả lời, đánh giá khoá học, tin nhắn, ghi chú và thông tin trên trang cá nhân là nội dung của bạn. Bạn chịu trách
          nhiệm về nội dung đó và cho phép SkillPath lưu trữ, hiển thị nó trong phạm vi tính năng tương ứng.
        </p>
        <ul>
          <li>Đánh giá khoá học phải phản ánh trải nghiệm thật của bạn. Không đánh giá để đổi lấy lợi ích, không tự đánh giá khoá của mình.</li>
          <li>Không đăng lời giải đầy đủ của bài tập chấm điểm ở khu vực công khai của khoá học.</li>
          <li>Bạn có thể báo cáo nội dung vi phạm. Chúng tôi có quyền ẩn hoặc gỡ nội dung vi phạm mà không cần báo trước.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'cam',
    title: 'Hành vi bị nghiêm cấm',
    body: (
      <ul>
        <li>Đăng nội dung vi phạm pháp luật, xúc phạm, quấy rối, phân biệt đối xử, khiêu dâm hoặc kích động bạo lực.</li>
        <li>Đăng nội dung xâm phạm bản quyền, nhãn hiệu hoặc bí mật kinh doanh của người khác.</li>
        <li>Mạo danh cá nhân, tổ chức; khai gian hồ sơ chuyên môn hoặc thông tin ngân hàng.</li>
        <li>Truy cập trái phép tài khoản, dữ liệu của người khác; dò quét, khai thác lỗ hổng hoặc gây quá tải hệ thống.</li>
        <li>Phát tán mã độc, thư rác, quảng cáo không được phép hoặc lôi kéo học viên giao dịch ngoài nền tảng để né phí.</li>
        <li>Gian lận thanh toán, lạm dụng mã giảm giá hoặc chính sách hoàn tiền.</li>
        <li>Dùng nội dung trên SkillPath để huấn luyện mô hình máy học hoặc xây dựng sản phẩm cạnh tranh khi chưa được đồng ý bằng văn bản.</li>
      </ul>
    ),
  },
  {
    id: 'so-huu-tri-tue',
    title: 'Sở hữu trí tuệ của SkillPath',
    body: (
      <p>
        Giao diện, mã nguồn, logo, tên SkillPath, ngân hàng câu hỏi đánh giá kỹ năng và các tài liệu chính thức của nền tảng thuộc về
        SkillPath. Bạn không được sao chép, sửa đổi, phân phối hay khai thác thương mại các thành phần này khi chưa có sự đồng ý bằng
        văn bản của chúng tôi.
      </p>
    ),
  },
  {
    id: 'dich-vu',
    title: 'Tính sẵn sàng của dịch vụ',
    body: (
      <p>
        Chúng tôi nỗ lực giữ dịch vụ hoạt động ổn định nhưng không cam kết dịch vụ không bao giờ gián đoạn hay không có lỗi. SkillPath
        có thể bảo trì, cập nhật, thay đổi hoặc ngừng một số tính năng. Với thay đổi lớn ảnh hưởng tới bạn, chúng tôi sẽ thông báo
        trước trong khả năng hợp lý qua email hoặc thông báo trên nền tảng.
      </p>
    ),
  },
  {
    id: 'trach-nhiem',
    title: 'Giới hạn trách nhiệm',
    body: (
      <>
        <p>Dịch vụ được cung cấp theo hiện trạng. Trong phạm vi pháp luật cho phép, SkillPath không chịu trách nhiệm đối với:</p>
        <ul>
          <li>Thiệt hại gián tiếp, mất dữ liệu hoặc mất cơ hội phát sinh từ việc sử dụng hay không thể sử dụng dịch vụ.</li>
          <li>Tính chính xác của nội dung do giảng viên và người dùng khác đăng tải.</li>
          <li>Kết quả học tập, nghề nghiệp hay thu nhập bạn kỳ vọng đạt được sau khi học.</li>
          <li>Sự cố của bên thứ ba như cổng thanh toán, nhà cung cấp hạ tầng hoặc đường truyền.</li>
        </ul>
        <p>Điều khoản này không loại trừ những trách nhiệm mà pháp luật Việt Nam không cho phép loại trừ.</p>
      </>
    ),
  },
  {
    id: 'cham-dut',
    title: 'Tạm ngưng và chấm dứt tài khoản',
    body: (
      <>
        <p>
          Bạn có thể ngừng sử dụng và yêu cầu xoá tài khoản bất cứ lúc nào bằng cách liên hệ <SupportEmail />. Giảng viên cần hoàn tất
          các khoản đối soát còn dang dở trước khi tài khoản được xoá.
        </p>
        <p>
          Chúng tôi có thể cảnh báo, tạm khoá hoặc chấm dứt tài khoản vi phạm các điều khoản này, tuỳ mức độ. Với vi phạm nghiêm trọng
          (gian lận thanh toán, tấn công hệ thống, vi phạm bản quyền có chủ ý), tài khoản có thể bị khoá ngay và doanh thu liên quan bị
          giữ lại để xử lý khiếu nại.
        </p>
      </>
    ),
  },
  {
    id: 'thay-doi',
    title: 'Thay đổi điều khoản',
    body: (
      <p>
        Chúng tôi có thể cập nhật các điều khoản này khi dịch vụ hoặc quy định pháp luật thay đổi. Ngày cập nhật gần nhất luôn hiển thị
        ở đầu trang. Việc bạn tiếp tục sử dụng dịch vụ sau khi điều khoản thay đổi được xem là chấp nhận nội dung mới.
      </p>
    ),
  },
  {
    id: 'luat',
    title: 'Luật áp dụng và giải quyết tranh chấp',
    body: (
      <p>
        Các điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Tranh chấp phát sinh được ưu tiên giải quyết bằng thương lượng; nếu
        không đạt được thoả thuận, tranh chấp sẽ do cơ quan có thẩm quyền giải quyết theo quy định của pháp luật Việt Nam.
      </p>
    ),
  },
  {
    id: 'lien-he',
    title: 'Liên hệ',
    body: (
      <p>
        Mọi câu hỏi về điều khoản, khiếu nại bản quyền hoặc yêu cầu hỗ trợ, vui lòng gửi tới <SupportEmail />. Chúng tôi phản hồi trong
        vòng 3 ngày làm việc.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Điều khoản sử dụng"
      intro="Các điều khoản dưới đây là thoả thuận giữa bạn và SkillPath về việc sử dụng nền tảng, áp dụng cho cả học viên lẫn giảng viên."
      sections={SECTIONS}
      other={{ href: '/privacy', label: 'Chính sách bảo mật' }}
    />
  );
}
