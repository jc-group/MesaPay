"use client";

import { useMemo, useState } from "react";

import { closeTableSession, refundSharedBill } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { isSupabaseConfigured } from "@/lib/supabase-client";
import { useSharedBill } from "@/components/shared-bill";

type TableAdminProps = {
  qrToken: string;
};

type AdminAction = "refund" | "close" | null;

export function TableAdmin({ qrToken }: TableAdminProps) {
  const { bill, onRefresh } = useSharedBill();
  const { user, session, isLoading } = useAuth();
  const [action, setAction] = useState<AdminAction>(null);
  const [state, setState] = useState<"idle" | "working">("idle");
  const [message, setMessage] = useState("");

  const latestPaidOrderId = useMemo(() => {
    const paidIds = (bill?.lineItems || [])
      .map((item) => item.paidOrderId)
      .filter((value): value is number => typeof value === "number");

    if (paidIds.length === 0) {
      return null;
    }
    return Math.max(...paidIds);
  }, [bill]);

  const onConfirm = async () => {
    if (!action) {
      return;
    }
    setState("working");
    setMessage("");
    try {
      if (action === "refund") {
        if (!latestPaidOrderId) {
          throw new Error("No hay ordenes pagadas");
        }
        const response = await refundSharedBill(qrToken, latestPaidOrderId, session?.access_token);
        setMessage(response.message);
      }

      if (action === "close") {
        const response = await closeTableSession(qrToken, session?.access_token);
        setMessage(response.message);
      }

      onRefresh?.();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Error desconocido";
      setMessage(`No fue posible completar la accion: ${detail}`);
    } finally {
      setState("idle");
      setAction(null);
    }
  };

  const onCancel = () => {
    setAction(null);
  };

  const isAdmin = Boolean(user?.app_metadata?.role === "admin");

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)]/85 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg text-[var(--ink-950)] text-balance">Administración de mesa</h3>
          <p className="mt-1 text-xs text-[var(--ink-700)]">
            Acciones sensibles para cerrar mesa o revertir pagos.
          </p>
        </div>
        <span className="rounded-full border border-[var(--line)] px-2 py-1 text-xs text-[var(--ink-700)]">
          Sesión {bill?.session.id ?? "-"}
        </span>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={!latestPaidOrderId || state === "working" || !isAdmin}
          onClick={() => setAction("refund")}
          className="raise-hover min-h-10 rounded-xl bg-[var(--accent-amber)] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-amber)] focus-visible:ring-offset-2"
        >
          Solicitar reembolso
        </button>
        <button
          type="button"
          disabled={state === "working" || !isAdmin}
          onClick={() => setAction("close")}
          className="raise-hover min-h-10 rounded-xl bg-[var(--ink-950)] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-950)] focus-visible:ring-offset-2"
        >
          Cerrar mesa
        </button>
      </div>

      {!isSupabaseConfigured && (
        <p className="mt-2 text-xs text-[var(--ink-700)]">
          Configura Supabase para habilitar acciones administrativas.
        </p>
      )}

      {!isLoading && isSupabaseConfigured && !isAdmin && (
        <p className="mt-2 text-xs text-[var(--ink-700)]">
          Solo perfiles administradores pueden cerrar la mesa o reembolsar pagos.
        </p>
      )}

      {message && (
        <p aria-live="polite" className="mt-2 text-sm font-semibold text-[var(--ink-950)]">
          {message}
        </p>
      )}

      {action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 overscroll-contain">
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-4"
            role="dialog"
            aria-modal="true"
          >
            <h4 className="text-lg font-semibold text-[var(--ink-950)] text-balance">Confirmar accion</h4>
            <p className="mt-2 text-sm text-[var(--ink-700)]">
              {action === "refund"
                ? "Se reembolsará la última orden pagada y la cuenta volverá a estar pendiente."
                : "Se cerrará la mesa y se creará una nueva sesión al siguiente acceso."}
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="min-h-10 rounded-xl border border-[var(--line)] px-4 text-sm font-semibold text-[var(--ink-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-jade)] focus-visible:ring-offset-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={state === "working"}
                className="min-h-10 rounded-xl bg-[var(--accent-jade)] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-jade)] focus-visible:ring-offset-2"
              >
                {state === "working" ? "Procesando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
