import uuid
from datetime import date, timedelta

from fastapi.testclient import TestClient

from backend.app.main import app


def create_user(client):
    email = f"habit_user_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "Password123"
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Habit Risk Tester",
            "email": email,
            "password": pwd,
            "confirm_password": pwd,
            "age": 23,
            "gender": "Male",
            "education_level": "Undergraduate",
            "course": "Computer Science",
        },
    )
    client.post("/api/auth/login", json={"email": email, "password": pwd})
    return email


def test_best_study_day_and_forecast():
    client = TestClient(app)
    create_user(client)

    today = date.today()
    # Log 10 days of study with highest hours on Sundays
    for i in range(10):
        d = today - timedelta(days=9 - i)
        hrs = 6.0 if d.strftime("%A") == "Sunday" else 2.0
        client.post(
            "/api/study-records",
            json={
                "study_hours": hrs,
                "subjects": "Algorithms, Systems",
                "academic_goal": "Deep Learning",
                "study_date": str(d),
            },
        )

    res = client.get("/api/analytics/study-forecast")
    assert res.status_code == 200
    data = res.json()
    assert data["has_sufficient_data"] is True
    assert data["best_study_day"] is not None
    assert "day" in data["best_study_day"]
    assert "avg_hours" in data["best_study_day"]
    assert data["predicted_next_week_hours"] is not None


def test_habit_analysis_and_risks():
    client = TestClient(app)
    create_user(client)

    today = date.today()
    # Log 8 days of unhealthy habits (short sleep, high screen time) to trigger risks
    for i in range(8):
        d_str = str(today - timedelta(days=7 - i))
        client.post(
            "/api/habit-records",
            json={
                "sleep_hours": 5.0,  # Under 6 hrs -> chronic sleep deficit threat
                "exercise_minutes": 5,  # Under 10 mins
                "screen_time": 8.5,  # Over 7 hrs -> screen time surge threat
                "habit_notes": "Late night gaming",
                "record_date": d_str,
            },
        )

    # Test Habit Analysis
    habit_res = client.get("/api/analytics/habit-analysis")
    assert habit_res.status_code == 200
    h_data = habit_res.json()
    assert h_data["has_sufficient_data"] is True
    assert "sleep" in h_data["habits"]
    assert "exercise" in h_data["habits"]
    assert "screen_time" in h_data["habits"]

    # Test Risks Endpoint
    risk_res = client.get("/api/analytics/risks")
    assert risk_res.status_code == 200
    risks = risk_res.json()
    assert len(risks) >= 1
    levels = [r["level"] for r in risks]
    assert "HIGH" in levels or "MEDIUM" in levels
    for r in risks:
        assert "reason" in r
        assert "supporting_metric" in r
        assert "recommendation" in r


def test_demo_analytics_endpoint():
    client = TestClient(app)
    create_user(client)

    res = client.get("/api/analytics/demo-data")
    assert res.status_code == 200
    data = res.json()
    assert data["is_demo_mode"] is True
    assert data["financial"]["has_sufficient_data"] is True
    assert data["productivity"]["has_sufficient_data"] is True
    assert data["study"]["has_sufficient_data"] is True
    assert data["habits"]["has_sufficient_data"] is True
