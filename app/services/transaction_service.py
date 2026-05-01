from collections import defaultdict
from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
import sqlite3
from threading import Lock
from uuid import UUID, uuid4

from ..core.config import settings
from ..schemas.transaction import (
    CategorySpend,
    SummaryRead,
    TransactionCreate,
    TransactionRead,
    TransactionUpdate,
)


class TransactionService:
    def __init__(self) -> None:
        self._lock = Lock()
        self._db_path = Path(settings.db_path)
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._ensure_schema()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _ensure_schema(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS transactions (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    title TEXT NOT NULL,
                    amount TEXT NOT NULL,
                    category TEXT NOT NULL,
                    date TEXT NOT NULL,
                    kind TEXT NOT NULL,
                    notes TEXT,
                    is_fixed INTEGER NOT NULL DEFAULT 0
                )
                """
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date, created_at)"
            )
            conn.commit()

    @staticmethod
    def _row_to_transaction(row: sqlite3.Row) -> TransactionRead:
        return TransactionRead(
            id=UUID(row["id"]),
            created_at=datetime.fromisoformat(row["created_at"]),
            title=row["title"],
            amount=Decimal(row["amount"]),
            category=row["category"],
            date=date.fromisoformat(row["date"]),
            kind=row["kind"],
            notes=row["notes"],
            is_fixed=bool(row["is_fixed"])
        )

    def list_transactions(self, user_id: str) -> list[TransactionRead]:
        with self._lock:
            with self._connect() as conn:
                rows = conn.execute(
                    """
                    SELECT id, created_at, title, amount, category, date, kind, notes, is_fixed
                    FROM transactions
                    WHERE user_id = ?
                    ORDER BY date DESC, created_at DESC
                    """,
                    (user_id,)
                ).fetchall()

        return [self._row_to_transaction(row) for row in rows]

    def create_transaction(self, user_id: str, payload: TransactionCreate) -> TransactionRead:
        item = TransactionRead(
            id=uuid4(),
            created_at=datetime.now(timezone.utc),
            title=payload.title,
            amount=self._normalize_amount(payload.amount),
            category=payload.category,
            date=payload.date,
            kind=payload.kind,
            notes=payload.notes,
            is_fixed=payload.is_fixed
        )

        with self._lock:
            with self._connect() as conn:
                conn.execute(
                    """
                    INSERT INTO transactions (id, user_id, created_at, title, amount, category, date, kind, notes, is_fixed)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        str(item.id),
                        user_id,
                        item.created_at.isoformat(),
                        item.title,
                        str(item.amount),
                        item.category,
                        item.date.isoformat(),
                        item.kind,
                        item.notes,
                        1 if item.is_fixed else 0,
                    )
                )
                conn.commit()

        return item

    def update_transaction(self, user_id: str, transaction_id: UUID, payload: TransactionUpdate) -> TransactionRead | None:
        with self._lock:
            with self._connect() as conn:
                row = conn.execute(
                    """
                    SELECT id, created_at, title, amount, category, date, kind, notes, is_fixed
                    FROM transactions
                    WHERE id = ? AND user_id = ?
                    """,
                    (str(transaction_id), user_id)
                ).fetchone()

                if row is None:
                    return None

                current = self._row_to_transaction(row)
            updated = TransactionRead(
                id=current.id,
                created_at=current.created_at,
                title=payload.title,
                amount=self._normalize_amount(payload.amount),
                category=payload.category,
                date=payload.date,
                kind=payload.kind,
                notes=payload.notes,
                is_fixed=payload.is_fixed
            )

            with self._connect() as conn:
                conn.execute(
                    """
                    UPDATE transactions
                    SET title = ?, amount = ?, category = ?, date = ?, kind = ?, notes = ?, is_fixed = ?
                    WHERE id = ? AND user_id = ?
                    """,
                    (
                        updated.title,
                        str(updated.amount),
                        updated.category,
                        updated.date.isoformat(),
                        updated.kind,
                        updated.notes,
                        1 if updated.is_fixed else 0,
                        str(updated.id),
                        user_id,
                    )
                )
                conn.commit()

            return updated

    def delete_transaction(self, user_id: str, transaction_id: UUID) -> bool:
        with self._lock:
            with self._connect() as conn:
                cursor = conn.execute(
                    "DELETE FROM transactions WHERE id = ? AND user_id = ?",
                    (str(transaction_id), user_id)
                )
                conn.commit()
                return cursor.rowcount > 0

    def get_summary(self, user_id: str, reference_date: date | None = None) -> SummaryRead:
        today = reference_date or date.today()

        with self._lock:
            with self._connect() as conn:
                rows = conn.execute(
                    """
                    SELECT id, created_at, title, amount, category, date, kind, notes, is_fixed
                    FROM transactions
                    WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
                    """,
                    (user_id, str(today.year), f"{today.month:02d}")
                ).fetchall()

        in_month = [self._row_to_transaction(row) for row in rows]

        monthly_income = sum(
            (item.amount for item in in_month if item.kind == "income"),
            start=Decimal("0")
        )

        monthly_expense = sum(
            (item.amount for item in in_month if item.kind == "expense"),
            start=Decimal("0")
        )

        category_totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
        for item in in_month:
            if item.kind == "expense":
                category_totals[item.category] += item.amount

        top_categories = sorted(
            (CategorySpend(category=name, amount=value) for name, value in category_totals.items()),
            key=lambda current: current.amount,
            reverse=True
        )[:4]

        return SummaryRead(
            monthly_income=self._normalize_amount(monthly_income),
            monthly_expense=self._normalize_amount(monthly_expense),
            balance=self._normalize_amount(monthly_income - monthly_expense),
            top_categories=top_categories
        )

    @staticmethod
    def _normalize_amount(value: Decimal) -> Decimal:
        return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


transaction_service = TransactionService()
