import type { Metadata } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SentryUser } from "@/components/sentry-user";
import { NotificationSocket } from "@/components/layout/notification-socket";
import { Toaster } from "@/components/ui/sonner";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-body",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-code",
});

export const metadata: Metadata = {
  title: "SkillPath",
  description: "Nền tảng học lập trình theo lộ trình kỹ năng",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={cn("h-full bg-background antialiased font-sans", beVietnamPro.variable, jetbrainsMono.variable)}
    >
      <body className="min-h-full bg-background text-foreground">
        <SentryUser />
        <NotificationSocket />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          {/* Góc trên phải, sát đỉnh màn hình (đè lên header) để gần tầm mắt; toast tự tắt / có nút đóng
              nên chỉ che chuông thông báo và menu tài khoản trong vài giây. */}
          <Toaster position="top-right" closeButton offset={{ top: 16 }} mobileOffset={{ top: 12 }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
