from fastapi import APIRouter, HTTPException, status, Body
from app.models.testuser import TestUser
from typing import List

router = APIRouter()