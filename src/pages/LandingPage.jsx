import { Link } from "react-router-dom";
import { BookOpen, Layers, Sparkles, Brain, Camera } from "lucide-react";
import { useCountUp } from "../hooks/useCountUp";
import { usePageTitle } from "../hooks/usePageTitle";

const FEATURES = [
  {
    Icon: Sparkles,
    color: "text-primary-light",
    title: "AI Tutor",
    sub: "AI Репетитор",
    desc: "Объясняет на русском и таджикском языках",
  },
  {
    Icon: Brain,
    color: "text-accent",
    title: "Smart Quiz",
    sub: "Умный тест",
    desc: "Тест после каждого урока — учись умнее",
  },
  {
    Icon: Camera,
    color: "text-primary-light",
    title: "Screenshot Help",
    sub: "Помощь по скриншоту",
    desc: "Загрузи скриншот — AI объяснит всё",
  },
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
    text: "Word Match и ежедневный вызов делают учёбу похожей на игру, а не на домашку.",
  },
];

export default function LandingPage() {
  usePageTitle("ZaboniAI — Learn English with AI");
  const learners = useCountUp(500, 1400);
  const lessons = useCountUp(28, 1400);

  return (
    <div className="bg-ink min-h-screen page-enter">

      {/* Nav */}
      <nav className="glass-nav sticky top-0 z-40 flex items-center justify-between px-6 sm:px-10 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <span className="font-sora font-extrabold text-primary text-sm">Z</span>
          </div>
          <span className="text-white font-sora font-semibold text-sm">ZaboniAI</span>
        </div>
        <div className="hidden sm:flex gap-7 text-white/60 text-sm">
          <span>Курсҳо</span>
          <span>Бозӣ</span>
          <span>Мағоза</span>
        </div>
        <Link to="/login">
          <button className="bg-primary text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-primary-dark transition-colors duration-200 shadow-lg shadow-primary/30">
            Дохил шудан
          </button>
        </Link>
      </nav>

      {/* Hero */}
      <div className="bg-hero min-h-[480px] sm:min-h-[560px] px-6 sm:px-10 py-16 sm:py-24">
        <p className="text-primary-light text-xs tracking-widest uppercase mb-3 font-semibold">
          AI-platformai omuzishi zabon
        </p>
        <h1 className="text-white text-4xl sm:text-5xl font-extrabold leading-tight mb-4 max-w-md font-sora">
          Забони англисиро бо зеҳни сунъӣ омӯз
        </h1>
        <p className="text-white/65 text-base leading-relaxed mb-8 max-w-sm">
          Дарси шахсишуда, тести оқилона ва ёрдамчии AI, ки ҳамеша дар канори туст
        </p>

        <div className="flex flex-wrap gap-3 mb-12">
          <Link to="/register">
            <button className="bg-primary text-white rounded-xl px-7 py-3.5 font-semibold hover:bg-primary-dark transition-all duration-200 shadow-lg shadow-primary/30 hover:-translate-y-0.5">
              Оғоз кардан
            </button>
          </Link>
          <Link to="/login">
            <button className="glass-card text-white rounded-xl px-7 py-3.5 font-semibold">
              Бештар бидон
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-3.5 max-w-md">
          <div className="glass-card p-4">
            <BookOpen size={20} className="text-primary-light mb-2" />
            <p className="text-white text-xl font-bold font-sora">{lessons}+</p>
            <p className="text-white/50 text-xs">Дарсҳо</p>
          </div>
          <div className="glass-card p-4">
            <Layers size={20} className="text-accent mb-2" />
            <p className="text-white text-xl font-bold font-sora">3</p>
            <p className="text-white/50 text-xs">Сатҳ</p>
          </div>
          <div className="glass-card p-4">
            <Sparkles size={20} className="text-primary-light mb-2" />
            <p className="text-white text-xl font-bold font-sora">AI</p>
            <p className="text-white/50 text-xs">Ёрдамчӣ</p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-y border-white/8 py-7 bg-white/3">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-10 text-center">
          <div>
            <p className="text-2xl font-bold text-white font-sora">{learners}+</p>
            <p className="text-white/45 text-xs mt-0.5">Омӯзандагон / Learners</p>
          </div>
          <div className="w-px h-8 bg-white/15 hidden sm:block" />
          <div>
            <p className="text-2xl font-bold text-white font-sora">{lessons}+</p>
            <p className="text-white/45 text-xs mt-0.5">Дарсҳо / Lessons</p>
          </div>
          <div className="w-px h-8 bg-white/15 hidden sm:block" />
          <div>
            <p className="text-2xl font-bold text-white font-sora">4</p>
            <p className="text-white/45 text-xs mt-0.5">AI хусусиятҳо / AI features</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-20">
        <h2 className="text-white text-2xl font-extrabold font-sora mb-1 text-center">Чаро ZaboniAI?</h2>
        <p className="text-white/50 text-sm text-center mb-12">Why choose us</p>
        <div className="grid sm:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass-card p-6">
              <f.Icon size={24} className={`${f.color} mb-3`} />
              <h3 className="text-white font-bold font-sora mb-0.5">{f.title}</h3>
              <p className="text-white/40 text-xs mb-3">{f.sub}</p>
              <p className="text-white/70 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="max-w-5xl mx-auto px-6 sm:px-10 pb-24">
        <h2 className="text-white text-2xl font-extrabold font-sora mb-1 text-center">Отзывы учеников</h2>
        <p className="text-white/50 text-sm text-center mb-12">What learners say</p>
        <div className="grid sm:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="glass-card p-6">
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-primary-light text-sm">★</span>
                ))}
              </div>
              <p className="text-white/70 text-sm leading-relaxed mb-4">"{t.text}"</p>
              <p className="text-primary-light text-xs font-semibold">{t.name}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link to="/register">
            <button className="bg-primary text-white rounded-xl px-10 py-4 font-semibold text-base hover:bg-primary-dark transition-all duration-200 shadow-glow hover:-translate-y-0.5">
              Оғоз кардан — бепул / Start Free →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
