import Header from "@/components/layout/header";
import InstructorSidebar from "@/components/layout/instructor-sidebar";

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header cartCount={2} />
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <InstructorSidebar />
        {children}
      </div>
    </>
  );
}
