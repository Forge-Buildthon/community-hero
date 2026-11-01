import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/providers/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Community Hero",
    template: "%s | Community Hero",
  },
  description:
    "AI-powered civic issue reporting and resolution platform for communities.",
  applicationName: "Community Hero",
  keywords: [
    "civic tech",
    "issue reporting",
    "AI verification",
    "community",
    "smart city",
  ],
  authors: [{ name: "Community Hero Team" }],
  openGraph: {
    title: "Community Hero",
    description: "Report and resolve civic issues with AI-powered verification.",
    url: "https://community-hero-lake.vercel.app",
    siteName: "Community Hero",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Community Hero",
    description: "AI-powered civic issue resolution.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}