import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  ErrorState,
  HeroCard,
  KpiCard,
  LoadingState,
  MetricRow,
  Panel,
  PageTitle,
  RefreshButton,
  Screen,
  ShareBars,
} from "@/components/kit";
import {
  AgentBoard,
  BranchCompare,
  BranchScopePicker,
  ItemBoard,
  NotePanel,
  PeriodPicker,
  ReportKpiStrip,
  RevenueTrend,
} from "@/components/reports-bits";
import { CHART, C, G } from "@/lib/theme";
import { money, moneyShort, num } from "@/lib/api";
import { ensureScope, refreshScope, setAnchor, setBranchScope, setRange, useScope } from "@/lib/scope";
import { useSession } from "@/lib/session";

export default function Reports() {
  const { session } = useSession();
  const scope = useScope();

  useEffect(() => {
    ensureScope();
  }, []);

  const data = scope.data;
  const busy = scope.loading && !data;
  const branches = data?.branches ?? [];

  return (
    <Screen
      refreshing={scope.refreshing}
      onRefresh={refreshScope}
      header={
        <PageTitle
          eyebrow="Reporting"
          title={data?.scope.branch_name ?? session?.company.name ?? "Reports"}
          subtitle={data ? `${data.period.label} · tax and stock ledger` : "Pick a period to dig in"}
          icon="chart"
          stops={G.tax}
          right={
            <RefreshButton stops={G.tax} busy={scope.refreshing} onPress={refreshScope} />
          }
        />
      }
    >
      {busy ? <LoadingState label="Crunching the ledger" /> : null}
      {scope.error && !data ? <ErrorState message={scope.error} onRetry={refreshScope} /> : null}

      {data ? (
        <>
          <PeriodPicker
            value={scope.range}
            anchor={scope.anchor}
            onChange={setRange}
            onAnchor={setAnchor}
          />

          <BranchScopePicker rows={branches} value={scope.branch} onChange={setBranchScope} />

          <HeroCard
            eyebrow="Approved revenue"
            value={money(data.overview.revenue)}
            caption={`${num(data.overview.settlements)} approved settlements · ${num(
              data.overview.units_sold,
              2,
            )} units sold · ${money(data.overview.vat_collected)} VAT inside sales`}
            stops={G.hero}
          />

          <ReportKpiStrip data={data} />

          <View style={styles.grid}>
            <KpiCard
              label="Issued to agents"
              value={moneyShort(data.overview.issued_in_period)}
              hint="Handed over in this window"
              icon="wallet"
              tone="sky"
            />
            <KpiCard
              label="Returned"
              value={moneyShort(data.overview.returned_in_period)}
              hint="Brought back, not sold"
              icon="refresh"
              tone="rose"
            />
          </View>

          <NotePanel
            title="Tax and compliance"
            icon="tax"
            stops={G.tax}
            lines={[
              { label: "VAT basis", value: "Inside every price" },
              { label: "VAT rate on the company", value: `${num(data.company.vat_rate, 2)}%` },
              { label: "VAT inside sales", value: money(data.overview.vat_collected), color: C.cyan },
              { label: "VAT inside stock", value: money(data.overview.vat_on_stock), color: C.sky },
              { label: "Penalty rulings", value: num(data.overview.penalties) },
              {
                label: "Penalty amount",
                value: money(data.overview.penalty_amount),
                color: Number(data.overview.penalty_amount) > 0 ? C.rose : C.text,
              },
            ]}
          />

          <NotePanel
            title="Stock position"
            icon="box"
            stops={G.stock}
            lines={[
              { label: "Registered value (VAT-incl.)", value: money(data.overview.registered_value) },
              { label: "Still in store", value: money(data.overview.in_store_value), color: C.amber },
              { label: "Sold or moved out", value: money(data.overview.stocked_out_value), color: C.emerald },
              {
                label: "Units in store",
                value: `${num(data.overview.in_store_units, 2)} of ${num(data.overview.registered_units, 2)}`,
              },
              { label: "Lots on file", value: `${num(data.overview.lots)} · ${data.overview.new_lots} new this period` },
            ]}
          />

          <Panel
            title="How the money arrived"
            subtitle="Split of approved settlements by payment method"
            icon="wallet"
            stops={G.revenue}
          >
            <ShareBars
              rows={data.payment_methods.map((row, index) => ({
                label: `${row.label} · ${row.settlements} sale${row.settlements === 1 ? "" : "s"}`,
                value: Number(row.amount || 0),
                display: money(row.amount),
                color: CHART[index % CHART.length],
              }))}
              emptyLabel="No approved settlement inside this window."
            />
          </Panel>

          <Panel
            title="Stock movements"
            subtitle={`Promotions moved ${num(data.promotions.units, 2)} units across ${data.promotions.lines} lines`}
            icon="bolt"
            stops={G.branch}
          >
            {data.movements.length ? (
              data.movements.map((row) => (
                <MetricRow
                  key={row.type}
                  label={row.label}
                  value={`${row.lines} lines · ${num(row.units, 2)} units`}
                  icon="box"
                  color={Number(row.units) < 0 ? C.rose : C.emerald}
                />
              ))
            ) : (
              <Text style={styles.note}>No stock movement recorded in this window.</Text>
            )}
          </Panel>

          <Panel title="Revenue trend" subtitle={data.period.label} icon="trend" stops={G.revenue}>
            <RevenueTrend trend={data.trend} />
          </Panel>

          <Panel
            title="Branch comparison"
            subtitle="Tap a branch to scope every report to it"
            icon="branch"
            stops={G.branch}
          >
            <BranchCompare rows={branches} onPick={(id) => setBranchScope(id)} />
          </Panel>

          <Panel title="Sales agents" subtitle="Ranked by approved revenue" icon="agents" stops={G.agents}>
            <AgentBoard agents={data.agents} />
          </Panel>

          <Panel title="Best sellers" subtitle={`${data.top_items.length} lines in this window`} icon="star" stops={G.gold}>
            <ItemBoard items={data.top_items} />
          </Panel>

          <View style={{ height: 96 }} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 18 },
  note: { color: C.textMuted, fontSize: 12.5, lineHeight: 18 },
});
