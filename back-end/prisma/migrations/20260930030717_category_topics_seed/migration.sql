-- ============================================================================
--  Seed "Các chủ đề phổ biến" cho category cấp 2 (spec 2026-09-30-explore-menu §3.2).
--  Chọn tay từ topic đã seed ở taxonomy_seed, bám menu Khám phá của udemy.com (vi).
--  Idempotent: ON CONFLICT DO NOTHING. Slug sai → JOIN loại dòng, test đếm 185 sẽ bắt.
--  Thứ tự trong mảng = position (1-based).
-- ============================================================================
INSERT INTO category_topics ("categoryId", "topicId", position)
SELECT c.id, t.id, u.position
FROM (VALUES
  ('ai-fundamentals',        ARRAY['prompt-engineering','large-language-models','generative-ai','artificial-intelligence','chatgpt','claude-ai','google-gemini','microsoft-copilot','deepseek']),
  ('ai-for-developers',      ARRAY['ai-agents','openai-api','claude-code','github-copilot','openai-codex','retrieval-augmented-generation','langchain','springai','vibe-coding']),
  ('machine-learning',       ARRAY['machine-learning','deep-learning','tensorflow','pytorch','mlops','azure-machine-learning','data-science','python']),
  ('generative-ai-creative', ARRAY['midjourney','stable-diffusion','dall-e','generative-ai']),
  ('web-development',        ARRAY['javascript','angular','react','typescript','fastapi','aspnet-core','html','nodejs','nextjs']),
  ('data-science',           ARRAY['data-science','python','machine-learning','deep-learning','data-analysis','pandas','data-engineering','apache-kafka','sql']),
  ('mobile-apps',            ARRAY['google-flutter','react-native','ios-development','swift','swiftui','android-development','kotlin','dart-programming-language','mobile-development']),
  ('programming-languages',  ARRAY['python','java','c-sharp','javascript','c-plus-plus','c-programming','go-programming-language','python-scripting','spring-framework']),
  ('game-development',       ARRAY['unity','unreal-engine','unreal-engine-blueprints','godot','game-development','2d-game-development','3d-game-development','c-sharp','blender']),
  ('databases',              ARRAY['sql','mysql','postgresql','sql-server','oracle-sql','plsql','database-management']),
  ('software-testing',       ARRAY['automation-testing','playwright','selenium-webdriver','pytest','postman','istqb-certified-tester-foundation-level-ctfl']),
  ('software-engineering',   ARRAY['software-architecture','data-structures','algorithms','system-design-interview']),
  ('development-tools',      ARRAY['git','github','docker','kubernetes','devops']),
  ('no-code-development',    ARRAY['n8n','wordpress','microsoft-powerapps','microsoft-flow']),
  ('it-certification',       ARRAY['amazon-aws','aws-certified-cloud-practitioner','aws-certified-solutions-architect-associate','aws-certified-ai-practitioner','certified-kubernetes-application-developer-ckad','comptia-a','comptia-network','comptia-security','cisco-ccna']),
  ('network-and-security',   ARRAY['cyber-security','ethical-hacking','network-security','it-networking-fundamentals','information-security','it-audit','fortigate','ai-security','cc-certified-in-cybersecurity']),
  ('hardware',               ARRAY['embedded-systems','embedded-c','microcontroller','arduino','electronics','plc','kicad','circuit-design','robotic-process-automation']),
  ('operating-systems',      ARRAY['linux','linux-administration','windows-server','system-administration','active-directory','powershell','shell-scripting','proxmox-ve']),
  ('web-design',             ARRAY['figma','web-accessibility','elementor','wordpress','user-interface','css','html']),
  ('graphic-design-and-illustration', ARRAY['graphic-design','drawing','adobe-illustrator','photoshop','indesign','procreate-ipad-app','affinity-designer','digital-painting','canva']),
  ('design-tools',           ARRAY['figma','canva','photoshop','adobe-illustrator','autocad','solidworks','fusion-360','after-effects','blender']),
  ('user-experience',        ARRAY['user-experience-design','user-interface','mobile-app-design','ux-writing','web-accessibility','product-design','design-thinking','figma']),
  ('game-design',            ARRAY['pixel-art','game-texturing','unity','unreal-engine','blender','3d-modeling','godot']),
  ('3d-and-animation',       ARRAY['blender','3d-modeling','3d-animation','3d-sculpting','3d-printing','after-effects','motion-graphics','vfx-visual-effects','fusion-360'])
) AS s(category_slug, topic_slugs)
CROSS JOIN LATERAL unnest(s.topic_slugs) WITH ORDINALITY AS u(topic_slug, position)
JOIN categories c ON c.slug = s.category_slug AND c."parentId" IS NOT NULL
JOIN topics t ON t.slug = u.topic_slug
ON CONFLICT ("categoryId", "topicId") DO NOTHING;
