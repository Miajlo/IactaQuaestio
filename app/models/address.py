from beanie import Document, Indexed
from typing import List, Annotated
from datetime import datetime
from pydantic import BaseModel, Field


class Address(BaseModel):
    street_name: str
    street_number: int
    city: str
    postal_code: str