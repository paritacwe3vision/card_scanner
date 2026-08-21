from typing import Optional
from pydantic import BaseModel


class CardCreate(BaseModel):
    owner_name: str
    company_name: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    gst_number: Optional[str] = None
    company_logo: Optional[str] = None
    instagram_url: Optional[str] = None
    website_url: Optional[str] = None
    facebook_url: Optional[str] = None


class UrlRequest(BaseModel):
    url: str