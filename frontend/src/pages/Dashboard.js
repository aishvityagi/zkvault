import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../config/api";
import { useAuth }   from "../context/AuthContext";
import { useCrypto } from "../context/CryptoContext";
import { encryptData, decryptData } from "../crypto/cryptoUtils";
import { ITEM_TYPES } from "../config/itemTypes";
import { PasswordStrengthMeter, PasswordGenerator } from "../components/VaultComponents";
import TwoFactorSetup from "../components/TwoFactorSetup";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { getMEK } = useCrypto();
  const navigate = useNavigate();

  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Search & filter
  const [search, setSearch]         = useState("");
  const [filterType, setFilterType] = useState("all");

  // Modal state
  const [showModal, setShowModal]   = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [titleValue, setTitleValue] = useState("");
  const [saving, setSaving]         = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Field UI state
  const [revealed, setRevealed] = useState({});
  const [copied, setCopied]     = useState({});

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);

  // Mobile menu
  const [mobileMenu, setMobileMenu] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/vault");
      const mek = getMEK();
      const decrypted = await Promise.all(
        res.data.map(async (item) => {
          try {
            const title   = await decryptData(item.encryptedTitle, item.titleIv, mek);
            const dataObj = await decryptData(item.encryptedData, item.iv, mek);
            const data    = typeof dataObj === "string" ? JSON.parse(dataObj) : dataObj;
            return { ...item, title, data };
          } catch {
            return { ...item, title: "[decryption failed]", data: {} };
          }
        })
      );
      setItems(decrypted);
    } catch {
      setError("Failed to load vault items.");
    } finally {
      setLoading(false);
    }
  }, [getMEK]);

  useEffect(() => {
    if (!getMEK()) { navigate("/unlock"); return; }
    fetchItems();
  }, [fetchItems, getMEK, navigate]);

  // ── Filtered items ──────────────────────────────────────────────────────────
  const filteredItems = items.filter((item) => {
    const matchType = filterType === "all" || item.data?.itemType === filterType;
    const q = search.toLowerCase();
    const matchSearch = !q || item.title?.toLowerCase().includes(q) ||
      Object.values(item.data || {}).some((v) =>
        typeof v === "string" && v.toLowerCase().includes(q)
      );
    return matchType && matchSearch;
  });

  // ── Modal helpers ───────────────────────────────────────────────────────────
  const openNewModal = () => {
    setEditingItem(null); setSelectedType(null);
    setFormValues({}); setTitleValue(""); setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setSelectedType(item.data.itemType);
    const { itemType, ...rest } = item.data;
    setFormValues(rest);
    setTitleValue(item.title);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false); setSelectedType(null);
    setFormValues({}); setTitleValue(""); setEditingItem(null);
  };

  const pickType = (typeKey) => {
    setSelectedType(typeKey);
    setFormValues({});
    if (!titleValue) setTitleValue(ITEM_TYPES[typeKey].label);
  };

  const handleFieldChange = (key, value) =>
    setFormValues((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!selectedType || !titleValue.trim()) {
      setError("Title is required."); return;
    }
    setSaving(true);
    try {
      const mek     = getMEK();
      const payload = { itemType: selectedType, ...formValues };
      const { encryptedData, iv }                   = await encryptData(JSON.stringify(payload), mek);
      const { encryptedData: encryptedTitle, iv: titleIv } = await encryptData(titleValue.trim(), mek);
      const body = { encryptedData, iv, encryptedTitle, titleIv };

      if (editingItem) {
        await api.put(`/api/vault/${editingItem._id}`, body);
      } else {
        await api.post("/api/vault", body);
      }
      closeModal();
      fetchItems();
    } catch {
      setError("Failed to save item.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item? This cannot be undone.")) return;
    try {
      await api.delete(`/api/vault/${id}`);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch {
      setError("Failed to delete item.");
    }
  };

  const toggleReveal = (itemId, fieldKey) =>
    setRevealed((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || {}), [fieldKey]: !(prev[itemId]?.[fieldKey]) },
    }));

  const copyToClipboard = async (itemId, fieldKey, value) => {
    try {
      await navigator.clipboard.writeText(value);
      const k = itemId + fieldKey;
      setCopied((prev) => ({ ...prev, [k]: true }));
      setTimeout(() => setCopied((prev) => ({ ...prev, [k]: false })), 2000);
    } catch { /* clipboard blocked */ }
  };

  const maskValue = (value) => (value ? "•".repeat(Math.min(value.length, 12)) : "—");

  const handleLogout = async () => { await logout(); navigate("/"); };

  // Is the current field a password field?
  const isPasswordField = (typeKey, fieldKey) => {
    const field = ITEM_TYPES[typeKey]?.fields.find((f) => f.key === fieldKey);
    return field?.type === "password";
  };

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <header style={S.header}>
        <div style={S.headerLeft}>
          <span style={S.logo}>🔒 ZK Vault</span>
        </div>

        {/* Search bar */}
        <div style={S.searchWrap}>
          <span style={S.searchIcon}>🔍</span>
          <input
            style={S.searchInput}
            placeholder="Search vault..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button style={S.clearSearch} onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        <div style={S.headerRight}>
          <button onClick={openNewModal} style={S.addBtn}>+ New</button>
          <button onClick={() => setShowSettings(true)} style={S.iconBtnHeader} title="Settings">⚙️</button>
          <button onClick={handleLogout} style={S.logoutBtn}>Logout</button>
          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenu(v => !v)} style={S.hamburger}>☰</button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenu && (
        <div style={S.mobileMenu}>
          <button onClick={() => { openNewModal(); setMobileMenu(false); }} style={S.mobileMenuBtn}>+ New Item</button>
          <button onClick={() => { setShowSettings(true); setMobileMenu(false); }} style={S.mobileMenuBtn}>⚙️ Settings</button>
          <button onClick={handleLogout} style={S.mobileMenuBtn}>Logout</button>
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div style={S.filterBar}>
        <button
          style={{ ...S.filterTab, ...(filterType === "all" ? S.filterTabActive : {}) }}
          onClick={() => setFilterType("all")}
        >
          All ({items.length})
        </button>
        {Object.entries(ITEM_TYPES).map(([key, def]) => {
          const count = items.filter((i) => i.data?.itemType === key).length;
          if (count === 0) return null;
          return (
            <button
              key={key}
              style={{ ...S.filterTab, ...(filterType === key ? S.filterTabActive : {}) }}
              onClick={() => setFilterType(key)}
            >
              {def.icon} {def.label} ({count})
            </button>
          );
        })}
      </div>

      {error && (
        <div style={S.errorBar}>
          ⚠ {error}
          <button onClick={() => setError("")} style={S.errorClose}>✕</button>
        </div>
      )}

      {/* ── Vault grid ── */}
      <main style={S.main}>
        {loading ? (
          <div style={S.emptyState}>
            <div style={S.spinner} />
            <p style={S.emptyText}>Decrypting vault...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={S.emptyState}>
            <div style={S.emptyIcon}>{search ? "🔍" : "🔒"}</div>
            <p style={S.emptyText}>
              {search ? `No results for "${search}"` : "Your vault is empty. Add your first item."}
            </p>
            {!search && (
              <button onClick={openNewModal} style={S.emptyBtn}>+ Add Item</button>
            )}
          </div>
        ) : (
          <div style={S.grid}>
            {filteredItems.map((item) => {
              const typeKey = item.data?.itemType;
              const typeDef = ITEM_TYPES[typeKey];
              return (
                <div key={item._id} style={S.card}>
                  <div style={S.cardHeader}>
                    <span style={S.cardIcon}>{typeDef?.icon || "📄"}</span>
                    <div style={S.cardTitleBlock}>
                      <span style={S.cardTitle}>{item.title}</span>
                      <span style={S.cardType}>{typeDef?.label || "Item"}</span>
                    </div>
                    <div style={S.cardActions}>
                      <button onClick={() => openEditModal(item)} style={S.actionBtn} title="Edit">✏️</button>
                      <button onClick={() => handleDelete(item._id)} style={S.actionBtn} title="Delete">🗑️</button>
                    </div>
                  </div>

                  <div style={S.fieldList}>
                    {typeDef?.fields.map((field) => {
                      const val       = item.data[field.key] || "";
                      const isRevealed = revealed[item._id]?.[field.key];
                      const copyKey   = item._id + field.key;
                      return (
                        <div key={field.key} style={S.fieldRow}>
                          <span style={S.fieldLabel}>{field.label}</span>
                          <span style={S.fieldValue}>
                            {field.sensitive
                              ? (isRevealed ? val || "—" : maskValue(val))
                              : (val || "—")}
                          </span>
                          <div style={S.fieldBtns}>
                            {field.sensitive && val && (
                              <button style={S.smallBtn} onClick={() => toggleReveal(item._id, field.key)}
                                title={isRevealed ? "Hide" : "Reveal"}>
                                {isRevealed ? "🙈" : "👁️"}
                              </button>
                            )}
                            {val && (
                              <button style={S.smallBtn} onClick={() => copyToClipboard(item._id, field.key, val)}
                                title="Copy">
                                {copied[copyKey] ? "✅" : "📋"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Item Modal ── */}
      {showModal && (
        <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div style={S.modal}>
            <div style={S.modalHeader}>
              <h3 style={S.modalTitle}>{editingItem ? "Edit Item" : "New Item"}</h3>
              <button onClick={closeModal} style={S.closeBtn}>✕</button>
            </div>

            {!selectedType ? (
              <div>
                <p style={S.pickLabel}>Choose a type:</p>
                <div style={S.typeGrid}>
                  {Object.entries(ITEM_TYPES).map(([key, def]) => (
                    <button key={key} style={S.typeBtn} onClick={() => pickType(key)}>
                      <span style={S.typeBtnIcon}>{def.icon}</span>
                      <span>{def.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div style={S.formGroup}>
                  <label style={S.formLabel}>Title</label>
                  <input style={S.formInput} value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    placeholder="e.g. Gmail, Chase Visa…"
                    onFocus={e => e.target.style.borderColor = "#7c3aed"}
                    onBlur={e => e.target.style.borderColor = "#2a2d3e"} />
                </div>

                {ITEM_TYPES[selectedType].fields.map((field) => (
                  <div key={field.key} style={S.formGroup}>
                    <label style={S.formLabel}>{field.label}</label>
                    {field.type === "textarea" ? (
                      <textarea
                        style={{ ...S.formInput, height: 80, resize: "vertical" }}
                        value={formValues[field.key] || ""}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        onFocus={e => e.target.style.borderColor = "#7c3aed"}
                        onBlur={e => e.target.style.borderColor = "#2a2d3e"}
                      />
                    ) : (
                      <input
                        style={S.formInput}
                        type={field.type === "password" ? "text" : field.type}
                        value={formValues[field.key] || ""}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        onFocus={e => e.target.style.borderColor = "#7c3aed"}
                        onBlur={e => e.target.style.borderColor = "#2a2d3e"}
                      />
                    )}

                    {/* Password strength meter on password fields */}
                    {field.type === "password" && (
                      <PasswordStrengthMeter password={formValues[field.key] || ""} />
                    )}

                    {/* Password generator on password fields */}
                    {field.type === "password" && (
                      <PasswordGenerator onUse={(pw) => handleFieldChange(field.key, pw)} />
                    )}
                  </div>
                ))}

                <div style={S.modalFooter}>
                  {!editingItem && (
                    <button style={S.backBtn} onClick={() => { setSelectedType(null); setFormValues({}); }}>
                      ← Back
                    </button>
                  )}
                  <button style={saving ? { ...S.saveBtn, opacity: 0.7 } : S.saveBtn}
                    onClick={handleSave} disabled={saving}>
                    {saving ? "Saving…" : editingItem ? "Update" : "Save"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Settings Modal ── */}
      {showSettings && (
        <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}>
          <div style={S.modal}>
            <div style={S.modalHeader}>
              <h3 style={S.modalTitle}>Settings</h3>
              <button onClick={() => setShowSettings(false)} style={S.closeBtn}>✕</button>
            </div>

            <div style={S.settingRow}>
              <div>
                <div style={S.settingLabel}>Two-Factor Authentication</div>
                <div style={S.settingDesc}>
                  {user?.twoFactorEnabled
                    ? "✅ Enabled — your account is protected with TOTP."
                    : "Add a second layer of security with an authenticator app."}
                </div>
              </div>
              {!user?.twoFactorEnabled && (
                <button style={S.settingBtn}
                  onClick={() => { setShowSettings(false); setShow2FASetup(true); }}>
                  Enable
                </button>
              )}
            </div>

            <div style={S.settingRow}>
              <div>
                <div style={S.settingLabel}>Auto-Lock</div>
                <div style={S.settingDesc}>Vault locks after 5 minutes of inactivity.</div>
              </div>
              <span style={S.settingBadge}>Active</span>
            </div>

            <div style={S.settingRow}>
              <div>
                <div style={S.settingLabel}>Encryption</div>
                <div style={S.settingDesc}>AES-256-GCM · PBKDF2 600k iterations · Zero-knowledge</div>
              </div>
              <span style={S.settingBadge}>Secure</span>
            </div>

            <div style={{ marginTop: 24 }}>
              <button onClick={handleLogout} style={S.dangerBtn}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2FA Setup Modal ── */}
      {show2FASetup && (
        <TwoFactorSetup onClose={() => setShow2FASetup(false)} />
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: "100vh",
    background: "#080810",
    color: "#e2e8f0",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 24px",
    height: 60,
    borderBottom: "1px solid #1e2130",
    background: "#0d0d1a",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerLeft: { display: "flex", alignItems: "center", flexShrink: 0 },
  logo: { fontSize: 18, fontWeight: 700, color: "#a78bfa", letterSpacing: "-0.02em" },
  searchWrap: {
    flex: 1, maxWidth: 400,
    display: "flex", alignItems: "center",
    background: "#080810", border: "1px solid #1e2130",
    borderRadius: 10, padding: "0 12px", gap: 8,
  },
  searchIcon:  { fontSize: 14, color: "#334155", flexShrink: 0 },
  searchInput: {
    flex: 1, background: "none", border: "none",
    color: "#e2e8f0", fontSize: 14, outline: "none",
    padding: "9px 0",
  },
  clearSearch: {
    background: "none", border: "none", color: "#334155",
    cursor: "pointer", fontSize: 12, flexShrink: 0,
  },
  headerRight:    { display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexShrink: 0 },
  addBtn:         { background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontWeight: 600, fontSize: 13 },
  iconBtnHeader:  { background: "transparent", border: "1px solid #1e2130", borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontSize: 16 },
  logoutBtn:      { background: "transparent", color: "#475569", border: "1px solid #1e2130", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 13, "@media(maxWidth:640px)": { display: "none" } },
  hamburger:      { display: "none", background: "transparent", border: "1px solid #1e2130", borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontSize: 16, "@media(maxWidth:640px)": { display: "block" } },
  mobileMenu:     { background: "#0d0d1a", borderBottom: "1px solid #1e2130", padding: "12px 24px", display: "flex", flexDirection: "column", gap: 8 },
  mobileMenuBtn:  { background: "transparent", border: "1px solid #1e2130", color: "#e2e8f0", borderRadius: 8, padding: "10px 16px", cursor: "pointer", fontSize: 14, textAlign: "left" },
  filterBar:      { display: "flex", gap: 6, padding: "12px 24px", overflowX: "auto", borderBottom: "1px solid #1e2130", background: "#0d0d1a" },
  filterTab:      { background: "transparent", border: "1px solid #1e2130", color: "#475569", borderRadius: 20, padding: "5px 14px", cursor: "pointer", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 },
  filterTabActive:{ background: "#7c3aed20", border: "1px solid #7c3aed60", color: "#a78bfa" },
  errorBar:       { background: "#3b1a1a", color: "#f87171", padding: "10px 24px", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" },
  errorClose:     { background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 16 },
  main:           { padding: 24 },
  emptyState:     { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 16 },
  emptyIcon:      { fontSize: 48 },
  emptyText:      { color: "#334155", fontSize: 15 },
  emptyBtn:       { background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "11px 24px", cursor: "pointer", fontWeight: 600, fontSize: 14 },
  spinner:        { width: 32, height: 32, border: "3px solid #1e2130", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  grid:           { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 },
  card:           { background: "#0d0d1a", border: "1px solid #1e2130", borderRadius: 14, padding: 20, animation: "fadeIn 0.2s ease" },
  cardHeader:     { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  cardIcon:       { fontSize: 26, flexShrink: 0 },
  cardTitleBlock: { flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 },
  cardTitle:      { fontWeight: 700, fontSize: 14, color: "#e8eaf0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  cardType:       { fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em" },
  cardActions:    { display: "flex", gap: 2, flexShrink: 0 },
  actionBtn:      { background: "transparent", border: "none", cursor: "pointer", fontSize: 15, padding: "4px 6px", borderRadius: 6, opacity: 0.6 },
  fieldList:      { display: "flex", flexDirection: "column", gap: 10 },
  fieldRow:       { display: "flex", alignItems: "center", gap: 8, fontSize: 13 },
  fieldLabel:     { color: "#334155", minWidth: 90, flexShrink: 0, fontSize: 12 },
  fieldValue:     { flex: 1, color: "#94a3b8", fontFamily: "monospace", fontSize: 12, wordBreak: "break-all", minWidth: 0 },
  fieldBtns:      { display: "flex", gap: 2, flexShrink: 0 },
  smallBtn:       { background: "transparent", border: "none", cursor: "pointer", fontSize: 13, padding: 2, opacity: 0.7 },
  overlay:        { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 },
  modal:          { background: "#0d0d1a", border: "1px solid #1e2130", borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" },
  modalHeader:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle:     { margin: 0, fontSize: 18, fontWeight: 700, color: "#f1f5f9" },
  closeBtn:       { background: "transparent", border: "none", color: "#334155", fontSize: 20, cursor: "pointer" },
  pickLabel:      { color: "#475569", marginBottom: 14, fontSize: 13 },
  typeGrid:       { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  typeBtn:        { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "#080810", border: "1px solid #1e2130", borderRadius: 10, padding: "16px 10px", cursor: "pointer", color: "#e8eaf0", fontSize: 13, fontWeight: 600 },
  typeBtnIcon:    { fontSize: 24 },
  formGroup:      { marginBottom: 16 },
  formLabel:      { display: "block", fontSize: 11, color: "#475569", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" },
  formInput:      { width: "100%", background: "#080810", border: "1px solid #2a2d3e", borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 14, outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" },
  modalFooter:    { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 },
  backBtn:        { background: "transparent", border: "1px solid #1e2130", color: "#475569", borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontSize: 14 },
  saveBtn:        { background: "linear-gradient(135deg, #7c3aed, #2563eb)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 24px", cursor: "pointer", fontWeight: 600, fontSize: 14 },
  settingRow:     { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid #1e2130" },
  settingLabel:   { fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 },
  settingDesc:    { fontSize: 12, color: "#475569", lineHeight: 1.5 },
  settingBtn:     { background: "#7c3aed20", border: "1px solid #7c3aed40", color: "#a78bfa", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600, flexShrink: 0 },
  settingBadge:   { background: "#22c55e15", border: "1px solid #22c55e30", color: "#4ade80", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700, flexShrink: 0 },
  dangerBtn:      { background: "transparent", border: "1px solid #ef444440", color: "#ef4444", borderRadius: 8, padding: "10px 18px", cursor: "pointer", fontSize: 14, width: "100%" },
};
