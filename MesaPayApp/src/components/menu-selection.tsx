"use client";

import type { ReactNode } from "react";
import { createContext, use, useCallback, useMemo, useState } from "react";

import { addItemsToSharedBill, type MenuCategory, type MenuItem } from "@/lib/api";

type QuantityByItem = Record<number, number>;

type MenuSelectionContextValue = {
  menu: MenuCategory[];
  quantities: QuantityByItem;
  updateQuantity: (menuItemId: number, delta: number) => void;
  addState: "idle" | "adding";
  addMessage: string;
  addSelected: () => Promise<void>;
  currency: (value: number) => string;
};

const MenuSelectionContext = createContext<MenuSelectionContextValue | null>(null);

function useMenuSelectionContext() {
  const context = use(MenuSelectionContext);
  if (!context) {
    throw new Error("MenuSelection components must be used within MenuSelectionRoot.");
  }
  return context;
}

type MenuSelectionRootProps = {
  menu: MenuCategory[];
  qrToken: string;
  memberId: number | null;
  children: ReactNode;
  currency: (value: number) => string;
  onAdded?: () => void;
};

export function MenuSelectionRoot({
  menu,
  qrToken,
  memberId,
  children,
  currency,
  onAdded
}: MenuSelectionRootProps) {
  const [quantities, setQuantities] = useState<QuantityByItem>({});
  const [addMessage, setAddMessage] = useState("");
  const [addState, setAddState] = useState<"idle" | "adding">("idle");

  const flattenedMenuItems = useMemo<MenuItem[]>(() => {
    return menu.flatMap((category: MenuCategory) => category.items);
  }, [menu]);

  const selectedCartItems = useMemo<Array<MenuItem & { quantity: number }>>(() => {
    return flattenedMenuItems
      .map((item: MenuItem) => ({ ...item, quantity: quantities[item.id] || 0 }))
      .filter((item: MenuItem & { quantity: number }) => item.quantity > 0);
  }, [flattenedMenuItems, quantities]);

  const updateQuantity = useCallback((menuItemId: number, delta: number) => {
    setQuantities((current: QuantityByItem) => {
      const nextQuantity = Math.max(0, (current[menuItemId] || 0) + delta);
      const next = { ...current, [menuItemId]: nextQuantity };
      if (nextQuantity === 0) {
        delete next[menuItemId];
      }
      return next;
    });
  }, []);

  const addSelected = useCallback(async () => {
    setAddMessage("");
    if (selectedCartItems.length === 0) {
      setAddMessage("Selecciona al menos un articulo para agregar.");
      return;
    }

    setAddState("adding");
    try {
      const response = await addItemsToSharedBill(qrToken, {
        memberId: memberId || undefined,
        items: selectedCartItems.map((item: MenuItem & { quantity: number }) => ({
          menuItemId: item.id,
          quantity: item.quantity
        }))
      });
      setAddMessage(response.message);
      setQuantities({});
      onAdded?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setAddMessage(`No fue posible agregar: ${message}`);
    } finally {
      setAddState("idle");
    }
  }, [qrToken, memberId, onAdded, selectedCartItems]);

  const value = useMemo<MenuSelectionContextValue>(
    () => ({
      menu,
      quantities,
      updateQuantity,
      addState,
      addMessage,
      addSelected,
      currency
    }),
    [menu, quantities, updateQuantity, addState, addMessage, addSelected, currency]
  );

  return <MenuSelectionContext.Provider value={value}>{children}</MenuSelectionContext.Provider>;
}

export function MenuSelectionList() {
  const { menu, quantities, updateQuantity, currency } = useMenuSelectionContext();

  return (
    <>
      {menu.map((category: MenuCategory) => (
        <div
          key={category.id}
          className="raise-hover rounded-2xl border border-[var(--line)] bg-[var(--paper)]/80 p-4"
        >
          <h3 className="text-2xl text-[var(--ink-950)]">{category.name}</h3>
          <ul className="mt-2 space-y-2">
            {category.items.map((item: MenuItem) => (
              <li key={item.id} className="rounded-xl border border-[var(--line)] bg-white/90 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--ink-950)]">{item.name}</p>
                    <p className="text-sm text-[var(--ink-700)]">{item.description}</p>
                    <p className="mt-1 font-bold text-[var(--accent-amber)]">{currency(item.priceMxn)}</p>
                  </div>
                  <div className="flex min-w-[108px] items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="min-h-9 min-w-9 rounded-lg border border-[var(--line)] text-lg font-bold text-[var(--ink-950)]"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-[var(--ink-950)]">
                      {quantities[item.id] || 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="min-h-9 min-w-9 rounded-lg border border-[var(--line)] text-lg font-bold text-[var(--ink-950)]"
                    >
                      +
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

export function MenuSelectionActions() {
  const { addState, addMessage, addSelected } = useMenuSelectionContext();

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)]/85 p-4">
      <h3 className="text-xl text-[var(--ink-950)]">Agregar seleccion a la cuenta</h3>
      <p className="mt-1 text-sm text-[var(--ink-700)]">
        Puedes agregar tus articulos y despues pagar lo tuyo o tambien lo de alguien mas.
      </p>
      <button
        type="button"
        disabled={addState === "adding"}
        onClick={addSelected}
        className="raise-hover mt-3 min-h-11 w-full rounded-xl bg-[var(--accent-jade)] px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {addState === "adding" ? "Agregando..." : "Agregar a cuenta compartida"}
      </button>
      {addMessage && <p className="mt-2 text-sm font-semibold text-[var(--ink-950)]">{addMessage}</p>}
    </div>
  );
}
