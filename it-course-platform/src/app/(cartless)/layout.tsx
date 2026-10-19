import SiteHeader from "@/components/layout/site-header";

export default function CartlessLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
    </>
  );
}
