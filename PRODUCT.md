# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Người dùng chia thành hai nhóm tài khoản. Theo thứ tự ưu tiên:

- **Học viên:** người học IT. Họ tìm khoá, ghi danh khoá free hoặc mua khoá có phí, rồi học video, làm trắc nghiệm và bài tập lập trình. Họ nhận gợi ý có giải thích lý do và nhận chứng chỉ.
- **Giảng viên:** bất kỳ học viên nào cũng thành giảng viên ngay khi bấm "Trở thành giảng viên". Giảng viên tạo khoá free, soạn quiz và bài code, theo dõi dashboard phân tích. Muốn đặt giá > 0 và nhận doanh thu thì phải là **giảng viên đã xác minh**, tức hồ sơ chuyên môn đã được duyệt và đã có tài khoản ngân hàng.
- **Moderator / Admin:** tài khoản nghiệp vụ do admin cấp, tách riêng khỏi tài khoản cá nhân. Nhóm này không học, không mua, không dạy. Moderator duyệt khoá và hồ sơ xác minh trong danh mục cấp 1 được gán. Admin duyệt mọi hàng đợi, xử lý báo cáo vi phạm và chi trả doanh thu.

Giao diện học viên và giảng viên quan trọng ngang nhau. Giao diện admin và moderator chỉ cần dùng được, rõ ràng.

## Product Purpose

SkillPath là nền tảng thương mại khoá học IT, là sản phẩm của một **đồ án tốt nghiệp**. Nền tảng không tự cung cấp nội dung: người dùng tự đăng khoá của mình, và mọi khoá (cả free lẫn có phí) đều phải được kiểm duyệt trước khi lên catalog.

Thành công nghĩa là buổi demo trước hội đồng chạy trơn tru và thể hiện rõ phần xử lý nghiệp vụ và dữ liệu: chấm bài tự động, gợi ý cá nhân hoá dựa trên năng lực, phân tích học tập cho giảng viên. Hiện chưa có người dùng thật.

## Positioning

Ba điểm khác Udemy, cùng một cơ chế kiểm duyệt:

1. **Đánh giá năng lực tự động:** trắc nghiệm được chấm ngay. Bài code chạy trong sandbox cô lập, trả về Accepted / Wrong Answer / Time Limit / Runtime Error / Compile Error và điểm theo số test đạt. Quiz và bài code trong khoá chỉ chấm điểm bài đó, **không dùng để tính độ thành thạo topic**. Độ thành thạo topic đo bằng **bài đánh giá kỹ năng do nền tảng soạn**: ngân hàng câu hỏi theo topic (admin/moderator soạn, không qua khâu duyệt), câu hỏi thích ứng, chấm bằng Elo.
2. **Gợi ý lộ trình cá nhân hoá, luôn kèm lý do**, ví dụ "Gợi ý vì bạn đạt 35% ở topic React JS". Gợi ý dựa trên năng lực thực tế, không chỉ dựa trên lịch sử mua.
3. **Dashboard phân tích sâu cho giảng viên:** doanh thu, phễu chuyển đổi, giữ chân video, chất lượng câu hỏi, kỹ năng yếu của lớp, học viên có nguy cơ bỏ học.
4. **Kiểm duyệt theo chủ đề:** moderator là chuyên gia theo danh mục, duyệt mọi khoá và hồ sơ xác minh. Người gửi và người duyệt không bao giờ là cùng một người.

## Operating Context

