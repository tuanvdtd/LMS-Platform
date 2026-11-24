import type { FlagCode } from '../../../src/analytics/item-analysis.ts';
import type { ItemParam, SimBug } from '../assessment-sim.ts';
import type { Persona } from '../showcase.ts';

// Khoá trình diễn cho dashboard phân tích giảng viên: đủ người học để item analysis có nghĩa (n ≥ 30) và có lỗi cài sẵn
// biết trước để kiểm chứng dashboard phát hiện đúng (cùng tinh thần đo gợi ý bằng Precision@K). showcase.spec.ts là bài kiểm.
export const SHOWCASE: {
  courseTitle: string;
  learners: number;
  publishedDaysAgo: number;
  gainRating: number;
  questions: (ItemParam & { expect?: FlagCode[] })[];
  exerciseB: number;
  bugs: SimBug[];
  hardestTestPosition: number;
  personaMix: readonly (readonly [Persona, number])[];
  // Mẫu cài sẵn cho "Hành vi học" (video thứ videoIndex theo thứ tự curriculum, chỉ tính bài video):
  // rewatch: ~35% người xem tua lại đoạn [from, to] thời lượng; drop: ~20% người xem dừng quanh mốc `at` (±jitterSec) rồi tick hoàn thành.
  video: { rewatch: { videoIndex: number; from: number; to: number; share: number }; drop: { videoIndex: number; at: number; share: number; jitterSec: number } };
} = {
  courseTitle: 'JavaScript nền tảng cho người mới',
  learners: 120,
  publishedDaysAgo: 240,
  // Năng lực Elo tăng thêm khi học xong 100% (tỉ lệ thuận tiến độ), giữa lượt đánh giá trước và sau ghi danh.
  gainRating: 500,
  // Theo đúng thứ tự câu trong quiz (data/courses/web.ts). a = độ phân biệt, b = độ khó trên thang θ ~ N(0, 1).
  questions: [
    { a: 2.0, b: 0.2 }, // "5" === 5
    { a: 1.0, b: -3.2, expect: ['too_easy'] }, // console.log — câu khởi động
    { a: 2.0, b: 0.4 }, // const + push
    // typeof null — key đặt nhầm "null", đúng thật là "object"; người không biết hay đoán "null" (đáp án "trực giác").
    { a: 2.0, b: 0.3, truth: [0], weights: [0.5, 3, 1], expect: ['negative_d'] },
    { a: 2.0, b: 0.0 }, // for...of
    { a: 2.0, b: -0.2, weights: [1, 1, 1, 0.02], expect: ['dead_distractor'] }, // khai báo const — phương án "print" vô lý
    { a: 2.0, b: 0.8 }, // map / filter (nhiều đáp án)
    { a: 1.8, b: 1.3, weights: [8, 1, 1], expect: ['attractive_distractor'] }, // 0.1 + 0.2 — hiểu lầm phổ biến
    { a: 2.0, b: 0.6 }, // event loop
    { a: 2.0, b: -0.4 }, // map(double)
  ],
  // Bài xếp loại học sinh: lỗi hay gặp nhất là dùng > thay vì >= ở mốc 8 và 5 → chỉ rớt test ẩn ở vị trí 2 (chứa điểm biên).
  exerciseB: 0,
  bugs: [
    { kind: 'boundary', weight: 50, failing: [2], status: 'wrong_answer', mutate: [['score >= 8', 'score > 8'], ['score >= 5', 'score > 5']] },
    { kind: 'rounding', weight: 20, failing: 'all', status: 'wrong_answer', mutate: [['(total / n).toFixed(2)', 'total / n']] },
    { kind: 'parse', weight: 15, failing: 'all', status: 'wrong_answer' },
    { kind: 'runtime', weight: 10, failing: 'all', status: 'runtime_error' },
    { kind: 'tle', weight: 5, failing: 'all', status: 'time_limit_exceeded' },
  ],
  hardestTestPosition: 2,
  personaMix: [['finisher', 25], ['steady', 25], ['stuck', 12], ['stalled', 20], ['ghost', 8], ['new', 10]],
  video: { rewatch: { videoIndex: 1, from: 0.45, to: 0.55, share: 0.35 }, drop: { videoIndex: 2, at: 0.6, share: 0.2, jitterSec: 10 } },
};
