import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { showToast } from "../utils/toastBus";
import { usePageTitle } from "../hooks/usePageTitle";

const ITEMS = [
  {
    id: "streak_freeze",
    icon: "🧊",
    title: "Streak Freeze",
    description: "Заморозка серии на 1 день",
    price: 50,
  },
  {
    id: "new_theme",
    icon: "🎨",
    title: "New Theme",
    description: "Тёмная тема для сайта",
    price: 100,
  },
  {
    id: "double_xp",
    icon: "⚡",
    title: "Double XP",
    description: "Двойные очки на 1 час",
    price: 75,
  },
  {
    id: "premium_week",
    icon: "👑",
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
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-extrabold text-navy">🛒 Shop / Магазин</h1>
          <span className="flex items-center gap-1.5 bg-gold/10 text-gold-dark font-bold px-4 py-2 rounded-full text-sm">
            💎 Your coins: {coins}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {ITEMS.map((item) => {
            const canAfford = coins >= item.price;
            return (
              <div key={item.id} className="bg-white rounded-2xl shadow-card p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <h2 className="font-bold text-navy">{item.title}</h2>
                    <p className="text-sm text-gold-dark font-semibold">💎 {item.price} coins</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 flex-1 mb-4">{item.description}</p>
                <button
                  disabled={!canAfford}
                  onClick={() => handleBuy(item)}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    canAfford
                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
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
