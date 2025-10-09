from urllib.parse import quote_plus

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

from app.models.test import Test
from app.models.testuser import TestUser

# Load environment variables
load_dotenv()

# MongoDB settings
MONGO_USER = os.getenv("MONGO_USER")
MONGO_PASSWORD = quote_plus(os.getenv("MONGO_PASSWORD"))
MONGO_HOST = os.getenv("MONGO_HOST")
MONGODB_DB_NAME = os.getenv("MONGO_DB_NAME", "myapp")
MONGO_APP_NAME = os.getenv("MONGO_APP_NAME", "MyApp")

# Build connection string
MONGODB_URL = f"mongodb+srv://{MONGO_USER}:{MONGO_PASSWORD}@{MONGO_HOST}/?retryWrites=true&w=majority&appName=MasterLibrarian"

# Global client variable
client = None


async def init_db():
    """Initialize database connection and Beanie ODM"""
    global client
    try:
        # Create Motor client
        client = AsyncIOMotorClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=5000
        )

        # Test the connection
        await client.admin.command('ping')
        print(f"Connected to MongoDB: {MONGODB_DB_NAME}")

        # Get database instance
        database = client[MONGODB_DB_NAME]

        # Initialize beanie with your models
        await init_beanie(
            database=database,
            document_models=[Test]
        )

        print("Beanie initialized successfully")

    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        raise


async def close_db():
    """Close database connection"""
    global client
    if client:
        client.close()
        print("MongoDB connection closed")