import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Flame, Gem } from "lucide-react";
import api from "../api/axios";
import { LANGUAGES, getLang, setLang } from "../utils/lang";
import { useTranslation } from "../i18n/useTranslation";
import { avatarUrl } from "../utils/avatar";
import Logo from "./Logo";

const links = [
  { to: "/courses", label: "Courses", sub: "Курсы", icon: "📚", key: "courses" },
  { to: "/game", label: "Game", sub: "Игра", icon: "🎮" },
  { to: "/practice", label: "Practice", sub: "Практика", icon: "🧩", key: "practice" },
  { to: "/daily", label: "Daily", sub: "Вызов дня", icon: "⚡" },
  { to: "/progress", label: "Progress", sub: "Прогресс", icon: "📊", key: "progress" },
  { to: "/ai", label: "AI Chat", sub: "AI Чат", icon: "🤖", key: "aiChat" },
  { to: "/shop", label: "Shop", sub: "Магазин", icon: "🛒", key: "shop" },
];

const UI_LANGUAGES = [
  { code: "ru", flag: "🇷🇺", label: "RU" },
  { code: "tj", flag: "🇹🇯", label: "TJ" },
  { code: "en", flag: "🇬🇧", label: "EN" },
];

export default function Navbar() {
  const { t, lang: uiLang, changeLang } = useTranslation();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(getLang());
  const [coins, setCoins] = useState(Number(localStorage.getItem("coins") || 0));
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/profile/me")
      .then((res) => {
        setUser(res.data);
        if (res.data.selected_language) {
          setCurrentLang(res.data.selected_language);
          setLang(res.data.selected_language);
        }
      })
      .catch(() => setUser(null));

    api
      .get("/progress/coins")
      .then((res) => {
        setCoins(res.data.coins);
        localStorage.setItem("coins", String(res.data.coins));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  function handleLangChange(code) {
    setCurrentLang(code);
    setLang(code);
    setLangOpen(false);
    api.put("/profile/update", { selected_language: code }).catch(() => {});
  }

  const activeLang = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40 glass-nav text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/courses" className="flex items-center gap-2 font-extrabold text-lg tracking-tight">
          <Logo size="small" />
          <span className="bg-gradient-to-r from-gold-light to-gold bg-clip-text text-transparent">ZaboniAI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                location.pathname.startsWith(l.to)
                  ? "bg-gold text-navy-dark shadow-sm"
                  : "text-white/80 hover:text-white hover:bg-white/10 hover:-translate-y-0.5"
              }`}
            >
              <span>{l.icon}</span>
              {l.key ? t(l.key) : l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1">
            {UI_LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => changeLang(l.code)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all duration-150 border ${
                  uiLang === l.code
                    ? "border-gold bg-white/10 text-white"
                    : "border-transparent text-white/60 hover:text-white hover:border-white/30"
                }`}
              >
                <span>{l.flag}</span> {l.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150"
            >
              <span>{activeLang.flag}</span>
              <span>{activeLang.label}</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-soft py-1.5 w-32 z-50 animate-fade-in">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => handleLangChange(l.code)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors duration-150 ${
                      l.code === currentLang ? "bg-slate-100 font-semibold text-navy" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>{l.flag}</span> {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user && (
            <Link to="/profile" className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full text-gold-light font-semibold text-sm">
                <Flame size={14} className="text-accent" /> {user.streak}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full text-primary-light font-semibold text-sm">
                <Gem size={14} className="text-primary-light" /> {coins}
              </span>
              <img
                src={avatarUrl(user.avatar_style, user.avatar_seed)}
                alt={user.full_name}
                title={user.full_name}
                className="w-8 h-8 rounded-full bg-white/10 shadow-sm"
              />
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-white/70 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-4 py-1.5 transition-all duration-200"
          >
            {t("logout")}
          </button>
        </div>

        <button
          className="md:hidden text-white p-2"
          onClick={() => setMenuOpen(true)}
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile slide-in drawer */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 h-full w-72 bg-navy-dark shadow-2xl transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          } flex flex-col`}
        >
          <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
            <span className="flex items-center gap-2 font-extrabold text-white">
              <Logo size="small" /> ZaboniAI
            </span>
            <button onClick={() => setMenuOpen(false)} className="text-white/70 hover:text-white p-1">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {user && (
            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-5 py-4 border-b border-white/10"
            >
              <img
                src={avatarUrl(user.avatar_style, user.avatar_seed)}
                alt={user.full_name}
                className="w-10 h-10 rounded-full bg-white/10"
              />
              <div>
                <p className="text-white font-semibold text-sm">{user.full_name}</p>
                <p className="text-gold-light text-xs font-semibold flex items-center gap-1"><Flame size={12} className="text-accent" /> {user.streak} day streak</p>
                <p className="text-primary-light text-xs font-semibold flex items-center gap-1"><Gem size={12} className="text-primary-light" /> {coins} coins</p>
              </div>
            </Link>
          )}

          <div className="flex items-center gap-1.5 px-5 py-3 border-b border-white/10">
            {UI_LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => changeLang(l.code)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 border ${
                  uiLang === l.code ? "border-gold bg-white/10 text-white" : "border-transparent bg-white/10 text-white/80"
                }`}
              >
                {l.flag} {l.label}
              </button>
            ))}
          </div>

          <nav className="flex-1 px-3 py-3 space-y-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  location.pathname.startsWith(l.to)
                    ? "bg-gold text-navy-dark"
                    : "text-white/85 hover:bg-white/10"
                }`}
              >
                <span className="text-lg">{l.icon}</span>
                <span>{l.key ? t(l.key) : l.label}</span>
              </Link>
            ))}
          </nav>

          <div className="px-3 pb-5">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-3 rounded-xl text-gold-light font-medium hover:bg-white/10 transition-colors duration-150"
            >
              {t("logout")}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
