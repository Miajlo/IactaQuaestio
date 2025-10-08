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
            [("subject_code", 1), ("academic_year", 1)],
            [("subject_code", 1), ("exam_period", 1)],
            [("exam_period", 1), ("academic_year", 1)],
            [("created_at", -1)],

            # Text index (use "text" as the value - this is MongoDB's special syntax)
            [("full_text", "text")]
        ]