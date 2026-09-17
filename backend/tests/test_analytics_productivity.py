import uuid
from datetime import date, timedelta

from fastapi.testclient import TestClient

from backend.app.main import app


def create_user(client):
    email = f"prod_user_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "Password123"
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Productivity Tester",
            "email": email,
            "password": pwd,
            "confirm_password": pwd,
            "age": 21,
            "gender": "Female",
            "education_level": "Undergraduate",
            "course": "Engineering",
        },
    )
    client.post("/api/auth/login", json={"email": email, "password": pwd})
    return email


def test_productivity_empty_state():
    client = TestClient(app)
    create_user(client)

    res = client.get("/api/analytics/productivity")
    assert res.status_code == 200
    data = res.json()
    assert data["has_sufficient_data"] is False
    assert data["productivity_score"] == 0


def test_productivity_score_calculation():
    client = TestClient(app)
    create_user(client)

    today = date.today()
    # Log 8 days of study sessions and habits
    for i in range(8):
        d_str = str(today - timedelta(days=7 - i))
        client.post(
            "/api/study-records",
            json={
                "study_hours": 3.0,
                "subjects": "Calculus, Physics",
                "academic_goal": "A Grade",
                "study_date": d_str,
            },
        )
        client.post(
            "/api/habit-records",
            json={
                "sleep_hours": 8.0,
                "exercise_minutes": 35,
                "screen_time": 3.5,
                "habit_notes": "Focused routine",
                "record_date": d_str,
            },
        )

    res = client.get("/api/analytics/productivity")
    assert res.status_code == 200
    data = res.json()
    assert data["has_sufficient_data"] is True
    score = data["productivity_score"]
    assert 0 <= score <= 100
    assert score >= 75  # Optimal inputs should give high score

    breakdown = data["breakdown"]
    assert "study" in breakdown
    assert "sleep" in breakdown
    assert "exercise" in breakdown
    assert "screen_time" in breakdown
    assert 0 <= breakdown["study"] <= 100
    assert 0 <= breakdown["sleep"] <= 100

    assert data["trend"] in ["improving", "stable", "declining"]
    assert 0 <= data["predicted_future_score"] <= 100
