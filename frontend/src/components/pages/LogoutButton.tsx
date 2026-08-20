"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { logoutUser } from "@/services/api";


export default function LogoutButton() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);


  const handleLogout = async () => {
    setIsLoading(true);

    try {
      const storedUser = localStorage.getItem(
        "card_scanner_user"
      );

      // No user stored
      if (!storedUser) {
        router.replace("/login");
        return;
      }

      const user = JSON.parse(storedUser);

      // Tell FastAPI to move user
      // login table → logout table
      await logoutUser(user.id);

      // Clear frontend login state
      localStorage.removeItem(
        "card_scanner_user"
      );

      // Redirect to login
      router.replace("/login");

      router.refresh();

    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );

    } finally {
      setIsLoading(false);
    }
  };

return (
  <button
    type="button"
    onClick={handleLogout}
    disabled={isLoading}
    className="
      flex items-center gap-2
      px-3 py-2
      rounded-lg
      text-sm font-medium
      text-gray-600
      hover:text-red-600
      hover:bg-red-50
      transition-all duration-200
      disabled:opacity-50
      disabled:cursor-not-allowed
    "
  >
    <LogOut className="w-4 h-4" />

    {isLoading ? "Logging out..." : "Logout"}
  </button>
);
}