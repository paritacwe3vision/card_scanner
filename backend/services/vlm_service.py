import json
import logging
from typing import Any

from google import genai
from google.genai import types

from backend.core.config import settings


logger = logging.getLogger(__name__)


VLM_PROMPT = """
You are a business-card information extraction system.

Analyze the provided business card image and extract only information
that is actually visible or clearly readable in the image.

Do NOT invent, guess, or hallucinate missing information.

Return ONLY valid JSON using exactly this structure:

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
    Convert Gemini's response into a Python dictionary.
    """

    if not text:
        raise ValueError(
            "Gemini returned an empty response"
        )

    text = text.strip()

    # Remove markdown code fences if present.
    if text.startswith("```"):
        lines = text.splitlines()

        if lines and lines[0].startswith("```"):
            lines = lines[1:]

        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        text = "\n".join(lines).strip()

    try:
        data = json.loads(text)

    except json.JSONDecodeError:

        # Try to locate JSON inside additional text.
        start = text.find("{")
        end = text.rfind("}")

        if start == -1 or end == -1 or end <= start:
            logger.error(
                "Gemini returned invalid JSON: %s",
                text,
            )

            raise ValueError(
                "Gemini returned invalid JSON"
            )

        json_text = text[start:end + 1]

        try:
            data = json.loads(json_text)

        except json.JSONDecodeError as exc:

            logger.error(
                "Could not parse Gemini JSON: %s",
                text,
            )

            raise ValueError(
                "Gemini returned invalid JSON"
            ) from exc

    if not isinstance(data, dict):
        raise ValueError(
            "Gemini response must be a JSON object"
        )

    return {
        field: data.get(field)
        for field in EXPECTED_FIELDS
    }


def _generate_vlm_response(
    file_bytes: bytes,
    mime_type: str,
) -> str:
    """
    Send the business-card image to Gemini.
    """

    if not settings.gemini_api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured"
        )

    if not file_bytes:
        raise ValueError(
            "Image data is empty"
        )

    logger.info(
        "Sending business card to Gemini VLM "
        "(model=%s)",
        settings.gemini_vlm_model,
    )

    try:

        client = genai.Client(
            api_key=settings.gemini_api_key
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
                temperature=0,
                response_mime_type="application/json",
            ),
        )

        response_text = response.text

        if not response_text:
            raise RuntimeError(
                "Gemini returned an empty response"
            )

        logger.info(
            "Gemini VLM response received successfully"
        )

        logger.debug(
            "Gemini raw response: %s",
            response_text,
        )

        return response_text.strip()

    except Exception as exc:

        logger.exception(
            "Gemini VLM request failed"
        )

        raise RuntimeError(
            f"Gemini VLM request failed: {exc}"
        ) from exc


def extract_business_card(
    file_bytes: bytes,
    mime_type: str,
) -> dict[str, Any]:
    """
    Extract business-card information using Gemini VLM.
    """

    if not file_bytes:
        raise ValueError(
            "Empty image file"
        )

    if not mime_type.startswith("image/"):
        raise ValueError(
            f"Unsupported MIME type: {mime_type}"
        )

    response_text = _generate_vlm_response(
        file_bytes=file_bytes,
        mime_type=mime_type,
    )

    return _clean_vlm_response(
        response_text
    )