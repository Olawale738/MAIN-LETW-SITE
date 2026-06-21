import type { Metadata, Viewport } from "next";
import { Poppins, Playfair_Display } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import BrandingApplier from "@/components/BrandingApplier";
import CookieConsent from "@/components/CookieConsent";
import PWARegister from "@/components/PWARegister";
import FloatingLiveBanner from "@/components/FloatingLiveBanner";
import { I18nProvider } from "@/lib/i18n";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "LETW - Light Encounter Tabernacle Worldwide",
  description: "Dedicated to spreading the Word of GOD, empowering individuals, and engaging in charitable activities",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "LETW" },
};

export const viewport: Viewport = {
  themeColor: "#140152",
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
      <body className={`${poppins.variable} ${playfair.variable} font-sans antialiased animate-page-load`} suppressHydrationWarning>
        <BrandingApplier />
        <I18nProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </I18nProvider>
        {modal}
        <CookieConsent />
        <PWARegister />
        <FloatingLiveBanner />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}