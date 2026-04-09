import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CryptoProvider } from "./context/CryptoContext";
import { AuthProvider }   from "./context/AuthContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <CryptoProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </CryptoProvider>
  </React.StrictMode>
);
