import type { Metadata } from "next";
import "./globals.css";
import ThemeApplier from '@/components/ThemeApplier'
import BottomNav from '@/components/BottomNav'

export const metadata: Metadata = {
  title: "커피기술커피클럽",
  description: "커피기술커피클럽의 생두 정보를 확인하세요",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen no-scroll" style={{ background: 'var(--p-bg)', color: 'var(--p-ink)', fontFamily: "'Inter', sans-serif" }}>
        <ThemeApplier />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
