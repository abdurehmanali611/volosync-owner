import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { ApiError, clearSession, fetchSession, restoreSession, signIn, type Session } from "./api";
import { resetScope } from "./scope";

type SessionState = "booting" | "signed_out" | "ready" | "rejected";

type Value = {
  state: SessionState;
  session: Session | null;
  /** Set when the signed-in account is not an OWNER or has no company. */
  notice: string;
  boot: () => Promise<void>;
  loginWith: (username: string, password: string) => Promise<void>;
  reload: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<Value | null>(null);

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>("booting");
  const [session, setSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState("");

  const loadCompany = useCallback(async (): Promise<string | null> => {
    try {
      const body = await fetchSession();
      setSession(body.data);
      setNotice("");
      setState("ready");
      return null;
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not load your company.";
      // A stored token that no longer maps to an owner is the one case where the
      // session must be dropped instead of retried.
      resetScope();
      setSession(null);
      setNotice(message);
      setState("rejected");
      await clearSession();
      return message;
    }
  }, []);

  const boot = useCallback(async () => {
    if (!(await restoreSession())) {
      setState("signed_out");
      return;
    }
    await loadCompany();
  }, [loadCompany]);

  const loginWith = useCallback(
    async (username: string, password: string) => {
      resetScope();
      await signIn(username, password);
      setNotice("");
      const failure = await loadCompany();
      if (failure) throw new ApiError(failure);
    },
    [loadCompany],
  );

  const signOut = useCallback(async () => {
    resetScope();
    await clearSession();
    setSession(null);
    setNotice("");
    setState("signed_out");
  }, []);

  const reload = useCallback(async () => {
    await loadCompany();
  }, [loadCompany]);

  useEffect(() => {
    // Boot reads the keychain before the first state write, so the restore is
    // deferred out of the mount commit.
    let alive = true;
    queueMicrotask(() => {
      if (alive) void boot();
    });
    return () => {
      alive = false;
    };
  }, [boot]);

  const value = useMemo<Value>(
    () => ({ state, session, notice, boot, loginWith, reload, signOut }),
    [state, session, notice, boot, loginWith, reload, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
