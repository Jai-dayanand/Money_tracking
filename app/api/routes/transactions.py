from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status

from ...schemas.transaction import SummaryRead, TransactionCreate, TransactionRead, TransactionUpdate
from ...services.transaction_service import transaction_service
from .auth import get_current_user

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=list[TransactionRead])
def list_transactions(user_id: str = Depends(get_current_user)) -> list[TransactionRead]:
    return transaction_service.list_transactions(user_id)


@router.post("", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
def create_transaction(payload: TransactionCreate, user_id: str = Depends(get_current_user)) -> TransactionRead:
    return transaction_service.create_transaction(user_id, payload)


@router.put("/{transaction_id}", response_model=TransactionRead)
def update_transaction(transaction_id: UUID, payload: TransactionUpdate, user_id: str = Depends(get_current_user)) -> TransactionRead:
    updated = transaction_service.update_transaction(user_id, transaction_id, payload)

    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    return updated


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(transaction_id: UUID, user_id: str = Depends(get_current_user)) -> Response:
    deleted = transaction_service.delete_transaction(user_id, transaction_id)

    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/summary", response_model=SummaryRead)
def get_summary(user_id: str = Depends(get_current_user)) -> SummaryRead:
    return transaction_service.get_summary(user_id)
