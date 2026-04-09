# 🔒 ZK Vault — Zero-Knowledge Personal Data Vault

A production-ready, end-to-end encrypted personal data vault. Your master password never leaves your device. The server stores only ciphertext it cannot read.

---

## How the Encryption Works

```
Password → PBKDF2 (600k iterations, SHA-256) → KEK
Random 256-bit MEK generated at signup
MEK encrypted with KEK → stored on server (server cannot decrypt)
Vault data → AES-256-GCM encrypted with MEK → stored on server
MEK lives in a useRef in the browser — never localStorage, never the server
Recovery code → second encrypted copy of MEK → allows vault recovery without password
```

---

## Security Features

- **Zero-knowledge**: Server stores only ciphertext. Keys are derived client-side.
- **AES-256-GCM** encryption for all vault data
- **PBKDF2** with 600,000 iterations for key derivation
- **httpOnly cookies** for JWT — immune to XSS token theft
- **Rate limiting** on all auth endpoints (express-rate-limit)
- **Helmet** security headers on all responses
- **MongoDB injection sanitization** (express-mongo-sanitize)
- **CORS** locked to configured frontend origin
- **TOTP-based 2FA** (Google Authenticator compatible)
- **Auto-lock** after 5 minutes of inactivity — clears MEK from memory
- **Recovery code** for vault access if master password is forgotten
- **Input validation** on all backend endpoints

---

## Tech Stack

- **Backend**: Node.js, Express, MongoDB/Mongoose, JWT, bcrypt, Nodemailer, otplib
- **Frontend**: React, Axios, React Router, Web Crypto API
- **Deployment**: Vercel (frontend + backend), MongoDB Atlas

---

## Local Development Setup

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/zkvault.git
cd zkvault
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in .env values (see below)
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
# Set REACT_APP_API_URL=http://localhost:5000
npm start
```

---

## Environment Variables

### Backend `.env`

```
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/zkvault
JWT_SECRET=<64-byte random hex>
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MAILTRAP_USER=<your mailtrap user>
MAILTRAP_PASS=<your mailtrap pass>
```

Generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend `.env`

```
REACT_APP_API_URL=http://localhost:5000
```

---

## Deploying to Vercel

### Backend

1. Push `backend/` to a GitHub repo (or monorepo)
2. Import project in Vercel → set root to `backend/`
3. Add all environment variables from `.env.example`
4. Set `NODE_ENV=production`
5. Set `FRONTEND_URL=https://your-frontend.vercel.app`

### Frontend

1. Import `frontend/` in Vercel
2. Add environment variable:
   - `REACT_APP_API_URL=https://your-backend.vercel.app`
3. Deploy

### MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a database user
3. Whitelist `0.0.0.0/0` (allow all IPs — required for Vercel serverless)
4. Copy the connection string to `MONGO_URI`

---

## Item Types Supported

| Type | Fields |
|------|--------|
| 🔑 Password | URL, Username, Password, Notes |
| 💳 Card | Cardholder Name, Card Number, Expiry, CVV |
| 📝 Secure Note | Text |
| 🪪 Identity | Full Name, Document Type, Number, Expiry, Country |
| 🔐 API Key | Service Name, Key Value, Expiry, Notes |
| 📶 WiFi | Network Name, Password, Security Type |

---

## Features

- Encrypted vault with all item types above
- Password generator with configurable options (length, charset)
- Password strength meter on all password fields
- Search and filter across vault items
- Auto-lock after 5 minutes of inactivity
- TOTP-based two-factor authentication
- Vault recovery via recovery code
- Password reset via email OTP + recovery code
- Mobile-responsive UI

---

## License

MIT
