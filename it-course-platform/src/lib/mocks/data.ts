import type {
  Course,
  Instructor,
  SkillTag,
  Student,
  SkillMastery,
  Quiz,
  QuizQuestion,
  CodingProblem,
  RecommendedCourse,
} from '@/types';

// ─── Instructors ───────────────────────────────────────────────────────────
export const instructors: Instructor[] = [
  {
    id: 'ins-1',
    name: 'Nguyễn Thành Long',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop',
    title: 'Senior Frontend Engineer tại VNG',
    rating: 4.8,
    studentCount: 8420,
    courseCount: 4,
    bio: 'Hơn 8 năm kinh nghiệm xây dựng ứng dụng React quy mô lớn. Đã từng làm việc tại VNG, VNPAY và nhiều startup. Đam mê chia sẻ kiến thức và giúp người học nắm vững nền tảng lập trình.',
    verified: true,
  },
  {
    id: 'ins-2',
    name: 'Trần Minh Tuấn',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop',
    title: 'Backend Engineer & DevOps tại Tiki',
    rating: 4.9,
    studentCount: 12300,
    courseCount: 6,
    bio: 'Chuyên gia NestJS, Microservices và Kubernetes với 10 năm kinh nghiệm. Đã xây dựng hệ thống phục vụ hàng triệu người dùng tại Tiki.',
    verified: true,
  },
  {
    id: 'ins-3',
    name: 'Lê Thị Hoa',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop',
    title: 'Data Engineer tại Shopee',
    rating: 4.7,
    studentCount: 5800,
    courseCount: 3,
    bio: 'Data Engineer với 7 năm kinh nghiệm phân tích dữ liệu lớn. Thành thạo Python, SQL, Spark và các công cụ BI hiện đại.',
    verified: true,
  },
  {
    id: 'ins-4',
    name: 'Phạm Đức Anh',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop',
    title: 'Mobile Lead tại MoMo',
    rating: 4.6,
    studentCount: 4200,
    courseCount: 2,
    bio: 'Lập trình viên React Native với 6 năm kinh nghiệm phát triển ứng dụng di động. Đã release hơn 20 app lên App Store và Google Play.',
    verified: true,
  },
];

// ─── Skill Tags ─────────────────────────────────────────────────────────────
export const skillTags: SkillTag[] = [
  { id: 'js-basics', name: 'JavaScript Cơ bản', track: 'frontend' },
  { id: 'js-async', name: 'JS Async/Await', track: 'frontend' },
  { id: 'js-advanced', name: 'JavaScript Nâng cao', track: 'frontend' },
  { id: 'react-basics', name: 'React Cơ bản', track: 'frontend' },
  { id: 'react-hooks', name: 'React Hooks', track: 'frontend' },
  { id: 'react-state', name: 'State Management', track: 'frontend' },
  { id: 'nextjs-routing', name: 'Next.js Routing', track: 'frontend' },
  { id: 'nextjs-ssr', name: 'Next.js SSR/SSG', track: 'frontend' },
  { id: 'css-flex', name: 'CSS Flexbox/Grid', track: 'frontend' },
  { id: 'typescript', name: 'TypeScript', track: 'frontend' },
  { id: 'node-basics', name: 'Node.js Cơ bản', track: 'backend' },
  { id: 'express', name: 'Express.js', track: 'backend' },
  { id: 'nestjs', name: 'NestJS', track: 'backend' },
  { id: 'sql-basics', name: 'SQL Cơ bản', track: 'backend' },
  { id: 'sql-join', name: 'SQL Joins & Subqueries', track: 'backend' },
  { id: 'sql-index', name: 'SQL Indexing', track: 'backend' },
  { id: 'postgres', name: 'PostgreSQL', track: 'backend' },
  { id: 'redis', name: 'Redis', track: 'backend' },
  { id: 'rest-api', name: 'REST API Design', track: 'backend' },
  { id: 'graphql', name: 'GraphQL', track: 'backend' },
  { id: 'docker', name: 'Docker', track: 'devops' },
  { id: 'k8s', name: 'Kubernetes', track: 'devops' },
  { id: 'cicd', name: 'CI/CD', track: 'devops' },
  { id: 'python-basics', name: 'Python Cơ bản', track: 'data' },
  { id: 'pandas', name: 'Pandas & NumPy', track: 'data' },
  { id: 'ml-basics', name: 'Machine Learning Cơ bản', track: 'data' },
  { id: 'rn-basics', name: 'React Native Cơ bản', track: 'mobile' },
  { id: 'rn-navigation', name: 'RN Navigation', track: 'mobile' },
];

