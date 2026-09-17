import uuid
from datetime import date

from fastapi.testclient import TestClient

from backend.app.main import app


def create_user(client):
    email = f"fin_user_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "Password123"
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Finance Tester",
            "email": email,
            "password": pwd,
            "confirm_password": pwd,
            "age": 22,
            "gender": "Male",
            "education_level": "Undergraduate",
            "course": "Commerce",
        },
    )
    client.post("/api/auth/login", json={"email": email, "password": pwd})
    return email


def test_financial_forecast_insufficient_data():
    client = TestClient(app)
    create_user(client)

    # With 0 or 1 record, must report insufficient data
    res = client.get("/api/analytics/financial-forecast")
    assert res.status_code == 200
    data = res.json()
    assert data["has_sufficient_data"] is False
    assert "More historical data is required" in data["message"]
    assert data["predicted_next_expenses"] is None


def test_financial_forecast_with_low_data_warning():
    client = TestClient(app)
    create_user(client)

    # Submit 2 monthly records
    client.post(
        "/api/financial-records",
        json={
            "monthly_income": 40000.0,
            "monthly_expenses": 25000.0,
            "monthly_savings": 15000.0,
            "financial_goal": "Savings Fund",
        },
    )
    client.post(
        "/api/financial-records",
        json={
            "monthly_income": 40000.0,
            "monthly_expenses": 26000.0,
            "monthly_savings": 14000.0,
            "financial_goal": "Savings Fund",
        },
    )

    res = client.get("/api/analytics/financial-forecast")
    assert res.status_code == 200
    data = res.json()
    assert data["has_sufficient_data"] is True
    assert data["low_data_warning"] is True
    assert data["predicted_next_expenses"] is not None
    # Check that model evaluation message is strictly 'Insufficient data for reliable model evaluation.'
    assert (
        data["model_metadata"]["evaluation_status"]
        == "Insufficient data for reliable model evaluation."
    )


def test_financial_forecast_with_sufficient_data():
    client = TestClient(app)
    create_user(client)

    # Submit 5 monthly records
    records = [
        (45000.0, 28000.0, 17000.0),
        (45000.0, 29000.0, 16000.0),
        (48000.0, 29500.0, 18500.0),
        (48000.0, 30000.0, 18000.0),
        (50000.0, 31000.0, 19000.0),
    ]
    for inc, exp, sav in records:
        client.post(
            "/api/financial-records",
            json={
                "monthly_income": inc,
                "monthly_expenses": exp,
                "monthly_savings": sav,
                "financial_goal": "House Downpayment",
            },
        )

    # Add categorized expenses
    client.post(
        "/api/expense-records",
        json={"amount": 5000.0, "category": "Food", "expense_date": str(date.today())},
    )
    client.post(
        "/api/expense-records",
        json={"amount": 2500.0, "category": "Bills", "expense_date": str(date.today())},
    )

    res = client.get("/api/analytics/financial-forecast")
    assert res.status_code == 200
    data = res.json()
    assert data["has_sufficient_data"] is True
    assert data["low_data_warning"] is False
    assert data["predicted_next_expenses"] > 0
    assert len(data["savings_projection"]) >= 3
    assert data["highest_spending_category"] == "Food"

    # Evaluation results should now be evaluated since sample_count is 5
    assert data["model_metadata"]["evaluation_status"] == "Evaluated"
    assert data["model_metadata"]["mae"] is not None


def test_financial_user_data_isolation():
    client1 = TestClient(app)
    create_user(client1)
    client1.post(
        "/api/financial-records",
        json={
            "monthly_income": 99999.0,
            "monthly_expenses": 33333.0,
            "monthly_savings": 66666.0,
            "financial_goal": "User 1 Secret Goal",
        },
    )

    client2 = TestClient(app)
    create_user(client2)
    res = client2.get("/api/analytics/financial-forecast")
    data = res.json()
    assert data["current_savings"] == 0.0
    assert data["has_sufficient_data"] is False
