from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.core.supabase import supabase


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ==========================================
# Request Models
# ==========================================

class SignupRequest(BaseModel):
    full_name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str

class LogoutRequest(BaseModel):
    user_id: str

# ==========================================
# CREATE ACCOUNT
# ==========================================

@router.post("/signup")
def signup(data: SignupRequest):
    try:
        email = data.email.strip().lower()

        # Check if account already exists
        existing_user = (
            supabase
            .table("login")
            .select("id")
            .ilike("email", email)
            .execute()
        )

        if existing_user.data:
            raise HTTPException(
                status_code=409,
                detail="Account already exists with this email"
            )

        # Create new account
        response = (
            supabase
            .table("login")
            .insert({
                "full_name": data.full_name.strip(),
                "email": email,
                "password": data.password
            })
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=500,
                detail="Unable to create account"
            )

        user = response.data[0]

        return {
            "success": True,
            "message": "Account created successfully",
            "user": {
                "id": user.get("id"),
                "full_name": user.get("full_name"),
                "email": user.get("email")
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        print("SIGNUP ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==========================================
# LOGIN
# ==========================================

@router.post("/login")
def login(data: LoginRequest):
    try:
        email = data.email.strip()

        # Find user by email
        response = (
            supabase
            .table("login")
            .select("*")
            .ilike("email", email)
            .execute()
        )

        # User does not exist
        if not response.data:
            raise HTTPException(
                status_code=401,
                detail="Account not found. Please create an account."
            )

        user = response.data[0]

        # Password does not match
        if user.get("password") != data.password:
            raise HTTPException(
                status_code=401,
                detail="Incorrect password"
            )

        # Successful login
        return {
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user.get("id"),
                "email": user.get("email"),
                "full_name": user.get("full_name")
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        print("LOGIN ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.post("/logout")
def logout(data: LogoutRequest):
    try:
        # Find the current user
        response = (
            supabase
            .table("login")
            .select("id, email, full_name")
            .eq("id", data.user_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        user = response.data[0]

        # Logout does NOT delete the account.
        # The frontend will clear the logged-in session.
        return {
            "success": True,
            "message": "Logout successful",
            "user": {
                "id": user.get("id"),
                "email": user.get("email"),
                "full_name": user.get("full_name"),
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        print("LOGOUT ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )