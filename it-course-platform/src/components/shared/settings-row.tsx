// Một dòng cài đặt: tiêu đề + giải thích bên trái, nội dung bên phải; trên mobile xếp dọc.
export function SettingsRow({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-x-10 gap-y-3 border-b py-6 md:grid-cols-[15rem_minmax(0,1fr)]">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
