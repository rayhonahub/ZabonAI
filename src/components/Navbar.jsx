import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Flame, Gem, BookOpen, Gamepad2, Puzzle, Zap, BarChart2, Sparkles, ShoppingBag } from "lucide-react";
import api from "../api/axios";
import { avatarUrl } from "../utils/avatar";

const links = [
  { to: "/courses", label: "Курсҳо", Icon: BookOpen },
  { to: "/game", label: "Бозӣ", Icon: Gamepad2 },
  { to: "/practice", label: "Машқ", Icon: Puzzle },
  { to: "/daily", label: "Рӯзона", Icon: Zap },
  { to: "/progress", label: "Пешрафт", Icon: BarChart2 },
  { to: "/ai", label: "ИИ Чат", Icon: Sparkles },
  { to: "/shop", label: "Мағоза", Icon: ShoppingBag },
];

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [coins, setCoins] = useState(Number(localStorage.getItem("coins") || 0));
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/profile/me")
      .then((res) => setUser(res.data))
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

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: 'rgba(9,20,24,0.6)',
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
                ? { background: 'rgba(45,212,191,0.12)', color: '#2DD4BF', borderBottom: '2px solid #2DD4BF' }
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
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
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
            Баромадан
          </button>
        </div>

        <button
          className="md:hidden p-2"
          style={{ color: 'rgba(255,255,255,0.8)' }}
          onClick={() => setMenuOpen(true)}
          aria-label="Меню"
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
                  <Flame size={12} /> {user.streak} рӯзи пайдарпай
                </p>
                <p className="text-xs font-semibold flex items-center gap-1" style={{ color: '#2DD4BF' }}>
                  <Gem size={12} /> {coins} тангаҳо
                </p>
              </div>
            </Link>
          )}

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
                <span>{l.label}</span>
              </Link>
            ))}
          </nav>

          <div className="px-3 pb-5">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-3 rounded font-medium transition-colors duration-150"
              style={{ color: 'rgba(45,212,191,0.7)' }}
            >
              Баромадан
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
