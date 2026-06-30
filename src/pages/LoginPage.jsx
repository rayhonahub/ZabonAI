import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import api from "../api/axios";
import { useTranslation } from "../i18n/useTranslation";
import { usePageTitle } from "../hooks/usePageTitle";

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
    <div className="min-h-screen flex items-center justify-center bg-ink px-4 page-enter">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow">
              <span className="font-sora font-extrabold text-white text-base">Z</span>
            </div>
            <span className="text-white font-sora font-bold text-xl">ZaboniAI</span>
          </div>
          <p className="text-white/50 text-sm">
            Learn English with AI · Омӯзи забони англисӣ бо AI
          </p>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-xl font-bold text-white font-sora mb-0.5">Welcome back</h2>
          <p className="text-sm text-white/40 mb-6">С возвращением</p>

          {error && (
            <div className="mb-4 text-sm bg-accent/10 text-rose-300 border border-accent/20 rounded-xl px-3 py-2.5 animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("email")}
                className="glass-input w-full pl-10 pr-4 py-3 text-sm"
              />
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("password")}
                className="glass-input w-full pl-10 pr-4 py-3 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white bg-primary hover:bg-primary-dark shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? "Signing in..." : t("login")}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary-light font-semibold hover:text-white transition-colors">
              {t("register")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
