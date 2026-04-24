import type { Metadata } from "next";
import "./globals.css";
import { getSiteSettings } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "커피기술커피클럽",
  description: "커피기술커피클럽의 생두 정보를 확인하세요",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let cssVars = ''
  try {
    const settings = await getSiteSettings()
    cssVars = Object.entries(settings).map(([k, v]) => `${k}:${v}`).join(';')
  } catch {
    cssVars = ''
  }

  return (
    <html lang="ko">
      <head>
        {cssVars && <style>{`:root{${cssVars}}`}</style>}
      </head>
      <body className="min-h-screen" style={{ background: 'var(--c-page-bg)', color: 'var(--c-text-1)', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
