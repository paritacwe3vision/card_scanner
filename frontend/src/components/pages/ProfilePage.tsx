"use client";

import { useEffect, useState } from "react";
import { User, Mail } from "lucide-react";

interface CurrentUser {
  id: string;
  email: string;
  full_name: string | null;
}

export default function ProfilePage() {
  const [user, setUser] =
    useState<CurrentUser | null>(null);

  useEffect(() => {
    const storedUser =
      localStorage.getItem("card_scanner_user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  if (!user) {
    return null;
  }

  const firstLetter =
    user.full_name?.charAt(0).toUpperCase() ??
    user.email.charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto py-8">

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">

        {/* Profile Heading */}
        <div className="flex items-center gap-5 mb-8">

          <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold">
            {firstLetter}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user.full_name || "User"}
            </h1>

            <p className="text-gray-500 mt-1">
              Your Card Scanner profile
            </p>
          </div>

        </div>


        {/* User information */}
        <div className="space-y-4">

          <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">

            <User className="w-5 h-5 text-gray-500" />

            <div>
              <p className="text-xs text-gray-500">
                Full Name
              </p>

              <p className="font-medium text-gray-900">
                {user.full_name || "Not provided"}
              </p>
            </div>

          </div>


          <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">

            <Mail className="w-5 h-5 text-gray-500" />

            <div>
              <p className="text-xs text-gray-500">
                Email
              </p>

              <p className="font-medium text-gray-900">
                {user.email}
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}