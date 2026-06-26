import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LEVELS = [
  {
    key: "beginner",
    emoji: "🌱",
    title: "Beginner",
    sub: "Начинающий",
    desc: "Я знаю очень мало английских слов",
  },
  {
    key: "elementary",
    emoji: "📚",
    title: "Elementary",
    sub: "Средний",
    desc: "Я знаю базовые слова и фразы",
  },
  {
    key: "intermediate",
    emoji: "🚀",
    title: "Intermediate",
    sub: "Продвинутый",
    desc: "Я могу общаться на простые темы",
  },
];

export default function LevelSelectPage() {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  function choose(levelKey) {
    if (selected) return;
    setSelected(levelKey);
    localStorage.setItem("englishLevel", levelKey);
    setTimeout(() => navigate("/courses"), 500);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-dark to-[#0c1b2e] bg-grain flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-3xl text-center animate-slide-up">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
          What is your English level?
        </h1>
        <p className="text-white/60 mb-12">Какой у вас уровень английского?</p>

        <div className="grid sm:grid-cols-3 gap-5">
          {LEVELS.map((l) => {
            const isSelected = selected === l.key;
            return (
              <button
                key={l.key}
                onClick={() => choose(l.key)}
                disabled={!!selected}
                className={`bg-white rounded-2xl p-6 text-left transition-all duration-200 border-2 ${
                  isSelected
                    ? "border-gold scale-[1.02] shadow-soft animate-pop"
                    : "border-transparent hover:border-gold/40 hover:-translate-y-1 shadow-card"
                } disabled:cursor-default`}
              >
                <div className="text-4xl mb-3">{l.emoji}</div>
                <h3 className="font-bold text-navy text-lg">
                  {l.title} <span className="text-slate-400 text-sm font-medium">/ {l.sub}</span>
                </h3>
                <p className="text-sm text-slate-500 mt-2">{l.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
