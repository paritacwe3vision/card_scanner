import cv2
import numpy as np
from typing import Optional


def bytes_to_image(file_bytes: bytes) -> np.ndarray:
    """
    Convert raw image bytes into an OpenCV image.
    """

    if not file_bytes:
        raise ValueError("Image bytes are empty")

    np_array = np.frombuffer(file_bytes, dtype=np.uint8)

    image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Unable to decode image")

    return image


def image_to_bytes(
    image: np.ndarray,
    extension: str = ".jpg",
) -> bytes:
    """
    Convert an OpenCV image back into image bytes.
    """

    success, encoded = cv2.imencode(extension, image)

    if not success:
        raise ValueError("Unable to encode processed image")

    return encoded.tobytes()


def preprocess_image(
    file_bytes: bytes,
    target_width: int = 1600,
) -> bytes:
    """
    Preprocess a business-card image using OpenCV.

    Steps:
    1. Decode image
    2. Resize large images
    3. Improve contrast
    4. Reduce noise
    5. Sharpen the image
    6. Return JPEG bytes

    The returned bytes can be sent to the VLM.
    """

    image = bytes_to_image(file_bytes)

    # -----------------------------------------
    # 1. Resize
    # -----------------------------------------

    height, width = image.shape[:2]

    if width > target_width:

        scale = target_width / float(width)

        new_width = target_width
        new_height = int(height * scale)

        image = cv2.resize(
            image,
            (new_width, new_height),
            interpolation=cv2.INTER_AREA,
        )

    # -----------------------------------------
    # 2. Convert to LAB
    # -----------------------------------------

    lab = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2LAB,
    )

    l_channel, a_channel, b_channel = cv2.split(lab)

    # -----------------------------------------
    # 3. Improve contrast
    # -----------------------------------------

    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8),
    )

    l_channel = clahe.apply(l_channel)

    lab = cv2.merge(
        (
            l_channel,
            a_channel,
            b_channel,
        )
    )

    image = cv2.cvtColor(
        lab,
        cv2.COLOR_LAB2BGR,
    )

    # -----------------------------------------
    # 4. Reduce noise
    # -----------------------------------------

    image = cv2.GaussianBlur(
        image,
        (3, 3),
        0,
    )

    # -----------------------------------------
    # 5. Sharpen
    # -----------------------------------------

    kernel = np.array(
        [
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0],
        ],
        dtype=np.float32,
    )

    image = cv2.filter2D(
        image,
        -1,
        kernel,
    )

    # -----------------------------------------
    # 6. Encode as JPEG
    # -----------------------------------------

    return image_to_bytes(
        image,
        extension=".jpg",
    )

def detect_qr_code(file_bytes: bytes) -> Optional[str]:
    results = detect_qr_codes(file_bytes)
    return results[0] if results else None


def detect_qr_codes(file_bytes: bytes) -> list[str]:
    """
    Aggressive multi-strategy QR detection for real business cards.
    """
    if not file_bytes:
        return []

    image = bytes_to_image(file_bytes)
    detector = cv2.QRCodeDetector()
    found: list[str] = []

    def _add(value: str | None):
        if value and value.strip() and value.strip() not in found:
            found.append(value.strip())

    def _try(img: np.ndarray):
        # Multi
        try:
            success, decoded_info, _, _ = detector.detectAndDecodeMulti(img)
            if success and decoded_info:
                for v in decoded_info:
                    _add(v)
        except Exception:
            pass

        # Single
        try:
            data, _, _ = detector.detectAndDecode(img)
            _add(data)
        except Exception:
            pass

    # 1. Original
    _try(image)
    if found:
        return found

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # 2. CLAHE
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    _try(clahe.apply(gray))
    if found:
        return found

    # 3. Adaptive threshold variants
    for block in (31, 51, 71):
        for c in (5, 10, 15):
            adaptive = cv2.adaptiveThreshold(
                gray, 255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY,
                block, c
            )
            _try(adaptive)
            if found:
                return found

    # 4. Otsu
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    _, otsu = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    _try(otsu)
    if found:
        return found

    # 5. Upscale (helps small QRs)
    h, w = gray.shape[:2]
    if max(h, w) < 1600:
        for scale in (1.5, 2.0, 2.5):
            up = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
            _try(up)
            _try(clahe.apply(up))
            if found:
                return found

    # 6. Slight rotations (common on phone photos)
    for angle in (-8, -4, 4, 8):
        matrix = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
        rotated = cv2.warpAffine(gray, matrix, (w, h), flags=cv2.INTER_LINEAR)
        _try(rotated)
        if found:
            return found

    return found

def resize_image(
    file_bytes: bytes,
    max_width: int = 1600,
    max_height: int = 1200,
) -> bytes:
    """
    Resize an image while maintaining aspect ratio.
    """

    image = bytes_to_image(file_bytes)

    height, width = image.shape[:2]

    scale = min(
        max_width / width,
        max_height / height,
        1.0,
    )

    if scale < 1.0:

        new_width = int(width * scale)
        new_height = int(height * scale)

        image = cv2.resize(
            image,
            (new_width, new_height),
            interpolation=cv2.INTER_AREA,
        )

    return image_to_bytes(
        image,
        extension=".jpg",
    )


