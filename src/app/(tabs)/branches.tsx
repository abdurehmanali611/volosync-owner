import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Badge,
  Button,
  ChannelPicker,
  CheckRow,
  Confirm,
  EmptyState,
  ErrorState,
  Field,
  Glyph,
  IconButton,
  LoadingState,
  Panel,
  PageTitle,
  PayToCard,
  PAYMENT_CHANNELS,
  Screen,
  Sheet,
  StatTile,
  ToggleRow,
} from "@/components/kit";
import {
  ApiError,
  createBranch,
  fetchBranches,
  makeBranchMain,
  money,
  num,
  removeBranch,
  resetManagerPassword,
  updateBranch,
  type BranchCatalogPlan,
  type BranchDirectory,
  type BranchRequest,
  type BranchRow,
} from "@/lib/api";
import { refreshScope } from "@/lib/scope";
import { branchKind, C, G, kindTone, radius } from "@/lib/theme";

type FormState = {
  name: string;
  tin: string;
  manager_name: string;
  username: string;
  password: string;
  is_main: boolean;
  module_inventory: boolean;
  module_hr: boolean;
  sales_role_enabled: boolean;
  setup_channel: string;
  setup_transaction_ref: string;
};

const BLANK: FormState = {
  name: "",
  tin: "",
  manager_name: "",
  username: "",
  password: "",
  is_main: false,
  module_inventory: true,
  module_hr: true,
  sales_role_enabled: false,
  setup_channel: "TELEBIRR",
  setup_transaction_ref: "",
};

