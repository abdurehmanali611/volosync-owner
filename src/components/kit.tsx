import { LinearGradient } from "expo-linear-gradient";
import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { C, G, radius, shadow, type Stops, type Tone } from "@/lib/theme";

/** Gradients need at least two stops; the tuple type proves it to the compiler. */
export type { Stops };

/* ------------------------------------------------------------------------- *
 * Icons — one glyph table so every screen asks for the same picture.
 * ------------------------------------------------------------------------- */

const ICONS = {
  overview: { ios: "square.grid.2x2.fill", android: "dashboard" },
  chart: { ios: "chart.bar.fill", android: "query_stats" },
  branch: { ios: "building.2.fill", android: "apartment" },
  store: { ios: "storefront.fill", android: "storefront" },
  money: { ios: "banknote.fill", android: "payments" },
  wallet: { ios: "wallet.pass.fill", android: "account_balance_wallet" },
  tax: { ios: "percent", android: "percent" },
  receipt: { ios: "doc.text.fill", android: "receipt_long" },
  box: { ios: "shippingbox.fill", android: "inventory_2" },
  agents: { ios: "person.2.fill", android: "groups" },
  person: { ios: "person.crop.circle.fill", android: "person" },
  badge: { ios: "checklist", android: "badge" },
  key: { ios: "key.fill", android: "key" },
  lock: { ios: "lock.fill", android: "lock" },
  eye: { ios: "eye", android: "visibility" },
  eye_off: { ios: "eye.slash", android: "visibility_off" },
  calendar: { ios: "calendar", android: "calendar_month" },
  bolt: { ios: "bolt.fill", android: "bolt" },
  trend: { ios: "arrow.up.right", android: "trending_up" },
  plus: { ios: "plus.circle.fill", android: "add" },
  edit: { ios: "pencil", android: "edit" },
  trash: { ios: "trash", android: "delete" },
  close: { ios: "xmark.circle.fill", android: "close" },
  refresh: { ios: "arrow.clockwise", android: "refresh" },
  check: { ios: "checkmark.circle.fill", android: "check_circle" },
  warn: { ios: "exclamationmark.triangle.fill", android: "error" },
  star: { ios: "star.fill", android: "workspace_premium" },
  pin: { ios: "location.fill", android: "location_on" },
  phone: { ios: "phone", android: "call" },
  signout: { ios: "rectangle.portrait.and.arrow.right", android: "logout" },
  chevron: { ios: "chevron.right", android: "chevron_right" },
  chevron_left: { ios: "chevron.left", android: "chevron_left" },
  chevron_down: { ios: "chevron.down", android: "expand_more" },
  save: { ios: "creditcard.fill", android: "savings" },
  gift: { ios: "gift.fill", android: "local_offer" },
} as const satisfies Record<string, { ios: SFSymbol; android: AndroidSymbol }>;

export type IconName = keyof typeof ICONS;

export function Glyph({
  name,
  size = 18,
  color = C.text,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const symbol = ICONS[name];
  return (
    <SymbolView
      name={{ ios: symbol.ios, android: symbol.android, web: symbol.android }}
      tintColor={color}
      size={size}
      style={{ width: size, height: size }}
      fallback={<Text style={{ color, fontSize: size - 4, fontWeight: "800" }}>•</Text>}
    />
  );
}

/* ------------------------------------------------------------------------- *
 * Surfaces
 * ------------------------------------------------------------------------- */

export function Screen({
  children,
  header,
  footer,
  refreshing,
  onRefresh,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient
        colors={["#1B1250", "#0C1126", C.bg] as Stops}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, paddingTop: insets.top + 10, paddingHorizontal: 16 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 34 }}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={Boolean(refreshing)}
                  onRefresh={onRefresh}
                  tintColor={C.violet}
                  colors={[C.violet]}
                />
              ) : undefined
            }
          >
            <View style={{ flex: 1, gap: 14 }}>
              {header}
              {children}
            </View>
          </ScrollView>
        </View>
        {footer}
      </KeyboardAvoidingView>
    </View>
  );
}

export function PageTitle({
  eyebrow,
  title,
  subtitle,
  right,
  icon,
  stops = G.hero,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  icon?: IconName;
  stops?: Stops;
}) {
  return (
    <View style={{ gap: 12 }}>
      <View style={styles.pageRow}>
        {icon ? (
          <LinearGradient
            colors={stops}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.pageIcon, shadow(stops[0], 0.45)]}
          >
            <Glyph name={icon} size={18} color={C.white} />
          </LinearGradient>
        ) : null}
        <View style={{ flex: 1, gap: 1 }}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.pageTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.pageSub} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
      <LinearGradient
        colors={[stops[0], `${stops[stops.length - 1]}00`] as Stops}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.pageRule}
      />
    </View>
  );
}

