import { createContext, useContext, useRef, useCallback, useEffect } from "react";

const CryptoContext = createContext(null);

const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes

export const CryptoProvider = ({ children }) => {
  const mekRef     = useRef(null);
  const timerRef   = useRef(null);
  const lockCbRef  = useRef(null); // callback to call on lock (set by AuthContext)

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!mekRef.current)  return;
    timerRef.current = setTimeout(() => {
      mekRef.current = null;
      if (lockCbRef.current) lockCbRef.current();
    }, INACTIVITY_MS);
  }, []);

  const setMEK = useCallback((key) => {
    mekRef.current = key;
    resetTimer();
  }, [resetTimer]);

  const getMEK = useCallback(() => mekRef.current, []);

  const clearMEK = useCallback(() => {
    mekRef.current = null;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const hasMEK = useCallback(() => mekRef.current !== null, []);

  const setLockCallback = useCallback((cb) => {
    lockCbRef.current = cb;
  }, []);

  // Reset timer on user activity
  useEffect(() => {
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    const handler = () => { if (mekRef.current) resetTimer(); };
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, handler));
  }, [resetTimer]);

  return (
    <CryptoContext.Provider value={{ setMEK, getMEK, clearMEK, hasMEK, setLockCallback }}>
      {children}
    </CryptoContext.Provider>
  );
};

export const useCrypto = () => useContext(CryptoContext);
