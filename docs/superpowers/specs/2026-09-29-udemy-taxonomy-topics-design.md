# Taxonomy kiểu Udemy: Category 2 cấp + Topic, bỏ tag câu hỏi

Ngày: 2026-09-29 · Trạng thái: đã duyệt thiết kế, chờ review spec

## 1. Bối cảnh & mục tiêu

Hiện tại: `categories` 2 cấp tự đặt (Lập trình / Khoa học dữ liệu / CNTT & Hạ tầng), `skills` mịn
(`react-hooks`) và **mỗi câu hỏi gắn tag kỹ năng** (`question_skills`). Giảng viên phải tag từng câu,
còn cây danh mục không khớp Udemy.

Mục tiêu:
- Cây danh mục giống Udemy: **Category cấp 1 → Category cấp 2 → Topic**. Topic là bảng riêng, một
  topic xuất hiện ở nhiều nhánh cấp 2 (Python nằm ở cả Khoa học dữ liệu lẫn Ngôn ngữ lập trình).
- **Bỏ tag câu hỏi.** Tag chuyển lên cấp quiz, nên hồ sơ năng lực và gợi ý tầng 2 (§3.3, §3.4 đề xuất
  đồ án) vẫn chạy được, ở độ mịn topic.

Dữ liệu tham chiếu lấy từ menu "Khám phá" của udemy.com (bản tiếng Việt) ngày 2026-09-29.

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| D1 | Tag ở **cấp quiz** (`quiz_topics`), bỏ `question_skills` | Giảng viên không phải tag từng câu. Mastery vẫn có nguồn dữ liệu |
| D2 | **AI là category cấp 1 thật**, không làm khối "Khám phá theo mục tiêu" | Không thêm bảng. Phần AI/LLM chuyển khỏi Khoa học dữ liệu để hai nhánh không trùng |
| D3 | **Gộp Skill = Topic**: đổi tên `skills` → `topics`, không có tầng kỹ năng con | Chỉ một bộ phân loại. Tag đã ở cấp quiz nên tầng con không có ai dùng |
| D4 | Menu "Chủ đề phổ biến" của mỗi cấp 2 được **tính ra** từ khoá đã duyệt (approved), không lưu bảng | Không có dữ liệu bị lệch với thực tế |

Đảo lại quyết định cũ trong `schema-database.md` ("Không có tầng topic của Udemy"): tầng topic giờ
**thay hẳn** skill chứ không chồng thêm một tầng, nên lý do "khái niệm thứ ba chồng lấn" không còn đúng.

## 3. Data model

### 3.1 Category (giữ nguyên bảng)
Không đổi cột. Trigger giới hạn 2 cấp và CHECK không tự tham chiếu giữ nguyên. Khoá học vẫn gắn vào
node cấp 2 (`courses.categoryId`).

### 3.2 Đổi tên skill → topic

| Cũ | Mới | Thay đổi cột |
|---|---|---|
| `skills` (`Skill`) | `topics` (`Topic`) | Bỏ `track` |
| `_SkillPrereq` | `_TopicPrereq` | — |
| `course_skills` (`CourseSkill`) | `course_topics` (`CourseTopic`) | Bỏ `weight`, thêm `isPrimary Boolean @default(false)` |
| `exercise_skills` | `exercise_topics` | `skillId` → `topicId` |
| `user_skill_mastery` | `user_topic_mastery` | `skillId` → `topicId`, bỏ `correctCount` |
| `user_target_skills` | `user_target_topics` | `skillId` → `topicId` |
| `question_skills` | **xoá** | — |
| — | `quiz_topics(quizId, topicId)` (mới) | PK `(quizId, topicId)`, index `topicId` |

Relation field đổi theo: `Course.skills` → `topics`, `Quiz.topics` (mới), `Exercise.skills` → `topics`,
`User.skillMastery` → `topicMastery`, `User.targetSkills` → `targetTopics`, `Question.skills` bỏ.

Enum `Track` **giữ nguyên** vì `users.targetTrack` và `courses.track` vẫn dùng. Chip "Phổ biến với học
viên như bạn" ở onboarding trước đây lọc theo `skills.track`, giờ lấy các topic của khoá có
`courses.track = users.targetTrack`.

### 3.3 Ràng buộc

| Ràng buộc | Đặt ở đâu |
|---|---|
| Mỗi khoá tối đa 1 topic chính: `CREATE UNIQUE INDEX uq_course_primary_topic ON course_topics ("courseId") WHERE "isPrimary"` | `01_post_migrate.sql` |
| Khoá phải có đúng 1 topic chính **khi publish** | service publish (module khoá học, làm sau) |
| Quiz/bài tập có 1–3 topic, và chỉ được chọn trong `course_topics` của khoá | service quiz/exercise (làm sau) |
| `score` trong khoảng 0..1 (`chk_mastery_score`) | giữ, chuyển sang bảng `user_topic_mastery` |
| Topic không tiên quyết chính nó (`chk_topic_not_self_prereq` trên `_TopicPrereq`) | đổi tên |
| Index trigram cho ô tìm topic: `idx_topics_name_trgm` | đổi tên |

