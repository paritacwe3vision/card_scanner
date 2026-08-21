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
        # 1. Find current user in login table
        response = (
            supabase
            .table("login")
            .select("*")
            .eq("id", data.user_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="Logged-in user not found"
            )

        user = response.data[0]

        # 2. Copy user to logout table
        logout_response = (
            supabase
            .table("logout")
            .upsert({
                "id": user.get("id"),
                "email": user.get("email"),
                "full_name": user.get("full_name"),
                "password": user.get("password"),
                "created_at": user.get("created_at"),
                "updated_at": user.get("updated_at"),
            })
            .execute()
        )

        if not logout_response.data:
            raise HTTPException(
                status_code=500,
                detail="Could not move user to logout table"
            )

        # 3. Delete user from login table
        (
            supabase
            .table("login")
            .delete()
            .eq("id", data.user_id)
            .execute()
        )

        return {
            "success": True,
            "message": "Logout successful"
        }

    except HTTPException:
        raise

    except Exception as e:
        print("LOGOUT ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )