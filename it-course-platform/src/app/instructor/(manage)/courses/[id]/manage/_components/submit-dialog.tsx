'use client';

import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getCourse, submitCourse } from '@/lib/api/instructor-courses';
import { useCourse } from './course-provider';

const NOTE_MAX = 1000;

// Gửi duyệt (spec pricing-submit-review §4.3): cam kết bản quyền bắt buộc + ghi chú tuỳ chọn cho admin.
export function SubmitDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { course, setCourse } = useCourse();
  const [agree, setAgree] = useState(false);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  // Đóng dialog thì xoá cam kết + ghi chú để lần mở sau phải tick lại.
  function changeOpen(o: boolean) {
    if (sending) return;
    if (!o) {
      setAgree(false);
      setNote('');
    }
    onOpenChange(o);
  }

  async function send() {
    setSending(true);
    try {
      setCourse(await submitCourse(course.id, note));
      setAgree(false);
      setNote('');
      onOpenChange(false);
      toast.success('Đã gửi duyệt. Bạn sẽ nhận email khi có kết quả.');
    } catch (e) {
      const data = axios.isAxiosError(e) ? e.response?.data : undefined;
      toast.error(data?.message ?? 'Gửi duyệt thất bại, thử lại');
      // Checklist/trạng thái có thể đã đổi (tab khác) → tải lại cho khớp.
      getCourse(course.id).then(setCourse, () => undefined);
    } finally {
      setSending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={changeOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Gửi khoá học đi duyệt</AlertDialogTitle>
          <AlertDialogDescription>
            Trong lúc chờ duyệt bạn không sửa được khoá học. Đội ngũ SkillPath sẽ phản hồi qua email.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2.5">
            <Checkbox id="copyright" checked={agree} onCheckedChange={(v) => setAgree(v === true)} />
            <Label htmlFor="copyright" className="text-sm/snug font-normal">
              Tôi cam kết nội dung khoá học do tôi sở hữu hoặc có quyền sử dụng, không vi phạm bản quyền của bên thứ ba.
            </Label>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">Ghi chú cho người duyệt (tuỳ chọn)</Label>
            <Textarea id="note" value={note} maxLength={NOTE_MAX} rows={3} onChange={(e) => setNote(e.target.value)} />
            <span className="self-end text-xs text-muted-foreground">{NOTE_MAX - note.length}</span>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel variant="ghost" disabled={sending}>
            Huỷ
          </AlertDialogCancel>
          <Button variant="accent" disabled={!agree || sending} onClick={() => void send()}>
            {sending ? 'Đang gửi…' : 'Gửi duyệt'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
