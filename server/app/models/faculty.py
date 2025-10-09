from beanie import Document, Indexed
from typing import List, Annotated
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.address import Address
from app.models.module import Module


class Faculty(Document):

    name:Annotated[str, Indexed(unique=True)]
    code: Annotated[str, Indexed(unique=True)]
    description: str = ""
    address: Address
    modules: List[Module] = []

    class Settings:
        name = 'faculties'