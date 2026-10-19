# Course Listing Pages — Overrides

> Áp dụng cho `/courses` (tìm kiếm), `/courses/[l1]`, `/courses/[l1]/[l2]`, `/topic/[slug]`.
> Ghi đè MASTER. Màu/font theo mục "Brand override" của MASTER.

## Bố cục (tham khảo bố cục Udemy, không lấy màu/component)

1. **Nav danh mục con** (trang danh mục): thanh ngang cuộn được, tên danh mục cha đậm + các danh mục con; mục hiện tại có gạch chân primary.
2. **Header**: breadcrumb → H1 → mô tả → ô tìm kiếm lớn. Trang tìm kiếm: H1 = "N kết quả cho “q”".
3. **"Khoá học để bạn bắt đầu"** (danh mục/topic, trang đầu, không lọc): tab Phổ biến nhất / Mới nhất, hàng card cuộn ngang (snap).
4. **Chủ đề / danh mục liên quan**: lưới ô viền mảnh (chỉ khi có dữ liệu thật — danh mục con từ category tree).
5. **"Tất cả khoá học …"**: toolbar (Bộ lọc · Sắp xếp theo · Xoá bộ lọc | N kết quả) → chip lọc → sidebar lọc trái (nhóm thu gọn được) + lưới card phải.

## Lưới & card

- Lưới: 1 cột < 640px, 2 cột ≥ 640px, 3 cột ≥ 1280px (có sidebar).
- Card: ảnh 16:9, tiêu đề 2 dòng cố định chiều cao, giảng viên, rating, meta (thời lượng · số bài · trình độ), chân card giá + CTA căn đáy.
- Chỉ hiện dữ liệu API có. Không badge "Bán chạy"/"Mới"/giá gốc khi API chưa trả.

## Tương tác

- URL là nguồn sự thật: bộ lọc/sort/trang là `<Link>`, tìm kiếm là `<Form>` GET giữ bộ lọc.
- Mobile: nút "Bộ lọc" mở bottom sheet; target chạm ≥ 44px; focus ring rõ.
