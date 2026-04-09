const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true, maxlength: 100 },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },

  // Zero-knowledge key material
  encryptedMasterKey: { type: String, required: true },
  masterKeyIv:        { type: String, required: true },
  kdfSalt:            { type: String, required: true },
  kdfIterations:      { type: Number, required: true, default: 600000 },

  // Recovery key material
  encryptedMasterKeyRecovery: { type: String, default: null },
  masterKeyRecoveryIv:        { type: String, default: null },
  recoverySalt:               { type: String, default: null },
  recoveryEnabled:            { type: Boolean, default: false },

  // Password reset OTP
  resetTokenHash:   { type: String, default: null },
  resetTokenExpiry: { type: Date,   default: null },

  // 2FA (TOTP)
  twoFactorSecret:  { type: String, default: null },
  twoFactorEnabled: { type: Boolean, default: false },

}, { timestamps: true });

userSchema.methods.toSafeObject = function () {
  return {
    id:                         this._id,
    name:                       this.name,
    email:                      this.email,
    encryptedMasterKey:         this.encryptedMasterKey,
    masterKeyIv:                this.masterKeyIv,
    kdfSalt:                    this.kdfSalt,
    kdfIterations:              this.kdfIterations,
    encryptedMasterKeyRecovery: this.encryptedMasterKeyRecovery,
    masterKeyRecoveryIv:        this.masterKeyRecoveryIv,
    recoverySalt:               this.recoverySalt,
    recoveryEnabled:            this.recoveryEnabled,
    twoFactorEnabled:           this.twoFactorEnabled,
  };
};

module.exports = mongoose.model("User", userSchema);
