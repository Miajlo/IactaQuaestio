from beanie import Document, Indexed
from datetime import datetime
from typing import Annotated
from pydantic import Field

class TestUser(Document):
    email: Annotated[str, Indexed(unique=True)]
    username: str
    created_at: datetime = Field(default_factory=datetime.utcnow)  # Fixed
    is_active: bool = True

    class Settings:
        name = "test_users"