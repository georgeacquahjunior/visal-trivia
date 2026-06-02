import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { verifyGoogleCredential, verifyName } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = window.localStorage.getItem("visal_trivia_user");
    if (!savedUser) {
      return null;
    }
    try {
      return JSON.parse(savedUser);
    } catch {
      window.localStorage.removeItem("visal_trivia_user");
      return null;
    }
  });

  const loginWithGoogleCredential = useCallback(async (credential) => {
    const { user: googleUser } = await verifyGoogleCredential(credential);
    const nextUser = {
      ...googleUser,
      credential,
      provider: "google",
      loggedInAt: new Date().toISOString(),
    };
    window.localStorage.setItem("visal_trivia_user", JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  }, []);

  const loginWithName = useCallback(async (name) => {
    const { user: localUser } = await verifyName(name);
    const nextUser = {
      ...localUser,
      credential: "",
      provider: "local",
      loggedInAt: new Date().toISOString(),
    };
    window.localStorage.setItem("visal_trivia_user", JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem("visal_trivia_user");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loginWithGoogleCredential, loginWithName, logout }),
    [loginWithGoogleCredential, loginWithName, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
