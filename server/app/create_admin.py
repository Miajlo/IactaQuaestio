import asyncio
from app.database import init_db, close_db
from app.models.user import User
from app.routers.user_router import get_password_hash


async def create_admin():
    await init_db()

    admin_email = "admin@gmail.com"  # Change this
    admin_password = "admin"  # Change this!

    # Check if admin already exists
    existing = await User.find_one(User.email == admin_email)
    if existing:
        print(f"User {admin_email} already exists!")
        if existing.is_admin:
            print("They are already an admin.")
        else:
            existing.is_admin = True
            await existing.save()
            print(f"Made {admin_email} an admin!")
        await close_db()
        return

    # Create admin user
    admin = User(
        email=admin_email,
        hashed_password=get_password_hash(admin_password),
        is_admin=True,
        is_active=True
    )

    await admin.insert()
    print(f"✅ Admin user created successfully!")
    print(f"Email: {admin_email}")
    print(f"Password: {admin_password}")

    await close_db()


if __name__ == "__main__":
    asyncio.run(create_admin())