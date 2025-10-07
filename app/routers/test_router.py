from fastapi import APIRouter, HTTPException, status, Body, Form, File, UploadFile

from app.models.test import Test
from app.models.testuser import TestUser
from typing import List

from processing.text_extraction import extract_text_structured, process_image_from_array, safe_process_image

router = APIRouter()


@router.post("/", response_model=Test, status_code=status.HTTP_201_CREATED)
async def create_test_from_image(
        subject_code: str = Form(..., description="Subject code e.g. CS302"),
        exam_period: str = Form(..., description="Exam period e.g. 'Januarski 2024'"),
        academic_year: str = Form(..., description="Academic year e.g. '2023/2024'"),
        test_type: str = Form("regular", description="Test type: regular, makeup, midterm, final, practical"),
        image: UploadFile = File(..., description="Image file of the test/exam")
):
    """
    Create a new test by extracting text from an uploaded image.

    - **subject_code**: Code of the subject (e.g., "CS302")
    - **exam_period**: Examination period (e.g., "Januarski 2024")
    - **academic_year**: Academic year (e.g., "2023/2024")
    - **test_type**: Type of test (regular, makeup, midterm, final, practical)
    - **image**: Image file containing the test/exam
    """

    # Validate image file type
    allowed_extensions = ["jpg", "jpeg", "png", "pdf", "tiff", "bmp"]
    file_extension = image.filename.split(".")[-1].lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not supported. Allowed types: {', '.join(allowed_extensions)}"
        )

    # Read image content
    try:
        image_content = await image.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read image file: {str(e)}"
        )

    # Extract text from image
    try:
        extracted_text = safe_process_image(image_content)

        if not extracted_text or extracted_text.strip() == "":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No text could be extracted from the image"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text extraction failed: {str(e)}"
        )

    # Create Test document
    test = Test(
        subject_code=subject_code,
        exam_period=exam_period,
        academic_year=academic_year,
        test_type=test_type.lower(),
        full_text=extracted_text
    )

    # Save to database
    try:
        await test.insert()
        return test
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save test: {str(e)}"
        )