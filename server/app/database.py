from urllib.parse import quote_plus

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

from app.models.test import Test
from app.models.testuser import TestUser
from app.models.faculty import Faculty
from app.models.subject import Subject
from app.models.user import User

load_dotenv()

MONGO_USER = os.getenv("MONGO_USER")
MONGO_PASSWORD = quote_plus(os.getenv("MONGO_PASSWORD"))
MONGO_HOST = os.getenv("MONGO_HOST")
MONGODB_DB_NAME = os.getenv("MONGO_DB_NAME", "myapp")
MONGO_APP_NAME = os.getenv("MONGO_APP_NAME", "MyApp")

MONGODB_URL = f"mongodb+srv://{MONGO_USER}:{MONGO_PASSWORD}@{MONGO_HOST}/?retryWrites=true&w=majority&appName=MasterLibrarian"

client = None


async def init_db():
    global client
    try:
        client = AsyncIOMotorClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=5000
        )

        await client.admin.command('ping')
        print(f"Connected to MongoDB: {MONGODB_DB_NAME}")

        database = client[MONGODB_DB_NAME]

        await init_beanie(
            database=database,
            document_models=[
                Test,
                TestUser,
                Faculty,
                Subject,
                User,
            ]
        )

        print("Beanie initialized successfully")

    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        raise


async def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")