import uuid

from fastapi.testclient import TestClient

from backend.app.database import SessionLocal
from backend.app.main import app
from backend.app.models.activity import ActivityHistory
from backend.app.models.user import User

client = TestClient(app)


def test_successful_user_registration():
    """Checkpoint B.1: Test valid registration creates user and returns 201."""
    unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "full_name": "Test Engineer",
        "email": unique_email,
        "password": "Password123",
        "confirm_password": "Password123",
        "age": 22,
        "gender": "Male",
        "education_level": "Undergraduate",
        "course": "Computer Science & Engineering",
    }

    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["email"] == unique_email
    assert data["full_name"] == "Test Engineer"
    assert "password_hash" not in data  # Never leak password hash

    # Direct database verification
    db = SessionLocal()
    try:
        user_in_db = db.query(User).filter(User.email == unique_email).first()
        assert user_in_db is not None
        assert user_in_db.password_hash.startswith("$2b$")  # Bcrypt signature
        assert user_in_db.password_hash != "Password123"  # Never plaintext

        # Verify activity log
        activity = (
            db.query(ActivityHistory)
            .filter(
                ActivityHistory.user_id == user_in_db.id,
                ActivityHistory.activity_type == "USER_REGISTERED",
            )
            .first()
        )
        assert activity is not None
    finally:
        db.close()


def test_duplicate_email_registration_rejected():
    """Checkpoint B.2: Test duplicate email rejection with 400 Bad Request."""
    email = f"duplicate_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "full_name": "First Registrant",
        "email": email,
        "password": "Password123",
        "confirm_password": "Password123",
        "age": 21,
        "gender": "Female",
        "education_level": "Postgraduate",
        "course": "Information Technology",
    }
    # First registration should succeed
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    # Second registration with exact same email must fail with 400
    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"].lower()


def test_invalid_password_rules_rejected():
    """Checkpoint B.3: Test password strength requirements (<8 chars or no numbers)."""
    # 1. Less than 8 characters
    res_short = client.post(
        "/api/auth/register",
        json={
            "full_name": "Short Pwd",
            "email": f"short_{uuid.uuid4().hex[:6]}@example.com",
            "password": "Pass1",
            "confirm_password": "Pass1",
            "age": 20,
            "gender": "Male",
            "education_level": "Undergraduate",
            "course": "CSE",
        },
    )
    assert res_short.status_code == 422

    # 2. No numbers
    res_no_num = client.post(
        "/api/auth/register",
        json={
            "full_name": "No Num",
            "email": f"nonum_{uuid.uuid4().hex[:6]}@example.com",
            "password": "PasswordOnly",
            "confirm_password": "PasswordOnly",
            "age": 20,
            "gender": "Male",
            "education_level": "Undergraduate",
            "course": "CSE",
        },
    )
    assert res_no_num.status_code == 422


def test_mismatched_passwords_rejected():
    """Checkpoint B.4: Test password confirmation mismatch."""
    res_mismatch = client.post(
        "/api/auth/register",
        json={
            "full_name": "Mismatch User",
            "email": f"mismatch_{uuid.uuid4().hex[:6]}@example.com",
            "password": "Password123",
            "confirm_password": "Password456",
            "age": 20,
            "gender": "Male",
            "education_level": "Undergraduate",
            "course": "CSE",
        },
    )
    assert res_mismatch.status_code == 422
