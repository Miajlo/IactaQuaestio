# from .users import router
from .test_router import test_router
from .faculty_router import faculty_router
# Export all models for easy imports
__all__ = ["test_router", "faculty_router"]