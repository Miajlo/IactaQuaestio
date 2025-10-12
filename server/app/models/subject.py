from beanie import Document, Indexed
from typing import List, Annotated
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.module import Module

class Subject(Document):
    name: str
    code: Annotated[str, Indexed(unique=True)]
    module_code: str
    faculty_code: str

    year: Annotated[int, Indexed(unique=True)]
    semester: int
    espb: int
    mandatory: bool
    description: str=""

    class Settings:
        name = "subjects"
        indexes = [
            [("faculty_code", 1), ("year", 1)],  # Query by faculty + year
            [("module_code", 1), ("year", 1)] # Query by module + year
        ]
