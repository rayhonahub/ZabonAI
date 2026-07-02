import { useEffect, useState } from "react";
import { Zap, Palette, Flame, Crown, Gem } from "lucide-react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { showToast } from "../utils/toastBus";
import { usePageTitle } from "../hooks/usePageTitle";

const ITEMS = [
  {
    id: "streak_freeze",
    Icon: Flame,
    iconColor: "#FF5C8A",
    title: "Streak Freeze",
    description: "Мунҷамидани силсила барои 1 рӯз",
    price: 50,
  },
  {
    id: "new_theme",
    Icon: Palette,
    iconColor: "#2DD4BF",
    title: "New Theme",
    description: "Мавзӯи торик барои сомона",
    price: 100,
  },
  {
    id: "double_xp",
    Icon: Zap,
    iconColor: "#FBBF24",
    title: "Double XP",
    description: "Дар давоми 1 соат холҳо дучанд",
    price: 75,
  },
  {
    id: "premium_week",
    Icon: Crown,
    iconColor: "#FBBF24",
    title: "Premium Week",
    description: "Дастрасӣ ба Premium барои 7 рӯз",
    price: 200,
  },
];

export default function ShopPage() {
  usePageTitle("Shop");
  const [coins, setCoins] = useState(Number(localStorage.getItem("coins") || 0));

  useEffect(() => {
    api
      .get("/progress/coins")
      .then((res) => {
        setCoins(res.data.coins);
        localStorage.setItem("coins", String(res.data.coins));
      })
      .catch(() => {});
  }, []);

  function handleBuy(item) {
    if (coins < item.price) return;
    const newBalance = coins - item.price;
    setCoins(newBalance);
    localStorage.setItem("coins", String(newBalance));
    showToast("Харида шуд!", "success");
  }

  return (
    <div className="min-h-screen page-enter" style={{ background: 'linear-gradient(160deg, #061A1C 0%, #0A2A2E 45%, #0E3A3F 100%)' }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-extrabold font-sora" style={{ color: 'white' }}>Мағоза</h1>
          <span className="flex items-center gap-1.5 font-bold px-4 py-2 rounded-full text-sm" style={{ background: 'rgba(45,212,191,0.1)', color: '#2DD4BF', border: '1px solid rgba(45,212,191,0.2)' }}>
            <Gem size={14} /> {coins} танга
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {ITEMS.map((item) => {
            const canAfford = coins >= item.price;
            return (
              <div key={item.id} className="glass-card p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <item.Icon size={28} style={{ color: item.iconColor }} />
                  <div>
                    <h2 className="font-bold font-sora" style={{ color: 'white' }}>{item.title}</h2>
                    <p className="text-sm font-semibold flex items-center gap-1" style={{ color: '#2DD4BF' }}>
                      <Gem size={12} /> {item.price} танга
                    </p>
                  </div>
                </div>
                <p className="text-sm flex-1 mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.description}</p>
                <button
                  disabled={!canAfford}
                  onClick={() => handleBuy(item)}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    canAfford ? "hover:-translate-y-0.5" : "cursor-not-allowed"
                  }`}
                  style={canAfford
                    ? { background: '#14B8A6', color: '#04231F', boxShadow: '0 4px 12px rgba(20,184,166,0.25)' }
                    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }
                  }
                >
                  {canAfford ? "Харидан" : "Танга кофӣ нест"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
