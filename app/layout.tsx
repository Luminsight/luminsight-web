import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LuminSight - AI 주식 감성 분석",
  description: "실시간 뉴스 기반 주식 감성 분석 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-screen">
          {/* 사이드바 */}
          <Sidebar />

          {/* 메인 컨텐츠 영역 */}
          <div className="flex-1 lg:ml-[280px]">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
