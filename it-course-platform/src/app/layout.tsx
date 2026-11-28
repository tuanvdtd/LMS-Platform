import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { fontVariables } from "./fonts";
import { cn } from "@/lib/utils";
import { SentryUser } from "@/components/sentry-user";
import { NotificationSocket } from "@/components/layout/notification-socket";
import { MessagesSocket } from "@/components/layout/messages-socket";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/cookie-consent";

export const metadata: Metadata = {
  title: "Aolumi",
  description: "Nền tảng học lập trình theo lộ trình kỹ năng",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={cn("h-full bg-background antialiased font-sans", fontVariables)}
    >
      <body className="min-h-full bg-background text-foreground">
        <SentryUser />
        <NotificationSocket />
        <MessagesSocket />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <CookieConsent />
          {/* Góc trên phải, sát đỉnh màn hình (đè lên header) để gần tầm mắt; toast tự tắt / có nút đóng
              nên chỉ che chuông thông báo và menu tài khoản trong vài giây. */}
          <Toaster position="top-right" closeButton offset={{ top: 16 }} mobileOffset={{ top: 12 }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
