import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";

function StatCard({ label, sub, value, accent }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-6 flex flex-col gap-1">
      <p className="text-xs font-bold uppercase text-slate-400">{sub}</p>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`text-3xl font-extrabold mt-2 ${accent}`}>{value}</p>
    </div>
  );
}

export default function ProgressPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [advice, setAdvice] = useState(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  useEffect(() => {
    api
      .get("/progress/summary")
      .then((res) => setSummary(res.data))
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

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-extrabold text-navy mb-1">Your Progress</h1>
        <p className="text-slate-500 mb-8">Твой прогресс</p>

        {loading ? (
          <div className="grid sm:grid-cols-3 gap-5 mb-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-white rounded-2xl shadow-card animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-5 mb-10 animate-fade-in">
            <StatCard
              label="Lessons completed"
              sub="Уроки завершены"
              value={summary?.completed_lessons ?? 0}
              accent="text-navy"
            />
            <StatCard
              label="Average score"
              sub="Средний балл"
              value={`${summary?.average_score ?? 0}%`}
              accent="text-emerald-600"
            />
            <StatCard
              label="Current streak"
              sub="Текущая серия"
              value={`🔥 ${summary?.streak ?? 0}`}
              accent="text-gold-dark"
            />
          </div>
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

          {!loading && (!summary?.weak_topics || summary.weak_topics.length === 0) && (
            <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-4 py-3">
              No weak topics — great job! 🎉 / Слабых тем нет — отличная работа!
            </p>
          )}

          {summary?.weak_topics?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {summary.weak_topics.map((topic, i) => (
                <span
                  key={i}
                  className="bg-rose-100 text-rose-700 text-sm font-medium px-3 py-1.5 rounded-full"
                >
                  {topic}
                </span>
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
