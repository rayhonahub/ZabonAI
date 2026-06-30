import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Flame, Gem, BookOpen, Gamepad2, Puzzle, Zap, BarChart2, Sparkles, ShoppingBag } from "lucide-react";
import api from "../api/axios";
import { LANGUAGES, getLang, setLang } from "../utils/lang";
import { useTranslation } from "../i18n/useTranslation";
import { avatarUrl } from "../utils/avatar";

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
    <header
      className="sticky top-0 z-40"
      style={{
        background: 'rgba(9,20,24,0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(45,212,191,0.15)',
        color: 'white',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/courses" className="flex items-center gap-2">
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #0D9488, #22D3EE)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Z</span>
          </div>
          <span style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>ZaboniAI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded text-sm font-medium transition-all duration-200 ${
                location.pathname.startsWith(l.to)
                  ? "shadow-sm"
                  : "hover:-translate-y-0.5"
              }`}
              style={location.pathname.startsWith(l.to)
                ? { background: 'rgba(45,212,191,0.12)', color: '#2DD4BF' }
                : { color: 'rgba(255,255,255,0.6)' }
              }
              onMouseEnter={(e) => {
                if (!location.pathname.startsWith(l.to)) {
                  e.currentTarget.style.background = 'rgba(45,212,191,0.07)';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!location.pathname.startsWith(l.to)) {
                  e.currentTarget.style.background = '';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
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
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all duration-150 border"
                style={uiLang === l.code
                  ? { borderColor: 'rgba(45,212,191,0.35)', background: 'rgba(45,212,191,0.1)', color: '#2DD4BF' }
                  : { borderColor: 'transparent', color: 'rgba(255,255,255,0.45)' }
                }
              >
                <span>{l.flag}</span> {l.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-sm font-semibold transition-colors duration-150"
              style={{ background: 'rgba(45,212,191,0.08)', color: 'rgba(255,255,255,0.8)' }}
            >
              <span>{activeLang.flag}</span>
              <span>{activeLang.label}</span>
            </button>
            {langOpen && (
              <div
                className="absolute right-0 mt-2 rounded py-1.5 w-32 z-50 animate-fade-in"
                style={{
                  background: '#0A2A2E',
                  border: '1px solid rgba(45,212,191,0.2)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
              >
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => handleLangChange(l.code)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors duration-150"
                    style={l.code === currentLang
                      ? { background: 'rgba(45,212,191,0.1)', color: '#2DD4BF', fontWeight: 600 }
                      : { color: 'rgba(255,255,255,0.55)' }
                    }
                  >
                    <span>{l.flag}</span> {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user && (
            <Link to="/profile" className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded font-semibold text-sm" style={{ background: 'rgba(251,191,36,0.1)', color: '#FBBF24' }}>
                <Flame size={14} /> {user.streak}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded font-semibold text-sm" style={{ background: 'rgba(45,212,191,0.1)', color: '#2DD4BF' }}>
                <Gem size={14} /> {coins}
              </span>
              <img
                src={avatarUrl(user.avatar_style, user.avatar_seed)}
                alt={user.full_name}
                title={user.full_name}
                className="w-8 h-8 rounded-full shadow-sm"
                style={{ border: '2px solid rgba(45,212,191,0.3)' }}
              />
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="text-sm font-medium rounded px-4 py-1.5 transition-all duration-200"
            style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
          >
            {t("logout")}
          </button>
        </div>

        <button
          className="md:hidden p-2"
          style={{ color: 'rgba(255,255,255,0.8)' }}
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
          style={{ background: 'rgba(6,26,28,0.6)' }}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 h-full w-72 shadow-2xl transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          } flex flex-col`}
          style={{ background: '#0A2A2E', borderLeft: '1px solid rgba(45,212,191,0.15)' }}
        >
          <div className="flex items-center justify-between px-5 h-16" style={{ borderBottom: '1px solid rgba(45,212,191,0.12)' }}>
            <span className="flex items-center gap-2 font-semibold" style={{ color: 'white' }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: 'linear-gradient(135deg, #0D9488, #22D3EE)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: 12 }}>Z</span>
              </div>
              ZaboniAI
            </span>
            <button onClick={() => setMenuOpen(false)} className="p-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
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
              style={{ borderBottom: '1px solid rgba(45,212,191,0.12)' }}
            >
              <img
                src={avatarUrl(user.avatar_style, user.avatar_seed)}
                alt={user.full_name}
                className="w-10 h-10 rounded-full"
                style={{ border: '2px solid rgba(45,212,191,0.3)' }}
              />
              <div>
                <p className="font-semibold text-sm" style={{ color: 'white' }}>{user.full_name}</p>
                <p className="text-xs font-semibold flex items-center gap-1" style={{ color: '#FBBF24' }}>
                  <Flame size={12} /> {user.streak} day streak
                </p>
                <p className="text-xs font-semibold flex items-center gap-1" style={{ color: '#2DD4BF' }}>
                  <Gem size={12} /> {coins} coins
                </p>
              </div>
            </Link>
          )}

          <div className="flex items-center gap-1.5 px-5 py-3" style={{ borderBottom: '1px solid rgba(45,212,191,0.12)' }}>
            {UI_LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => changeLang(l.code)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-semibold transition-all duration-150 border"
                style={uiLang === l.code
                  ? { borderColor: 'rgba(45,212,191,0.35)', background: 'rgba(45,212,191,0.1)', color: '#2DD4BF' }
                  : { borderColor: 'transparent', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)' }
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
                className="flex items-center gap-3 px-3 py-3 rounded text-sm font-medium transition-all duration-150"
                style={location.pathname.startsWith(l.to)
                  ? { background: 'rgba(45,212,191,0.1)', color: '#2DD4BF' }
                  : { color: 'rgba(255,255,255,0.6)' }
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
              className="w-full text-left px-3 py-3 rounded font-medium transition-colors duration-150"
              style={{ color: 'rgba(45,212,191,0.7)' }}
            >
              {t("logout")}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
