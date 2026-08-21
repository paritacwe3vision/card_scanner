export type SourceType = "scan" | "pdf" | "url";

export interface BusinessCard {
  id: number;
  person_name: string | null;
  company_name: string | null;
  designation: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  location: string | null;
  gst_number: string | null;
  company_logo: string | null;
  card_image_url: string | null;
  qr_raw: string | null;
  other_details: string | null;
  source_type: SourceType;
  original_file_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExtractedCard {
  owner_name: string;

  job_title?: string | null;

  company_name?: string | null;

  address?: string | null;

  email?: string | null;

  phone?: string | null;

  gst_number?: string | null;

  company_logo?: string | null;

  website_url?: string | null;

  instagram_url?: string | null;

  facebook_url?: string | null;

  linkedin_url?: string | null;

  front_image_url?: string | null;

  back_image_url?: string | null;

  qr_raw?: string | null;

  other_details?: string | null;

  source_type?: string | null;

  original_file_url?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  card?: T;
}