import Link from 'next/link';
import { SiteFooter } from '@/components/layout/site-footer';
import { getCategoryTree } from '@/lib/api/categories';

// Khung chung cho trang Điều khoản và Chính sách bảo mật: mục lục dính bên trái, cột đọc ~72 ký tự.
export const SUPPORT_EMAIL = 'support@tuandt.me';
export const LEGAL_UPDATED = '15/11/2026';

export type LegalSection = { id: string; title: string; body: React.ReactNode };

const tocLink = 'block rounded-md py-1.5 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring';

export async function LegalPage({ title, intro, sections, other }: {
  title: string;
  intro: React.ReactNode;
  sections: LegalSection[];
  other: { href: string; label: string };
}) {
  // API sập thì footer thiếu cột danh mục, nhưng văn bản pháp lý vẫn phải đọc được.
  const categories = await getCategoryTree().catch(() => []);
  // Số thứ tự giữ lại vì văn bản pháp lý được dẫn chiếu theo số mục ("xem mục 4").
  const toc = (
    <ol className="flex flex-col">
      {sections.map((s, i) => (
        <li key={s.id}>
          <a href={`#${s.id}`} className={tocLink}>{i + 1}. {s.title}</a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <div className="mx-auto w-full max-w-screen-xl px-4 py-10 lg:py-14">
        <header className="border-b pb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Cập nhật lần cuối: {LEGAL_UPDATED}</p>
          <p className="mt-5 max-w-[72ch] leading-7 text-foreground/85">{intro}</p>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-x-12 gap-y-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <details className="rounded-lg border px-4 py-2 lg:hidden">
            <summary className="cursor-pointer py-1.5 text-sm font-semibold">Mục lục</summary>
            <nav aria-label="Mục lục">{toc}</nav>
          </details>
          <nav aria-label="Mục lục" className="sticky top-24 hidden max-h-[calc(100vh-7rem)] self-start overflow-y-auto lg:block">
            <h2 className="mb-2 text-sm font-semibold">Mục lục</h2>
            {toc}
          </nav>

          <article className="flex max-w-[72ch] flex-col gap-10">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-24">
                <h2 id={`${s.id}-title`} className="text-xl font-bold text-balance">{i + 1}. {s.title}</h2>
                <div className="mt-3 flex flex-col gap-3 text-[0.9375rem] leading-7 text-foreground/85 [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5">
                  {s.body}
                </div>
              </section>
            ))}
            <p className="border-t pt-6 text-sm text-muted-foreground">
              Xem thêm:{' '}
              <Link href={other.href} className="font-semibold text-primary underline-offset-4 hover:underline">{other.label}</Link>
            </p>
          </article>
        </div>
      </div>
      <SiteFooter categories={categories} />
    </>
  );
}

// Ghi chú nổi bật trong mục. Không dùng Alert (role="alert" sẽ bị trình đọc màn hình đọc chen ngang).
export function LegalNote({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <aside className="rounded-lg border bg-muted px-4 py-3 text-sm leading-6">
      <strong>{title}</strong> {children}
    </aside>
  );
}

export function SupportEmail() {
  return <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>;
}
