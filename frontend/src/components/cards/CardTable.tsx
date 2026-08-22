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
} from "lucide-react";

import { BusinessCard } from "@/types/card";
import { getCards, deleteCard } from "@/services/api";
import { displayValue, formatDate } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "./EmptyState";
import Button from "@/components/ui/Button";

export default function CardTable() {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [selectedCard, setSelectedCard] =
    useState<BusinessCard | null>(null);

  const fetchCards = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getCards();

      if (response.success && response.data) {
        setCards(response.data);
      } else {
        setError(response.message || "Failed to load cards");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this card?")) {
      return;
    }

    try {
      setDeletingId(id);

      const response = await deleteCard(id);

      if (response.success) {
        setCards((prev) =>
          prev.filter((card) => card.id !== id)
        );

        if (selectedCard?.id === id) {
          setSelectedCard(null);
        }
      } else {
        alert(response.message || "Failed to delete card");
      }
    } catch (err: any) {
      alert(
        err.message ||
          "Something went wrong while deleting"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const normalizeUrl = (url: string) => {
    if (
      url.startsWith("http://") ||
      url.startsWith("https://")
    ) {
      return url;
    }

    return `https://${url}`;
  };

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

  if (cards.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      {/* ================= TABLE ================= */}

      <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full table-fixed">

          {/* ================= HEADER ================= */}

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

          {/* ================= BODY ================= */}

          <tbody className="divide-y divide-gray-100">
            {cards.map((card, index) => (
              <tr
                key={card.id}
                className="hover:bg-gray-50/70 transition-colors"
              >

                {/* Number */}

                <td className="px-3 py-5 text-sm text-gray-500">
                  {index + 1}
                </td>

                {/* ================= OWNER ================= */}

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
                        {displayValue(card.owner_name)}
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

                {/* ================= COMPANY ================= */}

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
                      title={card.company_name || ""}
                    >
                      {displayValue(card.company_name)}
                    </p>

                  </div>
                </td>

                {/* ================= EMAIL ================= */}

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

                {/* ================= PHONE ================= */}

                <td className="px-3 py-5">
                  <div
                    className="text-sm text-gray-700 leading-5 line-clamp-2 break-words"
                    title={card.phone || ""}
                  >
                    {displayValue(card.phone)}
                  </div>
                </td>

                {/* ================= LOCATION ================= */}

                <td className="px-3 py-5 min-w-0">
                  <div
                    className="text-sm text-gray-700 truncate"
                    title={card.address || ""}
                  >
                    {displayValue(card.address)}
                  </div>
                </td>

                {/* ================= DATE ================= */}

                <td className="px-3 py-5">
                  <div className="text-xs text-gray-500 leading-5">
                    {formatDate(card.created_at)}
                  </div>
                </td>

                {/* ================= ACTIONS ================= */}

                <td className="px-2 py-5">
                  <div className="flex items-center justify-center gap-1">

                    {/* View */}

                    <button
                      onClick={() =>
                        setSelectedCard(card)
                      }
                      className="h-9 w-9 shrink-0 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* Delete */}

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

      {/* ================= DETAILS MODAL ================= */}

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

            {/* ================= MODAL HEADER ================= */}

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

            {/* ================= MODAL CONTENT ================= */}

            <div className="p-6">

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

              {/* Address */}

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

              {/* ================= ONLINE PRESENCE ================= */}

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

              {/* ================= OTHER DETAILS ================= */}

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

              {/* ================= DATES ================= */}

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

            {/* ================= FOOTER ================= */}

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

        <span>{label}</span>

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