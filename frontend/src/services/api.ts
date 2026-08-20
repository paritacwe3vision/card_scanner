import { BusinessCard, ExtractedCard, ApiResponse } from "@/types/card";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

// Upload from Camera / Image (Scan)
export async function uploadScan(
  file: File
): Promise<ApiResponse<ExtractedCard>> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/api/cards/scan`, {
    method: "POST",
    body: formData,
  });

  return handleResponse(response);
}

// Upload PDF
export async function uploadPdf(
  file: File
): Promise<ApiResponse<ExtractedCard>> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/api/cards/pdf`, {
    method: "POST",
    body: formData,
  });

  return handleResponse(response);
}

// Upload from URL
export async function uploadUrl(
  url: string
): Promise<ApiResponse<ExtractedCard>> {
  const response = await fetch(`${API_BASE}/api/cards/url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  return handleResponse(response);
}

// Save confirmed card
export async function saveCard(
  card: ExtractedCard
): Promise<ApiResponse<BusinessCard>> {
  const response = await fetch(`${API_BASE}/api/cards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(card),
  });

  return handleResponse(response);
}

// Get all cards
export async function getCards(): Promise<ApiResponse<BusinessCard[]>> {
  const response = await fetch(`${API_BASE}/api/cards`, {
    method: "GET",
    cache: "no-store",
  });

  return handleResponse(response);
}

// Delete a card
export async function deleteCard(id: number): Promise<ApiResponse<null>> {
  const response = await fetch(`${API_BASE}/api/cards/${id}`, {
    method: "DELETE",
  });

  return handleResponse(response);
}