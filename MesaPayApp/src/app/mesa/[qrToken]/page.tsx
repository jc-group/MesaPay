"use client";

import { useMemo, useTransition } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";

import { getSharedBill, getTableMenu, type SharedBillResponse, type TableMenuResponse } from "@/lib/api";
import {
  MenuSelectionActions,
  MenuSelectionList,
  MenuSelectionRoot
} from "@/components/menu-selection";
import { SharedBillItems, SharedBillRoot, SharedBillSelectMine, SharedBillSummary } from "@/components/shared-bill";
import { CheckoutCard, CheckoutFields, CheckoutRoot, CheckoutStatus, CheckoutSubmit } from "@/components/checkout";
import { TableAdmin } from "@/components/table-admin";
import {
  TableGuestAction,
  TableGuestCard,
  TableGuestFields,
  TableGuestInput,
  TableGuestMessage,
  TableGuestRoot,
  useTableGuest
} from "@/components/table-guest";

function currency(value: number) {
  return `$${value.toFixed(2)} MXN`;
}

export default function TableByQrPage() {
  const params = useParams<{ qrToken: string }>();
  const qrToken = useMemo(() => decodeURIComponent(params.qrToken ?? ""), [params.qrToken]);
  const [isTransitionPending, startTransition] = useTransition();

  const {
    data: menuData,
    error: menuError,
    isLoading: isMenuLoading
  } = useSWR<TableMenuResponse>(
    qrToken ? ["table-menu", qrToken] : null,
    ([, token]: [string, string]) => getTableMenu(token),
    {
      revalidateOnFocus: true,
      dedupingInterval: 3000
    }
  );

  const {
    data: billData,
    mutate: mutateBill,
    isLoading: isBillLoading
  } = useSWR<SharedBillResponse>(
    qrToken ? ["shared-bill", qrToken] : null,
    ([, token]: [string, string]) => getSharedBill(token),
    {
      refreshInterval: 5000,
      refreshWhenHidden: false,
      revalidateOnFocus: true,
      dedupingInterval: 2000
    }
  );


  const refreshBill = () => {
    startTransition(() => {
      void mutateBill();
    });
  };


  const isMenuErrored = Boolean(menuError);
  const menuErrorMessage = menuError instanceof Error ? menuError.message : "Error desconocido";
  const showLoading = (isMenuLoading || isBillLoading) && !menuData;

  return (
    <main
      className="ambient-shell min-h-screen px-4 pb-6 pt-[calc(1.75rem+env(safe-area-inset-top))] md:px-8 md:py-10"
      id="main"
    >
      <a
        className="sr-only focus:not-sr-only focus-visible:rounded-lg focus-visible:bg-white/80 focus-visible:px-3 focus-visible:py-2"
        href="#main"
      >
        Saltar al contenido
      </a>
      <section className="glass-panel mx-auto max-w-5xl rounded-3xl p-4 md:p-8">
        <Link
          className="mb-4 inline-flex text-sm font-semibold text-[var(--accent-jade)] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-jade)] focus-visible:ring-offset-2"
          href="/"
        >
          Regresar al inicio
        </Link>

        {showLoading && <p className="text-[var(--ink-700)]">Cargando mesa virtual…</p>}
        {isMenuErrored && <p className="font-semibold text-[var(--accent-red)]">Error: {menuErrorMessage}</p>}

        {menuData && (
          <TableGuestRoot qrToken={qrToken} onJoined={refreshBill}>
            <TableByQrContent
              menuData={menuData}
              billData={billData}
              isTransitionPending={isTransitionPending}
              refreshBill={refreshBill}
              qrToken={qrToken}
            />
          </TableGuestRoot>
        )}
      </section>
    </main>
  );
}

type TableByQrContentProps = {
  menuData: TableMenuResponse;
  billData: SharedBillResponse | undefined;
  isTransitionPending: boolean;
  refreshBill: () => void;
  qrToken: string;
};

function TableByQrContent({
  menuData,
  billData,
  isTransitionPending,
  refreshBill,
  qrToken
}: TableByQrContentProps) {
  const { memberId } = useTableGuest();

  return (
    <>
      <p className="section-label">Mesa virtual colaborativa</p>
      <h1 className="mt-2 text-3xl leading-tight text-[var(--ink-950)] text-balance md:text-4xl">
        {menuData.restaurant.name}
      </h1>
      <p className="mt-1 text-[var(--ink-700)]">Mesa {menuData.table.number}</p>

      <TableGuestCard>
        <TableGuestFields>
          <TableGuestInput />
          <TableGuestAction />
        </TableGuestFields>
        <TableGuestMessage />
      </TableGuestCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <h2 className="text-3xl text-[var(--ink-950)] text-balance">Menu</h2>
          <MenuSelectionRoot
            menu={menuData.menu}
            qrToken={qrToken}
            memberId={memberId}
            currency={currency}
            onAdded={refreshBill}
          >
            <MenuSelectionList />
            <MenuSelectionActions />
          </MenuSelectionRoot>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl text-[var(--ink-950)] text-balance">Cuenta compartida</h2>
          <SharedBillRoot
            bill={billData || null}
            memberId={memberId}
            currency={currency}
            refreshState={isTransitionPending ? "pending" : "idle"}
            onRefresh={refreshBill}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)]/85 p-4">
              <SharedBillSummary />
              <SharedBillItems />
              <SharedBillSelectMine />
            </div>

            <TableAdmin qrToken={qrToken} />

            <CheckoutRoot qrToken={qrToken} onSuccess={refreshBill}>
              <CheckoutCard>
                <CheckoutFields />
                <CheckoutSubmit />
                <CheckoutStatus />
              </CheckoutCard>
            </CheckoutRoot>
          </SharedBillRoot>
        </div>
      </div>
    </>
  );
}
