# from fastapi import APIRouter, HTTPException, status, Body
# from app.models.testuser import TestUser
# from typing import List
#
# router = APIRouter()
#
#
# @router.post("/", status_code=status.HTTP_201_CREATED)
# async def create_user(email: str = Body(...), username: str = Body(...), is_active: bool = Body(True)):
#     """Create a new user"""
#     # Check if user already exists
#     existing_user = await TestUser.find_one(TestUser.email == email)
#     if existing_user:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="User with this email already exists"
#         )
#
#     # Create and insert the user
#     user = TestUser(
#         email=email,
#         username=username,
#         is_active=is_active
#     )
#     await user.insert()
#     return user
#
#
# @router.get("/", response_model=List[TestUser])
# async def list_users():
#     """Get all users"""
#     users = await TestUser.find_all().to_list()
#     return users
#
#
# @router.get("/{user_id}")
# async def get_user(user_id: str):
#     """Get a specific user by ID"""
#     user = await TestUser.get(user_id)
#
#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="User not found"
#         )
#
#     return user
#
#
# @router.put("/{user_id}")
# async def update_user(
#     user_id: str,
#     email: str = Body(None),
#     username: str = Body(None),
#     is_active: bool = Body(None)
# ):
#     """Update a user"""
#     user = await TestUser.get(user_id)
#
#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="User not found"
#         )
#
#     # Update only provided fields
#     update_data = {}
#     if email is not None:
#         update_data["email"] = email
#     if username is not None:
#         update_data["username"] = username
#     if is_active is not None:
#         update_data["is_active"] = is_active
#
#     if update_data:
#         await user.set(update_data)
#
#     return user
#
#
# @router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
# async def delete_user(user_id: str):
#     """Delete a user"""
#     user = await TestUser.get(user_id)
#
#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="User not found"
#         )
#
#     await user.delete()
#     return None