import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from backend.app.database import SessionLocal
from backend.app.main import app
from backend.app.models.activity import ActivityHistory
from backend.app.models.password_reset_token import PasswordResetToken
from backend.app.models.user import User
from backend.app.services.auth_service import hash_reset_token

client = TestClient(app)


@pytest.fixture
def registered_user():
    email = f"reset_test_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "OriginalPassword123"
    payload = {
        "full_name": "Reset Test User",
        "email": email,
        "password": pwd,
        "confirm_password": pwd,
        "age": 25,
        "gender": "Non-binary",
        "education_level": "Undergraduate",
        "course": "Computer Science",
    }
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 201
    return {"email": email, "password": pwd}


def test_forgot_password_registered_email(registered_user):
    """1. Forgot password request with a registered email returns 200 generic message."""
    res = client.post("/api/auth/forgot-password", json={"email": registered_user["email"]})
    assert res.status_code == 200
    assert "password reset instructions have been sent" in res.json()["message"]

    # Verify a token was generated in database
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == registered_user["email"]).first()
        token_entry = (
            db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user.id).first()
        )
        assert token_entry is not None
        assert token_entry.used_at is None
        assert token_entry.token_hash is not None
    finally:
        db.close()


def test_forgot_password_unregistered_email():
    """2. Forgot password request with an unregistered email returns identical 200 generic response (no leakage)."""
    fake_email = f"nonexistent_{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/api/auth/forgot-password", json={"email": fake_email})
    assert res.status_code == 200
    assert "password reset instructions have been sent" in res.json()["message"]


def test_reset_password_valid_token(registered_user):
    """3. Reset password with a valid token succeeds."""
    db = SessionLocal()
    known_raw = f"valid_test_token_{uuid.uuid4().hex}"
    try:
        user = db.query(User).filter(User.email == registered_user["email"]).first()
        token_hash = hash_reset_token(known_raw)
        db.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=token_hash,
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
            )
        )
        db.commit()
    finally:
        db.close()

    new_pwd = "BrandNewPassword123"
    res = client.post(
        "/api/auth/reset-password",
        json={"token": known_raw, "new_password": new_pwd, "confirm_password": new_pwd},
    )
    assert res.status_code == 200, res.text
    assert "Password reset successfully" in res.json()["message"]


def test_reset_password_invalid_token():
    """4. Reset password with invalid token returns 400."""
    res = client.post(
        "/api/auth/reset-password",
        json={
            "token": f"completely_invalid_random_token_{uuid.uuid4().hex}",
            "new_password": "NewPassword123",
            "confirm_password": "NewPassword123",
        },
    )
    assert res.status_code == 400
    assert "invalid or has expired" in res.json()["detail"]


def test_reset_password_expired_token(registered_user):
    """5. Reset password with expired token returns 400."""
    db = SessionLocal()
    expired_token_raw = f"expired_raw_token_{uuid.uuid4().hex}"
    try:
        user = db.query(User).filter(User.email == registered_user["email"]).first()
        db.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=hash_reset_token(expired_token_raw),
                expires_at=datetime.now(timezone.utc) - timedelta(minutes=10),  # Expired
            )
        )
        db.commit()
    finally:
        db.close()

    res = client.post(
        "/api/auth/reset-password",
        json={
            "token": expired_token_raw,
            "new_password": "NewPassword123",
            "confirm_password": "NewPassword123",
        },
    )
    assert res.status_code == 400
    assert "invalid or has expired" in res.json()["detail"]


def test_reset_password_already_used_token(registered_user):
    """6. Reset password with already-used token returns 400."""
    db = SessionLocal()
    used_token_raw = f"used_raw_token_{uuid.uuid4().hex}"
    try:
        user = db.query(User).filter(User.email == registered_user["email"]).first()
        db.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=hash_reset_token(used_token_raw),
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
                used_at=datetime.now(timezone.utc) - timedelta(minutes=5),
            )
        )
        db.commit()
    finally:
        db.close()

    res = client.post(
        "/api/auth/reset-password",
        json={
            "token": used_token_raw,
            "new_password": "NewPassword123",
            "confirm_password": "NewPassword123",
        },
    )
    assert res.status_code == 400
    assert "already been used" in res.json()["detail"]


def test_reset_password_weak_password():
    """7. Password validation failure (< 8 chars, or only letters, or only numbers)."""
    # Short
    res1 = client.post(
        "/api/auth/reset-password",
        json={"token": "any_token", "new_password": "Pass1", "confirm_password": "Pass1"},
    )
    assert res1.status_code == 422

    # No number
    res2 = client.post(
        "/api/auth/reset-password",
        json={
            "token": "any_token",
            "new_password": "PasswordOnly",
            "confirm_password": "PasswordOnly",
        },
    )
    assert res2.status_code == 422

    # No letter
    res3 = client.post(
        "/api/auth/reset-password",
        json={"token": "any_token", "new_password": "1234567890", "confirm_password": "1234567890"},
    )
    assert res3.status_code == 422


def test_reset_password_mismatched_passwords():
    """8. Mismatched new password and confirm password returns 422."""
    res = client.post(
        "/api/auth/reset-password",
        json={
            "token": "any_token",
            "new_password": "Password123",
            "confirm_password": "DifferentPassword123",
        },
    )
    assert res.status_code == 422
    assert "do not match" in res.text


def test_end_to_end_password_lifecycle(registered_user):
    """
    9. Verify old password no longer works after successful reset.
    10. Verify new password works after successful reset.
    11. Verify reset token cannot be reused.
    12. Verify ActivityHistory logs the password reset.
    """
    email = registered_user["email"]
    old_pwd = registered_user["password"]
    new_pwd = "UpdatedSecretPass2026"

    # 1. Generate token
    db = SessionLocal()
    token_raw = f"e2e_token_{uuid.uuid4().hex}"
    try:
        user = db.query(User).filter(User.email == email).first()
        db.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=hash_reset_token(token_raw),
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
            )
        )
        db.commit()
    finally:
        db.close()

    # 2. Reset Password
    reset_res = client.post(
        "/api/auth/reset-password",
        json={"token": token_raw, "new_password": new_pwd, "confirm_password": new_pwd},
    )
    assert reset_res.status_code == 200

    # 3. Old password fails
    old_login_res = client.post("/api/auth/login", json={"email": email, "password": old_pwd})
    assert old_login_res.status_code == 401

    # 4. New password succeeds
    new_login_res = client.post("/api/auth/login", json={"email": email, "password": new_pwd})
    assert new_login_res.status_code == 200
    assert "access_token" in new_login_res.cookies

    # 5. Token reuse fails
    reuse_res = client.post(
        "/api/auth/reset-password",
        json={
            "token": token_raw,
            "new_password": "AnotherPassword456",
            "confirm_password": "AnotherPassword456",
        },
    )
    assert reuse_res.status_code == 400
    assert "already been used" in reuse_res.json()["detail"]

    # 6. Verify activity log
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        activity = (
            db.query(ActivityHistory)
            .filter(
                ActivityHistory.user_id == user.id,
                ActivityHistory.activity_type == "PASSWORD_RESET",
            )
            .first()
        )
        assert activity is not None
        assert activity.activity_description == "Password reset completed."
    finally:
        db.close()
