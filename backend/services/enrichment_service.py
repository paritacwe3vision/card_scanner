from urllib.parse import urlparse


def process_url(url: str) -> dict:
    """
    Temporary URL processor.

    Later this service will:
    1. Fetch company website
    2. Extract company information
    3. Find company location
    4. Find phone number
    5. Find social links
    6. Return structured company data
    """

    parsed = urlparse(url)

    domain = parsed.netloc

    return {
        "company_name": domain or None,
        "location": None,
        "email": None,
        "phone": None,
        "gst_number": None,
        "company_logo": None,
        "source_type": "url",
        "original_file_url": url,
    }