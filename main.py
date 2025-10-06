from urllib.parse import quote_plus
import pytesseract
from PIL import Image
from pymongo import MongoClient
from dotenv import load_dotenv
import os

from pymongo.server_api import ServerApi

if __name__ == "__main__":
    #load_dotenv()

    image = Image.open('TIKStest.jpg')

    text = pytesseract.image_to_string(image, lang='eng')  # English
    print(text)

    # username = os.getenv("MONGO_USER")
    # password = quote_plus(os.getenv("MONGO_PASSWORD"))
    #
    # uri = f"mongodb+srv://{username}:{password}@masterlibrarian.bforp68.mongodb.net/?retryWrites=true&w=majority&appName=MasterLibrarian"
    #
    # client = MongoClient(uri, server_api=ServerApi('1'))
    # # Send a ping to confirm a successful connection
    # try:
    #     client.admin.command('ping')
    #     print("Pinged your deployment. You successfully connected to MongoDB!")
    # except Exception as e:
    #     print(e)