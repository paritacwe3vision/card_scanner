import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

import Header from "@/components/header/header";


const inter = Inter({
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Business Card Scanner",
  description: "Scan, upload and manage business cards easily",
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">

      <body
        className={`${inter.className} bg-gray-50 min-h-screen`}
      >

        {/* Global Header */}
        <Header />


        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>

      </body>

    </html>
  );
}