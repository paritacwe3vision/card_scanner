"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import LogoutButton from "@/components/pages/LogoutButton";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage =
    pathname === "/login" || pathname === "/signup";

  const navLinkClass = (path: string) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      pathname === path
        ? "bg-primary-50 text-primary-600"
        : "text-gray-600 hover:text-primary-600 hover:bg-gray-50"
    }`;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="h-[72px] flex items-center justify-between">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group"
          >
            <div
              className="
                w-11 h-11
                bg-primary-600
                text-white
                rounded-xl
                flex items-center justify-center
                shadow-sm
                transition-transform duration-200
                group-hover:scale-105
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect
                  width="20"
                  height="14"
                  x="2"
                  y="5"
                  rx="2"
                />
                <line
                  x1="2"
                  x2="22"
                  y1="10"
                  y2="10"
                />
              </svg>
            </div>

            <span className="font-bold text-gray-900 text-xl tracking-tight">
              Card Scanner
            </span>
          </Link>

          {/* Authentication Pages */}
          {isAuthPage ? (
            <button
              type="button"
              onClick={() => router.back()}
              className="
                flex items-center gap-2
                px-4 py-2
                rounded-lg
                text-sm font-medium
                text-gray-600
                hover:text-primary-600
                hover:bg-gray-50
                transition-all duration-200
              "
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            /* Normal App Navigation */
            <nav className="flex items-center gap-2">

              <Link
                href="/"
                className={navLinkClass("/")}
              >
                Upload
              </Link>

              <Link
                href="/cards"
                className={navLinkClass("/cards")}
              >
                My Cards
              </Link>

              <Link
                href="/login"
                className="
                  px-3 py-2
                  rounded-lg
                  text-sm font-medium
                  text-gray-600
                  hover:text-primary-600
                  hover:bg-gray-50
                  transition-all duration-200
                "
              >
                Login
              </Link>

              <div className="h-6 w-px bg-gray-200 mx-2" />

              <LogoutButton />

            </nav>
          )}

        </div>
      </div>
    </header>
  );
}