import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../config/api";
import {
  decryptMEKWithRecoveryCode, deriveKEK, encryptMEK,
  generateSalt, bufferToBase64,
} from "../crypto/cryptoUtils";

const STEP = { EMAIL: 1, VERIFY: 2, NEWPASS: 3, DONE: 4 };

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep]                 = useState(STEP.EMAIL);
  const [email, setEmail]               = useState("");
  const [otp, setOtp]                   = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword]   = useState("");
  const [confirm, setConfirm]           = useState("");
  const [recoveryMaterial, setRecoveryMaterial] = useState(null);
  const [mek, setMek]                   = useState(null);
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await api.post("/api/auth/request-reset", { email });
      setStep(STEP.VERIFY);
    } catch (err) { setError(err.response?.data?.message || "Something went wrong."); }
    finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const { data } = await api.post("/api/auth/forgot-password", { email });
      if (!data.recoveryMaterial) return setError("No recovery key found for this account.");
      const rm = data.recoveryMaterial;
      const recovered = await decryptMEKWithRecoveryCode(
        rm.encryptedMasterKeyRecovery, rm.masterKeyRecoveryIv,
        rm.recoverySalt, recoveryCode, rm.kdfIterations
      );
      setMek(recovered); setRecoveryMaterial(rm); setStep(STEP.NEWPASS);
    } catch (err) {
      if (err instanceof DOMException) setError("Incorrect recovery code.");
      else setError(err.response?.data?.message || "Verification failed.");
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault(); setError("");
    if (newPassword !== confirm) return setError("Passwords do not match.");
    if (newPassword.length < 8)  return setError("Minimum 8 characters.");
    setLoading(true);
    try {
      const newSalt = generateSalt();
      const newKEK  = await deriveKEK(newPassword, newSalt);
      const { encryptedMasterKey: newEncryptedMasterKey, masterKeyIv: newMasterKeyIv } =
        await encryptMEK(mek, newKEK);
      await api.post("/api/auth/reset-password", {
        userId: recoveryMaterial.userId, resetToken: otp, newPassword,
        newEncryptedMasterKey, newMasterKeyIv,
        newKdfSalt: bufferToBase64(newSalt), newKdfIterations: 600000,
      });
      setMek(null); setStep(STEP.DONE);
    } catch (err) { setError(err.response?.data?.message || "Reset failed."); }
    finally { setLoading(false); }
  };

  const steps = {
    [STEP.EMAIL]:   { icon: "🔑", title: "Recover Your Vault",  sub: "Enter your registered email address." },
    [STEP.VERIFY]:  { icon: "📬", title: "Verify Your Identity", sub: `Enter the 6-digit code sent to ${email} and your recovery code.` },
    [STEP.NEWPASS]: { icon: "🔐", title: "Set New Password",     sub: "Your vault is unlocked. Choose a strong new master password." },
    [STEP.DONE]:    { icon: "✅", title: "Recovery Successful",  sub: "Your vault data is intact. You can now log in with your new password." },
  };

  const { icon, title: stepTitle, sub } = steps[step];

  return (
    <div style={pg}>
      <div style={glow1} /><div style={glow2} />
      <div style={card}>
        <div style={iconWrap}><span style={{ fontSize: 28 }}>{icon}</span></div>
        <h1 style={title}>{stepTitle}</h1>
        <p style={subtitle}>{sub}</p>

        {step === STEP.EMAIL && (
          <form onSubmit={handleRequestOtp} style={form}>
            <div style={fieldWrap}>
              <label style={lbl}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required style={input}
                onFocus={e => e.target.style.borderColor = "#7c3aed"}
                onBlur={e => e.target.style.borderColor = "#1e1e2e"} />
            </div>
            {error && <div style={errorBox}>⚠ {error}</div>}
            <button type="submit" disabled={loading} style={btn}>
              {loading ? "Sending..." : "Send Verification Code →"}
            </button>
          </form>
        )}

        {step === STEP.VERIFY && (
          <form onSubmit={handleVerify} style={form}>
            <div style={fieldWrap}>
              <label style={lbl}>Email Verification Code</label>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value)}
                placeholder="6-digit code" maxLength={6} required style={input}
                onFocus={e => e.target.style.borderColor = "#7c3aed"}
                onBlur={e => e.target.style.borderColor = "#1e1e2e"} />
            </div>
            <div style={fieldWrap}>
              <label style={lbl}>Recovery Code</label>
              <input type="text" value={recoveryCode} onChange={e => setRecoveryCode(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" required
                style={{ ...input, fontFamily: "'Courier New', monospace", letterSpacing: "0.05em" }}
                onFocus={e => e.target.style.borderColor = "#7c3aed"}
                onBlur={e => e.target.style.borderColor = "#1e1e2e"} />
            </div>
            {error && <div style={errorBox}>⚠ {error}</div>}
            <button type="submit" disabled={loading} style={btn}>
              {loading ? "Verifying..." : "Verify Identity →"}
            </button>
          </form>
        )}

        {step === STEP.NEWPASS && (
          <form onSubmit={handleReset} style={form}>
            <div style={fieldWrap}>
              <label style={lbl}>New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••••••" required style={input}
                onFocus={e => e.target.style.borderColor = "#7c3aed"}
                onBlur={e => e.target.style.borderColor = "#1e1e2e"} />
            </div>
            <div style={fieldWrap}>
              <label style={lbl}>Confirm Password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••••••" required style={input}
                onFocus={e => e.target.style.borderColor = "#7c3aed"}
                onBlur={e => e.target.style.borderColor = "#1e1e2e"} />
            </div>
            {error && <div style={errorBox}>⚠ {error}</div>}
            <button type="submit" disabled={loading} style={btn}>
              {loading ? "Resetting..." : "Reset Password →"}
            </button>
          </form>
        )}

        {step === STEP.DONE && (
          <button onClick={() => navigate("/")} style={{ ...btn, marginTop: 8 }}>
            Go to Login →
          </button>
        )}
      </div>
    </div>
  );
}

const pg = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" };
const glow1 = { position: "fixed", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, #7c3aed18 0%, transparent 70%)", top: -200, left: -200, pointerEvents: "none" };
const glow2 = { position: "fixed", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #2563eb14 0%, transparent 70%)", bottom: -150, right: -150, pointerEvents: "none" };
const card = { width: "100%", maxWidth: 440, background: "#0d0d1a", border: "1px solid #1e1e2e", borderRadius: 20, padding: "40px 36px", boxShadow: "0 0 0 1px #ffffff04, 0 24px 64px #00000060", position: "relative", zIndex: 1, animation: "fadeIn 0.3s ease" };
const iconWrap = { width: 60, height: 60, background: "#7c3aed15", border: "1px solid #7c3aed30", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 };
const title = { fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 };
const subtitle = { fontSize: 13, color: "#475569", marginBottom: 28, lineHeight: 1.6 };
const form = { display: "flex", flexDirection: "column", gap: 16 };
const fieldWrap = { display: "flex", flexDirection: "column", gap: 6 };
const lbl = { fontSize: 12, fontWeight: 500, color: "#64748b", letterSpacing: "0.05em" };
const input = { background: "#080810", border: "1px solid #1e1e2e", borderRadius: 10, padding: "11px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", transition: "border-color 0.2s", width: "100%" };
const btn = { background: "linear-gradient(135deg, #7c3aed, #2563eb)", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%", boxShadow: "0 4px 20px #7c3aed30" };
const errorBox = { background: "#f8717115", border: "1px solid #f8717130", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13 };
