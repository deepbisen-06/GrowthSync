import uuid

from fastapi.testclient import TestClient

from backend.app.main import app


def create_user(client):
    email = f"sim_user_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "Password123"
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Simulator Tester",
            "email": email,
            "password": pwd,
            "confirm_password": pwd,
            "age": 25,
            "gender": "Female",
            "education_level": "Postgraduate",
            "course": "Analytics",
        },
    )
    client.post("/api/auth/login", json={"email": email, "password": pwd})
    return email


def test_what_if_simulation_calculation():
    client = TestClient(app)
    create_user(client)

    # Initial financial record
    client.post(
        "/api/financial-records",
        json={
            "monthly_income": 50000.0,
            "monthly_expenses": 30000.0,
            "monthly_savings": 20000.0,
            "financial_goal": "Retirement Fund",
        },
    )

    sim_payload = {
        "income_delta": 5000.0,
        "expense_reduction": 3000.0,
        "daily_study_delta_hours": 1.5,
        "daily_sleep_delta_hours": 1.0,
        "daily_screen_time_reduction_hours": 1.5,
        "weekly_exercise_extra_minutes": 20,
    }

    res = client.post("/api/simulation/what-if", json=sim_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["is_stateless"] is True

    # Check financial comparison
    sav = data["monthly_savings"]
    assert sav["delta"] == 8000.0  # 5000 income + 3000 expense reduction
    assert sav["impact_direction"] == "positive"

    exp = data["monthly_expenses"]
    assert exp["delta"] == -3000.0
    assert exp["impact_direction"] == "positive"

    # Check productivity comparison
    prod = data["productivity_score"]
    assert prod["simulated_value"] >= prod["current_value"]

    # Verify insights are present
    assert len(data["insights"]) >= 1


def test_simulation_does_not_modify_database():
    client = TestClient(app)
    create_user(client)

    # Seed 1 record
    client.post(
        "/api/financial-records",
        json={
            "monthly_income": 40000.0,
            "monthly_expenses": 25000.0,
            "monthly_savings": 15000.0,
            "financial_goal": "Gold Investment",
        },
    )

    # Record count before
    pre_fin = client.get("/api/financial-records").json()
    assert len(pre_fin) == 1
    assert pre_fin[0]["monthly_expenses"] == 25000.0

    # Run aggressive simulation
    client.post(
        "/api/simulation/what-if", json={"income_delta": 50000.0, "expense_reduction": 15000.0}
    )

    # Record count after: MUST BE UNCHANGED
    post_fin = client.get("/api/financial-records").json()
    assert len(post_fin) == 1
    assert post_fin[0]["monthly_expenses"] == 25000.0
    assert post_fin[0]["monthly_income"] == 40000.0


def test_simulation_input_validation():
    client = TestClient(app)
    create_user(client)

    # Negative expense reduction is invalid (ge=0.0)
    res = client.post("/api/simulation/what-if", json={"expense_reduction": -500.0})
    assert res.status_code == 422
