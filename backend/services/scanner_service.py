from typing import Any, Optional

from backend.services.image_processing_service import (
    preprocess_image,
    detect_qr_codes,
    crop_card,
    crop_normalized_region,
)

from backend.services.vlm_service import (
    extract_business_card,
)

from backend.core.supabase import (
    upload_company_logo,
)


# ============================================================
# SAFE IMAGE EXTRACTION
# ============================================================

def _safe_extract(
    image_bytes: bytes,
    mime_type: str,
) -> dict[str, Any]:
    """
    Process one side of a business card.

    Flow:
    1. Crop the business card from the uploaded image.
    2. Preprocess the card.
    3. Detect QR codes.
    4. Send the card to Gemini.
    5. If Gemini returns a logo bounding box,
       crop the logo from the card.
    """

    if not image_bytes:
        return {}

    # ========================================================
    # 1. CROP BUSINESS CARD
    # ========================================================

    try:
        card_bytes = crop_card(
            file_bytes=image_bytes,
        )

    except Exception as exc:
        print(
            "Card crop failed, using original image:",
            exc,
        )

        # Never break normal scanning
        card_bytes = image_bytes

    # ========================================================
    # 2. PREPROCESS CARD
    # ========================================================

    processed_bytes = preprocess_image(
        file_bytes=card_bytes,
    )

    # preprocess_image() always returns JPEG
    processed_mime_type = "image/jpeg"

    # ========================================================
    # 3. QR DETECTION
    # ========================================================

    qr_codes = detect_qr_codes(
        card_bytes
    )

    # ========================================================
    # 4. GEMINI VLM EXTRACTION
    # ========================================================

    extracted = extract_business_card(
    file_bytes=card_bytes,
    mime_type="image/jpeg",
)

    # ========================================================
    # 5. LOGO EXTRACTION
    # ========================================================

    logo_bytes: bytes | None = None

    # New Gemini format:
    #
    # [ymin, xmin, ymax, xmax]
    #
    logo_bbox = extracted.get(
        "logo_bbox"
    )

    if logo_bbox:

        try:

            # IMPORTANT:
            #
            # Gemini analyzed processed_bytes, which came
            # from card_bytes.
            #
            # Because coordinates are normalized 0-1000,
            # we can safely crop from card_bytes.

            logo_bytes = crop_normalized_region(
                file_bytes=card_bytes,
                bbox=logo_bbox,
            )

        except Exception as exc:

            print(
                "Logo crop failed:",
                exc,
            )

            logo_bytes = None

    else:

    # Keep raw logo bytes internally.
    # Do not return binary bytes directly through JSON.

        extracted["_company_logo_bytes"] = (
            logo_bytes
        )

    # ========================================================
    # QR INFORMATION
    # ========================================================

    if qr_codes:

        extracted["qr_raw"] = (
            qr_codes[0]
        )

        extracted["qr_codes"] = (
            qr_codes
        )

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
    use the back-side value.
    """

    fields = [
        "owner_name",
        "designation",
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

    # ========================================================
    # NORMAL FIELDS
    # ========================================================

    for field in fields:

        front_value = front_data.get(
            field
        )

        back_value = back_data.get(
            field
        )

        if front_value not in (
            None,
            "",
        ):

            merged[field] = front_value

        elif back_value not in (
            None,
            "",
        ):

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

    qr_codes: list[str] = []

    for value in (
        front_qr_codes
        + back_qr_codes
    ):

        if (
            value
            and value not in qr_codes
        ):

            qr_codes.append(
                value
            )

    merged["qr_codes"] = qr_codes

    if qr_codes:

        merged["qr_raw"] = (
            qr_codes[0]
        )

    else:

        merged["qr_raw"] = None

    # ========================================================
    # COMPANY LOGO
    # ========================================================

    front_logo_bytes = front_data.get(
        "_company_logo_bytes"
    )

    back_logo_bytes = back_data.get(
        "_company_logo_bytes"
    )

    # Prefer front-side logo.
    # If not available, use back-side logo.

    if front_logo_bytes:

        merged["_company_logo_bytes"] = (
            front_logo_bytes
        )

    elif back_logo_bytes:

        merged["_company_logo_bytes"] = (
            back_logo_bytes
        )

    else:

        merged["_company_logo_bytes"] = None

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
    Process the front and optional back side
    of a business card.
    """

    # ========================================================
    # VALIDATE FRONT IMAGE
    # ========================================================

    if not front_bytes:

        raise ValueError(
            "Front-side business card image is required"
        )

    # ========================================================
    # FRONT SIDE
    # ========================================================

    front_data = _safe_extract(
        image_bytes=front_bytes,
        mime_type=front_mime_type,
    )

    # ========================================================
    # BACK SIDE
    # ========================================================

    back_data: dict[str, Any] = {}

    if back_bytes:

        back_data = _safe_extract(
            image_bytes=back_bytes,
            mime_type=back_mime_type,
        )

    # ========================================================
    # MERGE FRONT + BACK
    # ========================================================

    merged_data = _merge_card_data(
        front_data=front_data,
        back_data=back_data,
    )

    # ========================================================
    # GET CROPPED LOGO BYTES
    # ========================================================

    logo_bytes = merged_data.pop(
        "_company_logo_bytes",
        None,
    )

    # ========================================================
    # UPLOAD LOGO TO SUPABASE STORAGE
    # ========================================================

    company_logo_url: str | None = None

    if logo_bytes:

        try:

            company_logo_url = (
                upload_company_logo(
                    logo_bytes=logo_bytes,
                )
            )

        except Exception as exc:

            # Logo failure should NOT prevent
            # the business card from being scanned.

            print(
                "Company logo upload failed:",
                exc,
            )

            company_logo_url = None

    else:

        print(
            "No logo available for upload"
        )

    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    return {
        **merged_data,

        "company_logo": company_logo_url,

        "front_image_url": None,

        "back_image_url": None,

        "source_type": "scan",

        "original_file_url": None,
    }