// ─── Courses ─────────────────────────────────────────────────────────────────
export const courses: Course[] = [
  {
    id: 'c-1',
    slug: 'react-mastery-2024',
    title: 'React Mastery: Từ Hooks đến Kiến trúc Doanh nghiệp',
    subtitle: 'Làm chủ React 19, Hooks, Context, Zustand và hiệu suất tối ưu',
    description:
      'Khoá học toàn diện nhất về React trên SkillPath, được cập nhật cho React 19. Từ useState đến concurrent features, bạn sẽ xây dựng 5 dự án thực tế.',
    thumbnail:
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=640&h=360&fit=crop',
    track: 'frontend',
    level: 'intermediate',
    instructor: instructors[0],
    rating: 4.8,
    ratingCount: 2847,
    studentCount: 8420,
    price: 599000,
    originalPrice: 1299000,
    status: 'approved',
    updatedAt: '2025-06-15',
    language: 'Tiếng Việt',
    duration: 42,
    quizCount: 12,
    codeCount: 8,
    hasCertificate: true,
    skills: [
      { id: 'react-basics', name: 'React Cơ bản', track: 'frontend' },
      { id: 'react-hooks', name: 'React Hooks', track: 'frontend' },
      { id: 'react-state', name: 'State Management', track: 'frontend' },
      { id: 'typescript', name: 'TypeScript', track: 'frontend' },
    ],
    prerequisites: [
      { id: 'js-basics', name: 'JavaScript Cơ bản', track: 'frontend' },
      { id: 'js-async', name: 'JS Async/Await', track: 'frontend' },
    ],
    learningOutcomes: [
      'Nắm vững toàn bộ React Hooks: useState, useEffect, useCallback, useMemo',
      'Xây dựng custom hooks tái sử dụng cao',
      'Quản lý state với Zustand và Redux Toolkit',
      'Tối ưu hiệu suất React: React.memo, lazy loading, Suspense',
      'Viết code TypeScript chuẩn với React',
      'Kiến trúc dự án React theo chuẩn doanh nghiệp',
    ],
    curriculum: [
      {
        id: 'ch-1',
        title: 'Nền tảng React & JSX',
        lessons: [
          { id: 'l-1', title: 'Giới thiệu và cài đặt môi trường', type: 'video', duration: 1200, preview: true },
          { id: 'l-2', title: 'JSX và Virtual DOM', type: 'video', duration: 1800, preview: true },
          { id: 'l-3', title: 'Components và Props', type: 'video', duration: 2100, preview: false },
          { id: 'l-4', title: 'Kiểm tra: Nền tảng React', type: 'quiz', preview: false, quizId: 'q-1' },
        ],
      },
      {
        id: 'ch-2',
        title: 'React Hooks Chuyên sâu',
        lessons: [
          { id: 'l-5', title: 'useState và setState nâng cao', type: 'video', duration: 2400, preview: false },
          { id: 'l-6', title: 'useEffect và Lifecycle', type: 'video', duration: 2700, preview: false },
          { id: 'l-7', title: 'useCallback và useMemo', type: 'video', duration: 2100, preview: false },
          { id: 'l-8', title: 'Custom Hooks', type: 'video', duration: 1800, preview: false },
          { id: 'l-9', title: 'Bài tập: Xây dựng useDebounce', type: 'coding', preview: false, problemId: 'p-1' },
          { id: 'l-10', title: 'Kiểm tra: React Hooks', type: 'quiz', preview: false, quizId: 'q-2' },
        ],
      },
      {
        id: 'ch-3',
        title: 'State Management',
        lessons: [
          { id: 'l-11', title: 'Context API', type: 'video', duration: 1800, preview: false },
          { id: 'l-12', title: 'Zustand từ A đến Z', type: 'video', duration: 3000, preview: false },
          { id: 'l-13', title: 'Redux Toolkit', type: 'video', duration: 2700, preview: false },
        ],
      },
    ],
    tags: ['react', 'typescript', 'frontend'],
  },
  {
    id: 'c-2',
    slug: 'nodejs-backend-pro',
    title: 'Node.js Backend Pro: NestJS + PostgreSQL + Docker',
    subtitle: 'Xây dựng API production-ready với NestJS, authentication, caching và containerization',
    description:
      'Học cách xây dựng backend hiện đại với NestJS framework. Bao gồm authentication, authorization, REST API, cơ sở dữ liệu và deployment.',
    thumbnail:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=640&h=360&fit=crop',
    track: 'backend',
    level: 'intermediate',
    instructor: instructors[1],
    rating: 4.9,
    ratingCount: 3124,
    studentCount: 12300,
    price: 699000,
    originalPrice: 1499000,
    status: 'approved',
    updatedAt: '2025-07-20',
    language: 'Tiếng Việt',
    duration: 56,
    quizCount: 10,
    codeCount: 12,
    hasCertificate: true,
    skills: [
      { id: 'node-basics', name: 'Node.js Cơ bản', track: 'backend' },
      { id: 'nestjs', name: 'NestJS', track: 'backend' },
      { id: 'sql-join', name: 'SQL Joins & Subqueries', track: 'backend' },
      { id: 'postgres', name: 'PostgreSQL', track: 'backend' },
      { id: 'redis', name: 'Redis', track: 'backend' },
      { id: 'docker', name: 'Docker', track: 'devops' },
    ],
    prerequisites: [
      { id: 'js-async', name: 'JS Async/Await', track: 'frontend' },
      { id: 'node-basics', name: 'Node.js Cơ bản', track: 'backend' },
    ],
    learningOutcomes: [
      'Xây dựng REST API với NestJS từ zero đến production',
      'Authentication & Authorization với JWT và Refresh Token',
      'ORM với TypeORM + PostgreSQL',
      'Caching với Redis',
      'Containerization với Docker & Docker Compose',
      'Unit test và Integration test',
    ],
    curriculum: [
      {
        id: 'ch-4',
        title: 'NestJS Fundamentals',
        lessons: [
          { id: 'l-14', title: 'Giới thiệu NestJS Architecture', type: 'video', duration: 1800, preview: true },
          { id: 'l-15', title: 'Modules, Controllers, Services', type: 'video', duration: 2400, preview: false },
          { id: 'l-16', title: 'Dependency Injection', type: 'video', duration: 2100, preview: false },
        ],
      },
      {
        id: 'ch-5',
        title: 'Database & ORM',
        lessons: [
          { id: 'l-17', title: 'PostgreSQL Setup & TypeORM', type: 'video', duration: 2700, preview: false },
          { id: 'l-18', title: 'Relations & Migrations', type: 'video', duration: 3000, preview: false },
          { id: 'l-19', title: 'Kiểm tra: SQL Queries', type: 'quiz', preview: false, quizId: 'q-3' },
        ],
      },
    ],
    tags: ['nodejs', 'nestjs', 'backend', 'postgresql'],
  },
  {
    id: 'c-3',
    slug: 'sql-mastery',
    title: 'SQL Mastery: Từ Cơ bản đến Phân tích Dữ liệu',
    subtitle: 'Thành thạo SQL với PostgreSQL: joins, subqueries, window functions, tối ưu hoá',
    description:
      'Khoá học SQL toàn diện nhất cho developer Việt Nam. Học thông qua 150+ bài tập thực hành trên database thực tế.',
    thumbnail:
      'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=640&h=360&fit=crop',
    track: 'backend',
    level: 'basic',
    instructor: instructors[2],
    rating: 4.7,
    ratingCount: 1856,
    studentCount: 5800,
    price: 399000,
    originalPrice: 899000,
    status: 'approved',
    updatedAt: '2025-05-10',
    language: 'Tiếng Việt',
    duration: 28,
    quizCount: 15,
    codeCount: 20,
    hasCertificate: true,
    skills: [
      { id: 'sql-basics', name: 'SQL Cơ bản', track: 'backend' },
      { id: 'sql-join', name: 'SQL Joins & Subqueries', track: 'backend' },
      { id: 'sql-index', name: 'SQL Indexing', track: 'backend' },
      { id: 'postgres', name: 'PostgreSQL', track: 'backend' },
    ],
    prerequisites: [{ id: 'sql-basics', name: 'SQL Cơ bản', track: 'backend' }],
    learningOutcomes: [
      'Viết query SQL phức tạp với nhiều JOIN',
      'Window Functions cho phân tích dữ liệu',
      'Tối ưu hoá query với EXPLAIN ANALYZE',
      'Indexing strategy hiệu quả',
    ],
    curriculum: [
      {
        id: 'ch-6',
        title: 'SQL Cơ bản',
        lessons: [
          { id: 'l-20', title: 'SELECT, FROM, WHERE', type: 'video', duration: 1500, preview: true },
          { id: 'l-21', title: 'GROUP BY và Aggregate Functions', type: 'video', duration: 1800, preview: false },
        ],
      },
    ],
    tags: ['sql', 'database', 'postgresql', 'backend'],
  },
  {
    id: 'c-4',
    slug: 'javascript-complete',
    title: 'JavaScript Complete: Cơ bản đến Async Mastery',
    subtitle: 'Nền tảng JavaScript vững chắc: ES6+, Async/Await, Closures, Prototypes',
    description:
      'Khoá học JavaScript đầy đủ nhất cho người mới bắt đầu và người muốn củng cố kiến thức nền tảng.',
    thumbnail:
      'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=640&h=360&fit=crop',
    track: 'frontend',
    level: 'beginner',
    instructor: instructors[0],
    rating: 4.9,
    ratingCount: 4521,
    studentCount: 18900,
    price: 299000,
    originalPrice: 799000,
    status: 'approved',
    updatedAt: '2025-08-01',
    language: 'Tiếng Việt',
    duration: 35,
    quizCount: 18,
    codeCount: 25,
    hasCertificate: true,
    skills: [
      { id: 'js-basics', name: 'JavaScript Cơ bản', track: 'frontend' },
      { id: 'js-async', name: 'JS Async/Await', track: 'frontend' },
      { id: 'js-advanced', name: 'JavaScript Nâng cao', track: 'frontend' },
    ],
    prerequisites: [],
    learningOutcomes: [
      'Nắm vững JavaScript ES6+ syntax',
      'Promise, Async/Await, Event Loop',
      'Closures, Prototypes, this keyword',
      'DOM Manipulation',
    ],
    curriculum: [
      {
        id: 'ch-7',
        title: 'Nền tảng JavaScript',
        lessons: [
          { id: 'l-22', title: 'Variables, Types, Operators', type: 'video', duration: 1800, preview: true },
          { id: 'l-23', title: 'Functions và Scope', type: 'video', duration: 2100, preview: true },
          { id: 'l-24', title: 'Arrays và Objects', type: 'video', duration: 2400, preview: false },
        ],
      },
    ],
    tags: ['javascript', 'frontend', 'web'],
  },
  {
    id: 'c-5',
    slug: 'nextjs-fullstack',
    title: 'Next.js 15 Fullstack: App Router + Server Actions',
    subtitle: 'Xây dựng ứng dụng fullstack với Next.js 15, Prisma, NextAuth và Vercel',
    description:
      'Học Next.js 15 từ App Router đến production deployment. Xây dựng 3 dự án thực tế với authentication, database và payment.',
    thumbnail:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=640&h=360&fit=crop',
    track: 'fullstack',
    level: 'intermediate',
    instructor: instructors[0],
    rating: 4.8,
    ratingCount: 1234,
    studentCount: 4800,
    price: 799000,
    originalPrice: 1599000,
    status: 'approved',
    updatedAt: '2025-09-01',
    language: 'Tiếng Việt',
    duration: 48,
    quizCount: 8,
    codeCount: 10,
    hasCertificate: true,
    skills: [
      { id: 'nextjs-routing', name: 'Next.js Routing', track: 'frontend' },
      { id: 'nextjs-ssr', name: 'Next.js SSR/SSG', track: 'frontend' },
      { id: 'react-hooks', name: 'React Hooks', track: 'frontend' },
      { id: 'typescript', name: 'TypeScript', track: 'frontend' },
    ],
    prerequisites: [
      { id: 'react-hooks', name: 'React Hooks', track: 'frontend' },
      { id: 'typescript', name: 'TypeScript', track: 'frontend' },
    ],
    learningOutcomes: [
      'App Router và Server Components',
      'Server Actions và Form handling',
      'Authentication với NextAuth.js v5',
      'Database với Prisma ORM',
      'Deployment lên Vercel',
    ],
    curriculum: [
      {
        id: 'ch-8',
        title: 'App Router Deep Dive',
        lessons: [
          { id: 'l-25', title: 'App Router vs Pages Router', type: 'video', duration: 1800, preview: true },
          { id: 'l-26', title: 'Server vs Client Components', type: 'video', duration: 2400, preview: false },
        ],
      },
    ],
    tags: ['nextjs', 'react', 'fullstack', 'typescript'],
  },
];

