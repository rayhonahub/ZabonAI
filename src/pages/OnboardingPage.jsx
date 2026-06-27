import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const LEVELS = [
  {
    key: "zero",
    emoji: "🌱",
    title: "Zero",
    sub: "С нуля",
    desc: "Я не знаю английского вообще",
  },
  {
    key: "beginner",
    emoji: "📖",
    title: "Beginner",
    sub: "Начинающий",
    desc: "Знаю несколько слов",
  },
  {
    key: "elementary",
    emoji: "📚",
    title: "Elementary",
    sub: "Средний",
    desc: "Знаю базовые фразы",
  },
  {
    key: "intermediate",
    emoji: "🚀",
    title: "Intermediate",
    sub: "Продвинутый",
    desc: "Могу общаться",
  },
];

const GOALS = [
  {
    key: "work",
    emoji: "💼",
    title: "For work",
    sub: "Для работы",
  },
  {
    key: "travel",
    emoji: "✈️",
    title: "For travel",
    sub: "Для путешествий",
  },
  {
    key: "study",
    emoji: "📝",
    title: "For study",
    sub: "Для учёбы",
  },
  {
    key: "self_development",
    emoji: "🌟",
    title: "Self-development",
    sub: "Саморазвитие",
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [level, setLevel] = useState(null);
  const [goal, setGoal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("onboarding_done") === "true") {
      navigate("/courses", { replace: true });
    }
  }, [navigate]);

  function chooseLevel(l) {
    setLevel(l);
    localStorage.setItem("user_level", l.key);
    setStep(2);
  }

  function chooseGoal(g) {
    setGoal(g);
    localStorage.setItem("user_goal", g.key);
    setStep(3);
  }

  function finish() {
    localStorage.setItem("onboarding_done", "true");
    navigate("/courses");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-dark to-[#0c1b2e] bg-grain flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-3xl text-center animate-slide-up">
        <div className="flex justify-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                s === step ? "w-8 bg-gold" : "w-4 bg-white/20"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
              What is your English level?
            </h1>
            <p className="text-white/60 mb-12">Какой у тебя уровень английского?</p>

            <div className="grid sm:grid-cols-2 gap-5">
              {LEVELS.map((l) => (
                <button
                  key={l.key}
                  onClick={() => chooseLevel(l)}
                  className="bg-white rounded-2xl p-6 text-left transition-all duration-200 border-2 border-transparent hover:border-gold/40 hover:-translate-y-1 shadow-card"
                >
                  <div className="text-4xl mb-3">{l.emoji}</div>
                  <h3 className="font-bold text-navy text-lg">
                    {l.title} <span className="text-slate-400 text-sm font-medium">/ {l.sub}</span>
                  </h3>
                  <p className="text-sm text-slate-500 mt-2">{l.desc}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
              What is your goal?
            </h1>
            <p className="text-white/60 mb-12">Какова твоя цель?</p>

            <div className="grid sm:grid-cols-2 gap-5">
              {GOALS.map((g) => (
                <button
                  key={g.key}
                  onClick={() => chooseGoal(g)}
                  className="bg-white rounded-2xl p-6 text-left transition-all duration-200 border-2 border-transparent hover:border-gold/40 hover:-translate-y-1 shadow-card"
                >
                  <div className="text-4xl mb-3">{g.emoji}</div>
                  <h3 className="font-bold text-navy text-lg">
                    {g.title} <span className="text-slate-400 text-sm font-medium">/ {g.sub}</span>
                  </h3>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-soft p-10 max-w-md mx-auto animate-pop">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-2xl font-extrabold text-navy mb-1">
              Your personal learning path is ready!
            </h1>
            <p className="text-slate-500 mb-8">Твой персональный трек готов!</p>

            <div className="space-y-3 mb-8 text-left">
              <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                <span className="text-sm text-slate-400">Level / Уровень</span>
                <span className="font-semibold text-navy">
                  {level?.emoji} {level?.title} / {level?.sub}
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                <span className="text-sm text-slate-400">Goal / Цель</span>
                <span className="font-semibold text-navy">
                  {goal?.emoji} {goal?.title} / {goal?.sub}
                </span>
              </div>
            </div>

            <button
              onClick={finish}
              className="w-full py-3 rounded-xl font-semibold text-navy-dark bg-gradient-to-r from-gold-light to-gold shadow-lg shadow-gold/30 hover:shadow-gold/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Start Learning
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
