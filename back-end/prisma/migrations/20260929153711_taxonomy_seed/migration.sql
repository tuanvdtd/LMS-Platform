-- ============================================================================
--  Seed taxonomy kiểu Udemy (spec 2026-09-29-udemy-taxonomy-topics §6).
--  Nguồn: menu "Khám phá" của udemy.com (vi) ngày 2026-09-29.
--  Idempotent: chạy lại (prisma db execute --file) không sinh dòng trùng.
-- ============================================================================

-- 1. Xoá cây cũ ở mục 7 của 01_post_migrate.sql. Chỉ chạy khi chưa có khoá nào gắn vào.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM courses c
    JOIN categories cat ON cat.id = c."categoryId"
    JOIN categories p   ON p.id = cat."parentId"
    WHERE p.slug IN ('lap-trinh', 'khoa-hoc-du-lieu', 'cntt-ha-tang')
  ) THEN
    RAISE EXCEPTION 'Còn khoá học gắn vào taxonomy cũ, phải chuyển khoá sang category mới trước';
  END IF;
END $$;

DELETE FROM categories WHERE "parentId" IN
  (SELECT id FROM categories WHERE slug IN ('lap-trinh', 'khoa-hoc-du-lieu', 'cntt-ha-tang'));
DELETE FROM categories WHERE slug IN ('lap-trinh', 'khoa-hoc-du-lieu', 'cntt-ha-tang');

-- 2. Category cấp 1
INSERT INTO categories (id, "parentId", slug, name, position) VALUES
  (gen_random_uuid(), NULL, 'artificial-intelligence', 'Trí tuệ nhân tạo', 1),
  (gen_random_uuid(), NULL, 'development',             'Phát triển',        2),
  (gen_random_uuid(), NULL, 'it-and-software',         'CNTT & Phần mềm',   3),
  (gen_random_uuid(), NULL, 'design',                  'Thiết kế',          4)
ON CONFLICT (slug) DO NOTHING;

-- 3. Category cấp 2 (slug theo udemy.com/courses/<cấp 1>/<cấp 2>)
INSERT INTO categories (id, "parentId", slug, name, position)
SELECT gen_random_uuid(), p.id, s.slug, s.name, s.position
FROM (VALUES
  ('artificial-intelligence', 'ai-fundamentals',        'Nền tảng AI & LLM',                   1),
  ('artificial-intelligence', 'ai-for-developers',      'AI cho Nhà phát triển',               2),
  ('artificial-intelligence', 'machine-learning',       'Học máy & Deep Learning',             3),
  ('artificial-intelligence', 'generative-ai-creative', 'AI tạo sinh cho sáng tạo',            4),
  ('development', 'web-development',       'Phát triển web',                        1),
  ('development', 'data-science',          'Khoa học dữ liệu',                      2),
  ('development', 'mobile-apps',           'Phát triển ứng dụng di động',           3),
  ('development', 'programming-languages', 'Ngôn ngữ lập trình',                    4),
  ('development', 'game-development',      'Phát triển trò chơi',                   5),
  ('development', 'databases',             'Thiết kế & Phát triển cơ sở dữ liệu',   6),
  ('development', 'software-testing',      'Kiểm thử phần mềm',                     7),
  ('development', 'software-engineering',  'Kỹ thuật phần mềm',                     8),
  ('development', 'development-tools',     'Công cụ phát triển phần mềm',           9),
  ('development', 'no-code-development',   'Phát triển không cần lập trình',       10),
  ('it-and-software', 'it-certification',      'Chứng chỉ CNTT',          1),
  ('it-and-software', 'network-and-security',  'Mạng & Bảo mật',          2),
  ('it-and-software', 'hardware',              'Phần cứng',               3),
  ('it-and-software', 'operating-systems',     'Hệ điều hành & Máy chủ',  4),
  ('it-and-software', 'other-it-and-software', 'CNTT & Phần mềm khác',    5),
  ('design', 'web-design',                      'Thiết kế web',                     1),
  ('design', 'graphic-design-and-illustration', 'Thiết kế & Minh hoạ đồ hoạ',       2),
  ('design', 'design-tools',                    'Công cụ thiết kế',                 3),
  ('design', 'user-experience',                 'Thiết kế trải nghiệm người dùng',  4),
  ('design', 'game-design',                     'Thiết kế trò chơi',                5),
  ('design', '3d-and-animation',                '3D & Hoạt hình',                   6)
) AS s(parent_slug, slug, name, position)
JOIN categories p ON p.slug = s.parent_slug
ON CONFLICT (slug) DO NOTHING;