// ─── Demo Student ─────────────────────────────────────────────────────────────
export const demoStudent: Student = {
  id: 'stu-1',
  name: 'Minh Khoa',
  email: 'minhkhoa@example.com',
  avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80&h=80&fit=crop',
  goal: 'frontend',
  level: 'intermediate',
  skills: [
    { skillId: 'js-basics', skillName: 'JavaScript Cơ bản', mastery: 88, track: 'frontend', trend: 'stable', quizzesCompleted: 12 },
    { skillId: 'js-async', skillName: 'JS Async/Await', mastery: 72, track: 'frontend', trend: 'up', quizzesCompleted: 8 },
    { skillId: 'react-basics', skillName: 'React Cơ bản', mastery: 65, track: 'frontend', trend: 'up', quizzesCompleted: 10 },
    { skillId: 'react-hooks', skillName: 'React Hooks', mastery: 35, track: 'frontend', trend: 'up', quizzesCompleted: 5 },
    { skillId: 'react-state', skillName: 'State Management', mastery: 28, track: 'frontend', trend: 'stable', quizzesCompleted: 3 },
    { skillId: 'typescript', skillName: 'TypeScript', mastery: 55, track: 'frontend', trend: 'up', quizzesCompleted: 6 },
    { skillId: 'css-flex', skillName: 'CSS Flexbox/Grid', mastery: 80, track: 'frontend', trend: 'stable', quizzesCompleted: 9 },
    { skillId: 'sql-basics', skillName: 'SQL Cơ bản', mastery: 60, track: 'backend', trend: 'up', quizzesCompleted: 7 },
    { skillId: 'sql-join', skillName: 'SQL Joins & Subqueries', mastery: 42, track: 'backend', trend: 'up', quizzesCompleted: 4 },
    { skillId: 'node-basics', skillName: 'Node.js Cơ bản', mastery: 45, track: 'backend', trend: 'up', quizzesCompleted: 5 },
  ],
  enrolledCourses: ['c-1', 'c-4'],
  completedCourses: ['c-4'],
  joinedAt: '2024-10-15',
};

