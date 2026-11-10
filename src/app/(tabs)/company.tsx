import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Badge,
  Button,
  ChannelPicker,
  Confirm,
  Field,
  Glyph,
  HeroCard,
  MetricRow,
  Panel,
  PageTitle,
  PayToCard,
  PAYMENT_CHANNELS,
  RefreshButton,
  Screen,
  Sheet,
  StatTile,
} from "@/components/kit";
import {
  ApiError,
  dateLabel,
  fetchSubscriptionEntry,
  money,
  num,
  recordSubscription,
  type EligibleBranch,
  type SubscriptionEntry,
} from "@/lib/api";
import { refreshScope } from "@/lib/scope";
import { useSession } from "@/lib/session";
import { branchKind, C, G, kindTone, radius, subscriptionTone } from "@/lib/theme";

export default function Company() {
  const { session, reload, signOut, state } = useSession();

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [entry, setEntry] = useState<SubscriptionEntry | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [channel, setChannel] = useState("TELEBIRR");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [txn, setTxn] = useState("");
  const [subFields, setSubFields] = useState<Record<string, string>>({});
  const [signingOut, setSigningOut] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);

  const loadEntry = useCallback(async () => {
    try {
      const data = await fetchSubscriptionEntry();
      setEntry(data);
      setSelected((prev) => {
        const valid = prev.filter((id) =>
          data.branches.some((branch) => branch.id === id),
        );
        return valid.length ? valid : data.branches.map((branch) => branch.id);
      });
    } catch {
      // The session panel still shows the subscription if this read fails.
    }
  }, []);

  useEffect(() => {
    void loadEntry();
  }, [loadEntry]);

  async function refreshAll() {
    setRefreshing(true);
    try {
      await Promise.all([reload(), loadEntry()]);
    } finally {
      setRefreshing(false);
    }
  }

  if (!session) {
    return (
      <Screen header={<PageTitle eyebrow="Company" title="Company" icon="store" stops={G.stock} />}>
        <Panel>
          {state === "booting" ? (
            <Text style={styles.note}>Loading your company…</Text>
          ) : (
            <Text style={styles.note}>No company attached to this account yet.</Text>
          )}
        </Panel>
      </Screen>
    );
  }

  const { company, subscription, user, counts } = session;
  const tone = subscriptionTone(subscription.state);

  async function pay() {
    if (selected.length === 0) {
      setNotice("Select at least one branch to renew.");
      return;
    }
    setBusy(true);
    setSubFields({});
    setNotice("");
    try {
      const body = await recordSubscription(selected, channel, txn.trim());
      setNotice(body.message);
      setTxn("");
      await loadEntry();
      await reload();
      refreshScope();
    } catch (cause) {
      if (cause instanceof ApiError) {
        setSubFields(cause.fields);
        setNotice(cause.fields.message ?? cause.message);
      } else {
        setNotice("Could not submit the payment.");
      }
    } finally {
      setBusy(false);
    }
  }

  const eligible: EligibleBranch[] = entry?.branches ?? [];
  const eligibleIds = eligible.map((branch) => branch.id);
  const allSelected =
    eligibleIds.length > 0 && eligibleIds.every((id) => selected.includes(id));
  const total = eligible
    .filter((branch) => selected.includes(branch.id))
    .reduce((sum, branch) => sum + Number(branch.annual_fee), 0);

  function toggleBranch(id: number) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }

  function toggleAll() {
    setSelected(allSelected ? [] : eligibleIds);
  }

  async function doSignOut() {
    setSigningOut(true);
    await signOut();
  }

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={refreshAll}
      header={
        <PageTitle
          eyebrow="Company"
          title={company.name}
          subtitle={`${counts.branches} branch${counts.branches === 1 ? "" : "es"} · ${counts.staff} staff · ${counts.lots} lots`}
          icon="store"
          stops={G.stock}
          right={<RefreshButton stops={G.stock} busy={refreshing} onPress={refreshAll} />}
        />
      }
    >
      <HeroCard
        eyebrow="Subscription"
        value={subscription.expires_on ? `Until ${dateLabel(subscription.expires_on)}` : "Not paid yet"}
        caption={
          subscription.state === "unpaid"
            ? "Enter the bank transaction number below to start the yearly cover."
            : `${money(subscription.annual_fee)} a year · last paid ${dateLabel(subscription.paid_on)}`
        }
        stops={tone.stops}
        badge={<Badge label={tone.label} tone={tone} />}
      />

      {notice ? (
        <View style={styles.notice}>
          <Glyph name="check" size={15} color={C.emerald} />
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      <Panel
        title="Yearly subscription"
        subtitle="Choose the branches and record the payment reference"
        icon="gift"
        stops={G.stock}
      >
        <View style={{ gap: 12 }}>
          <Text style={styles.fieldLabel}>Branches to renew</Text>
          <Pressable
            onPress={() => setPickerOpen(true)}
            style={({ pressed }) => [styles.combo, pressed && { opacity: 0.85 }]}
          >
            <Glyph name="branch" size={17} color={C.textFaint} />
            <View style={{ flex: 1 }}>
              <Text style={styles.comboValue}>
                {selected.length === 0
                  ? "Select branches"
                  : `${selected.length} of ${eligible.length} branch${
                      eligible.length === 1 ? "" : "es"
                    } selected`}
              </Text>
              <Text style={styles.comboHint}>
                {eligible.length === 0
                  ? "No branch is currently eligible for renewal."
                  : `${money(total)} for one year`}
              </Text>
            </View>
            <Glyph name="chevron" size={16} color={C.textMuted} />
          </Pressable>
          {subFields.branches ? (
            <Text style={styles.errorText}>{subFields.branches}</Text>
          ) : null}

          <Text style={styles.fieldLabel}>Payment channel</Text>
          <ChannelPicker
            options={PAYMENT_CHANNELS}
            value={channel}
            onChange={setChannel}
            stops={G.revenue}
          />

          <PayToCard
            amount={total > 0 ? money(total) : undefined}
            note="Deposit the yearly total, then enter the transaction number below."
          />

          <Field
            label="Transaction number"
            value={txn}
            onChangeText={setTxn}
            placeholder="BOA-2026-000123"
            icon="receipt"
            hint="The reference your bank gave you when you paid the yearly fee."
            error={subFields.transaction_ref ?? subFields.transaction_id ?? subFields.txn}
          />
          <Button
            label={subscription.expires_on ? "Send renewal for approval" : "Send payment for approval"}
            icon="save"
            stops={G.stock}
            onPress={pay}
            loading={busy}
            disabled={txn.trim().length < 3 || selected.length === 0}
          />
          <Text style={styles.note}>
            Apex reviews the reference before any selected branch is extended. Branches left
            out stay unpaid and can be renewed later.
          </Text>
        </View>
      </Panel>

      {entry && entry.pending_requests.length > 0 ? (
        <Panel
          title="Payments waiting on Apex"
          subtitle="Selected branches renew only after approval"
          icon="receipt"
          stops={G.slate}
        >
          {entry.pending_requests.map((request) => (
            <View key={request.id} style={styles.requestBlock}>
              <MetricRow
                label={`${request.branches.length} branch${
                  request.branches.length === 1 ? "" : "es"
                }`}
                value={money(request.amount)}
                icon="money"
                color={C.amber}
                strong
              />
              <Text style={styles.requestMeta}>
                {request.channel_label} · {request.transaction_ref} · submitted{" "}
                {dateLabel(request.submitted_at)}
              </Text>
              <View style={styles.requestBranches}>
                {request.branches.map((line) => (
                  <Badge
                    key={line.line_id}
                    label={line.name}
                    tone={kindTone(branchKind(line.is_main))}
                  />
                ))}
              </View>
            </View>
          ))}
        </Panel>
      ) : null}

      <Panel
        title="Company details"
        subtitle="Managed by your VoloSync representative"
        icon="store"
        stops={G.hero}
      >
        <MetricRow label="Legal name" value={company.name} icon="store" />
        <MetricRow label="TIN" value={company.tin || "not set"} icon="receipt" />
        <MetricRow label="Phone" value={company.phone || "not set"} icon="phone" />
        <MetricRow label="Address" value={company.address || "not set"} icon="pin" />
        <MetricRow
          label="VAT rate"
          value={`${num(company.vat_rate, 2)}%`}
          icon="tax"
          color={C.cyan}
          strong
        />
      </Panel>

      <View style={styles.grid}>
        <StatTile
          label="Inventory module"
          value={company.module_inventory ? "Enabled" : "Off"}
          icon="box"
          stops={company.module_inventory ? G.revenue : G.slate}
        />
        <StatTile
          label="HR module"
          value={company.module_hr ? "Enabled" : "Off"}
          icon="agents"
          stops={company.module_hr ? G.agents : G.slate}
        />
      </View>
      <View style={styles.grid}>
        <StatTile
          label="Sales role"
          value={company.sales_role_enabled ? "Enabled" : "Off"}
          hint="Agents can settle sales"
          icon="badge"
          stops={company.sales_role_enabled ? G.branch : G.slate}
        />
        <StatTile
          label="Main branch"
          value={company.is_main ? company.name : "A branch holds it"}
          hint={
            company.is_main
              ? "The company root heads the network"
              : "The root is a satellite until promoted"
          }
          icon="star"
          stops={G.gold}
        />
      </View>

      <Panel title="Owner account" icon="person" stops={G.slate}>
        <MetricRow label="Name" value={user.name || user.username} icon="person" />
        <MetricRow label="Username" value={user.username} icon="badge" />
        <MetricRow label="Email" value={user.email || "not set"} icon="receipt" />
        <MetricRow label="Role" value={user.role || "OWNER"} icon="key" color={C.violet} />
        <View style={{ marginTop: 12 }}>
          <Button
            label="Sign out"
            icon="signout"
            variant="danger"
            onPress={() => setConfirmOut(true)}
            loading={signingOut}
          />
        </View>
      </Panel>

      <Text style={styles.footer}>
        Modules and billing are managed by your VoloSync representative. Ask them to change what is
        switched on.
      </Text>

      <View style={{ height: 96 }} />

      <Sheet
        visible={pickerOpen}
        title="Branches to renew"
        subtitle={`${selected.length} of ${eligible.length} selected · ${money(total)} a year`}
        icon="branch"
        stops={G.stock}
        onClose={() => setPickerOpen(false)}
      >
        <Pressable
          onPress={toggleAll}
          style={({ pressed }) => [
            styles.pickerRow,
            styles.pickerAll,
            pressed && { opacity: 0.85 },
          ]}
        >
          <View style={[styles.check, allSelected && styles.checkOn]}>
            {allSelected ? <Glyph name="check" size={13} color={C.white} /> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pickerName}>Select all</Text>
            <Text style={styles.pickerMeta}>
              {eligible.length} eligible branch{eligible.length === 1 ? "" : "es"}
            </Text>
          </View>
          <Text style={styles.pickerFee}>{money(total)}</Text>
        </Pressable>

        {eligible.map((branch) => {
          const on = selected.includes(branch.id);
          return (
            <Pressable
              key={branch.id}
              onPress={() => toggleBranch(branch.id)}
              style={({ pressed }) => [styles.pickerRow, pressed && { opacity: 0.85 }]}
            >
              <View style={[styles.check, on && styles.checkOn]}>
                {on ? <Glyph name="check" size={13} color={C.white} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.pickerName} numberOfLines={1}>
                    {branch.name}
                  </Text>
                  <Badge
                    label={branch.is_main ? "Main" : "Satellite"}
                    tone={kindTone(branch.is_main ? "main" : "satellite")}
                  />
                </View>
                <Text style={styles.pickerMeta} numberOfLines={1}>
                  TIN {branch.tin} ·{" "}
                  {branch.expires_on ? `paid until ${dateLabel(branch.expires_on)}` : "not paid yet"}
                </Text>
              </View>
              <Text style={styles.pickerFee}>{money(branch.annual_fee)}</Text>
            </Pressable>
          );
        })}

        {eligible.length === 0 ? (
          <Text style={styles.note}>
            No branch is eligible right now — billing holds, zero-fee branches and
            illustration satellites are skipped.
          </Text>
        ) : null}

        <View style={{ marginTop: 8 }}>
          <Button label="Done" icon="check" stops={G.stock} onPress={() => setPickerOpen(false)} />
        </View>
      </Sheet>

      <Confirm
        visible={confirmOut}
        title="Sign out?"
        body="You will need your owner username and password to come back in."
        confirmLabel="Sign out"
        busy={signingOut}
        onCancel={() => setConfirmOut(false)}
        onConfirm={doSignOut}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  fieldLabel: {
    color: C.textMuted,
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  combo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  comboValue: { color: C.text, fontSize: 13.5, fontWeight: "700" },
  comboHint: { color: C.textMuted, fontSize: 12, marginTop: 2 },
  requestBlock: {
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  requestMeta: { color: C.textMuted, fontSize: 12 },
  requestBranches: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  pickerAll: { borderColor: C.borderStrong },
  pickerName: { color: C.text, fontSize: 13.5, fontWeight: "700", flexShrink: 1 },
  pickerMeta: { color: C.textMuted, fontSize: 11.5, marginTop: 2 },
  pickerFee: { color: C.emerald, fontSize: 12.5, fontWeight: "800", fontVariant: ["tabular-nums"] },
  check: {
    width: 22,
    height: 22,
    borderRadius: radius.xs,
    borderWidth: 1.5,
    borderColor: C.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { backgroundColor: C.violet, borderColor: C.violet },
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
  note: { color: C.textMuted, fontSize: 12.5, lineHeight: 18 },
  errorText: { color: C.rose, fontSize: 12.5, fontWeight: "700" },
  footer: { color: C.textFaint, fontSize: 11.5, lineHeight: 17, textAlign: "center" },
});
