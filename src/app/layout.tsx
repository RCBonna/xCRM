import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { DateTimeLocalDefaults } from "@/components/datetime-local-defaults";
import { GlobalPendingCursor } from "@/components/global-pending-cursor";
import { VersionBanner } from "@/components/version-banner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "xCRM",
  description: "CRM SaaS multiempresa para equipes comerciais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-theme="system"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <VersionBanner />
        <DateTimeLocalDefaults />
        <Suspense fallback={null}>
          <GlobalPendingCursor />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
