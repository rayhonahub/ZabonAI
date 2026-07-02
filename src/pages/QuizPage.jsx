import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import confetti from "canvas-confetti";
import Navbar from "../components/Navbar";
import LevelUpModal from "../components/LevelUpModal";
import api from "../api/axios";
import { showToast } from "../utils/toastBus";
import { usePageTitle } from "../hooks/usePageTitle";

const BG = "linear-gradient(160deg, #061A1C 0%, #0A2A2E 45%, #0E3A3F 100%)";

const optionKeys = ["a", "b", "c", "d"];

function resultEmoji(score) {
  if (score >= 80) return "🎉";
  if (score >= 60) return "👍";
  return "😢";
}

function resultMessage(score) {
  if (score >= 80) return "Аъло! Шумо хеле хуб кор кардед!";
  if (score >= 60) return "Хуб! Давом диҳед!";
  return "Ташвиш нашавед! Боз кӯшиш кунед.";
}

function optionStyle({ isSelected, showFeedback, isCorrectKey }) {
  const base = {
    width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12,
    padding: "14px 20px", borderRadius: 6, cursor: "pointer", transition: "all 0.2s",
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(45,212,191,0.15)", color: "white",
  };
  if (showFeedback && isCorrectKey) {
    return { ...base, border: "1px solid #14B8A6", background: "rgba(20,184,166,0.2)", cursor: "default" };
  }
  if (showFeedback && isSelected && !isCorrectKey) {
    return { ...base, border: "1px solid #EF4444", background: "rgba(239,68,68,0.1)", cursor: "default" };
  }
  if (isSelected) {
    return { ...base, border: "1px solid rgba(45,212,191,0.4)", background: "rgba(45,212,191,0.08)" };
  }
  return base;
}

function OptionButton({ text, keyLabel, isSelected, showFeedback, isCorrectKey, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={optionStyle({ isSelected, showFeedback, isCorrectKey })}
      onMouseEnter={(e) => {
        if (disabled || showFeedback) return;
        e.currentTarget.style.borderColor = "rgba(45,212,191,0.4)";
        e.currentTarget.style.background = "rgba(45,212,191,0.08)";
      }}
      onMouseLeave={(e) => {
        if (disabled || showFeedback || isSelected) return;
        e.currentTarget.style.borderColor = "rgba(45,212,191,0.15)";
        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
      }}
    >
      <span
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28,
          borderRadius: "50%", fontSize: 12, fontWeight: 700, flexShrink: 0,
          background: showFeedback && isCorrectKey ? "#14B8A6" : showFeedback && isSelected ? "#EF4444" : "rgba(255,255,255,0.08)",
          color: showFeedback && (isCorrectKey || isSelected) ? "#04231F" : "rgba(255,255,255,0.6)",
        }}
      >
        {keyLabel.toUpperCase()}
      </span>
      <span style={{ fontSize: 14 }}>{text}</span>
      {showFeedback && isCorrectKey && <span style={{ marginLeft: "auto" }}>✅</span>}
      {showFeedback && isSelected && !isCorrectKey && <span style={{ marginLeft: "auto" }}>❌</span>}
    </button>
  );
}

