from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.services.auth_service import decode_access_token


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """
    Extracts JWT from the httpOnly cookie 'access_token' (or fallback Authorization header).
    Returns the authenticated User model instance or raises 401 Unauthorized.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or session expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # 1. Primary: Check httpOnly cookie
    token = request.cookies.get("access_token")

    # 2. Secondary fallback: Check Authorization Bearer header
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception

    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    return user
