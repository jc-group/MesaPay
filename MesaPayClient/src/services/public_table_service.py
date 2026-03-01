from decimal import Decimal

from sqlalchemy import Select, select
from sqlalchemy.orm import joinedload

from src.db.session import SessionLocal
from src.models import (
    MenuCategory,
    MenuItem,
    Order,
    OrderItem,
    Payment,
    Session,
    SessionLineItem,
    SessionMember,
    Table,
)


def get_table_menu_by_qr(qr_token: str) -> dict:
    with SessionLocal() as db_session:
        table_query: Select[tuple[Table]] = (
            select(Table)
            .options(joinedload(Table.restaurant))
            .where(Table.qr_token == qr_token)
            .limit(1)
        )
        table = db_session.execute(table_query).scalar_one_or_none()
        if table is None:
            return {}

        open_session_query: Select[tuple[Session]] = (
            select(Session)
            .where(Session.table_id == table.id, Session.status == "open")
            .order_by(Session.created_at.desc())
            .limit(1)
        )
        open_session = db_session.execute(open_session_query).scalar_one_or_none()

        category_query: Select[tuple[MenuCategory]] = (
            select(MenuCategory)
            .options(joinedload(MenuCategory.items))
            .where(MenuCategory.restaurant_id == table.restaurant_id)
            .order_by(MenuCategory.display_order.asc(), MenuCategory.id.asc())
        )
        categories = db_session.execute(category_query).unique().scalars().all()

    menu = []
    for category in categories:
        ordered_items = sorted(category.items, key=lambda item: (item.display_order, item.id))
        menu.append(
            {
                "id": category.id,
                "name": category.name,
                "items": [
                    {
                        "id": item.id,
                        "name": item.name,
                        "description": item.description,
                        "priceMxn": float(item.price_mxn),
                    }
                    for item in ordered_items
                    if item.is_available
                ],
            }
        )

    return {
        "restaurant": {
            "id": table.restaurant.id,
            "name": table.restaurant.name,
        },
        "table": {
            "id": table.id,
            "number": table.table_number,
            "qrToken": table.qr_token,
        },
        "session": {
            "id": open_session.id,
            "status": open_session.status,
        }
        if open_session
        else None,
        "menu": menu,
    }


def join_table_virtual_session(qr_token: str, guest_name: str | None) -> dict:
    normalized_name = (guest_name or "Invitado").strip() or "Invitado"

    with SessionLocal() as db_session:
        table, open_session = _get_table_and_open_session(db_session, qr_token)
        if table is None:
            return {}

        member = SessionMember(session_id=open_session.id, guest_name=normalized_name)
        db_session.add(member)
        db_session.commit()
        db_session.refresh(member)

    return {
        "message": "Te uniste a la mesa virtual.",
        "session": {
            "id": open_session.id,
            "status": open_session.status,
            "tableNumber": table.table_number,
        },
        "member": {
            "id": member.id,
            "guestName": normalized_name,
        },
    }


def get_shared_bill_by_qr(qr_token: str) -> dict:
    with SessionLocal() as db_session:
        table, open_session = _get_table_and_open_session(db_session, qr_token)
        if table is None:
            return {}

        members = (
            db_session.execute(
                select(SessionMember)
                .where(SessionMember.session_id == open_session.id)
                .order_by(SessionMember.created_at.asc())
            )
            .scalars()
            .all()
        )

        line_items = (
            db_session.execute(
                select(SessionLineItem)
                .options(joinedload(SessionLineItem.member), joinedload(SessionLineItem.session))
                .join(MenuItem, MenuItem.id == SessionLineItem.menu_item_id)
                .where(SessionLineItem.session_id == open_session.id)
                .order_by(SessionLineItem.created_at.asc(), SessionLineItem.id.asc())
            )
            .scalars()
            .all()
        )

        menu_item_map = {
            item.id: item
            for item in db_session.execute(
                select(MenuItem).where(MenuItem.id.in_([line.menu_item_id for line in line_items]))
            )
            .scalars()
            .all()
        }

    serialized_lines = []
    unpaid_total = Decimal("0.00")
    paid_total = Decimal("0.00")
    for line in line_items:
        menu_item = menu_item_map.get(line.menu_item_id)
        line_total = Decimal(line.total_price_mxn)
        if line.status == "unpaid":
            unpaid_total += line_total
        else:
            paid_total += line_total

        serialized_lines.append(
            {
                "id": line.id,
                "status": line.status,
                "quantity": line.quantity,
                "unitPriceMxn": float(line.unit_price_mxn),
                "totalPriceMxn": float(line.total_price_mxn),
                "menuItem": {
                    "id": line.menu_item_id,
                    "name": menu_item.name if menu_item else "Articulo",
                },
                "owner": {
                    "id": line.member.id,
                    "guestName": line.member.guest_name,
                }
                if line.member
                else None,
                "paidOrderId": line.paid_order_id,
            }
        )

    return {
        "session": {
            "id": open_session.id,
            "tableNumber": table.table_number,
        },
        "members": [{"id": member.id, "guestName": member.guest_name} for member in members],
        "lineItems": serialized_lines,
        "totals": {
            "unpaidMxn": float(unpaid_total),
            "paidMxn": float(paid_total),
            "grandTotalMxn": float(unpaid_total + paid_total),
        },
    }


