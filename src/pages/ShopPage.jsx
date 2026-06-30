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
    description: "Заморозка серии на 1 день",
    price: 50,
  },
  {
    id: "new_theme",
    Icon: Palette,
    iconColor: "#6D4FF0",
    title: "New Theme",
    description: "Тёмная тема для сайта",
    price: 100,
  },
  {
    id: "double_xp",
    Icon: Zap,
    iconColor: "#f0a500",
    title: "Double XP",
    description: "Двойные очки на 1 час",
    price: 75,
  },
  {
    id: "premium_week",
    Icon: Crown,
    iconColor: "#f0a500",
    title: "Premium Week",
    description: "Доступ к Premium на 7 дней",
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
    showToast("Purchased! / Куплено!", "success");
  }

  return (
    <div className="min-h-screen page-enter" style={{ background: '#F4F1FF' }}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-extrabold font-sora" style={{ color: '#1A1532' }}>Shop / Мағоза</h1>
          <span className="flex items-center gap-1.5 font-bold px-4 py-2 rounded-full text-sm" style={{ background: 'rgba(109,79,240,0.08)', color: '#6D4FF0', border: '1px solid rgba(109,79,240,0.15)' }}>
            <Gem size={14} /> {coins} coins
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {ITEMS.map((item) => {
            const canAfford = coins >= item.price;
            return (
              <div key={item.id} className="glass-card-light p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <item.Icon size={28} style={{ color: item.iconColor }} />
                  <div>
                    <h2 className="font-bold font-sora" style={{ color: '#1A1532' }}>{item.title}</h2>
                    <p className="text-sm font-semibold flex items-center gap-1" style={{ color: '#6D4FF0' }}>
                      <Gem size={12} /> {item.price} coins
                    </p>
                  </div>
                </div>
                <p className="text-sm flex-1 mb-4" style={{ color: '#8A82AD' }}>{item.description}</p>
                <button
                  disabled={!canAfford}
                  onClick={() => handleBuy(item)}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    canAfford ? "hover:-translate-y-0.5" : "cursor-not-allowed"
                  }`}
                  style={canAfford
                    ? { background: 'linear-gradient(135deg, #6D4FF0, #9B7AFF)', color: 'white', boxShadow: '0 4px 12px rgba(109,79,240,0.2)' }
                    : { background: 'rgba(26,21,50,0.06)', color: 'rgba(26,21,50,0.3)' }
                  }
                >
                  {canAfford ? "Buy" : "Not enough coins"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
