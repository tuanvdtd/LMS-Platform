import { useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import type { ApplicationView } from '@/types/instructor-application';

// Lưu bước hiện tại; true = lưu được (onSaved đã gọi), false = lỗi đã hiện dưới từng ô.
export type StepSave = () => Promise<boolean>;

export type StepProps = {
  view: ApplicationView;
  onSaved: (v: ApplicationView) => void;
  // Bước còn thay đổi chưa lưu đăng ký hàm lưu; bấm sang bước khác thì wizard lưu trước rồi mới chuyển.
  registerSave: (save: StepSave | null) => void;
};

// Đăng ký hàm lưu với wizard khi form có thay đổi, và cảnh báo khi đóng tab / tải lại lúc chưa lưu.
// Cleanup trả null: bước bị unmount (đã lưu xong, chuyển bước) không để lại hàm lưu cũ.
// ponytail: link sidebar (điều hướng client của Next) không tự lưu, thêm khi có router guard dùng chung.
// Trả về hàm lưu đã gộp: nút "Lưu" và bấm stepper cùng gọi hàm này, nên bấm stepper khi
// đang lưu sẽ chờ chung lần lưu đó thay vì gửi PUT thứ hai.
export function useStepSave(dirty: boolean, save: StepSave, registerSave: StepProps['registerSave']): StepSave {
  const saveRef = useRef(save);
  const inflight = useRef<Promise<boolean> | null>(null);
  useEffect(() => {
    saveRef.current = save;
  });
  const run = useCallback(
    () =>
      (inflight.current ??= saveRef.current().finally(() => {
        inflight.current = null;
      })),
    [],
  );
  useEffect(() => {
    registerSave(dirty ? run : null);
    return () => registerSave(null);
  }, [dirty, registerSave, run]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  return run;
}

// 400 → lỗi từng ô theo phần tử cuối của path (['socials','github'] → github).
// fields: các ô bước này hiện được lỗi; không lỗi nào rơi vào ô nào (vd path rỗng) thì báo bằng toast.
// 409 (đơn đã nộp / đã là cao cấp ở tab khác) → báo rồi tải lại để hiện đúng trạng thái.
export function handleStepError(
  e: unknown,
  setErrors: (errors: Record<string, string>) => void,
  { fields = [], failMessage = 'Không lưu được, thử lại' }: { fields?: readonly string[]; failMessage?: string } = {},
) {
  const res = axios.isAxiosError(e) ? e.response : undefined;
  const list = res?.status === 400 ? (res.data?.errors as { path: string[]; message: string }[] | undefined) : undefined;
  if (list?.length) {
    const errors = Object.fromEntries(list.map((x) => [x.path.at(-1) ?? '', x.message]));
    setErrors(errors);
    if (!Object.keys(errors).some((k) => fields.includes(k))) toast.error(list[0].message);
  } else if (res?.status === 409) {
    toast.error(res.data?.message ?? 'Đơn không sửa được nữa');
    window.location.reload();
  } else {
    toast.error(failMessage);
  }
}
