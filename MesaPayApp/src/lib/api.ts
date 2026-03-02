export type HealthResponse = {
  status: string;
  service: string;
};

export type MenuItem = {
  id: number;
  name: string;
  description: string;
  priceMxn: number;
};

export type MenuCategory = {
  id: number;
  name: string;
  items: MenuItem[];
};

export type TableMenuResponse = {
  restaurant: {
    id: number;
    name: string;
  };
  table: {
    id: number;
    number: string;
    qrToken: string;
  };
  session: {
    id: number;
    status: string;
  } | null;
  menu: MenuCategory[];
};

export type JoinTableResponse = {
  message: string;
  session: {
    id: number;
    status: string;
    tableNumber: string;
  };
  member: {
    id: number;
    guestName: string;
  };
};

export type SharedBillResponse = {
  session: {
    id: number;
    tableNumber: string;
  };
  members: Array<{
    id: number;
    guestName: string;
  }>;
  lineItems: Array<{
    id: number;
    status: "unpaid" | "paid";
    quantity: number;
    unitPriceMxn: number;
    totalPriceMxn: number;
    menuItem: {
      id: number;
      name: string;
    };
    owner: {
      id: number;
      guestName: string;
    } | null;
    paidOrderId: number | null;
  }>;
  totals: {
    unpaidMxn: number;
    paidMxn: number;
    grandTotalMxn: number;
  };
};

export type AddItemsToBillInput = {
  memberId?: number;
  items: Array<{
    menuItemId: number;
    quantity: number;
  }>;
};

export type CheckoutSharedBillInput = {
  payerMemberId?: number;
  guestName?: string;
  lineItemIds: number[];
  card: {
    holderName: string;
    number: string;
    expiry: string;
    cvv: string;
  };
};

export type CheckoutSharedBillResponse = {
  message: string;
  order: {
    id: number;
    status: string;
    totalMxn: number;
    currency: string;
    lineItems: Array<{
      lineItemId: number;
      menuItemId: number;
      name: string;
      quantity: number;
      totalPriceMxn: number;
    }>;
  };
  payment: {
    status: string;
    provider: string;
    cardBrand: string;
    cardLast4: string;
    amountMxn: number;
  };
  payer: {
    memberId: number;
    guestName: string;
  };
};

export type RefundSharedBillResponse = {
  message: string;
  order: {
    id: number;
    status: string;
  };
  refundedLineItems: number[];
};

export type CloseTableResponse = {
  message: string;
  session: {
    id: number;
    status: string;
    tableNumber: string;
  };
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:3001";

export async function getBackendHealth(): Promise<HealthResponse> {
  const response = await fetch(`${apiBaseUrl}/health`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Backend health failed: ${response.status}`);
  }

  return (await response.json()) as HealthResponse;
}

export async function getTableMenu(qrToken: string): Promise<TableMenuResponse> {
  const response = await fetch(`${apiBaseUrl}/api/v1/public/tables/${qrToken}/menu`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Table menu failed: ${response.status}`);
  }

  return (await response.json()) as TableMenuResponse;
}

export async function joinTable(qrToken: string, guestName?: string): Promise<JoinTableResponse> {
  const response = await fetch(`${apiBaseUrl}/api/v1/public/tables/${qrToken}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ guestName })
  });

  if (!response.ok) {
    throw new Error(`Join table failed: ${response.status}`);
  }

  return (await response.json()) as JoinTableResponse;
}

export async function getSharedBill(qrToken: string): Promise<SharedBillResponse> {
  const response = await fetch(`${apiBaseUrl}/api/v1/public/tables/${qrToken}/bill`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Shared bill failed: ${response.status}`);
  }

  return (await response.json()) as SharedBillResponse;
}

export async function addItemsToSharedBill(
  qrToken: string,
  payload: AddItemsToBillInput
): Promise<{ message: string }> {
  const response = await fetch(`${apiBaseUrl}/api/v1/public/tables/${qrToken}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Add shared items failed: ${response.status}`);
  }

  return (await response.json()) as { message: string };
}

export async function checkoutSharedBill(
  qrToken: string,
  payload: CheckoutSharedBillInput
): Promise<CheckoutSharedBillResponse> {
  const response = await fetch(`${apiBaseUrl}/api/v1/public/tables/${qrToken}/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Checkout shared bill failed: ${response.status}`);
  }

  return (await response.json()) as CheckoutSharedBillResponse;
}

export async function refundSharedBill(
  qrToken: string,
  orderId: number,
  accessToken?: string
): Promise<RefundSharedBillResponse> {
  const response = await fetch(`${apiBaseUrl}/api/v1/public/tables/${qrToken}/refund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify({ orderId })
  });

  if (!response.ok) {
    throw new Error(`Refund shared bill failed: ${response.status}`);
  }

  return (await response.json()) as RefundSharedBillResponse;
}

export async function closeTableSession(qrToken: string, accessToken?: string): Promise<CloseTableResponse> {
  const response = await fetch(`${apiBaseUrl}/api/v1/public/tables/${qrToken}/close`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    }
  });

  if (!response.ok) {
    throw new Error(`Close table failed: ${response.status}`);
  }

  return (await response.json()) as CloseTableResponse;
}
