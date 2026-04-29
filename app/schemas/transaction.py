from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field, field_serializer


class TransactionKind(str, Enum):
    income = "income"
    expense = "expense"


class TransactionBase(BaseModel):
    title: str = Field(min_length=2, max_length=100)
    amount: Decimal = Field(gt=Decimal("0"))
    category: str = Field(min_length=2, max_length=60)
    date: date
    kind: TransactionKind
    notes: str | None = Field(default=None, max_length=240)
    is_fixed: bool = False

    @field_serializer("amount")
    def serialize_amount(self, value: Decimal) -> float:
        return float(value)


class TransactionCreate(TransactionBase):
  pass


class TransactionUpdate(TransactionBase):
  pass


class TransactionRead(TransactionBase):
  id: UUID
  created_at: datetime


class CategorySpend(BaseModel):
    category: str
    amount: Decimal

    @field_serializer("amount")
    def serialize_amount(self, value: Decimal) -> float:
        return float(value)


class SummaryRead(BaseModel):
    monthly_income: Decimal
    monthly_expense: Decimal
    balance: Decimal
    top_categories: list[CategorySpend]

    @field_serializer("monthly_income", "monthly_expense", "balance")
    def serialize_decimal(self, value: Decimal) -> float:
        return float(value)
