import type { Metadata } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fontSora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const fontInter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fontJetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ωhmnic Dashboard",
  description: "Adaptive EV Battery Health & Telemetry Anomaly Detection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSora.variable} ${fontInter.variable} ${fontJetBrainsMono.variable} dark antialiased`}>
      <body className="min-h-screen bg-canvas text-text-primary font-body-md">
        {children}
      </body>
    </html>
  );
}