def add_items_to_shared_bill(qr_token: str, member_id: int | None, items: list[dict[str, int]]) -> dict:
    if not items:
        raise ValueError("Selecciona al menos un articulo")

    item_quantities: dict[int, int] = {}
    for item in items:
        menu_item_id = int(item["menuItemId"])
        quantity = int(item["quantity"])
        if quantity <= 0:
            continue
        item_quantities[menu_item_id] = item_quantities.get(menu_item_id, 0) + quantity

    if not item_quantities:
        raise ValueError("Selecciona al menos un articulo")

    with SessionLocal() as db_session:
        table, open_session = _get_table_and_open_session(db_session, qr_token)
        if table is None:
            return {}

        owner_member = None
        if member_id is not None:
            owner_member = (
                db_session.execute(
                    select(SessionMember)
                    .where(SessionMember.id == member_id, SessionMember.session_id == open_session.id)
                    .limit(1)
                )
                .scalars()
                .first()
            )
            if owner_member is None:
                raise ValueError("Integrante de mesa invalido")

        menu_items = (
            db_session.execute(
                select(MenuItem)
                .join(MenuCategory, MenuCategory.id == MenuItem.category_id)
                .where(
                    MenuItem.id.in_(list(item_quantities.keys())),
                    MenuCategory.restaurant_id == table.restaurant_id,
                    MenuItem.is_available.is_(True),
                )
            )
            .scalars()
            .all()
        )

        if len(menu_items) != len(item_quantities):
            raise ValueError("Uno o mas articulos no estan disponibles")

        created_line_items = []
        for menu_item in menu_items:
            quantity = item_quantities[menu_item.id]
            for _ in range(quantity):
                total_price = menu_item.price_mxn
                line_item = SessionLineItem(
                    session_id=open_session.id,
                    member_id=owner_member.id if owner_member else None,
                    menu_item_id=menu_item.id,
                    quantity=1,
                    unit_price_mxn=menu_item.price_mxn,
                    total_price_mxn=total_price,
                    status="unpaid",
                )
                db_session.add(line_item)
                db_session.flush()
                created_line_items.append(
                    {
                        "id": line_item.id,
                        "menuItemId": menu_item.id,
                        "name": menu_item.name,
                        "quantity": 1,
                        "totalPriceMxn": float(total_price),
                    }
                )

        db_session.commit()

    return {
        "message": "Articulos agregados a la cuenta compartida.",
        "lineItems": created_line_items,
    }


