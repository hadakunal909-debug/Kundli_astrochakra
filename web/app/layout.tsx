import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Astrochakra — Kundli Generator",
  description:
    "Generate an accurate Vedic birth chart (Janam Kundli) with planetary positions, dashas, panchang and predictions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
