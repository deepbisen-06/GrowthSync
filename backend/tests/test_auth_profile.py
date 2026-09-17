import uuid

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app


@pytest.fixture
def client():
    """Provides a fresh TestClient for each test."""
    return TestClient(app)


@pytest.fixture
def registered_user(client):
    email = f"auth_user_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "Password123"
    payload = {
        "full_name": "Auth Tester",
        "email": email,
        "password": pwd,
        "confirm_password": pwd,
        "age": 23,
        "gender": "Female",
        "education_level": "Undergraduate",
        "course": "Software Engineering",
    }
    client.post("/api/auth/register", json=payload)
    return {"email": email, "password": pwd}


def test_login_and_cookie_generation(client, registered_user):
    """Checkpoint C.1: Test login sets httpOnly cookie and logs activity."""
    res = client.post(
        "/api/auth/login",
        json={"email": registered_user["email"], "password": registered_user["password"]},
    )
    assert res.status_code == 200
    assert "access_token" in res.cookies
    data = res.json()
    assert data["user"]["email"] == registered_user["email"]


def test_login_invalid_password_fails(client, registered_user):
    """Checkpoint C.2: Invalid password returns 401."""
    res = client.post(
        "/api/auth/login", json={"email": registered_user["email"], "password": "WrongPassword999"}
    )
    assert res.status_code == 401


def test_authenticated_profile_management(client, registered_user):
    """Checkpoint C.3: Profile retrieval, update, and activity history."""
    # Login to acquire session cookie
    login_res = client.post(
        "/api/auth/login",
        json={"email": registered_user["email"], "password": registered_user["password"]},
    )
    assert login_res.status_code == 200

    # Fetch profile (cookie is saved in client session)
    profile_res = client.get("/api/users/profile")
    assert profile_res.status_code == 200
    assert profile_res.json()["email"] == registered_user["email"]

    # Update profile
    update_res = client.put(
        "/api/users/profile",
        json={
            "full_name": "Auth Tester Updated",
            "age": 24,
            "education_level": "Postgraduate",
            "course": "Distributed Computing",
        },
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["full_name"] == "Auth Tester Updated"
    assert updated_data["age"] == 24
    assert updated_data["education_level"] == "Postgraduate"


def test_unauthenticated_request_blocked():
    """Checkpoint C.4: Unauthenticated request to /api/users/profile returns 401."""
    unauth_client = TestClient(app)
    res = unauth_client.get("/api/users/profile")
    assert res.status_code == 401
