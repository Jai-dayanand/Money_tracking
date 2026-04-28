from fastapi import APIRouter, status

from ...schemas.transaction import SummaryRead, TransactionCreate, TransactionRead
from ...services.transaction_service import transaction_service

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=list[TransactionRead])
def list_transactions() -> list[TransactionRead]:
    return transaction_service.list_transactions()


@router.post("", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
def create_transaction(payload: TransactionCreate) -> TransactionRead:
    return transaction_service.create_transaction(payload)


@router.get("/summary", response_model=SummaryRead)
def get_summary() -> SummaryRead:
    return transaction_service.get_summary()
