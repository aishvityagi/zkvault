export const ITEM_TYPES = {
  password: {
    label: "Password",
    icon: "🔑",
    fields: [
      { key: "url",      label: "URL",      type: "text",     sensitive: false },
      { key: "username", label: "Username", type: "text",     sensitive: false },
      { key: "password", label: "Password", type: "password", sensitive: true  },
      { key: "notes",    label: "Notes",    type: "textarea", sensitive: false },
    ],
  },
  card: {
    label: "Card",
    icon: "💳",
    fields: [
      { key: "cardholderName", label: "Cardholder Name",  type: "text",     sensitive: false },
      { key: "cardNumber",     label: "Card Number",      type: "text",     sensitive: true  },
      { key: "expiry",         label: "Expiry (MM/YY)",   type: "text",     sensitive: false },
      { key: "cvv",            label: "CVV",              type: "password", sensitive: true  },
    ],
  },
  note: {
    label: "Secure Note",
    icon: "📝",
    fields: [
      { key: "text", label: "Note", type: "textarea", sensitive: false },
    ],
  },
  identity: {
    label: "Identity",
    icon: "🪪",
    fields: [
      { key: "fullName",  label: "Full Name",        type: "text", sensitive: false },
      { key: "docType",   label: "Document Type",    type: "text", sensitive: false },
      { key: "docNumber", label: "Document Number",  type: "text", sensitive: true  },
      { key: "expiry",    label: "Expiry Date",      type: "text", sensitive: false },
      { key: "country",   label: "Country",          type: "text", sensitive: false },
    ],
  },
  apikey: {
    label: "API Key",
    icon: "🔐",
    fields: [
      { key: "serviceName", label: "Service Name", type: "text",     sensitive: false },
      { key: "keyValue",    label: "Key Value",    type: "password", sensitive: true  },
      { key: "expiry",      label: "Expiry Date",  type: "text",     sensitive: false },
      { key: "notes",       label: "Notes",        type: "textarea", sensitive: false },
    ],
  },
  wifi: {
    label: "WiFi",
    icon: "📶",
    fields: [
      { key: "networkName",  label: "Network Name (SSID)",       type: "text",     sensitive: false },
      { key: "password",     label: "Password",                  type: "password", sensitive: true  },
      { key: "securityType", label: "Security Type (WPA2/WPA3)", type: "text",     sensitive: false },
    ],
  },
};