def checkout_shared_bill_items(
    qr_token: str,
    payer_member_id: int | None,
    guest_name: str | None,
    line_item_ids: list[int],
    card_holder_name: str,
    card_number: str,
) -> dict:
    sanitized_card_number = "".join(character for character in card_number if character.isdigit())
    if len(sanitized_card_number) < 12:
        raise ValueError("Numero de tarjeta invalido")
    if not _passes_luhn(sanitized_card_number):
        raise ValueError("Numero de tarjeta invalido")
    if sanitized_card_number.endswith("0002"):
        raise ValueError("Pago rechazado por el banco")
    if not line_item_ids:
        raise ValueError("Selecciona conceptos para pagar")

    with SessionLocal() as db_session:
        table, open_session = _get_table_and_open_session(db_session, qr_token)
        if table is None:
            return {}

        payer_member = None
        if payer_member_id is not None:
            payer_member = (
                db_session.execute(
                    select(SessionMember)
                    .where(SessionMember.id == payer_member_id, SessionMember.session_id == open_session.id)
                    .limit(1)
                )
                .scalars()
                .first()
            )

        if payer_member is None:
            normalized_name = (guest_name or "Pagador anonimo").strip() or "Pagador anonimo"
            payer_member = SessionMember(session_id=open_session.id, guest_name=normalized_name)
            db_session.add(payer_member)
            db_session.flush()

        line_items = (
            db_session.execute(
                select(SessionLineItem)
                .where(
                    SessionLineItem.id.in_(line_item_ids),
                    SessionLineItem.session_id == open_session.id,
                    SessionLineItem.status == "unpaid",
                )
                .order_by(SessionLineItem.id.asc())
                .with_for_update()
            )
            .scalars()
            .all()
        )

        if len(line_items) != len(set(line_item_ids)):
            raise ValueError("Uno o mas conceptos ya no estan disponibles para pago")

        subtotal = Decimal("0.00")
        order = Order(
            session_id=open_session.id,
            member_id=payer_member.id,
            status="paid",
            subtotal_mxn=Decimal("0.00"),
            service_fee_mxn=Decimal("0.00"),
            total_mxn=Decimal("0.00"),
            currency="MXN",
        )
        db_session.add(order)
        db_session.flush()

        menu_item_map = {
            item.id: item
            for item in db_session.execute(
                select(MenuItem).where(MenuItem.id.in_([line.menu_item_id for line in line_items]))
            )
            .scalars()
            .all()
        }

        paid_lines = []
        for line in line_items:
            menu_item = menu_item_map.get(line.menu_item_id)
            subtotal += Decimal(line.total_price_mxn)

            db_session.add(
                OrderItem(
                    order_id=order.id,
                    menu_item_id=line.menu_item_id,
                    quantity=line.quantity,
                    unit_price_mxn=line.unit_price_mxn,
                    line_total_mxn=line.total_price_mxn,
                )
            )

            line.status = "paid"
            line.paid_order_id = order.id

            paid_lines.append(
                {
                    "lineItemId": line.id,
                    "menuItemId": line.menu_item_id,
                    "name": menu_item.name if menu_item else "Articulo",
                    "quantity": line.quantity,
                    "totalPriceMxn": float(line.total_price_mxn),
                }
            )

        order.subtotal_mxn = subtotal
        order.total_mxn = subtotal

        payment = Payment(
            order_id=order.id,
            provider="sandbox",
            status="approved",
            amount_mxn=subtotal,
            card_holder_name=card_holder_name.strip(),
            card_last4=sanitized_card_number[-4:],
            card_brand=_detect_card_brand(sanitized_card_number),
        )
        db_session.add(payment)
        db_session.commit()

    return {
        "message": "Pago aprobado. Cuenta actualizada.",
        "order": {
            "id": order.id,
            "status": order.status,
            "totalMxn": float(order.total_mxn),
            "currency": order.currency,
            "lineItems": paid_lines,
        },
        "payment": {
            "status": payment.status,
            "provider": payment.provider,
            "cardBrand": payment.card_brand,
            "cardLast4": payment.card_last4,
            "amountMxn": float(payment.amount_mxn),
        },
        "payer": {
            "memberId": payer_member.id,
            "guestName": payer_member.guest_name,
        },
    }


def _get_table_and_open_session(db_session, qr_token: str) -> tuple[Table | None, Session | None]:
    table = db_session.execute(select(Table).where(Table.qr_token == qr_token).limit(1)).scalar_one_or_none()
    if table is None:
        return None, None

    open_session = (
        db_session.execute(
            select(Session)
            .where(Session.table_id == table.id, Session.status == "open")
            .order_by(Session.created_at.desc())
            .limit(1)
        )
        .scalars()
        .first()
    )

    if open_session is None:
        open_session = Session(table_id=table.id, status="open")
        db_session.add(open_session)
        db_session.flush()

    return table, open_session


def _detect_card_brand(card_number: str) -> str:
    if card_number.startswith("4"):
        return "visa"
    if len(card_number) >= 2 and 51 <= int(card_number[:2]) <= 55:
        return "mastercard"
    if card_number.startswith("34") or card_number.startswith("37"):
        return "amex"
    return "otra"


def _passes_luhn(card_number: str) -> bool:
    total = 0
    should_double = False
    for digit in reversed(card_number):
        if not digit.isdigit():
            return False
        value = int(digit)
        if should_double:
            value *= 2
            if value > 9:
                value -= 9
        total += value
        should_double = not should_double
    return total % 10 == 0
