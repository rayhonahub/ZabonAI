import { Link } from "react-router-dom";
import { BookOpen, Layers, Sparkles, Brain, Camera, Flame, Gem } from "lucide-react";
import { useCountUp } from "../hooks/useCountUp";
import { usePageTitle } from "../hooks/usePageTitle";

const FEATURES = [
  {
    Icon: Sparkles,
    color: "#6D4FF0",
    title: "AI Tutor",
    sub: "AI Репетитор",
    desc: "Объясняет на русском и таджикском языках",
  },
  {
    Icon: Brain,
    color: "#FF5C8A",
    title: "Smart Quiz",
    sub: "Умный тест",
    desc: "Тест после каждого урока — учись умнее",
  },
  {
    Icon: Camera,
    color: "#6D4FF0",
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
    <div className="min-h-screen page-enter" style={{ background: '#F4F1FF' }}>

      {/* Hero section */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #F4F1FF 0%, #FFFFFF 55%, #FFF5F8 100%)' }}>

        {/* Nav */}
        <nav className="flex items-center justify-between px-7 py-4 sticky top-0 z-40" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(109,79,240,0.1)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6D4FF0,#9B82FF)' }}>
              <span className="font-sora font-extrabold text-white text-sm">Z</span>
            </div>
            <span className="font-sora font-bold text-sm" style={{ color: '#1A1532' }}>ZaboniAI</span>
          </div>
          <div className="hidden sm:flex gap-7 text-sm font-medium" style={{ color: '#534A7A' }}>
            <span>Курсҳо</span>
            <span>Бозӣ</span>
            <span>Мағоза</span>
          </div>
          <Link to="/login">
            <button className="rounded-lg px-5 py-2 text-sm font-semibold text-white" style={{ background: '#6D4FF0' }}>Дохил шудан</button>
          </Link>
        </nav>

        {/* Two-column hero */}
        <div className="grid md:grid-cols-2 gap-8 items-center px-7 sm:px-10 py-16 fade-in-up">
          {/* Left: text */}
          <div>
            <p className="text-xs tracking-widest uppercase mb-3 font-bold" style={{ color: '#6D4FF0' }}>AI-platformai omuzishi zabon</p>
            <h1 className="font-sora font-extrabold text-5xl leading-tight mb-4" style={{ color: '#1A1532' }}>
              Забони англисиро бо зеҳни сунъӣ омӯз
            </h1>
            <p className="text-base leading-relaxed mb-8 max-w-md" style={{ color: '#6B6488' }}>
              Дарси шахсишуда, тести оқилона ва ёрдамчии AI, ки ҳамеша дар канори туст
            </p>
            <div className="flex flex-wrap gap-3 mb-12">
              <Link to="/register">
                <button className="rounded-xl px-7 py-3.5 font-semibold text-white" style={{ background: 'linear-gradient(135deg, #6D4FF0, #9B7AFF)', boxShadow: '0 8px 20px rgba(109,79,240,0.25)' }}>
                  Оғоз кардан
                </button>
              </Link>
              <Link to="/login">
                <button className="rounded-xl px-7 py-3.5 font-semibold" style={{ background: 'white', color: '#1A1532', border: '1px solid rgba(109,79,240,0.2)' }}>
                  Бештар бидон
                </button>
              </Link>
            </div>

            {/* Mini stat cards */}
            <div className="grid grid-cols-3 gap-3.5 max-w-md">
              <div className="glass-card-light p-4">
                <BookOpen size={20} style={{ color: '#6D4FF0', marginBottom: 8 }} />
                <p className="font-sora font-bold text-xl" style={{ color: '#1A1532' }}>{lessons}+</p>
                <p className="text-xs" style={{ color: '#8A82AD' }}>Дарсҳо</p>
              </div>
              <div className="glass-card-light p-4">
                <Layers size={20} style={{ color: '#FF5C8A', marginBottom: 8 }} />
                <p className="font-sora font-bold text-xl" style={{ color: '#1A1532' }}>3</p>
                <p className="text-xs" style={{ color: '#8A82AD' }}>Сатҳ</p>
              </div>
              <div className="glass-card-light p-4">
                <Sparkles size={20} style={{ color: '#6D4FF0', marginBottom: 8 }} />
                <p className="font-sora font-bold text-xl" style={{ color: '#1A1532' }}>AI</p>
                <p className="text-xs" style={{ color: '#8A82AD' }}>Ёрдамчӣ</p>
              </div>
            </div>
          </div>

          {/* Right: video + decorative elements */}
          <div className="relative flex justify-center">
            {/* Floating brain icon */}
            <div className="float-1" style={{ position: 'absolute', top: -20, right: 20, width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, rgba(109,79,240,0.12), rgba(255,92,138,0.12))', border: '1px solid rgba(109,79,240,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
              <Brain size={24} style={{ color: '#6D4FF0' }} />
            </div>
            {/* Floating gem badge */}
            <div className="float-2" style={{ position: 'absolute', top: 40, left: 10, width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, rgba(255,92,138,0.15), rgba(109,79,240,0.1))', border: '1px solid rgba(255,92,138,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
              <Gem size={20} style={{ color: '#FF5C8A' }} />
            </div>
            {/* Pulse dot */}
            <div style={{ position: 'absolute', bottom: 40, left: 0, width: 14, height: 14, zIndex: 2 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#FF5C8A' }} className="pulse-dot" />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#FF5C8A' }} />
            </div>
            {/* Flame badge */}
            <div className="float-1" style={{ position: 'absolute', bottom: 60, right: 0, width: 44, height: 44, borderRadius: 12, background: 'rgba(255,92,138,0.1)', border: '1px solid rgba(255,92,138,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
              <Flame size={20} style={{ color: '#FF5C8A' }} />
            </div>

            {/* Video */}
            <video
              autoPlay
              loop
              muted
              playsInline
              style={{ maxWidth: '320px', width: '100%', borderRadius: 24, boxShadow: '0 20px 60px rgba(109,79,240,0.2)', position: 'relative', zIndex: 1 }}
            >
              <source src="/videos/fon.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="border-y py-7" style={{ borderColor: 'rgba(109,79,240,0.1)', background: 'white' }}>
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-10 text-center">
          <div>
            <p className="text-2xl font-bold font-sora" style={{ color: '#1A1532' }}>{learners}+</p>
            <p className="text-xs mt-0.5" style={{ color: '#8A82AD' }}>Омӯзандагон / Learners</p>
          </div>
          <div className="w-px h-8 hidden sm:block" style={{ background: 'rgba(109,79,240,0.15)' }} />
          <div>
            <p className="text-2xl font-bold font-sora" style={{ color: '#1A1532' }}>{lessons}+</p>
            <p className="text-xs mt-0.5" style={{ color: '#8A82AD' }}>Дарсҳо / Lessons</p>
          </div>
          <div className="w-px h-8 hidden sm:block" style={{ background: 'rgba(109,79,240,0.15)' }} />
          <div>
            <p className="text-2xl font-bold font-sora" style={{ color: '#1A1532' }}>4</p>
            <p className="text-xs mt-0.5" style={{ color: '#8A82AD' }}>AI хусусиятҳо / AI features</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-20">
        <h2 className="text-2xl font-extrabold font-sora mb-1 text-center" style={{ color: '#1A1532' }}>Чаро ZaboniAI?</h2>
        <p className="text-sm text-center mb-12" style={{ color: '#8A82AD' }}>Why choose us</p>
        <div className="grid sm:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass-card-light p-6">
              <f.Icon size={24} style={{ color: f.color, marginBottom: 12 }} />
              <h3 className="font-bold font-sora mb-0.5" style={{ color: '#1A1532' }}>{f.title}</h3>
              <p className="text-xs mb-3" style={{ color: '#8A82AD' }}>{f.sub}</p>
              <p className="text-sm leading-relaxed" style={{ color: '#6B6488' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="max-w-5xl mx-auto px-6 sm:px-10 pb-24">
        <h2 className="text-2xl font-extrabold font-sora mb-1 text-center" style={{ color: '#1A1532' }}>Отзывы учеников</h2>
        <p className="text-sm text-center mb-12" style={{ color: '#8A82AD' }}>What learners say</p>
        <div className="grid sm:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="glass-card-light p-6">
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-sm" style={{ color: '#6D4FF0' }}>★</span>
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: '#6B6488' }}>"{t.text}"</p>
              <p className="text-xs font-semibold" style={{ color: '#6D4FF0' }}>{t.name}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link to="/register">
            <button className="rounded-xl px-10 py-4 font-semibold text-base text-white" style={{ background: 'linear-gradient(135deg, #6D4FF0, #9B7AFF)', boxShadow: '0 8px 24px rgba(109,79,240,0.3)' }}>
              Оғоз кардан — бепул / Start Free →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
