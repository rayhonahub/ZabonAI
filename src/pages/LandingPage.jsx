import { Link } from "react-router-dom";

const FEATURES = [
  {
    emoji: "🤖",
    title: "AI Tutor",
    sub: "AI Репетитор",
    ru: "Объясняет на русском и таджикском",
    en: "Explains every mistake in simple terms",
  },
  {
    emoji: "📝",
    title: "Smart Quiz",
    sub: "Умный тест",
    ru: "Тесты после каждого урока",
    en: "A quick quiz after every lesson",
  },
  {
    emoji: "📸",
    title: "Screenshot Help",
    sub: "Помощь по скриншоту",
    ru: "Загрузи скриншот — AI объяснит",
    en: "Upload a screenshot, AI explains it",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between max-w-6xl mx-auto px-4 sm:px-6 py-5">
        <span className="font-extrabold text-xl text-navy flex items-center gap-2">
          ZaboniAI <span>🇹🇯</span>
        </span>
        <Link
          to="/login"
          className="text-sm font-semibold text-navy hover:text-gold transition-colors"
        >
          Login / Войти
        </Link>
      </header>

      <section className="bg-gradient-to-br from-navy via-navy-dark to-[#0c1b2e] bg-grain">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="flex justify-center gap-5 text-4xl mb-8">
            <span className="animate-float inline-block" style={{ animationDelay: "0s" }}>
              📖
            </span>
            <span className="animate-float inline-block" style={{ animationDelay: "0.3s" }}>
              💬
            </span>
            <span className="animate-float inline-block" style={{ animationDelay: "0.6s" }}>
              🎓
            </span>
            <span className="animate-float inline-block" style={{ animationDelay: "0.9s" }}>
              ✨
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 animate-slide-up">
            Learn English with AI
          </h1>
          <p className="text-white/70 text-lg mb-1 animate-slide-up">
            Учи английский с помощью ИИ
          </p>
          <p className="text-white/50 text-base mb-10 animate-slide-up">
            Бо ёрии AI забони англисӣ омӯз
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl font-semibold text-navy-dark bg-gradient-to-r from-gold-light to-gold shadow-lg shadow-gold/30 hover:shadow-gold/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Start Learning / Начать учиться →
            </Link>
            <Link
              to="/login"
              className="text-white/80 hover:text-white text-sm font-medium underline-offset-4 hover:underline transition-colors"
            >
              Already have an account? Login / Войти
            </Link>
          </div>

          <p className="mt-12 text-white/50 text-sm">
            🎉 Join 1000+ learners{" "}
            <span className="text-white/30">· Присоединяйся к 1000+ ученикам</span>
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid sm:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl shadow-card p-6 text-center border border-slate-100 hover:-translate-y-1 hover:shadow-soft transition-all duration-200"
            >
              <div className="text-4xl mb-3">{f.emoji}</div>
              <h3 className="font-bold text-navy mb-0.5">{f.title}</h3>
              <p className="text-xs text-slate-400 mb-3">{f.sub}</p>
              <p className="text-sm text-slate-600">{f.ru}</p>
              <p className="text-xs text-slate-400 mt-1">{f.en}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
