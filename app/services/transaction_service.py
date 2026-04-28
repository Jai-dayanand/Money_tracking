from collections import defaultdict
from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from threading import Lock
from uuid import uuid4

from ..schemas.transaction import CategorySpend, SummaryRead, TransactionCreate, TransactionRead


class TransactionService:
    def __init__(self) -> None:
        self._lock = Lock()
        self._transactions: list[TransactionRead] = self._seed_data()

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

    def _seed_data(self) -> list[TransactionRead]:
        today = date.today()

        return [
            TransactionRead(
                id=uuid4(),
                created_at=datetime.now(timezone.utc),
                title="Salary",
                amount=Decimal("3200.00"),
                category="Income",
                date=today,
                kind="income",
                notes="Monthly salary",
                is_fixed=True
            ),
            TransactionRead(
                id=uuid4(),
                created_at=datetime.now(timezone.utc),
                title="Groceries",
                amount=Decimal("86.42"),
                category="Food",
                date=today,
                kind="expense",
                notes="Weekly shopping",
                is_fixed=False
            ),
            TransactionRead(
                id=uuid4(),
                created_at=datetime.now(timezone.utc),
                title="Spotify",
                amount=Decimal("10.99"),
                category="Subscriptions",
                date=today,
                kind="expense",
                notes="Premium plan",
                is_fixed=True
            )
        ]


transaction_service = TransactionService()
