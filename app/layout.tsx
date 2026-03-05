import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import DisclaimerModal from "@/components/DisclaimerModal";
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {/* 법적 면책 동의 팝업 (최초 진입 시 1회) */}
          <DisclaimerModal />

          <div className="flex min-h-screen">
            {/* 사이드바 */}
            <Sidebar />

            {/* 메인 컨텐츠 영역 */}
            <div className="flex-1 lg:ml-[280px] flex flex-col">
              <div className="flex-1">
                {children}
              </div>

              {/* 전역 면책 Footer */}
              <footer
                className="lg:block px-6 py-4 text-center"
                style={{
                  borderTop: '1px solid #f0ecfb',
                  background: '#faf9fe',
                }}
              >
                <p className="text-xs" style={{ color: '#b0accc' }}>
                  ⚠️ 본 서비스는 <b style={{ color: '#9e9ab8' }}>투자 정보 제공</b> 목적이며,
                  투자 조언·매수·매도 권유가 아닙니다.
                  모든 투자 결정과 손익에 대한 책임은 투자자 본인에게 있습니다.
                </p>
                <p className="text-xs mt-1" style={{ color: '#c4c0d8' }}>
                  © 2026 LuminSight · 본 서비스 이용 시{' '}
                  <a href="/terms" style={{ color: '#9e9ab8', textDecoration: 'underline' }}>이용약관</a>
                  {' '}및{' '}
                  <a href="/privacy" style={{ color: '#9e9ab8', textDecoration: 'underline' }}>개인정보처리방침</a>
                  에 동의하신 것으로 간주합니다.
                </p>
              </footer>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
