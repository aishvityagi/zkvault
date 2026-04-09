import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PasswordStrengthMeter } from "../components/VaultComponents";

export default function Register() {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [recoveryCode, setRecoveryCode] = useState(null);
  const [confirmed, setConfirmed]       = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("Passwords do not match.");
    if (password.length < 8)  return setError("Password must be at least 8 characters.");
    setLoading(true);
    try {
      const result = await register({ name, email, password });
      setRecoveryCode(result.recoveryCode);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob(
      [`ZK VAULT — RECOVERY CODE\n\n${recoveryCode}\n\nKeep this safe. Do not share it.\nYou cannot recover your vault without this code.`],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href = url; a.download = "zkvault-recovery-code.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  if (recoveryCode) return (
    <div style={pg}>
      <div style={glow1} /><div style={glow2} />
      <div style={{ ...card, maxWidth: 500 }}>
        <div style={warningBadge}>⚠ ACTION REQUIRED</div>
        <h1 style={title}>Save Your Recovery Code</h1>
        <p style={sub}>
          This is the <strong style={{ color: "#fbbf24" }}>only way to recover your vault</strong> if
          you forget your password. We cannot recover it for you — it is never stored on our servers.
        </p>
        <div style={codeBox}>{recoveryCode}</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <button onClick={() => navigator.clipboard.writeText(recoveryCode)} style={outlineBtn}>📋 Copy</button>
          <button onClick={handleDownload} style={outlineBtn}>💾 Download .txt</button>
        </div>
        <label style={checkLabel}>
          <input
            type="checkbox" checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            style={{ accentColor: "#7c3aed", width: 16, height: 16 }}
          />
          <span style={{ color: "#94a3b8", fontSize: 14 }}>
            I have saved my recovery code in a secure location
          </span>
        </label>
        <button
          disabled={!confirmed}
          onClick={() => navigate("/dashboard")}
          style={{ ...btn, marginTop: 20, opacity: confirmed ? 1 : 0.35, cursor: confirmed ? "pointer" : "not-allowed" }}
        >
          Continue to Dashboard →
        </button>
      </div>
    </div>
  );

  return (
    <div style={pg}>
      <div style={glow1} /><div style={glow2} />
      <div style={card}>
        <div style={badge}>END-TO-END ENCRYPTED</div>
        <div style={iconWrap}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="#a78bfa"/>
          </svg>
        </div>
        <h1 style={title}>Create Your Vault</h1>
        <p style={sub}>Your encryption keys are generated locally.<br />We never see your data.</p>

        <form onSubmit={handleRegister} style={form}>
          <div style={fieldWrap}>
            <label style={lbl}>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="John Doe" required style={input}
              onFocus={e => e.target.style.borderColor = "#7c3aed"}
              onBlur={e => e.target.style.borderColor = "#1e1e2e"} />
          </div>
          <div style={fieldWrap}>
            <label style={lbl}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" required style={input}
              onFocus={e => e.target.style.borderColor = "#7c3aed"}
              onBlur={e => e.target.style.borderColor = "#1e1e2e"} />
          </div>
          <div style={fieldWrap}>
            <label style={lbl}>Master Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••" required style={input}
              onFocus={e => e.target.style.borderColor = "#7c3aed"}
              onBlur={e => e.target.style.borderColor = "#1e1e2e"} />
            <PasswordStrengthMeter password={password} />
          </div>
          <div style={fieldWrap}>
            <label style={lbl}>Confirm Password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••••••" required style={input}
              onFocus={e => e.target.style.borderColor = "#7c3aed"}
              onBlur={e => e.target.style.borderColor = "#1e1e2e"} />
          </div>
          {error && <div style={errorBox}>⚠ {error}</div>}
          <button type="submit" disabled={loading} style={loading ? { ...btn, opacity: 0.7 } : btn}>
            {loading ? "Generating encryption keys..." : "Create Vault →"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#475569" }}>
          Already have an account?{" "}
          <Link to="/" style={{ color: "#a78bfa", textDecoration: "none", fontWeight: 500 }}>Login</Link>
        </p>
      </div>
    </div>
  );
}

const pg = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" };
const glow1 = { position: "fixed", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, #7c3aed18 0%, transparent 70%)", top: -200, left: -200, pointerEvents: "none" };
const glow2 = { position: "fixed", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #2563eb14 0%, transparent 70%)", bottom: -150, right: -150, pointerEvents: "none" };
const card = { width: "100%", maxWidth: 420, background: "#0d0d1a", border: "1px solid #1e1e2e", borderRadius: 20, padding: "40px 36px", boxShadow: "0 0 0 1px #ffffff04, 0 24px 64px #00000060", position: "relative", zIndex: 1, animation: "fadeIn 0.3s ease" };
const badge = { display: "inline-block", background: "#7c3aed15", border: "1px solid #7c3aed40", color: "#a78bfa", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", padding: "4px 10px", borderRadius: 20, marginBottom: 20 };
const warningBadge = { display: "inline-block", background: "#f59e0b15", border: "1px solid #f59e0b40", color: "#fbbf24", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", padding: "4px 10px", borderRadius: 20, marginBottom: 20 };
const iconWrap = { width: 64, height: 64, background: "#7c3aed15", border: "1px solid #7c3aed30", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 };
const title = { fontSize: 24, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 };
const sub = { fontSize: 13, color: "#475569", marginBottom: 28, lineHeight: 1.6 };
const form = { display: "flex", flexDirection: "column", gap: 16 };
const fieldWrap = { display: "flex", flexDirection: "column", gap: 6 };
const lbl = { fontSize: 12, fontWeight: 500, color: "#64748b", letterSpacing: "0.05em" };
const input = { background: "#080810", border: "1px solid #1e1e2e", borderRadius: 10, padding: "11px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", transition: "border-color 0.2s", width: "100%" };
const btn = { background: "linear-gradient(135deg, #7c3aed, #2563eb)", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%", boxShadow: "0 4px 20px #7c3aed30" };
const outlineBtn = { flex: 1, background: "transparent", color: "#a78bfa", border: "1px solid #7c3aed40", borderRadius: 8, padding: "10px", fontSize: 13, cursor: "pointer", fontWeight: 500 };
const codeBox = { background: "#080810", border: "1px solid #7c3aed40", borderRadius: 10, padding: "18px 20px", fontFamily: "'Courier New', monospace", fontSize: 15, color: "#4ade80", letterSpacing: "0.08em", textAlign: "center", margin: "20px 0 14px", wordBreak: "break-all" };
const checkLabel = { display: "flex", alignItems: "center", gap: 10, cursor: "pointer" };
const errorBox = { background: "#f8717115", border: "1px solid #f8717130", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13 };
