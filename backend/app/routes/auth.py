import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.deps import get_current_user
from backend.app.models.password_reset_token import PasswordResetToken
from backend.app.models.user import User
from backend.app.schemas.auth import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    ResetPasswordResponse,
    TokenResponse,
    UserResponse,
)
from backend.app.services.activity_service import log_activity
from backend.app.services.auth_service import (
    create_access_token,
    generate_reset_token,
    hash_password,
    hash_reset_token,
    verify_password,
)

logger = logging.getLogger("uvicorn")


router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user account.
    - Validates inputs (email, password strength, matching passwords).
    - Rejects duplicate emails with 400 Bad Request.
    - Hashes password with bcrypt.
    - Persists user to PostgreSQL.
    - Records an activity history log.
    """
    existing_user = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in or use another email.",
        )

    # Hash the password securely
    hashed_pwd = hash_password(payload.password)

    new_user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.lower().strip(),
        password_hash=hashed_pwd,
        age=payload.age,
        gender=payload.gender,
        education_level=payload.education_level,
        course=payload.course.strip(),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Log activity
    log_activity(
        db=db,
        user_id=new_user.id,
        activity_type="USER_REGISTERED",
        activity_description="User successfully registered account.",
    )

    return new_user


@router.post("/login", response_model=TokenResponse)
def login_user(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    Authenticate user and set secure httpOnly cookie containing JWT.
    """
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
        )

    # Generate JWT
    token = create_access_token(data={"sub": str(user.id), "email": user.email})

    # Set httpOnly cookie
    # max_age in seconds: 24h = 86400s
    max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=max_age,
        expires=max_age,
        samesite="lax",
        secure=False,  # Set to True in production HTTPS
        path="/",
    )

    # Log activity
    log_activity(
        db=db,
        user_id=user.id,
        activity_type="USER_LOGGED_IN",
        activity_description="User logged in securely.",
    )

    return TokenResponse(
        message="Login successful.", user=user, access_token=token, token_type="bearer"
    )


@router.post("/logout")
def logout_user(response: Response, request: Request, db: Session = Depends(get_db)):
    """Clear httpOnly session cookie and log logout, safe against expired tokens."""
    token = request.cookies.get("access_token")
    if token:
        try:
            from backend.app.services.auth_service import decode_access_token

            payload = decode_access_token(token)
            if payload and payload.get("sub"):
                user_id = int(payload["sub"])
                log_activity(
                    db=db,
                    user_id=user_id,
                    activity_type="USER_LOGGED_OUT",
                    activity_description="User logged out.",
                )
        except Exception:
            pass

    response.delete_cookie(key="access_token", path="/", samesite="lax")
    return {"message": "Successfully logged out."}


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Return currently authenticated user from httpOnly session cookie."""
    return current_user


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Initiate password reset flow for a user.
    - Validates email format.
    - If user exists, generates a cryptographically secure token, hashes it with SHA-256,
      and records it in the database with a 30-minute expiration.
    - In development mode, logs the reset URL to the backend console for testing.
    - Always returns a safe generic response to prevent account/email enumeration.
    """
    email_clean = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()

    if user:
        raw_token = generate_reset_token()
        token_hash = hash_reset_token(raw_token)
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.RESET_TOKEN_EXPIRE_MINUTES
        )

        reset_token_entry = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        db.add(reset_token_entry)
        db.commit()

        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
        if settings.ENVIRONMENT == "development":
            print(f"\n[DEV ONLY] Password reset URL generated:\n{reset_url}\n", flush=True)
            logger.info(f"[DEV ONLY] Password reset URL generated: {reset_url}")

    return ForgotPasswordResponse(
        message="If an account exists with this email, password reset instructions have been sent."
    )


@router.post("/reset-password", response_model=ResetPasswordResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset user password using a verified single-use reset token.
    - Validates token authenticity, expiration, and ensures it has not been used.
    - Enforces identical strong password rules (>=8 chars, >=1 letter, >=1 number).
    - Hashes new password with bcrypt.
    - Updates user password and marks token as used.
    - Records an activity history log for security auditing.
    """
    token_clean = payload.token.strip()
    token_hash = hash_reset_token(token_clean)

    reset_record = (
        db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == token_hash).first()
    )

    if not reset_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link is invalid or has expired.",
        )

    if reset_record.used_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link has already been used.",
        )

    now = datetime.now(timezone.utc)
    expires_at = reset_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now > expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link is invalid or has expired.",
        )

    user = db.query(User).filter(User.id == reset_record.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid password reset request."
        )

    # Update password
    user.password_hash = hash_password(payload.new_password)
    reset_record.used_at = now
    db.commit()

    # Log activity
    log_activity(
        db=db,
        user_id=user.id,
        activity_type="PASSWORD_RESET",
        activity_description="Password reset completed.",
    )

    return ResetPasswordResponse(
        message="Password reset successfully. Please log in with your new password."
    )
