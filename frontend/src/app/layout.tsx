import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ωhmnic | Enterprise EV Fleet Telemetry & Battery SCADA',
  description: 'Real-time EV battery health monitoring and Explainable AI (XAI) diagnostics platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
