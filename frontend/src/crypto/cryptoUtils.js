const ITERATIONS = 600000;

export const bufferToBase64 = (buffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));

export const base64ToBuffer = (b64) =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;

export const generateSalt = () =>
  window.crypto.getRandomValues(new Uint8Array(32));

export const generateIv = () =>
  window.crypto.getRandomValues(new Uint8Array(12));

export const generateRecoveryCode = () => {
  const bytes = window.crypto.getRandomValues(new Uint8Array(12));
  const hex   = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex.match(/.{1,4}/g).join("-").toUpperCase();
};

export const normalizeRecoveryCode = (code) =>
  code.replace(/-/g, "").toLowerCase();

const deriveKEKFromSecret = async (secret, salt, iterations) => {
  const enc     = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    "raw", enc.encode(secret), "PBKDF2", false, ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt instanceof ArrayBuffer ? salt : salt.buffer,
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["wrapKey", "unwrapKey"]
  );
};

export const deriveKEK = (password, salt, iterations = ITERATIONS) =>
  deriveKEKFromSecret(password, salt, iterations);

export const deriveRecoveryKEK = (recoveryCode, salt, iterations = ITERATIONS) =>
  deriveKEKFromSecret(normalizeRecoveryCode(recoveryCode), salt, iterations);

export const encryptMEK = async (mek, kek) => {
  const iv = generateIv();
  const wrappedKey = await window.crypto.subtle.wrapKey("raw", mek, kek, { name: "AES-GCM", iv });
  return {
    encryptedMasterKey: bufferToBase64(wrappedKey),
    masterKeyIv:        bufferToBase64(iv),
  };
};

export const decryptMEK = (encB64, ivB64, kek) =>
  window.crypto.subtle.unwrapKey(
    "raw",
    base64ToBuffer(encB64),
    kek,
    { name: "AES-GCM", iv: base64ToBuffer(ivB64) },
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

export const encryptMEKWithRecoveryCode = async (mek, recoveryCode) => {
  const recoverySalt = generateSalt();
  const recoveryKEK  = await deriveRecoveryKEK(recoveryCode, recoverySalt);
  const iv           = generateIv();
  const wrappedKey   = await window.crypto.subtle.wrapKey("raw", mek, recoveryKEK, { name: "AES-GCM", iv });
  return {
    encryptedMasterKeyRecovery: bufferToBase64(wrappedKey),
    masterKeyRecoveryIv:        bufferToBase64(iv),
    recoverySalt:               bufferToBase64(recoverySalt),
  };
};

export const decryptMEKWithRecoveryCode = (encB64, ivB64, saltB64, recoveryCode, iterations = ITERATIONS) =>
  deriveRecoveryKEK(recoveryCode, base64ToBuffer(saltB64), iterations).then((recoveryKEK) =>
    window.crypto.subtle.unwrapKey(
      "raw",
      base64ToBuffer(encB64),
      recoveryKEK,
      { name: "AES-GCM", iv: base64ToBuffer(ivB64) },
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    )
  );

export const generateSignupKeyMaterial = async (password) => {
  const salt         = generateSalt();
  const kek          = await deriveKEK(password, salt);
  const mek          = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
  );
  const recoveryCode = generateRecoveryCode();
  const { encryptedMasterKey, masterKeyIv } = await encryptMEK(mek, kek);
  const { encryptedMasterKeyRecovery, masterKeyRecoveryIv, recoverySalt } =
    await encryptMEKWithRecoveryCode(mek, recoveryCode);
  return {
    mek,
    recoveryCode,
    encryptedMasterKey,
    masterKeyIv,
    kdfSalt:       bufferToBase64(salt),
    kdfIterations: ITERATIONS,
    encryptedMasterKeyRecovery,
    masterKeyRecoveryIv,
    recoverySalt,
  };
};

export const reconstructMEKFromLogin = async (password, userData) => {
  const salt = base64ToBuffer(userData.kdfSalt);
  const kek  = await deriveKEK(password, salt, userData.kdfIterations);
  return decryptMEK(userData.encryptedMasterKey, userData.masterKeyIv, kek);
};

export const encryptData = async (data, mek) => {
  const iv        = generateIv();
  const enc       = new TextEncoder();
  const plaintext = enc.encode(typeof data === "string" ? data : JSON.stringify(data));
  const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, mek, plaintext);
  return { encryptedData: bufferToBase64(ciphertext), iv: bufferToBase64(iv) };
};

export const decryptData = async (encryptedDataB64, ivB64, mek) => {
  const plaintext = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBuffer(ivB64) },
    mek,
    base64ToBuffer(encryptedDataB64)
  );
  const str = new TextDecoder().decode(plaintext);
  try { return JSON.parse(str); } catch { return str; }
};

// Password strength scorer (0-4)
export const scorePassword = (password) => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
};

// Secure password generator
export const generatePassword = ({
  length = 20,
  upper = true,
  lower = true,
  digits = true,
  symbols = true,
} = {}) => {
  const sets = [
    upper   ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "",
    lower   ? "abcdefghijklmnopqrstuvwxyz" : "",
    digits  ? "0123456789"                 : "",
    symbols ? "!@#$%^&*()-_=+[]{}|;:,.<>?" : "",
  ].filter(Boolean);

  if (!sets.length) return "";
  const charset = sets.join("");
  const arr = new Uint32Array(length);
  window.crypto.getRandomValues(arr);

  // Guarantee at least one char from each set
  let result = sets.map((s) => {
    const idx = new Uint32Array(1);
    window.crypto.getRandomValues(idx);
    return s[idx[0] % s.length];
  });

  for (let i = result.length; i < length; i++) {
    result.push(charset[arr[i] % charset.length]);
  }

  // Shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = new Uint32Array(1);
    window.crypto.getRandomValues(j);
    const k = j[0] % (i + 1);
    [result[i], result[k]] = [result[k], result[i]];
  }

  return result.join("");
};
