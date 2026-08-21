from typing import Optional

from pydantic import BaseModel


# ============================================================
# BUSINESS CARD CREATE MODEL
# ============================================================

class CardCreate(BaseModel):
    owner_name: str
    company_name: str | None = None
    address: str | None = None
    email: str | None = None
    phone: str | None = None
    gst_number: str | None = None
    company_logo: str | None = None
    instagram_url: str | None = None
    website_url: str | None = None
    facebook_url: str | None = None
    linkedin_url: str | None = None

# ============================================================
# URL REQUEST MODEL
# ============================================================

class UrlRequest(BaseModel):
    """
    Request model for URL-based card enrichment.
    """

    url: str