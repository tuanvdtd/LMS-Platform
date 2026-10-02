// Checklist "đã sẵn sàng gửi duyệt" (spec course-create-basics §4.4). Hàm thuần: đợt 4 dùng lại
// khi gửi duyệt. Định giá/khuyến mại thêm ở đợt 4.
export const MIN_OBJECTIVES = 4;
export const MIN_DESCRIPTION_WORDS = 200;
export const MIN_PUBLISHED_LECTURES = 5;
export const MIN_VIDEO_MINUTES = 30;

export type ChecklistKey = 'goals' | 'curriculum' | 'basics';
export type ChecklistMissing = { message: string; anchor: string };
export type ChecklistItem = { key: ChecklistKey; done: boolean; missing: ChecklistMissing[] };

export type ChecklistInput = {
  title: string;
  subtitle: string | null;
  description: string | null;
  level: string | null;
  thumbnailUrl: string | null;
  learningObjectives: string[];
  requirements: string[];
  targetAudience: string[];
  hasPrimaryTopic: boolean;
  categoryDepth: 1 | 2 | null;
  publishedLectureCount: number;
  videoSeconds: number;
};

export function countWords(text: string | null): number {
  return (text ?? '').trim().split(/\s+/).filter(Boolean).length;
}

const item = (key: ChecklistKey, missing: ChecklistMissing[]): ChecklistItem => ({
  key,
  done: missing.length === 0,
  missing,
});

export function buildChecklist(c: ChecklistInput): ChecklistItem[] {
  const goals: ChecklistMissing[] = [];
  if (c.learningObjectives.length < MIN_OBJECTIVES)
    goals.push({
      message: `Cần thêm ${MIN_OBJECTIVES - c.learningObjectives.length} mục tiêu học tập`,
      anchor: 'objectives',
    });
  if (c.requirements.length < 1) goals.push({ message: 'Cần ít nhất 1 yêu cầu', anchor: 'requirements' });
  if (c.targetAudience.length < 1)
    goals.push({ message: 'Cần ít nhất 1 đối tượng học viên', anchor: 'audience' });

  const curriculum: ChecklistMissing[] = [];
  if (c.publishedLectureCount < MIN_PUBLISHED_LECTURES)
    curriculum.push({
      message: `Cần thêm ${MIN_PUBLISHED_LECTURES - c.publishedLectureCount} bài giảng đã xuất bản`,
      anchor: 'curriculum',
    });
  const minVideoSeconds = MIN_VIDEO_MINUTES * 60;
  if (c.videoSeconds < minVideoSeconds)
    curriculum.push({
      message: `Cần thêm ${Math.ceil((minVideoSeconds - c.videoSeconds) / 60)} phút video`,
      anchor: 'curriculum',
    });

  // Tiêu đề luôn có (tạo/PATCH đều bắt 1–60 ký tự) nên không có dòng "thiếu tiêu đề".
  const basics: ChecklistMissing[] = [];
  if (!c.subtitle?.trim()) basics.push({ message: 'Thiếu phụ đề', anchor: 'subtitle' });
  const words = countWords(c.description);
  if (words < MIN_DESCRIPTION_WORDS)
    basics.push({ message: `Mô tả còn thiếu ${MIN_DESCRIPTION_WORDS - words} từ`, anchor: 'description' });
  if (!c.level) basics.push({ message: 'Chưa chọn cấp độ', anchor: 'level' });
  if (c.categoryDepth !== 2) basics.push({ message: 'Chưa chọn thể loại con', anchor: 'category' });
  if (!c.hasPrimaryTopic) basics.push({ message: 'Chưa chọn chủ đề chính', anchor: 'topic' });
  if (!c.thumbnailUrl) basics.push({ message: 'Chưa có ảnh bìa', anchor: 'thumbnail' });

  return [item('goals', goals), item('curriculum', curriculum), item('basics', basics)];
}
