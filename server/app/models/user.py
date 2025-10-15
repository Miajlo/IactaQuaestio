from beanie import Document, Indexed
from typing import Annotated
from datetime import datetime
from pydantic import Field, EmailStr

class User(Document):
    email: Annotated[EmailStr, Indexed(unique=True)]
    hashed_password: str
    is_admin: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

    class Settings:
        name = "users"