export function Panel({
  title,
  subtitle,
  right,
  icon,
  stops = G.slate,
  children,
  style,
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  icon?: IconName;
  stops?: Stops;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.panel, style]}>
      {title ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
          {icon ? (
            <LinearGradient colors={stops} style={styles.panelIcon}>
              <Glyph name={icon} size={15} color={C.white} />
            </LinearGradient>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.panelTitle}>{title}</Text>
            {subtitle ? <Text style={styles.panelSub}>{subtitle}</Text> : null}
          </View>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function HeroCard({
  eyebrow,
  value,
  caption,
  stops = G.hero,
  badge,
  children,
}: {
  eyebrow: string;
  value: string;
  caption?: string;
  stops?: Stops;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <LinearGradient
      colors={stops}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, shadow(stops[0], 0.5)]}
    >
      <View style={styles.heroGlow} />
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroEyebrow}>{eyebrow}</Text>
          <Text style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
            {value}
          </Text>
        </View>
        {badge}
      </View>
      {caption ? <Text style={styles.heroCaption}>{caption}</Text> : null}
      {children ? <View style={{ marginTop: 14 }}>{children}</View> : null}
    </LinearGradient>
  );
}

export function PayToCard({
  account = "1000176310832",
  amount,
  bank = "Commercial Bank of Ethiopia (CBE)",
  note = "Deposit the exact amount, then enter the transaction number below.",
  stops = G.revenue,
}: {
  account?: string;
  amount?: string;
  bank?: string;
  note?: string;
  stops?: Stops;
}) {
  return (
    <View style={[styles.payTo, shadow(stops[0], 0.28)]}>
      <LinearGradient
        colors={stops}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.payToWash}
      />
      <View style={styles.payToTop}>
        <LinearGradient colors={stops} style={styles.payToIcon}>
          <Glyph name="wallet" size={16} color={C.white} />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.payToEyebrow}>PAYMENT ACCOUNT</Text>
          <Text style={styles.payToBank} numberOfLines={1}>
            {bank}
          </Text>
        </View>
        {amount ? (
          <View style={{ alignItems: "flex-end", maxWidth: "46%" }}>
            <Text style={styles.payToAmountLabel}>DEPOSIT</Text>
            <Text style={styles.payToAmount} numberOfLines={1} adjustsFontSizeToFit>
              {amount}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.payToNumber} selectable>
        {account}
      </Text>
      <Text style={styles.payToNote}>{note}</Text>
    </View>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  stops = G.hero,
  onPress,
  style,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: IconName;
  stops?: Stops;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tile, onPress && { borderColor: C.borderStrong }, style]}
    >
      <View style={[styles.tileAccent, { backgroundColor: stops[stops.length - 1] }]} />
      <LinearGradient colors={stops} style={styles.tileIcon}>
        <Glyph name={icon} size={14} color={C.white} />
      </LinearGradient>
      <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.tileLabel}>{label}</Text>
      {hint ? <Text style={styles.tileHint}>{hint}</Text> : null}
    </Pressable>
  );
}

/**
 * The web console's KPI card, mirrored one-to-one: tone wash, top hairline,
 * label/value stack, gradient icon tile, and a dotted hint rail.
 */
export type KpiTone = "emerald" | "amber" | "violet" | "rose" | "sky" | "slate";

const KPI_TONES: Record<
  KpiTone,
  {
    iconBorder: string;
    iconFrom: string;
    iconTo: string;
    iconText: string;
    wash: string;
    bar: Stops;
    dot: Stops;
  }
> = {
  emerald: {
    iconBorder: "rgba(52,211,153,0.30)",
    iconFrom: "rgba(52,211,153,0.25)",
    iconTo: "rgba(45,212,191,0.05)",
    iconText: "#A7F3D0",
    wash: "rgba(52,211,153,0.20)",
    bar: ["#34D399", "#5EEAD4", "#67E8F9"],
    dot: ["#34D399", "#5EEAD4"],
  },
  amber: {
    iconBorder: "rgba(251,191,36,0.30)",
    iconFrom: "rgba(251,191,36,0.25)",
    iconTo: "rgba(251,146,60,0.05)",
    iconText: "#FDE68A",
    wash: "rgba(251,191,36,0.20)",
    bar: ["#FBBF24", "#FDBA74", "#FDA4AF"],
    dot: ["#FBBF24", "#FDBA74"],
  },
  violet: {
    iconBorder: "rgba(167,139,250,0.30)",
    iconFrom: "rgba(167,139,250,0.25)",
    iconTo: "rgba(232,121,249,0.05)",
    iconText: "#DDD6FE",
    wash: "rgba(167,139,250,0.20)",
    bar: ["#A78BFA", "#F0ABFC", "#F9A8D4"],
    dot: ["#A78BFA", "#F0ABFC"],
  },
  rose: {
    iconBorder: "rgba(251,113,133,0.30)",
    iconFrom: "rgba(251,113,133,0.25)",
    iconTo: "rgba(244,114,182,0.05)",
    iconText: "#FECDD3",
    wash: "rgba(251,113,133,0.20)",
    bar: ["#FB7185", "#FDA4AF", "#F0ABFC"],
    dot: ["#FB7185", "#FDA4AF"],
  },
  sky: {
    iconBorder: "rgba(56,189,248,0.30)",
    iconFrom: "rgba(56,189,248,0.25)",
    iconTo: "rgba(34,211,238,0.05)",
    iconText: "#BAE6FD",
    wash: "rgba(56,189,248,0.20)",
    bar: ["#38BDF8", "#67E8F9", "#6EE7B7"],
    dot: ["#38BDF8", "#67E8F9"],
  },
  slate: {
    iconBorder: "rgba(255,255,255,0.10)",
    iconFrom: "rgba(255,255,255,0.05)",
    iconTo: "rgba(255,255,255,0.02)",
    iconText: "#D4D4D8",
    wash: "rgba(161,161,170,0.15)",
    bar: ["#A1A1AA", "#D4D4D8"],
    dot: ["#A1A1AA", "#D4D4D8"],
  },
};

