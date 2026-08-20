def process_scan(file_bytes: bytes) -> dict:
    """
    Temporary scanner implementation.

    Later this service will handle:
    - business card image processing
    - QR extraction
    - text extraction
    - structured card information
    """

    return {
        "company_name": None,
        "location": None,
        "email": None,
        "phone": None,
        "gst_number": None,
        "company_logo": None,
        "source_type": "scan",
        "original_file_url": None,
    }