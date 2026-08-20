"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Save, ArrowLeft } from "lucide-react";
import { ExtractedCard } from "@/types/card";
import { saveCard } from "@/services/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function CardReviewForm() {
  const router = useRouter();

  const [formData, setFormData] = useState<ExtractedCard>({
    company_name: "",
    location: "",
    email: "",
    phone: "",
    gst_number: "",
    company_logo: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("extractedCard");

    if (!stored) {
      router.replace("/");
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setFormData({
        company_name: parsed.company_name || "",
        location: parsed.location || "",
        email: parsed.email || "",
        phone: parsed.phone || "",
        gst_number: parsed.gst_number || "",
        company_logo: parsed.company_logo || null,
        source_type: parsed.source_type,
        original_file_url: parsed.original_file_url,
      });
      setIsReady(true);
    } catch {
      router.replace("/");
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await saveCard(formData);

      if (response.success) {
        sessionStorage.removeItem("extractedCard");
        router.push("/cards");
      } else {
        setError(response.message || "Failed to save card");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong while saving");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isReady) {
    return (
      <div className="py-20">
        <LoadingSpinner size="lg" text="Loading extracted data..." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Review Business Card
        </h2>

        {/* Logo Preview */}
        <div className="mb-6 flex items-center gap-4">
          {formData.company_logo ? (
            <img
              src={formData.company_logo}
              alt="Company Logo"
              className="h-16 w-16 rounded-xl object-contain border border-gray-200 bg-white"
            />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-gray-100 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-700">Company Logo</p>
            <p className="text-xs text-gray-500">
              {formData.company_logo ? "Detected" : "Not found"}
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <Input
            id="company_name"
            name="company_name"
            label="Company Name"
            value={formData.company_name || ""}
            onChange={handleChange}
            placeholder="Enter company name"
          />

          <Input
            id="location"
            name="location"
            label="Location"
            value={formData.location || ""}
            onChange={handleChange}
            placeholder="City, State"
          />

          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            value={formData.email || ""}
            onChange={handleChange}
            placeholder="contact@company.com"
          />

          <Input
            id="phone"
            name="phone"
            label="Phone Number"
            value={formData.phone || ""}
            onChange={handleChange}
            placeholder="+91 9876543210"
          />

          <Input
            id="gst_number"
            name="gst_number"
            label="GST Number (optional)"
            value={formData.gst_number || ""}
            onChange={handleChange}
            placeholder="24ABCDE1234F1Z5"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-50 text-red-700 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="flex-1"
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            className="flex-1"
            isLoading={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            Confirm & Save
          </Button>
        </div>
      </div>
    </div>
  );
}