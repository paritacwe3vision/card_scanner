import {
  BusinessCard,
  ExtractedCard,
  ApiResponse,
} from "@/types/card";


const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";


// =====================================================
// AUTH TYPES
// =====================================================

interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
}


interface AuthResponse {
  success: boolean;
  message: string;
  user: AuthUser;
}

interface LogoutResponse {
  success: boolean;
  message: string;
}
// =====================================================
// COMMON RESPONSE HANDLER
// =====================================================

async function handleResponse<T>(
  response: Response
): Promise<T> {

  const contentType = response.headers.get("content-type");

  // -----------------------------------------
  // Backend did not return JSON
  // -----------------------------------------

  if (!contentType?.includes("application/json")) {

    const text = await response.text();

    console.error(
      "Invalid backend response:",
      text
    );

    throw new Error(
      text || "Backend returned an invalid response"
    );
  }

  const data = await response.json();

  // -----------------------------------------
  // Backend returned an error
  // -----------------------------------------

  if (!response.ok) {

    console.error(
      "Backend error:",
      data
    );

    let errorMessage = "Something went wrong";

    if (typeof data?.detail === "string") {

      errorMessage = data.detail;

    } else if (typeof data?.message === "string") {

      errorMessage = data.message;

    } else if (data?.detail) {

      // detail is an object/array
      errorMessage = JSON.stringify(
        data.detail,
        null,
        2
      );

    } else if (data) {

      // fallback for any other JSON response
      errorMessage = JSON.stringify(
        data,
        null,
        2
      );
    }

    throw new Error(errorMessage);
  }

  return data;
}


// =====================================================
// AUTHENTICATION
// =====================================================


// Create Account
export async function signupUser(
  fullName: string,
  email: string,
  password: string
): Promise<AuthResponse> {

  const response = await fetch(
    `${API_BASE}/auth/signup`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        full_name: fullName,
        email: email.trim(),
        password,
      }),
    }
  );

  return handleResponse<AuthResponse>(response);
}


// Login
export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {

  const response = await fetch(
    `${API_BASE}/auth/login`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email: email.trim(),
        password,
      }),
    }
  );

  return handleResponse<AuthResponse>(response);
}


// =====================================================
// BUSINESS CARD APIs
// =====================================================


// =====================================================
// Upload from Camera / Image (Scan)
// =====================================================

export async function uploadScan(
  frontFile: File,
  backFile?: File | null
): Promise<ApiResponse<any>> {

  const formData = new FormData();

  // MUST match FastAPI parameter names
  formData.append(
    "front_file",
    frontFile
  );

  if (backFile) {
    formData.append(
      "back_file",
      backFile
    );
  }

  const response = await fetch(
    `${API_BASE}/api/cards/scan`,
    {
      method: "POST",
      body: formData,
    }
  );

  return handleResponse<ApiResponse<any>>(
    response
  );
}
// =====================================================
// Upload PDF
// =====================================================

export async function uploadPdf(
  file: File
): Promise<ApiResponse<ExtractedCard>> {

  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_BASE}/api/cards/pdf`,
    {
      method: "POST",
      body: formData,
    }
  );

  return handleResponse<ApiResponse<ExtractedCard>>(
    response
  );
}


// =====================================================
// Upload from URL
// =====================================================

export async function uploadUrl(
  url: string
): Promise<ApiResponse<ExtractedCard>> {

  const response = await fetch(
    `${API_BASE}/api/cards/url`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        url,
      }),
    }
  );

  return handleResponse<ApiResponse<ExtractedCard>>(
    response
  );
}


// =====================================================
// Save Confirmed Card
// =====================================================

export async function saveCard(
  card: ExtractedCard
): Promise<ApiResponse<BusinessCard>> {

  const response = await fetch(
    `${API_BASE}/api/cards`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(card),
    }
  );

  return handleResponse<ApiResponse<BusinessCard>>(
    response
  );
}


// =====================================================
// Get All Cards
// =====================================================

export async function getCards():
  Promise<ApiResponse<BusinessCard[]>> {

  const response = await fetch(
    `${API_BASE}/api/cards`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  return handleResponse<ApiResponse<BusinessCard[]>>(
    response
  );
}


// =====================================================
// Delete Card
// =====================================================

export async function deleteCard(
  id: string
): Promise<ApiResponse<null>> {

  const response = await fetch(
    `${API_BASE}/api/cards/${id}`,
    {
      method: "DELETE",
    }
  );

  return handleResponse<ApiResponse<null>>(
    response
  );
}


// Logout


export async function logoutUser(
  userId: string
): Promise<LogoutResponse> {
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
    }),
  });

  return handleResponse<LogoutResponse>(response);
}