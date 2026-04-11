require("dotenv").config();
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err.message, err.stack);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
  process.exit(1);
});

const express      = require("express");
const cors         = require("cors");
const helmet       = require("helmet");
const cookieParser = require("cookie-parser");

const connectDB    = require("./config/db");
const authRoutes   = require("./routes/auth");
const vaultRoutes  = require("./routes/vaultRoutes");

const app = express();

connectDB();

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS — only allow configured frontend origin ──────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  // Allow localhost in development
  ...(process.env.NODE_ENV !== "production"
    ? ["http://localhost:3000"]
    : []),
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// ── Body parsing & sanitization ───────────────────────────────────────────────
app.use(express.json({ limit: "50kb" }));
app.use(cookieParser());
app.use((req, _res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === "object") {
      for (const key of Object.keys(obj)) {
        if (key.startsWith("$") || key.includes(".")) delete obj[key];
        else sanitize(obj[key]);
      }
    }
  };
  sanitize(req.body);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",  authRoutes);
app.use("/api/vault", vaultRoutes);

app.get("/", (_req, res) => res.json({ status: "ZK Vault API running" }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`Server running on port ${PORT}`);
  }
});

module.exports = app;