export default function Branches() {
  const router = useRouter();
  const [directory, setDirectory] = useState<BranchDirectory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BranchRow | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<BranchRow | null>(null);

  const load = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);
    try {
      setDirectory(await fetchBranches());
      setError("");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not load your branches.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // The directory request starts outside the mount commit so the first render
    // paints the loading state instead of blocking on a synchronous write.
    let alive = true;
    queueMicrotask(() => {
      if (alive) void load("initial");
    });
    return () => {
      alive = false;
    };
  }, [load]);

  function openCreate() {
    setForm(BLANK);
    setFields({});
    setNotice("");
    setEditing(null);
    setCreating(true);
  }

  function openEdit(branch: BranchRow) {
    setForm({
      name: branch.name,
      tin: branch.tin,
      manager_name: branch.manager?.name ?? "",
      username: branch.manager?.username ?? "",
      password: "",
      is_main: branch.is_main,
      module_inventory: branch.module_inventory,
      module_hr: branch.module_hr,
      sales_role_enabled: branch.sales_role_enabled,
      setup_channel: "TELEBIRR",
      setup_transaction_ref: "",
    });
    setFields({});
    setNotice("");
    setCreating(false);
    setEditing(branch);
  }

  function closeSheets() {
    setCreating(false);
    setEditing(null);
  }

  async function submitCreate() {
    setBusy(true);
    setFields({});
    try {
      const body = await createBranch({
        name: form.name.trim(),
        tin: form.tin.trim(),
        username: form.username.trim() || undefined,
        password: form.password || undefined,
        manager_name: form.manager_name.trim(),
        is_main: false,
        module_inventory: form.module_inventory,
        module_hr: form.module_hr,
        sales_role_enabled: form.sales_role_enabled,
        setup_channel: form.setup_channel,
        setup_transaction_ref: form.setup_transaction_ref.trim(),
      });
      setNotice(body.message);
      setForm(BLANK);
      setCreating(false);
      await load("refresh");
      void refreshScope();
    } catch (cause) {
      if (cause instanceof ApiError) {
        setFields(cause.fields);
        setNotice(cause.fields.message ?? cause.message);
      } else {
        setNotice("Could not file the branch request.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function submitEdit() {
    if (!editing) return;
    setBusy(true);
    setFields({});
    try {
      const body = await updateBranch(editing.id, {
        name: form.name.trim(),
        tin: form.tin.trim(),
        is_main: form.is_main,
      });
      setNotice(body.message);
      await load("refresh");
      void refreshScope();
    } catch (cause) {
      if (cause instanceof ApiError) {
        setFields(cause.fields);
        setNotice(cause.fields.message ?? cause.message);
      } else {
        setNotice("Could not save the branch.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function submitPassword() {
    if (!editing) return;
    setBusy(true);
    setFields({});
    try {
      const body = await resetManagerPassword(editing.id, form.password);
      setNotice(body.message);
      setForm({ ...form, password: "" });
      await load("refresh");
    } catch (cause) {
      setNotice(cause instanceof ApiError ? cause.message : "Could not reset the password.");
      if (cause instanceof ApiError) setFields(cause.fields);
    } finally {
      setBusy(false);
    }
  }

  async function submitDelete() {
    if (!confirming) return;
    setBusy(true);
    try {
      const body = await removeBranch(confirming.id);
      setNotice(body.message);
      setConfirming(null);
      setEditing(null);
      await load("refresh");
      void refreshScope();
    } catch (cause) {
      setNotice(cause instanceof ApiError ? cause.message : "Could not remove the branch.");
      setConfirming(null);
    } finally {
      setBusy(false);
    }
  }

  async function promote(branch: BranchRow) {
    setBusy(true);
    setFields({});
    try {
      const body = await makeBranchMain(branch.id);
      setNotice(`${body.data.name} is now the main branch.`);
      await load("refresh");
      void refreshScope();
    } catch (cause) {
      setNotice(cause instanceof ApiError ? cause.message : "Could not change the main branch.");
    } finally {
      setBusy(false);
    }
  }

  const rows = directory?.branches ?? [];
  const summary = directory?.summary;
  const openRequests = (directory?.requests ?? []).filter((request) => request.status !== "APPROVED");
  const createPricing = priceForModules(
    directory?.catalog ?? [],
    form.module_inventory,
    form.module_hr,
    form.sales_role_enabled,
  );

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={() => load("refresh")}
      header={
        <PageTitle
          eyebrow="Network"
          title="Branches"
          subtitle={
            directory
              ? `${summary?.branches ?? 0} branch${summary?.branches === 1 ? "" : "es"} · main is ${summary?.main ?? "unset"}`
              : "Loading your branch network"
          }
          icon="branch"
          stops={G.branch}
          right={<IconButton icon="plus" stops={G.branch} onPress={openCreate} label="Add branch" />}
        />
      }
    >
      {loading ? <LoadingState label="Loading branches" /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => load("refresh")} /> : null}

      {directory ? (
        <>
          <View style={styles.grid}>
            <StatTile label="Branches" value={num(summary?.branches ?? 0)} icon="branch" stops={G.branch} />
            <StatTile
              label="With manager"
              value={num(summary?.with_manager ?? 0)}
              hint={`${summary?.without_manager ?? 0} still unstaffed`}
              icon="person"
              stops={G.agents}
            />
          </View>

          {notice ? (
            <View style={styles.notice}>
              <Glyph name="check" size={15} color={C.emerald} />
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}

          {openRequests.length > 0 ? (
            <Panel title="Branch requests" icon="branch" stops={G.slate}>
              <Text style={styles.sheetNote}>
                Apex creates the branch only after it approves the request and its setup payment.
              </Text>
              {openRequests.map((request) => (
                <BranchRequestCard key={request.id} request={request} />
              ))}
            </Panel>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.rootCard, pressed && { opacity: 0.85 }]}
            onPress={() => router.push("/company")}
          >
            <View style={styles.rootIcon}>
              <Glyph name="store" size={17} color={C.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rootLabel}>HEAD OFFICE</Text>
              <Text style={styles.rootName}>{directory.company.name}</Text>
              <Text style={styles.rootSub}>
                TIN {directory.company.tin || "not set"} · VAT {num(directory.company.vat_rate, 2)}%
              </Text>
            </View>
            <Glyph name="chevron" size={14} color={C.textFaint} />
          </Pressable>

          {rows.length === 0 ? (
            <Panel>
              <EmptyState
                icon="branch"
                title="No branches yet"
                subtitle="The main branch ships with your company. Add satellite branches and give their managers a login."
                action={<Button label="Create a branch" icon="plus" stops={G.branch} onPress={openCreate} />}
              />
            </Panel>
          ) : (
            rows.map((branch) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                busy={busy}
                onEdit={() => openEdit(branch)}
                onPromote={() => promote(branch)}
              />
            ))
          )}

          <View style={{ height: 96 }} />
        </>
      ) : null}

      <Sheet
        visible={creating}
        title="New branch"
        subtitle="Its own TIN, its own manager login"
        icon="plus"
        stops={G.branch}
        onClose={closeSheets}
      >
        <Text style={styles.sheetNote}>
          Your company already has a main branch. New branches join the network as satellites.
        </Text>
        <Field
          label="Branch name"
          value={form.name}
          onChangeText={(text) => setForm({ ...form, name: text })}
          placeholder="Bole branch"
          icon="branch"
          autoCapitalize="words"
          error={fields.name}
        />
        <Field
          label="Branch TIN"
          value={form.tin}
          onChangeText={(text) => setForm({ ...form, tin: text })}
          placeholder="1234567890"
          icon="receipt"
          keyboardType="number-pad"
          hint="A branch never shares the company TIN."
          error={fields.tin}
        />
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Modules</Text>
        <Text style={styles.sheetNote}>
          The catalog prices the setup and yearly fees from these selections.
        </Text>
        <CheckRow
          label="Inventory"
          hint="Stock, lots, and movement tracking."
          icon="box"
          value={form.module_inventory}
          onValueChange={(next) => setForm({ ...form, module_inventory: next })}
        />
        <CheckRow
          label="HR module"
          hint="Staff records, roles, and payroll."
          icon="agents"
          value={form.module_hr}
          onValueChange={(next) => setForm({ ...form, module_hr: next })}
        />
        <CheckRow
          label="Sales role"
          hint="Agents can record settlements."
          icon="badge"
          value={form.sales_role_enabled}
          onValueChange={(next) => setForm({ ...form, sales_role_enabled: next })}
        />
        <FeePreview pricing={createPricing} />

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Branch manager</Text>
        <Field
          label="Manager name"
          value={form.manager_name}
          onChangeText={(text) => setForm({ ...form, manager_name: text })}
          placeholder="Full name"
          icon="person"
          autoCapitalize="words"
        />
        <Field
          label="Username"
          value={form.username}
          onChangeText={(text) => setForm({ ...form, username: text })}
          placeholder="bole.manager"
          icon="badge"
          error={fields.username}
        />
        <Field
          label="Password"
          value={form.password}
          onChangeText={(text) => setForm({ ...form, password: text })}
          placeholder="At least 6 characters"
          icon="key"
          secure
          error={fields.password}
        />

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Setup payment</Text>
        <Text style={styles.sheetNote}>
          Pay the one-time setup fee now. Apex checks this receipt before the branch is created.
        </Text>
        <PayToCard amount={createPricing ? money(createPricing.setup) : undefined} />
        <ChannelPicker
          options={PAYMENT_CHANNELS}
          value={form.setup_channel}
          onChange={(key) => setForm({ ...form, setup_channel: key })}
          stops={G.revenue}
        />
        {fields.setup_channel ? <Text style={styles.fieldError}>{fields.setup_channel}</Text> : null}
        <Field
          label="Setup transaction number"
          value={form.setup_transaction_ref}
          onChangeText={(text) => setForm({ ...form, setup_transaction_ref: text })}
          placeholder="BOA-2026-000123"
          icon="receipt"
          hint="The reference your bank or Telebirr gave you for the setup fee."
          error={fields.setup_transaction_ref}
        />

        <Button label="Send branch for approval" icon="plus" stops={G.branch} onPress={submitCreate} loading={busy} />
      </Sheet>

      <Sheet
        visible={Boolean(editing)}
        title={editing?.name ?? "Branch"}
        subtitle={
          editing
            ? `${kindTone(branchKind(editing.is_main)).label} branch · TIN ${editing.tin || "not set"}`
            : ""
        }
        icon="edit"
        stops={G.branch}
        onClose={closeSheets}
      >
        <Field
          label="Branch name"
          value={form.name}
          onChangeText={(text) => setForm({ ...form, name: text })}
          icon="branch"
          autoCapitalize="words"
          error={fields.name}
        />
        <Field
          label="Branch TIN"
          value={form.tin}
          onChangeText={(text) => setForm({ ...form, tin: text })}
          icon="receipt"
          keyboardType="number-pad"
          error={fields.tin}
        />
        <ToggleRow
          label="Main branch"
          hint={
            editing?.is_main
              ? "This is the main branch. Promote another one first to demote it."
              : "Promote this branch to take over as the company head."
          }
          value={form.is_main}
          onValueChange={(next) => setForm({ ...form, is_main: next })}
          disabled={Boolean(editing?.is_main)}
        />

        {notice ? <Text style={styles.sheetNote}>{notice}</Text> : null}

        <Button label="Save branch" icon="save" stops={G.hero} onPress={submitEdit} loading={busy} />

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Manager login</Text>
        <Text style={styles.sheetNote}>
          {editing?.manager
            ? `${editing.manager.name || editing.manager.username} signs in as “${editing.manager.username}”. Set a new password if they lost it.`
            : "This branch has no manager login yet. Create one from the head office console."}
        </Text>
        <Field
          label="New password"
          value={form.password}
          onChangeText={(text) => setForm({ ...form, password: text })}
          placeholder="At least 6 characters"
          icon="key"
          secure
          error={fields.password}
        />
        <Button
          label="Reset manager password"
          icon="bolt"
          variant="ghost"
          onPress={submitPassword}
          loading={busy}
          disabled={!editing?.manager || form.password.length < 6}
        />

        <View style={styles.divider} />
        <Button
          label="Remove branch"
          icon="trash"
          variant="danger"
          onPress={() => {
            if (editing) setConfirming(editing);
          }}
        />
      </Sheet>

      <Confirm
        visible={Boolean(confirming)}
        title={`Remove ${confirming?.name ?? "branch"}?`}
        body="The branch and its manager login are deleted. This is refused while the branch still holds stock lots or settlements."
        confirmLabel="Remove branch"
        busy={busy}
        onCancel={() => setConfirming(null)}
        onConfirm={submitDelete}
      />
    </Screen>
  );
}

type ModulePricing = {
  plan: BranchCatalogPlan;
  setup: number;
  yearly: number;
  exact: boolean;
};

/** Mirror of the backend catalog rule: exact plan first, else base + add-ons. */
function priceForModules(
  catalog: BranchCatalogPlan[],
  inventory: boolean,
  hr: boolean,
  sales: boolean,
): ModulePricing | null {
  if (catalog.length === 0) return null;
  const exact = catalog.find(
    (plan) =>
      plan.module_inventory === inventory &&
      plan.module_hr === hr &&
      plan.sales_role_enabled === sales,
  );
  const plan = exact ?? catalog.find((row) => row.is_default) ?? catalog[0];
  if (!plan) return null;
  const yearly = exact
    ? Number(plan.yearly_fee)
    : Number(plan.yearly_base_fee ?? plan.yearly_fee) +
      (inventory ? Number(plan.inventory_yearly_fee ?? 0) : 0) +
      (hr ? Number(plan.hr_yearly_fee ?? 0) : 0) +
      (sales ? Number(plan.sales_role_yearly_fee ?? 0) : 0);
  return {
    plan,
    setup: Number(plan.setup_fee),
    yearly,
    exact: Boolean(exact),
  };
}

function FeePreview({ pricing }: { pricing: ModulePricing | null }) {
  return (
    <View style={styles.feeCard}>
      <View style={styles.feeHead}>
        <View style={styles.feeIcon}>
          <Glyph name="money" size={14} color={C.emerald} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.feeEyebrow}>PRICING CATALOG</Text>
          <Text style={styles.feePlan} numberOfLines={1}>
            {pricing?.plan.name ?? "No active plan"}
          </Text>
        </View>
        {pricing ? (
          <View style={styles.feeTag}>
            <Text style={styles.feeTagText}>
              {pricing.exact ? "Plan match" : "Base + add-ons"}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.feeGrid}>
        <View style={styles.feeTile}>
          <Text style={styles.feeLabel}>Setup fee</Text>
          <Text style={styles.feeValue}>{pricing ? money(pricing.setup) : "—"}</Text>
          <Text style={styles.feeHint}>one-time</Text>
        </View>
        <View style={styles.feeTile}>
          <Text style={styles.feeLabel}>Yearly fee</Text>
          <Text style={styles.feeValue}>{pricing ? money(pricing.yearly) : "—"}</Text>
          <Text style={styles.feeHint}>per year</Text>
        </View>
      </View>
      <Text style={styles.feeNote}>
        {pricing
          ? pricing.exact
            ? `Priced from ${pricing.plan.name} for this module mix.`
            : `No plan matches this exact mix, so the ${pricing.plan.name} base fee plus module add-ons is quoted.`
          : "No active pricing plan yet — Apex will set the fee before approving the branch."}
      </Text>
    </View>
  );
}

function BranchCard({
  branch,
  busy,
  onEdit,
  onPromote,
}: {
  branch: BranchRow;
  busy: boolean;
  onEdit: () => void;
  onPromote: () => void;
}) {
  const tone = kindTone(branchKind(branch.is_main));
  return (
    <Panel style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardName} numberOfLines={1}>
          {branch.name}
        </Text>
        <Badge label={tone.label} tone={tone} icon={branch.is_main ? "star" : "pin"} />
        {!branch.is_root ? (
          <Pressable hitSlop={8} onPress={onEdit} style={styles.cardEdit}>
            <Glyph name="edit" size={15} color={C.violet} />
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.cardSub} numberOfLines={1}>
        TIN {branch.tin || "not set"}
        {branch.address ? ` · ${branch.address}` : ""}
      </Text>

      <View style={styles.cardManager}>
        <View style={styles.managerIcon}>
          <Glyph name="person" size={12} color={branch.manager ? C.cyan : C.textFaint} />
        </View>
        <Text style={styles.managerText} numberOfLines={1}>
          {branch.manager
            ? `${branch.manager.name || branch.manager.username} · ${branch.manager.username}`
            : "No manager login yet"}
        </Text>
      </View>

      <View style={styles.cardStats}>
        <MiniStat label="Revenue" value={money(branch.revenue)} />
        <MiniStat label="Stock" value={money(branch.stock_value)} />
        <MiniStat label="Lots" value={num(branch.lots)} />
        <MiniStat label="Staff" value={num(branch.staff_count)} />
        <MiniStat label="Agents" value={num(branch.agent_count)} />
        <MiniStat
          label="Pending"
          value={num(branch.pending)}
          color={branch.pending ? C.amber : C.textMuted}
        />
      </View>

      {!branch.is_main ? (
        <Button
          label="Make main branch"
          icon="star"
          variant="ghost"
          onPress={onPromote}
          disabled={busy}
          style={{ marginTop: 12 }}
        />
      ) : null}
    </Panel>
  );
}

function BranchRequestCard({ request }: { request: BranchRequest }) {
  const rejected = request.status === "REJECTED";
  const approved = request.status === "APPROVED";
  const tone = rejected
    ? { label: "Declined", fg: C.rose, soft: "rgba(251,113,133,0.15)", stops: G.danger }
    : approved
      ? { label: "Approved", fg: C.emerald, soft: "rgba(52,211,153,0.15)", stops: G.revenue }
      : { label: "Pending", fg: C.amber, soft: "rgba(251,191,36,0.15)", stops: G.stock };

  return (
    <View style={styles.requestCard}>
      <View style={styles.requestHead}>
        <Text style={styles.requestName} numberOfLines={1}>
          {request.name}
        </Text>
        <Badge label={tone.label} tone={tone} />
      </View>
      <Text style={styles.requestMeta} numberOfLines={1}>
        TIN {request.tin} · {request.setup_channel_label} · {request.setup_transaction_ref || "no reference"}
      </Text>
      <Text style={styles.requestMeta}>
        Setup {money(request.setup_amount)} · filed {stamp(request.created_at)}
        {approved
          ? ` · created as TIN ${request.created_branch_tin}`
          : ""}
      </Text>
      {rejected && request.decision_note ? (
        <Text style={styles.requestNote}>Declined: {request.decision_note}</Text>
      ) : null}
    </View>
  );
}

function stamp(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.mini}>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={[styles.miniValue, color ? { color } : null]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(52,211,153,0.12)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.35)",
    borderRadius: radius.sm,
    padding: 11,
  },
  noticeText: { color: C.emerald, fontSize: 12.5, fontWeight: "700", flex: 1 },
  rootCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  rootIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "rgba(139,92,246,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  rootLabel: { color: C.violet, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  rootName: { color: C.text, fontSize: 16, fontWeight: "900", marginTop: 1 },
  rootSub: { color: C.textFaint, fontSize: 11.5, marginTop: 2 },
  card: { paddingVertical: 15 },
  feeCard: {
    gap: 10,
    backgroundColor: "rgba(52,211,153,0.07)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.3)",
    borderRadius: radius.lg,
    padding: 13,
  },
  feeHead: { flexDirection: "row", alignItems: "center", gap: 9 },
  feeIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(52,211,153,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  feeEyebrow: { color: C.emerald, fontSize: 9, fontWeight: "900", letterSpacing: 1.25 },
  feePlan: { color: C.text, fontSize: 13.5, fontWeight: "900", marginTop: 1 },
  feeTag: {
    backgroundColor: "rgba(34,211,238,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.32)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  feeTagText: { color: C.cyan, fontSize: 9.5, fontWeight: "900", letterSpacing: 0.4 },
  feeGrid: { flexDirection: "row", gap: 8 },
  feeTile: {
    flex: 1,
    backgroundColor: C.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 1,
  },
  feeLabel: { color: C.textFaint, fontSize: 9.5, fontWeight: "900", letterSpacing: 0.7 },
  feeValue: {
    color: C.emerald,
    fontSize: 16,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  feeHint: { color: C.textFaint, fontSize: 10.5 },
  feeNote: { color: C.textMuted, fontSize: 11.5, lineHeight: 16 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardName: { color: C.text, fontSize: 17, fontWeight: "900", flexShrink: 1 },
  cardSub: { color: C.textFaint, fontSize: 12, marginTop: 3 },
  cardEdit: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: "rgba(139,92,246,0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  cardManager: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  managerIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: C.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  managerText: { color: C.textMuted, fontSize: 12.5, fontWeight: "700", flex: 1 },
  cardStats: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  mini: {
    width: "31.5%",
    backgroundColor: C.surfaceAlt,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 9,
    gap: 2,
  },
  miniLabel: { color: C.textFaint, fontSize: 9.5, fontWeight: "900", letterSpacing: 0.6 },
  miniValue: { color: C.text, fontSize: 12.5, fontWeight: "900" },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 4 },
  sectionTitle: {
    color: C.violet,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sheetNote: { color: C.textMuted, fontSize: 12.5, lineHeight: 18 },
  fieldError: { color: C.rose, fontSize: 12.5, fontWeight: "700" },
  requestCard: {
    gap: 4,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  requestHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  requestName: { color: C.text, fontSize: 14.5, fontWeight: "800", flexShrink: 1 },
  requestMeta: { color: C.textMuted, fontSize: 12 },
  requestNote: { color: C.rose, fontSize: 12.5, fontWeight: "700", marginTop: 2 },
});
