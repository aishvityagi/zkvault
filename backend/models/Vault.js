const mongoose = require("mongoose");

const vaultSchema = new mongoose.Schema({
  encryptedTitle: { type: String, required: true },
  titleIv:        { type: String, required: true },
  encryptedData:  { type: String, required: true },
  iv:             { type: String, required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Vault", vaultSchema);
