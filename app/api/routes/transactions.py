from uuid import UUID

from fastapi import APIRouter, HTTPException, Response, status

from ...schemas.transaction import SummaryRead, TransactionCreate, TransactionRead, TransactionUpdate
from ...services.transaction_service import transaction_service

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=list[TransactionRead])
def list_transactions() -> list[TransactionRead]:
    return transaction_service.list_transactions()


@router.post("", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
def create_transaction(payload: TransactionCreate) -> TransactionRead:
    return transaction_service.create_transaction(payload)


@router.put("/{transaction_id}", response_model=TransactionRead)
def update_transaction(transaction_id: UUID, payload: TransactionUpdate) -> TransactionRead:
    updated = transaction_service.update_transaction(transaction_id, payload)

    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    return updated


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(transaction_id: UUID) -> Response:
    deleted = transaction_service.delete_transaction(transaction_id)

    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/summary", response_model=SummaryRead)
def get_summary() -> SummaryRead:
    return transaction_service.get_summary()
