from fastapi.testclient import TestClient
from uuid import uuid4

from app.main import app

client = TestClient(app)


def auth_headers(email: str | None = None) -> dict[str, str]:
    user_email = email or f"user-{uuid4().hex[:8]}@example.com"
    register_payload = {
        "email": user_email,
        "name": "Test User",
        "password": "password123"
    }
    register_response = client.post("/api/v1/auth/register", json=register_payload)
    assert register_response.status_code == 201
    token = register_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_health_endpoint() -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"


def test_transactions_summary_has_expected_shape() -> None:
    response = client.get("/api/v1/transactions/summary", headers=auth_headers())

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

    response = client.post("/api/v1/transactions", json=payload, headers=auth_headers())

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == payload["title"]
    assert body["amount"] == payload["amount"]


def test_can_update_transaction() -> None:
    headers = auth_headers()
    create_payload = {
        "title": "Cab",
        "amount": 12.5,
        "category": "Transport",
        "date": "2026-04-25",
        "kind": "expense",
        "notes": "Office commute",
        "is_fixed": False
    }
    created = client.post("/api/v1/transactions", json=create_payload, headers=headers)
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

    response = client.put(f"/api/v1/transactions/{transaction_id}", json=update_payload, headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == update_payload["title"]
    assert body["amount"] == update_payload["amount"]


def test_can_delete_transaction() -> None:
    headers = auth_headers()
    create_payload = {
        "title": "Bonus",
        "amount": 120.0,
        "category": "Income",
        "date": "2026-04-25",
        "kind": "income",
        "notes": "Quarterly",
        "is_fixed": False
    }
    created = client.post("/api/v1/transactions", json=create_payload, headers=headers)
    transaction_id = created.json()["id"]

    delete_response = client.delete(f"/api/v1/transactions/{transaction_id}", headers=headers)
    assert delete_response.status_code == 204

    list_response = client.get("/api/v1/transactions", headers=headers)
    ids = [item["id"] for item in list_response.json()]
    assert transaction_id not in ids


def test_transactions_are_isolated_per_user() -> None:
    user_one_headers = auth_headers(f"user-one-{uuid4().hex[:6]}@example.com")
    user_two_headers = auth_headers(f"user-two-{uuid4().hex[:6]}@example.com")

    payload = {
        "title": "Private expense",
        "amount": 50.0,
        "category": "Food",
        "date": "2026-04-25",
        "kind": "expense",
        "notes": "Only user one should see this",
        "is_fixed": False
    }

    create_response = client.post("/api/v1/transactions", json=payload, headers=user_one_headers)
    assert create_response.status_code == 201
    created_id = create_response.json()["id"]

    user_one_list = client.get("/api/v1/transactions", headers=user_one_headers)
    assert user_one_list.status_code == 200
    user_one_ids = [item["id"] for item in user_one_list.json()]
    assert created_id in user_one_ids

    user_two_list = client.get("/api/v1/transactions", headers=user_two_headers)
    assert user_two_list.status_code == 200
    user_two_ids = [item["id"] for item in user_two_list.json()]
    assert created_id not in user_two_ids
