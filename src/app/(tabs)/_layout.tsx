import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { TabList, TabSlot, TabTrigger, Tabs } from "expo-router/ui";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Glyph, type IconName, type Stops } from "@/components/kit";
import { C, G, radius } from "@/lib/theme";

const TABS: { name: string; href: Href; label: string; icon: IconName; stops: Stops }[] = [
  { name: "index", href: "/", label: "Pulse", icon: "overview", stops: G.hero },
  { name: "reports", href: "/reports", label: "Reports", icon: "chart", stops: G.revenue },
  { name: "branches", href: "/branches", label: "Branches", icon: "branch", stops: G.branch },
  { name: "company", href: "/company", label: "Company", icon: "store", stops: G.stock },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <View style={StyleSheet.flatten([styles.bar, { bottom: insets.bottom + 10 }])}>
          <LinearGradient
            colors={["#141C33", "#0B1120"] as const}
            style={StyleSheet.absoluteFill}
          />
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton label={tab.label} icon={tab.icon} stops={tab.stops} />
            </TabTrigger>
          ))}
        </View>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  label,
  icon,
  stops,
  isFocused,
  onPress,
  onLongPress,
}: {
  label: string;
  icon: IconName;
  stops: Stops;
  isFocused?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const active = Boolean(isFocused);
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      {active ? (
        <LinearGradient
          colors={stops}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pill}
        >
          <Glyph name={icon} size={17} color={C.white} />
          <Text style={styles.activeLabel}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.idle}>
          <Glyph name={icon} size={17} color={C.textFaint} />
          <Text style={styles.idleLabel}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: { height: "100%" },
  bar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 6,
    padding: 6,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: C.borderStrong,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 18,
  },
  item: { flex: 1, alignItems: "center" },
  pressed: { opacity: 0.75 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
    height: 44,
    borderRadius: radius.md,
  },
  activeLabel: { color: C.white, fontSize: 12, fontWeight: "900", letterSpacing: -0.1 },
  idle: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    width: "100%",
    height: 44,
  },
  idleLabel: { color: C.textFaint, fontSize: 10.5, fontWeight: "800" },
});
