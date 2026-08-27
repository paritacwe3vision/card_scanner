"use client";

import { useEffect, useState } from "react";
import { User, Mail, Clock3 } from "lucide-react";

import {
  getRetention,
  updateRetention,
} from "@/services/api";


interface CurrentUser {
  id: string;
  email: string;
  full_name: string | null;
}

type RetentionDays =
  | 1
  | 7
  | 30
  | null;


export default function ProfilePage() {
  const [user, setUser] =
    useState<CurrentUser | null>(null);

  const [retentionDays, setRetentionDays] =
    useState<RetentionDays>(null);

  const [isLoadingRetention, setIsLoadingRetention] =
    useState(true);

  const [isSavingRetention, setIsSavingRetention] =
    useState(false);

  const [retentionMessage, setRetentionMessage] =
    useState<string | null>(null);

  const [retentionError, setRetentionError] =
    useState<string | null>(null);


  // =====================================================
  // LOAD USER + RETENTION SETTING
  // =====================================================

  useEffect(() => {
    const loadProfile = async () => {
      const storedUser =
        localStorage.getItem("card_scanner_user");

      if (!storedUser) {
        setIsLoadingRetention(false);
        return;
      }

      try {
        const parsedUser: CurrentUser =
          JSON.parse(storedUser);

        setUser(parsedUser);

        const response =
          await getRetention();

        const value =
          response.retention_days;

        if (
          value === 1 ||
          value === 7 ||
          value === 30
        ) {
          setRetentionDays(value);
        } else {
          setRetentionDays(null);
        }

      } catch (error) {
        console.error(
          "Failed to load retention setting:",
          error
        );

        setRetentionError(
          error instanceof Error
            ? error.message
            : "Unable to load retention setting"
        );

      } finally {
        setIsLoadingRetention(false);
      }
    };

    loadProfile();
  }, []);


  // =====================================================
  // UPDATE RETENTION SETTING
  // =====================================================

  const handleRetentionChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedValue =
      event.target.value;

    const newRetention: RetentionDays =
      selectedValue === "never"
        ? null
        : (
            Number(
              selectedValue
            ) as 1 | 7 | 30
          );

    setIsSavingRetention(true);
    setRetentionMessage(null);
    setRetentionError(null);

    try {
      const response =
        await updateRetention(
          newRetention
        );

      setRetentionDays(
        response.retention_days === 1 ||
        response.retention_days === 7 ||
        response.retention_days === 30
          ? response.retention_days
          : null
      );

      setRetentionMessage(
        newRetention === null
          ? "Cards will not be deleted automatically."
          : `Cards will be deleted after ${newRetention} ${
              newRetention === 1
                ? "day"
                : "days"
            }.`
      );

    } catch (error) {
      console.error(
        "Failed to update retention setting:",
        error
      );

      setRetentionError(
        error instanceof Error
          ? error.message
          : "Unable to update retention setting"
      );

    } finally {
      setIsSavingRetention(false);
    }
  };


  if (!user) {
    return null;
  }


  const firstLetter =
    user.full_name
      ?.charAt(0)
      .toUpperCase() ??
    user.email
      .charAt(0)
      .toUpperCase();


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


        {/* User Information */}
        <div className="space-y-4">

          {/* Full Name */}
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


          {/* Email */}
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


          {/* Card Retention */}
          <div className="p-4 rounded-xl bg-gray-50">

            <div className="flex items-start gap-4">

              <Clock3 className="w-5 h-5 text-gray-500 mt-1" />

              <div className="flex-1">

                <p className="text-xs text-gray-500">
                  Card Auto-Delete
                </p>

                <p className="font-medium text-gray-900 mb-3">
                  Automatically delete my cards after
                </p>

                <select
                  value={
                    retentionDays === null
                      ? "never"
                      : String(retentionDays)
                  }
                  onChange={
                    handleRetentionChange
                  }
                  disabled={
                    isLoadingRetention ||
                    isSavingRetention
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
                >
                  <option value="1">
                    1 Day
                  </option>

                  <option value="7">
                    7 Days
                  </option>

                  <option value="30">
                    30 Days
                  </option>

                  <option value="never">
                    Never
                  </option>
                </select>


                {isLoadingRetention && (
                  <p className="text-sm text-gray-500 mt-2">
                    Loading setting...
                  </p>
                )}


                {isSavingRetention && (
                  <p className="text-sm text-gray-500 mt-2">
                    Saving...
                  </p>
                )}


                {retentionMessage &&
                  !isSavingRetention && (
                    <p className="text-sm text-green-600 mt-2">
                      {retentionMessage}
                    </p>
                  )}


                {retentionError && (
                  <p className="text-sm text-red-600 mt-2">
                    {retentionError}
                  </p>
                )}

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}