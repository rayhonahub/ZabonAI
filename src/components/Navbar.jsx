import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Flame, Gem, BookOpen, Gamepad2, Puzzle, Zap, BarChart2, Sparkles, ShoppingBag } from "lucide-react";
import api from "../api/axios";
import { LANGUAGES, getLang, setLang } from "../utils/lang";
import { useTranslation } from "../i18n/useTranslation";
import { avatarUrl } from "../utils/avatar";
import Logo from "./Logo";

const links = [
  { to: "/courses", label: "Courses", sub: "Курсы", Icon: BookOpen, key: "courses" },
  { to: "/game", label: "Game", sub: "Игра", Icon: Gamepad2 },
  { to: "/practice", label: "Practice", sub: "Практика", Icon: Puzzle, key: "practice" },
  { to: "/daily", label: "Daily", sub: "Вызов дня", Icon: Zap },
  { to: "/progress", label: "Progress", sub: "Прогресс", Icon: BarChart2, key: "progress" },
  { to: "/ai", label: "AI Chat", sub: "AI Чат", Icon: Sparkles, key: "aiChat" },
  { to: "/shop", label: "Shop", sub: "Магазин", Icon: ShoppingBag, key: "shop" },
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
    <header className="sticky top-0 z-40 glass-nav" style={{ color: '#1A1532' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/courses" className="flex items-center gap-2 font-extrabold text-lg tracking-tight">
          <Logo size="small" />
          <span className="font-sora font-bold text-sm" style={{ color: '#1A1532' }}>ZaboniAI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                location.pathname.startsWith(l.to)
                  ? "shadow-sm"
                  : "hover:-translate-y-0.5"
              }`}
              style={location.pathname.startsWith(l.to)
                ? { background: 'rgba(109,79,240,0.1)', color: '#6D4FF0' }
                : { color: '#534A7A' }
              }
              onMouseEnter={(e) => {
                if (!location.pathname.startsWith(l.to)) {
                  e.currentTarget.style.background = 'rgba(109,79,240,0.06)';
                  e.currentTarget.style.color = '#1A1532';
                }
              }}
              onMouseLeave={(e) => {
                if (!location.pathname.startsWith(l.to)) {
                  e.currentTarget.style.background = '';
                  e.currentTarget.style.color = '#534A7A';
                }
              }}
            >
              <l.Icon size={14} />
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
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-transparent text-ink/50 hover:text-ink hover:border-ink/20"
                }`}
              >
                <span>{l.flag}</span> {l.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150"
              style={{ background: 'rgba(109,79,240,0.08)', color: '#1A1532' }}
            >
              <span>{activeLang.flag}</span>
              <span>{activeLang.label}</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 bg-white rounded-xl shadow-soft py-1.5 w-32 z-50 animate-fade-in" style={{ border: '1px solid rgba(109,79,240,0.1)' }}>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => handleLangChange(l.code)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors duration-150 ${
                      l.code === currentLang ? "bg-primary/8 font-semibold text-primary" : "text-ink/60 hover:bg-primary/5"
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
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-sm" style={{ background: 'rgba(255,92,138,0.1)', color: '#FF5C8A' }}>
                <Flame size={14} /> {user.streak}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-sm" style={{ background: 'rgba(109,79,240,0.1)', color: '#6D4FF0' }}>
                <Gem size={14} /> {coins}
              </span>
              <img
                src={avatarUrl(user.avatar_style, user.avatar_seed)}
                alt={user.full_name}
                title={user.full_name}
                className="w-8 h-8 rounded-full shadow-sm"
                style={{ border: '2px solid rgba(109,79,240,0.2)' }}
              />
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="text-sm font-medium rounded-full px-4 py-1.5 transition-all duration-200"
            style={{ color: '#534A7A', border: '1px solid rgba(26,21,50,0.15)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#1A1532'; e.currentTarget.style.borderColor = 'rgba(26,21,50,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#534A7A'; e.currentTarget.style.borderColor = 'rgba(26,21,50,0.15)'; }}
          >
            {t("logout")}
          </button>
        </div>

        <button
          className="md:hidden p-2"
          style={{ color: '#1A1532' }}
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
          className="absolute inset-0"
          style={{ background: 'rgba(26,21,50,0.25)' }}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 h-full w-72 shadow-2xl transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          } flex flex-col`}
          style={{ background: 'white' }}
        >
          <div className="flex items-center justify-between px-5 h-16" style={{ borderBottom: '1px solid rgba(109,79,240,0.1)' }}>
            <span className="flex items-center gap-2 font-extrabold" style={{ color: '#1A1532' }}>
              <Logo size="small" /> ZaboniAI
            </span>
            <button onClick={() => setMenuOpen(false)} className="p-1" style={{ color: '#8A82AD' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {user && (
            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderBottom: '1px solid rgba(109,79,240,0.1)' }}
            >
              <img
                src={avatarUrl(user.avatar_style, user.avatar_seed)}
                alt={user.full_name}
                className="w-10 h-10 rounded-full"
                style={{ border: '2px solid rgba(109,79,240,0.2)' }}
              />
              <div>
                <p className="font-semibold text-sm" style={{ color: '#1A1532' }}>{user.full_name}</p>
                <p className="text-xs font-semibold flex items-center gap-1" style={{ color: '#FF5C8A' }}>
                  <Flame size={12} /> {user.streak} day streak
                </p>
                <p className="text-xs font-semibold flex items-center gap-1" style={{ color: '#6D4FF0' }}>
                  <Gem size={12} /> {coins} coins
                </p>
              </div>
            </Link>
          )}

          <div className="flex items-center gap-1.5 px-5 py-3" style={{ borderBottom: '1px solid rgba(109,79,240,0.1)' }}>
            {UI_LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => changeLang(l.code)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 border`}
                style={uiLang === l.code
                  ? { borderColor: 'rgba(109,79,240,0.3)', background: 'rgba(109,79,240,0.1)', color: '#6D4FF0' }
                  : { borderColor: 'transparent', background: 'rgba(109,79,240,0.06)', color: '#534A7A' }
                }
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
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-150`}
                style={location.pathname.startsWith(l.to)
                  ? { background: 'rgba(109,79,240,0.1)', color: '#6D4FF0' }
                  : { color: '#534A7A' }
                }
              >
                <l.Icon size={18} />
                <span>{l.key ? t(l.key) : l.label}</span>
              </Link>
            ))}
          </nav>

          <div className="px-3 pb-5">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-3 rounded-xl font-medium transition-colors duration-150"
              style={{ color: '#FF5C8A' }}
            >
              {t("logout")}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
