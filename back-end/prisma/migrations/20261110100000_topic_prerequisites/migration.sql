-- ============================================================================
--  Bổ sung đồ thị topic tiên quyết.
--  Idempotent: chạy lại (prisma db execute --file) không sinh dòng trùng.
--  Quy ước cột của bảng ẩn Prisma: "A" = topic, "B" = topic tiên quyết.
--  Chỉ khai cạnh "thiếu thì gần như không học nổi": gợi ý theo lỗ hổng chuyển
--  hướng về topic tiên quyết đang hụt, nên cạnh lỏng lẻo sẽ đẩy học viên đi sai chỗ.
--  Nội dung file này được chép nguyên vào migration 20261110100000_topic_prerequisites.
-- ============================================================================

-- JavaScript không cần CSS (người học Node.js không dùng tới); cần HTML là đủ.
DELETE FROM "_TopicPrereq" e
USING topics a, topics b
WHERE e."A" = a.id AND e."B" = b.id AND a.slug = 'javascript' AND b.slug = 'css';

INSERT INTO "_TopicPrereq" ("A", "B")
SELECT a.id, b.id
FROM (VALUES
  ('javascript', 'html'),
  -- Web
  ('angular', 'typescript'), ('fastapi', 'python'), ('aspnet-core', 'c-sharp'),
  ('web-accessibility', 'html'),
  -- Mobile
  ('google-flutter', 'dart-programming-language'), ('swiftui', 'swift'),
  ('ios-development', 'swift'), ('android-development', 'kotlin'),
  -- Ngôn ngữ
  ('spring-framework', 'java'), ('python-scripting', 'python'),
  -- AI
  ('ai-agents', 'large-language-models'),
  ('springai', 'large-language-models'), ('springai', 'spring-framework'),
  ('tensorflow', 'machine-learning'), ('pytorch', 'machine-learning'),
  ('azure-machine-learning', 'machine-learning'),
  ('mlops', 'machine-learning'), ('mlops', 'docker'),
  -- Dữ liệu
  ('pandas', 'python'), ('data-science', 'python'),
  ('data-engineering', 'python'), ('data-engineering', 'sql'),
  -- Cơ sở dữ liệu
  ('sql-server', 'sql'), ('oracle-sql', 'sql'), ('plsql', 'oracle-sql'),
  -- Game
  ('unity', 'c-sharp'), ('unreal-engine-blueprints', 'unreal-engine'),
  -- Kiểm thử, kỹ thuật phần mềm
  ('pytest', 'python'), ('algorithms', 'data-structures'),
  -- Chứng chỉ
  ('certified-kubernetes-application-developer-ckad', 'kubernetes'),
  ('aws-certified-solutions-architect-associate', 'amazon-aws'),
  ('cisco-ccna', 'it-networking-fundamentals'),
  -- Mạng & bảo mật
  ('network-security', 'it-networking-fundamentals'), ('fortigate', 'network-security'),
  ('ethical-hacking', 'it-networking-fundamentals'), ('ethical-hacking', 'linux'),
  ('it-audit', 'information-security'),
  -- Phần cứng
  ('embedded-c', 'c-programming'), ('embedded-systems', 'c-programming'),
  ('microcontroller', 'electronics'), ('circuit-design', 'electronics'), ('kicad', 'electronics'),
  -- Hệ điều hành
  ('linux-administration', 'linux'), ('shell-scripting', 'linux'), ('proxmox-ve', 'linux'),
  ('active-directory', 'windows-server'),
  -- No-code, thiết kế
  ('elementor', 'wordpress'),
  ('3d-animation', '3d-modeling'), ('game-texturing', '3d-modeling'),
  ('mobile-app-design', 'user-interface'),
  ('ux-writing', 'user-experience-design'),
  ('digital-painting', 'drawing')
) AS e(topic, requires)
JOIN topics a ON a.slug = e.topic
JOIN topics b ON b.slug = e.requires
ON CONFLICT DO NOTHING;
