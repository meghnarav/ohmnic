export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0D13] text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
