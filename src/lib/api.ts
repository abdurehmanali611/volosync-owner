import { dropItem, readItem, writeItem } from "./storage";

const BASE = process.env.EXPO_PUBLIC_API_URL ?? "https://volosync-owner-backend.vercel.app";

const ACCESS_KEY = "volosync-owner.access";
const REFRESH_KEY = "volosync-owner.refresh";

/**
 * Tokens live in memory as well as in secure storage so a request never has to
 * await a Keychain read. The store is populated once, at boot.
 */
let access: string | null = null;
let refresh: string | null = null;
let onSignedOut: (() => void) | null = null;

export function setSignedOutHandler(handler: (() => void) | null) {
  onSignedOut = handler;
}

export async function restoreSession(): Promise<boolean> {
  access = await readItem(ACCESS_KEY);
  refresh = await readItem(REFRESH_KEY);
  return Boolean(access);
}

export async function clearSession() {
  access = null;
  refresh = null;
  await dropItem(ACCESS_KEY);
  await dropItem(REFRESH_KEY);
}

export const hasSession = () => Boolean(access);

export class ApiError extends Error {
  /** Field-level messages from the DRF envelope, keyed by input name. */
  fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.fields = fields;
  }
}

function readEnvelope(body: any): { message: string; fields: Record<string, string> } {
  const errors = body?.errors ?? body ?? {};
  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (typeof value === "string") fields[key] = value;
    else if (Array.isArray(value)) fields[key] = String(value[0] ?? "");
  }
  return { message: fields.message ?? body?.message ?? "Something went wrong.", fields };
}

