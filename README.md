# 🔐 ZK Vault — Zero-Knowledge Personal Data Vault

A production-ready, end-to-end encrypted personal vault for storing sensitive data securely.
Your master password never leaves your device — the server stores only encrypted data it cannot read.

🌐 **Live Demo**:
Frontend: https://zkvault-frontend.onrender.com
Backend: https://zkvault-backend.onrender.com

---

## 🧠 Architecture Overview

ZK Vault follows a **zero-knowledge security model**, ensuring that even the server cannot access user data.

### 🔑 Encryption Flow

```
Password → PBKDF2 (600k iterations, SHA-256) → KEK  
Random 256-bit MEK generated at signup  
MEK encrypted with KEK → stored on server  
Vault data → AES-256-GCM encrypted with MEK → stored on server  
MEK stored only in memory (useRef) — never localStorage or server  
Recovery code → encrypted backup of MEK for account recovery  
```

---

## 🔒 Security Features

* **Zero-Knowledge Architecture** — server never sees plaintext data
* **AES-256-GCM Encryption** for all vault entries
* **PBKDF2 (600,000 iterations)** for strong key derivation
* **httpOnly JWT Cookies** — prevents XSS token theft
* **Rate Limiting** on authentication endpoints
* **Helmet.js Security Headers**
* **MongoDB Injection Protection**
* **Strict CORS Policy**
* **TOTP-based 2FA** (Google Authenticator compatible)
* **Auto-Lock (5 minutes)** — clears encryption key from memory
* **Recovery Code System** for password reset without data loss
* **Full Input Validation** on backend

---

## ⚙️ Tech Stack

### Backend

* Node.js
* Express.js
* MongoDB + Mongoose
* JWT Authentication
* bcrypt (password hashing)
* Nodemailer (Mailtrap for development)
* otplib (2FA)

### Frontend

* React.js
* Axios
* React Router
* Web Crypto API

### Deployment

* Render (Frontend + Backend)
* MongoDB Atlas

---

## 📦 Features

* 🔐 Secure vault for storing sensitive data
* 🔑 Password generator with custom options
* 📊 Password strength meter
* 🔍 Search and filter functionality
* 🔒 Auto-lock after inactivity
* 📱 Responsive UI
* 🔐 Two-Factor Authentication (2FA)
* 🔁 Password reset via OTP + recovery code
* 🧾 Multiple item types supported

---

## 📁 Supported Data Types

| Type           | Fields                                    |
| -------------- | ----------------------------------------- |
| 🔑 Password    | URL, Username, Password, Notes            |
| 💳 Card        | Cardholder Name, Card Number, Expiry, CVV |
| 📝 Secure Note | Text                                      |
| 🪪 Identity    | Name, Document Type, Number, Expiry       |
| 🔐 API Key     | Service Name, Key Value, Notes            |
| 📶 WiFi        | Network Name, Password, Security Type     |

---

## ⚠️ Email Functionality (Important)

📩 Email functionality is currently in **test mode using Mailtrap**.

* OTP emails are not delivered to real inboxes
* Emails can only be viewed in the developer’s Mailtrap sandbox

👉 For production use, integrate a real email service (e.g., SendGrid, Gmail SMTP)

---

## 🛠️ Local Development Setup

### 1. Clone Repository

```
git clone https://github.com/yourusername/zkvault.git
cd zkvault
```

---

### 2. Backend Setup

```
cd backend
npm install
cp .env.example .env
npm run dev
```

---

### 3. Frontend Setup

```
cd frontend
npm install
cp .env.example .env
npm start
```

---

## 🔐 Environment Variables

### Backend `.env`

```
MONGO_URI=
JWT_SECRET=
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MAILTRAP_USER=
MAILTRAP_PASS=
```

Generate JWT Secret:

```
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### Frontend `.env`

```
REACT_APP_API_URL=http://localhost:5000
```

---

## 🚀 Deployment Notes

* Ensure correct CORS origin is set
* Use HTTPS in production
* Store secrets securely (never commit `.env`)
* Replace Mailtrap with a production email provider

---

## 📌 Future Improvements

* Production email integration
* Biometric authentication
* Browser extension support
* Secure vault sharing
* Backup & sync across devices

---

## 📜 License

MIT License
