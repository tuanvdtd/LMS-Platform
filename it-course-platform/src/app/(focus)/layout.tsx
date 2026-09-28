import Header from "@/components/layout/header";

// Full-height workspaces (quiz, code, messages) render their own <main>
export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header cartCount={2} />
      {children}
    </>
  );
}
