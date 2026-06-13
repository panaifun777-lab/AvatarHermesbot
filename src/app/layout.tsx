import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/lib/query-provider";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/providers/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "飘叔 Piaoshu · AI分身操作系统",
  description: "Web4.0 AI原生智能分身操作系统 — 将AI从执行者升维为共生体，让智能分身成为你的超级杠杆",
  keywords: ["Piaoshu", "飘叔", "AI", "智能分身", "Web4.0", "AI分身", "认知分片", "证据链", "协作调度"],
  authors: [{ name: "Piaoshu Team" }],
  icons: {
    icon: "/logo-emoji.png",
  },
  openGraph: {
    title: "飘叔 Piaoshu · AI分身操作系统",
    description: "Web4.0 AI原生智能分身操作系统",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
              {children}
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
