"use client";

import type { ReactNode } from "react";
import { createContext, use, useCallback, useMemo, useState } from "react";

import { joinTable } from "@/lib/api";

type JoinState = "idle" | "joining";

type TableGuestContextValue = {
  guestName: string;
  memberId: number | null;
  joinMessage: string;
  joinState: JoinState;
  setGuestName: (value: string) => void;
  joinTableNow: () => Promise<void>;
};

const TableGuestContext = createContext<TableGuestContextValue | null>(null);

function useTableGuestContext() {
  const context = use(TableGuestContext);
  if (!context) {
    throw new Error("TableGuest components must be used within TableGuestRoot.");
  }
  return context;
}

type TableGuestRootProps = {
  qrToken: string;
  children: ReactNode;
  onJoined?: () => void;
};

export function TableGuestRoot({ qrToken, children, onJoined }: TableGuestRootProps) {
  const [guestName, setGuestName] = useState("");
  const [memberId, setMemberId] = useState<number | null>(null);
  const [joinMessage, setJoinMessage] = useState("");
  const [joinState, setJoinState] = useState<JoinState>("idle");

  const joinTableNow = useCallback(async () => {
    setJoinState("joining");
    setJoinMessage("");
    try {
      const response = await joinTable(qrToken, guestName);
      setMemberId(response.member.id);
      setJoinMessage(`${response.message} Sesion #${response.session.id} como ${response.member.guestName}.`);
      onJoined?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setJoinMessage(`No fue posible unirte: ${message}`);
    } finally {
      setJoinState("idle");
    }
  }, [qrToken, guestName, onJoined]);

  const value = useMemo<TableGuestContextValue>(
    () => ({
      guestName,
      memberId,
      joinMessage,
      joinState,
      setGuestName,
      joinTableNow
    }),
    [guestName, memberId, joinMessage, joinState, joinTableNow]
  );

  return <TableGuestContext.Provider value={value}>{children}</TableGuestContext.Provider>;
}

export function TableGuestCard({ children }: { children: ReactNode }) {
  return (
    <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--paper)]/80 p-4">
      <h2 className="text-2xl text-[var(--ink-950)]">Identificate en la mesa</h2>
      {children}
    </div>
  );
}

export function TableGuestFields({ children }: { children: ReactNode }) {
  return <div className="mt-3 flex flex-col gap-2 sm:flex-row">{children}</div>;
}

export function TableGuestInput() {
  const { guestName, setGuestName } = useTableGuestContext();
  return (
    <input
      type="text"
      value={guestName}
      onChange={(event) => setGuestName(event.target.value)}
      placeholder="Tu nombre"
      className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-[var(--ink-950)] outline-none transition focus:border-[var(--accent-jade)]"
    />
  );
}

export function TableGuestAction() {
  const { joinState, memberId, joinTableNow } = useTableGuestContext();
  return (
    <button
      type="button"
      disabled={joinState === "joining"}
      onClick={joinTableNow}
      className="raise-hover min-h-11 rounded-xl bg-[var(--accent-jade)] px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {joinState === "joining" ? "Uniendote..." : memberId ? "Actualizar" : "Unirme"}
    </button>
  );
}

export function TableGuestMessage() {
  const { joinMessage } = useTableGuestContext();
  if (!joinMessage) {
    return null;
  }
  return <p className="mt-2 text-sm font-semibold text-[var(--accent-jade)]">{joinMessage}</p>;
}

export function useTableGuest() {
  return useTableGuestContext();
}
