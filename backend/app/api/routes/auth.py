from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer

from ...schemas.user import UserLogin, UserRegister, UserRead, TokenResponse
from ...services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


def get_current_user(credentials = Depends(security)) -> str:
    """Extract and verify JWT token from Authorization header"""
    token = credentials.credentials
    user_id = auth_service.verify_token(token)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    return user_id


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister) -> TokenResponse:
    print(f"[DEBUG] Register attempt with email: {payload.email}, name: {payload.name}")
    try:
        user = auth_service.create_user(payload.email, payload.name, payload.password)
        print(f"[DEBUG] User created successfully: {user.id}")
    except ValueError as e:
        print(f"[DEBUG] User creation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    token = auth_service.create_access_token(user.id)
    print(f"[DEBUG] Token created for user: {user.id}")

    return TokenResponse(access_token=token, user=user)


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin) -> TokenResponse:
    print(f"[DEBUG] Login attempt with email: {payload.email}")
    user = auth_service.authenticate_user(payload.email, payload.password)

    if not user:
        print(f"[DEBUG] Authentication failed for email: {payload.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    print(f"[DEBUG] Authentication successful for email: {payload.email}")
    token = auth_service.create_access_token(user.id)
    user_read = UserRead(id=user.id, email=user.email, name=user.name)

    return TokenResponse(access_token=token, user=user_read)


@router.get("/me", response_model=UserRead)
def get_current_user_info(user_id: str = Depends(get_current_user)) -> UserRead:
    user = auth_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user
