import { Link } from "react-router-dom";
import { BookOpen, Layers, Sparkles, Brain, Camera, Flame, Gem } from "lucide-react";
import { useCountUp } from "../hooks/useCountUp";
import { usePageTitle } from "../hooks/usePageTitle";
import NeuralBackground from "../components/NeuralBackground";

const FEATURES = [
  {
    Icon: Sparkles,
    color: "#14B8A6",
    title: "AI Tutor",
    sub: "AI Омӯзгор",
    desc: "Ба забони тоҷикӣ мефаҳмонад",
  },
  {
    Icon: Brain,
    color: "#FBBF24",
    title: "Smart Quiz",
    sub: "Санҷиши оқилона",
    desc: "Санҷиш баъди ҳар дарс — оқилона омӯз",
  },
  {
    Icon: Camera,
    color: "#14B8A6",
    title: "Screenshot Help",
    sub: "Ёрӣ бо скриншот",
    desc: "Скриншотро бор кун — AI ҳамаашро мефаҳмонад",
  },
];

const TESTIMONIALS = [
  {
    name: "Сабина, Душанбе",
    text: "AI хатоҳоямро хеле содда мефаҳмонад, ки ман фарқи Present Simple ва Continuous-ро фаҳмидам!",
  },
  {
    name: "Фаррух, Худҷанд",
    text: "Бо ёрии AI-омӯзгор ман дар як моҳ хеле пешрафт кардам. Бениҳоят осон ва фаҳмо!",
  },
  {
    name: "Нилуфар, Бухоро",
    text: "Word Match ва масъалаи ҳаррӯза таълимро ба бозӣ монанд мекунанд, на ба вазифаи хонагӣ.",
  },
];

