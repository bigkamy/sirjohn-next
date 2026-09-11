import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getCategories } from "@/lib/products";
import { getFreeShippingThreshold } from "@/lib/shipping";
import { siteConfig } from "@/lib/site-config";
import { siteUrl } from "@/lib/site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteConfig.name} — Premium Golf Equipment`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: siteConfig.brand.primaryColor,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [freeShippingOver, categories] = await Promise.all([getFreeShippingThreshold(), getCategories()]);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#f5f7f4] text-slate-900">
        <div className="flex min-h-screen flex-col">
          <SiteHeader categories={categories} />
          <div className="flex-1">{children}</div>
          <SiteFooter freeShippingOver={freeShippingOver} categories={categories} />
        </div>
      </body>
    </html>
  );
}
