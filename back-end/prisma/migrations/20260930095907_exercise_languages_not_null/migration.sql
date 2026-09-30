-- CHECK cũ để lọt NULL (cardinality(NULL) = NULL → CHECK coi là đạt).
ALTER TABLE exercises DROP CONSTRAINT chk_exercise_languages;
ALTER TABLE exercises ADD CONSTRAINT chk_exercise_languages
  CHECK (coalesce(cardinality("allowedLanguageIds"), 0) >= 1);
