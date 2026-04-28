from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"


def test_transactions_summary_has_expected_shape() -> None:
    response = client.get("/api/v1/transactions/summary")

    assert response.status_code == 200
    body = response.json()
    assert "monthly_income" in body
    assert "monthly_expense" in body
    assert "balance" in body
    assert "top_categories" in body


def test_can_create_transaction() -> None:
    payload = {
        "title": "Coffee",
        "amount": 4.9,
        "category": "Food",
        "date": "2026-04-25",
        "kind": "expense",
        "notes": "Morning coffee",
        "is_fixed": False
    }

    response = client.post("/api/v1/transactions", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == payload["title"]
    assert body["amount"] == payload["amount"]
