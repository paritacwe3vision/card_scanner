"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Save,
  ArrowLeft,
  QrCode,
  MapPin,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";

import { ExtractedCard } from "@/types/card";
import { saveCard } from "@/services/api";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function CardReviewForm() {
  const router = useRouter();

  const [formData, setFormData] = useState<ExtractedCard>({
    owner_name: "",
    designation: "",
    company_name: "",
    address: "",
    email: "",
    phone: "",
    gst_number: "",

    company_logo: null,

    website_url: "",
    instagram_url: "",
    facebook_url: "",
    linkedin_url: "",

    front_image_url: null,
    back_image_url: null,

    source_type: "scan",
    original_file_url: null,

    qr_raw: null,
    other_details: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // --------------------------------------------------
  // LOAD EXTRACTED CARD FROM SESSION STORAGE
  // --------------------------------------------------

  useEffect(() => {
    const stored = sessionStorage.getItem("extractedCard");

    if (!stored) {
      router.push("/");
      return;
    }

    try {
      const card = JSON.parse(stored);

      console.log("Extracted card:", card);

      setFormData({
        owner_name: card.owner_name ?? "",
        designation: card.designation ?? "",
        company_name: card.company_name ?? "",
        address: card.address ?? "",
        email: card.email ?? "",
        phone: card.phone ?? "",
        gst_number: card.gst_number ?? "",

        company_logo: card.company_logo ?? null,

        website_url: card.website_url ?? "",
        instagram_url: card.instagram_url ?? "",
        facebook_url: card.facebook_url ?? "",
        linkedin_url: card.linkedin_url ?? "",

        front_image_url: card.front_image_url ?? null,
        back_image_url: card.back_image_url ?? null,

        source_type: card.source_type ?? "scan",
        original_file_url: card.original_file_url ?? null,

        qr_raw: card.qr_raw ?? null,
        other_details: card.other_details ?? "",
      });

      setIsReady(true);
    } catch (err) {
      console.error(err);
      setError("Invalid extracted card data");
      setIsReady(true);
    }
  }, [router]);

  // --------------------------------------------------
  // HANDLE FORM CHANGE
  // --------------------------------------------------

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --------------------------------------------------
  // SAVE CARD
  // --------------------------------------------------

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
      console.error(err);

      setError(
        err?.message || "Something went wrong while saving the card"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------
  // GOOGLE MAPS
  // --------------------------------------------------

  const openMap = () => {
    if (!formData.address) {
      return;
    }

    const encodedAddress = encodeURIComponent(formData.address);

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      "_blank"
    );
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (!isReady) {
    return (
      <div className="py-20">
        <LoadingSpinner
          size="lg"
          text="Loading extracted card data..."
        />
      </div>
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">

        {/* ============================================
            TITLE
        ============================================ */}

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            Review Business Card Details
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Review the scanned card and automatically extracted information
            before saving.
          </p>
        </div>

        {/* ============================================
            SCANNED CARD IMAGES
        ============================================ */}

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="h-5 w-5 text-primary-600" />

            <h3 className="text-lg font-semibold text-gray-900">
              Scanned Business Card
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* FRONT SIDE */}

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-800">
                    Front Side
                  </p>

                  <p className="text-xs text-gray-500">
                    Scanned card front
                  </p>
                </div>

                {formData.front_image_url && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Scanned
                  </span>
                )}
              </div>

              {formData.front_image_url ? (
                <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
                  <img
                    src={formData.front_image_url}
                    alt="Business card front side"
                    className="w-full h-64 object-contain"
                  />
                </div>
              ) : (
                <div className="h-64 rounded-lg border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />

                  <p className="text-sm text-gray-500">
                    Front side not available
                  </p>
                </div>
              )}
            </div>

            {/* BACK SIDE */}

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-800">
                    Back Side
                  </p>

                  <p className="text-xs text-gray-500">
                    Scanned card back
                  </p>
                </div>

                {formData.back_image_url && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Scanned
                  </span>
                )}
              </div>

              {formData.back_image_url ? (
                <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
                  <img
                    src={formData.back_image_url}
                    alt="Business card back side"
                    className="w-full h-64 object-contain"
                  />
                </div>
              ) : (
                <div className="h-64 rounded-lg border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />

                  <p className="text-sm text-gray-500">
                    Back side not available
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ============================================
            LOGO + QR
        ============================================ */}

        <div className="flex flex-wrap gap-6 mb-8">

          {/* COMPANY LOGO */}

          <div className="flex items-center gap-4">
            {formData.company_logo ? (
              <img
                src={formData.company_logo}
                alt="Company Logo"
                className="h-20 w-20 rounded-xl object-contain border border-gray-200 bg-white"
              />
            ) : (
              <div className="h-20 w-20 rounded-xl bg-gray-100 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-700">
                Company Logo
              </p>

              <p className="text-xs text-gray-500">
                {formData.company_logo
                  ? "Detected"
                  : "Not found"}
              </p>
            </div>
          </div>

          {/* QR CODE */}

          <div className="flex items-center gap-4">
            <div
              className={`h-20 w-20 rounded-xl flex items-center justify-center ${
                formData.qr_raw
                  ? "bg-green-50 border border-green-200"
                  : "bg-gray-100"
              }`}
            >
              <QrCode
                className={`h-8 w-8 ${
                  formData.qr_raw
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">
                QR Code
              </p>

              <p className="text-xs text-gray-500">
                {formData.qr_raw
                  ? "Detected"
                  : "Not found"}
              </p>
            </div>
          </div>
        </div>

        {/* ============================================
            EXTRACTED DETAILS
        ============================================ */}

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Extracted Information
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Information detected from the scanned business card.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* OWNER */}

          <Input
            id="owner_name"
            name="owner_name"
            label="Owner / Person Name"
            value={formData.owner_name || ""}
            onChange={handleChange}
            placeholder="Rahul Patel"
          />

          {/* COMPANY */}

          <Input
            id="company_name"
            name="company_name"
            label="Company Name"
            value={formData.company_name || ""}
            onChange={handleChange}
            placeholder="ABC Technologies"
          />

          {/* DESIGNATION */}

          <Input
            id="designation"
            name="designation"
            label="Designation"
            value={formData.designation || ""}
            onChange={handleChange}
            placeholder="Founder & CEO"
          />

          {/* PHONE */}

          <Input
            id="phone"
            name="phone"
            label="Phone Number"
            value={formData.phone || ""}
            onChange={handleChange}
            placeholder="+91 9876543210"
          />

          {/* EMAIL */}

          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            value={formData.email || ""}
            onChange={handleChange}
            placeholder="contact@company.com"
          />

          {/* WEBSITE */}

          <Input
            id="website_url"
            name="website_url"
            label="Website"
            value={formData.website_url || ""}
            onChange={handleChange}
            placeholder="https://company.com"
          />

          {/* INSTAGRAM */}

          <Input
            id="instagram_url"
            name="instagram_url"
            label="Instagram"
            value={formData.instagram_url || ""}
            onChange={handleChange}
            placeholder="@username or full link"
          />

          {/* FACEBOOK */}

          <Input
            id="facebook_url"
            name="facebook_url"
            label="Facebook"
            value={formData.facebook_url || ""}
            onChange={handleChange}
            placeholder="Facebook profile / page link"
          />

          {/* LINKEDIN */}

          <Input
            id="linkedin_url"
            name="linkedin_url"
            label="LinkedIn"
            value={formData.linkedin_url || ""}
            onChange={handleChange}
            placeholder="LinkedIn profile link"
          />

          {/* GST */}

          <Input
            id="gst_number"
            name="gst_number"
            label="GST Number"
            value={formData.gst_number || ""}
            onChange={handleChange}
            placeholder="24ABCDE1234F1Z5"
          />

        </div>

        {/* ============================================
            ADDRESS / LOCATION
        ============================================ */}

        <div className="mt-6">

          <div className="flex items-center justify-between mb-2">

            <label
              htmlFor="address"
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <MapPin className="h-4 w-4 text-primary-600" />

              Address / Location
            </label>

            {formData.address && (
              <button
                type="button"
                onClick={openMap}
                className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
              >
                <ExternalLink className="h-4 w-4" />

                View on Map
              </button>
            )}

          </div>

          <textarea
            id="address"
            name="address"
            rows={3}
            value={formData.address || ""}
            onChange={handleChange}
            placeholder="Company address / City / State / Country"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />

          {formData.address && (
            <div className="mt-2 flex items-start gap-2 text-sm text-gray-500">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />

              <span>
                {formData.address}
              </span>
            </div>
          )}

        </div>

        {/* ============================================
            OTHER DETAILS
        ============================================ */}

        <div className="mt-6">

          <label
            htmlFor="other_details"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Other Details
          </label>

          <textarea
            id="other_details"
            name="other_details"
            rows={3}
            value={formData.other_details || ""}
            onChange={handleChange}
            placeholder="Any other information found on the card..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />

        </div>

        {/* ============================================
    QR DATA (ALL)
============================================ */}

{(formData.qr_codes && formData.qr_codes.length > 0) || formData.qr_raw ? (
  <div className="mt-6 space-y-3">
    <div className="flex items-center gap-2">
      <QrCode className="h-5 w-5 text-green-600" />
      <p className="font-medium text-green-800">
        QR Code{((formData.qr_codes?.length || 0) > 1) ? "s" : ""} Detected
      </p>
    </div>

    {(formData.qr_codes && formData.qr_codes.length > 0
      ? formData.qr_codes
      : [formData.qr_raw]
    ).map((qr, index) => (
      <div
        key={index}
        className="rounded-lg border border-green-200 bg-green-50 p-4"
      >
        <p className="text-xs text-green-600 mb-1">
          QR {index + 1}
        </p>
        <p className="text-sm text-green-700 break-all">
          {qr}
        </p>
      </div>
    ))}
  </div>
) : null}
        {/* ============================================
            ERROR
        ============================================ */}

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* ============================================
            ACTIONS
        ============================================ */}

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