## 4. Tính mastery (hợp đồng cho module mastery, chưa code trong spec này)

Kích hoạt khi có sự kiện `quiz.submitted` hoặc `submission.graded`.

```
s = scorePct / 100                 -- quiz
s = score / totalPoints            -- bài tập lập trình
với mỗi topic của quiz/bài tập:
  score = attemptsCount == 0 ? s : 0.7 * score + 0.3 * s
  attemptsCount += 1; lastEvaluatedAt = now()
```

- Dùng EMA thay vì trung bình cộng, để điểm lên nhanh khi học viên ôn lại và làm tốt hơn.
- Ngưỡng yếu `score < 0.6` và logic gợi ý tầng 2 (§3.4) giữ nguyên, chỉ đổi `skill_id` thành `topic_id`.
- Giới hạn đã biết: quiz phủ nhiều topic thì mọi topic nhận cùng một điểm. Muốn tách thì chia quiz nhỏ theo topic.
- `stat_questions` (độ khó, độ phân biệt từng câu) không đổi, vì không cần tag.

## 5. Menu "Chủ đề phổ biến" (query, không có bảng)

```sql
SELECT ct."topicId", sum(c."enrollmentCount") AS score
FROM courses c
JOIN course_topics ct ON ct."courseId" = c.id
WHERE c."categoryId" = $1 AND c.status = 'approved'
GROUP BY ct."topicId" ORDER BY score DESC LIMIT 9;
```
(`courses.enrollmentCount` là cột denormalized đã có sẵn.) Menu trống cho tới khi có khoá đã duyệt (approved).
Seed khoá demo nằm ngoài phạm vi.

## 6. Seed taxonomy (thay mục 7 của `01_post_migrate.sql`)

Xoá 3 nhánh cũ (`lap-trinh`, `khoa-hoc-du-lieu`, `cntt-ha-tang` cùng các con). Việc này an toàn vì chưa
có khoá nào tham chiếu tới chúng. Mọi INSERT dùng `ON CONFLICT (slug) DO NOTHING`. `categories.slug` là
unique toàn cục nên slug cấp 2 không được trùng nhau.

### 6.1 Category (4 cấp 1, 25 cấp 2)

**Trí tuệ nhân tạo** `artificial-intelligence`
- `ai-fundamentals` Nền tảng AI & LLM
- `ai-for-developers` AI cho Nhà phát triển
- `machine-learning` Học máy & Deep Learning
- `generative-ai-creative` AI tạo sinh cho sáng tạo

**Phát triển** `development`
- `web-development` Phát triển web
- `data-science` Khoa học dữ liệu
- `mobile-apps` Phát triển ứng dụng di động
- `programming-languages` Ngôn ngữ lập trình
- `game-development` Phát triển trò chơi
- `databases` Thiết kế & Phát triển cơ sở dữ liệu
- `software-testing` Kiểm thử phần mềm
- `software-engineering` Kỹ thuật phần mềm
- `development-tools` Công cụ phát triển phần mềm
- `no-code-development` Phát triển không cần lập trình

**CNTT & Phần mềm** `it-and-software`
- `it-certification` Chứng chỉ CNTT
- `network-and-security` Mạng & Bảo mật
- `hardware` Phần cứng
- `operating-systems` Hệ điều hành & Máy chủ
- `other-it-and-software` CNTT & Phần mềm khác

**Thiết kế** `design`
- `web-design` Thiết kế web
- `graphic-design-and-illustration` Thiết kế & Minh hoạ đồ hoạ
- `design-tools` Công cụ thiết kế
- `user-experience` Thiết kế trải nghiệm người dùng
- `game-design` Thiết kế trò chơi
- `3d-and-animation` 3D & Hoạt hình

Thời trang, Kiến trúc, Nội thất và Thiết kế khác bị bỏ vì ngoài mảng IT.

### 6.2 Topic (slug theo Udemy, nhóm theo nhánh để dễ đọc; bảng `topics` phẳng, không có cột nhánh)

- **AI:** prompt-engineering, large-language-models, generative-ai, ai-agents, artificial-intelligence,
  chatgpt, claude-ai, claude-code, google-gemini, microsoft-copilot, deepseek, openai-api, github-copilot,
  openai-codex, retrieval-augmented-generation, langchain, springai, machine-learning, deep-learning,
  tensorflow, pytorch, mlops, azure-machine-learning, midjourney, stable-diffusion, dall-e, vibe-coding
- **Web:** html, css, javascript, typescript, react, angular, nextjs, nodejs, fastapi, aspnet-core, web-development
- **Mobile:** google-flutter, dart-programming-language, react-native, ios-development, swift, swiftui,
  android-development, kotlin, mobile-development
- **Ngôn ngữ:** python, java, c-sharp, c-plus-plus, c-programming, go-programming-language, python-scripting,
  spring-framework
