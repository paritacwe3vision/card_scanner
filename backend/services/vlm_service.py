import base64
import json
import logging
import time
from typing import Any

import requests

from backend.core.config import settings


logger = logging.getLogger(__name__)


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


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
    Convert the OpenRouter VLM response into a Python dictionary.
    """

    if not text:
        raise ValueError("VLM returned an empty response")

    text = text.strip()

    # Remove accidental markdown code fences.
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

    # Keep only our expected fields.
    cleaned = {
        field: data.get(field)
        for field in EXPECTED_FIELDS
    }

    return cleaned


def _image_to_data_url(
    file_bytes: bytes,
    mime_type: str,
) -> str:
    """
    Convert image bytes into a base64 data URL.
    """

    encoded_image = base64.b64encode(
        file_bytes
    ).decode("utf-8")

    return f"data:{mime_type};base64,{encoded_image}"


def _generate_vlm_response(
    file_bytes: bytes,
    mime_type: str,
    max_retries: int = 3,
) -> str:
    """
    Send the business-card image to OpenRouter.

    OpenRouter uses the Chat Completions API with a
    vision-capable model.
    """

    if not settings.openrouter_api_key:
        raise RuntimeError(
            "OPENROUTER_API_KEY is not configured"
        )

    image_data_url = _image_to_data_url(
        file_bytes=file_bytes,
        mime_type=mime_type,
    )

    headers = {
        "Authorization": (
            f"Bearer {settings.openrouter_api_key}"
        ),
        "Content-Type": "application/json",
    }

    payload = {
        "model": settings.openrouter_vlm_model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": VLM_PROMPT,
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_data_url,
                        },
                    },
                ],
            }
        ],
        "temperature": 0,
    }

    for attempt in range(max_retries):

        try:
            logger.info(
                "Sending business card to OpenRouter VLM "
                "(attempt %s/%s, model=%s)",
                attempt + 1,
                max_retries,
                settings.openrouter_vlm_model,
            )

            response = requests.post(
                OPENROUTER_URL,
                headers=headers,
                json=payload,
                timeout=120,
            )

            # -----------------------------------------
            # SUCCESS
            # -----------------------------------------

            if response.status_code == 200:

                response_data = response.json()

                choices = response_data.get(
                    "choices"
                )

                if not choices:
                    raise RuntimeError(
                        "OpenRouter returned no choices"
                    )

                message = choices[0].get(
                    "message",
                    {}
                )

                content = message.get(
                    "content"
                )

                if not content:
                    raise RuntimeError(
                        "OpenRouter returned empty VLM content"
                    )

                return content

            # -----------------------------------------
            # RATE LIMIT
            # -----------------------------------------

            if response.status_code == 429:

                logger.warning(
                    "OpenRouter rate limit reached: %s",
                    response.text,
                )

                if attempt == max_retries - 1:
                    raise RuntimeError(
                        "OpenRouter API rate limit exceeded. "
                        "Please try again later."
                    )

                wait_seconds = 2 ** attempt

                time.sleep(
                    wait_seconds
                )

                continue

            # -----------------------------------------
            # SERVER ERROR
            # -----------------------------------------

            if response.status_code >= 500:

                logger.warning(
                    "OpenRouter server error "
                    "(attempt %s/%s): %s",
                    attempt + 1,
                    max_retries,
                    response.text,
                )

                if attempt == max_retries - 1:
                    raise RuntimeError(
                        "OpenRouter VLM service is temporarily unavailable."
                    )

                wait_seconds = 2 ** attempt

                time.sleep(
                    wait_seconds
                )

                continue

            # -----------------------------------------
            # OTHER API ERROR
            # -----------------------------------------

            try:
                error_data = response.json()
            except ValueError:
                error_data = response.text

            logger.error(
                "OpenRouter API error: %s",
                error_data,
            )

            raise RuntimeError(
                f"OpenRouter API request failed "
                f"(HTTP {response.status_code}): "
                f"{error_data}"
            )

        except requests.Timeout as exc:

            logger.warning(
                "OpenRouter request timed out "
                "(attempt %s/%s)",
                attempt + 1,
                max_retries,
            )

            if attempt == max_retries - 1:
                raise RuntimeError(
                    "OpenRouter VLM request timed out."
                ) from exc

            wait_seconds = 2 ** attempt

            time.sleep(
                wait_seconds
            )

        except requests.RequestException as exc:

            logger.warning(
                "OpenRouter connection error "
                "(attempt %s/%s): %s",
                attempt + 1,
                max_retries,
                exc,
            )

            if attempt == max_retries - 1:
                raise RuntimeError(
                    "Could not connect to OpenRouter."
                ) from exc

            wait_seconds = 2 ** attempt

            time.sleep(
                wait_seconds
            )

    raise RuntimeError(
        "OpenRouter VLM request failed after all retries"
    )


def extract_business_card(
    file_bytes: bytes,
    mime_type: str,
) -> dict[str, Any]:
    """
    Extract business-card information using OpenRouter VLM.
    """

    if not file_bytes:
        raise ValueError(
            "Empty image file"
        )

    if not mime_type.startswith("image/"):
        raise ValueError(
            f"Unsupported MIME type: {mime_type}"
        )

    try:

        response_text = _generate_vlm_response(
            file_bytes=file_bytes,
            mime_type=mime_type,
            max_retries=3,
        )

        return _clean_vlm_response(
            response_text
        )

    except RuntimeError:
        raise

    except ValueError:
        raise

    except Exception as exc:

        logger.exception(
            "Unexpected OpenRouter VLM error"
        )

        raise RuntimeError(
            f"VLM extraction failed: {exc}"
        ) from exc