// ─── Recommendations ─────────────────────────────────────────────────────────
export const recommendations: RecommendedCourse[] = [
  {
    ...courses[0],
    reason: {
      type: 'skill_gap',
      label: 'Lấp lỗ hổng kỹ năng',
      detail: 'Vì bạn đạt 35% ở React Hooks — cần củng cố để tiến lên Next.js',
    },
  },
  {
    ...courses[4],
    reason: {
      type: 'prerequisite_met',
      label: 'Bạn đã sẵn sàng học tiếp',
      detail: 'Bạn đã vững JavaScript (88%) và React Cơ bản (65%) → sẵn sàng học Next.js',
    },
  },
  {
    ...courses[2],
    reason: {
      type: 'goal',
      label: 'Dành cho mục tiêu Frontend của bạn',
      detail: 'SQL là kỹ năng cần thiết cho Fullstack developer',
    },
  },
  {
    ...courses[1],
    reason: {
      type: 'collaborative',
      label: 'Học viên học React cũng mua',
      detail: '68% học viên hoàn thành React Mastery cũng mua khoá này',
    },
  },
];

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export const demoQuiz: Quiz = {
  id: 'q-2',
  title: 'Kiểm tra React Hooks',
  courseId: 'c-1',
  timeLimit: 1800,
  passingScore: 70,
  maxAttempts: 3,
  skills: [
    { id: 'react-hooks', name: 'React Hooks', track: 'frontend' },
    { id: 'react-basics', name: 'React Cơ bản', track: 'frontend' },
  ],
  questions: [
    {
      id: 'qq-1',
      content: 'Hook nào được dùng để quản lý side effects trong React?',
      type: 'single',
      options: [
        { id: 'a', text: 'useState', isCorrect: false },
        { id: 'b', text: 'useEffect', isCorrect: true },
        { id: 'c', text: 'useCallback', isCorrect: false },
        { id: 'd', text: 'useRef', isCorrect: false },
      ],
      explanation: 'useEffect được dùng để thực hiện side effects như gọi API, subscribe events, hay thay đổi DOM.',
      skills: [{ id: 'react-hooks', name: 'React Hooks', track: 'frontend' }],
      difficultySet: 2,
      difficultyActual: 0.78,
      discriminationIndex: 0.42,
    },
    {
      id: 'qq-2',
      content:
        'Đoạn code sau có vấn đề gì?\n```javascript\nconst [count, setCount] = useState(0);\nuseEffect(() => {\n  document.title = `Count: ${count}`;\n});\n```',
      type: 'single',
      options: [
        { id: 'a', text: 'Không có dependency array → chạy sau mỗi render', isCorrect: true },
        { id: 'b', text: 'useState không nhận giá trị ban đầu là số', isCorrect: false },
        { id: 'c', text: 'Không thể dùng template literal trong useEffect', isCorrect: false },
        { id: 'd', text: 'document.title không thể được thay đổi bằng JavaScript', isCorrect: false },
      ],
      explanation: 'Thiếu dependency array [] sẽ khiến useEffect chạy sau mỗi lần render, không chỉ khi count thay đổi.',
      skills: [{ id: 'react-hooks', name: 'React Hooks', track: 'frontend' }],
      difficultySet: 3,
      difficultyActual: 0.52,
      discriminationIndex: 0.61,
    },
    {
      id: 'qq-3',
      content: 'Khi nào nên dùng useCallback?',
      type: 'multiple',
      options: [
        { id: 'a', text: 'Khi truyền callback function vào component con đã được React.memo', isCorrect: true },
        { id: 'b', text: 'Cho mọi function trong component để tối ưu hiệu suất', isCorrect: false },
        { id: 'c', text: 'Khi function được dùng làm dependency trong useEffect', isCorrect: true },
        { id: 'd', text: 'Khi muốn cache giá trị tính toán phức tạp', isCorrect: false },
      ],
      explanation: 'useCallback memo hoá function reference, hữu ích khi truyền vào memoized children hoặc dùng làm dependency.',
      skills: [{ id: 'react-hooks', name: 'React Hooks', track: 'frontend' }],
      difficultySet: 4,
      difficultyActual: 0.38,
      discriminationIndex: 0.55,
    },
    {
      id: 'qq-4',
      content: 'Đâu là cách đúng để reset state về giá trị ban đầu khi prop thay đổi?',
      type: 'single',
      options: [
        { id: 'a', text: 'Dùng useEffect với prop trong dependency', isCorrect: false },
        { id: 'b', text: 'Truyền key prop để unmount/remount component', isCorrect: true },
        { id: 'c', text: 'Gọi setState trong render function', isCorrect: false },
        { id: 'd', text: 'Dùng useLayoutEffect', isCorrect: false },
      ],
      explanation: 'Thay đổi key prop buộc React unmount và remount component, tự động reset tất cả state về giá trị ban đầu.',
      skills: [{ id: 'react-hooks', name: 'React Hooks', track: 'frontend' }],
      difficultySet: 4,
      difficultyActual: 0.41,
      discriminationIndex: 0.58,
    },
    {
      id: 'qq-5',
      content: 'useRef khác useState ở điểm nào quan trọng nhất?',
      type: 'single',
      options: [
        { id: 'a', text: 'useRef chỉ dùng để tham chiếu DOM elements', isCorrect: false },
        { id: 'b', text: 'Thay đổi ref.current không trigger re-render', isCorrect: true },
        { id: 'c', text: 'useRef không thể lưu trữ giá trị nguyên thủy', isCorrect: false },
        { id: 'd', text: 'useRef reset giá trị sau mỗi render', isCorrect: false },
      ],
      explanation: 'ref.current là một mutable object, thay đổi nó không gây re-render — khác hoàn toàn setState.',
      skills: [{ id: 'react-hooks', name: 'React Hooks', track: 'frontend' }],
      difficultySet: 3,
      difficultyActual: 0.61,
      discriminationIndex: 0.48,
    },
  ],
};

