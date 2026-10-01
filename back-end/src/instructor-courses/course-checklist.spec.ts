import {
  buildChecklist,
  type ChecklistInput,
  countWords,
} from './course-checklist.js';

const complete: ChecklistInput = {
  title: 'React',
  subtitle: 'Từ số 0',
  description: 'từ '.repeat(200),
  level: 'beginner',
  track: 'frontend',
  thumbnailUrl: 'https://cdn.example.com/t.png',
  learningObjectives: ['a', 'b', 'c', 'd'],
  requirements: ['r'],
  targetAudience: ['t'],
  hasPrimaryTopic: true,
  categoryDepth: 2,
  publishedLectureCount: 5,
  videoSeconds: 30 * 60,
};

const empty: ChecklistInput = {
  title: 'React',
  subtitle: null,
  description: null,
  level: null,
  track: null,
  thumbnailUrl: null,
  learningObjectives: [],
  requirements: [],
  targetAudience: [],
  hasPrimaryTopic: false,
  categoryDepth: null,
  publishedLectureCount: 0,
  videoSeconds: 0,
};

const byKey = (input: ChecklistInput) =>
  Object.fromEntries(buildChecklist(input).map((i) => [i.key, i]));

describe('countWords', () => {
  it('rỗng / null / chỉ khoảng trắng → 0', () => {
    expect(countWords(null)).toBe(0);
    expect(countWords('')).toBe(0);
    expect(countWords('   \n\t ')).toBe(0);
  });
  it('nhiều khoảng trắng liên tiếp không sinh từ rỗng', () => {
    expect(countWords('  một   hai\n\tba  ')).toBe(3);
  });
});

describe('buildChecklist', () => {
  it('đủ điều kiện → 3 mục done, thứ tự goals, curriculum, basics', () => {
    expect(buildChecklist(complete)).toEqual([
      { key: 'goals', done: true, missing: [] },
      { key: 'curriculum', done: true, missing: [] },
      { key: 'basics', done: true, missing: [] },
    ]);
  });

  it('khoá trống → goals thiếu đủ 3 ý', () => {
    expect(byKey(empty).goals).toEqual({
      key: 'goals',
      done: false,
      missing: [
        { message: 'Cần thêm 4 mục tiêu học tập', anchor: 'objectives' },
        { message: 'Cần ít nhất 1 yêu cầu', anchor: 'requirements' },
        { message: 'Cần ít nhất 1 đối tượng học viên', anchor: 'audience' },
      ],
    });
  });

  it('khoá trống → curriculum thiếu bài giảng và phút video', () => {
    expect(byKey(empty).curriculum.missing).toEqual([
      { message: 'Cần thêm 5 bài giảng đã xuất bản', anchor: 'curriculum' },
      { message: 'Cần thêm 30 phút video', anchor: 'curriculum' },
    ]);
  });

  it('khoá trống → basics thiếu đủ 7 ý theo đúng thứ tự', () => {
    expect(byKey(empty).basics.missing).toEqual([
      { message: 'Thiếu phụ đề', anchor: 'subtitle' },
      { message: 'Mô tả còn thiếu 200 từ', anchor: 'description' },
      { message: 'Chưa chọn cấp độ', anchor: 'level' },
      { message: 'Chưa chọn track', anchor: 'track' },
      { message: 'Chưa chọn thể loại con', anchor: 'category' },
      { message: 'Chưa chọn chủ đề chính', anchor: 'topic' },
      { message: 'Chưa có ảnh bìa', anchor: 'thumbnail' },
    ]);
  });

  it('sát ngưỡng: thiếu đúng 1', () => {
    const c = byKey({
      ...complete,
      learningObjectives: ['a', 'b', 'c'],
      description: 'từ '.repeat(199),
      publishedLectureCount: 4,
      videoSeconds: 30 * 60 - 1,
    });
    expect(c.goals.missing).toEqual([{ message: 'Cần thêm 1 mục tiêu học tập', anchor: 'objectives' }]);
    expect(c.basics.missing).toEqual([{ message: 'Mô tả còn thiếu 1 từ', anchor: 'description' }]);
    expect(c.curriculum.missing).toEqual([
      { message: 'Cần thêm 1 bài giảng đã xuất bản', anchor: 'curriculum' },
      { message: 'Cần thêm 1 phút video', anchor: 'curriculum' },
    ]);
  });

  it('category cấp 1 không tính; phụ đề chỉ khoảng trắng coi như thiếu', () => {
    const c = byKey({ ...complete, categoryDepth: 1, subtitle: '   ' });
    expect(c.basics.done).toBe(false);
    expect(c.basics.missing.map((m) => m.anchor)).toEqual(['subtitle', 'category']);
  });
});