export default function QuizPage() {
  usePageTitle("Тест");
  const { id } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState(null);
  const [activeSet, setActiveSet] = useState(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("quiz"); // quiz | result | practice
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceSelected, setPracticeSelected] = useState(null);
  const [levelUpCourses, setLevelUpCourses] = useState([]);
  const [levelUpDismissed, setLevelUpDismissed] = useState(false);
  const confettiFired = useRef(false);

  useEffect(() => {
    api
      .get(`/quiz/${id}`)
      .then((res) => {
        setQuestions(res.data);
        setActiveSet(res.data);
      })
      .catch(() => setQuestions([]));
  }, [id]);

  useEffect(() => {
    if (mode === "result" && result && result.score >= 80 && !confettiFired.current) {
      confettiFired.current = true;
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
    }
  }, [mode, result]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (mode !== "quiz" || !activeSet || selected) return;
      const digitMap = { "1": "a", "2": "b", "3": "c", "4": "d" };
      const key = digitMap[e.key] || (["a", "b", "c", "d"].includes(e.key.toLowerCase()) ? e.key.toLowerCase() : null);
      if (!key) return;
      const q = activeSet[index];
      if (q && q[`option_${key}`]) {
        selectOption(q.id, key);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, activeSet, index, selected]);

  function selectOption(questionId, key) {
    if (selected) return;
    setSelected(key);
    const updated = { ...answers, [questionId]: key };
    setAnswers(updated);

    setTimeout(() => {
      if (index + 1 < activeSet.length) {
        setIndex((i) => i + 1);
        setSelected(null);
      } else {
        submitQuiz(updated);
      }
    }, 350);
  }

  async function submitQuiz(finalAnswers) {
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/quiz/submit", {
        lesson_id: Number(id),
        answers: finalAnswers,
      });
      setResult(res.data);
      setMode("result");
      showToast("ℹ️ Тест сабт шуд", "info");

      if (res.data.level_up) {
        api
          .get("/courses/")
          .then((r) => {
            const names = r.data.filter((c) => c.level === res.data.level_up.new_level).map((c) => c.title);
            setLevelUpCourses(names);
          })
          .catch(() => setLevelUpCourses([]));
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Тестро фиристода нашуд");
    } finally {
      setSubmitting(false);
    }
  }

  function restartQuiz() {
    confettiFired.current = false;
    setActiveSet(questions);
    setIndex(0);
    setAnswers({});
    setSelected(null);
    setResult(null);
    setLevelUpCourses([]);
    setLevelUpDismissed(false);
    setMode("quiz");
  }

  function startPracticeWrong() {
    setPracticeIndex(0);
    setPracticeSelected(null);
    setMode("practice");
  }

  const wrongResults = result?.results?.filter((r) => !r.is_correct) || [];

  if (questions === null) {
    return (
      <div className="min-h-screen" style={{ background: BG }}>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 animate-pulse">
          <div className="h-3 rounded-full mb-8" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-56 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen" style={{ background: BG }}>
        <Navbar />
        <div className="text-center py-20" style={{ color: "rgba(255,255,255,0.4)" }}>
          Барои ин дарс тест мавҷуд нест
        </div>
      </div>
    );
  }

  if (mode === "practice") {
    const pq = wrongResults[practiceIndex];
    const original = questions.find((q) => q.id === pq.question_id);

    if (!pq) {
      return null;
    }

    return (
      <div className="min-h-screen" style={{ background: BG }}>
        <Navbar />
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <h1 style={{ color: "white", fontWeight: 700, fontSize: 17, margin: 0 }}>
              Машқи ҷавобҳои нодуруст
            </h1>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>
              {practiceIndex + 1} / {wrongResults.length}
            </span>
          </div>

          <div className="glass-card" style={{ padding: 32 }} key={pq.question_id}>
            <h2 style={{ color: "white", fontWeight: 700, fontSize: 17, marginBottom: 22 }}>{pq.question}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {optionKeys.map((key) => {
                const text = original?.[`option_${key}`];
                if (!text) return null;
                const isSelected = practiceSelected === key;
                const isCorrectKey = key.toLowerCase() === pq.correct_answer.toLowerCase();
                const showFeedback = !!practiceSelected;
                return (
                  <OptionButton
                    key={key}
                    text={text}
                    keyLabel={key}
                    isSelected={isSelected}
                    showFeedback={showFeedback}
                    isCorrectKey={isCorrectKey}
                    disabled={showFeedback}
                    onClick={() => setPracticeSelected(key)}
                  />
                );
              })}
            </div>

            {practiceSelected && (
              <button
                onClick={() => {
                  if (practiceIndex + 1 < wrongResults.length) {
                    setPracticeIndex((i) => i + 1);
                    setPracticeSelected(null);
                  } else {
                    setMode("result");
                  }
                }}
                style={{
                  marginTop: 24, width: "100%", padding: "12px", borderRadius: 6, fontWeight: 600, fontSize: 14,
                  background: "#14B8A6", color: "#04231F", border: "none", cursor: "pointer",
                }}
              >
                {practiceIndex + 1 < wrongResults.length ? "Саволи баъдӣ →" : "Анҷом"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (mode === "result" && result) {
    const failed = result.score < 60;
    return (
      <div className="min-h-screen" style={{ background: BG }}>
        <Navbar />
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "64px 16px" }}>
          <div className="glass-card" style={{ padding: 40, textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>{resultEmoji(result.score)}</div>
            <h1 style={{ color: "#2DD4BF", fontWeight: 800, fontSize: 32, margin: "0 0 4px" }}>{result.score}%</h1>
            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>{resultMessage(result.score)}</p>

            <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 24, fontSize: 14 }}>
              <div>
                <p style={{ color: "white", fontWeight: 700, fontSize: 22, margin: "0 0 2px" }}>{result.correct}</p>
                <p style={{ color: "rgba(255,255,255,0.4)", margin: 0 }}>Дуруст</p>
              </div>
              <div>
                <p style={{ color: "white", fontWeight: 700, fontSize: 22, margin: "0 0 2px" }}>{result.total}</p>
                <p style={{ color: "rgba(255,255,255,0.4)", margin: 0 }}>Ҳамагӣ</p>
              </div>
            </div>

            {result.weak_topic && (
              <div style={{
                background: "rgba(239,68,68,0.1)", color: "#F87171", fontSize: 13.5,
                borderRadius: 6, padding: "10px 14px", marginBottom: 24,
              }}>
                Ин мавзӯъ бештар машқ мехоҳад
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {failed && (
                <button
                  onClick={restartQuiz}
                  style={{ width: "100%", padding: "12px", borderRadius: 6, fontWeight: 600, fontSize: 14, background: "#EF4444", color: "white", border: "none", cursor: "pointer" }}
                >
                  Боз кӯшиш кун
                </button>
              )}
              {wrongResults.length > 0 && (
                <button
                  onClick={startPracticeWrong}
                  style={{ width: "100%", padding: "12px", borderRadius: 6, fontWeight: 600, fontSize: 14, background: "#14B8A6", color: "#04231F", border: "none", cursor: "pointer" }}
                >
                  Ҷавобҳои нодурустро машқ кун ({wrongResults.length})
                </button>
              )}
              <button
                onClick={() => navigate(`/lessons/${id}`)}
                style={{ width: "100%", padding: "12px", borderRadius: 6, fontWeight: 600, fontSize: 14, background: "rgba(255,255,255,0.06)", color: "white", border: "none", cursor: "pointer" }}
              >
                Ба курс баргардан
              </button>
              <button
                onClick={() => navigate("/progress")}
                style={{ width: "100%", padding: "12px", borderRadius: 6, fontWeight: 600, fontSize: 14, background: "rgba(255,255,255,0.06)", color: "white", border: "none", cursor: "pointer" }}
              >
                Пешрафтро дидан
              </button>
            </div>
          </div>

          {result.results?.length > 0 && (
            <div className="glass-card" style={{ padding: 28 }}>
              <h2 style={{ color: "white", fontWeight: 700, fontSize: 17, margin: "0 0 4px" }}>Хатоҳо</h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 18 }}>Баррасии ҷавобҳо</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {result.results.map((r) => (
                  <div
                    key={r.question_id}
                    style={{
                      borderRadius: 6, padding: 16,
                      border: r.is_correct ? "1px solid rgba(20,184,166,0.3)" : "1px solid rgba(239,68,68,0.3)",
                      background: r.is_correct ? "rgba(20,184,166,0.08)" : "rgba(239,68,68,0.08)",
                    }}
                  >
                    <p style={{ color: "white", fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                      {r.is_correct ? "✅" : "❌"} {r.question}
                    </p>
                    {!r.is_correct && (
                      <p style={{ color: "#F87171", fontSize: 13.5, margin: "0 0 4px" }}>
                        Ҷавоби шумо: {r.user_option_text || "—"}
                      </p>
                    )}
                    <p style={{ color: "#5EEAD4", fontSize: 13.5, margin: 0 }}>
                      Ҷавоби дуруст: {r.correct_option_text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {result.level_up && !levelUpDismissed && (
          <LevelUpModal
            levelUp={result.level_up}
            unlockedCourses={levelUpCourses}
            onClose={() => setLevelUpDismissed(true)}
          />
        )}
      </div>
    );
  }

  const question = activeSet[index];
  const progress = Math.round(((index + (selected ? 1 : 0)) / activeSet.length) * 100);

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <Navbar />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 16px" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
            <span>Савол {index + 1} аз {activeSet.length}</span>
            <span>{progress}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 20, overflow: "hidden", background: "rgba(255,255,255,0.08)" }}>
            <div
              style={{
                height: "100%", borderRadius: 20, background: "#14B8A6",
                width: `${progress}%`, transition: "width 0.5s",
              }}
            />
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: 16, fontSize: 13.5, background: "rgba(239,68,68,0.1)", color: "#F87171", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 6, padding: "8px 12px" }}>
            {error}
          </div>
        )}

        <div className="glass-card fade-up-1" style={{ padding: 32, maxWidth: 600, margin: "auto" }} key={question.id}>
          <h2 style={{ color: "white", fontWeight: 700, fontSize: 17, marginBottom: 22 }}>{question.question}</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {optionKeys.map((key) => {
              const text = question[`option_${key}`];
              if (!text) return null;
              const isSelected = selected === key;
              return (
                <OptionButton
                  key={key}
                  text={text}
                  keyLabel={key}
                  isSelected={isSelected}
                  showFeedback={false}
                  isCorrectKey={false}
                  disabled={!!selected || submitting}
                  onClick={() => selectOption(question.id, key)}
                />
              );
            })}
          </div>
        </div>

        {submitting && (
          <p style={{ textAlign: "center", fontSize: 13.5, color: "rgba(255,255,255,0.4)", marginTop: 16 }}>Фиристода истодааст...</p>
        )}
      </div>
    </div>
  );
}