export function KpiCard({
  label,
  value,
  hint,
  tone = "emerald",
  icon,
  onPress,
  style,
  width,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: KpiTone;
  icon?: IconName;
  onPress?: () => void;
  style?: ViewStyle;
  /** Rendered width, when the parent already knows it (e.g. a snapping rail). */
  width?: number;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const palette = KPI_TONES[tone] ?? KPI_TONES.emerald;
  const [cardWidth, setCardWidth] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  // Two-column grids sit inside the 16pt screen gutter with a 12pt gap.
  const gridWidth = Math.max(140, Math.floor((windowWidth - 52) / 2));
  const resolvedWidth = width || cardWidth || (mounted ? gridWidth : 0);
  // The value must never run into the icon or end in an ellipsis. Size it from
  // the card width instead of relying on `adjustsFontSizeToFit`, which is a
  // no-op on web.
  const baseSize =
    resolvedWidth === 0 ? 22 : resolvedWidth >= 250 ? 25 : resolvedWidth >= 200 ? 22 : 19;
  const valueRoom = Math.max(0, resolvedWidth - 36 - (icon ? 48 : 0));
  const fittedSize = valueRoom
    ? Math.floor(valueRoom / (0.6 * Math.max(1, value.length)))
    : baseSize;
  const valueSize = Math.max(13, Math.min(baseSize, fittedSize));

  return (
    <Pressable
      onPress={onPress}
      onLayout={(event) => setCardWidth(event.nativeEvent.layout.width)}
      style={({ pressed }) => [
        styles.kpiCard,
        onPress ? styles.kpiCardPressable : null,
        pressed && onPress ? styles.kpiCardPressed : null,
        style,
      ]}
    >
      <LinearGradient
        colors={[palette.wash, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.kpiWash}
      />
      <LinearGradient
        colors={palette.bar}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.kpiBar}
      />
      <View style={styles.kpiTop}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={[
              styles.kpiLabel,
              { letterSpacing: resolvedWidth >= 200 ? 1.6 : 1.05 },
            ]}
          >
            {label}
          </Text>
          <Text
            style={[styles.kpiValue, { fontSize: valueSize, lineHeight: valueSize + 3 }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value}
          </Text>
        </View>
        {icon ? (
          <LinearGradient
            colors={[palette.iconFrom, palette.iconTo]}
            style={[styles.kpiIcon, { borderColor: palette.iconBorder }]}
          >
            <Glyph name={icon} size={16} color={palette.iconText} />
          </LinearGradient>
        ) : null}
      </View>
      {hint ? (
        <View style={styles.kpiHintRow}>
          <LinearGradient colors={palette.dot} style={styles.kpiDot} />
          <Text style={styles.kpiHint} numberOfLines={1}>
            {hint}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function Badge({ label, tone, icon }: { label: string; tone: Tone; icon?: IconName }) {
  return (
    <View style={[styles.badge, { backgroundColor: tone.soft, borderColor: `${tone.fg}55` }]}>
      {icon ? <Glyph name={icon} size={11} color={tone.fg} /> : null}
      <Text style={[styles.badgeText, { color: tone.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function Chips({
  options,
  value,
  onChange,
  stops = G.hero,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
  stops?: Stops;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
    >
      {options.map((option) => {
        const active = option.key === value;
        if (active) {
          return (
            <LinearGradient
              key={option.key}
              colors={stops}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.chipActive}
            >
              <Text style={[styles.chipText, { color: C.white }]}>{option.label}</Text>
            </LinearGradient>
          );
        }
        return (
          <Pressable key={option.key} onPress={() => onChange(option.key)} style={styles.chip}>
            <Text style={[styles.chipText, { color: C.textMuted }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export type ChannelOption = {
  key: string;
  label: string;
  hint?: string;
  icon?: IconName;
};

export function ChannelPicker({
  options,
  value,
  onChange,
  stops = G.revenue,
}: {
  options: readonly ChannelOption[];
  value: string;
  onChange: (key: string) => void;
  stops?: Stops;
}) {
  return (
    <View style={styles.channelRow}>
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.key)}
            style={({ pressed }) => [
              styles.channelCard,
              active && styles.channelCardActive,
              active && shadow(stops[0], 0.32),
              pressed && { opacity: 0.9 },
            ]}
          >
            {active ? (
              <LinearGradient
                colors={stops}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.channelCardFill}
              />
            ) : null}
            <View style={styles.channelHead}>
              <View style={[styles.channelIcon, active && styles.channelIconActive]}>
                <Glyph
                  name={option.icon ?? "wallet"}
                  size={16}
                  color={active ? C.white : C.textMuted}
                />
              </View>
              <View style={[styles.channelTick, active && styles.channelTickActive]}>
                {active ? <Glyph name="check" size={11} color={C.white} /> : null}
              </View>
            </View>
            <View style={{ gap: 2 }}>
              <Text
                style={[styles.channelLabel, active && { color: C.white }]}
                numberOfLines={1}
              >
                {option.label}
              </Text>
              {option.hint ? (
                <Text
                  style={[
                    styles.channelHint,
                    active && { color: "rgba(255,255,255,0.74)" },
                  ]}
                  numberOfLines={2}
                >
                  {option.hint}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** The payment channels every payment surface offers, kept in one place. */
export const PAYMENT_CHANNELS: ChannelOption[] = [
  { key: "TELEBIRR", label: "Telebirr", hint: "Mobile money", icon: "phone" },
  { key: "CBE", label: "CBE", hint: "Bank transfer", icon: "wallet" },
  { key: "OTHER", label: "Other", hint: "Any other channel", icon: "money" },
];

/* ------------------------------------------------------------------------- *
 * Popover + combobox
 * ------------------------------------------------------------------------- */

/** Anchored floating card: measures its trigger and opens beside it. */
export function Popover({
  renderTrigger,
  children,
  width = 300,
  height = 360,
  style,
}: {
  renderTrigger: (open: boolean, toggle: () => void) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  width?: number;
  height?: number;
  style?: ViewStyle;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const anchor = useRef<React.ComponentRef<typeof View>>(null);

  function close() {
    setOpen(false);
  }

  function toggle() {
    if (open) {
      close();
      return;
    }
    anchor.current?.measureInWindow((x, y, w, h) => {
      const screen = Dimensions.get("window");
      const cardWidth = Math.min(width, screen.width - 16);
      const left = Math.max(8, Math.min(x, screen.width - cardWidth - 8));
      const below = y + h + 8;
      const top = below + height > screen.height - 8 ? Math.max(8, y - height - 8) : below;
      setPosition({ top, left });
      setOpen(true);
    });
  }

  return (
    <>
      <View ref={anchor} collapsable={false} style={style}>
        {/* eslint-disable-next-line react-hooks/refs -- toggle only reads the anchor inside the press handler */}
        {renderTrigger(open, toggle)}
      </View>
      <Modal visible={open} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
        <Pressable style={styles.popoverScrim} onPress={close}>
          <Pressable
            style={[
              styles.popoverCard,
              { top: position.top, left: position.left, width: Math.min(width, Dimensions.get("window").width - 16) },
              shadow("#000000", 0.55),
            ]}
            onPress={(event) => event.stopPropagation()}
          >
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {children(close)}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export function ComboBox({
  options,
  value,
  onChange,
  stops = G.hero,
  icon,
  placeholder = "Select",
  displayValue,
  compact,
  style,
}: {
  options: { key: string; label: string; hint?: string }[];
  value: string;
  onChange: (key: string) => void;
  stops?: Stops;
  icon?: IconName;
  placeholder?: string;
  /** Overrides the trigger text when the value is not one of the options. */
  displayValue?: string;
  compact?: boolean;
  style?: ViewStyle;
}) {
  const selected = options.find((option) => option.key === value);
  return (
    <Popover
      width={280}
      height={options.length * 52 + 28}
      style={style}
      renderTrigger={(open, toggle) => (
        <Pressable
          onPress={toggle}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.comboTrigger,
            compact && styles.comboTriggerCompact,
            open && styles.comboTriggerOpen,
            pressed && { opacity: 0.85 },
          ]}
        >
          {icon ? <Glyph name={icon} size={compact ? 13 : 15} color={C.textMuted} /> : null}
          <Text style={[styles.comboText, compact && styles.comboTextCompact]} numberOfLines={1}>
            {displayValue ?? selected?.label ?? placeholder}
          </Text>
          <View style={{ transform: [{ rotate: open ? "270deg" : "90deg" }] }}>
            <Glyph name="chevron" size={compact ? 12 : 14} color={C.textMuted} />
          </View>
        </Pressable>
      )}
    >
      {(close) => (
        <View style={{ gap: 4 }}>
          {options.map((option) => {
            const active = option.key === value;
            return (
              <Pressable
                key={option.key}
                onPress={() => {
                  onChange(option.key);
                  close();
                }}
                style={({ pressed }) => [styles.comboOption, pressed && { opacity: 0.85 }]}
              >
                {active ? (
                  <LinearGradient
                    colors={stops}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.comboOptionLabel, active && { color: C.white }]}>
                    {option.label}
                  </Text>
                  {option.hint ? (
                    <Text style={[styles.comboOptionHint, active && { color: "rgba(255,255,255,0.72)" }]}>
                      {option.hint}
                    </Text>
                  ) : null}
                </View>
                {active ? <Glyph name="check" size={16} color={C.white} /> : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </Popover>
  );
}

/* ------------------------------------------------------------------------- *
 * Charts
 * ------------------------------------------------------------------------- */

export function BarChart({
  data,
  stops = G.revenue,
  height = 128,
}: {
  data: { label: string; value: number }[];
  stops?: Stops;
  height?: number;
}) {
  const peak = Math.max(...data.map((row) => row.value), 1);
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height }}>
        {data.map((row, index) => (
          <View key={`bar-${row.label}-${index}`} style={{ flex: 1, justifyContent: "flex-end", height }}>
            <LinearGradient
              colors={stops}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{
                width: "100%",
                height: `${Math.max(4, (row.value / peak) * 100)}%`,
                minHeight: row.value > 0 ? 6 : 2,
                borderRadius: 7,
                opacity: row.value > 0 ? 1 : 0.25,
              }}
            />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 6, marginTop: 7 }}>
        {data.map((row, index) => (
          <Text
            key={`tick-${row.label}-${index}`}
            style={{ flex: 1, textAlign: "center", color: C.textFaint, fontSize: 9.5, fontWeight: "700" }}
            numberOfLines={1}
          >
            {row.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function ShareBars({
  rows,
  emptyLabel = "Nothing recorded in this period.",
}: {
  rows: { label: string; value: number; display: string; color: string }[];
  emptyLabel?: string;
}) {
  if (!rows.length) {
    return <EmptyState icon="chart" title="Nothing to compare yet" subtitle={emptyLabel} compact />;
  }
  const peak = Math.max(...rows.map((row) => row.value), 1);
  return (
    <View style={{ gap: 12 }}>
      {rows.map((row) => (
        <View key={row.label} style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
            <Text style={styles.shareLabel} numberOfLines={1}>
              {row.label}
            </Text>
            <Text style={[styles.shareValue, { color: row.color }]}>{row.display}</Text>
          </View>
          <View style={styles.track}>
            <LinearGradient
              colors={[`${row.color}99`, row.color] as Stops}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: `${Math.max(3, (row.value / peak) * 100)}%`, height: 8, borderRadius: 4 }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export function MetricRow({
  label,
  value,
  color,
  strong,
  icon,
}: {
  label: string;
  value: string;
  color?: string;
  strong?: boolean;
  icon?: IconName;
}) {
  return (
    <View style={styles.metric}>
      {icon ? (
        <View style={styles.metricIcon}>
          <Glyph name={icon} size={12} color={color ?? C.textMuted} />
        </View>
      ) : null}
      <Text style={styles.metricLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.metricValue, strong && { fontSize: 16 }, color ? { color } : null]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------------- *
 * Controls
 * ------------------------------------------------------------------------- */

export function Button({
  label,
  onPress,
  icon,
  stops = G.hero,
  loading,
  variant = "primary",
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  stops?: Stops;
  loading?: boolean;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const accent = variant === "danger" ? C.red : C.text;

  if (variant === "primary") {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [styles.button, { opacity: disabled ? 0.5 : pressed ? 0.9 : 1 }, style]}
      >
        <LinearGradient
          colors={stops}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        {loading ? (
          <ActivityIndicator color={C.white} />
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {icon ? <Glyph name={icon} size={16} color={C.white} /> : null}
            <Text style={styles.buttonText}>{label}</Text>
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: variant === "danger" ? "rgba(244,63,94,0.12)" : C.surfaceSoft,
          borderWidth: 1,
          borderColor: variant === "danger" ? "rgba(244,63,94,0.4)" : C.border,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={accent} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {icon ? <Glyph name={icon} size={16} color={variant === "danger" ? C.red : C.textMuted} /> : null}
          <Text style={[styles.buttonText, { color: accent }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

/** Small round action that sits beside a page title. */
export function IconButton({
  icon,
  onPress,
  stops = G.slate,
  label,
  busy,
}: {
  icon: IconName;
  onPress: () => void;
  stops?: Stops;
  label?: string;
  busy?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label ?? icon}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconButton,
        shadow(stops[0], 0.4),
        pressed && { opacity: 0.75, transform: [{ scale: 0.94 }] },
        busy && { opacity: 0.6 },
      ]}>
      <LinearGradient colors={stops} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {busy ? (
        <ActivityIndicator color={C.white} />
      ) : (
        <Glyph name={icon} size={17} color={C.white} />
      )}
    </Pressable>
  );
}

/** Header refresh — gradient orb with a glow and a spinning glyph while busy. */
export function RefreshButton({
  onPress,
  busy,
  stops = G.hero,
  label = "Refresh",
}: {
  onPress: () => void;
  busy?: boolean;
  stops?: Stops;
  label?: string;
}) {
  const spin = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (!busy) {
      spin.stopAnimation();
      spin.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [busy, spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [
        styles.refreshButton,
        shadow(stops[0], 0.55),
        pressed && { opacity: 0.85, transform: [{ scale: 0.94 }] },
      ]}
    >
      <LinearGradient
        colors={stops}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.refreshRing} />
      {busy ? (
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Glyph name="refresh" size={17} color={C.white} />
        </Animated.View>
      ) : (
        <Glyph name="refresh" size={17} color={C.white} />
      )}
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  keyboardType,
  autoCapitalize = "none",
  error,
  hint,
  icon,
  multiline,
  editable = true,
  onSubmitEditing,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: "default" | "number-pad" | "phone-pad" | "email-address" | "decimal-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  error?: string;
  hint?: string;
  icon?: IconName;
  multiline?: boolean;
  editable?: boolean;
  onSubmitEditing?: () => void;
}) {
  const [hidden, setHidden] = useState(Boolean(secure));
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.fieldBox,
          !editable && { opacity: 0.6 },
          focused && !error && styles.fieldBoxFocused,
          error ? { borderColor: C.red } : null,
        ]}
      >
        {icon ? (
          <Glyph name={icon} size={15} color={error ? C.red : focused ? C.violet : C.textFaint} />
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={C.textFaint}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={editable}
          multiline={multiline}
          underlineColorAndroid="transparent"
          style={[styles.input, multiline && { height: 76, paddingTop: 12 }]}
        />
        {secure ? (
          <Pressable hitSlop={8} onPress={() => setHidden((current) => !current)}>
            <Glyph name={hidden ? "eye" : "eye_off"} size={16} color={C.textFaint} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.fieldError}>{error}</Text>
      ) : hint ? (
        <Text style={styles.fieldHint}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function ToggleRow({
  label,
  hint,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {hint ? <Text style={styles.toggleHint}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: C.surfaceAlt, true: "rgba(139,92,246,0.55)" }}
        thumbColor={value ? C.white : C.textFaint}
        ios_backgroundColor={C.surfaceAlt}
      />
    </View>
  );
}

export function CheckRow({
  label,
  hint,
  value,
  onValueChange,
  disabled,
  icon,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [
        styles.checkRow,
        value && styles.checkRowOn,
        pressed && { opacity: 0.88, transform: [{ scale: 0.995 }] },
        disabled && { opacity: 0.55 },
      ]}
    >
      <View style={[styles.checkIcon, value && styles.checkIconOn]}>
        {icon ? (
          <Glyph name={icon} size={16} color={value ? C.white : C.textFaint} />
        ) : (
          <View style={[styles.checkDot, value && styles.checkDotOn]} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {hint ? <Text style={styles.toggleHint}>{hint}</Text> : null}
      </View>
      <View style={[styles.checkBox, value && styles.checkBoxOn]}>
        {value ? <Glyph name="check" size={12} color={C.white} /> : null}
      </View>
    </Pressable>
  );
}

export function Sheet({
  visible,
  title,
  subtitle,
  icon,
  stops = G.hero,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  icon?: IconName;
  stops?: Stops;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.sheetScrim} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}
          onPress={(event) => event.stopPropagation()}
        >
          <LinearGradient colors={stops} style={styles.sheetGrip} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
            {icon ? (
              <LinearGradient colors={stops} style={styles.panelIcon}>
                <Glyph name={icon} size={15} color={C.white} />
              </LinearGradient>
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>{title}</Text>
              {subtitle ? <Text style={styles.sheetSub}>{subtitle}</Text> : null}
            </View>
            <Pressable hitSlop={10} onPress={onClose}>
              <Glyph name="close" size={22} color={C.textMuted} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={{ gap: 12 }}>{children}</View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ------------------------------------------------------------------------- *
 * Feedback
 * ------------------------------------------------------------------------- */

export function EmptyState({
  icon = "box",
  title,
  subtitle,
  compact,
  action,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  compact?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <View style={[styles.empty, compact && { paddingVertical: 18 }]}>
      <LinearGradient colors={G.slate} style={styles.emptyIcon}>
        <Glyph name={icon} size={20} color={C.textMuted} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
      {action ? <View style={{ marginTop: 6 }}>{action}</View> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Panel title="Something went wrong" icon="warn" stops={G.danger}>
      <Text style={styles.emptySub}>{message}</Text>
      <View style={{ marginTop: 12 }}>
        <Button label="Try again" icon="refresh" onPress={onRetry} variant="ghost" />
      </View>
    </Panel>
  );
}

export function LoadingState({ label = "Loading your numbers" }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <LinearGradient colors={G.hero} style={styles.loadingRing}>
        <ActivityIndicator color={C.white} size="large" />
      </LinearGradient>
      <Text style={styles.loadingLabel}>{label}</Text>
    </View>
  );
}

/** Destructive confirmation — the mobile twin of the console AlertDialog. */
export function Confirm({
  visible,
  title,
  body,
  confirmLabel = "Delete",
  busy,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.confirmScrim}>
        <View style={styles.confirmBox}>
          <LinearGradient colors={G.danger} style={styles.confirmIcon}>
            <Glyph name="warn" size={20} color={C.white} />
          </LinearGradient>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmBody}>{body}</Text>
          <View style={{ gap: 9, marginTop: 6 }}>
            <Button label={confirmLabel} icon="trash" variant="danger" onPress={onConfirm} loading={busy} />
            <Button label="Keep it" variant="ghost" onPress={onCancel} disabled={busy} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: C.violet, fontSize: 9.5, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" },
  pageRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  pageIcon: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  pageTitle: { color: C.text, fontSize: 21, fontWeight: "900", letterSpacing: -0.5 },
  pageSub: { color: C.textMuted, fontSize: 11.5, marginTop: 1 },
  pageRule: { height: 2, borderRadius: 1 },
  panel: {
    backgroundColor: C.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: 15,
  },
  panelTitle: { color: C.text, fontSize: 15, fontWeight: "800", letterSpacing: -0.2 },
  panelSub: { color: C.textFaint, fontSize: 12, marginTop: 2 },
  panelIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  hero: { borderRadius: radius.xl, padding: 18, overflow: "hidden" },
  heroGlow: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  heroValue: { color: C.white, fontSize: 30, fontWeight: "900", letterSpacing: -1, marginTop: 6 },
  heroCaption: { color: "rgba(255,255,255,0.86)", fontSize: 12.5, marginTop: 6, lineHeight: 18 },
  tile: {
    flex: 1,
    minWidth: 148,
    backgroundColor: C.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C.border,
    padding: 13,
    overflow: "hidden",
    gap: 7,
  },
  tileAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3.5 },
  tileIcon: { width: 27, height: 27, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  tileValue: { color: C.text, fontSize: 18, fontWeight: "900", letterSpacing: -0.5 },
  tileLabel: { color: C.textMuted, fontSize: 11.5, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  tileHint: { color: C.textFaint, fontSize: 11 },
  kpiCard: {
    flex: 1,
    minWidth: 148,
    minHeight: 140,
    justifyContent: "space-between",
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(13,13,23,0.72)",
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: "#000000",
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
    elevation: 9,
  },
  kpiCardPressable: { borderColor: "rgba(255,255,255,0.16)" },
  kpiCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }, { translateY: 1 }],
    borderColor: "rgba(255,255,255,0.20)",
  },
  kpiWash: {
    position: "absolute",
    top: -56,
    right: -48,
    width: 172,
    height: 172,
    borderRadius: 86,
    opacity: 0.45,
  },
  kpiBar: { position: "absolute", top: 0, left: 0, right: 0, height: 1 },
  kpiTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  kpiLabel: {
    color: "#A1A1AA",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  kpiValue: {
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: -0.6,
    marginTop: 9,
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiHintRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  kpiDot: { width: 6, height: 6, borderRadius: 3 },
  kpiHint: { color: "#71717A", fontSize: 11, lineHeight: 15, flex: 1 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surfaceSoft,
  },
  chipActive: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill },
  chipText: { fontSize: 12.5, fontWeight: "900" },
  channelRow: { flexDirection: "row", gap: 10 },
  channelCard: {
    flex: 1,
    overflow: "hidden",
    gap: 10,
    minHeight: 104,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: radius.md,
    backgroundColor: C.surfaceAlt,
    padding: 12,
  },
  channelCardActive: { borderColor: "rgba(255,255,255,0.2)" },
  channelCardFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.96,
  },
  channelHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  channelIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: C.border,
  },
  channelIconActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.34)",
  },
  channelTick: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: C.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  channelTickActive: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderColor: "rgba(255,255,255,0.62)",
  },
  channelLabel: { color: C.text, fontSize: 14, fontWeight: "900", letterSpacing: -0.2 },
  channelHint: { color: C.textMuted, fontSize: 10.5, lineHeight: 14 },
  shareLabel: { color: C.textMuted, fontSize: 12.5, fontWeight: "700", flex: 1 },
  shareValue: { fontSize: 12.5, fontWeight: "900" },
  track: { height: 8, borderRadius: 4, backgroundColor: C.surfaceAlt, overflow: "hidden" },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  metricIcon: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: C.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: { color: C.textMuted, fontSize: 13, flex: 1 },
  metricValue: { color: C.text, fontSize: 14, fontWeight: "800" },
  button: {
    height: 50,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 16,
  },
  buttonText: { color: C.text, fontSize: 15, fontWeight: "900", letterSpacing: -0.2 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  refreshRing: {
    position: "absolute",
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  popoverScrim: { flex: 1, backgroundColor: "rgba(4,7,18,0.55)" },
  popoverCard: {
    position: "absolute",
    backgroundColor: C.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: C.borderStrong,
    padding: 12,
    maxHeight: "76%",
  },
  comboTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 46,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
  },
  comboTriggerOpen: { borderColor: C.borderStrong, backgroundColor: C.surface },
  comboTriggerCompact: { height: 34, paddingHorizontal: 9, borderRadius: 10, gap: 5 },
  comboText: { flex: 1, color: C.text, fontSize: 13, fontWeight: "800" },
  comboTextCompact: { fontSize: 12.5 },
  comboOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    overflow: "hidden",
  },
  comboOptionLabel: { color: C.text, fontSize: 13.5, fontWeight: "800" },
  comboOptionHint: { color: C.textFaint, fontSize: 11, marginTop: 1 },
  fieldLabel: { color: C.textMuted, fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.9 },
  fieldBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
  },
  fieldBoxFocused: {
    borderColor: C.violet,
    backgroundColor: "rgba(139,92,246,0.08)",
  },
  input: {
    flex: 1,
    color: C.text,
    fontSize: 15,
    paddingVertical: 13,
    minHeight: 48,
    outlineStyle: "none",
  } as TextStyle & { outlineStyle: "none" },
  fieldError: { color: C.red, fontSize: 12, fontWeight: "700" },
  fieldHint: { color: C.textFaint, fontSize: 11.5 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleLabel: { color: C.text, fontSize: 14, fontWeight: "800" },
  toggleHint: { color: C.textFaint, fontSize: 11.5, marginTop: 2 },
  payTo: {
    overflow: "hidden",
    gap: 10,
    backgroundColor: C.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.35)",
    padding: 14,
  },
  payToWash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.13,
  },
  payToTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  payToIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  payToEyebrow: { color: C.emerald, fontSize: 9.5, fontWeight: "900", letterSpacing: 1.3 },
  payToBank: { color: C.textMuted, fontSize: 11.5, fontWeight: "700", marginTop: 1 },
  payToAmountLabel: {
    color: C.textFaint,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: 1,
  },
  payToAmount: {
    color: C.emerald,
    fontSize: 13,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  payToNumber: {
    color: C.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: 1.5,
    fontVariant: ["tabular-nums"],
  },
  payToNote: { color: C.textFaint, fontSize: 11.5, lineHeight: 16 },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: radius.md,
    backgroundColor: C.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  checkRowOn: {
    borderColor: "rgba(139,92,246,0.55)",
    backgroundColor: "rgba(139,92,246,0.11)",
  },
  checkIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: C.border,
  },
  checkIconOn: { backgroundColor: C.violet, borderColor: C.violet },
  checkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.textFaint,
  },
  checkDotOn: { backgroundColor: C.white },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.borderStrong,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  checkBoxOn: { backgroundColor: C.violet, borderColor: C.violet },
  sheetScrim: { flex: 1, backgroundColor: C.overlay, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 18,
    paddingTop: 10,
    maxHeight: "86%",
  },
  sheetGrip: { alignSelf: "center", width: 46, height: 5, borderRadius: 3, marginBottom: 12 },
  sheetTitle: { color: C.text, fontSize: 19, fontWeight: "900", letterSpacing: -0.4 },
  sheetSub: { color: C.textFaint, fontSize: 12.5, marginTop: 2 },
  empty: { alignItems: "center", justifyContent: "center", gap: 9, paddingVertical: 30 },
  emptyIcon: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  emptyTitle: { color: C.text, fontSize: 15, fontWeight: "900" },
  emptySub: { color: C.textMuted, fontSize: 12.5, textAlign: "center", lineHeight: 18, maxWidth: 300 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingVertical: 40 },
  loadingRing: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center" },
  loadingLabel: { color: C.textMuted, fontSize: 13, fontWeight: "700" },
  confirmScrim: {
    flex: 1,
    backgroundColor: C.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: 26,
  },
  confirmBox: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: C.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(244,63,94,0.35)",
    padding: 20,
    alignItems: "center",
    gap: 9,
  },
  confirmIcon: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  confirmTitle: { color: C.text, fontSize: 18, fontWeight: "900", textAlign: "center" },
  confirmBody: {
    color: C.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 4,
  },
});