// ─── Coding Problem ───────────────────────────────────────────────────────────
export const demoProblem: CodingProblem = {
  id: 'p-1',
  title: 'Xây dựng useDebounce Hook',
  description: `## Mô tả bài toán

Viết một custom React hook \`useDebounce\` nhận vào **một giá trị** và **thời gian delay (ms)**, trả về giá trị đã được "debounced" — tức là giá trị chỉ được cập nhật sau khi không có thay đổi nào trong \`delay\` milliseconds.

### Ứng dụng thực tế
Hook này thường dùng để giảm số lần gọi API khi người dùng gõ vào ô tìm kiếm.

### Yêu cầu
- Sử dụng \`useState\` và \`useEffect\`
- Cleanup timer khi component unmount hoặc value/delay thay đổi
- TypeScript generic: hook phải hoạt động với mọi kiểu dữ liệu`,
  examples: [
    {
      input: 'value = "hello", delay = 500',
      output: '"hello" (sau 500ms không có thay đổi)',
      explanation: 'Nếu value thay đổi liên tục trong 500ms, chỉ giá trị cuối cùng được trả về sau khi ngừng gõ',
    },
  ],
  constraints: [
    'delay > 0',
    'Phải cleanup setTimeout khi component unmount',
    'TypeScript: dùng generic `<T>`',
  ],
  timeLimit: 2000,
  memoryLimit: 128,
  skills: [
    { id: 'react-hooks', name: 'React Hooks', track: 'frontend' },
    { id: 'react-basics', name: 'React Cơ bản', track: 'frontend' },
  ],
  languages: ['typescript', 'javascript'],
  starterCode: {
    typescript: `import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  // TODO: Implement this hook
  return value;
}

export default useDebounce;`,
    javascript: `import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
  // TODO: Implement this hook
  return value;
}

export default useDebounce;`,
  },
  testCases: [
    { id: 'tc-1', input: 'immediate', expectedOutput: '', hidden: false, weight: 1 },
    { id: 'tc-2', input: 'debounced after delay', expectedOutput: '', hidden: false, weight: 1 },
    { id: 'tc-3', input: 'cleanup on unmount', expectedOutput: '', hidden: true, weight: 2 },
    { id: 'tc-4', input: 'generic type support', expectedOutput: '', hidden: true, weight: 1 },
    { id: 'tc-5', input: 'delay change resets timer', expectedOutput: '', hidden: true, weight: 2 },
  ],
  acceptanceRate: 73.2,
};

