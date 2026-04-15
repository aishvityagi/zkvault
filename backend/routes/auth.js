const express   = require("express");
const bcrypt    = require("bcryptjs");
const jwt       = require("jsonwebtoken");
const crypto    = require("crypto");
const rateLimit = require("express-rate-limit");
const { authenticator } = require("otplib");
const qrcode    = require("qrcode");
const User      = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const protect   = require("../middleware/authMiddleware");

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────
const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
};

const issueToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, COOKIE_OPTS);
};

const clearToken = (res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
};

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// ── Rate limiters ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many requests, try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many attempts, try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── REGISTER ──────────────────────────────────────────────────────────────────
router.post("/register", authLimiter, async (req, res) => {
  try {
    const {
      name, email, password,
      encryptedMasterKey, masterKeyIv, kdfSalt, kdfIterations,
      encryptedMasterKeyRecovery, masterKeyRecoveryIv, recoverySalt,
    } = req.body;

    if (!name?.trim() || !email?.trim() || !password)
      return res.status(400).json({ message: "All fields are required." });

    if (!isValidEmail(email))
      return res.status(400).json({ message: "Invalid email address." });

    if (password.length < 8)
      return res.status(400).json({ message: "Password must be at least 8 characters." });

    if (!encryptedMasterKey || !masterKeyIv || !kdfSalt || !kdfIterations ||
        !encryptedMasterKeyRecovery || !masterKeyRecoveryIv || !recoverySalt)
      return res.status(400).json({ message: "Crypto fields are required." });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: "Email already registered." });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name:    name.trim(),
      email:   email.toLowerCase(),
      password: hashedPassword,
      encryptedMasterKey,
      masterKeyIv,
      kdfSalt,
      kdfIterations,
      encryptedMasterKeyRecovery,
      masterKeyRecoveryIv,
      recoverySalt,
      recoveryEnabled: true,
    });

    issueToken(res, user._id);
    res.status(201).json({ user: user.toSafeObject() });

  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password, totpToken } = req.body;

    if (!email?.trim() || !password)
      return res.status(400).json({ message: "Email and password required." });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Invalid credentials." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

    // 2FA check
    if (user.twoFactorEnabled) {
      if (!totpToken)
        return res.status(200).json({ requires2FA: true });

      const valid = authenticator.verify({ token: totpToken, secret: user.twoFactorSecret });
      if (!valid)
        return res.status(401).json({ message: "Invalid authenticator code." });
    }

    issueToken(res, user._id);
    res.json({ user: user.toSafeObject() });

  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ── LOGOUT ────────────────────────────────────────────────────────────────────
router.post("/logout", (req, res) => {
  clearToken(res);
  res.json({ message: "Logged out." });
});

// ── GET CURRENT USER ──────────────────────────────────────────────────────────
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user: user.toSafeObject() });
  } catch {
    res.status(500).json({ message: "Server error." });
  }
});

// ── REQUEST RESET ─────────────────────────────────────────────────────────────
router.post("/request-reset", strictLimiter, async (req, res) => {
  try {
    console.log("🔥 REQUEST-RESET HIT");
    const { email } = req.body;
    if (!email?.trim()) return res.status(400).json({ message: "Email required." });

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.recoveryEnabled) {
      return res.json({ message: "If this email is registered, a code has been sent." });
    }

    const otp     = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    console.log("OTP GENERATED:", otp);
    console.log("Sending email to:", user.email);
    user.resetTokenHash   = otpHash;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await sendEmail({
      to:      user.email,
      subject: "Your Vault Recovery Code",
      text:    `Your recovery code is: ${otp}\n\nExpires in 15 minutes.\n\nIf you did not request this, ignore this email.`,
    });

    res.json({ message: "If this email is registered, a code has been sent." });

  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ── FORGOT PASSWORD (returns recovery material) ───────────────────────────────
router.post("/forgot-password", strictLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) return res.status(400).json({ message: "Email required." });

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.recoveryEnabled) {
      return res.json({ message: "If recovery is enabled, material has been returned.", recoveryMaterial: null });
    }

    res.json({
      message: "Recovery material found.",
      recoveryMaterial: {
        userId:                     user._id,
        encryptedMasterKeyRecovery: user.encryptedMasterKeyRecovery,
        masterKeyRecoveryIv:        user.masterKeyRecoveryIv,
        recoverySalt:               user.recoverySalt,
        kdfIterations:              user.kdfIterations,
      },
    });

  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ── RESET PASSWORD ────────────────────────────────────────────────────────────
router.post("/reset-password", strictLimiter, async (req, res) => {
  try {
    const {
      userId, resetToken, newPassword,
      newEncryptedMasterKey, newMasterKeyIv, newKdfSalt, newKdfIterations,
    } = req.body;

    if (!userId || !resetToken || !newPassword || !newEncryptedMasterKey || !newMasterKeyIv || !newKdfSalt)
      return res.status(400).json({ message: "All fields required." });

    if (newPassword.length < 8)
      return res.status(400).json({ message: "Password must be at least 8 characters." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (!user.resetTokenHash || !user.resetTokenExpiry || user.resetTokenExpiry < new Date())
      return res.status(401).json({ message: "Reset code expired. Please request a new one." });

    const hash  = crypto.createHash("sha256").update(resetToken).digest("hex");
    const valid = crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(user.resetTokenHash));
    if (!valid) return res.status(401).json({ message: "Invalid reset code." });

    user.password           = await bcrypt.hash(newPassword, 12);
    user.encryptedMasterKey = newEncryptedMasterKey;
    user.masterKeyIv        = newMasterKeyIv;
    user.kdfSalt            = newKdfSalt;
    user.kdfIterations      = newKdfIterations || 600000;
    user.resetTokenHash     = null;
    user.resetTokenExpiry   = null;
    await user.save();

    res.json({ message: "Password reset successfully. Please log in." });

  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ── 2FA: SETUP (generate secret + QR) ────────────────────────────────────────
router.post("/2fa/setup", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.twoFactorEnabled)
      return res.status(400).json({ message: "2FA is already enabled." });

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, "ZK Vault", secret);
    const qrDataUrl = await qrcode.toDataURL(otpauth);

    // Store secret temporarily (not enabled until verified)
    user.twoFactorSecret = secret;
    await user.save();

    res.json({ secret, qrDataUrl });

  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ── 2FA: VERIFY & ENABLE ──────────────────────────────────────────────────────
router.post("/2fa/verify", protect, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token required." });

    const user = await User.findById(req.user.id);
    if (!user || !user.twoFactorSecret)
      return res.status(400).json({ message: "2FA setup not started." });

    const valid = authenticator.verify({ token, secret: user.twoFactorSecret });
    if (!valid) return res.status(401).json({ message: "Invalid code. Try again." });

    user.twoFactorEnabled = true;
    await user.save();

    res.json({ message: "2FA enabled successfully." });

  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ── 2FA: DISABLE ──────────────────────────────────────────────────────────────
router.post("/2fa/disable", protect, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token required." });

    const user = await User.findById(req.user.id);
    if (!user || !user.twoFactorEnabled)
      return res.status(400).json({ message: "2FA is not enabled." });

    const valid = authenticator.verify({ token, secret: user.twoFactorSecret });
    if (!valid) return res.status(401).json({ message: "Invalid code." });

    user.twoFactorEnabled = false;
    user.twoFactorSecret  = null;
    await user.save();

    res.json({ message: "2FA disabled." });

  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