- **Data:** data-science, data-analysis, pandas, data-engineering, apache-kafka
- **Game:** unity, unreal-engine, unreal-engine-blueprints, godot, game-development, 2d-game-development,
  3d-game-development
- **CSDL:** sql, mysql, postgresql, sql-server, oracle-sql, plsql, database-management
- **Kiểm thử:** automation-testing, playwright, selenium-webdriver, pytest, postman,
  istqb-certified-tester-foundation-level-ctfl
- **Kỹ thuật PM:** software-architecture, data-structures, algorithms, system-design-interview
- **Công cụ:** git, github, docker, kubernetes, devops
- **No-code:** n8n, wordpress, microsoft-powerapps, microsoft-flow
- **Chứng chỉ:** amazon-aws, aws-certified-cloud-practitioner, aws-certified-solutions-architect-associate,
  aws-certified-ai-practitioner, certified-kubernetes-application-developer-ckad, comptia-a,
  comptia-network, comptia-security, cisco-ccna, cc-certified-in-cybersecurity
- **Mạng & Bảo mật:** cyber-security, ethical-hacking, network-security, it-networking-fundamentals,
  information-security, it-audit, fortigate, ai-security
- **Phần cứng:** embedded-systems, embedded-c, microcontroller, arduino, electronics, plc, kicad,
  circuit-design, robotic-process-automation
- **HĐH:** linux, linux-administration, windows-server, system-administration, active-directory,
  powershell, shell-scripting, proxmox-ve
- **Thiết kế:** figma, canva, user-experience-design, user-interface, mobile-app-design, ux-writing,
  web-accessibility, product-design, design-thinking, elementor, graphic-design, drawing,
  adobe-illustrator, photoshop, indesign, procreate-ipad-app, affinity-designer, digital-painting,
  pixel-art, game-texturing, vfx-visual-effects, blender, 3d-modeling, 3d-animation, 3d-sculpting,
  3d-printing, fusion-360, after-effects, motion-graphics, autocad, solidworks

Tên tiếng Việt lấy đúng như Udemy hiển thị (ví dụ `machine-learning` → "Học máy",
`prompt-engineering` → "Kỹ thuật tạo lệnh"). Một số slug như `nextjs`, `pandas`, `dall-e` và
`retrieval-augmented-generation` không có trong URL em đã thu được, nên lúc seed phải đối chiếu lại với
`udemy.com/topic/<slug>`.

### 6.3 Cạnh tiên quyết khởi đầu
`html → css → javascript → typescript`, `javascript → react → nextjs`, `react → react-native`, `javascript → nodejs`,
`python → data-analysis → machine-learning → deep-learning`, `large-language-models → langchain`,
`large-language-models → retrieval-augmented-generation`, `sql → postgresql`, `sql → mysql`,
`linux → docker → kubernetes`, `git → github`.

## 7. Migration

1. Sửa `schema.prisma` theo §3. Tạo migration mới `taxonomy_topics`, **không** sửa `init`.
   Prisma sẽ sinh DROP + CREATE cho bảng đổi tên. Các bảng skill hiện rỗng nên chấp nhận được, nhưng
   phải xem lại file SQL sinh ra trước khi apply.
2. `01_post_migrate.sql` đã được dán vào migration `init` nên không sửa được nữa. Phần SQL bổ sung mới
   (constraint và index ở §3.3, seed ở §6) nằm trong `prisma/sql/03_taxonomy_topics.sql` và
   `prisma/sql/04_taxonomy_seed.sql`, rồi dán vào migration mới theo đúng cách làm với 01. Ở 01, thêm
   ghi chú trỏ sang 03/04 tại các dòng về skill và mục 7.
3. Cập nhật tài liệu: `schema-database.md` (nhóm 6, 7, 8, sơ đồ quan hệ, luồng hồ sơ năng lực, bỏ
   dòng "Không có tầng topic") và `de-xuat-do-an.md` dòng 46 ("mỗi câu gắn tag kỹ năng" → "mỗi quiz gắn topic").

## 8. Kiểm thử (SQL thật trên DB dev)

- Thêm 2 dòng `isPrimary = true` cho cùng một khoá → lỗi unique
- Thêm category có cha đã là cấp 2 → trigger chặn
- Topic tiên quyết chính nó → CHECK chặn
- Chạy seed 2 lần → số dòng `categories` và `topics` không đổi
- `prisma migrate dev`, `prisma generate`, `tsc --noEmit` sạch; grep `Skill`/`skill_` trong `back-end/src`
  và `prisma/` không còn sót (trừ `SkillLevel` và thương hiệu SkillPath)

## 9. Ngoài phạm vi

- Module quiz, exercise, mastery, publish khoá (chỉ ghi hợp đồng ở §3.3 và §4)
- API và UI menu "Khám phá"
- Seed khoá demo
- Khối "Khám phá theo mục tiêu" kiểu Udemy
- Giảng viên tự tạo topic (hiện chỉ admin quản lý)
