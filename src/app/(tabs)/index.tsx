import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  EmptyState,
  ErrorState,
  HeroCard,
  KpiCard,
  LoadingState,
  Panel,
  PageTitle,
  RefreshButton,
  Screen,
} from "@/components/kit";
import {
  AgentBoard,
  BranchCompare,
  BranchScopePicker,
  ItemBoard,
  PeriodPicker,
  ReportKpiStrip,
  RevenueTrend,
  SubscriptionStrip,
} from "@/components/reports-bits";
import { compactMoney, money, num } from "@/lib/api";
import { ensureScope, refreshScope, setAnchor, setBranchScope, setRange, useScope } from "@/lib/scope";
import { useSession } from "@/lib/session";
import { C, G, radius } from "@/lib/theme";

export default function Pulse() {
  const { session } = useSession();
  const scope = useScope();
  const router = useRouter();

  useEffect(() => {
    ensureScope();
  }, []);

  const data = scope.data;
  const busy = scope.loading && !data;

  return (
    <Screen
      refreshing={scope.refreshing}
      onRefresh={refreshScope}
      header={
        <PageTitle
          eyebrow="Company pulse"
          title={data?.company.name ?? session?.company.name ?? "VoloSync"}
          subtitle={
            data
              ? `${data.period.label} · ${data.scope.branch_name}`
              : "Loading your wholesale network"
          }
          icon="overview"
          stops={G.hero}
          right={
            <RefreshButton
              stops={G.hero}
              busy={scope.refreshing}
              onPress={refreshScope}
            />
          }
        />
      }
    >
      {busy ? <LoadingState /> : null}

      {scope.error && !data ? <ErrorState message={scope.error} onRetry={refreshScope} /> : null}

      {data ? (
        <>
          <PeriodPicker
            value={scope.range}
            anchor={scope.anchor}
            onChange={setRange}
            onAnchor={setAnchor}
          />

          <BranchScopePicker rows={data.branches} value={scope.branch} onChange={setBranchScope} />

          <HeroCard
            eyebrow="Revenue collected"
            value={money(data.overview.revenue)}
            caption={`${num(data.overview.settlements)} settlements · ${num(
              data.overview.units_sold,
              2,
            )} units moved off the shelf`}
            stops={G.revenue}
            badge={<Frost label={newLotsLabel(data.overview.new_lots)} />}
          />

          <ReportKpiStrip data={data} />

          <View style={styles.tileGrid}>
            <KpiCard
              label="Stock in store"
              value={compactMoney(data.overview.in_store_value)}
              hint={`${num(data.overview.in_store_units, 2)} units`}
              icon="box"
              tone="emerald"
            />
            <KpiCard
              label="Registered (VAT-incl.)"
              value={compactMoney(data.overview.registered_value)}
              hint={`${num(data.overview.lots)} lots on file`}
              icon="receipt"
              tone="slate"
            />
            <KpiCard
              label="VAT inside sales"
              value={compactMoney(data.overview.vat_collected)}
              hint={`${num(data.company.vat_rate, 2)}% read out of the price`}
              icon="tax"
              tone="sky"
            />
            <KpiCard
              label="Penalties"
              value={compactMoney(data.overview.penalty_amount)}
              hint={`${num(data.overview.penalties)} rulings`}
              icon="warn"
              tone="rose"
            />
          </View>

          <SubscriptionStrip
            subscription={data.subscription}
            onPress={() => router.push("/company")}
          />

          <Panel title="Needs your attention" icon="bolt" stops={G.danger}>
            {data.pipeline.pending_finance + data.pipeline.pending_manager + data.pipeline.rejected === 0 ? (
              <EmptyState
                icon="check"
                title="Queue is clear"
                subtitle="Every settlement raised in this window has a decision."
                compact
              />
            ) : (
              <View style={{ gap: 10 }}>
                <View style={styles.queueRow}>
                  <QueuePill label="Waiting on finance" count={data.pipeline.pending_finance} stops={G.stock} />
                  <QueuePill label="Waiting on manager" count={data.pipeline.pending_manager} stops={G.tax} />
                  <QueuePill label="Declined" count={data.pipeline.rejected} stops={G.danger} />
                </View>
                <Text style={styles.queueNote}>
                  {money(data.pipeline.expected_amount)} expected from approved sales.{" "}
                  <Text style={{ color: Number(data.pipeline.variance) < 0 ? C.rose : C.emerald }}>
                    {Number(data.pipeline.variance) < 0
                      ? `${money(Math.abs(Number(data.pipeline.variance)))} collected under that line.`
                      : `${money(data.pipeline.variance)} collected over that line.`}
                  </Text>
                </Text>
              </View>
            )}
          </Panel>

          <Panel
            title="Branch comparison"
            subtitle="Who is carrying the revenue this period"
            icon="branch"
            stops={G.branch}
          >
            <BranchCompare
              rows={data.branches}
              onPick={(id) => {
                setBranchScope(id);
                router.push("/reports");
              }}
            />
          </Panel>

          <Panel title="Revenue trend" subtitle={data.period.label} icon="trend" stops={G.revenue}>
            <RevenueTrend trend={data.trend} />
          </Panel>

          <Panel title="Best sellers" subtitle="Top five by revenue" icon="star" stops={G.gold}>
            <ItemBoard items={data.top_items.slice(0, 5)} />
          </Panel>

          <Panel title="Agent leaderboard" icon="agents" stops={G.agents}>
            <AgentBoard agents={data.agents} />
          </Panel>

          <View style={{ height: 96 }} />
        </>
      ) : null}
    </Screen>
  );
}

function newLotsLabel(count: number) {
  if (!count) return "No new lots";
  return `${count} new lot${count === 1 ? "" : "s"}`;
}

function Frost({ label }: { label: string }) {
  return (
    <View style={styles.frost}>
      <Text style={styles.frostText}>{label}</Text>
    </View>
  );
}

function QueuePill({
  label,
  count,
  stops,
}: {
  label: string;
  count: number;
  stops: readonly [string, string, ...string[]];
}) {
  return (
    <View style={styles.queuePill}>
      <LinearGradient colors={stops} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.queueIcon}>
        <Text style={styles.queueCount}>{count}</Text>
      </LinearGradient>
      <Text style={styles.queueLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frost: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  frostText: { color: C.white, fontSize: 11, fontWeight: "900" },
  tileGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 18 },
  queueRow: { flexDirection: "row", gap: 9 },
  queuePill: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    backgroundColor: C.surfaceAlt,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 11,
    paddingHorizontal: 6,
  },
  queueIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  queueCount: { color: C.white, fontSize: 15, fontWeight: "900" },
  queueLabel: { color: C.textMuted, fontSize: 10.5, fontWeight: "800", textAlign: "center" },
  queueNote: { color: C.textMuted, fontSize: 12.5, lineHeight: 18 },
});
