import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gol Homes — Subcontractor Portal",
  description:
    "Submit invoices, supporting documents, and proposals to Gol Homes Development LLC. Secure subcontractor portal — no account required.",
  icons: {
    icon: "/gol-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gol-soft text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
