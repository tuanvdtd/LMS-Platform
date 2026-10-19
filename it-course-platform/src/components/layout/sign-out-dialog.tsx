'use client';

import { LogOut } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSignOut } from '@/components/layout/use-sign-out';

// Đặt ngoài DropdownMenu/Sheet để không bị unmount khi menu đóng. Đang đăng xuất: không đóng được (Esc, nền, Huỷ).
export function SignOutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { signOut, pending } = useSignOut();

  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!pending) onOpenChange(next); }}>
      <AlertDialogContent>
        <div className="grid gap-2">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-muted">
              <LogOut className="size-5" aria-hidden />
            </span>
            <AlertDialogTitle>Đăng xuất khỏi SkillPath?</AlertDialogTitle>
          </div>
          <AlertDialogDescription>Bạn sẽ cần đăng nhập lại để tiếp tục học.</AlertDialogDescription>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Huỷ</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={signOut} isLoading={pending}>
            Đăng xuất
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
