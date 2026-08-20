from fastapi import APIRouter, UploadFile, File, HTTPException

from backend.models.card import CardCreate, UrlRequest
from backend.services.card_service import(
    create_card,
    get_all_cards,
    delete_card,
)
from backend.services.scanner_service import process_scan
from backend.services.pdf_service import process_pdf
from backend.services.enrichment_service import process_url

router = APIRouter(
    prefix="/api/cards",
    tags=["Business Cards"],
)


@router.post("/scan")
async def scan_card(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()

        card = process_scan(file_bytes)

        return {
            "success": True,
            "message": "Card processed successfully",
            "card": card,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@router.post("/pdf")
async def process_card_pdf(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()

        card = process_pdf(file_bytes)

        return {
            "success": True,
            "message": "PDF processed successfully",
            "card": card,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@router.post("/url")
async def process_card_url(request: UrlRequest):
    try:
        card = process_url(request.url)

        return {
            "success": True,
            "message": "URL processed successfully",
            "card": card,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@router.post("")
async def save_business_card(card: CardCreate):
    try:
        saved_card = create_card(card.model_dump(exclude_none=True))

        return {
            "success": True,
            "message": "Business card saved successfully",
            "card": saved_card,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


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
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@router.delete("/{card_id}")
async def remove_business_card(card_id: int):
    try:
        deleted = delete_card(card_id)

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
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )