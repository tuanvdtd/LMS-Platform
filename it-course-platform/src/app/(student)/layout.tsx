import SiteHeader from "@/components/layout/site-header";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
    </>
  );
}
