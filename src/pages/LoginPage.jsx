import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useTranslation } from "../i18n/useTranslation";
import Logo from "../components/Logo";
import { usePageTitle } from "../hooks/usePageTitle";

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LoginPage() {
  usePageTitle("Login");
  const { t } = useTranslation();
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
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Invalid email or password / Неверный email или пароль"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy via-navy-dark to-[#0c1b2e] px-4 bg-grain">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Logo size="medium" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            ZaboniAI <span className="ml-1">🇹🇯</span>
          </h1>
          <p className="text-white/60 mt-2 text-sm">
            Learn English with AI <span className="text-white/40">· Омӯзи забони англисӣ бо AI</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-8">
          <h2 className="text-xl font-bold text-navy mb-1">Welcome back</h2>
          <p className="text-sm text-slate-400 mb-6">С возвращением</p>

          {error && (
            <div className="mb-4 text-sm bg-red-50 text-red-600 border border-red-100 rounded-lg px-3 py-2 animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <MailIcon />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("email")}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-navy focus:ring-2 focus:ring-navy/10 outline-none transition-all duration-200 text-sm"
              />
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <LockIcon />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("password")}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-navy focus:ring-2 focus:ring-navy/10 outline-none transition-all duration-200 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-navy-dark bg-gradient-to-r from-gold-light to-gold shadow-lg shadow-gold/30 hover:shadow-gold/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? "Signing in..." : t("login")}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-navy font-semibold hover:text-gold transition-colors">
              {t("register")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
