"use client";

import type { ReactNode } from "react";
import { createContext, use, useCallback, useMemo, useState } from "react";

import type { SharedBillResponse } from "@/lib/api";

type SharedLineItem = SharedBillResponse["lineItems"][number];

type RefreshState = "idle" | "pending";

type SharedBillContextValue = {
  bill: SharedBillResponse | null;
  selectedIds: number[];
  toggleLineItem: (lineItemId: number) => void;
  selectMyItems: () => void;
  clearSelection: () => void;
  paymentTotal: number;
  refreshState: RefreshState;
  onRefresh?: () => void;
  currency: (value: number) => string;
};

const SharedBillContext = createContext<SharedBillContextValue | null>(null);

function useSharedBillContext() {
  const context = use(SharedBillContext);
  if (!context) {
    throw new Error("SharedBill components must be used within SharedBillRoot.");
  }
  return context;
}

type SharedBillRootProps = {
  bill: SharedBillResponse | null;
  memberId: number | null;
  children: ReactNode;
  currency: (value: number) => string;
  refreshState?: RefreshState;
  onRefresh?: () => void;
  className?: string;
};

export function SharedBillRoot({
  bill,
  memberId,
  children,
  currency,
  refreshState = "idle",
  onRefresh,
  className
}: SharedBillRootProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggleLineItem = useCallback((lineItemId: number) => {
    setSelectedIds((current: number[]) => {
      if (current.includes(lineItemId)) {
        return current.filter((id: number) => id !== lineItemId);
      }
      return [...current, lineItemId];
    });
  }, []);

  const selectMyItems = useCallback(() => {
    if (!bill || !memberId) {
      return;
    }
    const myIds = bill.lineItems
      .filter((item: SharedLineItem) => item.status === "unpaid" && item.owner?.id === memberId)
      .map((item: SharedLineItem) => item.id);

    setSelectedIds(myIds);
  }, [bill, memberId]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const paymentTotal = useMemo(() => {
    if (!bill) {
      return 0;
    }
    return bill.lineItems
      .filter((item: SharedLineItem) => item.status === "unpaid" && selectedIds.includes(item.id))
      .reduce((sum: number, item: SharedLineItem) => sum + item.totalPriceMxn, 0);
  }, [bill, selectedIds]);

  const value = useMemo<SharedBillContextValue>(
    () => ({
      bill,
      selectedIds,
      toggleLineItem,
      selectMyItems,
      clearSelection,
      paymentTotal,
      refreshState,
      onRefresh,
      currency
    }),
    [bill, selectedIds, toggleLineItem, selectMyItems, clearSelection, paymentTotal, refreshState, onRefresh, currency]
  );

  return (
    <SharedBillContext.Provider value={value}>
      <div className={className}>{children}</div>
    </SharedBillContext.Provider>
  );
}

export function SharedBillSummary() {
  const { bill, currency, refreshState, onRefresh } = useSharedBillContext();
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm font-semibold text-[var(--ink-700)]">
        Pendiente: {currency(bill?.totals.unpaidMxn || 0)}
      </p>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-lg border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[var(--ink-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-jade)] focus-visible:ring-offset-2"
        >
          {refreshState === "pending" ? "Actualizando…" : "Actualizar"}
        </button>
      )}
    </div>
  );
}

export function SharedBillItems() {
  const { bill, selectedIds, toggleLineItem, currency } = useSharedBillContext();

  return (
    <ul className="mt-3 space-y-2">
      {(bill?.lineItems || []).map((lineItem: SharedLineItem) => (
        <li key={lineItem.id} className="rounded-xl border border-[var(--line)] bg-white/90 p-3">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={selectedIds.includes(lineItem.id)}
              disabled={lineItem.status === "paid"}
              onChange={() => toggleLineItem(lineItem.id)}
              className="mt-1 h-4 w-4"
            />
            <div className="w-full">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--ink-950)]">
                  {lineItem.menuItem.name} x{lineItem.quantity}
                </p>
                <p className="text-sm font-bold text-[var(--ink-950)]">
                  {currency(lineItem.totalPriceMxn)}
                </p>
              </div>
              <p className="text-xs text-[var(--ink-700)]">
                De: {lineItem.owner?.guestName || "Anonimo"} | Estado: {lineItem.status}
              </p>
            </div>
          </label>
        </li>
      ))}
    </ul>
  );
}

export function SharedBillSelectMine() {
  const { selectMyItems } = useSharedBillContext();
  return (
    <button
      type="button"
      onClick={selectMyItems}
      className="mt-3 rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-semibold text-[var(--ink-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-jade)] focus-visible:ring-offset-2"
    >
      Seleccionar lo mio
    </button>
  );
}

export function SharedBillSelectionTotal() {
  const { paymentTotal, currency } = useSharedBillContext();
  return (
    <p className="mt-2 font-bold text-[var(--accent-amber)]">Total seleccionado: {currency(paymentTotal)}</p>
  );
}

export function useSharedBill() {
  return useSharedBillContext();
}
