// src/app/instructor/(dashboard)/analytics/revenue/_components/course-comparison.tsx
import { BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fmtNum, fmtShare } from '@/lib/analytics';
import { formatVnd } from '@/types/revenue';
import type { RevenueRange, Sales } from '@/types/analytics';
import { AnalyticsEmpty, Panel } from '../../_components/analytics-shell';

const NUM = 'text-right tabular-nums';

export function CourseComparison({ courses, range }: { courses: Sales['courses']; range: RevenueRange }) {
  return (
    <Panel
      title="So sánh khoá"
      description={`Trong ${range === '30d' ? '30 ngày' : '12 tháng'} gần nhất. Chuyển đổi = người ghi danh / người xem trang.`}
    >
      {courses.length === 0 ? (
        <AnalyticsEmpty icon={BookOpen} title="Bạn chưa có khoá học nào">Tạo khoá để theo dõi bán hàng.</AnalyticsEmpty>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-170">
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead scope="col">Khoá</TableHead>
                <TableHead scope="col" className={NUM}>Bạn nhận</TableHead>
                <TableHead scope="col" className={NUM}>Lượt bán</TableHead>
                <TableHead scope="col" className={NUM}>Ghi danh mới</TableHead>
                <TableHead scope="col" className={NUM}>Người xem trang</TableHead>
                <TableHead scope="col" className={NUM}>Tỉ lệ chuyển đổi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((c) => (
                <TableRow key={c.courseId}>
                  <TableCell className="max-w-72 whitespace-normal">
                    <span className="font-semibold text-foreground">{c.title}</span>
                    {c.priceAmount === 0 && <Badge variant="secondary" className="ml-2 align-middle">Free</Badge>}
                  </TableCell>
                  <TableCell className={NUM}>{formatVnd(c.earned)}</TableCell>
                  <TableCell className={NUM}>{fmtNum(c.sales)}</TableCell>
                  <TableCell className={NUM}>{fmtNum(c.newEnrollments)}</TableCell>
                  <TableCell className={NUM}>{fmtNum(c.visitors)}</TableCell>
                  <TableCell className={NUM}>{fmtShare(c.conversion)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Panel>
  );
}
