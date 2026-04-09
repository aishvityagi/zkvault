import { useState } from "react";
import { scorePassword, generatePassword } from "../crypto/cryptoUtils";

// ── Password Strength Meter ───────────────────────────────────────────────────
export function PasswordStrengthMeter({ password }) {
  const score = scorePassword(password);
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["#1e2130", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];
  const label  = password ? labels[score] : "";
  const color  = password ? colors[score] : colors[0];

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= score ? color : "#1e2130",
              transition: "background 0.25s",
            }}
          />
        ))}
      </div>
      {label && (
        <span style={{ fontSize: 11, color, fontWeight: 600, letterSpacing: "0.04em" }}>
          {label}
        </span>
      )}
    </div>
  );
}

// ── Password Generator ────────────────────────────────────────────────────────
export function PasswordGenerator({ onUse }) {
  const [open, setOpen]       = useState(false);
  const [length, setLength]   = useState(20);
  const [upper, setUpper]     = useState(true);
  const [lower, setLower]     = useState(true);
  const [digits, setDigits]   = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [preview, setPreview] = useState("");
  const [copied, setCopied]   = useState(false);

  const generate = () => {
    const pw = generatePassword({ length, upper, lower, digits, symbols });
    setPreview(pw);
    setCopied(false);
  };

  const handleOpen = () => {
    setOpen(true);
    const pw = generatePassword({ length, upper, lower, digits, symbols });
    setPreview(pw);
  };

  const handleUse = () => {
    if (onUse && preview) onUse(preview);
    setOpen(false);
  };

  const handleCopy = async () => {
    if (!preview) return;
    await navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) {
    return (
      <button type="button" onClick={handleOpen} style={genBtn}>
        ⚡ Generate Password
      </button>
    );
  }

  return (
    <div style={genBox}>
      <div style={genHeader}>
        <span style={genTitle}>Password Generator</span>
        <button type="button" onClick={() => setOpen(false)} style={closeX}>✕</button>
      </div>

      {/* Preview */}
      <div style={previewBox}>
        <span style={previewText}>{preview || "—"}</span>
      </div>

      {/* Options */}
      <div style={optRow}>
        <label style={optLabel}>Length: <strong style={{ color: "#a78bfa" }}>{length}</strong></label>
        <input
          type="range" min={8} max={64} value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          style={{ flex: 1, accentColor: "#7c3aed" }}
        />
      </div>

      <div style={toggleRow}>
        {[
          { label: "A–Z", val: upper,   set: setUpper   },
          { label: "a–z", val: lower,   set: setLower   },
          { label: "0–9", val: digits,  set: setDigits  },
          { label: "!@#", val: symbols, set: setSymbols },
        ].map(({ label, val, set }) => (
          <button
            key={label} type="button"
            onClick={() => set((v) => !v)}
            style={{ ...toggleBtn, ...(val ? toggleBtnOn : {}) }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={genActions}>
        <button type="button" onClick={generate} style={regenBtn}>↺ Regenerate</button>
        <button type="button" onClick={handleCopy} style={copyBtn}>
          {copied ? "✅ Copied" : "📋 Copy"}
        </button>
        <button type="button" onClick={handleUse} style={useBtn}>Use This →</button>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const genBtn = {
  background: "transparent", border: "1px dashed #7c3aed60",
  color: "#a78bfa", borderRadius: 8, padding: "7px 12px",
  fontSize: 12, cursor: "pointer", fontWeight: 600,
  width: "100%", marginTop: 6,
};
const genBox = {
  background: "#0d0d1a", border: "1px solid #2a2d3e",
  borderRadius: 12, padding: 16, marginTop: 8,
};
const genHeader = {
  display: "flex", justifyContent: "space-between",
  alignItems: "center", marginBottom: 12,
};
const genTitle  = { fontSize: 13, fontWeight: 700, color: "#e2e8f0" };
const closeX    = {
  background: "none", border: "none", color: "#475569",
  fontSize: 16, cursor: "pointer", lineHeight: 1,
};
const previewBox = {
  background: "#080810", border: "1px solid #1e1e2e",
  borderRadius: 8, padding: "10px 12px", marginBottom: 12,
  minHeight: 40, display: "flex", alignItems: "center",
};
const previewText = {
  fontFamily: "'Courier New', monospace", fontSize: 13,
  color: "#4ade80", wordBreak: "break-all", letterSpacing: "0.05em",
};
const optRow = {
  display: "flex", alignItems: "center", gap: 10,
  marginBottom: 10,
};
const optLabel = { fontSize: 12, color: "#64748b", minWidth: 80 };
const toggleRow = { display: "flex", gap: 6, marginBottom: 12 };
const toggleBtn = {
  flex: 1, background: "#1e2130", border: "1px solid #2a2d3e",
  color: "#475569", borderRadius: 6, padding: "5px 0",
  fontSize: 12, cursor: "pointer", fontWeight: 600,
};
const toggleBtnOn = {
  background: "#7c3aed20", border: "1px solid #7c3aed60",
  color: "#a78bfa",
};
const genActions = { display: "flex", gap: 6 };
const regenBtn = {
  flex: 1, background: "transparent", border: "1px solid #2a2d3e",
  color: "#64748b", borderRadius: 8, padding: "8px 0",
  fontSize: 12, cursor: "pointer",
};
const copyBtn = {
  flex: 1, background: "transparent", border: "1px solid #2a2d3e",
  color: "#64748b", borderRadius: 8, padding: "8px 0",
  fontSize: 12, cursor: "pointer",
};
const useBtn = {
  flex: 1, background: "linear-gradient(135deg, #7c3aed, #2563eb)",
  border: "none", color: "#fff", borderRadius: 8, padding: "8px 0",
  fontSize: 12, cursor: "pointer", fontWeight: 600,
};
