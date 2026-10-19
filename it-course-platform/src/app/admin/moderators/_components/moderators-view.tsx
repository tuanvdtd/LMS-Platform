'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  createModerator,
  listModerators,
  lockModerator,
  type Moderator,
  resendModeratorInvite,
  setModeratorCategories,
  unlockModerator,
} from '@/lib/api/admin';
import { apiMessage } from '@/lib/api/checkout';
import type { CategoryNode } from '@/types';

const INVALID_CATEGORY = 'Danh mục không hợp lệ, tải lại trang rồi chọn lại';
const errorCode = (e: unknown) => (axios.isAxiosError(e) ? e.response?.data?.code : undefined);

export function ModeratorsView({ categories }: { categories: CategoryNode[] }) {
  const [items, setItems] = useState<Moderator[] | null>(null);
  // 'new' = tạo mới; Moderator = sửa danh mục của người đó.
  const [editing, setEditing] = useState<Moderator | 'new' | null>(null);
  const [lockTarget, setLockTarget] = useState<Moderator | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let stale = false;
    listModerators().then(
      (d) => {
        if (!stale) setItems(d);
      },
      () => {
        if (!stale) toast.error('Không tải được danh sách');
      },
    );
    return () => {
      stale = true;
    };
  }, []);

  const upsert = (m: Moderator) =>
    setItems((list) => (list?.some((x) => x.id === m.id) ? list.map((x) => (x.id === m.id ? m : x)) : [m, ...(list ?? [])]));

  async function toggleLock(m: Moderator) {
    setBusyId(m.id);
    try {
      upsert(await (m.status === 'locked' ? unlockModerator(m.id) : lockModerator(m.id)));
      toast.success(m.status === 'locked' ? 'Đã mở khoá' : 'Đã khoá tài khoản');
      setLockTarget(null);
    } catch (e) {
      toast.error(apiMessage(e, 'Thao tác thất bại, thử lại'));
    } finally {
      setBusyId(null);
    }
  }

  async function resend(m: Moderator) {
    setBusyId(m.id);
    try {
      await resendModeratorInvite(m.id);
      toast.success(`Đã gửi lại mail mời tới ${m.email}`);
    } catch (e) {
      toast.error(apiMessage(e, 'Không gửi được mail mời, thử lại'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Moderator</h1>
        <Button onClick={() => setEditing('new')}>Thêm moderator</Button>
      </div>

      <section className="rounded-2xl border bg-card p-5">
        {!items ? (
          <Skeleton className="h-40 w-full" />
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có moderator nào.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Moderator</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Đã duyệt</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.email}</div>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {m.categories.length === 0 ? (
                      <span className="text-muted-foreground">Chưa gán</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {m.categories.map((c) => (
                          <Badge key={c.id} variant="outline">
                            {c.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">{m.reviewedCount}</TableCell>
                  <TableCell>
                    <Badge variant={m.status === 'locked' ? 'destructive' : 'secondary'}>
                      {m.status === 'locked' ? 'Đã khoá' : 'Hoạt động'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" disabled={busyId === m.id} onClick={() => setEditing(m)}>
                        Sửa danh mục
                      </Button>
                      <Button size="sm" variant="outline" disabled={busyId === m.id} onClick={() => resend(m)}>
                        Gửi lại mail mời
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={m.status === 'locked' ? undefined : 'border-destructive/40 text-destructive hover:text-destructive'}
                        disabled={busyId === m.id}
                        onClick={() => setLockTarget(m)}
                      >
                        {m.status === 'locked' ? 'Mở khoá' : 'Khoá'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {editing && (
        <ModeratorDialog
          key={editing === 'new' ? 'new' : editing.id}
          target={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={(m) => {
            upsert(m);
            setEditing(null);
          }}
        />
      )}

      <AlertDialog open={!!lockTarget} onOpenChange={(o) => !o && setLockTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {lockTarget?.status === 'locked' ? 'Mở khoá' : 'Khoá'} tài khoản {lockTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lockTarget?.status === 'locked'
                ? 'Moderator sẽ đăng nhập lại được.'
                : 'Moderator bị đăng xuất ngay và không đăng nhập được cho tới khi mở khoá.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!busyId}>Huỷ</AlertDialogCancel>
            <AlertDialogAction disabled={!!busyId} onClick={() => lockTarget && toggleLock(lockTarget)}>
              {lockTarget?.status === 'locked' ? 'Mở khoá' : 'Khoá'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Dùng chung cho tạo mới (tên + email + danh mục) và sửa danh mục (chỉ danh mục).
function ModeratorDialog({
  target,
  categories,
  onClose,
  onSaved,
}: {
  target: Moderator | 'new';
  categories: CategoryNode[];
  onClose: () => void;
  onSaved: (m: Moderator) => void;
}) {
  const isNew = target === 'new';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>(isNew ? [] : target.categories.map((c) => c.id));
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setEmailError(null);
    try {
      const m = isNew
        ? await createModerator({ name: name.trim(), email: email.trim(), categoryIds: selected })
        : await setModeratorCategories(target.id, selected);
      toast.success(isNew ? `Đã tạo moderator và gửi mail mời tới ${m.email}` : 'Đã cập nhật danh mục');
      onSaved(m);
    } catch (err) {
      const code = errorCode(err);
      if (code === 'EMAIL_TAKEN') setEmailError(apiMessage(err, 'Email này đã được sử dụng'));
      else toast.error(code === 'INVALID_CATEGORY' ? INVALID_CATEGORY : apiMessage(err, 'Lưu thất bại, thử lại'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent>
        <form onSubmit={save} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{isNew ? 'Thêm moderator' : 'Sửa danh mục'}</DialogTitle>
            <DialogDescription>
              {isNew
                ? 'Moderator nhận mail mời để tự đặt mật khẩu, chỉ duyệt khoá thuộc danh mục được gán.'
                : `Chọn các danh mục ${target.name} được duyệt.`}
            </DialogDescription>
          </DialogHeader>

          {isNew && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="mod-name">Tên</Label>
                <Input id="mod-name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="mod-email">Email</Label>
                <Input
                  id="mod-email"
                  type="email"
                  required
                  value={email}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'mod-email-error' : undefined}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(null);
                  }}
                />
                {emailError && (
                  <p id="mod-email-error" className="text-xs text-destructive">
                    {emailError}
                  </p>
                )}
              </div>
            </>
          )}

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Danh mục cấp 1</legend>
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không tải được danh mục</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {categories.map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`mod-cat-${c.id}`}
                      checked={selected.includes(c.id)}
                      onCheckedChange={(v) => setSelected((s) => (v === true ? [...s, c.id] : s.filter((id) => id !== c.id)))}
                    />
                    <Label htmlFor={`mod-cat-${c.id}`} className="font-normal">
                      {c.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </fieldset>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" isLoading={saving} disabled={isNew && (!name.trim() || !email.trim())}>
              {isNew ? 'Tạo & gửi mail mời' : 'Lưu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
