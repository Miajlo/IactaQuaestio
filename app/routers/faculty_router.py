from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from beanie import PydanticObjectId

from app.models import Faculty, Module  # Adjust import path as needed

faculty_router = APIRouter()


@faculty_router.post("/", response_model=Faculty, status_code=status.HTTP_201_CREATED)
async def create_faculty(faculty: Faculty):
    """Create a new faculty"""
    try:
        await faculty.insert()
        return faculty
    except Exception as e:
        if "duplicate key" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Faculty with this name or code already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating faculty: {str(e)}"
        )


@faculty_router.get("/", response_model=List[Faculty])
async def list_faculties(
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000),
        name: Optional[str] = None,
        code: Optional[str] = None
):
    """List all faculties with optional filtering and pagination"""
    query = {}

    if name:
        query["name"] = {"$regex": name, "$options": "i"}  # Case-insensitive search
    if code:
        query["code"] = {"$regex": code, "$options": "i"}

    faculties = await Faculty.find(query).skip(skip).limit(limit).to_list()
    return faculties


@faculty_router.get("/search", response_model=List[Faculty])
async def search_faculties(
        q: str = Query(..., min_length=1, description="Search query"),
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=1000)
):
    """Search faculties by name, code, or description"""
    query = {
        "$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"code": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}}
        ]
    }

    faculties = await Faculty.find(query).skip(skip).limit(limit).to_list()
    return faculties


@faculty_router.get("/{faculty_id}", response_model=Faculty)
async def get_faculty(faculty_id: PydanticObjectId):
    """Get a specific faculty by ID"""
    faculty = await Faculty.get(faculty_id)
    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Faculty with id {faculty_id} not found"
        )
    return faculty


@faculty_router.put("/{faculty_id}", response_model=Faculty)
async def update_faculty(faculty_id: PydanticObjectId, faculty_data: Faculty):
    """Replace a faculty entirely"""
    faculty = await Faculty.get(faculty_id)
    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Faculty with id {faculty_id} not found"
        )

    try:
        faculty.name = faculty_data.name
        faculty.code = faculty_data.code
        faculty.description = faculty_data.description
        faculty.address = faculty_data.address
        faculty.modules = faculty_data.modules
        await faculty.save()
        return faculty
    except Exception as e:
        if "duplicate key" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Faculty with this name or code already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating faculty: {str(e)}"
        )


@faculty_router.delete("/{faculty_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faculty(faculty_id: PydanticObjectId):
    """Delete a faculty"""
    faculty = await Faculty.get(faculty_id)
    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Faculty with id {faculty_id} not found"
        )

    await faculty.delete()
    return None


# Additional endpoints for managing modules within a faculty

@faculty_router.post("/{faculty_id}/modules", response_model=Faculty)
async def add_module_to_faculty(faculty_id: PydanticObjectId, module: Module):
    """Add a module to a faculty"""
    faculty = await Faculty.get(faculty_id)
    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Faculty with id {faculty_id} not found"
        )

    faculty.modules.append(module)
    await faculty.save()
    return faculty


@faculty_router.delete("/{faculty_id}/modules/{module_code}", response_model=Faculty)
async def remove_module_from_faculty(faculty_id: PydanticObjectId, module_code: str):
    """Remove a module from a faculty by module code"""
    faculty = await Faculty.get(faculty_id)
    if not faculty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Faculty with id {faculty_id} not found"
        )

    faculty.modules = [m for m in faculty.modules if m.code != module_code]
    await faculty.save()
    return faculty