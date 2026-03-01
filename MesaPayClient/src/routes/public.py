from typing import TypedDict

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from src.services.public_table_service import (
    add_items_to_shared_bill,
    checkout_shared_bill_items,
    get_shared_bill_by_qr,
    get_table_menu_by_qr,
    join_table_virtual_session,
    refund_shared_bill_order,
)

public_router = APIRouter()


class JoinTableBody(BaseModel):
    guestName: str | None = None


class MenuErrorResponse(TypedDict):
    message: str


class CheckoutItemBody(BaseModel):
    menuItemId: int
    quantity: int = Field(ge=1, le=99)


class CheckoutCardBody(BaseModel):
    holderName: str = Field(min_length=3, max_length=120)
    number: str = Field(min_length=12, max_length=24)
    expiry: str = Field(min_length=4, max_length=7)
    cvv: str = Field(min_length=3, max_length=4)


class CheckoutBody(BaseModel):
    guestName: str | None = None
    payerMemberId: int | None = None
    lineItemIds: list[int]
    card: CheckoutCardBody


class AddBillItemsBody(BaseModel):
    memberId: int | None = None
    items: list[CheckoutItemBody]


class RefundBody(BaseModel):
    orderId: int


@public_router.get("/v1/public/tables/{qr_token}/menu")
def get_table_menu(qr_token: str):
    result = get_table_menu_by_qr(qr_token)
    if not result:
        error: MenuErrorResponse = {"message": "No encontramos la mesa solicitada."}
        return JSONResponse(status_code=404, content=error)

    return result


@public_router.post("/v1/public/tables/{qr_token}/join")
def join_table(qr_token: str, payload: JoinTableBody):
    result = join_table_virtual_session(qr_token, payload.guestName)
    if not result:
        return JSONResponse(
            status_code=404,
            content={"message": "No encontramos la mesa solicitada."},
        )

    return result


@public_router.get("/v1/public/tables/{qr_token}/bill")
def get_shared_bill(qr_token: str):
    result = get_shared_bill_by_qr(qr_token)
    if not result:
        return JSONResponse(status_code=404, content={"message": "No encontramos la mesa solicitada."})
    return result


@public_router.post("/v1/public/tables/{qr_token}/items")
def add_bill_items(qr_token: str, payload: AddBillItemsBody):
    try:
        result = add_items_to_shared_bill(
            qr_token=qr_token,
            member_id=payload.memberId,
            items=[item.model_dump() for item in payload.items],
        )
    except ValueError as error:
        return JSONResponse(status_code=400, content={"message": str(error)})

    if not result:
        return JSONResponse(status_code=404, content={"message": "No encontramos la mesa solicitada."})
    return result


@public_router.post("/v1/public/tables/{qr_token}/checkout")
def checkout_table(qr_token: str, payload: CheckoutBody):
    try:
        result = checkout_shared_bill_items(
            qr_token=qr_token,
            payer_member_id=payload.payerMemberId,
            guest_name=payload.guestName,
            line_item_ids=payload.lineItemIds,
            card_holder_name=payload.card.holderName,
            card_number=payload.card.number,
        )
    except ValueError as error:
        return JSONResponse(status_code=400, content={"message": str(error)})

    if not result:
        return JSONResponse(status_code=404, content={"message": "No encontramos la mesa solicitada."})

    return result


@public_router.post("/v1/public/tables/{qr_token}/refund")
def refund_table_order(qr_token: str, payload: RefundBody):
    try:
        result = refund_shared_bill_order(qr_token=qr_token, order_id=payload.orderId)
    except ValueError as error:
        return JSONResponse(status_code=400, content={"message": str(error)})

    if not result:
        return JSONResponse(status_code=404, content={"message": "No encontramos la mesa solicitada."})

    return result
