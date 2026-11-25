// Câu seed của ngân hàng kỹ năng. Đáp án đúng đánh dấu correct: true.
export type SkillSeedQuestion = {
  domain?: string; // bắt buộc với topic có trong SKILL_DOMAINS, cấm với topic còn lại
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'single_choice' | 'multiple_choice';
  stem: string; // Markdown, code để trong ```lang
  options: { content: string; correct?: true }[];
};

export const SKILL_BANK_TOPICS = [
  'html', 'css', 'javascript', 'typescript', 'react', 'nextjs', 'nodejs', 'sql', 'python', 'docker', 'git',
  'postgresql', 'java', 'kubernetes',
  'linux', 'data-structures', 'machine-learning',
] as const;
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
  // Đợt 2. PostgreSQL chỉ phần riêng của PG — SQL chung (JOIN, GROUP BY, NULL, window cơ bản) đã có ở topic `sql`.
  postgresql: [
    'Data types & JSONB', 'Indexes & query planning', 'Transactions & concurrency', 'PostgreSQL-specific SQL', 'Administration & maintenance',
  ],
  java: ['Language basics & types', 'OOP & interfaces', 'Collections & generics', 'Exceptions', 'Streams & lambdas', 'Concurrency'],
  kubernetes: [
    'Pods & workloads', 'Services & networking', 'Configuration & storage', 'Scheduling & resources', 'Health, debugging & operations',
  ],
  // Đợt 3.
  linux: [
    'Filesystem & links', 'Permissions & ownership', 'Processes & signals', 'Shell scripting', 'Text processing & redirection', 'System administration',
  ],
  'data-structures': ['Complexity analysis', 'Linear structures', 'Hash tables', 'Trees & heaps', 'Graphs', 'Sorting & searching'],
  'machine-learning': [
    'Fundamentals & generalization', 'Data preparation & features', 'Supervised algorithms', 'Model evaluation', 'Unsupervised learning',
  ],
};
// Strict: mỗi domain đủ câu để sau này ước lượng được từng phần.
export const DOMAIN_MIN = { total: 6, perDifficulty: 2 } as const;
