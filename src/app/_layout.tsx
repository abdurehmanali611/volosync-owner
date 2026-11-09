import "../global.css";

import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { SessionProvider, useSession } from "@/lib/session";
import { C } from "@/lib/theme";

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: C.violet,
    background: C.bg,
    card: C.surface,
    border: C.border,
    text: C.text,
    notification: C.rose,
  },
};

function Navigator() {
  const { state } = useSession();
  const signedIn = state === "ready";

  useEffect(() => {
    if (state !== "booting") SplashScreen.hideAsync();
  }, [state]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <SessionProvider>
        <Navigator />
      </SessionProvider>
    </ThemeProvider>
  );
}
