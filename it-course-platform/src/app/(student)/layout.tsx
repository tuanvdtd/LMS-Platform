import SiteHeader from "@/components/layout/site-header";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader cartCount={2} />
      <main>{children}</main>
    </>
  );
}