// ─── Instructor Analytics Mock Data ──────────────────────────────────────────
export const revenueData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2025, 8, 1 + i);
  return {
    date: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
    revenue: Math.floor(Math.random() * 8000000 + 2000000),
    orders: Math.floor(Math.random() * 30 + 10),
  };
});

export const monthlyRevenue = [
  { month: 'T10/24', revenue: 42000000 },
  { month: 'T11/24', revenue: 58000000 },
  { month: 'T12/24', revenue: 71000000 },
  { month: 'T1/25', revenue: 55000000 },
  { month: 'T2/25', revenue: 48000000 },
  { month: 'T3/25', revenue: 63000000 },
  { month: 'T4/25', revenue: 76000000 },
  { month: 'T5/25', revenue: 89000000 },
  { month: 'T6/25', revenue: 92000000 },
  { month: 'T7/25', revenue: 85000000 },
  { month: 'T8/25', revenue: 98000000 },
  { month: 'T9/25', revenue: 107000000 },
];

export const videoRetentionData = Array.from({ length: 20 }, (_, i) => ({
  time: `${String(Math.floor((i * 3) / 60)).padStart(2, '0')}:${String((i * 3) % 60).padStart(2, '0')}`,
  retention: Math.max(20, 100 - i * 3.5 - (i === 5 ? 15 : 0) - (i === 12 ? 10 : 0)),
  rewatch: i >= 4 && i <= 6 ? 35 : i >= 11 && i <= 13 ? 28 : 5,
}));

