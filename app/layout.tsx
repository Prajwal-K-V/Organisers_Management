import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { PendingShell } from "@/components/pending-shell";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans-app",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Organisers Management",
  description: "Tournament organizers, auctions, and finance",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <PendingShell>{children}</PendingShell>
      </body>
    </html>
  );
}
