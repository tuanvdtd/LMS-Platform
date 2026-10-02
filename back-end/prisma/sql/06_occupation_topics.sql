-- ============================================================================
--  Seed nghề → topic phổ biến (spec 2026-10-02-personalize-occupation §3.3).
--  Idempotent. Slug không có trong topics thì tự rơi khỏi JOIN.
--  Nội dung file này được chép nguyên vào migration <t2>_occupation_topics_seed.
-- ============================================================================

INSERT INTO occupation_topics (occupation, "topicId", position)
SELECT v.occupation::"Occupation", t.id, v.position
FROM (VALUES
  ('frontend_developer', 'html', 1),
  ('frontend_developer', 'css', 2),
  ('frontend_developer', 'javascript', 3),
  ('frontend_developer', 'typescript', 4),
  ('frontend_developer', 'react', 5),
  ('frontend_developer', 'nextjs', 6),
  ('frontend_developer', 'angular', 7),
  ('frontend_developer', 'web-development', 8),
  ('frontend_developer', 'git', 9),
  ('frontend_developer', 'user-interface', 10),
  ('backend_developer', 'nodejs', 1),
  ('backend_developer', 'java', 2),
  ('backend_developer', 'spring-framework', 3),
  ('backend_developer', 'python', 4),
  ('backend_developer', 'fastapi', 5),
  ('backend_developer', 'aspnet-core', 6),
  ('backend_developer', 'sql', 7),
  ('backend_developer', 'postgresql', 8),
  ('backend_developer', 'docker', 9),
  ('backend_developer', 'git', 10),
  ('fullstack_developer', 'javascript', 1),
  ('fullstack_developer', 'typescript', 2),
  ('fullstack_developer', 'react', 3),
  ('fullstack_developer', 'nextjs', 4),
  ('fullstack_developer', 'nodejs', 5),
  ('fullstack_developer', 'sql', 6),
  ('fullstack_developer', 'postgresql', 7),
  ('fullstack_developer', 'docker', 8),
  ('fullstack_developer', 'git', 9),
  ('fullstack_developer', 'web-development', 10),
  ('mobile_developer', 'react-native', 1),
  ('mobile_developer', 'google-flutter', 2),
  ('mobile_developer', 'dart-programming-language', 3),
  ('mobile_developer', 'android-development', 4),
  ('mobile_developer', 'kotlin', 5),
  ('mobile_developer', 'ios-development', 6),
  ('mobile_developer', 'swift', 7),
  ('mobile_developer', 'swiftui', 8),
  ('mobile_developer', 'mobile-development', 9),
  ('devops_engineer', 'docker', 1),
  ('devops_engineer', 'kubernetes', 2),
  ('devops_engineer', 'devops', 3),
  ('devops_engineer', 'linux', 4),
  ('devops_engineer', 'shell-scripting', 5),
  ('devops_engineer', 'amazon-aws', 6),
  ('devops_engineer', 'git', 7),
  ('devops_engineer', 'github', 8),
  ('devops_engineer', 'system-administration', 9),
  ('data_engineer', 'python', 1),
  ('data_engineer', 'sql', 2),
  ('data_engineer', 'postgresql', 3),
  ('data_engineer', 'data-engineering', 4),
  ('data_engineer', 'apache-kafka', 5),
  ('data_engineer', 'pandas', 6),
  ('data_engineer', 'amazon-aws', 7),
  ('data_engineer', 'docker', 8),
  ('data_analyst', 'sql', 1),
  ('data_analyst', 'python', 2),
  ('data_analyst', 'pandas', 3),
  ('data_analyst', 'data-analysis', 4),
  ('data_analyst', 'data-science', 5),
  ('data_analyst', 'mysql', 6),
  ('data_analyst', 'postgresql', 7),
  ('ml_engineer', 'python', 1),
  ('ml_engineer', 'machine-learning', 2),
  ('ml_engineer', 'deep-learning', 3),
  ('ml_engineer', 'pytorch', 4),
  ('ml_engineer', 'tensorflow', 5),
  ('ml_engineer', 'mlops', 6),
  ('ml_engineer', 'large-language-models', 7),
  ('ml_engineer', 'langchain', 8),
  ('ml_engineer', 'retrieval-augmented-generation', 9),
  ('qa_engineer', 'automation-testing', 1),
  ('qa_engineer', 'playwright', 2),
  ('qa_engineer', 'selenium-webdriver', 3),
  ('qa_engineer', 'pytest', 4),
  ('qa_engineer', 'postman', 5),
  ('qa_engineer', 'istqb-certified-tester-foundation-level-ctfl', 6),
  ('qa_engineer', 'javascript', 7),
  ('qa_engineer', 'python', 8),
  ('software_architect', 'software-architecture', 1),
  ('software_architect', 'system-design-interview', 2),
  ('software_architect', 'data-structures', 3),
  ('software_architect', 'algorithms', 4),
  ('software_architect', 'docker', 5),
  ('software_architect', 'kubernetes', 6),
  ('software_architect', 'amazon-aws', 7),
  ('software_architect', 'java', 8),
  ('game_developer', 'unity', 1),
  ('game_developer', 'unreal-engine', 2),
  ('game_developer', 'godot', 3),
  ('game_developer', 'c-sharp', 4),
  ('game_developer', 'c-plus-plus', 5),
  ('game_developer', 'game-development', 6),
  ('game_developer', 'blender', 7),
  ('game_developer', '3d-modeling', 8)
) AS v(occupation, slug, position)
JOIN topics t ON t.slug = v.slug
ON CONFLICT DO NOTHING;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT o.occupation, COUNT(ot."topicId") AS n
    FROM unnest(enum_range(NULL::"Occupation")) AS o(occupation)
    LEFT JOIN occupation_topics ot ON ot.occupation = o.occupation
    WHERE o.occupation <> 'other'
    GROUP BY o.occupation
    HAVING COUNT(ot."topicId") < 5
  LOOP
    RAISE NOTICE 'Nghề % chỉ có % topic', r.occupation, r.n;
  END LOOP;
END $$;
