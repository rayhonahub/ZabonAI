import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Flame, BookOpen, BarChart2 } from "lucide-react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { useCountUp } from "../hooks/useCountUp";
import { usePageTitle } from "../hooks/usePageTitle";

function levelFromXp(xp) {
  if (xp >= 300) return { label: "Intermediate", sub: "Продвинутый", color: "bg-primary/15 text-primary-light border-primary/20" };
  if (xp >= 100) return { label: "Elementary", sub: "Средний", color: "bg-blue-500/15 text-blue-300 border-blue-400/20" };
  return { label: "Beginner", sub: "Начинающий", color: "bg-emerald-500/15 text-emerald-400 border-emerald-400/20" };
}

function ProgressRing({ percent }) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimatedPercent(percent), 100);
    return () => clearTimeout(t);
  }, [percent]);

  const size = 120;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercent / 100) * circumference;

  return (
    <div className="relative w-[120px] h-[120px] flex-shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#6D4FF0"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-extrabold text-white font-sora">{Math.round(animatedPercent)}%</span>
      </div>
    </div>
  );
}

function StatCard({ Icon, iconColor, label, sub, value }) {
  return (
    <div className="glass-card p-6 flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className={iconColor} />
        <p className="text-xs font-bold uppercase text-white/40">{sub}</p>
      </div>
      <p className="text-sm text-white/50">{label}</p>
      <p className="text-3xl font-extrabold text-white font-sora mt-1">{value}</p>
    </div>
  );
}

function StreakCalendar({ streak }) {
  const days = [];
  const today = new Date();
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const isActive = i < Math.min(streak, 7);
    days.push({ date: d, isActive, label: dayLabels[(d.getDay() + 6) % 7] });
  }
  return (
    <div className="flex justify-between gap-2">
      {days.map((d, idx) => (
        <div key={idx} className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-semibold text-white/30">{d.label}</span>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${
              d.isActive ? "bg-emerald-500 text-white shadow-sm" : "bg-white/10 text-white/20"
            }`}
          >
            {d.isActive ? "🔥" : ""}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScoreBars({ entries }) {
  if (entries.length === 0) {
    return <p className="text-sm text-white/40">No quiz scores yet / Пока нет результатов тестов</p>;
  }
  return (
    <div className="flex items-end gap-2 h-32">
      {entries.map((e, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
          <span className="text-[10px] font-semibold text-white/40">{Math.round(e.score)}%</span>
          <div
            className={`w-full rounded-t-md transition-all duration-700 ease-out ${
              e.score >= 60 ? "bg-emerald-400" : "bg-rose-400"
            }`}
            style={{ height: `${Math.max(4, e.score)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export default function ProgressPage() {
  usePageTitle("Progress");
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [lessonsProgress, setLessonsProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [advice, setAdvice] = useState(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/progress/summary"), api.get("/progress/lessons")])
      .then(([summaryRes, lessonsRes]) => {
        setSummary(summaryRes.data);
        setLessonsProgress(lessonsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function getAdvice() {
    setAdviceLoading(true);
    setAdvice(null);
    try {
      const res = await api.get("/ai/weak-topics-advice");
      setAdvice(res.data.advice);
    } catch {
      setAdvice("Could not load advice right now / Не удалось загрузить совет");
    } finally {
      setAdviceLoading(false);
    }
  }

  const quizzesPassed = lessonsProgress.filter((p) => (p.score ?? 0) >= 60).length;
  const xp = (summary?.completed_lessons ?? 0) * 10 + quizzesPassed * 20;
  const animatedXp = useCountUp(xp);
  const animatedCompleted = useCountUp(summary?.completed_lessons ?? 0);
  const level = levelFromXp(xp);

  const completionPercent = summary?.total_lessons
    ? (summary.completed_lessons / summary.total_lessons) * 100
    : 0;

  const scoreEntries = useMemo(
    () => lessonsProgress.filter((p) => p.score !== null && p.score !== undefined).slice(-10),
    [lessonsProgress]
  );

  return (
    <div className="min-h-screen bg-ink page-enter">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white font-sora mb-1">Your Progress</h1>
            <p className="text-white/50">Твой прогресс</p>
          </div>
          <span className={`text-sm font-bold px-4 py-2 rounded-full border ${level.color}`}>
            {level.label} <span className="opacity-70">/ {level.sub}</span>
          </span>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white/10 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-[auto_1fr_1fr_1fr] gap-5 mb-8 animate-fade-in items-stretch">
              <div className="glass-card p-6 flex items-center gap-4">
                <ProgressRing percent={completionPercent} />
                <div>
                  <p className="text-xs font-bold uppercase text-white/40">Completion</p>
                  <p className="text-sm text-white/50">Завершено</p>
                  <p className="text-sm text-white font-semibold mt-1">
                    {animatedCompleted}/{summary?.total_lessons ?? 0} lessons
                  </p>
                </div>
              </div>
              <StatCard Icon={Star} iconColor="text-gold" label="XP points" sub="Очки опыта" value={`${animatedXp}`} />
              <StatCard Icon={BarChart2} iconColor="text-emerald-400" label="Average score" sub="Средний балл" value={`${summary?.average_score ?? 0}%`} />
              <StatCard Icon={Flame} iconColor="text-accent" label="Current streak" sub="Текущая серия" value={`${summary?.streak ?? 0}`} />
            </div>

            <div className="grid sm:grid-cols-2 gap-5 mb-8">
              <div className="glass-card p-6">
                <h2 className="text-sm font-bold text-white mb-1">Last 7 days</h2>
                <p className="text-xs text-white/40 mb-4">Последние 7 дней</p>
                <StreakCalendar streak={summary?.streak ?? 0} />
              </div>

              <div className="glass-card p-6">
                <h2 className="text-sm font-bold text-white mb-1">Quiz scores</h2>
                <p className="text-xs text-white/40 mb-4">Результаты тестов</p>
                <ScoreBars entries={scoreEntries} />
              </div>
            </div>
          </>
        )}

        <div className="glass-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-white font-sora">Weak topics</h2>
              <p className="text-sm text-white/40">Слабые темы</p>
            </div>
            <button
              onClick={getAdvice}
              disabled={adviceLoading}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-primary hover:bg-primary-dark shadow-lg shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60"
            >
              {adviceLoading ? "Thinking..." : "Get AI Advice / Совет от AI"}
            </button>
          </div>

          {!loading && (!summary?.weak_topic_lessons || summary.weak_topic_lessons.length === 0) && (
            <p className="text-sm text-emerald-400 bg-emerald-500/10 rounded-lg px-4 py-3 border border-emerald-500/20">
              No weak topics — great job! 🎉 / Слабых тем нет — отличная работа!
            </p>
          )}

          {summary?.weak_topic_lessons?.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-3 mb-2">
              {summary.weak_topic_lessons.map((wt) => (
                <div
                  key={wt.lesson_id}
                  className="flex items-center justify-between gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3"
                >
                  <span className="text-sm font-medium text-rose-300">{wt.title}</span>
                  <button
                    onClick={() => navigate(`/quiz/${wt.lesson_id}`)}
                    className="text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-full transition-colors duration-150 flex-shrink-0"
                  >
                    Practice →
                  </button>
                </div>
              ))}
            </div>
          )}

          {advice && (
            <div className="mt-5 bg-primary/5 border border-primary/10 rounded-xl p-5 text-sm text-white/70 whitespace-pre-wrap leading-relaxed animate-slide-up">
              {advice}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
