import cv2
import numpy as np
import pytesseract
from PIL import Image
import re

def extract_paper_robust(image_path):
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image: {image_path}")

    original = img.copy()
    h, w = img.shape[:2]

    print(f"Image size: {w}x{h}")

    # Method 1: Color-based detection (white paper)
    print("Trying color-based detection...")
    paper = detect_white_paper(img)

    if paper is not None and paper.shape[0] > h * 0.3 and paper.shape[1] > w * 0.3:
        print("Color detection successful")
        return paper

    # Method 2: Simple contour detection
    print("Trying contour detection...")
    paper = detect_by_contour(img)

    if paper is not None and paper.shape[0] > h * 0.3 and paper.shape[1] > w * 0.3:
        print("Contour detection successful")
        return paper

    # Method 3: Auto-crop margins
    print("Trying auto-crop...")
    paper = auto_crop_margins(img)

    if paper is not None:
        print("✓ Auto-crop successful")
        return paper

    print("Using original image (no paper detected)")
    return original


def detect_white_paper(img):
    try:
        # Convert to HSV
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

        lower_white = np.array([0, 0, 180])
        upper_white = np.array([180, 30, 255])

        mask = cv2.inRange(hsv, lower_white, upper_white)

        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (10, 10))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return None

        largest = max(contours, key=cv2.contourArea)

        x, y, w, h = cv2.boundingRect(largest)

        margin = 10
        x = max(0, x - margin)
        y = max(0, y - margin)
        w = min(img.shape[1] - x, w + 2 * margin)
        h = min(img.shape[0] - y, h + 2 * margin)

        paper = img[y:y + h, x:x + w]

        return paper
    except Exception as e:
        print(f"Color detection failed: {e}")
        return None


def detect_by_contour(img):
    try:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        edges = cv2.Canny(blurred, 30, 100)

        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return None

        for contour in sorted(contours, key=cv2.contourArea, reverse=True)[:5]:
            peri = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.02 * peri, True)

            if len(approx) == 4:
                x, y, w, h = cv2.boundingRect(approx)
                paper = img[y:y + h, x:x + w]
                return paper

        return None
    except Exception as e:
        print(f"Contour detection failed: {e}")
        return None


def auto_crop_margins(img):
    try:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Threshold to binary
        _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)

        row_sums = np.sum(binary, axis=1)
        col_sums = np.sum(binary, axis=0)

        threshold = 0.7 * 255 * img.shape[1]

        white_rows = np.where(row_sums > threshold)[0]
        if len(white_rows) == 0:
            return None

        top = white_rows[0]
        bottom = white_rows[-1]

        threshold = 0.7 * 255 * img.shape[0]
        white_cols = np.where(col_sums > threshold)[0]
        if len(white_cols) == 0:
            return None

        left = white_cols[0]
        right = white_cols[-1]

        # Crop
        paper = img[top:bottom, left:right]

        return paper
    except Exception as e:
        print(f"Auto-crop failed: {e}")
        return None


def preprocess_fast(img):
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img

    # Simple thresholding
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    return binary


def extract_text_structured(img, lang='srp'):
    # Preprocess
    processed = preprocess_fast(img)

    custom_config = r'--oem 3 --psm 6'

    try:
        data = pytesseract.image_to_data(
            processed,
            lang=lang,
            config=custom_config,
            output_type=pytesseract.Output.DICT
        )
    except Exception as e:
        print(f"OCR with 'srp' failed, trying 'eng': {e}")
        data = pytesseract.image_to_data(
            processed,
            lang='eng',
            config=custom_config,
            output_type=pytesseract.Output.DICT
        )

    lines = {}
    for i in range(len(data['text'])):
        conf = int(data['conf'][i]) if data['conf'][i] != -1 else 0
        if conf > 30 and data['text'][i].strip():  # Lower threshold
            line_num = data['line_num'][i]
            block_num = data['block_num'][i]

            key = (block_num, line_num)
            if key not in lines:
                lines[key] = []
            lines[key].append(data['text'][i])

    # Format output
    result = []
    for key in sorted(lines.keys()):
        line = ' '.join(lines[key])
        if line.strip():
            result.append(line)

    return '\n'.join(result)


def process_image(image_path, save_intermediate=True):
    """Main processing function"""

    print("=" * 50)
    print("Starting image processing...")
    print("=" * 50)

    # Extract paper
    paper = extract_paper_robust(image_path)

    if save_intermediate:
        cv2.imwrite('../extracted.jpg', paper)
        print("Saved: extracted.jpg")

    # Preprocess
    processed = preprocess_fast(paper)

    if save_intermediate:
        cv2.imwrite('preprocessed.jpg', processed)
        print("Saved: preprocessed.jpg")

    # Extract text
    print("\nExtracting text...")
    text = extract_text_structured(paper)

    print("=" * 50)
    print("RESULT:")
    print("=" * 50)
    print(text)

    return text

def extract_questions_from_text(text):
    final_lines = []
    for line in text.split('\n'):
        match = re.match(r'^\d+\.?\s*(.*)', line.strip())
        if match and match.group(1):
            final_lines.append(match.group(1))
    return "\n".join(final_lines)
