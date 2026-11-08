// "Điểm yếu biết trước" của học viên giả lập: seed cho họ làm bài qua engine thật, xác suất đúng = expected(năng lực, R câu).
// Giai đoạn 2 dùng lại để đo Precision@K. 1500 ≈ 70% (Vững), 1200 ≈ 30% (Yếu).
export const SKILL_ABILITIES: Record<string, Record<string, number>> = {
  'lucas.meyer@skillpath.test': { html: 1600, css: 1450, javascript: 1520, typescript: 1400, react: 1250 },
  'huy.do@skillpath.test': { html: 1550, css: 1300, javascript: 1350, react: 1150 },
  'lananh.nguyen@skillpath.test': { html: 1450, css: 1500, javascript: 1250, react: 1100, nextjs: 1050 },
  'thao.nguyen@skillpath.test': { sql: 1550, javascript: 1150 },
  'minh.nguyen@skillpath.test': { javascript: 1500, typescript: 1300, nodejs: 1450, sql: 1350 },
};
