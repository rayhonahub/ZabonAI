import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Clock, CheckCircle, Trophy } from "lucide-react";
import confetti from "canvas-confetti";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { usePageTitle } from "../hooks/usePageTitle";

const SECS = 60;
const BG = "linear-gradient(160deg, #061A1C 0%, #0A2A2E 45%, #0E3A3F 100%)";
const OPTION_KEYS = ["a", "b", "c", "d"];

function CountdownRing({ timeLeft }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - timeLeft / SECS);
  const stroke = timeLeft <= 10 ? "#FBBF24" : "#14B8A6";
  return (
    <div style={{ position: "relative", width: 54, height: 54, flexShrink: 0 }}>
      <svg width="54" height="54" viewBox="0 0 54 54">
        <circle cx="27" cy="27" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
        <circle
          cx="27" cy="27" r={r} fill="none"
          stroke={stroke} strokeWidth="3.5"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 27 27)"
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
        />
      </svg>
      <span style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: stroke, fontWeight: 700, fontSize: 13,
        transition: "color 0.3s",
      }}>
        {timeLeft}
      </span>
    </div>
  );
}

export default function DailyChallengePage() {
  usePageTitle("Бозии ҳаррӯза");
  const navigate = useNavigate();

  const [phase, setPhase] = useState("intro");
  const [statusLoading, setStatusLoading] = useState(true);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [timeLeft, setTimeLeft] = useState(SECS);
  const [result, setResult] = useState(null);

  const timerRef = useRef(null);
  const answersRef = useRef({});
  const qIdxRef = useRef(0);
  const questionsRef = useRef([]);
  const chosenRef = useRef(null);
  const confettiFired = useRef(false);

  // keep refs in sync
  qIdxRef.current = qIdx;
  questionsRef.current = questions;
  chosenRef.current = chosen;

  useEffect(() => {
    api.get("/quiz/daily-challenge/status")
      .then((r) => setAlreadyDone(r.data.already_done_today))
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  }, []);

  async function startChallenge() {
    setPhase("loading");
    try {
      const res = await api.get("/quiz/daily-challenge");
      answersRef.current = {};
      setQuestions(res.data);
      setQIdx(0);
      setChosen(null);
      setPhase("quiz");
    } catch {
      setPhase("intro");
    }
  }

  // Timer per question
  useEffect(() => {
    if (phase !== "quiz" || questions.length === 0) return;
    clearInterval(timerRef.current);
    setTimeLeft(SECS);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          if (chosenRef.current === null) {
            const qi = qIdxRef.current;
            const qs = questionsRef.current;
            if (qi + 1 < qs.length) {
              setQIdx(qi + 1);
              setChosen(null);
            } else {
              doSubmit();
            }
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIdx, phase, questions.length]);

  function handleAnswer(key) {
    if (chosen !== null) return;
    const q = questions[qIdx];
    answersRef.current[String(q.id)] = key;
    setChosen(key);
    clearInterval(timerRef.current);

    setTimeout(() => {
      const nextIdx = qIdx + 1;
      if (nextIdx < questions.length) {
        setQIdx(nextIdx);
        setChosen(null);
      } else {
        doSubmit();
      }
    }, 900);
  }

  async function doSubmit() {
    clearInterval(timerRef.current);
    setPhase("submitting");
    try {
      const res = await api.post("/quiz/daily-challenge/submit", { answers: answersRef.current });
      setResult(res.data);
    } catch {
      setResult({ score: 0, correct: 0, total: questions.length, coins_earned: 0, xp_earned: 0 });
    }
    setPhase("result");
  }

  useEffect(() => {
    if (phase === "result" && !confettiFired.current) {
      confettiFired.current = true;
      const correct = result?.correct ?? 0;
      if (correct >= 3) confetti({ particleCount: 110, spread: 65, origin: { y: 0.6 } });
    }
  }, [phase, result]);

  // ── INTRO ──────────────────────────────────────────────
  if (statusLoading || phase === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: BG }}>
        <Navbar />
        <div style={{ maxWidth: 500, margin: "0 auto", padding: "3rem 1rem" }}>
          <div style={{ height: 220, borderRadius: 6, background: "rgba(255,255,255,0.04)" }} className="animate-pulse" />
        </div>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div style={{ minHeight: "100vh", background: BG }}>
        <Navbar />
        <div style={{ maxWidth: 500, margin: "0 auto", padding: "3rem 1rem" }}>
          <div className="glass-card fade-up-1" style={{ padding: "2.5rem", textAlign: "center" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(20,184,166,0.12)", border: "2px solid rgba(20,184,166,0.35)",
              marginBottom: "1.25rem",
            }}>
              <Zap size={28} color="#14B8A6" />
            </div>
            <h1 style={{ color: "white", fontWeight: 600, fontSize: 24, margin: "0 0 0.75rem" }}>
              Бозии ҳаррӯза
            </h1>
            <p style={{ color: "rgba(255,255,255,0.58)", fontSize: 15, lineHeight: 1.75, margin: "0 0 2rem" }}>
              Ҳар рӯз 5 саволи нав пайдо мешавад. Агар ту дуруст ҷавоб диҳӣ, 15 танга ва 15 XP мегирӣ. Бозиро ҳар рӯз гузарон, то силсилаатро нигоҳ дорӣ!
            </p>
            {alreadyDone ? (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.18)",
                borderRadius: 6, padding: "0.9rem 1.25rem",
              }}>
                <Clock size={17} color="#2DD4BF" style={{ flexShrink: 0 }} />
                <span style={{ color: "#2DD4BF", fontWeight: 500, fontSize: 15 }}>
                  Ту имрӯз аллакай бозӣ кардӣ! Пагоҳ боз биё.
                </span>
              </div>
            ) : (
              <button
                onClick={startChallenge}
                style={{
                  width: "100%", background: "#14B8A6", color: "#04231F",
                  border: "none", borderRadius: 6, padding: "0.82rem",
                  fontWeight: 600, fontSize: 15, cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Бозиро сар кун
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── RESULT ─────────────────────────────────────────────
  if (phase === "result" || phase === "submitting") {
    const correct = result?.correct ?? 0;
    const total = result?.total ?? questions.length;
    const coins = result?.coins_earned ?? 0;
    return (
      <div style={{ minHeight: "100vh", background: BG }}>
        <Navbar />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "3rem 1rem", textAlign: "center" }}>
          <div className="glass-card fade-up-1" style={{ padding: "2.5rem" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 72, height: 72, borderRadius: "50%",
              background: "rgba(20,184,166,0.12)",
              border: "2.5px solid #14B8A6",
              boxShadow: "0 0 28px rgba(20,184,166,0.28)",
              marginBottom: "1.25rem",
            }}>
              <Trophy size={30} color="#14B8A6" />
            </div>
            <h2 style={{ color: "white", fontWeight: 600, fontSize: 22, margin: "0 0 0.5rem" }}>
              Ту {correct}/{total} дуруст ҷавоб додӣ!
            </h2>
            {coins > 0 ? (
              <p style={{ color: "#FBBF24", fontWeight: 700, fontSize: 18, margin: "0 0 1.75rem" }}>
                +{coins} танга
              </p>
            ) : (
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 1.75rem" }}>
                Фардо дубора кӯшиш кун!
              </p>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => navigate("/courses")}
                style={{ flex: 1, background: "#14B8A6", color: "#04231F", border: "none", borderRadius: 6, padding: "0.75rem", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
              >
                Курсҳо
              </button>
              <button
                onClick={() => navigate("/leaderboard")}
                style={{ flex: 1, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "0.75rem", fontWeight: 500, fontSize: 14, cursor: "pointer" }}
              >
                Беҳтаринҳо
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── QUIZ ───────────────────────────────────────────────
  if (questions.length === 0) {
    return (
      <div style={{ minHeight: "100vh", background: BG }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: "5rem 1rem", color: "rgba(255,255,255,0.35)", fontSize: 15 }}>
          Имрӯз саволе нест. Баъдтар биё.
        </div>
      </div>
    );
  }

  const q = questions[qIdx];
  const progressPct = ((qIdx + 1) / questions.length) * 100;

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <Navbar />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div style={{ flex: 1, marginRight: 16 }}>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: "0 0 6px" }}>
              Савол {qIdx + 1} / {questions.length}
            </p>
            <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
              <div style={{
                height: "100%", width: `${progressPct}%`,
                background: "linear-gradient(90deg, #14B8A6, #2DD4BF)",
                borderRadius: 2, transition: "width 0.4s ease",
              }} />
            </div>
          </div>
          <CountdownRing timeLeft={timeLeft} />
        </div>

        {/* Question card */}
        <div className="glass-card" style={{ padding: "2rem" }} key={q.id}>
          <h2 style={{ color: "white", fontWeight: 500, fontSize: 18, textAlign: "center", margin: "0 0 1.5rem", lineHeight: 1.5 }}>
            {q.question}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {OPTION_KEYS.map((key) => {
              const text = q[`option_${key}`];
              if (!text) return null;
              const isChosen = chosen === key;
              const isCorrect = chosen !== null && key === q.correct_answer?.toLowerCase();
              const isWrong = isChosen && chosen !== null && key !== q.correct_answer?.toLowerCase();
              let border = "1.5px solid rgba(45,212,191,0.12)";
              let bg = "rgba(255,255,255,0.02)";
              let color = "rgba(255,255,255,0.82)";
              if (isCorrect) { border = "1.5px solid #2DD4BF"; bg = "rgba(45,212,191,0.08)"; color = "#2DD4BF"; }
              if (isWrong)   { border = "1.5px solid #FBBF24"; bg = "rgba(251,191,36,0.06)"; color = "#FBBF24"; }
              return (
                <button
                  key={key}
                  onClick={() => handleAnswer(key)}
                  disabled={chosen !== null}
                  style={{
                    width: "100%", background: bg, border, borderRadius: 6,
                    padding: "0.75rem 1rem", color, fontSize: 14,
                    textAlign: "left", cursor: chosen !== null ? "default" : "pointer",
                    transition: "all 0.2s", display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  <span style={{
                    width: 24, height: 24, borderRadius: 4, flexShrink: 0,
                    background: "rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700,
                    color: isCorrect ? "#2DD4BF" : isWrong ? "#FBBF24" : "rgba(255,255,255,0.3)",
                  }}>
                    {key.toUpperCase()}
                  </span>
                  <span style={{ flex: 1 }}>{text}</span>
                  {isCorrect && <CheckCircle size={15} color="#2DD4BF" style={{ flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
