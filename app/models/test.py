from beanie import Document, Indexed
from typing import List, Annotated
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.module import Module

class Test(Document):

    subject_code: Annotated[str, Indexed()]
    exam_period: str
    academic_year: str
    test_type: str

    full_text: str

    class Settings:
        name = "tests"
        indexes = [
            [("subject_code", 1), ("exam_date", -1)],  # Query by subject, newest first
            [("subject_code", 1), ("academic_year", 1)],  # Query by subject + year
            [("exam_period", 1), ("academic_year", 1)]
        ]