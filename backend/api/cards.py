from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
)

from backend.models.card import (
    CardCreate,
    UrlRequest,
)

from backend.services.card_service import (
    create_card,
    get_all_cards,
    delete_card,
)

from backend.services.scanner_service import (
    process_scan,
)

from backend.services.pdf_service import (
    process_pdf,
)

from backend.services.enrichment_service import (
    process_url,
)


router = APIRouter(
    prefix="/api/cards",
    tags=["Business Cards"],
)


# ============================================================
# SCAN BUSINESS CARD - FRONT + BACK
# ============================================================

@router.post("/scan")
async def scan_card(
    front_file: UploadFile = File(...),
    back_file: UploadFile | None = File(None),
):
    """
    Scan a business card using front and optional back images.

    Front:
        Main business-card information.

    Back:
        Additional information such as:
        - phone
        - address
        - website
        - social links
        - QR codes
        - GST
    """

    try:

        # =====================================================
        # FRONT IMAGE
        # =====================================================

        front_bytes = await front_file.read()

        if not front_bytes:
            raise HTTPException(
                status_code=400,
                detail="Front-side image is empty",
            )

        front_mime_type = (
            front_file.content_type
            or "image/jpeg"
        )

        # =====================================================
        # BACK IMAGE
        # =====================================================

        back_bytes = None
        back_mime_type = "image/jpeg"

        if back_file is not None:

            temp_back_bytes = await back_file.read()

            if temp_back_bytes:
                back_bytes = temp_back_bytes

                back_mime_type = (
                    back_file.content_type
                    or "image/jpeg"
                )

        # =====================================================
        # PROCESS BOTH SIDES
        # =====================================================

        card = process_scan(
            front_bytes=front_bytes,
            back_bytes=back_bytes,
            front_mime_type=front_mime_type,
            back_mime_type=back_mime_type,
        )

        # =====================================================
        # RESPONSE
        # =====================================================

        return {
            "success": True,
            "message": "Business card processed successfully",
            "card": card,
        }

    except HTTPException:
        raise

    except RuntimeError as e:

        print(
            "SCAN ERROR:",
            repr(e),
        )

        error_message = str(e)

        if "Gemini API quota exceeded" in error_message:
            raise HTTPException(
                status_code=503,
                detail=error_message,
            ) from e

        raise HTTPException(
            status_code=500,
            detail=error_message,
        ) from e

    except Exception as e:

        print(
            "SCAN ERROR:",
            repr(e),
        )

        raise HTTPException(
            status_code=500,
            detail=str(e),
        ) from e
# ============================================================
# PDF
# ============================================================

@router.post("/pdf")
async def process_card_pdf(
    file: UploadFile = File(...),
):
    try:

        file_bytes = await file.read()

        if not file_bytes:
            raise HTTPException(
                status_code=400,
                detail="PDF file is empty",
            )

        card = process_pdf(
            file_bytes
        )

        return {
            "success": True,
            "message": "PDF processed successfully",
            "card": card,
        }

    except HTTPException:
        raise

    except Exception as e:

        print(
            "PDF ERROR:",
            repr(e),
        )

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# URL
# ============================================================

@router.post("/url")
async def process_card_url(
    request: UrlRequest,
):
    try:

        card = process_url(
            request.url
        )

        return {
            "success": True,
            "message": "URL processed successfully",
            "card": card,
        }

    except Exception as e:

        print(
            "URL ERROR:",
            repr(e),
        )

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# SAVE CARD
# ============================================================

@router.post("")
async def save_business_card(
    card: CardCreate,
):
    try:

        saved_card = create_card(
            card.model_dump(
                exclude_none=True
            )
        )

        return {
            "success": True,
            "message": "Business card saved successfully",
            "card": saved_card,
        }

    except Exception as e:

        print(
            "SAVE CARD ERROR:",
            repr(e),
        )

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# GET ALL CARDS
# ============================================================

@router.get("")
async def get_business_cards():

    try:

        cards = get_all_cards()

        return {
            "success": True,
            "message": "Business cards fetched successfully",
            "data": cards,
        }

    except Exception as e:

        print(
            "GET CARDS ERROR:",
            repr(e),
        )

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


# ============================================================
# DELETE CARD
# ============================================================

@router.delete("/{card_id}")
async def remove_business_card(
    card_id: int,
):

    try:

        deleted = delete_card(
            card_id
        )

        if not deleted:

            raise HTTPException(
                status_code=404,
                detail="Business card not found",
            )

        return {
            "success": True,
            "message": "Business card deleted successfully",
            "data": None,
        }

    except HTTPException:
        raise

    except Exception as e:

        print(
            "DELETE CARD ERROR:",
            repr(e),
        )

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )