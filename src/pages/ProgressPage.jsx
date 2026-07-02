import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Flame, BarChart2, CheckCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { useCountUp } from "../hooks/useCountUp";
import { usePageTitle } from "../hooks/usePageTitle";

const BG = "linear-gradient(160deg, #061A1C 0%, #0A2A2E 45%, #0E3A3F 100%)";

const statCardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(45,212,191,0.12)",
  borderRadius: 8,
  padding: "24px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const cardLabelRowStyle = { display: "flex", alignItems: "center", gap: 6 };

const cardLabelTextStyle = {
  color: "rgba(255,255,255,0.45)",
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  margin: 0,
};

const cardValueStyle = {
  color: "white",
  fontSize: 32,
  fontWeight: 500,
  letterSpacing: "-0.02em",
  margin: "4px 0",
};

const cardSublabelStyle = { color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0 };

const glassSectionStyle = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  padding: 20,
};

const sectionHeadingStyle = {
  color: "rgba(255,255,255,0.7)",
  fontSize: 14,
  fontWeight: 500,
  margin: "0 0 16px",
};

function levelLabel(xp) {
  if (xp >= 300) return "Болотар";
  if (xp >= 100) return "Миёна";
  return "Ибтидоӣ";
}

function ProgressRing({ percent, size = 72, stroke = 7 }) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimatedPercent(percent), 100);
    return () => clearTimeout(t);
  }, [percent]);

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercent / 100) * circumference;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
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
    </div>
  );
}

function StatCard({ Icon, iconColor, label, value, sublabel }) {
  return (
    <div style={statCardStyle}>
      <div style={cardLabelRowStyle}>
        <Icon size={14} color={iconColor} />
        <p style={cardLabelTextStyle}>{label}</p>
      </div>
      <p style={cardValueStyle}>{value}</p>
      {sublabel && <p style={cardSublabelStyle}>{sublabel}</p>}
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
          circleStyle = { background: "#14B8A6", color: "white" };
        } else {
          circleStyle = { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" };
        }
        return (
          <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 36,
                height: 36,
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
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, marginTop: 8 }}>{d.label}</span>
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
    return <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, textAlign: "center", margin: 0 }}>Ҳоло тест нагузаштед</p>;
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
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
          <h1 style={{ color: "white", fontSize: 26, fontWeight: 500, margin: 0 }}>Пешрафти ман</h1>
          <span
            style={{
              fontSize: 13,
              padding: "6px 14px",
              borderRadius: 6,
              background: "rgba(45,212,191,0.08)",
              border: "1px solid rgba(45,212,191,0.25)",
              color: "#2DD4BF",
              fontWeight: 500,
            }}
          >
            Сатҳ: {level}
          </span>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 40 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ ...statCardStyle, height: 128 }} />
            ))}
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
              <div style={statCardStyle}>
                <div style={cardLabelRowStyle}>
                  <CheckCircle size={14} color="#14B8A6" />
                  <p style={cardLabelTextStyle}>АНҶОМШУДА</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <ProgressRing percent={completionPercent} />
                  <p style={cardValueStyle}>{Math.round(completionPercent)}%</p>
                </div>
                <p style={cardSublabelStyle}>
                  {animatedCompleted}/{summary?.total_lessons ?? 0} дарс
                </p>
              </div>
              <StatCard Icon={Star} iconColor="#FBBF24" label="Холҳои XP" value={`${animatedXp}`} sublabel="умумии XP" />
              <StatCard Icon={BarChart2} iconColor="#2DD4BF" label="Миёнаи натиҷа" value={`${summary?.average_score ?? 0}%`} sublabel="миёнаи натиҷа" />
              <StatCard Icon={Flame} iconColor="#FBBF24" label="Силсилаи имрӯза" value={`${summary?.streak ?? 0}`} sublabel="рӯзи силсила" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 32 }}>
              <div style={glassSectionStyle}>
                <h2 style={sectionHeadingStyle}>7 рӯзи охир</h2>
                <StreakCalendar streak={summary?.streak ?? 0} />
              </div>

              <div style={glassSectionStyle}>
                <h2 style={sectionHeadingStyle}>Натиҷаи тестҳо</h2>
                <QuizScoreList entries={scoreEntries} />
              </div>
            </div>
          </>
        )}

        <div style={{ ...glassSectionStyle, padding: 24 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
            <h2 style={{ ...sectionHeadingStyle, margin: 0 }}>Мавзӯъҳои заиф</h2>
            <button
              onClick={getAdvice}
              disabled={adviceLoading}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                fontWeight: 500,
                fontSize: 13,
                background: "rgba(251,191,36,0.12)",
                border: "1px solid rgba(251,191,36,0.3)",
                color: "#FBBF24",
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
                padding: 16,
                background: "rgba(20,184,166,0.06)",
                border: "1px solid rgba(20,184,166,0.2)",
                color: "rgba(45,212,191,0.8)",
                textAlign: "center",
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
