import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";
import { AuthProvider } from "@/context/AuthContext";

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
  keywords: ["주식", "감성 분석", "AI", "뉴스", "기술적 분석", "AAPL", "TSLA"],
  openGraph: {
    title: "LuminSight - AI 주식 감성 분석",
    description: "실시간 뉴스 기반 주식 감성 분석 대시보드",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          {/* 로그인/콜백 페이지는 사이드바 없이, 일반 페이지는 사이드바+푸터 포함 */}
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
