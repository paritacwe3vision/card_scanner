"use client";

import React, { useEffect, useState } from "react";
import {
  Trash2,
  Building2,
  Eye,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  ExternalLink,
  FileText,
  QrCode,
} from "lucide-react";

import { BusinessCard } from "@/types/card";
import { getCards, deleteCard } from "@/services/api";
import { displayValue, formatDate } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "./EmptyState";
import Button from "@/components/ui/Button";

export default function CardTable() {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [selectedCard, setSelectedCard] =
    useState<BusinessCard | null>(null);

  // =====================================================
  // FETCH CARDS
  // =====================================================

  const fetchCards = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getCards();

      if (response.success && response.data) {
        setCards(response.data);
      } else {
        setError(
          response.message || "Failed to load cards"
        );
      }
    } catch (err: any) {
      setError(
        err.message || "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  // =====================================================
  // DELETE CARD
  // =====================================================

  const handleDelete = async (id: string) => {
    // Just open the custom popup
    setDeleteConfirmId(id);
  };
  
  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
  
    try {
      setDeletingId(deleteConfirmId);
  
      const response = await deleteCard(deleteConfirmId);
  
      if (response.success) {
        setCards((prev) =>
          prev.filter((card) => card.id !== deleteConfirmId)
        );
  
        if (selectedCard?.id === deleteConfirmId) {
          setSelectedCard(null);
        }
      } else {
        alert(response.message || "Failed to delete card");
      }
    } catch (err: any) {
      alert(err.message || "Something went wrong while deleting");
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  // =====================================================
  // NORMALIZE URL
  // =====================================================

  const normalizeUrl = (url: string) => {
    if (
      url.startsWith("http://") ||
      url.startsWith("https://")
    ) {
      return url;
    }

    return `https://${url}`;
  };

  // =====================================================
  // GET ALL QR CODES
  // =====================================================

  const getQrCodes = (
    card: BusinessCard
  ): string[] => {
    /*
     * New format:
     *
     * qr_codes: [
     *   "QR 1",
     *   "QR 2"
     * ]
     *
     * Old format:
     *
     * qr_raw: "QR 1"
     *
     * We support both.
     */

    const cardWithQrCodes =
      card as BusinessCard & {
        qr_codes?: string[];
      };

    if (
      Array.isArray(cardWithQrCodes.qr_codes) &&
      cardWithQrCodes.qr_codes.length > 0
    ) {
      return cardWithQrCodes.qr_codes.filter(
        (qr): qr is string =>
          typeof qr === "string" &&
          qr.trim().length > 0
      );
    }

    if (
      typeof card.qr_raw === "string" &&
      card.qr_raw.trim().length > 0
    ) {
      // Split multiple QR codes stored with separator
      return card.qr_raw
        .split(" ||| ")
        .map((qr) => qr.trim())
        .filter((qr) => qr.length > 0);
    }
    return [];
  };
  // =====================================================
// FILTERED CARDS (Dynamic Search)
// =====================================================
const filteredCards = cards.filter((card) => {
  if (!search.trim()) return true;

  const q = search.toLowerCase().trim();

  return (
    (card.owner_name || "").toLowerCase().includes(q) ||
    (card.company_name || "").toLowerCase().includes(q) ||
    (card.email || "").toLowerCase().includes(q) ||
    (card.phone || "").toLowerCase().includes(q) ||
    (card.address || "").toLowerCase().includes(q) ||
    (card.designation || "").toLowerCase().includes(q) ||
    (card.website_url || "").toLowerCase().includes(q) ||
    (card.instagram_url || "").toLowerCase().includes(q)
  );
});

  // =====================================================
  // QR LINK HANDLER
  // =====================================================

  const getQrLink = (rawValue: string) => {
    const raw = rawValue.trim();

    let href: string | null = null;
    let label = raw;

    // -------------------------------------------------
    // HTTP / HTTPS
    // -------------------------------------------------

    if (
      raw.startsWith("http://") ||
      raw.startsWith("https://")
    ) {
      href = raw;
    }

    // -------------------------------------------------
    // WHATSAPP
    // -------------------------------------------------

    else if (
      raw.startsWith("whatsapp://") ||
      raw.includes("wa.me") ||
      raw.includes("whatsapp.com")
    ) {
      href = raw;
    }

    // -------------------------------------------------
    // INSTAGRAM
    // -------------------------------------------------

    else if (
      raw.includes("instagram.com") ||
      raw.startsWith("instagram://")
    ) {
      href = raw.startsWith("http")
        ? raw
        : `https://${raw}`;
    }

    // -------------------------------------------------
    // PHONE
    // -------------------------------------------------

    else if (
      raw.startsWith("tel:") ||
      /^\+?[\d\s\-()]{8,}$/.test(raw)
    ) {
      href = raw.startsWith("tel:")
        ? raw
        : `tel:${raw.replace(
            /[\s()-]+/g,
            ""
          )}`;

      label = raw.replace(
        /^tel:/i,
        ""
      );
    }

    // -------------------------------------------------
    // EMAIL
    // -------------------------------------------------

    else if (
      raw.startsWith("mailto:") ||
      (
        raw.includes("@") &&
        !raw.includes("://")
      )
    ) {
      href = raw.startsWith("mailto:")
        ? raw
        : `mailto:${raw}`;

      label = raw.replace(
        /^mailto:/i,
        ""
      );
    }

    // -------------------------------------------------
    // PLAIN INSTAGRAM USERNAME
    // -------------------------------------------------

    else if (
      raw.startsWith("@") &&
      raw.length > 1
    ) {
      const username =
        raw.substring(1);

      href = `https://www.instagram.com/${username}`;

      label = `@${username}`;
    }

    return {
      href,
      label,
    };
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingSpinner
          size="lg"
          text="Loading business cards..."
        />
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">
          {error}
        </p>

        <Button onClick={fetchCards}>
          Try Again
        </Button>
      </div>
    );
  }

  // =====================================================
  // EMPTY
  // =====================================================

  if (cards.length === 0) {
    return <EmptyState />;
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <>
    {/* ========== SEARCH BAR ========== */}
<div className="mb-5">
  <div className="relative max-w-md">
    <input
      type="text"
      placeholder="Search by name, company, email, phone..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm
                 placeholder:text-gray-400
                 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
    />
    <svg
      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>

    {search && (
      <button
        onClick={() => setSearch("")}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>
    )}
  </div>

  {search && (
    <p className="mt-2 text-sm text-gray-500">
      Showing {filteredCards.length} of {cards.length} cards
    </p>
  )}
</div>
      {/* =================================================
          TABLE
      ================================================= */}

      <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full table-fixed">

          {/* =================================================
              HEADER
          ================================================= */}

          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>

              <th className="w-[4%] px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                #
              </th>

              <th className="w-[17%] px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Owner
              </th>

              <th className="w-[16%] px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Company
              </th>

              <th className="w-[17%] px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email
              </th>

              <th className="w-[13%] px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Phone
              </th>

              <th className="w-[17%] px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Location
              </th>

              <th className="w-[8%] px-3 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Added
              </th>

              <th className="w-[8%] px-2 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                Actions
              </th>

            </tr>
          </thead>

          {/* =================================================
              BODY
          ================================================= */}

          <tbody className="divide-y divide-gray-100">

          {filteredCards.map((card, index) => (
              <tr
                key={card.id}
                className="hover:bg-gray-50/70 transition-colors"
              >

                {/* NUMBER */}

                <td className="px-3 py-5 text-sm text-gray-500">
                  {index + 1}
                </td>

                {/* OWNER */}

                <td className="px-3 py-5">

                  <div className="flex items-center gap-2 min-w-0">

                    <div className="h-9 w-9 shrink-0 rounded-full bg-indigo-50 flex items-center justify-center">
                      <User className="h-4 w-4 text-indigo-600" />
                    </div>

                    <div className="min-w-0">

                      <p
                        className="text-sm font-medium text-gray-900 leading-5 line-clamp-2 break-words"
                        title={card.owner_name}
                      >
                        {displayValue(
                          card.owner_name
                        )}
                      </p>

                      {card.designation && (
                        <p
                          className="text-xs text-gray-500 mt-1 truncate"
                          title={card.designation}
                        >
                          {card.designation}
                        </p>
                      )}

                    </div>

                  </div>

                </td>

                {/* COMPANY */}

                <td className="px-3 py-5">

                  <div className="flex items-center gap-2 min-w-0">

                    {card.company_logo ? (
                      <img
                        src={card.company_logo}
                        alt={
                          card.company_name ||
                          "Company logo"
                        }
                        className="h-9 w-9 shrink-0 rounded-lg object-contain border border-gray-200 bg-white p-1"
                      />
                    ) : (
                      <div className="h-9 w-9 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-gray-400" />
                      </div>
                    )}

                    <p
                      className="text-sm font-medium text-gray-900 leading-5 line-clamp-2 break-words"
                      title={
                        card.company_name ||
                        ""
                      }
                    >
                      {displayValue(
                        card.company_name
                      )}
                    </p>

                  </div>

                </td>

                {/* EMAIL */}

                <td className="px-3 py-5 text-sm min-w-0">

                  {card.email ? (
                    <a
                      href={`mailto:${card.email}`}
                      title={card.email}
                      className="block truncate text-gray-700 hover:text-indigo-600 transition-colors"
                    >
                      {card.email}
                    </a>
                  ) : (
                    <span className="text-gray-400">
                      —
                    </span>
                  )}

                </td>

                {/* PHONE */}

                <td className="px-3 py-5">

                  <div
                    className="text-sm text-gray-700 leading-5 line-clamp-2 break-words"
                    title={card.phone || ""}
                  >
                    {displayValue(
                      card.phone
                    )}
                  </div>

                </td>

                {/* LOCATION */}

                <td className="px-3 py-5 min-w-0">

                  <div
                    className="text-sm text-gray-700 truncate"
                    title={card.address || ""}
                  >
                    {displayValue(
                      card.address
                    )}
                  </div>

                </td>

                {/* DATE */}

                <td className="px-3 py-5">

                  <div className="text-xs text-gray-500 leading-5">
                    {formatDate(
                      card.created_at
                    )}
                  </div>

                </td>

                {/* ACTIONS */}

                <td className="px-2 py-5">

                  <div className="flex items-center justify-center gap-1">

                    {/* VIEW */}

                    <button
                      onClick={() =>
                        setSelectedCard(card)
                      }
                      className="h-9 w-9 shrink-0 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* DELETE */}

                    <button
                      onClick={() =>
                        handleDelete(card.id)
                      }
                      disabled={
                        deletingId === card.id
                      }
                      className="h-9 w-9 shrink-0 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete card"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                  </div>

                </td>

              </tr>
            ))}

          </tbody>

        </table>
      </div>

      {/* =================================================
          DETAILS MODAL
      ================================================= */}

      {selectedCard && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() =>
            setSelectedCard(null)
          }
        >

          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5">

              <div className="flex items-center gap-4">

                {selectedCard.company_logo ? (
                  <img
                    src={
                      selectedCard.company_logo
                    }
                    alt={
                      selectedCard.company_name ||
                      "Company logo"
                    }
                    className="h-14 w-14 rounded-xl object-contain border border-gray-200 p-1"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Building2 className="h-7 w-7 text-gray-400" />
                  </div>
                )}

                <div>

                  <h2 className="text-xl font-semibold text-gray-900">
                    {displayValue(
                      selectedCard.owner_name
                    )}
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    {displayValue(
                      selectedCard.company_name
                    )}
                  </p>

                </div>

              </div>

              <button
                onClick={() =>
                  setSelectedCard(null)
                }
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>

            </div>

            {/* =================================================
                MODAL CONTENT
            ================================================= */}

            <div className="p-6">

              {/* CONTACT INFORMATION */}

              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Contact Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <DetailItem
                  icon={
                    <User className="h-4 w-4" />
                  }
                  label="Owner Name"
                  value={
                    selectedCard.owner_name
                  }
                />

                <DetailItem
                  icon={
                    <Building2 className="h-4 w-4" />
                  }
                  label="Designation"
                  value={
                    selectedCard.designation
                  }
                />

                <DetailItem
                  icon={
                    <Building2 className="h-4 w-4" />
                  }
                  label="Company"
                  value={
                    selectedCard.company_name
                  }
                />

                <DetailItem
                  icon={
                    <Mail className="h-4 w-4" />
                  }
                  label="Email"
                  value={
                    selectedCard.email
                  }
                />

                <DetailItem
                  icon={
                    <Phone className="h-4 w-4" />
                  }
                  label="Phone"
                  value={
                    selectedCard.phone
                  }
                />

                <DetailItem
                  icon={
                    <FileText className="h-4 w-4" />
                  }
                  label="GST Number"
                  value={
                    selectedCard.gst_number
                  }
                />

              </div>

              {/* ADDRESS */}

              <div className="mt-4">

                <DetailItem
                  icon={
                    <MapPin className="h-4 w-4" />
                  }
                  label="Address"
                  value={
                    selectedCard.address
                  }
                />

              </div>

              {/* =================================================
                  ONLINE PRESENCE
              ================================================= */}

              <div className="mt-7">

                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Online Presence
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <LinkDetail
                    label="Website"
                    url={
                      selectedCard.website_url
                    }
                    normalizeUrl={
                      normalizeUrl
                    }
                  />

                  <LinkDetail
                    label="LinkedIn"
                    url={
                      selectedCard.linkedin_url
                    }
                    normalizeUrl={
                      normalizeUrl
                    }
                  />

                  <LinkDetail
                    label="Instagram"
                    url={
                      selectedCard.instagram_url
                    }
                    normalizeUrl={
                      normalizeUrl
                    }
                  />

                  <LinkDetail
                    label="Facebook"
                    url={
                      selectedCard.facebook_url
                    }
                    normalizeUrl={
                      normalizeUrl
                    }
                  />

                </div>

              </div>

              {/* =================================================
                  OTHER DETAILS
              ================================================= */}

              <div className="mt-7">

                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Other Information
                </h3>

                <DetailItem
                  icon={
                    <FileText className="h-4 w-4" />
                  }
                  label="Other Details"
                  value={
                    selectedCard.other_details
                  }
                />

              </div>

              {/* =================================================
                  ALL QR CODES
              ================================================= */}

              {(() => {
                const qrCodes =
                  getQrCodes(
                    selectedCard
                  );

                if (
                  qrCodes.length === 0
                ) {
                  return null;
                }

                return (
                  <div className="mt-7">

                    <h3 className="text-sm font-semibold text-gray-900 mb-4">
                      QR Code
                      {qrCodes.length > 1
                        ? "s"
                        : ""}
                    </h3>

                    <div className="space-y-3">

                      {qrCodes.map(
                        (
                          qr,
                          index
                        ) => {

                          const {
                            href,
                            label,
                          } =
                            getQrLink(
                              qr
                            );

                          return (
                            <div
                              key={`${qr}-${index}`}
                              className="rounded-xl border border-green-200 bg-green-50 p-4"
                            >

                              <div className="flex items-center gap-2 text-xs font-medium text-green-700 mb-2">

                                <QrCode className="h-4 w-4" />

                                <span>
                                  QR{" "}
                                  {index +
                                    1}
                                </span>

                              </div>

                              {href ? (

                                <a
                                  href={
                                    href
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-green-800 hover:underline break-all flex items-center gap-1.5"
                                >

                                  {label}

                                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />

                                </a>

                              ) : (

                                <p className="text-sm font-medium text-green-800 break-all">
                                  {
                                    label
                                  }
                                </p>

                              )}

                            </div>
                          );
                        }
                      )}

                    </div>

                  </div>
                );
              })()}

              {/* =================================================
                  DATES
              ================================================= */}

              <div className="mt-7 grid grid-cols-1 md:grid-cols-2 gap-4">

                <DetailItem
                  icon={
                    <FileText className="h-4 w-4" />
                  }
                  label="Added"
                  value={formatDate(
                    selectedCard.created_at
                  )}
                />

                <DetailItem
                  icon={
                    <FileText className="h-4 w-4" />
                  }
                  label="Last Updated"
                  value={formatDate(
                    selectedCard.updated_at
                  )}
                />

              </div>

            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="sticky bottom-0 flex justify-end border-t border-gray-200 bg-white px-6 py-4">

              <button
                onClick={() =>
                  setSelectedCard(null)
                }
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}{/* ========== CUSTOM DELETE CONFIRMATION POPUP ========== */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          />
      
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="h-7 w-7 text-red-600" />
              </div>
      
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Card?
              </h3>
      
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this business card?
                This action cannot be undone.
              </p>
      
              {/* Buttons */}
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={!!deletingId}
                >
                  Cancel
                </Button>
      
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={confirmDelete}
                  isLoading={!!deletingId}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

/* =====================================================
   DETAIL ITEM
===================================================== */

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">

      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
        {icon}
        <span>{label}</span>
      </div>

      <p className="text-sm font-medium text-gray-900 break-words">
        {value || "—"}
      </p>

    </div>
  );
}

/* =====================================================
   LINK ITEM
===================================================== */

function LinkDetail({
  label,
  url,
  normalizeUrl,
}: {
  label: string;
  url: string | null;
  normalizeUrl: (url: string) => string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">

      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">

        <Globe className="h-4 w-4" />

        <span>
          {label}
        </span>

      </div>

      {url ? (

        <a
          href={normalizeUrl(url)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:underline break-all"
        >

          {url}

          <ExternalLink className="h-3.5 w-3.5 shrink-0" />

        </a>

      ) : (

        <p className="text-sm text-gray-400">
          —
        </p>

      )}

    </div>
  );
}