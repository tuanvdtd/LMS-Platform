"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { ChecklistKey } from "@/types/instructor-course";
import { useCourse } from "./course-provider";
import { GuardedLink } from "./guarded-link";

type Entry = { label: string; key?: ChecklistKey; page?: "goals" | "curriculum" | "basics" };

// Mục không có page = "Sắp có" (đợt 4).
const GROUPS: { title: string; entries: Entry[] }[] = [
  {
    title: "Lên kế hoạch",
    entries: [{ label: "Học viên mục tiêu", key: "goals", page: "goals" }],
  },
  {
    title: "Tạo nội dung",
    entries: [{ label: "Khung chương trình", key: "curriculum", page: "curriculum" }],
  },
  {
    title: "Xuất bản",
    entries: [
      { label: "Trang tổng quan", key: "basics", page: "basics" },
      { label: "Định giá" },
      { label: "Khuyến mại" },
    ],
  },
];

function StepIcon({ done }: { done: boolean }) {
  return done ? (
    <span className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
      <Check className="size-3.5" strokeWidth={3} />
    </span>
  ) : (
    <span className="size-5.5 shrink-0 rounded-full border-2 border-slate-300 dark:border-slate-600" />
  );
}

export function ChecklistSidebar() {
  const { course } = useCourse();
  const pathname = usePathname();
  const base = `/instructor/courses/${course.id}/manage`;
  const done = course.checklist.filter((c) => c.done).length;
  const total = course.checklist.length;
  const left = total - done;

  return (
    <aside className="flex flex-col gap-5 border-b bg-background px-4 py-5 md:sticky md:top-15 md:h-[calc(100vh-3.75rem)] md:overflow-y-auto md:border-r md:border-b-0">
      <div className="flex flex-col gap-2 px-2.5">
        <div className="flex justify-between text-sm">
          <span className="font-semibold">Tiến độ gửi duyệt</span>
          <span className="text-muted-foreground">
            {done}/{total} bước
          </span>
        </div>
        <Progress
          value={(done / total) * 100}
          className="[&_[data-slot=progress-indicator]]:bg-green-500"
          aria-label="Tiến độ gửi duyệt"
        />
      </div>

      <nav className="flex flex-col gap-4" aria-label="Các bước tạo khoá học">
        {GROUPS.map((group, gi) => (
          <Fragment key={group.title}>
            {gi > 0 && <Separator />}
            <div className="flex flex-col gap-0.5">
              <h2 className="px-2.5 pb-1 text-[11.5px] font-bold tracking-wider text-muted-foreground uppercase">
                {group.title}
              </h2>
              {group.entries.map((entry) => {
                const item = course.checklist.find((c) => c.key === entry.key);
                if (!entry.page) {
                  return (
                    <div
                      key={entry.label}
                      className="flex items-center gap-2.5 px-2.5 py-2 text-sm opacity-55"
                    >
                      <StepIcon done={false} />
                      <span className="flex-1">{entry.label}</span>
                      <span className="text-xs text-muted-foreground">
                        Sắp có
                      </span>
                    </div>
                  );
                }
                const href = `${base}/${entry.page}`;
                const active = pathname === href;
                const missing = item && !item.done ? item.missing : [];
                return (
                  <div key={entry.label}>
                    <GuardedLink
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-muted",
                        active &&
                          "bg-primary/10 font-semibold text-primary hover:bg-primary/10",
                      )}
                    >
                      <StepIcon done={!!item?.done} />
                      <span className="flex-1">{entry.label}</span>
                      {missing.length > 0 && !active && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11.5px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          còn {missing.length}
                        </span>
                      )}
                    </GuardedLink>
                    {active && missing.length > 0 && (
                      <ul className="flex flex-col pt-0.5 pb-2">
                        {missing.map((m) => (
                          <li key={m.message}>
                            <GuardedLink
                              href={`${href}#${m.anchor}`}
                              className="block py-1 pl-10.5 text-[12.5px]/snug text-amber-700 hover:underline dark:text-amber-400"
                            >
                              {m.message}
                            </GuardedLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </Fragment>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2 border-t px-2.5 pt-4">
        <Button variant="accent" className="w-full" disabled>
          Gửi đi để xem xét
        </Button>
        <p className="text-[12.5px]/normal text-muted-foreground">
          {left > 0
            ? `Hoàn thành ${left} bước còn lại để gửi duyệt.`
            : "Mọi bước đã xong."}{" "}
          Gửi duyệt sắp có ở đợt 4.
        </p>
      </div>
    </aside>
  );
}
