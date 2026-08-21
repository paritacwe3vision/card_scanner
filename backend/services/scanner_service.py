from typing import Any, Optional

from backend.services.image_processing_service import (
    preprocess_image,
    detect_qr_codes,
)

from backend.services.vlm_service import (
    extract_business_card,
)


# ============================================================
# SAFE IMAGE EXTRACTION
# ============================================================

def _safe_extract(
    image_bytes: bytes,
    mime_type: str,
) -> dict[str, Any]:
    """
    Preprocess one business-card image
    and send it to the VLM.
    """

    if not image_bytes:
        return {}

    # --------------------------------------------------------
    # OpenCV preprocessing
    # --------------------------------------------------------

    processed_bytes = preprocess_image(
        file_bytes=image_bytes,
    )

    # preprocess_image() returns JPEG bytes
    processed_mime_type = "image/jpeg"

    # --------------------------------------------------------
    # QR detection
    # --------------------------------------------------------

    qr_codes = detect_qr_codes(
        image_bytes
    )

    # --------------------------------------------------------
    # VLM extraction
    # --------------------------------------------------------

    extracted = extract_business_card(
        file_bytes=processed_bytes,
        mime_type=processed_mime_type,
    )

    # --------------------------------------------------------
    # Add QR information
    # --------------------------------------------------------

    if qr_codes:
        extracted["qr_raw"] = qr_codes[0]
        extracted["qr_codes"] = qr_codes

    else:
        extracted["qr_raw"] = None
        extracted["qr_codes"] = []

    return extracted


# ============================================================
# MERGE FRONT + BACK
# ============================================================

def _merge_card_data(
    front_data: dict[str, Any],
    back_data: dict[str, Any],
) -> dict[str, Any]:
    """
    Merge information extracted from both sides.

    Front-side information gets priority.
    If the front does not contain a field,
    the back-side value is used.
    """

    fields = [
        "owner_name",
        "job_title",
        "company_name",
        "address",
        "email",
        "phone",
        "gst_number",
        "website_url",
        "instagram_url",
        "facebook_url",
        "linkedin_url",
    ]

    merged: dict[str, Any] = {}

    for field in fields:

        front_value = front_data.get(field)
        back_value = back_data.get(field)

        if front_value not in (None, ""):
            merged[field] = front_value

        elif back_value not in (None, ""):
            merged[field] = back_value

        else:
            merged[field] = None

    # ========================================================
    # QR CODES
    # ========================================================

    front_qr_codes = front_data.get(
        "qr_codes",
        [],
    )

    back_qr_codes = back_data.get(
        "qr_codes",
        [],
    )

    qr_codes = []

    for value in front_qr_codes + back_qr_codes:

        if value and value not in qr_codes:
            qr_codes.append(value)

    merged["qr_codes"] = qr_codes

    if qr_codes:
        merged["qr_raw"] = qr_codes[0]
    else:
        merged["qr_raw"] = None

    return merged


# ============================================================
# MAIN SCAN FUNCTION
# ============================================================

def process_scan(
    front_bytes: bytes,
    back_bytes: Optional[bytes] = None,
    front_mime_type: str = "image/jpeg",
    back_mime_type: str = "image/jpeg",
) -> dict[str, Any]:
    """
    Process front and optional back side
    of a business card.
    """

    # ========================================================
    # VALIDATE FRONT
    # ========================================================

    if not front_bytes:
        raise ValueError(
            "Front-side business card image is required"
        )

    # ========================================================
    # FRONT
    # ========================================================

    front_data = _safe_extract(
        image_bytes=front_bytes,
        mime_type=front_mime_type,
    )

    # ========================================================
    # BACK
    # ========================================================

    back_data: dict[str, Any] = {}

    if back_bytes:

        back_data = _safe_extract(
            image_bytes=back_bytes,
            mime_type=back_mime_type,
        )

    # ========================================================
    # MERGE
    # ========================================================

    merged_data = _merge_card_data(
        front_data=front_data,
        back_data=back_data,
    )

    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    return {
        **merged_data,

        "company_logo": None,

        "front_image_url": None,

        "back_image_url": None,

        "source_type": "scan",

        "original_file_url": None,
    }