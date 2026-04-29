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


def test_can_update_transaction() -> None:
    create_payload = {
        "title": "Cab",
        "amount": 12.5,
        "category": "Transport",
        "date": "2026-04-25",
        "kind": "expense",
        "notes": "Office commute",
        "is_fixed": False
    }
    created = client.post("/api/v1/transactions", json=create_payload)
    transaction_id = created.json()["id"]

    update_payload = {
        "title": "Ride share",
        "amount": 15.0,
        "category": "Transport",
        "date": "2026-04-26",
        "kind": "expense",
        "notes": "Updated",
        "is_fixed": False
    }

    response = client.put(f"/api/v1/transactions/{transaction_id}", json=update_payload)

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == update_payload["title"]
    assert body["amount"] == update_payload["amount"]


def test_can_delete_transaction() -> None:
    create_payload = {
        "title": "Bonus",
        "amount": 120.0,
        "category": "Income",
        "date": "2026-04-25",
        "kind": "income",
        "notes": "Quarterly",
        "is_fixed": False
    }
    created = client.post("/api/v1/transactions", json=create_payload)
    transaction_id = created.json()["id"]

    delete_response = client.delete(f"/api/v1/transactions/{transaction_id}")
    assert delete_response.status_code == 204

    list_response = client.get("/api/v1/transactions")
    ids = [item["id"] for item in list_response.json()]
    assert transaction_id not in ids
