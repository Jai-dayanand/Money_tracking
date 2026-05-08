from pydantic import BaseModel, Field, EmailStr


class UserBase(BaseModel):
    email: EmailStr


class UserRegister(UserBase):
    password: str = Field(min_length=6)
    name: str = Field(min_length=2, max_length=100)


class UserLogin(UserBase):
    password: str


class UserRead(UserBase):
    id: str
    name: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
