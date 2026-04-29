from collections import defaultdict
from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from threading import Lock
from uuid import UUID, uuid4

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
        self._transactions: list[TransactionRead] = []

    def list_transactions(self) -> list[TransactionRead]:
        with self._lock:
            return sorted(self._transactions, key=lambda item: (item.date, item.created_at), reverse=True)

    def create_transaction(self, payload: TransactionCreate) -> TransactionRead:
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
            self._transactions.insert(0, item)

        return item

    def update_transaction(self, transaction_id: UUID, payload: TransactionUpdate) -> TransactionRead | None:
        with self._lock:
            index = next((i for i, item in enumerate(self._transactions) if item.id == transaction_id), None)

            if index is None:
                return None

            current = self._transactions[index]
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
            self._transactions[index] = updated
            return updated

    def delete_transaction(self, transaction_id: UUID) -> bool:
        with self._lock:
            index = next((i for i, item in enumerate(self._transactions) if item.id == transaction_id), None)

            if index is None:
                return False

            del self._transactions[index]
            return True

    def get_summary(self, reference_date: date | None = None) -> SummaryRead:
        today = reference_date or date.today()

        with self._lock:
            in_month = [
                item
                for item in self._transactions
                if item.date.year == today.year and item.date.month == today.month
            ]

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
