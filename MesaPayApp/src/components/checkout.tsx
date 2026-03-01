"use client";

import type { ReactNode } from "react";
import { createContext, use, useCallback, useMemo, useState } from "react";

import { checkoutSharedBill, type CheckoutSharedBillResponse } from "@/lib/api";
import { SharedBillSelectionTotal, useSharedBill } from "@/components/shared-bill";
import { useTableGuest } from "@/components/table-guest";

type PaymentState = "idle" | "processing";

type CheckoutContextValue = {
  cardHolderName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  setCardHolderName: (value: string) => void;
  setCardNumber: (value: string) => void;
  setCardExpiry: (value: string) => void;
  setCardCvv: (value: string) => void;
  paymentState: PaymentState;
  checkoutMessage: string;
  checkoutResult: CheckoutSharedBillResponse | null;
  submitPayment: () => Promise<void>;
};

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

function useCheckoutContext() {
  const context = use(CheckoutContext);
  if (!context) {
    throw new Error("Checkout components must be used within CheckoutRoot.");
  }
  return context;
}

type CheckoutRootProps = {
  qrToken: string;
  children: ReactNode;
  onSuccess?: () => void;
};

export function CheckoutRoot({ qrToken, children, onSuccess }: CheckoutRootProps) {
  const { selectedIds, clearSelection } = useSharedBill();
  const { guestName, memberId } = useTableGuest();
  const [cardHolderName, setCardHolderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [checkoutResult, setCheckoutResult] = useState<CheckoutSharedBillResponse | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");

  const submitPayment = useCallback(async () => {
    setCheckoutMessage("");
    setCheckoutResult(null);

    if (selectedIds.length === 0) {
      setCheckoutMessage("Selecciona conceptos de la cuenta para pagar.");
      return;
    }

    if (!cardHolderName.trim() || !cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim()) {
      setCheckoutMessage("Completa todos los datos de tarjeta.");
      return;
    }

    setPaymentState("processing");
    try {
      const response = await checkoutSharedBill(qrToken, {
        payerMemberId: memberId || undefined,
        guestName,
        lineItemIds: selectedIds,
        card: {
          holderName: cardHolderName,
          number: cardNumber,
          expiry: cardExpiry,
          cvv: cardCvv
        }
      });

      setCheckoutResult(response);
      setCheckoutMessage(response.message);
      clearSelection();
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setCheckoutMessage(`No fue posible procesar el pago: ${message}`);
    } finally {
      setPaymentState("idle");
    }
  }, [
    selectedIds,
    cardHolderName,
    cardNumber,
    cardExpiry,
    cardCvv,
    qrToken,
    memberId,
    guestName,
    clearSelection,
    onSuccess
  ]);

  const value = useMemo<CheckoutContextValue>(
    () => ({
      cardHolderName,
      cardNumber,
      cardExpiry,
      cardCvv,
      setCardHolderName,
      setCardNumber,
      setCardExpiry,
      setCardCvv,
      paymentState,
      checkoutMessage,
      checkoutResult,
      submitPayment
    }),
    [
      cardHolderName,
      cardNumber,
      cardExpiry,
      cardCvv,
      paymentState,
      checkoutMessage,
      checkoutResult,
      submitPayment
    ]
  );

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export function CheckoutCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)]/90 p-4">
      <h3 className="text-xl text-[var(--ink-950)]">Pagar seleccion</h3>
      <p className="mt-1 text-sm text-[var(--ink-700)]">
        Puedes pagar tus conceptos y tambien los de otras personas.
      </p>
      <SharedBillSelectionTotal />
      {children}
    </div>
  );
}

export function CheckoutFields() {
  const { cardHolderName, cardNumber, cardExpiry, cardCvv, setCardHolderName, setCardNumber, setCardExpiry, setCardCvv } =
    useCheckoutContext();

  return (
    <div className="mt-3 grid gap-2">
      <input
        type="text"
        value={cardHolderName}
        onChange={(event) => setCardHolderName(event.target.value)}
        placeholder="Nombre en tarjeta"
        className="rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-[var(--ink-950)] outline-none transition focus:border-[var(--accent-jade)]"
      />
      <input
        type="text"
        value={cardNumber}
        onChange={(event) => setCardNumber(event.target.value)}
        placeholder="Numero de tarjeta"
        className="rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-[var(--ink-950)] outline-none transition focus:border-[var(--accent-jade)]"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={cardExpiry}
          onChange={(event) => setCardExpiry(event.target.value)}
          placeholder="MM/YY"
          className="rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-[var(--ink-950)] outline-none transition focus:border-[var(--accent-jade)]"
        />
        <input
          type="password"
          value={cardCvv}
          onChange={(event) => setCardCvv(event.target.value)}
          placeholder="CVV"
          className="rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-[var(--ink-950)] outline-none transition focus:border-[var(--accent-jade)]"
        />
      </div>
    </div>
  );
}

export function CheckoutSubmit() {
  const { paymentState, submitPayment } = useCheckoutContext();
  return (
    <button
      type="button"
      disabled={paymentState === "processing"}
      onClick={submitPayment}
      className="raise-hover mt-3 min-h-11 w-full rounded-xl bg-[var(--accent-jade)] px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {paymentState === "processing" ? "Procesando pago..." : "Pagar seleccion"}
    </button>
  );
}

export function CheckoutStatus() {
  const { checkoutMessage, checkoutResult } = useCheckoutContext();

  return (
    <>
      {checkoutMessage && <p className="mt-2 text-sm font-semibold text-[var(--ink-950)]">{checkoutMessage}</p>}
      {checkoutResult && (
        <p className="mt-1 text-xs text-[var(--ink-700)]">
          Orden #{checkoutResult.order.id} | {checkoutResult.payment.cardBrand.toUpperCase()} ****
          {checkoutResult.payment.cardLast4}
        </p>
      )}
    </>
  );
}
