"""
Authentication API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta

from app.core.database import get_db
from app.schemas.user import UserCreate, UserLogin, AuthResponse, TokenResponse, UserResponse
from app.services.auth_service import AuthService
from app.core.config import settings

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user."""
    # Check if user exists
    from sqlalchemy import select
    from app.models.user import User
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create user
    user = await AuthService.create_user(db, user_data)
    
    # Create token
    token_data = {"sub": str(user.id), "email": user.email, "role": user.role.value}
    token = AuthService.create_access_token(token_data)
    
    # Build response
    user_response = UserResponse.model_validate(user)
    
    return AuthResponse(
        success=True,
        message="User registered successfully",
        data=TokenResponse(
            access_token=token,
            expires_in=settings.JWT_EXPIRES_IN,
            user=user_response,
        ),
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """Login user."""
    user = await AuthService.authenticate_user(db, credentials.email, credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    # Create token
    token_data = {"sub": str(user.id), "email": user.email, "role": user.role.value}
    token = AuthService.create_access_token(token_data)
    
    user_response = UserResponse.model_validate(user)
    
    return AuthResponse(
        success=True,
        message="Login successful",
        data=TokenResponse(
            access_token=token,
            expires_in=settings.JWT_EXPIRES_IN,
            user=user_response,
        ),
    )


@router.post("/logout")
async def logout():
    """Logout user (client-side token invalidation)."""
    return {"success": True, "message": "Logged out successfully"}