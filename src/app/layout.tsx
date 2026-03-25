import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: "SaltaireSpotShare",
  description: "Parking spot sharing for Saltaire residents — 301 1st Street S, St. Petersburg, FL",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "SpotShare" },
};

export const viewport: Viewport = {
  themeColor: "#1e4d8c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