export default function LandingPage() {
  usePageTitle("ZaboniAI — Learn English with AI");
  const learners = useCountUp(500, 1400);
  const lessons = useCountUp(28, 1400);

  return (
    <div className="min-h-screen page-enter" style={{ background: '#061A1C' }}>

      {/* Landing nav */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2.5rem',
        height: 60,
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(9,20,24,0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(45,212,191,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #0D9488, #22D3EE)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Z</span>
          </div>
          <span style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>ZaboniAI</span>
        </div>
        <div className="hidden sm:flex" style={{ gap: 28 }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer' }}>Курсҳо</span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer' }}>Бозӣ</span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer' }}>Мағоза</span>
        </div>
        <Link to="/login">
          <button style={{
            background: '#14B8A6',
            color: '#04231F',
            border: 'none',
            borderRadius: 6,
            padding: '8px 20px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}>Дохил шудан</button>
        </Link>
      </nav>

      {/* Hero section */}
      <section style={{
        position: 'relative',
        minHeight: 560,
        background: 'linear-gradient(160deg, #061A1C 0%, #0A2A2E 45%, #0E3A3F 100%)',
        overflow: 'hidden',
        padding: '4rem 2.5rem',
      }}>
        <NeuralBackground />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
          <div className="fade-up-1" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(45,212,191,0.08)',
            border: '1px solid rgba(45,212,191,0.25)',
            borderRadius: 6,
            padding: '6px 14px',
            marginBottom: 26,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2DD4BF', display: 'inline-block' }}></span>
            <span style={{ color: '#5EEAD4', fontSize: 12, fontWeight: 500, letterSpacing: '0.03em' }}>AI-PLATFORMAI OMUZISHI ZABON</span>
          </div>

          <h1 className="fade-up-2" style={{
            color: 'white',
            fontSize: 44,
            fontWeight: 500,
            lineHeight: 1.22,
            letterSpacing: '-0.015em',
            margin: '0 0 20px',
          }}>
            Забони англисиро бо{' '}
            <span style={{ fontWeight: 600, color: '#2DD4BF' }}>зеҳни сунъӣ</span>{' '}
            омӯз
          </h1>
          <p className="fade-up-2" style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: 16,
            lineHeight: 1.65,
            margin: '0 0 36px',
            maxWidth: 400,
          }}>
            Дарси шахсишуда, тести оқилона ва ёрдамчии AI, ки ҳамеша дар канори туст
          </p>

          <div className="fade-up-3" style={{ display: 'flex', gap: 14, marginBottom: '3rem', flexWrap: 'wrap' }}>
            <Link to="/register">
              <button style={{
                background: '#14B8A6',
                color: '#04231F',
                border: 'none',
                borderRadius: 6,
                padding: '13px 28px',
                fontSize: 14,
                fontWeight: 600,
                boxShadow: '0 8px 24px rgba(20,184,166,0.3)',
                cursor: 'pointer',
              }}>Оғоз кардан</button>
            </Link>
            <Link to="/login">
              <button style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 6,
                padding: '13px 28px',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}>Бештар бидон</button>
            </Link>
          </div>

          <div className="fade-up-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 460 }}>
            <div className="glass-card" style={{ padding: 16 }}>
              <BookOpen size={18} color="#2DD4BF" style={{ marginBottom: 10, display: 'block' }} />
              <p style={{ color: 'white', fontSize: 20, fontWeight: 500, margin: '0 0 1px' }}>28+</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>Дарсҳо</p>
            </div>
            <div className="glass-card" style={{ padding: 16 }}>
              <Layers size={18} color="#FBBF24" style={{ marginBottom: 10, display: 'block' }} />
              <p style={{ color: 'white', fontSize: 20, fontWeight: 500, margin: '0 0 1px' }}>3</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>Сатҳ</p>
            </div>
            <div className="glass-card" style={{ padding: 16 }}>
              <Sparkles size={18} color="#2DD4BF" style={{ marginBottom: 10, display: 'block' }} />
              <p style={{ color: 'white', fontSize: 20, fontWeight: 500, margin: '0 0 1px' }}>AI</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>Ёрдамчӣ</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="border-y py-7" style={{ borderColor: 'rgba(45,212,191,0.15)', background: 'rgba(10,42,46,0.8)' }}>
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-10 text-center">
          <div>
            <p className="text-2xl font-bold" style={{ color: 'white' }}>{learners}+</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Омӯзандагон / Learners</p>
          </div>
          <div className="w-px h-8 hidden sm:block" style={{ background: 'rgba(45,212,191,0.2)' }} />
          <div>
            <p className="text-2xl font-bold" style={{ color: 'white' }}>{lessons}+</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Дарсҳо / Lessons</p>
          </div>
          <div className="w-px h-8 hidden sm:block" style={{ background: 'rgba(45,212,191,0.2)' }} />
          <div>
            <p className="text-2xl font-bold" style={{ color: 'white' }}>4</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>AI хусусиятҳо / AI features</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-20">
        <h2 className="text-2xl font-bold mb-1 text-center" style={{ color: 'white' }}>Чаро ZaboniAI?</h2>
        <p className="text-sm text-center mb-12" style={{ color: 'rgba(255,255,255,0.4)' }}>Why choose us</p>
        <div className="grid sm:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass-card" style={{ padding: 24 }}>
              <f.Icon size={24} style={{ color: f.color, marginBottom: 12, display: 'block' }} />
              <h3 className="font-semibold mb-0.5" style={{ color: 'white', fontWeight: 600 }}>{f.title}</h3>
              <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>{f.sub}</p>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="max-w-5xl mx-auto px-6 sm:px-10 pb-24">
        <h2 className="text-2xl font-bold mb-1 text-center" style={{ color: 'white' }}>Фикри омӯзандагон</h2>
        <p className="text-sm text-center mb-12" style={{ color: 'rgba(255,255,255,0.4)' }}>What learners say</p>
        <div className="grid sm:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="glass-card" style={{ padding: 24 }}>
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-sm" style={{ color: '#2DD4BF' }}>★</span>
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>"{t.text}"</p>
              <p className="text-xs font-semibold" style={{ color: '#2DD4BF' }}>{t.name}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link to="/register">
            <button style={{
              borderRadius: 6,
              padding: '14px 40px',
              fontWeight: 600,
              fontSize: 15,
              color: '#04231F',
              background: '#14B8A6',
              border: 'none',
              boxShadow: '0 8px 24px rgba(20,184,166,0.3)',
              cursor: 'pointer',
            }}>
              Оғоз кардан — бепул / Start Free →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
