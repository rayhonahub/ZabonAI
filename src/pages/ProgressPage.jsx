import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Flame, BarChart2 } from "lucide-react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { useCountUp } from "../hooks/useCountUp";
import { usePageTitle } from "../hooks/usePageTitle";

const BG = "linear-gradient(160deg, #061A1C 0%, #0A2A2E 45%, #0E3A3F 100%)";

function levelLabel(xp) {
  if (xp >= 300) return "Болотар";
  if (xp >= 100) return "Миёна";
  return "Ибтидоӣ";
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
    <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#14B8A6"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: "white" }}>{Math.round(animatedPercent)}%</span>
      </div>
    </div>
  );
}

function StatCard({ Icon, iconColor, label, value }) {
  return (
    <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Icon size={16} color={iconColor} />
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", margin: 0 }}>
          {label}
        </p>
      </div>
      <p style={{ color: "white", fontSize: 28, fontWeight: 500, margin: 0 }}>{value}</p>
    </div>
  );
}

function StreakCalendar({ streak }) {
  const days = [];
  const today = new Date();
  const dayLabels = ["Дш", "Сш", "Чш", "Пш", "Ҷм", "Шн", "Яш"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const isActive = i < Math.min(streak, 7);
    days.push({ date: d, isActive, isToday: i === 0, label: dayLabels[(d.getDay() + 6) % 7] });
  }
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
      {days.map((d, idx) => {
        let circleStyle;
        if (d.isToday) {
          circleStyle = { background: "transparent", border: "2px solid #2DD4BF", color: d.isActive ? "#2DD4BF" : "rgba(255,255,255,0.3)" };
        } else if (d.isActive) {
          circleStyle = { background: "#14B8A6", color: "#04231F" };
        } else {
          circleStyle = { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" };
        }
        return (
          <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600 }}>{d.label}</span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                transition: "all 0.3s",
                ...circleStyle,
              }}
            >
              {d.isActive && <Flame size={14} color={circleStyle.color} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function scoreColor(score) {
  if (score >= 80) return "#14B8A6";
  if (score >= 60) return "#FBBF24";
  return "#EF4444";
}

function QuizScoreList({ entries }) {
  if (entries.length === 0) {
    return <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Ҳоло тест нагузаштед</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {entries.map((e, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ color: "white", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {e.lesson_title || "Дарс"}
          </span>
          <span style={{ color: scoreColor(e.score), fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
            {Math.round(e.score)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ProgressPage() {
  usePageTitle("Пешрафт");
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
      setAdvice("Ҳоло маслиҳатро гирифта натавонистем");
    } finally {
      setAdviceLoading(false);
    }
  }

  const quizzesPassed = lessonsProgress.filter((p) => (p.score ?? 0) >= 60).length;
  const xp = (summary?.completed_lessons ?? 0) * 10 + quizzesPassed * 20;
  const animatedXp = useCountUp(xp);
  const animatedCompleted = useCountUp(summary?.completed_lessons ?? 0);
  const level = levelLabel(xp);

  const completionPercent = summary?.total_lessons
    ? (summary.completed_lessons / summary.total_lessons) * 100
    : 0;

  const scoreEntries = useMemo(
    () => lessonsProgress.filter((p) => p.score !== null && p.score !== undefined).slice(-10),
    [lessonsProgress]
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "white" }}>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 32 }}>
          <h1 style={{ color: "white", fontSize: 28, fontWeight: 500, margin: 0 }}>Пешрафти ман</h1>
          <span
            style={{
              fontSize: 14,
              padding: "6px 14px",
              borderRadius: 6,
              background: "rgba(45,212,191,0.1)",
              border: "1px solid rgba(45,212,191,0.3)",
              color: "#2DD4BF",
              fontWeight: 600,
            }}
          >
            {level}
          </span>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 40 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card" style={{ height: 128 }} />
            ))}
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 32 }}>
              <div className="glass-card" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: 16 }}>
                <ProgressRing percent={completionPercent} />
                <div>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", margin: 0 }}>
                    АНҶОМШУДА
                  </p>
                  <p style={{ color: "white", fontSize: 16, fontWeight: 600, marginTop: 6 }}>
                    {animatedCompleted}/{summary?.total_lessons ?? 0} дарс
                  </p>
                </div>
              </div>
              <StatCard Icon={Star} iconColor="#FBBF24" label="Холҳои XP" value={`${animatedXp}`} />
              <StatCard Icon={BarChart2} iconColor="#14B8A6" label="Миёнаи натиҷа" value={`${summary?.average_score ?? 0}%`} />
              <StatCard Icon={Flame} iconColor="#FF5C8A" label="Силсилаи имрӯза" value={`${summary?.streak ?? 0}`} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 32 }}>
              <div className="glass-card" style={{ padding: "1.5rem" }}>
                <h2 style={{ color: "white", fontSize: 15, fontWeight: 600, margin: "0 0 16px" }}>7 рӯзи охир</h2>
                <StreakCalendar streak={summary?.streak ?? 0} />
              </div>

              <div className="glass-card" style={{ padding: "1.5rem" }}>
                <h2 style={{ color: "white", fontSize: 15, fontWeight: 600, margin: "0 0 16px" }}>Натиҷаи тестҳо</h2>
                <QuizScoreList entries={scoreEntries} />
              </div>
            </div>
          </>
        )}

        <div className="glass-card" style={{ padding: "1.75rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
            <h2 style={{ color: "white", fontSize: 18, fontWeight: 600, margin: 0 }}>Мавзӯъҳои заиф</h2>
            <button
              onClick={getAdvice}
              disabled={adviceLoading}
              style={{
                padding: "10px 20px",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 14,
                background: "#FBBF24",
                color: "#04231F",
                border: "none",
                cursor: adviceLoading ? "default" : "pointer",
                opacity: adviceLoading ? 0.6 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {adviceLoading ? "Тайёр мешавад..." : "Маслиҳати AI"}
            </button>
          </div>

          {!loading && (!summary?.weak_topic_lessons || summary.weak_topic_lessons.length === 0) && (
            <p
              style={{
                fontSize: 14,
                borderRadius: 6,
                padding: "12px 16px",
                background: "rgba(20,184,166,0.08)",
                border: "1px solid rgba(20,184,166,0.3)",
                color: "#2DD4BF",
                margin: 0,
              }}
            >
              Аъло! Мавзӯи заиф надорӣ!
            </p>
          )}

          {summary?.weak_topic_lessons?.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 8 }}>
              {summary.weak_topic_lessons.map((wt) => (
                <div
                  key={wt.lesson_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    borderRadius: 6,
                    padding: "12px 16px",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.25)",
                  }}
                >
                  <span style={{ color: "#EF4444", fontSize: 14, fontWeight: 500 }}>{wt.title}</span>
                  <button
                    onClick={() => navigate(`/quiz/${wt.lesson_id}`)}
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#04231F",
                      background: "#EF4444",
                      border: "none",
                      borderRadius: 999,
                      padding: "6px 12px",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Машқ кун →
                  </button>
                </div>
              ))}
            </div>
          )}

          {advice && (
            <div
              style={{
                marginTop: 20,
                borderRadius: 6,
                padding: "1.25rem",
                fontSize: 14,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(45,212,191,0.15)",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {advice}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
