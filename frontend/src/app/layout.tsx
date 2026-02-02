import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/layout/ConditionalLayout";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "LETW - Light Encounter Tabernacle Worldwide",
  description: "Dedicated to spreading the Word of GOD, empowering individuals, and engaging in charitable activities",
};

import { Toaster } from 'sonner';

export default function RootLayout({
  children,
  modal
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body className={`${poppins.variable} font-sans antialiased animate-page-load`} suppressHydrationWarning>
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
        {modal}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}