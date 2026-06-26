import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";

const links = [
  { to: "/courses", label: "Courses", sub: "Курсы" },
  { to: "/progress", label: "Progress", sub: "Прогресс" },
  { to: "/ai", label: "AI Tutor", sub: "AI Репетитор" },
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

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 bg-navy/95 backdrop-blur text-white shadow-soft">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/courses" className="flex items-center gap-2 font-extrabold text-lg tracking-tight">
          <span>ZaboniAI</span>
          <span>🇹🇯</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                location.pathname.startsWith(l.to)
                  ? "bg-gold text-navy-dark shadow-sm"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">{user.full_name}</span>
              <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full text-gold-light font-semibold">
                🔥 {user.streak}
              </span>
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
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-navy-dark px-4 pb-4 animate-slide-up">
          {user && (
            <div className="flex items-center justify-between py-2 text-sm border-b border-white/10 mb-2">
              <span className="font-semibold">{user.full_name}</span>
              <span className="text-gold-light font-semibold">🔥 {user.streak}</span>
            </div>
          )}
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              className="block py-2.5 text-white/90 font-medium"
            >
              {l.label} <span className="text-white/40 text-xs">/ {l.sub}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="mt-2 w-full text-left py-2.5 text-gold-light font-medium"
          >
            Logout / Выйти
          </button>
        </div>
      )}
    </header>
  );
}
