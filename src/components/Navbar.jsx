import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { LANGUAGES, getLang, setLang } from "../utils/lang";

const links = [
  { to: "/courses", label: "Courses", sub: "Курсы", icon: "📚" },
  { to: "/game", label: "Game", sub: "Игра", icon: "🎮" },
  { to: "/daily", label: "Daily", sub: "Вызов дня", icon: "⚡" },
  { to: "/progress", label: "Progress", sub: "Прогресс", icon: "📊" },
  { to: "/ai", label: "AI Chat", sub: "AI Чат", icon: "🤖" },
];

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(getLang());
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

  const initial = user?.full_name?.trim()?.[0]?.toUpperCase() || "?";
  const activeLang = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  return (
    <header className="sticky top-0 z-40 bg-navy/95 backdrop-blur text-white shadow-soft">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/courses" className="flex items-center gap-2 font-extrabold text-lg tracking-tight">
          <span className="bg-gradient-to-r from-gold-light to-gold bg-clip-text text-transparent">ZaboniAI</span>
          <span>🇹🇯</span>
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
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
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
              <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full text-gold-light font-semibold text-sm">
                🔥 {user.streak}
              </span>
              <div
                title={user.full_name}
                style={{ backgroundColor: user.avatar_color }}
                className="w-8 h-8 rounded-full text-white font-bold text-sm flex items-center justify-center shadow-sm"
              >
                {initial}
              </div>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-white/70 hover:text-white border border-white/20 hover:border-white/40 rounded-full px-4 py-1.5 transition-all duration-200"
          >
            Logout
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
            <span className="font-extrabold text-white">ZaboniAI 🇹🇯</span>
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
              <div
                style={{ backgroundColor: user.avatar_color }}
                className="w-10 h-10 rounded-full text-white font-bold flex items-center justify-center"
              >
                {initial}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{user.full_name}</p>
                <p className="text-gold-light text-xs font-semibold">🔥 {user.streak} day streak</p>
              </div>
            </Link>
          )}

          <div className="flex items-center gap-1.5 px-5 py-3 border-b border-white/10">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => handleLangChange(l.code)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150 ${
                  l.code === currentLang ? "bg-gold text-navy-dark" : "bg-white/10 text-white/80"
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
                <span>
                  {l.label} <span className="opacity-50 text-xs">/ {l.sub}</span>
                </span>
              </Link>
            ))}
          </nav>

          <div className="px-3 pb-5">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-3 rounded-xl text-gold-light font-medium hover:bg-white/10 transition-colors duration-150"
            >
              Logout / Выйти
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
