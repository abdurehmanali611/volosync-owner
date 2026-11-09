import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Field, Glyph, type IconName } from "@/components/kit";
import { ApiError } from "@/lib/api";
import { useSession } from "@/lib/session";
import { C, G, radius, shadow, type Stops } from "@/lib/theme";

const MARQUEE: { label: string; icon: IconName; stops: Stops }[] = [
  { label: "Revenue across every branch", icon: "money", stops: G.revenue },
  { label: "Main or satellite in one tap", icon: "branch", stops: G.branch },
  { label: "Yearly subscription in seconds", icon: "gift", stops: G.stock },
];

export default function SignIn() {
  const { loginWith, notice } = useSession();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState(notice);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setFields({});
    setFailure("");
    try {
      await loginWith(username.trim(), password);
    } catch (error) {
      if (error instanceof ApiError) {
        setFields(error.fields);
        setFailure(error.fields.message ?? error.message);
      } else {
        setFailure("Could not sign you in. Try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#2A1663", "#131A36", C.bg] as Stops}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orbA} />
      <View style={styles.orbB} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 30 }]}
      >
        <View style={styles.logoWrap}>
          <LinearGradient colors={G.hero} style={[styles.logo, shadow(C.violet, 0.6)]}>
            <Glyph name="bolt" size={26} color={C.white} />
          </LinearGradient>
        </View>

        <Text style={styles.brand}>VoloSync Owner</Text>
        <Text style={styles.tagline}>
          The whole wholesale business in your pocket — stock, tax, branches and renewal.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in</Text>
          <Text style={styles.cardSub}>Use the owner account issued for your company.</Text>

          <View style={{ gap: 13, marginTop: 18 }}>
            {failure ? (
              <View style={styles.alert}>
                <Glyph name="warn" size={15} color={C.rose} />
                <Text style={styles.alertText}>{failure}</Text>
              </View>
            ) : null}

            <Field
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="owner"
              icon="person"
              autoCapitalize="none"
              error={fields.username}
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              icon="lock"
              secure
              error={fields.password}
              onSubmitEditing={submit}
            />

            <Button
              label={busy ? "Signing in" : "Enter dashboard"}
              icon="signout"
              onPress={submit}
              loading={busy}
              stops={G.hero}
            />
          </View>
        </View>

        <View style={styles.marquee}>
          {MARQUEE.map((row) => (
            <View key={row.label} style={styles.marqueeRow}>
              <LinearGradient colors={row.stops} style={styles.marqueeIcon}>
                <Glyph name={row.icon} size={13} color={C.white} />
              </LinearGradient>
              <Text style={styles.marqueeText}>{row.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.serverHint}>
          Your account is issued by the VoloSync console for your company. Ask your VoloSync
          representative if the sign-in does not work.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, alignItems: "stretch" },
  orbA: {
    position: "absolute",
    top: -70,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(139,92,246,0.22)",
  },
  orbB: {
    position: "absolute",
    bottom: 90,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(34,211,238,0.14)",
  },
  logoWrap: { alignItems: "center" },
  logo: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    color: C.text,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -1,
    textAlign: "center",
    marginTop: 16,
  },
  tagline: {
    color: C.textMuted,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 320,
    alignSelf: "center",
  },
  card: {
    marginTop: 24,
    backgroundColor: C.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
  },
  cardTitle: { color: C.text, fontSize: 19, fontWeight: "900", letterSpacing: -0.4 },
  cardSub: { color: C.textFaint, fontSize: 12.5, marginTop: 3 },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(251,113,133,0.12)",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.4)",
    borderRadius: radius.sm,
    padding: 11,
  },
  alertText: { color: C.rose, fontSize: 12.5, fontWeight: "700", flex: 1 },
  marquee: { marginTop: 20, gap: 11 },
  marqueeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  marqueeIcon: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  marqueeText: { color: C.textMuted, fontSize: 13, fontWeight: "700" },
  serverRow: { marginTop: 22 },
  serverHint: { color: C.textFaint, fontSize: 11.5, textAlign: "center", lineHeight: 17 },
});