export const funnelData = [
  { step: 'Xem trang khoá', value: 10000, pct: 100 },
  { step: 'Thêm vào giỏ', value: 3200, pct: 32 },
  { step: 'Bắt đầu thanh toán', value: 2100, pct: 21 },
  { step: 'Thanh toán thành công', value: 1680, pct: 16.8 },
];

export const atRiskStudents = [
  { id: 's-1', name: 'Hoàng Văn Nam', progress: 12, lastActive: '14 ngày trước', risk: 'high', avgScore: 45, courseId: 'c-1' },
  { id: 's-2', name: 'Nguyễn Thị Mai', progress: 35, lastActive: '8 ngày trước', risk: 'high', avgScore: 52, courseId: 'c-1' },
  { id: 's-3', name: 'Phạm Quốc Hùng', progress: 58, lastActive: '5 ngày trước', risk: 'medium', avgScore: 61, courseId: 'c-2' },
  { id: 's-4', name: 'Lê Thu Hằng', progress: 22, lastActive: '10 ngày trước', risk: 'high', avgScore: 38, courseId: 'c-1' },
  { id: 's-5', name: 'Trần Đức Thắng', progress: 45, lastActive: '6 ngày trước', risk: 'medium', avgScore: 67, courseId: 'c-2' },
];

