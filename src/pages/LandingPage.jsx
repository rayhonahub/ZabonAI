import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCountUp } from "../hooks/useCountUp";
import Logo from "../components/Logo";

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

const STEPS = [
  { emoji: "1️⃣", title: "Choose your level", sub: "Выбери свой уровень" },
  { emoji: "2️⃣", title: "Study lessons with AI help", sub: "Изучай уроки с помощью AI" },
  { emoji: "3️⃣", title: "Practice with games and quizzes", sub: "Практикуйся с играми и тестами" },
];

const TESTIMONIALS = [
  {
    name: "Сабина, Душанбе",
    text: "AI объясняет ошибки так просто, что я наконец поняла разницу между Present Simple и Continuous!",
  },
  {
    name: "Фаррух, Худжанд",
    text: "Бо ёрии AI-репетитор ман дар як моҳ хеле пешрафт кардам. Бениҳоят осон ва фаҳмо!",
  },
  {
    name: "Нилуфар, Бухара",
    text: "Игра «Word Match» и ежедневный вызов делают учёбу похожей на игру, а не на домашку.",
  },
];

const TAGLINES = [
  "Learn English with AI",
  "Учи английский с помощью ИИ",
  "Бо ёрии AI забони англисӣ омӯз",
];

function useTypewriterCycle(words, { typeSpeed = 60, deleteSpeed = 30, pause = 1800 } = {}) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState("typing");

  useEffect(() => {
    const current = words[wordIndex];
    let timeout;

    if (phase === "typing") {
      if (text.length < current.length) {
        timeout = setTimeout(() => setText(current.slice(0, text.length + 1)), typeSpeed);
      } else {
        timeout = setTimeout(() => setPhase("deleting"), pause);
      }
    } else {
      if (text.length > 0) {
        timeout = setTimeout(() => setText(text.slice(0, -1)), deleteSpeed);
      } else {
        setWordIndex((i) => (i + 1) % words.length);
        setPhase("typing");
      }
    }

    return () => clearTimeout(timeout);
  }, [text, phase, wordIndex, words, typeSpeed, deleteSpeed, pause]);

  return text;
}

function DemoMockup() {
  return (
    <div className="bg-white rounded-2xl shadow-soft overflow-hidden max-w-md mx-auto">
      <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-50 border-b border-slate-100">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <span className="ml-3 text-xs text-slate-400 font-medium">ZaboniAI — AI Tutor demo</span>
      </div>
      <div className="p-5 space-y-3 text-left">
        <div className="flex justify-end">
          <div className="bg-blue-600 text-white text-sm rounded-2xl rounded-tr-sm px-3.5 py-2 max-w-[75%] animate-fade-in">
            How do I use "used to"?
          </div>
        </div>
        <div className="flex justify-start">
          <div
            className="bg-blue-50 border border-blue-200 text-slate-700 text-sm rounded-2xl rounded-tl-sm px-3.5 py-2 max-w-[80%] animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            "Used to" talks about past habits that are finished. <br />
            Example: <strong>I used to play football.</strong> ⚽
          </div>
        </div>
        <div className="flex justify-end">
          <div
            className="bg-blue-600 text-white text-sm rounded-2xl rounded-tr-sm px-3.5 py-2 max-w-[75%] animate-fade-in"
            style={{ animationDelay: "0.8s" }}
          >
            Спасибо! Теперь понятно 🙌
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const tagline = useTypewriterCycle(TAGLINES);
  const learners = useCountUp(500, 1400);
  const lessons = useCountUp(30, 1400);
  const aiFeatures = useCountUp(4, 1400);

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between max-w-6xl mx-auto px-4 sm:px-6 py-5">
        <span className="font-extrabold text-xl text-navy flex items-center gap-2">
          <Logo size="small" /> ZaboniAI <span>🇹🇯</span>
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
          <div className="flex justify-center mb-6">
            <Logo size="large" className="animate-float" />
          </div>
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

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-6 min-h-[1.3em]">
            {tagline}
            <span className="inline-block w-[3px] h-[1em] bg-gold ml-1 align-middle animate-typing" />
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              to="/register"
              className="relative px-8 py-3.5 rounded-xl font-semibold text-navy-dark bg-gradient-to-r from-gold-light to-gold shadow-lg shadow-gold/30 hover:shadow-gold/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <span className="absolute inset-0 rounded-xl bg-gold animate-ping opacity-20" />
              <span className="relative">Start Learning / Начать учиться →</span>
            </Link>
            <Link
              to="/login"
              className="text-white/80 hover:text-white text-sm font-medium underline-offset-4 hover:underline transition-colors"
            >
              Already have an account? Login / Войти
            </Link>
          </div>

          <DemoMockup />

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-white/70 text-sm">
            <span>
              🎉 <strong className="text-white">{learners}+</strong> learners
            </span>
            <span>
              📚 <strong className="text-white">{lessons}+</strong> lessons
            </span>
            <span>
              ✨ <strong className="text-white">{aiFeatures}</strong> AI features
            </span>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-center text-2xl font-extrabold text-navy mb-1">How it works</h2>
        <p className="text-center text-slate-400 mb-10">Как это работает</p>
        <div className="grid sm:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div key={s.title} className="text-center">
              <div className="text-3xl mb-3">{s.emoji}</div>
              <h3 className="font-bold text-navy mb-0.5">{s.title}</h3>
              <p className="text-sm text-slate-500">{s.sub}</p>
            </div>
          ))}
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

      <section className="bg-slate-50 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-center text-2xl font-extrabold text-navy mb-1">What learners say</h2>
          <p className="text-center text-slate-400 mb-10">Отзывы учеников</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl shadow-card p-6">
                <p className="text-2xl mb-2">⭐⭐⭐⭐⭐</p>
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">"{t.text}"</p>
                <p className="text-xs font-semibold text-navy">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
