// Câu seed của ngân hàng kỹ năng. Đáp án đúng đánh dấu correct: true.
export type SkillSeedQuestion = {
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'single_choice' | 'multiple_choice';
  stem: string; // Markdown, code để trong ```lang
  options: { content: string; correct?: true }[];
};

export const SKILL_BANK_TOPICS = ['html', 'css', 'javascript', 'typescript', 'react', 'nextjs', 'nodejs', 'sql'] as const;
export const PER_TOPIC = 40;
