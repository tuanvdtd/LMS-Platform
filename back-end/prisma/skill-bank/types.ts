// Câu seed của ngân hàng kỹ năng. Đáp án đúng đánh dấu correct: true.
export type SkillSeedQuestion = {
  domain?: string; // bắt buộc với topic có trong SKILL_DOMAINS, cấm với topic còn lại
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'single_choice' | 'multiple_choice';
  stem: string; // Markdown, code để trong ```lang
  options: { content: string; correct?: true }[];
};

export const SKILL_BANK_TOPICS = ['html', 'css', 'javascript', 'typescript', 'react', 'nextjs', 'nodejs', 'sql', 'python', 'docker', 'git'] as const;
export const PER_TOPIC = 40;

// Domain = phần kiến thức nhỏ trong topic, tiếng Anh theo thuật ngữ docs (vừa là khoá vừa là tên hiển thị).
// 8 topic đợt đầu chưa gắn domain.
export const SKILL_DOMAINS: Partial<Record<string, readonly string[]>> = {
  python: [
    'Data types & collections', 'Functions & scope', 'OOP',
    'Error handling & context managers', 'Iterators & generators', 'Modules & environment',
  ],
  docker: ['Images & Dockerfile', 'Containers & lifecycle', 'Networking', 'Volumes & storage', 'Docker Compose'],
  git: ['Staging & commits', 'Branching & merging', 'Rebase & history', 'Remotes & collaboration', 'Undo & recovery'],
};
// Strict: mỗi domain đủ câu để sau này ước lượng được từng phần.
export const DOMAIN_MIN = { total: 6, perDifficulty: 2 } as const;
