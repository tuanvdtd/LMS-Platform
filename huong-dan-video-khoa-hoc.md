# Hướng dẫn làm video khoá học (Remotion + edge-tts)

Mục đích: tạo video bài giảng cho đồ án (không thương mại) từ PDF / bài blog, giọng đọc TTS tiếng Việt.

## 1. Cài đặt (làm 1 lần)

Máy đã có: Node v24, npm 11, Python 3.14, Homebrew.
Không cần cài ffmpeg — Remotion v4 tự kèm.

```bash
brew install pipx
pipx ensurepath          # xong mở terminal mới
pipx install edge-tts
```

Kiểm tra:

```bash
edge-tts --list-voices | grep vi-VN
edge-tts --voice vi-VN-HoaiMyNeural --text "Xin chào, đây là bài học đầu tiên" --write-media test.mp3
```

Nghe thử `test.mp3`, chạy được là xong. Xoá file test đi.

Giọng tiếng Việt:
- `vi-VN-HoaiMyNeural` — nữ
- `vi-VN-NamMinhNeural` — nam

## 2. Chuẩn bị nội dung

- File PDF hoặc link / text bài blog cho 1 bài học.
- Chọn giọng nam hay nữ.
- Nội dung lấy của người khác → nhớ ghi nguồn cuối video.

## 3. Nhờ Claude làm

Mở Claude Code trong repo này, gửi:

```
Làm video khoá học từ <đường dẫn PDF hoặc link blog>, giọng <nữ/nam>.
Project Remotion đặt ở video/ trong repo. edge-tts đã cài.
```

Claude sẽ làm theo thứ tự:

1. Tạo project Remotion ở `video/` (lần đầu), thêm `video/out/` và `video/public/audio/` vào `.gitignore`.
2. Đọc nội dung → viết kịch bản chia scene (lời đọc + hình) → **gửi sếp duyệt**.
3. Duyệt xong → sinh audio từng scene bằng edge-tts, khớp thời lượng scene theo audio.
4. Dựng scene bằng Remotion (slide, code, sơ đồ, phụ đề) → render ra `video/out/*.mp4`.

## 4. Lệnh hay dùng (trong thư mục `video/`)

```bash
npx remotion studio      # xem trước, chỉnh trên trình duyệt
npx remotion render      # xuất MP4
```

## 5. Lưu ý

- Remotion miễn phí cho cá nhân; edge-tts dùng thoải mái cho đồ án không bán.
- Font: Google Fonts. Icon: Lucide. Ảnh: Unsplash/Pexels. Nhạc nền: royalty-free.
- Không commit file MP4 / audio vào git (đã ignore).
