import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "주식일기",
  description: "내 주식 거래와 매매 일기를 기록하고 포트폴리오를 관리합니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
