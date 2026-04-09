import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { reconstructMEKFromLogin } from "../crypto/cryptoUtils";
import { useCrypto } from "../context/CryptoContext";
import { useAuth }   from "../context/AuthContext";

export default function Unlock() {
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const { setMEK }       = useCrypto();
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const handleUnlock = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const mek = await reconstructMEKFromLogin(password, user);
      setMEK(mek);
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof DOMException) setError("Incorrect password.");
      else setError("Unlock failed. Please log in again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pg}>
      <div style={glow1} /><div style={glow2} />
      <div style={card}>
        <div style={lockIcon}>🔒</div>
        <h1 style={title}>Vault Locked</h1>
        <p style={sub}>
          Signed in as <strong style={{ color: "#a78bfa" }}>{user?.email}</strong>
          <br />Re-enter your master password to continue.
        </p>
        <div style={infoBox}>
          ⏱ Vault auto-locks after 5 minutes of inactivity
        </div>
        <form onSubmit={handleUnlock} style={form}>
          <div style={fieldWrap}>
            <label style={label}>Master Password</label>
            <input
              type="password" placeholder="••••••••••••"
              onChange={(e) => setPassword(e.target.value)}
              autoFocus required style={input}
              onFocus={e => e.target.style.borderColor = "#7c3aed"}
              onBlur={e => e.target.style.borderColor = "#1e1e2e"}
            />
          </div>
          {error && <div style={errorBox}>⚠ {error}</div>}
          <button type="submit" disabled={loading} style={loading ? { ...btn, opacity: 0.7 } : btn}>
            {loading ? "Unlocking..." : "Unlock Vault →"}
          </button>
        </form>
        <button onClick={() => { logout(); navigate("/"); }} style={logoutLnk}>
          Sign in as a different user
        </button>
      </div>
    </div>
  );
}

const pg = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" };
const glow1 = { position: "fixed", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, #7c3aed18 0%, transparent 70%)", top: -200, left: -200, pointerEvents: "none" };
const glow2 = { position: "fixed", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #2563eb14 0%, transparent 70%)", bottom: -150, right: -150, pointerEvents: "none" };
const card = { width: "100%", maxWidth: 420, background: "#0d0d1a", border: "1px solid #1e1e2e", borderRadius: 20, padding: "40px 36px", boxShadow: "0 0 0 1px #ffffff04, 0 24px 64px #00000060", position: "relative", zIndex: 1, textAlign: "center", animation: "fadeIn 0.3s ease" };
const lockIcon = { fontSize: 52, marginBottom: 16 };
const title = { fontSize: 24, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 };
const sub = { fontSize: 13, color: "#475569", marginBottom: 16, lineHeight: 1.7 };
const infoBox = { background: "#7c3aed10", border: "1px solid #7c3aed25", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#7c6aad", marginBottom: 24 };
const form = { display: "flex", flexDirection: "column", gap: 16, textAlign: "left" };
const fieldWrap = { display: "flex", flexDirection: "column", gap: 6 };
const label = { fontSize: 12, fontWeight: 500, color: "#64748b", letterSpacing: "0.05em" };
const input = { background: "#080810", border: "1px solid #1e1e2e", borderRadius: 10, padding: "11px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", transition: "border-color 0.2s", width: "100%" };
const btn = { background: "linear-gradient(135deg, #7c3aed, #2563eb)", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%", boxShadow: "0 4px 20px #7c3aed30" };
const errorBox = { background: "#f8717115", border: "1px solid #f8717130", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, textAlign: "left" };
const logoutLnk = { background: "none", border: "none", color: "#334155", fontSize: 13, cursor: "pointer", marginTop: 24, textDecoration: "underline" };
