import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { usePageTitle } from "../hooks/usePageTitle";
import NeuralBackground from "../components/NeuralBackground";

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(45,212,191,0.15)',
  borderRadius: 6,
  padding: '0.65rem 0.875rem',
  color: 'white',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

export default function LoginPage() {
  usePageTitle("Дохил шудан");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.access_token);
      navigate("/courses");
    } catch {
      setError("Email ё парол нодуруст аст");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #061A1C 0%, #0A2A2E 45%, #0E3A3F 100%)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <NeuralBackground />
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: 420, zIndex: 1 }}>
        {/* Logo */}
        <div className="fade-up-1" style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #0D9488, #22D3EE)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Z</span>
            </div>
            <span style={{ color: 'white', fontWeight: 600, fontSize: 18 }}>ZaboniAI</span>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card fade-up-2" style={{ padding: '2rem' }}>
          <h1 style={{ color: 'white', fontWeight: 500, fontSize: 22, marginBottom: 6, marginTop: 0 }}>
            Бозгашт ба ZaboniAI
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 24, marginTop: 0 }}>
            Бо ҳисоби худ ворид шав
          </p>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 6,
              padding: '0.5rem 0.75rem',
              color: '#F87171',
              fontSize: 14,
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="fade-up-2" style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                Почтаи электронӣ
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@мисол.com"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#2DD4BF'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(45,212,191,0.15)'; }}
              />
            </div>

            <div className="fade-up-2" style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                Парол
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Паролро ворид кун"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#2DD4BF'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(45,212,191,0.15)'; }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="fade-up-3"
              style={{
                width: '100%',
                background: '#14B8A6',
                color: '#04231F',
                border: 'none',
                borderRadius: 6,
                padding: '0.75rem',
                fontWeight: 600,
                fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {loading ? "..." : "Дохил шудан"}
            </button>
          </form>

          <p className="fade-up-3" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 20, marginBottom: 0 }}>
            Ҳисоб надорӣ?{" "}
            <Link to="/register" style={{ color: '#2DD4BF', fontWeight: 600, textDecoration: 'none' }}>
              Бақайдгирӣ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
