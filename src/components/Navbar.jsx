import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";

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
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  const initial = user?.full_name?.trim()?.[0]?.toUpperCase() || "?";

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
          {user && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full text-gold-light font-semibold text-sm">
                🔥 {user.streak}
              </span>
              <div
                title={user.full_name}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-light to-gold text-navy-dark font-bold text-sm flex items-center justify-center shadow-sm"
              >
                {initial}
              </div>
            </div>
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
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-light to-gold text-navy-dark font-bold flex items-center justify-center">
                {initial}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{user.full_name}</p>
                <p className="text-gold-light text-xs font-semibold">🔥 {user.streak} day streak</p>
              </div>
            </div>
          )}

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
