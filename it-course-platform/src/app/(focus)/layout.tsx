import SiteHeader from "@/components/layout/site-header";

// Full-height workspaces (quiz, code, messages) render their own <main>
export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
