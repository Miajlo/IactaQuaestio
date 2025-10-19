from fastapi import APIRouter, HTTPException, status, Body, Form, File, UploadFile,Query

from app.models.test import Test
from app.models.testuser import TestUser
from typing import List, Optional
from bson import Binary
from pydantic import BaseModel

from processing.text_extraction import extract_text_structured, get_text_from_bytes, process_image_from_array, safe_process_image, \
    extract_questions_with_groups

test_router = APIRouter()


from fastapi import UploadFile, File, Form, HTTPException, status
import asyncio

# Response model that excludes binary data to avoid UTF-8 serialization errors
class TestResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: Optional[str] = None
    subject_code: str
    exam_period: str
    academic_year: str
    test_type: str
    full_text: str
    file_extension: Optional[str] = None

    @staticmethod
    def from_test(test: Test):
        """Convert Test document to TestResponse, handling ObjectId conversion"""
        return TestResponse(
            id=str(test.id) if test.id else None,
            subject_code=test.subject_code,
            exam_period=test.exam_period,
            academic_year=test.academic_year,
            test_type=test.test_type,
            full_text=test.full_text,
            file_extension=test.file_extension
        )

@test_router.post("/", response_model=TestResponse, status_code=status.HTTP_201_CREATED)
async def create_test_from_file(
    subject_code: str = Form(..., description="Subject code e.g. CS302"),
    exam_period: str = Form(..., description="Exam period e.g. 'Januarski 2024'"),
    academic_year: str = Form(..., description="Academic year e.g. '2023/2024'"),
    test_type: str = Form("regular", description="Test type: regular, makeup, midterm, final, practical"),
    file: UploadFile = File(..., description="Image or PDF file of the test/exam")
):
    """
    Create a new test by extracting text from an uploaded image or PDF.
    """
    # Validate file extension
    allowed_extensions = ["jpg", "jpeg", "png", "pdf", "tiff", "bmp"]
    file_extension = file.filename.split(".")[-1].lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not supported. Allowed types: {', '.join(allowed_extensions)}"
        )

    # Read file content
    try:
        file_content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read file: {str(e)}"
        )
    
    # Extract text using our new function in a background thread
    try:
        extracted_text = await asyncio.to_thread(get_text_from_bytes, file_content, file.filename)

        if not extracted_text or extracted_text.strip() == "":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No text could be extracted from the uploaded file"
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
        full_text=extract_questions_with_groups(extracted_text),
        full_file=Binary(file_content),  # Wrap in Binary to store raw bytes without encoding
        file_extension=file_extension
    )
    # Save to database
    try:
        await test.insert()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save test to database: {str(e)}"
        )

    # Convert to response
    try:
        return TestResponse.from_test(test)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to convert test to response: {str(e)}"
        )


@test_router.get("/find", response_model=List[TestResponse])
async def search_tests(
        subject_code: Optional[str] = Query(None, description="Exact match: subject code"),
        academic_year: Optional[str] = Query(None, description="Exact match: academic year"),
        exam_period: Optional[str] = Query(None, description="Exact match: exam period"),
        test_type: Optional[str] = Query(None, description="Exact match: test type"),
        text_search: Optional[str] = Query(None,
                                           description="Text search in content (case-insensitive, partial match)"),
        limit: int = Query(20, ge=1, le=100),
        skip: int = Query(0, ge=0)
):
    """
    Search tests with exact matching on metadata fields and flexible text search on content.

    - **Exact match filters**: subject_code, academic_year, exam_period, test_type
    - **Text search**: text_search (searches within full_text field)
    """
    try:
        # Build exact match filters
        query_filters = {}

        if subject_code:
            query_filters["subject_code"] = subject_code  # Exact match

        if academic_year:
            query_filters["academic_year"] = academic_year  # Exact match

        if exam_period:
            query_filters["exam_period"] = exam_period  # Exact match

        if test_type:
            query_filters["test_type"] = test_type.lower()  # Exact match

        # Add text search if provided
        if text_search:
            # Option 1: MongoDB text search (word-based, ranked by relevance)
            query_filters["$text"] = {"$search": text_search}

            tests = await Test.find(query_filters).sort("-created_at").skip(skip).limit(limit).to_list()
        else:
            # Regular query with exact matches only
            tests = await Test.find(query_filters).sort("-created_at").skip(skip).limit(limit).to_list()

        print(query_filters)

        return [TestResponse.from_test(test) for test in tests]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )

@test_router.get("/all", response_model=List[TestResponse])
async def get_all_tests(
    limit: int = Query(100, ge=1, le=500, description="Maximum number of tests to return"),
    skip: int = Query(0, ge=0, description="Number of tests to skip for pagination")
):
    """
    Get all tests from the database.
    Results are sorted by creation date (newest first).
    """
    try:
        tests = await Test.find_all().sort("-created_at").skip(skip).limit(limit).to_list()
        return [TestResponse.from_test(test) for test in tests]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve tests: {str(e)}"
        )
