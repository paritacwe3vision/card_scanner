import json
import logging
import time
from typing import Any

from google import genai
from google.genai import errors
from google.genai import types

from backend.core.config import settings


logger = logging.getLogger(__name__)


client = genai.Client(
    api_key=settings.gemini_api_key
)


VLM_PROMPT = """
You are a business-card information extraction system.

Analyze the provided business card image and extract only information
that is actually visible or clearly readable in the image.

Do NOT invent, guess, or hallucinate missing information.

Return ONLY valid JSON.

Use exactly this structure:

{
    "owner_name": null,
    "company_name": null,
    "address": null,
    "email": null,
    "phone": null,
    "gst_number": null,
    "website_url": null,
    "instagram_url": null,
    "facebook_url": null,
    "linkedin_url": null
}

Rules:

1. If a field is not visible, return null.
2. Preserve names exactly as written on the card.
3. Preserve phone numbers accurately.
4. Preserve email addresses accurately.
5. Preserve website URLs accurately.
6. Preserve GST numbers accurately if visible.
7. Preserve social media URLs accurately if visible.
8. Do not create information that is not present.
9. Do not add explanations.
10. Return JSON only.
"""


EXPECTED_FIELDS = {
    "owner_name",
    "company_name",
    "address",
    "email",
    "phone",
    "gst_number",
    "website_url",
    "instagram_url",
    "facebook_url",
    "linkedin_url",
}


def _clean_vlm_response(text: str) -> dict[str, Any]:
    """
    Convert the VLM response into a Python dictionary.
    """

    text = text.strip()

    # Handle accidental markdown code fences.
    if text.startswith("```"):
        lines = text.splitlines()

        if lines and lines[0].startswith("```"):
            lines = lines[1:]

        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        text = "\n".join(lines).strip()

    try:
        data = json.loads(text)

    except json.JSONDecodeError as exc:
        logger.error(
            "VLM returned invalid JSON: %s",
            text,
        )

        raise ValueError(
            "VLM returned invalid JSON"
        ) from exc

    if not isinstance(data, dict):
        raise ValueError(
            "VLM response must be a JSON object"
        )

    # Keep only fields that belong to our schema.
    cleaned = {
        field: data.get(field)
        for field in EXPECTED_FIELDS
    }

    return cleaned


def _generate_vlm_response(
    file_bytes: bytes,
    mime_type: str,
    max_retries: int = 3,
):
    """
    Send the image to Gemini.

    Handles:
    - Temporary Gemini server errors
    - Gemini quota/rate-limit errors
    """

    for attempt in range(max_retries):

        try:
            logger.info(
                "Sending business card to VLM "
                "(attempt %s/%s)",
                attempt + 1,
                max_retries,
            )

            response = client.models.generate_content(
                model=settings.gemini_vlm_model,
                contents=[
                    types.Part.from_bytes(
                        data=file_bytes,
                        mime_type=mime_type,
                    ),
                    VLM_PROMPT,
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )

            return response

        # -----------------------------------------
        # QUOTA / RATE LIMIT
        # -----------------------------------------

        except errors.ClientError as exc:

            if exc.code == 429:
                logger.error(
                    "Gemini API quota exceeded: %s",
                    exc,
                )

                raise RuntimeError(
                    "Gemini API quota exceeded. "
                    "Please wait for the quota to reset "
                    "or use a Gemini API project with available quota."
                ) from exc

            logger.exception(
                "Gemini API client error"
            )

            raise RuntimeError(
                f"Gemini API request failed: {exc}"
            ) from exc

        # -----------------------------------------
        # TEMPORARY SERVER ERROR
        # -----------------------------------------

        except errors.ServerError as exc:

            logger.warning(
                "Gemini server error on attempt %s/%s: %s",
                attempt + 1,
                max_retries,
                exc,
            )

            if attempt == max_retries - 1:
                raise RuntimeError(
                    "VLM service is temporarily unavailable. "
                    "Please try again later."
                ) from exc

            wait_seconds = 2 ** attempt

            logger.info(
                "Retrying VLM request in %s seconds...",
                wait_seconds,
            )

            time.sleep(wait_seconds)

    raise RuntimeError(
        "VLM request failed after all retries"
    )


def extract_business_card(
    file_bytes: bytes,
    mime_type: str,
) -> dict[str, Any]:
    """
    Send a business-card image directly to the VLM.

    Args:
        file_bytes:
            Raw image bytes.

        mime_type:
            Image MIME type, e.g. image/jpeg.

    Returns:
        Structured business-card information.
    """

    if not file_bytes:
        raise ValueError(
            "Empty image file"
        )

    if not mime_type.startswith("image/"):
        raise ValueError(
            f"Unsupported MIME type: {mime_type}"
        )

    response = _generate_vlm_response(
        file_bytes=file_bytes,
        mime_type=mime_type,
        max_retries=3,
    )

    return _clean_vlm_response(
        response.text
    )