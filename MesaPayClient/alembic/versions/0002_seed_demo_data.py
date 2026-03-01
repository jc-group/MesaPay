"""seed demo restaurant and menu

Revision ID: 0002_seed_demo_data
Revises: 0001_initial_schema
Create Date: 2026-02-26 21:05:00.000000
"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002_seed_demo_data"
down_revision: Union[str, Sequence[str], None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        INSERT INTO public.restaurants (name)
        SELECT 'MesaPay Demo - Taqueria Centro'
        WHERE NOT EXISTS (
          SELECT 1 FROM public.restaurants WHERE name = 'MesaPay Demo - Taqueria Centro'
        );
        """
    )

    op.execute(
        """
        INSERT INTO public.tables (restaurant_id, table_number, qr_token)
        SELECT r.id, '12', 'mesa-12-demo'
        FROM public.restaurants r
        WHERE r.name = 'MesaPay Demo - Taqueria Centro'
          AND NOT EXISTS (
            SELECT 1 FROM public.tables t WHERE t.qr_token = 'mesa-12-demo'
          );
        """
    )

    op.execute(
        """
        INSERT INTO public.menu_categories (restaurant_id, name, display_order)
        SELECT r.id, 'Tacos', 1
        FROM public.restaurants r
        WHERE r.name = 'MesaPay Demo - Taqueria Centro'
          AND NOT EXISTS (
            SELECT 1
            FROM public.menu_categories c
            WHERE c.restaurant_id = r.id AND c.name = 'Tacos'
          );
        """
    )

    op.execute(
        """
        INSERT INTO public.menu_categories (restaurant_id, name, display_order)
        SELECT r.id, 'Bebidas', 2
        FROM public.restaurants r
        WHERE r.name = 'MesaPay Demo - Taqueria Centro'
          AND NOT EXISTS (
            SELECT 1
            FROM public.menu_categories c
            WHERE c.restaurant_id = r.id AND c.name = 'Bebidas'
          );
        """
    )

    op.execute(
        """
        INSERT INTO public.menu_items (category_id, name, description, price_mxn, display_order)
        SELECT c.id, 'Taco al pastor', 'Tortilla de maiz con pastor y pina.', 32.00, 1
        FROM public.menu_categories c
        INNER JOIN public.restaurants r ON r.id = c.restaurant_id
        WHERE r.name = 'MesaPay Demo - Taqueria Centro'
          AND c.name = 'Tacos'
          AND NOT EXISTS (
            SELECT 1 FROM public.menu_items m
            WHERE m.category_id = c.id AND m.name = 'Taco al pastor'
          );
        """
    )

    op.execute(
        """
        INSERT INTO public.menu_items (category_id, name, description, price_mxn, display_order)
        SELECT c.id, 'Gringa especial', 'Tortilla de harina, queso y pastor.', 79.00, 2
        FROM public.menu_categories c
        INNER JOIN public.restaurants r ON r.id = c.restaurant_id
        WHERE r.name = 'MesaPay Demo - Taqueria Centro'
          AND c.name = 'Tacos'
          AND NOT EXISTS (
            SELECT 1 FROM public.menu_items m
            WHERE m.category_id = c.id AND m.name = 'Gringa especial'
          );
        """
    )

    op.execute(
        """
        INSERT INTO public.menu_items (category_id, name, description, price_mxn, display_order)
        SELECT c.id, 'Agua de horchata', 'Vaso de 500 ml.', 35.00, 1
        FROM public.menu_categories c
        INNER JOIN public.restaurants r ON r.id = c.restaurant_id
        WHERE r.name = 'MesaPay Demo - Taqueria Centro'
          AND c.name = 'Bebidas'
          AND NOT EXISTS (
            SELECT 1 FROM public.menu_items m
            WHERE m.category_id = c.id AND m.name = 'Agua de horchata'
          );
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DELETE FROM public.menu_items
        WHERE name IN ('Taco al pastor', 'Gringa especial', 'Agua de horchata');
        """
    )
    op.execute("DELETE FROM public.menu_categories WHERE name IN ('Tacos', 'Bebidas');")
    op.execute("DELETE FROM public.tables WHERE qr_token = 'mesa-12-demo';")
    op.execute("DELETE FROM public.restaurants WHERE name = 'MesaPay Demo - Taqueria Centro';")
