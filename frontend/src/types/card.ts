export type SourceType = "scan" | "pdf" | "url";

export interface BusinessCard {
  id: number;
  company_name: string | null;
  location: string | null;
  email: string | null;
  phone: string | null;
  company_logo: string | null;
  gst_number: string | null;
  source_type: SourceType;
  original_file_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExtractedCard {
  company_name?: string | null;
  location?: string | null;
  email?: string | null;
  phone?: string | null;
  gst_number?: string | null;
  company_logo?: string | null;
  source_type?: SourceType;
  original_file_url?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  card?: T;
}