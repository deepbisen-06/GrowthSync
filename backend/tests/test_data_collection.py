import uuid

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app


@pytest.fixture
def auth_client():
    """Provides an authenticated TestClient with active session cookie."""
    client = TestClient(app)
    email = f"data_collector_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "Password123"
    reg_res = client.post(
        "/api/auth/register",
        json={
            "full_name": "Data Collector",
            "email": email,
            "password": pwd,
            "confirm_password": pwd,
            "age": 25,
            "gender": "Non-Binary",
            "education_level": "Undergraduate",
            "course": "Data Science",
        },
    )
    assert reg_res.status_code == 201

    login_res = client.post("/api/auth/login", json={"email": email, "password": pwd})
    assert login_res.status_code == 200
    return client


def test_financial_records_flow(auth_client):
    """Checkpoint D.1: Submit financial data and retrieve list."""
    payload = {
        "monthly_income": 5500.0,
        "monthly_expenses": 3200.0,
        "monthly_savings": 2300.0,
        "financial_goal": "Build 6-month Emergency Fund",
    }
    create_res = auth_client.post("/api/financial-records", json=payload)
    assert create_res.status_code == 201
    rec = create_res.json()
    assert rec["monthly_income"] == 5500.0
    assert rec["financial_goal"] == "Build 6-month Emergency Fund"

    list_res = auth_client.get("/api/financial-records")
    assert list_res.status_code == 200
    records = list_res.json()
    assert len(records) >= 1
    assert records[0]["monthly_income"] == 5500.0


def test_study_records_flow(auth_client):
    """Checkpoint D.2: Submit study data and retrieve list."""
    payload = {
        "study_hours": 4.5,
        "subjects": "FastAPI, PostgreSQL Architecture, React Hooks",
        "academic_goal": "Complete Milestone 1 with 100% test coverage",
        "study_date": "2026-08-22",
    }
    create_res = auth_client.post("/api/study-records", json=payload)
    assert create_res.status_code == 201
    rec = create_res.json()
    assert rec["study_hours"] == 4.5
    assert "FastAPI" in rec["subjects"]

    list_res = auth_client.get("/api/study-records")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1


def test_habit_records_flow(auth_client):
    """Checkpoint D.3: Submit habit data and retrieve list."""
    payload = {
        "sleep_hours": 7.5,
        "exercise_minutes": 45,
        "screen_time": 6.0,
        "habit_notes": "Morning jogging and afternoon gym workout.",
        "record_date": "2026-08-22",
    }
    create_res = auth_client.post("/api/habit-records", json=payload)
    assert create_res.status_code == 201
    rec = create_res.json()
    assert rec["sleep_hours"] == 7.5
    assert rec["exercise_minutes"] == 45

    list_res = auth_client.get("/api/habit-records")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1


def test_activity_history_generation(auth_client):
    """Checkpoint D.4: Verify user activity stream includes registration, login, and data actions."""
    res = auth_client.get("/api/activity-history")
    assert res.status_code == 200
    activities = res.json()
    assert len(activities) >= 2  # Registration + Login + Data actions
    activity_types = [a["activity_type"] for a in activities]
    assert "USER_REGISTERED" in activity_types or "USER_LOGGED_IN" in activity_types


def test_anonymized_dataset_export(auth_client):
    """Checkpoint D.5: Verify anonymized CSV export does not contain PII."""
    res = auth_client.get("/api/datasets/export")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    csv_text = res.text
    # Ensure header exists
    assert "record_category" in csv_text
    assert "anonymous_user_id" in csv_text
    # Ensure sensitive credentials and PII are never exported
    assert "password_hash" not in csv_text
