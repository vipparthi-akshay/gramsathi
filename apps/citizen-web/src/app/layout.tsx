import { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import ThemeRegistry from "@/theme/ThemeRegistry";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "GramSathi AI - AI-Powered Government Services",
  description:
    "Access government schemes, apply for benefits, and track applications with GramSathi AI",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GramSathi AI",
  },
  applicationName: "GramSathi AI",
  keywords: [
    "government schemes",
    "rural India",
    "agriculture",
    "social welfare",
    "AI assistant",
  ],
  authors: [{ name: "GramSathi AI" }],
  openGraph: {
    title: "GramSathi AI",
    description: "AI-Powered Government Services for Rural Citizens",
    type: "website",
    locale: "hi_IN",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0284C7",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hi" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="icon" href="/icons/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-icon.png" />
        <meta name="application-name" content="GramSathi AI" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ThemeRegistry>
          <Providers>
            <div id="main-content">{children}</div>
          </Providers>
        </ThemeRegistry>
        <div
          id="a11y-announcer"
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        />
      </body>
    </html>
  );
}
