import { useSyncExternalStore } from "react";

import { ApiError, dateKey, fetchReports, type DateRange, type Reports } from "./api";

/**
 * The reporting period and branch scope are shared by the Pulse and Reports
 * tabs, and the payload is cached here so flipping between the two tabs never
 * re-fetches. State lives outside React so both tabs read one source of truth.
 * The calendar picks one anchor day; the preset decides the window around it.
 */
type ScopeState = {
  range: string;
  anchor: string;
  branch: number | null;
  data: Reports | null;
  loading: boolean;
  refreshing: boolean;
  error: string;
};

let state: ScopeState = {
  range: "30d",
  anchor: dateKey(new Date()),
  branch: null,
  data: null,
  loading: false,
  refreshing: false,
  error: "",
};

const listeners = new Set<() => void>();
let requestId = 0;
let loadedKey = "";

function emit() {
  for (const listener of listeners) listener();
}

function patch(next: Partial<ScopeState>) {
  state = { ...state, ...next };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The closed window a preset covers around the anchor day. */
function windowFor(range: string, anchor: string): DateRange | null {
  if (range === "all") return null;
  const [year, month] = anchor.split("-").map(Number);
  if (range === "1d") return { start: anchor, end: anchor };
  if (range === "90d") {
    const quarter = Math.floor((month - 1) / 3);
    return {
      start: dateKey(new Date(year, quarter * 3, 1)),
      end: dateKey(new Date(year, quarter * 3 + 3, 0)),
    };
  }
  if (range === "180d") {
    const half = month <= 6 ? 0 : 6;
    return {
      start: dateKey(new Date(year, half, 1)),
      end: dateKey(new Date(year, half + 6, 0)),
    };
  }
  if (range === "365d") {
    return { start: dateKey(new Date(year, 0, 1)), end: dateKey(new Date(year, 11, 31)) };
  }
  return {
    start: dateKey(new Date(year, month - 1, 1)),
    end: dateKey(new Date(year, month, 0)),
  };
}

const key = () =>
  `${state.range}:${state.range === "all" ? "-" : state.anchor}:${state.branch ?? "all"}`;

export function useScope(): ScopeState {
  return useSyncExternalStore(subscribe, () => state);
}

async function load(mode: "initial" | "refresh") {
  const id = ++requestId;
  loadedKey = key();
  if (mode === "refresh") patch({ refreshing: true });
  else patch({ loading: true, refreshing: false });

  try {
    const reports = await fetchReports(state.range, state.branch, windowFor(state.range, state.anchor));
    if (id !== requestId) return;
    patch({ data: reports, error: "", loading: false, refreshing: false });
  } catch (cause) {
    if (id !== requestId) return;
    patch({
      loading: false,
      refreshing: false,
      error: cause instanceof ApiError ? cause.message : "Could not load your numbers.",
    });
  }
}

export function refreshScope() {
  return load("refresh");
}

/** Called when a tab mounts, or after a mutation that changes the numbers. */
export function ensureScope() {
  if (loadedKey !== key() && !state.loading) void load("initial");
}

export function setRange(range: string) {
  if (state.range === range) return;
  patch({ range });
  ensureScope();
}

export function setAnchor(day: string) {
  if (state.anchor === day) return;
  patch({ anchor: day });
  ensureScope();
}

export function setBranchScope(branch: number | null) {
  if (state.branch === branch) return;
  patch({ branch });
  ensureScope();
}

export function resetScope() {
  requestId += 1;
  loadedKey = "";
  patch({ data: null, loading: false, refreshing: false, error: "" });
}