def crop_card(
    file_bytes: bytes,
) -> bytes:
    """
    Attempt to detect the largest rectangular area
    representing the business card.

    If detection fails, returns the original image.
    """

    image = bytes_to_image(file_bytes)

    original = image.copy()

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY,
    )

    blurred = cv2.GaussianBlur(
        gray,
        (5, 5),
        0,
    )

    edges = cv2.Canny(
        blurred,
        50,
        150,
    )

    contours, _ = cv2.findContours(
        edges,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE,
    )

    image_area = image.shape[0] * image.shape[1]

    best_contour = None
    best_area = 0

    for contour in contours:

        area = cv2.contourArea(contour)

        if area < image_area * 0.10:
            continue

        perimeter = cv2.arcLength(
            contour,
            True,
        )

        approx = cv2.approxPolyDP(
            contour,
            0.02 * perimeter,
            True,
        )

        if len(approx) == 4 and area > best_area:

            best_area = area
            best_contour = approx

    if best_contour is None:
        return image_to_bytes(original)

    points = best_contour.reshape(4, 2)

    # Order points:
    # top-left, top-right, bottom-right, bottom-left

    rect = np.zeros(
        (4, 2),
        dtype=np.float32,
    )

    sums = points.sum(axis=1)

    rect[0] = points[np.argmin(sums)]
    rect[2] = points[np.argmax(sums)]

    differences = np.diff(
        points,
        axis=1,
    )

    rect[1] = points[np.argmin(differences)]
    rect[3] = points[np.argmax(differences)]

    width_a = np.linalg.norm(
        rect[2] - rect[3]
    )

    width_b = np.linalg.norm(
        rect[1] - rect[0]
    )

    height_a = np.linalg.norm(
        rect[1] - rect[2]
    )

    height_b = np.linalg.norm(
        rect[0] - rect[3]
    )

    max_width = max(
        int(width_a),
        int(width_b),
    )

    max_height = max(
        int(height_a),
        int(height_b),
    )

    if max_width <= 0 or max_height <= 0:
        return image_to_bytes(original)

    destination = np.array(
        [
            [0, 0],
            [max_width - 1, 0],
            [max_width - 1, max_height - 1],
            [0, max_height - 1],
        ],
        dtype=np.float32,
    )

    matrix = cv2.getPerspectiveTransform(
        rect,
        destination,
    )

    warped = cv2.warpPerspective(
        image,
        matrix,
        (
            max_width,
            max_height,
        ),
    )

    return image_to_bytes(warped)


# ============================================================
# CROP NORMALIZED REGION
# ============================================================
# ============================================================
# CROP NORMALIZED REGION
# ============================================================

def crop_normalized_region(
    file_bytes: bytes,
    bbox: list[int],
    padding: float = 0.05,
) -> bytes:
    """
    Crop a region from an image using Gemini's
    normalized bounding-box coordinates.

    Expected format:

    [ymin, xmin, ymax, xmax]

    All coordinates are normalized from 0 to 1000.

    This function is mainly used to crop the
    company logo detected by the VLM.
    """

    # --------------------------------------------------------
    # Validate image
    # --------------------------------------------------------

    if not file_bytes:
        raise ValueError(
            "Image bytes are empty"
        )

    # --------------------------------------------------------
    # Validate bounding box
    # --------------------------------------------------------

    if not isinstance(bbox, list):
        raise ValueError(
            "Bounding box must be a list"
        )

    if len(bbox) != 4:
        raise ValueError(
            "Bounding box must contain exactly 4 values"
        )

    # --------------------------------------------------------
    # Decode image
    # --------------------------------------------------------

    image = bytes_to_image(
        file_bytes
    )

    image_height, image_width = image.shape[:2]

    # --------------------------------------------------------
    # Read Gemini coordinates
    # --------------------------------------------------------

    try:
        ymin = int(bbox[0])
        xmin = int(bbox[1])
        ymax = int(bbox[2])
        xmax = int(bbox[3])

    except (TypeError, ValueError) as exc:
        raise ValueError(
            "Bounding box coordinates must be integers"
        ) from exc

    # --------------------------------------------------------
    # Clamp normalized values between 0 and 1000
    # --------------------------------------------------------

    ymin = max(
        0,
        min(1000, ymin),
    )

    xmin = max(
        0,
        min(1000, xmin),
    )

    ymax = max(
        0,
        min(1000, ymax),
    )

    xmax = max(
        0,
        min(1000, xmax),
    )

    # --------------------------------------------------------
    # Validate rectangle
    # --------------------------------------------------------

    if ymax <= ymin:
        raise ValueError(
            "Invalid logo bounding box height"
        )

    if xmax <= xmin:
        raise ValueError(
            "Invalid logo bounding box width"
        )

    # --------------------------------------------------------
    # Convert normalized coordinates to pixels
    # --------------------------------------------------------

    y1 = int(
        (ymin / 1000.0)
        * image_height
    )

    x1 = int(
        (xmin / 1000.0)
        * image_width
    )

    y2 = int(
        (ymax / 1000.0)
        * image_height
    )

    x2 = int(
        (xmax / 1000.0)
        * image_width
    )

    # --------------------------------------------------------
    # Add padding around logo
    # --------------------------------------------------------

    crop_width = x2 - x1
    crop_height = y2 - y1

    padding_x = int(
        crop_width * padding
    )

    padding_y = int(
        crop_height * padding
    )

    x1 = max(
        0,
        x1 - padding_x,
    )

    y1 = max(
        0,
        y1 - padding_y,
    )

    x2 = min(
        image_width,
        x2 + padding_x,
    )

    y2 = min(
        image_height,
        y2 + padding_y,
    )

    # --------------------------------------------------------
    # Crop logo
    # --------------------------------------------------------

    cropped = image[
        y1:y2,
        x1:x2,
    ]

    if cropped.size == 0:
        raise ValueError(
            "Logo crop resulted in an empty image"
        )

    # --------------------------------------------------------
    # Return PNG bytes
    # --------------------------------------------------------

    return image_to_bytes(
        cropped,
        extension=".png",
    )