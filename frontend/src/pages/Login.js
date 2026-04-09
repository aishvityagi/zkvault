import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [totpToken, setTotp]    = useState("");
  const [needs2FA, setNeeds2FA] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login({ email, password, totpToken: needs2FA ? totpToken : undefined });
      if (result?.requires2FA) {
        setNeeds2FA(true);
        setLoading(false);
        return;
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pg}>
      <div style={glow1} />
      <div style={glow2} />
      <div style={card}>
        <div style={badge}>ZERO KNOWLEDGE</div>
        <div style={iconWrap}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C9.24 2 7 4.24 7 7v2H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2h-2V7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v2H9V7c0-1.66 1.34-3 3-3zm0 10a2 2 0 110 4 2 2 0 010-4z" fill="#a78bfa"/>
          </svg>
        </div>

        {!needs2FA ? (
          <>
            <h1 style={title}>Welcome back</h1>
            <p style={sub}>Your vault is end-to-end encrypted</p>
            <form onSubmit={handleSubmit} style={form}>
              <div style={fieldWrap}>
                <label style={label}>Email</label>
                <input
                  type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" required style={input}
                  onFocus={e => e.target.style.borderColor = "#7c3aed"}
                  onBlur={e => e.target.style.borderColor = "#1e1e2e"}
                />
              </div>
              <div style={fieldWrap}>
                <label style={label}>Master Password</label>
                <input
                  type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••" required style={input}
                  onFocus={e => e.target.style.borderColor = "#7c3aed"}
                  onBlur={e => e.target.style.borderColor = "#1e1e2e"}
                />
              </div>
              {error && <div style={errorBox}>⚠ {error}</div>}
              <button type="submit" disabled={loading} style={loading ? { ...btn, opacity: 0.7 } : btn}>
                {loading
                  ? <span style={btnInner}><Spinner /> Deriving keys...</span>
                  : <span style={btnInner}>Unlock Vault →</span>}
              </button>
            </form>
            <div style={divider}><span style={dividerText}>or</span></div>
            <div style={footerLinks}>
              <Link to="/forgot-password" style={lnk}>Forgot password?</Link>
              <Link to="/register" style={{ ...lnk, color: "#a78bfa", fontWeight: 500 }}>Create account</Link>
            </div>
          </>
        ) : (
          <>
            <h1 style={title}>Two-Factor Auth</h1>
            <p style={sub}>Enter the 6-digit code from your authenticator app.</p>
            <form onSubmit={handleSubmit} style={form}>
              <input
                type="text" inputMode="numeric" maxLength={6}
                value={totpToken}
                onChange={(e) => setTotp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000" autoFocus style={totpInput}
              />
              {error && <div style={errorBox}>⚠ {error}</div>}
              <button type="submit" disabled={loading} style={loading ? { ...btn, opacity: 0.7 } : btn}>
                {loading ? "Verifying..." : "Verify →"}
              </button>
              <button type="button" onClick={() => { setNeeds2FA(false); setTotp(""); setError(""); }} style={ghostBtn}>
                ← Back
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const Spinner = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="12" cy="12" r="10" stroke="#ffffff40" strokeWidth="3"/>
    <path d="M12 2a10 10 0 0110 10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

const pg = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" };
const glow1 = { position: "fixed", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, #7c3aed18 0%, transparent 70%)", top: -200, left: -200, pointerEvents: "none" };
const glow2 = { position: "fixed", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #2563eb14 0%, transparent 70%)", bottom: -150, right: -150, pointerEvents: "none" };
const card = { width: "100%", maxWidth: 420, background: "#0d0d1a", border: "1px solid #1e1e2e", borderRadius: 20, padding: "40px 36px", boxShadow: "0 0 0 1px #ffffff04, 0 24px 64px #00000060", position: "relative", zIndex: 1, animation: "fadeIn 0.3s ease" };
const badge = { display: "inline-block", background: "#7c3aed15", border: "1px solid #7c3aed40", color: "#a78bfa", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", padding: "4px 10px", borderRadius: 20, marginBottom: 20 };
const iconWrap = { width: 64, height: 64, background: "#7c3aed15", border: "1px solid #7c3aed30", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 };
const title = { fontSize: 24, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 };
const sub = { fontSize: 13, color: "#475569", marginBottom: 28, lineHeight: 1.5 };
const form = { display: "flex", flexDirection: "column", gap: 16 };
const fieldWrap = { display: "flex", flexDirection: "column", gap: 6 };
const label = { fontSize: 12, fontWeight: 500, color: "#64748b", letterSpacing: "0.05em" };
const input = { background: "#080810", border: "1px solid #1e1e2e", borderRadius: 10, padding: "11px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", transition: "border-color 0.2s", width: "100%" };
const totpInput = { background: "#080810", border: "1px solid #1e1e2e", borderRadius: 10, padding: "14px", color: "#4ade80", fontSize: 28, fontFamily: "monospace", textAlign: "center", letterSpacing: "0.3em", outline: "none", width: "100%" };
const btn = { background: "linear-gradient(135deg, #7c3aed, #2563eb)", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 20px #7c3aed30" };
const ghostBtn = { background: "transparent", border: "1px solid #1e1e2e", color: "#475569", borderRadius: 10, padding: "11px", fontSize: 14, cursor: "pointer" };
const btnInner = { display: "flex", alignItems: "center", justifyContent: "center", gap: 8 };
const errorBox = { background: "#f8717115", border: "1px solid #f8717130", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13 };
const divider = { display: "flex", alignItems: "center", margin: "24px 0", borderTop: "1px solid #1e1e2e", position: "relative" };
const dividerText = { position: "absolute", left: "50%", transform: "translate(-50%, -50%)", background: "#0d0d1a", padding: "0 10px", color: "#334155", fontSize: 12 };
const footerLinks = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const lnk = { color: "#475569", fontSize: 13, textDecoration: "none" };
