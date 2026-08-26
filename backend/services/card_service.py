from backend.core.supabase import supabase


TABLE_NAME = "business_cards"


# =====================================================
# QR CODE NORMALIZATION
# =====================================================

def _normalize_qr_codes(
    qr_codes,
) -> list[str]:
    """
    Normalize all QR codes before saving.

    Rules:
    - None -> []
    - Ignore empty values
    - Convert values to strings
    - Remove duplicate QR codes
    - Preserve original order
    """

    if not qr_codes:
        return []

    normalized: list[str] = []

    for qr in qr_codes:

        if qr is None:
            continue

        value = str(qr).strip()

        if not value:
            continue

        if value not in normalized:
            normalized.append(value)

    return normalized


# =====================================================
# CREATE BUSINESS CARD
# =====================================================

def create_card(card_data: dict):
    """
    Save a business card to Supabase.

    Multiple QR codes are preserved as a list.

    Example:

        qr_codes = [
            "https://www.revibeperfume.com/",
            "https://www.instagram.com/revibeperfume/"
        ]

    The complete list is sent to Supabase.
    """

    # =================================================
    # COPY INPUT
    # =================================================

    data = dict(card_data)

    # =================================================
    # NORMALIZE QR CODES
    # =================================================

    qr_codes = _normalize_qr_codes(
        data.get("qr_codes")
    )

    # Always save the normalized array when QR codes
    # are present.
    #
    # This prevents accidentally saving only qr_codes[0].

    if qr_codes:

        data["qr_codes"] = qr_codes

        # Keep qr_raw for backward compatibility.
        #
        # If qr_raw wasn't supplied, use the first QR
        # as the legacy single-QR value.

        if not data.get("qr_raw"):
            data["qr_raw"] = qr_codes[0]

    else:

        # If no QR codes exist, don't send an empty
        # array unnecessarily when the field is absent.
        #
        # If qr_codes was explicitly supplied, keeping []
        # is also valid for a Postgres text[] column.

        if "qr_codes" in data:
            data["qr_codes"] = []

    # =================================================
    # DEBUG LOG
    # =================================================

    print(
        "SAVE CARD - QR CODES:",
        data.get("qr_codes"),
    )

    print(
        "SAVE CARD - QR COUNT:",
        len(data.get("qr_codes") or []),
    )

    # =================================================
    # INSERT INTO SUPABASE
    # =================================================

    response = (
        supabase
        .table(TABLE_NAME)
        .insert(data)
        .execute()
    )

    # =================================================
    # VALIDATE RESPONSE
    # =================================================

    if not response.data:

        raise Exception(
            "Failed to save business card"
        )

    saved_card = response.data[0]

    # =================================================
    # DEBUG SAVED RESULT
    # =================================================

    print(
        "SAVED CARD ID:",
        saved_card.get("id"),
    )

    print(
        "SAVED QR CODES:",
        saved_card.get("qr_codes"),
    )

    print(
        "SAVED QR COUNT:",
        len(saved_card.get("qr_codes") or []),
    )

    return saved_card


# =====================================================
# GET ALL BUSINESS CARDS
# =====================================================

def get_all_cards():
    """
    Fetch all saved business cards.

    QR codes are returned directly from Supabase,
    including all values stored in qr_codes[].
    """

    response = (
        supabase
        .table(TABLE_NAME)
        .select("*")
        .order(
            "created_at",
            desc=True,
        )
        .execute()
    )

    return response.data or []


# =====================================================
# DELETE BUSINESS CARD
# =====================================================

def delete_card(
    card_id: str,
):
    """
    Delete one business card by ID.
    """

    response = (
        supabase
        .table(TABLE_NAME)
        .delete()
        .eq(
            "id",
            card_id,
        )
        .execute()
    )

    return bool(response.data)