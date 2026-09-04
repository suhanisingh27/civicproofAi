import type { Metadata, Viewport } from "next";
import "./globals.css";

const deploymentUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(deploymentUrl),
  title: "CivicProof AI",
  description: "Evidence-first civic reporting and resolution tracking.",
  icons: { icon: "/civicproof-logo.jpeg" },
  openGraph: {
    title: "CivicProof AI",
    description: "Evidence-first civic reporting and resolution tracking.",
    images: [{ url: "/city-banner.jpeg", width: 1200, height: 630, alt: "CivicProof AI city reporting" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#005a7a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
