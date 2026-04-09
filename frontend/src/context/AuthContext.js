import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../config/api";
import { generateSignupKeyMaterial, reconstructMEKFromLogin } from "../crypto/cryptoUtils";
import { useCrypto } from "./CryptoContext";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("vaultUser");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const { setMEK, clearMEK, setLockCallback } = useCrypto();

  // When MEK is auto-cleared by inactivity timer, redirect to /unlock
  useEffect(() => {
    setLockCallback(() => {
      window.location.href = "/unlock";
    });
  }, [setLockCallback]);

  const register = useCallback(async ({ name, email, password }) => {
    const {
      mek, recoveryCode,
      encryptedMasterKey, masterKeyIv, kdfSalt, kdfIterations,
      encryptedMasterKeyRecovery, masterKeyRecoveryIv, recoverySalt,
    } = await generateSignupKeyMaterial(password);

    const { data } = await api.post("/api/auth/register", {
      name, email, password,
      encryptedMasterKey, masterKeyIv, kdfSalt, kdfIterations,
      encryptedMasterKeyRecovery, masterKeyRecoveryIv, recoverySalt,
    });

    localStorage.setItem("vaultUser", JSON.stringify(data.user));
    setUser(data.user);
    setMEK(mek);

    return { ...data, recoveryCode };
  }, [setMEK]);

  const login = useCallback(async ({ email, password, totpToken }) => {
    const { data } = await api.post("/api/auth/login", { email, password, totpToken });

    // Server may require 2FA first
    if (data.requires2FA) return data;

    localStorage.setItem("vaultUser", JSON.stringify(data.user));
    setUser(data.user);

    const mek = await reconstructMEKFromLogin(password, data.user);
    setMEK(mek);

    return data;
  }, [setMEK]);

  const logout = useCallback(async () => {
    try { await api.post("/api/auth/logout"); } catch { /* ignore */ }
    localStorage.removeItem("vaultUser");
    setUser(null);
    clearMEK();
  }, [clearMEK]);

  // Refresh user object from server (e.g. after 2FA enable)
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get("/api/auth/me");
      localStorage.setItem("vaultUser", JSON.stringify(data.user));
      setUser(data.user);
    } catch { /* session expired */ }
  }, []);

  return (
    <AuthContext.Provider value={{ user, register, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