- Học viên: duyệt catalog theo danh mục và topic, mở trang khoá, thanh toán qua giỏ hàng (Stripe Checkout), vào trang học. Trang học có video HLS, quiz, bài code với kết quả chấm trả về dần, ghi chú theo mốc video và hỏi đáp. Ngoài ra còn My learning, hồ sơ kỹ năng, chứng chỉ (PDF có mã QR để xác thực), đơn hàng, thông báo, tin nhắn.
- Giảng viên: dashboard có sidebar, quản lý khoá (thông tin cơ bản, curriculum, mục tiêu, giá, khuyến mãi, bài tập), thư viện video, phân tích (doanh thu, tương tác, đánh giá, học viên), hỏi đáp, tin nhắn, hồ sơ, đơn xác minh. Khoá phải qua checklist mới gửi duyệt được.
- Admin / moderator: hàng đợi duyệt khoá, đơn giảng viên, moderator, chi trả, cài đặt.
- Chế độ dùng: dashboard giảng viên thiết kế cho desktop trước. Toàn bộ trang học viên phải dùng tốt trên mobile. Riêng bài code trên mobile chỉ cần hiện đề bài kèm lời nhắc nên dùng máy tính.

## Capabilities and Constraints

- Frontend `it-course-platform/` (Next.js App Router, React 19, Tailwind, shadcn/base-ui, Recharts, lucide). Backend NestJS `back-end/`. Xác thực bằng Better Auth (cookie session).
- Ngôn ngữ giao diện: **tiếng Việt**, tiền `₫`, ngày `dd/MM/yyyy`. Key, enum và status trong code viết tiếng Anh, tiếng Việt chỉ có ở label.
- Video: HLS 1080/720/480 qua MediaConvert, phát bằng Video.js qua CloudFront có ký. Video dọc và video dưới 720p bị chặn. Asset đang `processing` vẫn gắn vào bài được.
- Gợi ý chia hai giai đoạn. Giai đoạn 1 (đã có): gợi ý theo mục tiêu tự khai và theo nghề, kèm lý do, cùng "Bài cần ôn" trong outline trang học. Bài đánh giá kỹ năng (đã có): 12 câu thích ứng / 15 phút, chấm Elo, nuôi `/skills`; đây là nguồn duy nhất của độ thành thạo topic. Giai đoạn 2 (chưa làm): gợi ý theo lỗ hổng topic dựa trên kết quả bài đánh giá. Giao diện không được hiện % thành thạo suy ra từ quiz hay bài code trong khoá.
- Chưa quyết: gợi ý tầng 3 (collaborative filtering) và tầng 4 (pgvector) trong đề xuất chưa có kế hoạch triển khai.

## Brand Commitments

- Tên sản phẩm: **SkillPath**.
- Giọng văn: tiếng Việt, rõ ràng, trực tiếp. Lý do của mỗi gợi ý phải nói bằng con số hoặc sự kiện cụ thể của chính học viên.

## Evidence on Hand

- Không có học viên thật, lời chứng thực, đối tác hay số liệu thật. Không được bịa testimonial, số người học hay đánh giá sao trên giao diện marketing.
- Tài liệu sản phẩm: `de-xuat-do-an.md` (đề xuất đồ án), `schema-database.md`, `docs/tong-hop-thong-tin.md` (khảo sát Udemy cho giảng viên).
- Dữ liệu demo là dữ liệu seed hoặc giả lập. Phần đánh giá gợi ý dùng học viên giả lập có điểm yếu biết trước, đo bằng Precision@K.

## Product Principles

1. **Năng lực đo được làm trung tâm:** điểm, độ thành thạo và kết quả chấm phải luôn dễ thấy và dễ hiểu, không bị chìm dưới phần thương mại.
2. **Gợi ý phải giải thích được:** gợi ý nào không nói được lý do thì không hiện.
3. **Trạng thái nghiệp vụ minh bạch:** chờ duyệt, bị từ chối kèm lý do, đang xử lý video, chưa xác minh nên chưa đặt giá được. Mỗi trạng thái đều nói rõ bước tiếp theo.
4. **Demo được từ đầu đến cuối:** mỗi luồng chính chạy trọn với dữ liệu seed, không có màn hình chết hay màn hình mock.

## Accessibility & Inclusion

Tương phản WCAG AA, focus ring rõ ràng, điều hướng được bằng bàn phím, icon button có `aria-label`, không truyền đạt thông tin chỉ bằng màu (luôn kèm icon hoặc chữ, ví dụ trạng thái chấm bài và trạng thái duyệt).
