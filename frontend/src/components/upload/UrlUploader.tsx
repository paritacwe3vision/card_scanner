"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Link, Upload } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { uploadUrl } from "@/services/api";

export default function UrlUploader() {
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidUrl = (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const handleUpload = async () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    if (!isValidUrl(url.trim())) {
      setError("Please enter a valid URL (e.g. https://example.com)");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await uploadUrl(url.trim());

      if (response.success && response.card) {
        sessionStorage.setItem("extractedCard", JSON.stringify(response.card));
        router.push("/review");
      } else {
        setError(response.message || "Failed to extract card details from URL");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong while processing the URL");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* URL Input Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
        <Link className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-1">Enter Card URL</p>
        <p className="text-sm text-gray-500 mb-6">
          Paste a link that contains the business card image or details
        </p>

        <div className="max-w-md mx-auto text-left">
          <Input
            id="card-url"
            type="url"
            placeholder="https://example.com/business-card"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Action Button */}
      <Button
        onClick={handleUpload}
        className="w-full"
        isLoading={isLoading}
        disabled={!url.trim()}
      >
        <Upload className="h-4 w-4 mr-2" />
        Process URL
      </Button>

      {isLoading && (
        <LoadingSpinner text="Fetching and extracting information..." />
      )}
    </div>
  );
}