export const skillHeatmapData = [
  { skill: 'React Hooks', quiz1: 35, quiz2: 42, quiz3: 38 },
  { skill: 'useEffect', quiz1: 55, quiz2: 61, quiz3: 58 },
  { skill: 'State Mgmt', quiz1: 40, quiz2: 35, quiz3: 45 },
  { skill: 'Custom Hooks', quiz1: 28, quiz2: 32, quiz3: 30 },
  { skill: 'Performance', quiz1: 45, quiz2: 50, quiz3: 48 },
];

// ─── Mock certificates ────────────────────────────────────────────────────────
export const demoCertificates = [
  {
    id: 'cert-1',
    code: 'SP-2024-JS-48291',
    courseTitle: 'JavaScript Complete: Cơ bản đến Async Mastery',
    courseId: 'c-4',
    studentName: 'Minh Khoa',
    instructorName: 'Nguyễn Thành Long',
    issuedAt: '15/12/2024',
    thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=280&fit=crop',
  },
];

// ─── Data access functions ────────────────────────────────────────────────────
export function getCourse(id: string): Course | undefined {
  return courses.find((c) => c.id === id || c.slug === id);
}

export function getQuiz(id: string): Quiz | undefined {
  if (id === 'q-2') return demoQuiz;
  return undefined;
}

export function getProblem(id: string): CodingProblem | undefined {
  if (id === 'p-1') return demoProblem;
  return undefined;
}

export function searchCourses(query: string, track?: string): Course[] {
  return courses.filter((c) => {
    const matchQuery =
      !query || c.title.toLowerCase().includes(query.toLowerCase()) || c.tags.includes(query.toLowerCase());
    const matchTrack = !track || c.track === track;
    return matchQuery && matchTrack;
  });
}
