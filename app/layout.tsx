import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "커피기술커피클럽",
  description: "커피기술커피클럽의 생두 정보를 확인하세요",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#F4F1FF] text-[#111]">{children}</body>
    </html>
  );
}
