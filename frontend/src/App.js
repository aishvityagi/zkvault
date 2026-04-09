import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth }   from "./context/AuthContext";
import { useCrypto } from "./context/CryptoContext";
import Login          from "./pages/Login";
import Register       from "./pages/Register";
import Dashboard      from "./pages/Dashboard";
import Unlock         from "./pages/Unlock";
import ForgotPassword from "./pages/ForgotPassword";

const AuthGuard = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" replace />;
};

const VaultGuard = ({ children }) => {
  const { user }   = useAuth();
  const { hasMEK } = useCrypto();
  if (!user)     return <Navigate to="/"       replace />;
  if (!hasMEK()) return <Navigate to="/unlock" replace />;
  return children;
};

function App() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { font-size: 16px; }
        body {
          background: #080810;
          color: #e2e8f0;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        input, textarea, button { font-family: inherit; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #080810; }
        ::-webkit-scrollbar-thumb { background: #1e2130; border-radius: 3px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <Router>
        <Routes>
          <Route path="/"                element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unlock"          element={<AuthGuard><Unlock /></AuthGuard>} />
          <Route path="/dashboard"       element={<VaultGuard><Dashboard /></VaultGuard>} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
