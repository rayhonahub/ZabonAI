import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Gift } from "lucide-react";
import api from "../api/axios";
import { useTranslation } from "../i18n/useTranslation";
import { usePageTitle } from "../hooks/usePageTitle";

export default function RegisterPage() {
  usePageTitle("Register");
  const { t } = useTranslation();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const refCode = new URLSearchParams(window.location.search).get("ref");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", {
        full_name: fullName,
        email,
        password,
        ref_code: refCode || undefined,
      });
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.access_token);
      navigate("/onboarding");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not register / Не удалось зарегистрироваться"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 page-enter" style={{ background: 'linear-gradient(135deg, #F4F1FF 0%, #FFFFFF 60%, #FFF5F8 100%)' }}>
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6D4FF0, #9B7AFF)', boxShadow: '0 8px 20px rgba(109,79,240,0.3)' }}>
              <span className="font-sora font-extrabold text-white text-base">Z</span>
            </div>
            <span className="font-sora font-bold text-xl" style={{ color: '#1A1532' }}>ZaboniAI</span>
          </div>
          <p className="text-sm" style={{ color: '#8A82AD' }}>
            Learn English with AI · Омӯзи забони англисӣ бо AI
          </p>
        </div>

        <div className="glass-card-light p-8">
          <h2 className="text-xl font-bold font-sora mb-0.5" style={{ color: '#1A1532' }}>Create account</h2>
          <p className="text-sm mb-6" style={{ color: '#8A82AD' }}>Создать аккаунт</p>

          {refCode && (
            <div className="mb-4 text-sm rounded-xl px-3 py-2.5 animate-fade-in flex items-center gap-2" style={{ background: 'rgba(109,79,240,0.06)', color: '#6D4FF0', border: '1px solid rgba(109,79,240,0.15)' }}>
              <Gift size={15} />
              Тебя пригласил друг! Ты получишь 20 монет после регистрации!
            </div>
          )}

          {error && (
            <div className="mb-4 text-sm rounded-xl px-3 py-2.5 animate-fade-in" style={{ background: 'rgba(255,92,138,0.08)', color: '#C7396A', border: '1px solid rgba(255,92,138,0.2)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(26,21,50,0.35)' }}>
                <User size={16} />
              </span>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("full_name")}
                className="glass-input-light w-full pl-10 pr-4 py-3 text-sm"
              />
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(26,21,50,0.35)' }}>
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("email")}
                className="glass-input-light w-full pl-10 pr-4 py-3 text-sm"
              />
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(26,21,50,0.35)' }}>
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("password")}
                className="glass-input-light w-full pl-10 pr-4 py-3 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #6D4FF0, #9B7AFF)', boxShadow: '0 8px 20px rgba(109,79,240,0.25)' }}
            >
              {loading ? "Creating account..." : t("register")}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#8A82AD' }}>
            Already have an account?{" "}
            <Link to="/login" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: '#6D4FF0' }}>
              {t("login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