-- 4. Topic (slug theo udemy.com/topic/<slug>; nhóm theo nhánh chỉ để dễ đọc)
INSERT INTO topics (id, slug, name)
SELECT gen_random_uuid(), t.slug, t.name
FROM (VALUES
  -- AI (27)
  ('prompt-engineering',             'Kỹ thuật tạo lệnh'),
  ('large-language-models',          'Mô hình ngôn ngữ lớn (LLM)'),
  ('generative-ai',                  'AI tạo sinh (GenAI)'),
  ('ai-agents',                      'Tác nhân AI & Agentic AI'),
  ('artificial-intelligence',        'Trí tuệ nhân tạo (AI)'),
  ('chatgpt',                        'ChatGPT'),
  ('claude-ai',                      'Claude AI'),
  ('claude-code',                    'Claude Code'),
  ('google-gemini',                  'Google Gemini'),
  ('microsoft-copilot',              'Microsoft Copilot'),
  ('deepseek',                       'DeepSeek'),
  ('openai-api',                     'OpenAI API'),
  ('github-copilot',                 'GitHub Copilot'),
  ('openai-codex',                   'OpenAI Codex'),
  ('retrieval-augmented-generation', 'Tối ưu hóa tăng cường truy xuất (RAG)'),
  ('langchain',                      'LangChain'),
  ('springai',                       'Spring AI'),
  ('machine-learning',               'Học máy'),
  ('deep-learning',                  'Học sâu'),
  ('tensorflow',                     'TensorFlow'),
  ('pytorch',                        'PyTorch'),
  ('mlops',                          'MLOps'),
  ('azure-machine-learning',         'Azure Machine Learning'),
  ('midjourney',                     'Midjourney'),
  ('stable-diffusion',               'Stable Diffusion'),
  ('dall-e',                         'DALL·E'),
  ('vibe-coding',                    'Vibe Coding'),
  -- Web (11)
  ('html',            'HTML'),
  ('css',             'CSS'),
  ('javascript',      'JavaScript'),
  ('typescript',      'TypeScript'),
  ('react',           'React JS'),
  ('angular',         'Angular'),
  ('nextjs',          'Next.js'),
  ('nodejs',          'Node.Js'),
  ('fastapi',         'FastAPI'),
  ('aspnet-core',     'ASP.NET Core'),
  ('web-development', 'Phát triển web'),
  -- Mobile (9)
  ('google-flutter',            'Google Flutter'),
  ('dart-programming-language', 'Dart (ngôn ngữ lập trình)'),
  ('react-native',              'React Native'),
  ('ios-development',           'Phát triển ứng dụng cho iOS'),
  ('swift',                     'Swift'),
  ('swiftui',                   'SwiftUI'),
  ('android-development',       'Phát triển Android'),
  ('kotlin',                    'Kotlin'),
  ('mobile-development',        'Phát triển ứng dụng mobile'),
  -- Ngôn ngữ lập trình (8)
  ('python',                  'Python'),
  ('java',                    'Java'),
  ('c-sharp',                 'C# (ngôn ngữ lập trình)'),
  ('c-plus-plus',             'C++ (ngôn ngữ lập trình)'),
  ('c-programming',           'C (ngôn ngữ lập trình)'),
  ('go-programming-language', 'Go (ngôn ngữ lập trình)'),
  ('python-scripting',        'Ngôn ngữ kịch bản Python'),
  ('spring-framework',        'Spring Framework'),
  -- Dữ liệu (5)
  ('data-science',     'Khoa học dữ liệu'),
  ('data-analysis',    'Phân tích dữ liệu'),
  ('pandas',           'Pandas'),
  ('data-engineering', 'Kỹ thuật dữ liệu'),
  ('apache-kafka',     'Apache Kafka'),
  -- Game (7)
  ('unity',                    'Unity'),
  ('unreal-engine',            'Unreal Engine'),
  ('unreal-engine-blueprints', 'Unreal Engine Blueprints'),
  ('godot',                    'Godot'),
  ('game-development',         'Nguyên tắc cơ bản về phát triển trò chơi'),
  ('2d-game-development',      'Phát triển trò chơi 2D'),
  ('3d-game-development',      'Phát triển trò chơi 3D'),
  -- Cơ sở dữ liệu (7)
  ('sql',                 'SQL'),
  ('mysql',               'MySQL'),
  ('postgresql',          'PostgreSQL'),
  ('sql-server',          'SQL Server'),
  ('oracle-sql',          'Oracle SQL'),
  ('plsql',               'PL/SQL'),
  ('database-management', 'Hệ thống quản lý cơ sở dữ liệu (DBMS)'),
  -- Kiểm thử (6)
  ('automation-testing',                           'Kiểm tra tự động hóa'),
  ('playwright',                                   'Microsoft Playwright'),
  ('selenium-webdriver',                           'Selenium WebDriver'),
  ('pytest',                                       'pytest'),
  ('postman',                                      'Postman'),
  ('istqb-certified-tester-foundation-level-ctfl', 'Chứng chỉ CTFL của ISTQB'),
  -- Kỹ thuật phần mềm (4)
  ('software-architecture',  'Kiến trúc phần mềm'),
  ('data-structures',        'Cấu trúc dữ liệu'),
  ('algorithms',             'Thuật toán'),
  ('system-design-interview','Phỏng vấn thiết kế hệ thống'),
  -- Công cụ (5)
  ('git',        'Git'),
  ('github',     'GitHub'),
  ('docker',     'Docker'),
  ('kubernetes', 'Kubernetes'),
  ('devops',     'DevOps (Phát triển và vận hành)'),
  -- No-code (4)
  ('n8n',                'n8n'),
  ('wordpress',          'WordPress'),
  ('microsoft-powerapps','Microsoft Power Apps'),
  ('microsoft-flow',     'Microsoft Power Automate'),
  -- Chứng chỉ (10)
  ('amazon-aws',                                     'Amazon AWS'),
  ('aws-certified-cloud-practitioner',               'Chứng chỉ AWS Certified Cloud Practitioner'),
  ('aws-certified-solutions-architect-associate',    'Chứng chỉ AWS Certified Solutions Architect - Associate'),
  ('aws-certified-ai-practitioner',                  'AWS Certified AI Practitioner'),
  ('certified-kubernetes-application-developer-ckad','Chứng chỉ nhà phát triển ứng dụng Kubernetes (CKAD)'),
  ('comptia-a',                                      'CompTIA A+'),
  ('comptia-network',                                'CompTIA Network+'),
  ('comptia-security',                               'CompTIA Security+'),
  ('cisco-ccna',                                     'Chứng chỉ mạng Cisco (CCNA) cấp hội viên'),
  ('cc-certified-in-cybersecurity',                  'Chứng chỉ an ninh mạng (CC)'),
  -- Mạng & Bảo mật (8)
  ('cyber-security',             'An ninh mạng'),
  ('ethical-hacking',            'Tấn công có đạo đức'),
  ('network-security',           'Bảo mật mạng'),
  ('it-networking-fundamentals', 'Nền tảng căn bản về mạng CNTT'),
  ('information-security',       'Bảo mật thông tin'),
  ('it-audit',                   'Kiểm toán CNTT'),
  ('fortigate',                  'FortiGate'),
  ('ai-security',                'Bảo mật AI'),
  -- Phần cứng (9)
  ('embedded-systems',           'Hệ thống nhúng'),
  ('embedded-c',                 'Ngôn ngữ C nhúng'),
  ('microcontroller',            'Vi điều khiển'),
  ('arduino',                    'Arduino'),
  ('electronics',                'Điện tử'),
  ('plc',                        'PLC (Thiết bị điều khiển lập trình được)'),
  ('kicad',                      'KiCad'),
  ('circuit-design',             'Thiết kế bảng mạch in'),
  ('robotic-process-automation', 'Tự động hóa quy trình bằng robot (RPA)'),
  -- Hệ điều hành & Máy chủ (8)
  ('linux',                 'Linux'),
  ('linux-administration',  'Quản trị Linux'),
  ('windows-server',        'Windows Server'),
  ('system-administration', 'Quản trị hệ thống'),
  ('active-directory',      'Active Directory'),
  ('powershell',            'PowerShell'),
  ('shell-scripting',       'Shell Scripting'),
  ('proxmox-ve',            'Proxmox VE'),
  -- Thiết kế (31)
  ('figma',                 'Figma'),
  ('canva',                 'Canva'),
  ('user-experience-design','Thiết kế trải nghiệm người dùng (UX)'),
  ('user-interface',        'Thiết kế giao diện người dùng'),
  ('mobile-app-design',     'Thiết kế ứng dụng mobile'),
  ('ux-writing',            'Viết nội dung trải nghiệm người dùng (UX)'),
  ('web-accessibility',     'Khả năng truy cập web'),
  ('product-design',        'Thiết kế sản phẩm'),
  ('design-thinking',       'Tư duy thiết kế'),
  ('elementor',             'Elementor'),
  ('graphic-design',        'Thiết kế đồ họa'),
  ('drawing',               'Vẽ'),
  ('adobe-illustrator',     'Adobe Illustrator'),
  ('photoshop',             'Adobe Photoshop'),
  ('indesign',              'Adobe InDesign'),
  ('procreate-ipad-app',    'Procreate'),
  ('affinity-designer',     'Affinity Designer'),
  ('digital-painting',      'Tranh kỹ thuật số'),
  ('pixel-art',             'Nghệ thuật pixel'),
  ('game-texturing',        'Tạo chất liệu trò chơi'),
  ('vfx-visual-effects',    'Hiệu ứng hình ảnh (VFX)'),
  ('blender',               'Blender'),
  ('3d-modeling',           'Dựng mô hình 3D'),
  ('3d-animation',          'Hoạt hình 3D'),
  ('3d-sculpting',          'Điêu khắc 3D'),
  ('3d-printing',           'In 3D'),
  ('fusion-360',            'Autodesk Fusion'),
  ('after-effects',         'Adobe After Effects'),
  ('motion-graphics',       'Đồ họa chuyển động'),
  ('autocad',               'AutoCAD'),
  ('solidworks',            'SOLIDWORKS')
) AS t(slug, name)
ON CONFLICT (slug) DO NOTHING;

-- 5. Cạnh tiên quyết (topic, topic tiên quyết của nó).
-- Quy ước cột của bảng ẩn Prisma: "A" = topic, "B" = topic tiên quyết.
-- Test "cạnh tiên quyết đúng chiều" kiểm quy ước này qua Topic.prerequisites.
INSERT INTO "_TopicPrereq" ("A", "B")
SELECT a.id, b.id
FROM (VALUES
  ('css', 'html'), ('javascript', 'css'), ('typescript', 'javascript'),
  ('react', 'javascript'), ('nextjs', 'react'), ('nodejs', 'javascript'),
  ('data-analysis', 'python'), ('machine-learning', 'data-analysis'),
  ('deep-learning', 'machine-learning'),
  ('langchain', 'large-language-models'), ('retrieval-augmented-generation', 'large-language-models'),
  ('postgresql', 'sql'), ('mysql', 'sql'),
  ('docker', 'linux'), ('kubernetes', 'docker'),
  ('github', 'git'), ('react-native', 'react')
) AS e(topic, requires)
JOIN topics a ON a.slug = e.topic
JOIN topics b ON b.slug = e.requires
ON CONFLICT DO NOTHING;
