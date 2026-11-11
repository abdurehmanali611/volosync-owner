import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import {
  Badge,
  BarChart,
  ComboBox,
  Glyph,
  KpiCard,
  Panel,
  Popover,
  ShareBars,
  type IconName,
  type KpiTone,
  type Stops,
} from "@/components/kit";
import { Calendar } from "@/components/calendar";
import { branchKind, CHART, C, G, medalTone, radius, subscriptionTone } from "@/lib/theme";
import {
  dateLabel,
  money,
  num,
  RANGES,
  type AgentRow,
  type BranchRow,
  type Reports,
  type Subscription,
} from "@/lib/api";

/** Period row — a calendar popover picking the anchor day beside a preset combobox. */
export function PeriodPicker({
  value,
  anchor,
  onChange,
  onAnchor,
}: {
  value: string;
  anchor: string;
  onChange: (key: string) => void;
  onAnchor: (day: string) => void;
}) {
  return (
    <View style={styles.periodRow}>
      <Popover
        width={320}
        height={360}
        style={{ flex: 1 }}
        renderTrigger={(open, toggle) => (
          <Pressable
            onPress={toggle}
            accessibilityRole="button"
            accessibilityLabel="Pick the report date"
            style={({ pressed }) => [
              styles.calendarTrigger,
              open && styles.calendarTriggerOpen,
              pressed && { opacity: 0.85 },
            ]}
          >
            <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.calendarIcon}>
              <Glyph name="calendar" size={14} color={C.white} />
            </LinearGradient>
            <Text style={styles.calendarText} numberOfLines={1}>
              {dateLabel(anchor)}
            </Text>
          </Pressable>
        )}
      >
        {(close) => (
          <Calendar
            value={anchor}
            onSelect={(day) => {
              onAnchor(day);
              close();
            }}
          />
        )}
      </Popover>
      <ComboBox
        style={{ flex: 1 }}
        options={RANGES}
        value={value}
        onChange={onChange}
        stops={G.hero}
      />
    </View>
  );
}

/** Full-width branch scope selector shared by Pulse and Reports. */
export function BranchScopePicker({
  rows,
  value,
  onChange,
}: {
  rows: BranchRow[];
  value: number | null;
  onChange: (branch: number | null) => void;
}) {
  const options = [
    { key: "all", label: "All branches" },
    ...rows.map((row) => ({ key: String(row.id), label: row.name })),
  ];
  return (
    <ComboBox
      options={options}
      value={value === null ? "all" : String(value)}
      onChange={(key) => onChange(key === "all" ? null : Number(key))}
      stops={G.branch}
      icon="branch"
    />
  );
}

export function SubscriptionStrip({
  subscription,
  onPress,
}: {
  subscription: Subscription;
  onPress: () => void;
}) {
  const tone = subscriptionTone(subscription.state);
  const days = subscription.days_left;
  const detail =
    subscription.state === "unpaid"
      ? "No yearly payment recorded yet."
      : days === null
        ? "Renewal date not set."
        : days < 0
          ? `Lapsed for ${Math.abs(days)} days.`
          : `${days} days remaining.`;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.strip, pressed && { opacity: 0.85 }]}>
      <View style={[styles.stripIcon, { backgroundColor: tone.soft, borderColor: `${tone.fg}66` }]}>
        <Glyph name="gift" size={16} color={tone.fg} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.stripTitle}>Annual subscription</Text>
        <Text style={styles.stripSub}>
          {detail} Fee {money(subscription.annual_fee)} a year.
        </Text>
      </View>
      <Badge label={tone.label} tone={tone} />
    </Pressable>
  );
}

export function RevenueTrend({
  trend,
}: {
  trend: { label: string; revenue: string }[];
}) {
  if (!trend.length) {
    return (
      <Text style={styles.thinNote}>No sales recorded inside this window yet.</Text>
    );
  }
  return (
    <BarChart
      data={trend.map((row) => ({ label: row.label, value: Number(row.revenue || 0) }))}
      stops={G.revenue}
    />
  );
}

