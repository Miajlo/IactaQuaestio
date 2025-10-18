from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, status, Body, Form, File, UploadFile,Query

from app.models.subject import Subject
from app.models.test import Test
from app.models.testuser import TestUser
from typing import List, Optional

subject_router = APIRouter()

@subject_router.post("/", response_model=Subject, status_code=status.HTTP_201_CREATED)
async def create_subject(subject: Subject):
    """Create a new subject"""
    existing = await Subject.find_one(Subject.code == subject.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subject with code {subject.code} already exists"
        )
    await subject.insert()
    return subject


@subject_router.get("/", response_model=List[Subject])
async def get_all_subjects(
        faculty_code: Optional[str] = Query(None),
        module_code: Optional[str] = Query(None),
        year: Optional[int] = Query(None),
        semester: Optional[int] = Query(None),
        mandatory: Optional[bool] = Query(None)
):
    """Get all subjects with optional filters"""
    query = {}

    if faculty_code:
        query["faculty_code"] = faculty_code
    if module_code:
        query["module_code"] = module_code
    if year:
        query["year"] = year
    if semester:
        query["semester"] = semester
    if mandatory is not None:
        query["mandatory"] = mandatory

    subjects = await Subject.find(query).to_list()
    return subjects


@subject_router.get("/{subject_id}", response_model=Subject)
async def get_subject(subject_id: PydanticObjectId):
    """Get a subject by ID"""
    subject = await Subject.get(subject_id)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subject with ID {subject_id} not found"
        )
    return subject


@subject_router.get("/code/{code}", response_model=Subject)
async def get_subject_by_code(code: str):
    """Get a subject by code"""
    subject = await Subject.find_one(Subject.code == code)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subject with code {code} not found"
        )
    return subject


@subject_router.put("/{subject_id}", response_model=Subject)
async def update_subject(subject_id: PydanticObjectId, subject_data: Subject):
    """Replace entire subject (not partial update)"""
    subject = await Subject.get(subject_id)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subject with ID {subject_id} not found"
        )

    # Check if code is being changed and if new code already exists
    if subject_data.code != subject.code:
        existing = await Subject.find_one(Subject.code == subject_data.code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Subject with code {subject_data.code} already exists"
            )

    # Replace all fields
    subject_data.id = subject_id
    await subject_data.replace()
    return subject_data


@subject_router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(subject_id: PydanticObjectId):
    """Delete a subject"""
    subject = await Subject.get(subject_id)
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subject with ID {subject_id} not found"
        )
    await subject.delete()
    return None


@subject_router.get("/faculty/{faculty_code}/year/{year}", response_model=List[Subject])
async def get_subjects_by_faculty_and_year(faculty_code: str, year: int):
    """Get subjects by faculty code and year (optimized with compound index)"""
    subjects = await Subject.find(
        Subject.faculty_code == faculty_code,
        Subject.year == year
    ).to_list()
    return subjects


@subject_router.get("/module/{module_code}/year/{year}", response_model=List[Subject])
async def get_subjects_by_module_and_year(module_code: str, year: int):
    """Get subjects by module code and year (optimized with compound index)"""
    subjects = await Subject.find(
        Subject.module_code == module_code,
        Subject.year == year
    ).to_list()
    return subjects