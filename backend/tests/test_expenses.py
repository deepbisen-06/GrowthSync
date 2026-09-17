import uuid
from datetime import date

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app


@pytest.fixture
def auth_client():
    client = TestClient(app)
    email = f"exp_user_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "Password123"
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Expense Tester",
            "email": email,
            "password": pwd,
            "confirm_password": pwd,
            "age": 24,
            "gender": "Female",
            "education_level": "Graduate",
            "course": "Economics",
        },
    )
    client.post("/api/auth/login", json={"email": email, "password": pwd})
    return client


def test_create_and_get_expense(auth_client):
    payload = {
        "amount": 450.0,
        "category": "Food",
        "expense_date": str(date.today()),
        "description": "Team lunch",
    }
    res = auth_client.post("/api/expense-records", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["amount"] == 450.0
    assert data["category"] == "Food"
    assert data["description"] == "Team lunch"

    list_res = auth_client.get("/api/expense-records")
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) >= 1
    assert any(item["category"] == "Food" for item in items)


def test_invalid_expense_category(auth_client):
    payload = {
        "amount": 200.0,
        "category": "InvalidCategoryName",
        "expense_date": str(date.today()),
        "description": "Invalid test",
    }
    res = auth_client.post("/api/expense-records", json=payload)
    assert res.status_code == 422


def test_category_summary(auth_client):
    today_str = str(date.today())
    auth_client.post(
        "/api/expense-records",
        json={"amount": 300.0, "category": "Travel", "expense_date": today_str},
    )
    auth_client.post(
        "/api/expense-records",
        json={"amount": 700.0, "category": "Education", "expense_date": today_str},
    )

    res = auth_client.get("/api/expense-records/summary")
    assert res.status_code == 200
    summary = res.json()
    assert isinstance(summary, list)
    categories = [s["category"] for s in summary]
    assert "Travel" in categories
    assert "Education" in categories
