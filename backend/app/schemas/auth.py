import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

# Password Rule: Min 8 chars, >= 1 letter, >= 1 number
PASSWORD_REGEX = re.compile(r"^(?=.*[A-Za-z])(?=.*\d).{8,}$")


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100, description="Full Name of the user")
    email: EmailStr = Field(..., description="Valid Email Address")
    password: str = Field(
        ..., min_length=8, description="Password (min 8 chars, 1 letter, 1 number)"
    )
    confirm_password: str = Field(..., min_length=8, description="Password Confirmation")
    age: int = Field(..., ge=13, le=120, description="User age (13-120)")
    gender: str = Field(
        ..., min_length=1, max_length=50, description="Gender or 'Prefer not to say'"
    )
    education_level: str = Field(..., min_length=2, max_length=100, description="Education Level")
    course: str = Field(..., min_length=2, max_length=150, description="Course / Branch")

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not PASSWORD_REGEX.match(v):
            raise ValueError(
                "Password must be at least 8 characters long and contain at least 1 letter and 1 number."
            )
        return v

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Password and Confirm Password do not match.")
        return self


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered Email")
    password: str = Field(..., min_length=1, description="Password")


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    age: int
    gender: str
    education_level: str
    course: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    message: str
    user: UserResponse
    access_token: Optional[str] = None
    token_type: Optional[str] = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered Email Address")


class ForgotPasswordResponse(BaseModel):
    message: str


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1, description="Password Reset Token")
    new_password: str = Field(
        ..., min_length=8, description="New Password (min 8 chars, 1 letter, 1 number)"
    )
    confirm_password: str = Field(..., min_length=8, description="Confirm New Password")

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not PASSWORD_REGEX.match(v):
            raise ValueError(
                "Password must be at least 8 characters long and contain at least 1 letter and 1 number."
            )
        return v

    @model_validator(mode="after")
    def check_passwords_match(self):
        if self.new_password != self.confirm_password:
            raise ValueError("Password and Confirm Password do not match.")
        return self


class ResetPasswordResponse(BaseModel):
    message: str
