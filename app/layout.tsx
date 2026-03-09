import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";
import { AuthProvider } from "@/context/AuthContext";
import PwaRegister from "@/components/PwaRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LuminSight - AI 투자 동반자",
  description: "AI가 시장을 읽고, 내 투자 습관을 분석해주는 투자 공부 동반자",
  keywords: ["주식", "감성 분석", "AI", "투자 일지", "투자 공부", "AAPL", "TSLA"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LuminSight",
    startupImage: [
      { url: "/icons/apple-touch-icon.png" },
    ],
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "LuminSight - AI 투자 동반자",
    description: "AI가 시장을 읽고, 내 투자 습관을 분석해주는 투자 공부 동반자",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#8b7fd4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
          <PwaRegister />
          {/* 로그인/콜백 페이지는 사이드바 없이, 일반 페이지는 사이드바+푸터 포함 */}
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
