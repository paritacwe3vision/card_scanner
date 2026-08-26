from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# =====================================================
# QR DETAIL
# =====================================================

class QrDetail(BaseModel):
    """
    Structured information about one detected QR code.
    """

    raw: str

    type: str

    label: str

    url: Optional[str] = None


# =====================================================
# CREATE BUSINESS CARD
# =====================================================

class CardCreate(BaseModel):
    owner_name: str

    company_name: Optional[str] = None
    designation: Optional[str] = None

    address: Optional[str] = None

    email: Optional[str] = None
    phone: Optional[str] = None

    gst_number: Optional[str] = None
    company_logo: Optional[str] = None

    instagram_url: Optional[str] = None
    website_url: Optional[str] = None
    facebook_url: Optional[str] = None
    linkedin_url: Optional[str] = None

    other_details: Optional[str] = None

    # =====================================================
    # QR CODE DATA
    # =====================================================

    # -----------------------------------------------------
    # Backward-compatible single QR value
    # -----------------------------------------------------
    #
    # Older records / older scanner code may still use this.
    #
    qr_raw: Optional[str] = None

    # -----------------------------------------------------
    # ALL DETECTED QR CODES
    # -----------------------------------------------------
    #
    # Example:
    #
    # qr_codes = [
    #     "https://www.revibeperfume.com/",
    #     "https://www.instagram.com/revibeperfume/"
    # ]
    #
    qr_codes: Optional[list[str]] = Field(
        default=None
    )

    # -----------------------------------------------------
    # STRUCTURED QR DETAILS
    # -----------------------------------------------------
    #
    # Example:
    #
    # [
    #     {
    #         "raw": "https://www.revibeperfume.com/",
    #         "type": "website",
    #         "label": "Website",
    #         "url": "https://www.revibeperfume.com/"
    #     },
    #     {
    #         "raw": "https://www.instagram.com/revibeperfume/",
    #         "type": "instagram",
    #         "label": "Instagram",
    #         "url": "https://www.instagram.com/revibeperfume/"
    #     }
    # ]
    #
    qr_details: Optional[list[QrDetail]] = Field(
        default=None
    )

    # =====================================================
    # PYDANTIC CONFIG
    # =====================================================

    model_config = ConfigDict(
        extra="ignore"
    )


# =====================================================
# URL REQUEST
# =====================================================

class UrlRequest(BaseModel):
    url: str