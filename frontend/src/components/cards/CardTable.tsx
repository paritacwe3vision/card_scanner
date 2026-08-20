"use client";

import React, { useEffect, useState } from "react";
import { Trash2, Building2 } from "lucide-react";
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
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this card?")) return;

    try {
      setDeletingId(id);
      const response = await deleteCard(id);

      if (response.success) {
        setCards((prev) => prev.filter((card) => card.id !== id));
      } else {
        alert(response.message || "Failed to delete card");
      }
    } catch (err: any) {
      alert(err.message || "Something went wrong while deleting");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20">
        <LoadingSpinner size="lg" text="Loading business cards..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchCards}>Try Again</Button>
      </div>
    );
  }

  if (cards.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Company
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Location
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Phone
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              GST
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Added
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {cards.map((card, index) => (
            <tr key={card.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4 text-sm text-gray-500">{index + 1}</td>

              {/* Company + Logo */}
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  {card.company_logo ? (
                    <img
                      src={card.company_logo}
                      alt={card.company_name || "Logo"}
                      className="h-10 w-10 rounded-lg object-contain border border-gray-200 bg-white"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {displayValue(card.company_name)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {card.source_type}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-4 py-4 text-sm text-gray-700">
                {displayValue(card.location)}
              </td>
              <td className="px-4 py-4 text-sm text-gray-700">
                {displayValue(card.email)}
              </td>
              <td className="px-4 py-4 text-sm text-gray-700">
                {displayValue(card.phone)}
              </td>
              <td className="px-4 py-4 text-sm text-gray-700">
                {displayValue(card.gst_number)}
              </td>
              <td className="px-4 py-4 text-sm text-gray-500">
                {formatDate(card.created_at)}
              </td>

              {/* Actions */}
              <td className="px-4 py-4 text-right">
                <button
                  onClick={() => handleDelete(card.id)}
                  disabled={deletingId === card.id}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete card"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}