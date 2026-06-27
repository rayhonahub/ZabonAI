import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { useCountUp } from "../hooks/useCountUp";

function levelFromXp(xp) {
  if (xp >= 300) return { label: "Intermediate", sub: "Продвинутый", color: "bg-purple-100 text-purple-700" };
  if (xp >= 100) return { label: "Elementary", sub: "Средний", color: "bg-blue-100 text-blue-700" };
  return { label: "Beginner", sub: "Начинающий", color: "bg-emerald-100 text-emerald-700" };
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
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f0a500"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-extrabold text-navy">{Math.round(animatedPercent)}%</span>
      </div>
    </div>
  );
}

function StatCard({ label, sub, value, accent }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-6 flex flex-col gap-1">
      <p className="text-xs font-bold uppercase text-slate-400">{sub}</p>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`text-3xl font-extrabold mt-2 ${accent}`}>{value}</p>
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
          <span className="text-[10px] font-semibold text-slate-400">{d.label}</span>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${
              d.isActive ? "bg-emerald-500 text-white shadow-sm" : "bg-slate-100 text-slate-300"
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
    return <p className="text-sm text-slate-400">No quiz scores yet / Пока нет результатов тестов</p>;
  }
  return (
    <div className="flex items-end gap-2 h-32">
      {entries.map((e, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
          <span className="text-[10px] font-semibold text-slate-400">{Math.round(e.score)}%</span>
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
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-navy mb-1">Your Progress</h1>
            <p className="text-slate-500">Твой прогресс</p>
          </div>
          <span className={`text-sm font-bold px-4 py-2 rounded-full ${level.color}`}>
            {level.label} <span className="opacity-70">/ {level.sub}</span>
          </span>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white rounded-2xl shadow-card animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-[auto_1fr_1fr_1fr] gap-5 mb-8 animate-fade-in items-stretch">
              <div className="bg-white rounded-2xl shadow-card p-6 flex items-center gap-4">
                <ProgressRing percent={completionPercent} />
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">Completion</p>
                  <p className="text-sm text-slate-500">Завершено</p>
                  <p className="text-sm text-navy font-semibold mt-1">
                    {animatedCompleted}/{summary?.total_lessons ?? 0} lessons
                  </p>
                </div>
              </div>
              <StatCard label="XP points" sub="Очки опыта" value={`⭐ ${animatedXp}`} accent="text-gold-dark" />
              <StatCard
                label="Average score"
                sub="Средний балл"
                value={`${summary?.average_score ?? 0}%`}
                accent="text-emerald-600"
              />
              <StatCard label="Current streak" sub="Текущая серия" value={`🔥 ${summary?.streak ?? 0}`} accent="text-navy" />
            </div>

            <div className="grid sm:grid-cols-2 gap-5 mb-8">
              <div className="bg-white rounded-2xl shadow-card p-6">
                <h2 className="text-sm font-bold text-navy mb-1">Last 7 days</h2>
                <p className="text-xs text-slate-400 mb-4">Последние 7 дней</p>
                <StreakCalendar streak={summary?.streak ?? 0} />
              </div>

              <div className="bg-white rounded-2xl shadow-card p-6">
                <h2 className="text-sm font-bold text-navy mb-1">Quiz scores</h2>
                <p className="text-xs text-slate-400 mb-4">Результаты тестов</p>
                <ScoreBars entries={scoreEntries} />
              </div>
            </div>
          </>
        )}

        <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-navy">Weak topics</h2>
              <p className="text-sm text-slate-400">Слабые темы</p>
            </div>
            <button
              onClick={getAdvice}
              disabled={adviceLoading}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-navy-dark bg-gradient-to-r from-gold-light to-gold shadow-md shadow-gold/20 hover:shadow-gold/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60"
            >
              {adviceLoading ? "Thinking..." : "Get AI Advice / Совет от AI"}
            </button>
          </div>

          {!loading && (!summary?.weak_topic_lessons || summary.weak_topic_lessons.length === 0) && (
            <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-4 py-3">
              No weak topics — great job! 🎉 / Слабых тем нет — отличная работа!
            </p>
          )}

          {summary?.weak_topic_lessons?.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-3 mb-2">
              {summary.weak_topic_lessons.map((wt) => (
                <div
                  key={wt.lesson_id}
                  className="flex items-center justify-between gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3"
                >
                  <span className="text-sm font-medium text-rose-700">{wt.title}</span>
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
            <div className="mt-5 bg-navy/5 border border-navy/10 rounded-xl p-5 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed animate-slide-up">
              {advice}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
