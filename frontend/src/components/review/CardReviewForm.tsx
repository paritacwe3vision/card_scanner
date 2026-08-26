"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Save,
  ArrowLeft,
  ArrowRight,
  QrCode,
  MapPin,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";

import { ExtractedCard } from "@/types/card";
import { saveCard, getCards } from "@/services/api";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function CardReviewForm() {
  const router = useRouter();

  // ============================================================
  // MULTIPLE CARD STATE
  // ============================================================

  const [cards, setCards] = useState<ExtractedCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // ============================================================
  // DUPLICATE CONFIRMATION
  // ============================================================

  const [showDuplicateConfirm, setShowDuplicateConfirm] =
    useState(false);

  const [pendingSaveData, setPendingSaveData] =
    useState<any>(null);

  const [pendingNextIndex, setPendingNextIndex] =
    useState<number | null>(null);

  // ============================================================
  // CURRENT FORM DATA
  // ============================================================

  const createEmptyCard = (): ExtractedCard => ({
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
    qr_codes: [],

    other_details: "",
  });

  const [formData, setFormData] =
    useState<ExtractedCard>(createEmptyCard());

  // ============================================================
  // UI STATE
  // ============================================================

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // ============================================================
  // NORMALIZE CARD
  // ============================================================

  const normalizeCard = (
    card: any
  ): ExtractedCard => {
    let qrCodes: string[] = [];

    // ----------------------------------------------------------
    // NEW FORMAT
    // qr_codes: ["QR1", "QR2"]
    // ----------------------------------------------------------

    if (Array.isArray(card?.qr_codes)) {
      qrCodes = card.qr_codes
        .filter(
          (qr: unknown): qr is string =>
            typeof qr === "string" &&
            qr.trim().length > 0
        )
        .map((qr: string) => qr.trim());
    }

    // ----------------------------------------------------------
    // OLD FORMAT
    // qr_raw: "QR1 ||| QR2"
    // ----------------------------------------------------------

    if (
      qrCodes.length === 0 &&
      typeof card?.qr_raw === "string" &&
      card.qr_raw.trim()
    ) {
      qrCodes = card.qr_raw
        .split(" ||| ")
        .map((qr: string) => qr.trim())
        .filter(Boolean);
    }

    // ----------------------------------------------------------
    // REMOVE DUPLICATES
    // ----------------------------------------------------------

    qrCodes = Array.from(
      new Set(qrCodes)
    );

    return {
      owner_name:
        card?.owner_name ?? "",

      designation:
        card?.designation ?? "",

      company_name:
        card?.company_name ?? "",

      address:
        card?.address ?? "",

      email:
        card?.email ?? "",

      phone:
        card?.phone ?? "",

      gst_number:
        card?.gst_number ?? "",

      company_logo:
        card?.company_logo ?? null,

      website_url:
        card?.website_url ?? "",

      instagram_url:
        card?.instagram_url ?? "",

      facebook_url:
        card?.facebook_url ?? "",

      linkedin_url:
        card?.linkedin_url ?? "",

      front_image_url:
        card?.front_image_url ?? null,

      back_image_url:
        card?.back_image_url ?? null,

      source_type:
        card?.source_type ?? "scan",

      original_file_url:
        card?.original_file_url ?? null,

      qr_raw:
        qrCodes.length > 0
          ? qrCodes.join(" ||| ")
          : null,

      qr_codes:
        qrCodes,

      other_details:
        card?.other_details ?? "",
    };
  };

  // ============================================================
  // LOAD EXTRACTED CARDS
  // ============================================================

  useEffect(() => {
    const loadExtractedCards = () => {
      try {
        // ======================================================
        // CHECK MULTIPLE CARDS FIRST
        // ======================================================

        const storedCards =
          sessionStorage.getItem(
            "extractedCards"
          );

        if (storedCards) {
          const parsedCards =
            JSON.parse(storedCards);

          if (
            Array.isArray(parsedCards) &&
            parsedCards.length > 0
          ) {
            const normalizedCards =
              parsedCards.map(
                normalizeCard
              );

            console.log(
              "========================================"
            );

            console.log(
              "MULTIPLE EXTRACTED CARDS:",
              normalizedCards
            );

            console.log(
              "TOTAL CARDS:",
              normalizedCards.length
            );

            console.log(
              "========================================"
            );

            setCards(
              normalizedCards
            );

            setCurrentIndex(0);

            setFormData(
              normalizedCards[0]
            );

            setIsReady(true);

            return;
          }
        }

        // ======================================================
        // FALLBACK TO SINGLE CARD
        // ======================================================

        const storedCard =
          sessionStorage.getItem(
            "extractedCard"
          );

        if (!storedCard) {
          router.push("/");
          return;
        }

        const parsedCard =
          JSON.parse(storedCard);

        const normalizedCard =
          normalizeCard(parsedCard);

        console.log(
          "SINGLE EXTRACTED CARD:",
          normalizedCard
        );

        setCards([
          normalizedCard,
        ]);

        setCurrentIndex(0);

        setFormData(
          normalizedCard
        );

        setIsReady(true);
      } catch (err) {
        console.error(
          "LOAD EXTRACTED CARDS ERROR:",
          err
        );

        setError(
          "Invalid extracted card data"
        );

        setIsReady(true);
      }
    };

    loadExtractedCards();
  }, [router]);

  // ============================================================
  // HANDLE FORM CHANGE
  // ============================================================

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const {
      name,
      value,
    } = e.target;

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  // ============================================================
  // PREPARE SAVE DATA
  // ============================================================

  const prepareSaveData = (
    card: ExtractedCard
  ) => {
    // ----------------------------------------------------------
    // CLEAN QR CODES
    // ----------------------------------------------------------

    const qrCodes: string[] =
      Array.isArray(card.qr_codes)
        ? card.qr_codes
            .filter(
              (
                qr
              ): qr is string =>
                typeof qr ===
                  "string" &&
                qr.trim().length >
                  0
            )
            .map(
              (qr) =>
                qr.trim()
            )
        : [];

    // ----------------------------------------------------------
    // REMOVE DUPLICATES
    // ----------------------------------------------------------

    const uniqueQrCodes =
      Array.from(
        new Set(qrCodes)
      );

    // ----------------------------------------------------------
    // CREATE qr_raw
    // ----------------------------------------------------------

    const joinedQrRaw =
      uniqueQrCodes.length > 0
        ? uniqueQrCodes.join(
            " ||| "
          )
        : null;

    // ----------------------------------------------------------
    // RETURN COMPLETE CARD
    // ----------------------------------------------------------

    return {
      owner_name:
        card.owner_name?.trim() ||
        "Unknown",

      designation:
        card.designation?.trim() ||
        null,

      company_name:
        card.company_name?.trim() ||
        null,

      address:
        card.address?.trim() ||
        null,

      email:
        card.email?.trim() ||
        null,

      phone:
        card.phone?.trim() ||
        null,

      gst_number:
        card.gst_number?.trim() ||
        null,

      company_logo:
        card.company_logo ||
        null,

      website_url:
        card.website_url?.trim() ||
        null,

      instagram_url:
        card.instagram_url?.trim() ||
        null,

      facebook_url:
        card.facebook_url?.trim() ||
        null,

      linkedin_url:
        card.linkedin_url?.trim() ||
        null,

      front_image_url:
        card.front_image_url ||
        null,

      back_image_url:
        card.back_image_url ||
        null,

      source_type:
        card.source_type ||
        "scan",

      original_file_url:
        card.original_file_url ||
        null,

      other_details:
        card.other_details?.trim() ||
        null,

      // --------------------------------------------------------
      // IMPORTANT
      // SAVE ALL QR CODES
      // --------------------------------------------------------

      qr_raw:
        joinedQrRaw,

      qr_codes:
        uniqueQrCodes,
    };
  };

  // ============================================================
  // SAVE CARD TO BACKEND
  // ============================================================

  const saveCardToBackend = async (
    dataToSave: any
  ) => {
    console.log(
      "========================================"
    );

    console.log(
      "CARD DATA BEING SAVED:"
    );

    console.log(
      dataToSave
    );

    console.log(
      "QR CODES:",
      dataToSave.qr_codes
    );

    console.log(
      "QR COUNT:",
      dataToSave.qr_codes?.length ?? 0
    );

    console.log(
      "========================================"
    );

    const response =
      await saveCard(
        dataToSave as any
      );

    if (!response.success) {
      throw new Error(
        response.message ||
          "Failed to save card"
      );
    }

    return response;
  };

  // ============================================================
  // CHECK DUPLICATE COMPANY
  // ============================================================

  const checkDuplicateCompany = async (
    dataToSave: any
  ) => {
    const companyName =
      dataToSave.company_name
        ?.trim() ||
      null;

    // ----------------------------------------------------------
    // No company name
    // ----------------------------------------------------------

    if (!companyName) {
      return false;
    }

    // ----------------------------------------------------------
    // Get existing cards
    // ----------------------------------------------------------

    const existing =
      await getCards();

    if (
      !existing.success ||
      !existing.data
    ) {
      return false;
    }

    // ----------------------------------------------------------
    // Compare company names
    // ----------------------------------------------------------

    const isDuplicate =
      existing.data.some(
        (card: any) =>
          card.company_name &&
          card.company_name
            .toLowerCase()
            .trim() ===
            companyName.toLowerCase()
    );

    return isDuplicate;
  };

  // ============================================================
  // MOVE TO NEXT CARD
  // ============================================================

  const moveToNextCard = (
    nextIndex: number
  ) => {
    if (
      nextIndex >=
      cards.length
    ) {
      return;
    }

    setCurrentIndex(
      nextIndex
    );

    setFormData(
      cards[nextIndex]
    );

    setError(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ============================================================
  // SAVE CURRENT CARD
  // ============================================================

  const handleSave = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // ======================================================
      // IMPORTANT:
      // Store CURRENT EDITED FORM in cards array
      // ======================================================

      const updatedCards =
        [...cards];

      updatedCards[currentIndex] =
        {
          ...formData,
        };

      setCards(
        updatedCards
      );

      // ======================================================
      // PREPARE DATA
      // ======================================================

      const dataToSave =
        prepareSaveData(
          formData
        );

      // ======================================================
      // DUPLICATE CHECK
      // ======================================================

      const isDuplicate =
        await checkDuplicateCompany(
          dataToSave
        );

      if (isDuplicate) {
        console.log(
          "Duplicate company detected:",
          dataToSave.company_name
        );

        setPendingSaveData(
          dataToSave
        );

        setPendingNextIndex(
          currentIndex <
            cards.length - 1
            ? currentIndex + 1
            : null
        );

        setShowDuplicateConfirm(
          true
        );

        setIsLoading(false);

        return;
      }

      // ======================================================
      // SAVE DIRECTLY
      // ======================================================

      await performSave(
        dataToSave
      );
    } catch (err: any) {
      console.error(
        "SAVE CARD ERROR:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong while saving the card"
      );

      setIsLoading(false);
    }
  };

  // ============================================================
  // PERFORM ACTUAL SAVE
  // ============================================================

  const performSave = async (
    dataToSave: any
  ) => {
    if (!dataToSave) {
      setError(
        "No card data available to save."
      );

      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // ======================================================
      // SAVE TO BACKEND
      // ======================================================

      await saveCardToBackend(
        dataToSave
      );

      console.log(
        "CARD SAVED SUCCESSFULLY"
      );

      // ======================================================
      // CHECK FOR MORE CARDS
      // ======================================================

      const nextIndex =
        pendingNextIndex !== null
          ? pendingNextIndex
          : currentIndex <
              cards.length - 1
            ? currentIndex + 1
            : null;

      // ======================================================
      // MORE CARDS
      // ======================================================

      if (
        nextIndex !== null &&
        nextIndex < cards.length
      ) {
        setShowDuplicateConfirm(
          false
        );

        setPendingSaveData(
          null
        );

        setPendingNextIndex(
          null
        );

        moveToNextCard(
          nextIndex
        );

        return;
      }

      // ======================================================
      // ALL CARDS SAVED
      // ======================================================

      sessionStorage.removeItem(
        "extractedCard"
      );

      sessionStorage.removeItem(
        "extractedCards"
      );

      router.push(
        "/cards"
      );
    } catch (err: any) {
      console.error(
        "PERFORM SAVE ERROR:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong while saving the card"
      );
    } finally {
      setIsLoading(false);

      setShowDuplicateConfirm(
        false
      );

      setPendingSaveData(
        null
      );

      setPendingNextIndex(
        null
      );
    }
  };

  // ============================================================
  // PREVIOUS CARD
  // ============================================================

  const handlePrevious = () => {
    if (
      currentIndex <= 0 ||
      isLoading
    ) {
      return;
    }

    // ----------------------------------------------------------
    // IMPORTANT:
    // Save current edited form in local state before moving.
    // ----------------------------------------------------------

    const updatedCards =
      [...cards];

    updatedCards[currentIndex] =
      {
        ...formData,
      };

    setCards(
      updatedCards
    );

    const previousIndex =
      currentIndex - 1;

    setCurrentIndex(
      previousIndex
    );

    setFormData(
      updatedCards[
        previousIndex
      ]
    );

    setError(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ============================================================
  // GOOGLE MAPS
  // ============================================================

  const openMap = () => {
    if (
      !formData.address
    ) {
      return;
    }

    const encodedAddress =
      encodeURIComponent(
        formData.address
      );

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      "_blank"
    );
  };

  // ============================================================
  // QR DATA
  // ============================================================

  const qrCodes: string[] =
    Array.isArray(
      formData.qr_codes
    )
      ? formData.qr_codes.filter(
          (
            qr
          ): qr is string =>
            typeof qr ===
              "string" &&
            qr.trim().length >
              0
        )
      : typeof formData.qr_raw ===
          "string"
        ? formData.qr_raw
            .split(
              " ||| "
            )
            .map(
              (qr) =>
                qr.trim()
            )
            .filter(Boolean)
        : [];

  const qrCount =
    qrCodes.length;

  // ============================================================
  // LOADING
  // ============================================================

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

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">

        {/* =====================================================
            TITLE
        ===================================================== */}

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Review Extracted Details
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Review the scanned card information before saving.
              </p>
            </div>

            {/* =================================================
                CARD COUNTER
            ================================================= */}

            {cards.length > 1 && (
              <div className="flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-lg px-4 py-2">

                <span className="text-sm font-medium text-primary-700">
                  PDF / Card
                </span>

                <span className="text-sm font-bold text-primary-900">
                  {currentIndex + 1}
                </span>

                <span className="text-sm text-primary-600">
                  of
                </span>

                <span className="text-sm font-bold text-primary-900">
                  {cards.length}
                </span>

              </div>
            )}

          </div>
        </div>

        {/* =====================================================
            MULTIPLE CARD NAVIGATION
        ===================================================== */}

        {cards.length > 1 && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-4">

            <div className="flex items-center justify-between gap-3">

              <Button
                variant="outline"
                onClick={
                  handlePrevious
                }
                disabled={
                  currentIndex ===
                    0 ||
                  isLoading
                }
              >
                <ArrowLeft className="h-4 w-4 mr-2" />

                Previous
              </Button>

              <div className="text-center">

                <p className="text-sm font-semibold text-gray-800">
                  Card{" "}
                  {currentIndex +
                    1}
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  {currentIndex ===
                  cards.length - 1
                    ? "Last card"
                    : "Review this card and continue"}
                </p>

              </div>

              {/* ------------------------------------------------
                  NAVIGATION NEXT
                  ------------------------------------------------ */}

              <Button
                variant="outline"
                onClick={() => {
                  if (
                    currentIndex <
                    cards.length - 1
                  ) {
                    // Move without saving.
                    // The actual Save & Next button
                    // below performs the DB save.
                    const updatedCards =
                      [...cards];

                    updatedCards[
                      currentIndex
                    ] = {
                      ...formData,
                    };

                    setCards(
                      updatedCards
                    );

                    const nextIndex =
                      currentIndex +
                      1;

                    setCurrentIndex(
                      nextIndex
                    );

                    setFormData(
                      updatedCards[
                        nextIndex
                      ]
                    );

                    setError(
                      null
                    );

                    window.scrollTo(
                      {
                        top: 0,
                        behavior:
                          "smooth",
                      }
                    );
                  }
                }}
                disabled={
                  currentIndex >=
                    cards.length -
                      1 ||
                  isLoading
                }
              >
                Next

                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

            </div>

          </div>
        )}

        {/* =====================================================
            SCANNED CARD IMAGES
        ===================================================== */}

        <div className="mb-8">

          <div className="flex items-center gap-2 mb-4">

            <ImageIcon className="h-5 w-5 text-primary-600" />

            <h3 className="text-lg font-semibold text-gray-900">
              Scanned Business Card
            </h3>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* =================================================
                FRONT
            ================================================= */}

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
                    src={
                      formData.front_image_url
                    }
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

            {/* =================================================
                BACK
            ================================================= */}

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
                    src={
                      formData.back_image_url
                    }
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

        {/* =====================================================
            LOGO + QR SUMMARY
        ===================================================== */}

        <div className="flex flex-wrap gap-6 mb-8">

          {/* COMPANY LOGO */}

          <div className="flex items-center gap-4">

            {formData.company_logo ? (
              <img
                src={
                  formData.company_logo
                }
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

          {/* QR SUMMARY */}

          <div className="flex items-center gap-4">

            <div
              className={`h-20 w-20 rounded-xl flex items-center justify-center ${
                qrCount > 0
                  ? "bg-green-50 border border-green-200"
                  : "bg-gray-100"
              }`}
            >

              <QrCode
                className={`h-8 w-8 ${
                  qrCount > 0
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              />

            </div>

            <div>

              <p className="text-sm font-medium text-gray-700">

                QR Code
                {qrCount > 1
                  ? "s"
                  : ""}

              </p>

              <p className="text-xs text-gray-500">

                {qrCount > 0
                  ? `${qrCount} detected`
                  : "Not found"}

              </p>

            </div>

          </div>

        </div>

        {/* =====================================================
            EXTRACTED DETAILS
        ===================================================== */}

        <div className="mb-4">

          <h3 className="text-lg font-semibold text-gray-900">
            Extracted Information
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Information detected from this business card.
          </p>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* OWNER */}

          <Input
            id="owner_name"
            name="owner_name"
            label="Owner / Person Name"
            value={
              formData.owner_name ||
              ""
            }
            onChange={
              handleChange
            }
            placeholder="Rahul Patel"
          />

          {/* COMPANY */}

          <Input
            id="company_name"
            name="company_name"
            label="Company Name"
            value={
              formData.company_name ||
              ""
            }
            onChange={
              handleChange
            }
            placeholder="ABC Technologies"
          />

          {/* DESIGNATION */}

          <Input
            id="designation"
            name="designation"
            label="Designation"
            value={
              formData.designation ||
              ""
            }
            onChange={
              handleChange
            }
            placeholder="Founder & CEO"
          />

          {/* PHONE */}

          <Input
            id="phone"
            name="phone"
            label="Phone Number"
            value={
              formData.phone ||
              ""
            }
            onChange={
              handleChange
            }
            placeholder="+91 9876543210"
          />

          {/* EMAIL */}

          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            value={
              formData.email ||
              ""
            }
            onChange={
              handleChange
            }
            placeholder="contact@company.com"
          />

          {/* WEBSITE */}

          <Input
            id="website_url"
            name="website_url"
            label="Website"
            value={
              formData.website_url ||
              ""
            }
            onChange={
              handleChange
            }
            placeholder="https://company.com"
          />

          {/* INSTAGRAM */}

          <Input
            id="instagram_url"
            name="instagram_url"
            label="Instagram"
            value={
              formData.instagram_url ||
              ""
            }
            onChange={
              handleChange
            }
            placeholder="@username or full link"
          />

          {/* FACEBOOK */}

          <Input
            id="facebook_url"
            name="facebook_url"
            label="Facebook"
            value={
              formData.facebook_url ||
              ""
            }
            onChange={
              handleChange
            }
            placeholder="Facebook profile / page link"
          />

          {/* LINKEDIN */}

          <Input
            id="linkedin_url"
            name="linkedin_url"
            label="LinkedIn"
            value={
              formData.linkedin_url ||
              ""
            }
            onChange={
              handleChange
            }
            placeholder="LinkedIn profile link"
          />

          {/* GST */}

          <Input
            id="gst_number"
            name="gst_number"
            label="GST Number"
            value={
              formData.gst_number ||
              ""
            }
            onChange={
              handleChange
            }
            placeholder="24ABCDE1234F1Z5"
          />

        </div>

        {/* =====================================================
            ADDRESS
        ===================================================== */}

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
                onClick={
                  openMap
                }
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
            value={
              formData.address ||
              ""
            }
            onChange={
              handleChange
            }
            placeholder="Company address / City / State / Country"
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />

          {formData.address && (
            <div className="mt-2 flex items-start gap-2 text-sm text-gray-500">

              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />

              <span>
                {
                  formData.address
                }
              </span>

            </div>
          )}

        </div>

        {/* =====================================================
            OTHER DETAILS
        ===================================================== */}

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
            value={
              formData.other_details ||
              ""
            }
            onChange={
              handleChange
            }
            placeholder="Any other information found on the card..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />

        </div>

        {/* =====================================================
            ALL QR DATA
        ===================================================== */}

        {qrCount > 0 && (
          <div className="mt-6 space-y-3">

            <div className="flex items-center gap-2">

              <QrCode className="h-5 w-5 text-green-600" />

              <p className="font-medium text-green-800">

                QR Code
                {qrCount > 1
                  ? "s"
                  : ""}{" "}
                Detected

              </p>

            </div>

            {qrCodes.map(
              (
                qr,
                index
              ) => (
                <div
                  key={`${qr}-${index}`}
                  className="rounded-lg border border-green-200 bg-green-50 p-4"
                >

                  <p className="text-xs text-green-600 mb-1">
                    QR{" "}
                    {index +
                      1}
                  </p>

                  <p className="text-sm text-green-700 break-all">
                    {qr}
                  </p>

                </div>
              )
            )}

          </div>
        )}

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* =====================================================
            ACTION BUTTONS
        ===================================================== */}

        <div className="mt-8 flex flex-col sm:flex-row gap-3">

          {/* CANCEL */}

          <Button
            variant="outline"
            onClick={() =>
              router.push("/")
            }
            className="flex-1"
            disabled={
              isLoading
            }
          >

            <ArrowLeft className="h-4 w-4 mr-2" />

            Cancel

          </Button>

          {/* =================================================
              MULTIPLE CARDS
              SAVE & NEXT
          ================================================= */}

          {cards.length > 1 &&
          currentIndex <
            cards.length - 1 ? (
            <Button
              onClick={
                handleSave
              }
              className="flex-1"
              isLoading={
                isLoading
              }
              disabled={
                isLoading
              }
            >

              <Save className="h-4 w-4 mr-2" />

              Save & Next

              <ArrowRight className="h-4 w-4 ml-2" />

            </Button>
          ) : (
            /* =================================================
               LAST CARD / SINGLE CARD
            ================================================= */

            <Button
              onClick={
                handleSave
              }
              className="flex-1"
              isLoading={
                isLoading
              }
              disabled={
                isLoading
              }
            >

              <Save className="h-4 w-4 mr-2" />

              {cards.length > 1
                ? "Confirm & Save Last Card"
                : "Confirm & Save"}

            </Button>
          )}

        </div>

        {/* =====================================================
            DUPLICATE COMPANY CONFIRMATION
        ===================================================== */}

        {showDuplicateConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

            {/* BACKDROP */}

            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => {
                if (
                  !isLoading
                ) {
                  setShowDuplicateConfirm(
                    false
                  );

                  setPendingSaveData(
                    null
                  );

                  setPendingNextIndex(
                    null
                  );
                }
              }}
            />

            {/* MODAL */}

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

              <div className="flex flex-col items-center text-center">

                {/* ICON */}

                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">

                  <Building2 className="h-7 w-7 text-amber-600" />

                </div>

                {/* TITLE */}

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Company Already Exists
                </h3>

                {/* MESSAGE */}

                <p className="text-sm text-gray-600 mb-6">

                  A card with company name{" "}

                  <span className="font-semibold text-gray-900">

                    “
                    {
                      pendingSaveData?.company_name
                    }
                    ”

                  </span>{" "}

                  is already saved.

                  <br />

                  Do you still want to save this card?

                </p>

                {/* BUTTONS */}

                <div className="flex gap-3 w-full">

                  {/* CANCEL */}

                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowDuplicateConfirm(
                        false
                      );

                      setPendingSaveData(
                        null
                      );

                      setPendingNextIndex(
                        null
                      );
                    }}
                    disabled={
                      isLoading
                    }
                  >
                    No, Cancel
                  </Button>

                  {/* SAVE ANYWAY */}

                  <Button
                    className="flex-1"
                    onClick={() =>
                      performSave(
                        pendingSaveData
                      )
                    }
                    isLoading={
                      isLoading
                    }
                    disabled={
                      isLoading
                    }
                  >
                    Yes, Save Anyway
                  </Button>

                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}