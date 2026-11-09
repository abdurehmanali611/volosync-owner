import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ComboBox, Glyph } from "@/components/kit";
import { dateKey } from "@/lib/api";
import { C, G } from "@/lib/theme";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function fromKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Single-day picker — the chosen day anchors the selected reporting period. */
export function Calendar({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (day: string) => void;
}) {
  const todayKey = dateKey(new Date());
  const selected = fromKey(value);
  const [cursor, setCursor] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1),
  );

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthOptions = MONTHS.map((label, index) => ({ key: String(index), label }));
  const oldestYear = Math.min(2026, year);
  const newestYear = Math.max(2052, year);
  const yearOptions = Array.from(
    { length: newestYear - oldestYear + 1 },
    (_, index) => oldestYear + index,
  ).map((entry) => ({ key: String(entry), label: String(entry) }));

  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => dateKey(new Date(year, month, index + 1))),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.head}>
        <Pressable onPress={() => setCursor(new Date(year, month - 1, 1))} hitSlop={8} style={styles.nav}>
          <Glyph name="chevron_left" size={16} color={C.textMuted} />
        </Pressable>
        <ComboBox
          compact
          style={{ flex: 1 }}
          options={monthOptions}
          value={String(month)}
          displayValue={MONTHS[month].slice(0, 3)}
          onChange={(key) => setCursor(new Date(year, Number(key), 1))}
          stops={G.hero}
        />
        <ComboBox
          compact
          style={{ flex: 1 }}
          options={yearOptions}
          value={String(year)}
          onChange={(key) => setCursor(new Date(Number(key), month, 1))}
          stops={G.hero}
        />
        <Pressable onPress={() => setCursor(new Date(year, month + 1, 1))} hitSlop={8} style={styles.nav}>
          <Glyph name="chevron" size={16} color={C.textMuted} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.weekday}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((key, index) => {
          if (!key) return <View key={`blank-${index}`} style={styles.cell} />;
          const isSelected = key === value;
          return (
            <Pressable
              key={key}
              onPress={() => onSelect(key)}
              style={({ pressed }) => [styles.cell, pressed && { opacity: 0.7 }]}
            >
              {isSelected ? (
                <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.selectedDay}>
                  <Text style={styles.selectedText}>{Number(key.slice(8))}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.day, key === todayKey && styles.todayRing]}>
                  <Text style={styles.dayText}>{Number(key.slice(8))}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 8 },
  nav: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
  },
  weekRow: { flexDirection: "row" },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: "center",
    color: C.textFaint,
    fontSize: 10.5,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  day: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  todayRing: { borderWidth: 1, borderColor: C.borderStrong },
  dayText: { color: C.textMuted, fontSize: 12.5, fontWeight: "700" },
  selectedDay: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedText: { color: C.white, fontSize: 12.5, fontWeight: "900" },
});