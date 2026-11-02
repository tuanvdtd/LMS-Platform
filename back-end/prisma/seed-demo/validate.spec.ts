import { validateData, validateCoverage } from './validate.ts';
import type { SeedCourse, SeedData, SeedUser } from './data/types.ts';
import { SEED_DATA } from './data/index.ts';
import { REVIEW_TEMPLATES, REPLY_TEMPLATES } from './data/reviews.ts';

const teacher: SeedUser = {
  name: 'Nguyễn Văn A', email: 'a.nguyen@skillpath.test', occupation: 'backend_developer', level: 'advanced',
  targetTopics: ['nodejs', 'sql'],
  profile: { headline: 'h', bio: 'b', website: 'https://a.skillpath.test', socials: {}, bank: { bin: '970436', accountNo: '0123456789', accountName: 'NGUYEN VAN A' } },
};
const q = (stem: string) => ({
  type: 'single_choice' as const, stem, relatedLecture: 0,
  options: [{ content: 'x', correct: true as const, explanation: 'e' }, { content: 'y', explanation: 'e' }, { content: 'z', explanation: 'e' }],
});
const course = (over: Partial<SeedCourse> = {}): SeedCourse => ({
  instructorEmail: teacher.email, categorySlug: 'web-development', topics: [{ slug: 'nodejs', primary: true }, { slug: 'javascript' }],
  language: 'vi', level: 'beginner', priceAmount: 499_000, status: 'published',
  title: 'Node.js', subtitle: 'Xây REST API với Node.js và Express, triển khai lên server thật', description: Array(210).fill('từ').join(' '),
  learningObjectives: ['a', 'b', 'c', 'd'], requirements: ['r'], targetAudience: ['t'],
  thumbnail: { label: 'Node.js', tagline: 'REST API' },
  sections: [{ title: 'S1', lectures: ['l1', 'l2'] }, { title: 'S2', lectures: ['l3', 'l4'] }, { title: 'S3', lectures: ['l5', 'l6'] }],
  quiz: { title: 'Quiz', description: 'd', questions: [q('1'), q('2'), q('3'), q('4'), q('5')] },
  ...over,
});
const data = (c: SeedCourse, u: SeedUser = teacher): SeedData => ({ users: [u], courses: [c] });

describe('validateData', () => {
  it('dữ liệu hợp lệ không có lỗi', () => expect(validateData(data(course()))).toEqual([]));
  it('giá ngoài bậc', () => expect(validateData(data(course({ priceAmount: 349_000 }))).join()).toMatch(/PRICE_TIERS/));
  it('khoá có phí của giảng viên chưa xác minh', () =>
    expect(validateData(data(course(), { ...teacher, profile: undefined })).join()).toMatch(/chưa xác minh/));
  it('mô tả dưới 200 từ', () => expect(validateData(data(course({ description: 'ngắn' }))).join()).toMatch(/200 từ/));
  it('câu hỏi không có đáp án đúng', () => {
    const bad = course();
    bad.quiz.questions[0].options.forEach((o) => delete o.correct);
    expect(validateData(data(bad)).join()).toMatch(/đáp án đúng/);
  });
  it('email sai đuôi', () =>
    expect(validateData(data(course(), { ...teacher, email: 'a@gmail.com' })).join()).toMatch(/@skillpath\.test/));
  it('bài code thiếu test ẩn', () => {
    const c = course({ exercise: {
      title: 'e', learningObjective: 'o', instructions: 'i', hints: [], solutionExplanation: 's', difficulty: 'easy', relatedLecture: 0,
      code: [{ language: 'javascript', starter: 'x', solution: 'y' }],
      tests: [{ input: '1', expectedOutput: '1', isPublic: true }, { input: '2', expectedOutput: '2', isPublic: true }, { input: '3', expectedOutput: '3', isPublic: true }],
    } });
    expect(validateData(data(c)).join()).toMatch(/test ẩn/);
  });
});

describe('validateCoverage', () => {
  it('báo topic nghề chưa có khoá published', () => {
    expect(validateCoverage(data(course()), ['nodejs', 'react'])).toEqual(['topic nghề "react" chưa có khoá published']);
    expect(validateCoverage(data(course({ status: 'draft' })), ['nodejs'])).toHaveLength(1);
  });
});


const OCCUPATION_TOPICS = `langchain, retrieval-augmented-generation, large-language-models, apache-kafka, data-analysis, data-engineering, pandas, sql, mysql, postgresql, devops, docker, git, github, kubernetes, 3d-modeling, game-development, blender, godot, unity, unreal-engine, amazon-aws, mlops, pytorch, tensorflow, data-science, deep-learning, machine-learning, python, android-development, dart-programming-language, google-flutter, ios-development, kotlin, mobile-development, react-native, swift, swiftui, linux, shell-scripting, system-administration, c-plus-plus, java, spring-framework, c-sharp, algorithms, data-structures, software-architecture, system-design-interview, automation-testing, istqb-certified-tester-foundation-level-ctfl, playwright, postman, pytest, selenium-webdriver, css, user-interface, angular, aspnet-core, fastapi, nextjs, nodejs, react, typescript, javascript, html, web-development`.split(', ');

describe('SEED_DATA thật', () => {
  it('có 67 topic nghề', () => expect(OCCUPATION_TOPICS).toHaveLength(67));
  it('hợp lệ', () => expect(validateData(SEED_DATA)).toEqual([]));
  it('phủ đủ topic nghề', () => expect(validateCoverage(SEED_DATA, OCCUPATION_TOPICS)).toEqual([]));
  it('đủ 49 khoá, 45 published, 14 khoá tiếng Anh', () => {
    expect(SEED_DATA.courses).toHaveLength(49);
    expect(SEED_DATA.courses.filter((c) => c.status === 'published')).toHaveLength(45);
    expect(SEED_DATA.courses.filter((c) => c.language === 'en')).toHaveLength(14);
  });
  it('mỗi người đứng lớp có 2–4 khoá', () => {
    const n = new Map<string, number>();
    for (const c of SEED_DATA.courses) n.set(c.instructorEmail, (n.get(c.instructorEmail) ?? 0) + 1);
    expect(n.size).toBe(15);
    for (const v of n.values()) {
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(4);
    }
  });
  it('mẫu đánh giá đủ số lượng và đều có placeholder', () => {
    for (const lang of ['vi', 'en'] as const) {
      for (const [stars, min] of [[5, 10], [4, 10], [3, 6], [2, 4]] as const) {
        const xs = REVIEW_TEMPLATES[lang][stars];
        expect(xs.length).toBeGreaterThanOrEqual(min);
        for (const s of xs) expect(s).toMatch(/\{tech\}|\{lecture\}/);
      }
      expect(REPLY_TEMPLATES[lang].positive.length).toBeGreaterThanOrEqual(8);
      expect(REPLY_TEMPLATES[lang].critical.length).toBeGreaterThanOrEqual(6);
    }
  });
});
