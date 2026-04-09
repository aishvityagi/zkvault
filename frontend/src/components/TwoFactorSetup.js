import { useState } from "react";
import api from "../config/api";
import { useAuth } from "../context/AuthContext";

export default function TwoFactorSetup({ onClose }) {
  const { refreshUser } = useAuth();
  const [step, setStep]       = useState("start"); // start | scan | verify | done
  const [qrDataUrl, setQrUrl] = useState("");
  const [secret, setSecret]   = useState("");
  const [code, setCode]       = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    setLoading(true); setError("");
    try {
      const { data } = await api.post("/api/auth/2fa/setup");
      setQrUrl(data.qrDataUrl);
      setSecret(data.secret);
      setStep("scan");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start 2FA setup.");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) return setError("Enter the 6-digit code.");
    setLoading(true); setError("");
    try {
      await api.post("/api/auth/2fa/verify", { token: code });
      await refreshUser();
      setStep("done");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={header}>
          <span style={headerTitle}>Enable Two-Factor Authentication</span>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        {step === "start" && (
          <div>
            <p style={desc}>
              Add an extra layer of security. You'll need an authenticator app like
              Google Authenticator, Authy, or 1Password.
            </p>
            {error && <div style={errBox}>⚠ {error}</div>}
            <button onClick={startSetup} disabled={loading} style={primaryBtn}>
              {loading ? "Setting up..." : "Begin Setup →"}
            </button>
          </div>
        )}

        {step === "scan" && (
          <div>
            <p style={desc}>Scan this QR code with your authenticator app.</p>
            <div style={qrWrap}>
              <img src={qrDataUrl} alt="2FA QR Code" style={{ width: 180, height: 180 }} />
            </div>
            <p style={descSmall}>
              Can't scan? Enter this key manually:
              <br />
              <code style={codeSpan}>{secret}</code>
            </p>
            <p style={desc}>Then enter the 6-digit code from the app:</p>
            <input
              type="text" inputMode="numeric" maxLength={6}
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000" style={codeInput}
              autoFocus
            />
            {error && <div style={errBox}>⚠ {error}</div>}
            <button onClick={verifyCode} disabled={loading || code.length !== 6} style={primaryBtn}>
              {loading ? "Verifying..." : "Verify & Enable →"}
            </button>
          </div>
        )}

        {step === "done" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={successIcon}>✅</div>
            <p style={desc}>Two-factor authentication is now enabled on your account.</p>
            <button onClick={onClose} style={primaryBtn}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000,
};
const modal = {
  background: "#0d0d1a", border: "1px solid #1e1e2e", borderRadius: 16,
  padding: 28, width: "100%", maxWidth: 400,
};
const header = {
  display: "flex", justifyContent: "space-between",
  alignItems: "center", marginBottom: 20,
};
const headerTitle = { fontSize: 16, fontWeight: 700, color: "#f1f5f9" };
const closeBtn = {
  background: "none", border: "none", color: "#475569",
  fontSize: 18, cursor: "pointer",
};
const desc = { fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 16 };
const descSmall = { fontSize: 12, color: "#475569", lineHeight: 1.7, marginBottom: 14, wordBreak: "break-all" };
const errBox = {
  background: "#f8717115", border: "1px solid #f8717130",
  borderRadius: 8, padding: "10px 14px", color: "#f87171",
  fontSize: 13, marginBottom: 14,
};
const primaryBtn = {
  background: "linear-gradient(135deg, #7c3aed, #2563eb)",
  color: "#fff", border: "none", borderRadius: 10,
  padding: "12px", fontSize: 14, fontWeight: 600,
  cursor: "pointer", width: "100%",
};
const qrWrap = {
  display: "flex", justifyContent: "center",
  background: "#fff", borderRadius: 12,
  padding: 12, marginBottom: 16,
};
const codeInput = {
  width: "100%", background: "#080810", border: "1px solid #1e1e2e",
  borderRadius: 10, padding: "12px", color: "#4ade80",
  fontSize: 24, fontFamily: "monospace", textAlign: "center",
  letterSpacing: "0.3em", outline: "none", marginBottom: 14,
  boxSizing: "border-box",
};
const codeSpan = {
  display: "inline-block", background: "#080810",
  border: "1px solid #1e1e2e", borderRadius: 6,
  padding: "2px 8px", color: "#a78bfa",
  fontFamily: "monospace", fontSize: 12, marginTop: 4,
};
const successIcon = { fontSize: 48, marginBottom: 12 };
