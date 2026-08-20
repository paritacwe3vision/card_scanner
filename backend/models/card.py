from typing import Optional

from pydantic import BaseModel


class CardCreate(BaseModel):
    company_name: Optional[str] = None
    location: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    gst_number: Optional[str] = None
    company_logo: Optional[str] = None
    source_type: Optional[str] = None
    original_file_url: Optional[str] = None


class UrlRequest(BaseModel):
    url: str