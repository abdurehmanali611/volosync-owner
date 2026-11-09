import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/** Persistent key-value: Keychain/Keystore on native, localStorage on web. */

export async function readItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function writeItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      /* private browsing */
    }
    return;
  }
  await SecureStore.setItemAsync(key, value).catch(() => undefined);
}

export async function dropItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      /* nothing stored */
    }
    return;
  }
  await SecureStore.deleteItemAsync(key).catch(() => undefined);
}
