import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Badge,
  BarChart,
  ComboBox,
  Glyph,
  Panel,
  Popover,
  ShareBars,
  type IconName,
  type Stops,
} from "@/components/kit";
import { Calendar } from "@/components/calendar";
import { CHART, C, G, medalTone, radius, subscriptionTone } from "@/lib/theme";
import {
  dateLabel,
  money,
  moneyShort,
  num,
  RANGES,
  type AgentRow,
  type BranchRow,
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
          {detail} Fee {moneyShort(subscription.annual_fee)} a year.
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
          label: `${row.name} · ${row.kind === "main" ? "Main" : "Satellite"}`,
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
});
