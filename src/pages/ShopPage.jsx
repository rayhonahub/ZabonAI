import { useEffect, useState } from "react";
import { Zap, Palette, Flame, Crown } from "lucide-react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { showToast } from "../utils/toastBus";
import { usePageTitle } from "../hooks/usePageTitle";

const ITEMS = [
  {
    id: "streak_freeze",
    Icon: Flame,
    iconColor: "text-accent",
    title: "Streak Freeze",
    description: "Заморозка серии на 1 день",
    price: 50,
  },
  {
    id: "new_theme",
    Icon: Palette,
    iconColor: "text-primary-light",
    title: "New Theme",
    description: "Тёмная тема для сайта",
    price: 100,
  },
  {
    id: "double_xp",
    Icon: Zap,
    iconColor: "text-gold",
    title: "Double XP",
    description: "Двойные очки на 1 час",
    price: 75,
  },
  {
    id: "premium_week",
    Icon: Crown,
    iconColor: "text-gold",
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
    showToast("✅ Purchased! / Куплено!", "success");
  }

  return (
    <div className="min-h-screen bg-ink page-enter">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-extrabold text-white font-sora">Shop / Мағоза</h1>
          <span className="flex items-center gap-1.5 bg-primary/15 text-primary-light font-bold px-4 py-2 rounded-full text-sm border border-primary/20">
            💎 {coins} coins
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {ITEMS.map((item) => {
            const canAfford = coins >= item.price;
            return (
              <div key={item.id} className="glass-card p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <item.Icon size={28} className={item.iconColor} />
                  <div>
                    <h2 className="font-bold text-white font-sora">{item.title}</h2>
                    <p className="text-sm text-primary-light font-semibold">💎 {item.price} coins</p>
                  </div>
                </div>
                <p className="text-sm text-white/60 flex-1 mb-4">{item.description}</p>
                <button
                  disabled={!canAfford}
                  onClick={() => handleBuy(item)}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    canAfford
                      ? "bg-primary text-white hover:bg-primary-dark hover:-translate-y-0.5 shadow-lg shadow-primary/30"
                      : "bg-white/10 text-white/30 cursor-not-allowed"
                  }`}
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
