import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";

const LEVELS = [
  {
    key: "zero",
    emoji: "🌱",
    title: "Zero",
    sub: "Аз сифр",
    desc: "Ман забони англисиро тамоман намедонам",
  },
  {
    key: "beginner",
    emoji: "📖",
    title: "Beginner",
    sub: "Ибтидоӣ",
    desc: "Якчанд калима медонам",
  },
  {
    key: "elementary",
    emoji: "📚",
    title: "Elementary",
    sub: "Миёна",
    desc: "Ибораҳои асосиро медонам",
  },
  {
    key: "intermediate",
    emoji: "🚀",
    title: "Intermediate",
    sub: "Пешрафта",
    desc: "Метавонам муошират кунам",
  },
];

const GOALS = [
  {
    key: "work",
    emoji: "💼",
    title: "For work",
    sub: "Барои кор",
  },
  {
    key: "travel",
    emoji: "✈️",
    title: "For travel",
    sub: "Барои сафар",
  },
  {
    key: "study",
    emoji: "📝",
    title: "For study",
    sub: "Барои таҳсил",
  },
  {
    key: "self_development",
    emoji: "🌟",
    title: "Self-development",
    sub: "Худтакмилдиҳӣ",
  },
];

export default function OnboardingPage() {
  usePageTitle("Onboarding");
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
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ background: 'linear-gradient(160deg, #061A1C 0%, #0A2A2E 45%, #0E3A3F 100%)' }}
    >
      <div className="w-full max-w-3xl text-center animate-slide-up">
        <div className="flex justify-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className="h-1.5 rounded-full transition-all duration-200"
              style={s === step ? { width: 32, background: '#14B8A6' } : { width: 16, background: 'rgba(255,255,255,0.2)' }}
            />
          ))}
        </div>

        {step === 1 && (
          <>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2" style={{ color: 'white' }}>
              What is your English level?
            </h1>
            <p className="mb-12" style={{ color: 'rgba(255,255,255,0.6)' }}>Сатҳи забони англисии ту чӣ гуна аст?</p>

            <div className="grid sm:grid-cols-2 gap-5">
              {LEVELS.map((l) => (
                <button
                  key={l.key}
                  onClick={() => chooseLevel(l)}
                  className="glass-card rounded-2xl p-6 text-left transition-all duration-200 border-2 hover:-translate-y-1"
                  style={{ borderColor: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(45,212,191,0.4)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
                >
                  <div className="text-4xl mb-3">{l.emoji}</div>
                  <h3 className="font-bold text-lg" style={{ color: 'white' }}>
                    {l.title} <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>/ {l.sub}</span>
                  </h3>
                  <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{l.desc}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2" style={{ color: 'white' }}>
              What is your goal?
            </h1>
            <p className="mb-12" style={{ color: 'rgba(255,255,255,0.6)' }}>Ҳадафи ту чист?</p>

            <div className="grid sm:grid-cols-2 gap-5">
              {GOALS.map((g) => (
                <button
                  key={g.key}
                  onClick={() => chooseGoal(g)}
                  className="glass-card rounded-2xl p-6 text-left transition-all duration-200 border-2 hover:-translate-y-1"
                  style={{ borderColor: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(45,212,191,0.4)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; }}
                >
                  <div className="text-4xl mb-3">{g.emoji}</div>
                  <h3 className="font-bold text-lg" style={{ color: 'white' }}>
                    {g.title} <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>/ {g.sub}</span>
                  </h3>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <div className="glass-card rounded-2xl p-10 max-w-md mx-auto animate-pop">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'white' }}>
              Your personal learning path is ready!
            </h1>
            <p className="mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>Роҳи омӯзиши шахсии ту тайёр аст!</p>

            <div className="space-y-3 mb-8 text-left">
              <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Сатҳ</span>
                <span className="font-semibold" style={{ color: 'white' }}>
                  {level?.emoji} {level?.title} / {level?.sub}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Ҳадаф</span>
                <span className="font-semibold" style={{ color: 'white' }}>
                  {goal?.emoji} {goal?.title} / {goal?.sub}
                </span>
              </div>
            </div>

            <button
              onClick={finish}
              className="w-full py-3 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              style={{ background: '#14B8A6', color: '#04231F', boxShadow: '0 8px 24px rgba(20,184,166,0.3)' }}
            >
              Оғоз кардан
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
