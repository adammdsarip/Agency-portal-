import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/features/auth/AuthProvider";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const appName = process.env.NEXT_PUBLIC_AGENCY_NAME || "Studio Portal";

export const metadata: Metadata = {
  title: { default: appName, template: `%s · ${appName}` },
  description: "Your projects, deliverables and requests in one place.",
  applicationName: appName,
  appleWebApp: { capable: true, title: appName, statusBarStyle: "default" },
  // The portal is private: keep it out of search engines.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f6f5f2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-dvh">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
