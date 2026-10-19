import type { CurriculumSection, QuizDetail } from './curriculum';
import type { ApprovalStatus, CourseDetail } from './instructor-course';

// Khớp API admin back-end/src/course-approvals (spec pricing-submit-review §5.1).
type Person = { id: string; name: string; email: string };

export interface AdminApprovalRow {
  id: string;
  status: ApprovalStatus;
  createdAt: string;
  reviewedAt: string | null;
  course: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    priceAmount: number;
    instructor: Person;
    // Khoá gắn danh mục cấp 2; parent là cấp 1 (cấp moderator được gán).
    // null khi giảng viên bỏ chọn danh mục sau lần bị từ chối (dòng lịch sử vẫn hiện)
    category: { id: string; name: string; parent: { id: string; name: string } | null } | null;
  };
}

export interface ApprovalRecord {
  id: string;
  status: ApprovalStatus;
  copyrightNote: string | null;
  reason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  courseId: string;
  submittedBy: Person;
  reviewedBy: { id: string; name: string } | null;
}

export interface AdminApprovalDetail {
  approval: ApprovalRecord;
  course: CourseDetail;
  sections: CurriculumSection[];
  quizzes: Record<string, QuizDetail>; // theo itemId
  history: ApprovalRecord[];
}