async function send(path: string, init: RequestInit, withAuth: boolean): Promise<any> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(withAuth && access ? { Authorization: `Bearer ${access}` } : {}),
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(`Cannot reach the VoloSync server at ${BASE}.`);
  }

  if (response.status === 401 && withAuth && refresh) {
    const renewed = await fetch(`${BASE}/api/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    }).catch(() => null);

    if (renewed?.ok) {
      const token = await renewed.json();
      access = token.access ?? null;
      if (token.refresh) {
        refresh = token.refresh;
        await writeItem(REFRESH_KEY, token.refresh);
      }
      if (access) await writeItem(ACCESS_KEY, access);
      return send(path, init, true);
    }

    await clearSession();
    onSignedOut?.();
    throw new ApiError("Your session ended. Sign in again.");
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const { message, fields } = readEnvelope(body);
    throw new ApiError(message, fields);
  }
  return body;
}

const get = <T,>(path: string) => send(path, { method: "GET" }, true) as Promise<T>;
const post = <T,>(path: string, data?: unknown) =>
  send(path, { method: "POST", body: JSON.stringify(data ?? {}) }, true) as Promise<T>;
const patch = <T,>(path: string, data: unknown) =>
  send(path, { method: "PATCH", body: JSON.stringify(data) }, true) as Promise<T>;
const del = <T,>(path: string) => send(path, { method: "DELETE" }, true) as Promise<T>;

/* ------------------------------------------------------------------------- *
 * Formatting — money always trails its currency, per the house style.
 * ------------------------------------------------------------------------- */

export function money(value: string | number | null | undefined): string {
  const amount = Number(value ?? 0);
  return `${amount.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;
}

/** Same figure without decimals, for tiles where space is tight. */
export function moneyShort(value: string | number | null | undefined): string {
  const amount = Number(value ?? 0);
  if (Math.abs(amount) >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M ETB`;
  if (Math.abs(amount) >= 10_000) return `${(amount / 1000).toFixed(1)}K ETB`;
  return money(amount);
}

export function num(value: string | number | null | undefined, digits = 0): string {
  const amount = Number(value ?? 0);
  return amount.toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function dateLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Local YYYY-MM-DD key for a date, safe from UTC drift. */
export function dateKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/* ------------------------------------------------------------------------- *
 * Shapes returned by the owner endpoints in BackEnd/tenants/owner_views.py
 * ------------------------------------------------------------------------- */

export type Manager = {
  user_id: number;
  username: string;
  name: string;
  is_active: boolean;
};

export type Tenant = {
  id: number;
  name: string;
  tin: string;
  phone: string;
  address: string;
  vat_rate: string;
  module_inventory: boolean;
  module_hr: boolean;
  sales_role_enabled: boolean;
  parent: number | null;
  is_main: boolean;
  subscription_expires_on: string | null;
  subscription_transaction_id: string;
};

export type BranchRow = Tenant & {
  is_branch: boolean;
  is_root: boolean;
  kind: "main" | "satellite";
  manager: Manager | null;
  staff_count: number;
  agent_count: number;
  lots: number;
  stock_value: string;
  registered_value: string;
  revenue: string;
  units_sold: string;
  settlements: number;
  pending: number;
  penalties: number;
  penalty_amount: string;
};

export type Subscription = {
  expires_on: string | null;
  paid_on: string | null;
  days_left: number | null;
  state: "unpaid" | "expired" | "due" | "active";
  transaction_id: string;
  annual_fee: string;
};

export type Overview = {
  registered_value: string;
  in_store_value: string;
  stocked_out_value: string;
  registered_units: string;
  in_store_units: string;
  stocked_out_units: string;
  vat_on_stock: string;
  revenue: string;
  units_sold: string;
  vat_collected: string;
  penalties: number;
  penalty_amount: string;
  settlements: number;
  lots: number;
  new_lots: number;
  issued_in_period: string;
  returned_in_period: string;
  cost_of_sold: string;
  selling_of_sold: string;
  gross_profit: string;
  profit_margin: string;
  average_unit_cost: string;
  average_unit_selling: string;
};

export type AgentRow = {
  id: number;
  name: string;
  revenue: string;
  units: string;
  settlements: number;
  penalties: number;
  penalty_amount: string;
  rank: number;
};

export type Reports = {
  tenant: Tenant;
  company: { name: string; tin: string; vat_rate: string; subscription_expires_on: string | null };
  period: { key: string; label: string; start: string | null; end: string | null };
  scope: { branch: number | null; branch_name: string };
  subscription: Subscription;
  overview: Overview;
  pipeline: {
    pending_finance: number;
    pending_manager: number;
    rejected: number;
    expected_amount: string;
    variance: string;
  };
  payment_methods: { method: string; label: string; amount: string; settlements: number }[];
  promotions: { lines: number; units: string };
  movements: { type: string; label: string; lines: number; units: string }[];
  agents: AgentRow[];
  top_items: { name: string; category: string; revenue: string; units: string }[];
  trend: { label: string; date: string; revenue: string; units: string }[];
  branches: BranchRow[];
  main_branch: BranchRow | null;
};

export type Session = {
  user: { id: number; username: string; name: string; email: string; role: string };
  company: Tenant;
  branches: Tenant[];
  counts: { branches: number; staff: number; lots: number };
  subscription: Subscription;
};

export type BranchCatalogPlan = {
  id: number;
  name: string;
  modules: string[];
  module_inventory: boolean;
  module_hr: boolean;
  sales_role_enabled: boolean;
  setup_fee: string;
  yearly_fee: string;
  yearly_base_fee: string;
  inventory_yearly_fee: string;
  hr_yearly_fee: string;
  sales_role_yearly_fee: string;
  is_default: boolean;
};

export type EligibleBranch = {
  id: number;
  tin: string;
  name: string;
  is_main: boolean;
  kind: "main" | "satellite";
  annual_fee: string;
  expires_on: string | null;
  state: string;
};

export type BranchRequest = {
  id: number;
  parent: number;
  name: string;
  tin: string;
  phone: string;
  address: string;
  vat_rate: string;
  module_inventory: boolean;
  module_hr: boolean;
  sales_role_enabled: boolean;
  make_main: boolean;
  manager_name: string;
  manager_username: string;
  setup_channel: string;
  setup_channel_label: string;
  setup_transaction_ref: string;
  setup_amount: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  note: string;
  decision_note: string;
  created_at: string;
  decided_at: string | null;
  created_branch: number | null;
  created_branch_tin: string;
};

export type BranchPaymentLine = {
  line_id: number;
  tenant: number;
  name: string;
  tin: string;
  is_main: boolean;
  amount: string;
  years: number;
  status: "PENDING" | "APPROVED" | "EXCLUDED" | "REJECTED";
  covers_until: string;
  approved_until: string | null;
  decision_note: string;
};

export type BranchPaymentRequest = {
  id: number;
  parent: number;
  transaction_ref: string;
  channel: string;
  channel_label: string;
  years: number;
  amount: string;
  approved_amount: string;
  status: "PENDING" | "APPROVED" | "PARTIALLY_APPROVED" | "REJECTED";
  note: string;
  decision_note: string;
  submitted_at: string | null;
  decided_at: string | null;
  created_at: string;
  branches: BranchPaymentLine[];
  approved_count: number;
};

export type BranchDirectory = {
  company: Tenant;
  rows: BranchRow[];
  branches: BranchRow[];
  subscription: Subscription;
  requests: BranchRequest[];
  payment_requests: BranchPaymentRequest[];
  eligible_branches: EligibleBranch[];
  catalog: BranchCatalogPlan[];
  summary: {
    branches: number;
    with_manager: number;
    without_manager: number;
    active: number;
    main: string;
    pending_requests: number;
  };
};

export type SubscriptionEntry = {
  company: Tenant;
  subscription: Subscription;
  branches: EligibleBranch[];
  pending_requests: BranchPaymentRequest[];
};

export const RANGES = [
  { key: "all", label: "All time" },
  { key: "1d", label: "Daily" },
  { key: "30d", label: "Monthly" },
  { key: "90d", label: "Quarterly" },
  { key: "180d", label: "Half a year" },
  { key: "365d", label: "Annually" },
];

export type DateRange = { start: string; end: string };

/* ------------------------------------------------------------------------- *
 * Endpoints
 * ------------------------------------------------------------------------- */

export async function signIn(username: string, password: string) {
  const body = await send(
    "/api/auth/login/",
    { method: "POST", body: JSON.stringify({ username, password }) },
    false,
  );
  access = body.access ?? null;
  refresh = body.refresh ?? null;
  if (!access) throw new ApiError("The server did not return a session.");
  await writeItem(ACCESS_KEY, access);
  if (refresh) await writeItem(REFRESH_KEY, refresh);
  return body;
}

export const fetchSession = () => get<{ data: Session }>("/api/tenants/owner/session/");

export async function fetchReports(
  range: string,
  branch: number | null,
  dates?: DateRange | null,
): Promise<Reports> {
  const query = new URLSearchParams({ range });
  if (dates) {
    query.set("start", dates.start);
    query.set("end", dates.end);
  }
  if (branch) query.set("branch", String(branch));
  const body = await get<{ data: Reports }>(`/api/tenants/owner/reports/?${query}`);
  return body.data;
}

export const fetchBranches = () =>
  get<{ data: BranchDirectory }>("/api/tenants/owner/branches/").then((body) => body.data);

export type BranchDraft = {
  name: string;
  tin: string;
  phone?: string;
  address?: string;
  vat_rate?: string;
  username?: string;
  password?: string;
  manager_name?: string;
  is_main?: boolean;
  module_inventory?: boolean;
  module_hr?: boolean;
  sales_role_enabled?: boolean;
  setup_channel?: string;
  setup_transaction_ref?: string;
  note?: string;
};

export function createBranch(draft: BranchDraft) {
  return post<{ data: BranchRequest; message: string }>(
    "/api/tenants/owner/branches/",
    draft,
  );
}

export function updateBranch(id: number, patchBody: Partial<BranchDraft> & { vat_rate?: string }) {
  return patch<{ data: BranchRow; message: string }>(`/api/tenants/owner/branches/${id}/`, patchBody);
}

export function makeBranchMain(id: number) {
  return updateBranch(id, { is_main: true });
}

export function removeBranch(id: number) {
  return del<{ data: unknown; message: string }>(`/api/tenants/owner/branches/${id}/`);
}

export function resetManagerPassword(id: number, password: string) {
  return post<{ data: unknown; message: string }>(
    `/api/tenants/owner/branches/${id}/manager/password/`,
    { password },
  );
}

export function recordSubscription(
  branchIds: number[],
  channel: string,
  transactionRef: string,
  years = 1,
) {
  return post<{
    data: {
      request: BranchPaymentRequest;
      branches: EligibleBranch[];
      subscription: Subscription;
    };
    message: string;
  }>("/api/tenants/owner/subscription/", {
    branches: branchIds,
    channel,
    transaction_ref: transactionRef,
    years,
  });
}

export const fetchSubscriptionEntry = () =>
  get<{ data: SubscriptionEntry }>("/api/tenants/owner/subscription/").then(
    (body) => body.data,
  );
