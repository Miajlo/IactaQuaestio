from fastapi import APIRouter, HTTPException, status, Body, Form, File, UploadFile, Query, Response
from app.models.test import Test
from app.models.testuser import TestUser
from typing import List, Optional
from bson import Binary, ObjectId
from pydantic import BaseModel
from bson.errors import InvalidId
from processing.text_extraction import extract_text_structured, get_text_from_bytes, process_image_from_array, safe_process_image, \
    extract_questions_with_groups

test_router = APIRouter()


from fastapi import UploadFile, File, Form, HTTPException, status
import asyncio
from difflib import SequenceMatcher

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

def similarity_ratio(str1: str, str2: str) -> float:
    """Calculate similarity between two strings (0 to 1)"""
    return SequenceMatcher(None, str1.lower().strip(), str2.lower().strip()).ratio()


def extract_questions_from_text(full_text: str) -> List[str]:
    """Extract individual questions from full_text using same logic as frontend"""
    if not full_text:
        return []

    # Find first question (with or without parenthesis)
    first_question_match = None
    start_index = 0
    has_parenthesis = True

    # Try finding "1. (" pattern
    import re
    match = re.search(r'\n\s*1\.\s*\(', full_text)
    if match:
        start_index = full_text.index(match.group(0))
    else:
        # Try finding "1. " pattern without parenthesis
        match = re.search(r'^\s*1\.\s+', full_text, re.MULTILINE)
        if not match:
            return []
        start_index = full_text.index(match.group(0))
        has_parenthesis = False

    cleaned_text = full_text[start_index:].strip()

    # Split by question numbers
    if has_parenthesis:
        question_parts = re.split(r'\n\s*(?=\d+\.\s*\()', cleaned_text)
    else:
        question_parts = re.split(r'\n\s*(?=\d+\.\s+)', cleaned_text)

    question_parts = [q.strip() for q in question_parts if q.strip()]

    # Remove question numbers and clean up
    questions = []
    for q in question_parts:
        # Remove number prefix like "1. " or "1. ("
        without_number = re.sub(r'^\d+\.\s*', '', q)
        # Join lines and clean
        cleaned = ' '.join([line.strip() for line in without_number.split('\n') if line.strip()])
        if cleaned:
            questions.append(cleaned)

    return questions


class QuestionFrequency(BaseModel):
    question: str
    count: int
    test_ids: List[str]
    exam_periods: List[str]


class QuestionAnalysisResponse(BaseModel):
    subject_code: str
    total_tests: int
    total_questions: int
    unique_questions: int
    questions: List[QuestionFrequency]


@test_router.get("/analyze/{subject_code}", response_model=QuestionAnalysisResponse)
async def analyze_question_frequency(
        subject_code: str,
        similarity_threshold: float = Query(0.85, ge=0.0, le=1.0,
                                            description="Similarity threshold for matching questions (0.85 = 85% similar)")
):
    """
    Analyze question frequency for a specific subject.
    Returns statistics about how many times each question appeared across different tests.

    - **subject_code**: The subject code to analyze
    - **similarity_threshold**: Questions with similarity above this threshold are considered the same (default 0.85)
    """
    try:
        # Get all tests for this subject
        tests = await Test.find(Test.subject_code == subject_code).to_list()

        if not tests:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No tests found for subject code: {subject_code}"
            )

        # Extract all questions from all tests
        all_questions = []
        for test in tests:
            questions = extract_questions_from_text(test.full_text)
            for q in questions:
                all_questions.append({
                    'text': q,
                    'test_id': str(test.id),
                    'exam_period': test.exam_period
                })

        # Group similar questions
        question_groups = []
        processed = set()

        for i, q1 in enumerate(all_questions):
            if i in processed:
                continue

            # Start a new group
            group = {
                'question': q1['text'],
                'count': 1,
                'test_ids': [q1['test_id']],
                'exam_periods': [q1['exam_period']]
            }
            processed.add(i)

            # Find similar questions
            for j, q2 in enumerate(all_questions):
                if j <= i or j in processed:
                    continue

                # Check similarity
                sim = similarity_ratio(q1['text'], q2['text'])
                if sim >= similarity_threshold:
                    group['count'] += 1
                    group['test_ids'].append(q2['test_id'])
                    group['exam_periods'].append(q2['exam_period'])
                    processed.add(j)

            question_groups.append(group)

        # Sort by frequency (most common first)
        question_groups.sort(key=lambda x: x['count'], reverse=True)

        # Convert to response model
        questions_freq = [
            QuestionFrequency(
                question=g['question'],
                count=g['count'],
                test_ids=g['test_ids'],
                exam_periods=list(set(g['exam_periods']))  # Remove duplicates
            )
            for g in question_groups
        ]

        return QuestionAnalysisResponse(
            subject_code=subject_code,
            total_tests=len(tests),
            total_questions=len(all_questions),
            unique_questions=len(question_groups),
            questions=questions_freq
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )

@test_router.delete("/{test_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test(test_id: str):
    try:
        try:
            obj_id = ObjectId(test_id)
        except (InvalidId, Exception):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid test ID format: {test_id}"
            )

        test = await Test.get(obj_id)

        if not test:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Test with ID {test_id} not found"
            )

        await test.delete()

        return None

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete test: {str(e)}"
        )

@test_router.get("/{test_id}/file")
async def get_test_file(test_id: str):
    try:
        try:
            obj_id = ObjectId(test_id)
        except (InvalidId, Exception) as e:
            print(str(e))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid test ID format: {test_id}"
            )

        test = await Test.get(obj_id)

        if not test:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Test with ID {test_id} not found"
            )

        if not test.full_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No file found for test with ID {test_id}"
            )

        mimetype = {
            "pdf": "application/pdf",
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "tiff": "image/tiff",
            "bmp": "image/bmp"
        }

        content_type = mimetype.get(
            test.file_extension.lower() if test.file_extension else "pdf",
            "application/octet-stream"
        )

        return Response(
            content=bytes(test.full_file),
            media_type=content_type,
            headers={
                "Content-Disposition": f'inline; filename="test_{test_id}.{test.file_extension or "pdf"}"'
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve file: {str(e)}"
        )
        