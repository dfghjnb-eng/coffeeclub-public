import type { Metadata } from "next";
import "./globals.css";
import { getSiteSettings } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "커피기술커피클럽",
  description: "커피기술커피클럽의 생두 정보를 확인하세요",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()
  const cssVars = Object.entries(settings).map(([k, v]) => `${k}:${v}`).join(';')

  return (
    <html lang="ko">
      <head>
        {cssVars && <style>{`:root{${cssVars}}`}</style>}
      </head>
      <body className="min-h-screen t-page">{children}</body>
    </html>
  );
}