export function AgentBoard({ agents }: { agents: AgentRow[] }) {
  if (!agents.length) {
    return <Text style={styles.thinNote}>No agent has settled a sale in this window.</Text>;
  }
  const peak = Math.max(...agents.map((row) => Number(row.revenue || 0)), 1);
  return (
    <View style={{ gap: 11 }}>
      {agents.slice(0, 6).map((agent, index) => {
        const tone = medalTone(agent.rank || index + 1);
        return (
          <View key={agent.id} style={styles.boardRow}>
            <View style={[styles.rank, { backgroundColor: tone.soft, borderColor: `${tone.fg}66` }]}>
              <Text style={[styles.rankText, { color: tone.fg }]}>{tone.label}</Text>
            </View>
            <View style={{ flex: 1, gap: 5 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <Text style={styles.boardName} numberOfLines={1}>
                  {agent.name}
                </Text>
                <Text style={styles.boardValue}>{money(agent.revenue)}</Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.max(3, (Number(agent.revenue || 0) / peak) * 100)}%`,
                      backgroundColor: CHART[index % CHART.length],
                    },
                  ]}
                />
              </View>
              <Text style={styles.boardMeta}>
                {num(agent.units, 2)} units · {agent.settlements} settlements
                {agent.penalties ? ` · ${agent.penalties} penalties` : ""}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function ItemBoard({
  items,
}: {
  items: { name: string; category: string; revenue: string; units: string }[];
}) {
  if (!items.length) {
    return <Text style={styles.thinNote}>Nothing sold in this window yet.</Text>;
  }
  return (
    <View style={{ gap: 10 }}>
      {items.map((item, index) => (
        <View key={`${item.name}-${index}`} style={styles.itemRow}>
          <View style={styles.itemRank}>
            <Text style={styles.itemRankText}>{index + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.itemCat} numberOfLines={1}>
              {item.category || "Uncategorised"} · {num(item.units, 2)} units
            </Text>
          </View>
          <Text style={styles.boardValue}>{money(item.revenue)}</Text>
        </View>
      ))}
    </View>
  );
}

export function BranchCompare({
  rows,
  onPick,
}: {
  rows: BranchRow[];
  onPick: (id: number) => void;
}) {
  if (!rows.length) {
    return (
      <Text style={styles.thinNote}>
        Branches appear here once you create them. Add one from the Branches tab.
      </Text>
    );
  }
  return (
    <View style={{ gap: 14 }}>
      <ShareBars
        rows={rows.map((row, index) => ({
          label: `${row.name} · ${branchKind(row.kind === "main") === "main" ? "Main" : "Satellite"}`,
          value: Number(row.revenue || 0),
          display: money(row.revenue),
          color: CHART[index % CHART.length],
        }))}
        emptyLabel="No sales settled in this window."
      />
      <View style={styles.pickRow}>
        {rows.slice(0, 6).map((row) => (
          <Pressable
            key={row.id}
            onPress={() => onPick(row.id)}
            style={({ pressed }) => [styles.pick, pressed && { opacity: 0.8 }]}>
            <Glyph name="store" size={12} color={C.cyan} />
            <Text style={styles.pickText} numberOfLines={1}>
              {row.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function NotePanel({
  title,
  icon,
  stops,
  lines,
}: {
  title: string;
  icon: IconName;
  stops: Stops;
  lines: { label: string; value: string; color?: string }[];
}) {
  return (
    <Panel title={title} icon={icon} stops={stops}>
      {lines.map((line) => (
        <View key={line.label} style={styles.noteRow}>
          <Text style={styles.noteLabel}>{line.label}</Text>
          <Text style={[styles.noteValue, line.color ? { color: line.color } : null]}>{line.value}</Text>
        </View>
      ))}
    </Panel>
  );
}

/**
 * One card per screen width, snapping card by card. The rail bleeds past the
 * screen padding so a card is the full phone width, then the card itself keeps
 * a little horizontal padding inside that width.
 */
const RAIL_GAP = 12;
const RAIL_BLEED = 16;
const RAIL_INSET = 4;
const CARD_INSET = 10;

export function CardRail({
  count,
  height,
  children,
}: {
  count: number;
  height: number;
  children: (width: number) => React.ReactNode;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const [width, setWidth] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);
  useEffect(() => setMounted(true), []);
  const fallbackWidth = Math.max(0, windowWidth - 64);
  const railWidth = width || (mounted ? fallbackWidth : 0);
  const cardWidth = Math.min(Math.max(0, railWidth - CARD_INSET * 2), 300);
  const step = cardWidth + RAIL_GAP;
  const safeCount = Math.max(1, count);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!step) return;
    const next = Math.round(event.nativeEvent.contentOffset.x / step);
    setIndex(Math.max(0, Math.min(safeCount - 1, next)));
  };

  return (
    <View style={{ gap: 8 }}>
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={{ marginHorizontal: -RAIL_BLEED }}
      >
        {cardWidth ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={step}
            snapToAlignment="start"
            disableIntervalMomentum
            decelerationRate="fast"
            onScroll={onScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{
              gap: RAIL_GAP,
              paddingHorizontal: RAIL_BLEED + RAIL_INSET,
              paddingBottom: 4,
            }}
          >
            {children(cardWidth)}
          </ScrollView>
        ) : (
          <View style={{ height }} />
        )}
      </View>
      {safeCount > 1 ? (
        <View style={styles.dots}>
          {Array.from({ length: safeCount }).map((_, dot) => (
            <View key={dot} style={[styles.dot, dot === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** The headline numbers for the current window in one snapping horizontal
 * rail, an exact match for the web finance/manager ReportKpiStrip cards. */
export function ReportKpiStrip({ data }: { data: Reports }) {
  const o = data.overview;
  const expected = Number(data.pipeline.expected_amount || 0);
  const collected = Number(o.revenue || 0);
  const collectedShare = expected > 0 ? (collected / expected) * 100 : 0;
  const margin = Number(o.profit_margin || 0);
  const leader = data.agents.find((a) => a.rank === 1);

  const tiles: {
    label: string;
    value: string;
    hint: string;
    icon: IconName;
    tone: KpiTone;
  }[] = [
    {
      label: "Sold units",
      value: num(o.units_sold, 2),
      hint: `${num(o.settlements)} settled line${Number(o.settlements) === 1 ? "" : "s"}`,
      icon: "box",
      tone: "amber",
    },
    {
      label: "Expected gross",
      value: money(data.pipeline.expected_amount),
      hint: "Selling price × sold units",
      icon: "trend",
      tone: "emerald",
    },
    {
      label: "Collected gross",
      value: money(o.revenue),
      hint: `${collectedShare.toFixed(1)}% of expected`,
      icon: "wallet",
      tone: "sky",
    },
    {
      label: "Profit",
      value: money(o.gross_profit),
      hint: `${margin.toFixed(1)}% margin on sales`,
      icon: "trend",
      tone: "violet",
    },
    {
      label: "VAT in revenue",
      value: money(o.vat_collected),
      hint: "Already inside the selling price",
      icon: "tax",
      tone: "sky",
    },
    {
      label: "In-store value",
      value: money(o.in_store_value),
      hint: `${num(o.lots)} lot${Number(o.lots) === 1 ? "" : "s"} still on the shelf`,
      icon: "store",
      tone: "emerald",
    },
    {
      label: "Returned",
      value: money(o.returned_in_period),
      hint: "Brought back, not sold",
      icon: "refresh",
      tone: "rose",
    },
    {
      label: "Promotions",
      value: num(data.promotions.units, 2),
      hint: `${num(data.promotions.lines)} line${Number(data.promotions.lines) === 1 ? "" : "s"} moved`,
      icon: "gift",
      tone: "amber",
    },
    {
      label: "Penalties",
      value: money(o.penalty_amount),
      hint: o.penalties
        ? `${num(o.penalties)} raised · ${money(o.penalty_amount)} short`
        : "Every agent brought the full amount",
      icon: "warn",
      tone: "rose",
    },
    {
      label: "Best sales agent",
      value: leader ? leader.name : "—",
      hint: leader
        ? `${money(leader.revenue)} collected · ${num(leader.units)} units`
        : "No settled sales in this window",
      icon: "star",
      tone: "violet",
    },
  ];

  return (
    <View style={styles.kpiPanel}>
      <View style={styles.kpiHead}>
        <Text style={styles.kpiTitle}>At a glance</Text>
        <View style={styles.kpiHint}>
          <Text style={styles.kpiHintText} numberOfLines={1}>
            {data.period.label}
          </Text>
          <Glyph name="chevron" size={11} color="#71717A" />
          <Text style={styles.kpiHintText}>swipe</Text>
        </View>
      </View>
      <CardRail count={tiles.length} height={KPI_HEIGHT}>
        {(width) => (
          <>
            {tiles.map((tile) => (
              <View key={tile.label} style={{ width, height: KPI_HEIGHT }}>
                <KpiCard
                  label={tile.label}
                  value={tile.value}
                  hint={tile.hint}
                  icon={tile.icon}
                  tone={tile.tone}
                  width={width}
                  style={{ flex: 1, minWidth: 0, width: "100%" }}
                />
              </View>
            ))}
          </>
        )}
      </CardRail>
    </View>
  );
}

const KPI_HEIGHT = 158;

const styles = StyleSheet.create({
  periodRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  calendarTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 46,
    paddingHorizontal: 11,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: radius.sm,
  },
  calendarTriggerOpen: { borderColor: C.borderStrong, backgroundColor: C.surface },
  calendarIcon: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarText: { color: C.text, fontSize: 12.5, fontWeight: "800", flexShrink: 1 },
  strip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: C.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C.border,
    padding: 13,
  },
  stripIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stripTitle: { color: C.text, fontSize: 13.5, fontWeight: "900" },
  stripSub: { color: C.textFaint, fontSize: 11.5, marginTop: 2 },
  thinNote: { color: C.textMuted, fontSize: 12.5, lineHeight: 18 },
  boardRow: { flexDirection: "row", gap: 11 },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { fontSize: 12, fontWeight: "900" },
  boardName: { color: C.text, fontSize: 13, fontWeight: "800", flex: 1 },
  boardValue: { color: C.text, fontSize: 13, fontWeight: "900" },
  boardMeta: { color: C.textFaint, fontSize: 11 },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: C.surfaceAlt,
    overflow: "hidden",
  },
  fill: { height: 6, borderRadius: 3 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  itemRank: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: C.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  itemRankText: { color: C.textMuted, fontSize: 11, fontWeight: "900" },
  itemName: { color: C.text, fontSize: 13, fontWeight: "800" },
  itemCat: { color: C.textFaint, fontSize: 11, marginTop: 1 },
  pickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pick: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surfaceSoft,
    maxWidth: "100%",
  },
  pickText: { color: C.textMuted, fontSize: 11.5, fontWeight: "800" },
  noteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  noteLabel: { color: C.textMuted, fontSize: 12.5, flex: 1 },
  noteValue: { color: C.text, fontSize: 13, fontWeight: "900" },
  kpiPanel: {
    backgroundColor: "rgba(13,13,22,0.72)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingVertical: 12,
    paddingHorizontal: 14,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.4,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
  kpiHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 3,
    marginBottom: 10,
  },
  kpiTitle: {
    color: "#A1A1AA",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  kpiHint: { flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 },
  kpiHintText: { color: "#71717A", fontSize: 10 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.border },
  dotActive: { width: 14, backgroundColor: C.violet },
});
