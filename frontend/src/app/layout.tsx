import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        {/* Simple Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-primary-600 text-white p-2 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </div>
              <span className="font-semibold text-gray-900 text-lg">
                Card Scanner
              </span>
            </Link>

            <nav className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
              >
                Upload
              </Link>
              <Link
                href="/cards"
                className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
              >
                My Cards
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
              >
                Login
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}