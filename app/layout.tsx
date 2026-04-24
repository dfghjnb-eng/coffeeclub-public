import type { Metadata } from "next";
import "./globals.css";
import ThemeApplier from '@/components/ThemeApplier'

export const metadata: Metadata = {
  title: "커피기술커피클럽",
  description: "커피기술커피클럽의 생두 정보를 확인하세요",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen" style={{ background: 'var(--c-page-bg)', color: 'var(--c-text-1)', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <ThemeApplier />
        {children}
      </body>
    </html>
  );
}
