import Header from "@/components/layout/header";

export default function CartlessLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header cartCount={0} />
      <main>{children}</main>
    </>
  );
}
