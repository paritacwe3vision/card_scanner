from backend.core.supabase import supabase


TABLE_NAME = "business_cards"


# =====================================================
# CREATE BUSINESS CARD
# =====================================================

def create_card(card_data: dict):
    response = (
        supabase
        .table(TABLE_NAME)
        .insert(card_data)
        .execute()
    )

    if not response.data:
        raise Exception("Failed to save business card")

    return response.data[0]


# =====================================================
# GET ALL BUSINESS CARDS
# =====================================================

def get_all_cards():
    response = (
        supabase
        .table(TABLE_NAME)
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )

    return response.data or []


# =====================================================
# DELETE BUSINESS CARD
# =====================================================

def delete_card(card_id: str):
    response = (
        supabase
        .table(TABLE_NAME)
        .delete()
        .eq("id", card_id)
        .execute()
    )

    return bool(response.data)