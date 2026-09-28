import Header from "@/components/layout/header";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header cartCount={2} />
      <main>{children}</main>
    </>
  );
}
