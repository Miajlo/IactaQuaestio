from beanie import Document, Indexed
from typing import List, Annotated
from datetime import datetime
from pydantic import BaseModel, Field

class Module(BaseModel):

    name: str
    code: str
    description: str = ""