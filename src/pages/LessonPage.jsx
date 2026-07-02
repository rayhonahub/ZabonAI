import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import confetti from "canvas-confetti";
import { BookOpen, Clock, Sparkles, Trophy, CheckCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import VocabCard from "../components/VocabCard";
import VoiceModal from "../components/VoiceModal";
import LevelUpModal from "../components/LevelUpModal";
import api from "../api/axios";
import { extractVocab } from "../utils/extractVocab";
import { parseSections, emojiForLesson } from "../utils/lessonSections";
import { generatePracticeExercises } from "../utils/practiceExercises";
import { showToast } from "../utils/toastBus";
import { usePageTitle } from "../hooks/usePageTitle";

const BG = "linear-gradient(160deg, #061A1C 0%, #0A2A2E 45%, #0E3A3F 100%)";

function AIWordExamples({ word, translation }) {
  const [examples, setExamples] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  function fetchExamples() {
    if (examples) { setOpen(true); return; }
    setLoading(true);
    setOpen(true);
    api.get(`/ai/word-examples/${encodeURIComponent(word)}`, { params: { translation } })
      .then(res => setExamples(res.data.examples))
      .catch(() => setExamples([]))
      .finally(() => setLoading(false));
  }

  return (
    <div style={{
      background: 'rgba(20,184,166,0.06)',
      border: '1px solid rgba(45,212,191,0.2)',
      borderRadius: 8,
      padding: '12px 14px',
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <span style={{ color: '#2DD4BF', fontWeight: 700, fontSize: 15 }}>{word}</span>
          <span style={{ color: '#FBBF24', fontWeight: 500, fontSize: 13, marginLeft: 10 }}>{translation}</span>
        </div>
        <button
          onClick={fetchExamples}
          style={{
            background: 'none',
            border: '1px solid rgba(45,212,191,0.35)',
            borderRadius: 6,
            color: '#2DD4BF',
            fontSize: 12,
            fontWeight: 600,
            padding: '4px 10px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Мисолҳои AI
        </button>
      </div>

      {open && (
        <div style={{ marginTop: 10 }}>
          {loading ? (
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontStyle: 'italic' }}>
              Мисолҳо омода мешаванд...
            </p>
          ) : examples && examples.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {examples.map((ex, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  borderLeft: '2px solid rgba(45,212,191,0.3)',
                }}>
                  <p style={{ color: 'white', fontSize: 13, margin: '0 0 3px' }}>{ex.english}</p>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, margin: 0, fontStyle: 'italic' }}>{ex.tajik}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Мисол ёфт нашуд</p>
          )}
        </div>
      )}
    </div>
  );
}

function readingTimeMinutes(content) {
  if (!content) return 1;
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

const markdownComponents = {
  h2: (props) => <h2 style={{ color: "#2DD4BF", fontSize: 20, fontWeight: 600, marginTop: 22, marginBottom: 10 }} {...props} />,
  h3: (props) => <h3 style={{ color: "#5EEAD4", fontSize: 16, fontWeight: 600, marginTop: 18, marginBottom: 8 }} {...props} />,
  strong: (props) => <strong style={{ color: "white", background: "rgba(45,212,191,0.12)", padding: "0 4px", borderRadius: 4, fontWeight: 600 }} {...props} />,
  p: (props) => <p style={{ color: "rgba(255,255,255,0.82)", lineHeight: 1.8, marginBottom: 14, fontSize: 15 }} {...props} />,
  ul: (props) => <ul style={{ margin: "0 0 14px", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }} {...props} />,
  li: (props) => <li style={{ color: "rgba(255,255,255,0.82)", fontSize: 15, lineHeight: 1.6 }} {...props} />,
  table: (props) => (
    <div className="glass-card" style={{ overflowX: "auto", marginBottom: 16, padding: 0 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }} {...props} />
    </div>
  ),
  thead: (props) => <thead style={{ background: "rgba(45,212,191,0.08)" }} {...props} />,
  th: (props) => <th style={{ color: "#2DD4BF", fontSize: 13, fontWeight: 600, textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(45,212,191,0.15)" }} {...props} />,
  td: (props) => <td style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }} {...props} />,
  code: (props) => <code style={{ background: "#04231F", color: "#5EEAD4", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 13 }} {...props} />,
};

export default function LessonPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { courseId, moduleId } = location.state || {};

  const [lesson, setLesson] = useState(null);
  usePageTitle(lesson?.title);
  const [siblings, setSiblings] = useState(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState("intro");
  const [readingIndex, setReadingIndex] = useState(0);
  const [understood, setUnderstood] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceSelected, setPracticeSelected] = useState(null);
  const [practiceFeedback, setPracticeFeedback] = useState(null);
  const [completion, setCompletion] = useState(null);
  const [levelUpCourses, setLevelUpCourses] = useState([]);
  const [levelUpDismissed, setLevelUpDismissed] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setStep("intro");
    setReadingIndex(0);
    setPracticeIndex(0);
    setCompletion(null);
    setLevelUpDismissed(false);
    api
      .get(`/courses/lessons/${id}`)
      .then((res) => setLesson(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (courseId && moduleId) {
      api
        .get(`/courses/${courseId}/modules/${moduleId}/lessons`)
        .then((res) => setSiblings(res.data))
        .catch(() => setSiblings(null));
    } else {
      setSiblings(null);
    }
  }, [courseId, moduleId]);

  const vocab = useMemo(() => extractVocab(lesson?.content).slice(0, 12), [lesson?.content]);
  const sections = useMemo(() => parseSections(lesson?.content), [lesson?.content]);
  const exercises = useMemo(() => generatePracticeExercises(vocab, 3), [vocab]);
  const minutes = useMemo(() => readingTimeMinutes(lesson?.content), [lesson?.content]);
  const emoji = useMemo(() => emojiForLesson(lesson?.title), [lesson?.title]);

  const learnBullets = useMemo(() => {
    const fromSections = sections
      .filter((s) => s.heading)
      .slice(0, 3)
      .map((s) => s.heading);
    if (fromSections.length >= 3) return fromSections;
    const fallback = [
      `Луғати нав аз "${lesson?.title || ""}"`,
      "Ҷумлаҳои мисолӣ",
      "Қоидаи грамматикӣ",
    ];
    return [...fromSections, ...fallback].slice(0, 3);
  }, [sections, lesson?.title]);

  const lessonList = siblings ? [...siblings].sort((a, b) => a.order - b.order) : lesson ? [lesson] : [];
  const positionIndex = lessonList.findIndex((l) => String(l.id) === String(id));
  const positionLabel =
    positionIndex >= 0 && lessonList.length > 0 ? `Дарси ${positionIndex + 1} аз ${lessonList.length}` : "";
  const nextLesson = positionIndex >= 0 ? lessonList[positionIndex + 1] : null;

  const totalReadingSteps = sections.length + (vocab.length > 0 ? 1 : 0);
  const onVocabStep = readingIndex === sections.length && vocab.length > 0;

  useEffect(() => {
    setUnderstood(false);
  }, [readingIndex]);

  function goToNextReadingStep() {
    if (readingIndex + 1 < totalReadingSteps) {
      setReadingIndex((i) => i + 1);
    } else {
      setStep(exercises.length > 0 ? "practice" : "complete");
    }
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (step !== "reading") return;
      if (e.key === "ArrowRight" && (onVocabStep || understood)) {
        goToNextReadingStep();
      } else if (e.key === "ArrowLeft" && readingIndex > 0) {
        setReadingIndex((i) => i - 1);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, readingIndex, understood, onVocabStep, totalReadingSteps, exercises.length]);

  useEffect(() => {
    if (step === "complete" && lesson) {
      api
        .post(`/progress/complete-lesson/${lesson.id}`)
        .then((res) => {
          setCompletion(res.data);
          if (res.data.xp_awarded) {
            showToast("✅ Дарс тамом шуд! +10 XP", "success");
          }
          if (res.data.level_up) {
            api
              .get("/courses/")
              .then((r) => {
                const names = r.data.filter((c) => c.level === res.data.level_up.new_level).map((c) => c.title);
                setLevelUpCourses(names);
              })
              .catch(() => setLevelUpCourses([]));
          }
        })
        .catch(() => setCompletion({ xp_awarded: false }));
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  }, [step, lesson]);

  function handlePracticeSelect(option, exercise) {
    if (practiceFeedback === "correct") return;
    if (option.toLowerCase() === exercise.answer.toLowerCase()) {
      setPracticeSelected(option);
      setPracticeFeedback("correct");
      setTimeout(() => {
        if (practiceIndex + 1 < exercises.length) {
          setPracticeIndex((i) => i + 1);
          setPracticeSelected(null);
          setPracticeFeedback(null);
        } else {
          setStep("complete");
        }
      }, 500);
    } else {
      setPracticeSelected(option);
      setPracticeFeedback("wrong");
      setTimeout(() => {
        setPracticeSelected(null);
        setPracticeFeedback(null);
      }, 500);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: BG }}>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-10 animate-pulse">
          <div className="h-8 w-64 rounded mb-6" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-64 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen" style={{ background: BG }}>
        <Navbar />
        <div className="text-center py-20" style={{ color: "rgba(255,255,255,0.4)" }}>Дарс ёфт нашуд</div>
      </div>
    );
  }

  if (step === "intro") {
    return (
      <div className="min-h-screen" style={{ background: BG, position: "relative" }}>
        <Navbar />
        <div className="glass-card fade-up-1" style={{ position: "relative", maxWidth: 520, margin: "3rem auto", padding: "2.25rem", textAlign: "center" }}>
          {positionLabel && (
            <span style={{
              display: "inline-block", background: "rgba(45,212,191,0.12)", color: "#2DD4BF",
              fontSize: 12, fontWeight: 600, padding: "3px 12px", borderRadius: 20, marginBottom: 18,
            }}>
              {positionLabel}
            </span>
          )}
          <div>
            <BookOpen size={48} style={{ color: "#2DD4BF", margin: "0 auto 14px" }} />
          </div>
          <h1 style={{ color: "#2DD4BF", fontWeight: 500, fontSize: 28, margin: "0 0 22px", lineHeight: 1.3 }}>
            {emoji} {lesson.title}
          </h1>

          <div className="glass-card" style={{ padding: "1.1rem 1.25rem", textAlign: "left", marginBottom: 20 }}>
            <p style={{ color: "#2DD4BF", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 12px" }}>
              Имрӯз чӣ ёд мегирем
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {learnBullets.map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <CheckCircle size={15} style={{ color: "#2DD4BF", flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>{b}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 26 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 500, padding: "5px 12px", borderRadius: 20 }}>
              <Clock size={14} /> {minutes} дақиқа
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(251,191,36,0.12)", color: "#FBBF24", fontSize: 13, fontWeight: 600, padding: "5px 12px", borderRadius: 20 }}>
              <Sparkles size={14} /> +10 XP
            </span>
          </div>

          <button
            onClick={() => setStep("reading")}
            style={{
              width: "100%", background: "#14B8A6", color: "#04231F",
              border: "none", borderRadius: 6, padding: "0.85rem",
              fontWeight: 600, fontSize: 15, cursor: "pointer", transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Дарсро оғоз кун
          </button>
        </div>
        <VoiceModal lessonId={lesson.id} />
      </div>
    );
  }

  if (step === "reading") {
    const section = !onVocabStep ? sections[readingIndex] : null;
    const canAdvance = onVocabStep || understood;

    return (
      <div className="min-h-screen" style={{ background: BG }}>
        <Navbar />
        <div className="flex" style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem 1rem 6rem", gap: 24 }}>
          {lessonList.length > 1 && (
            <div className="hidden lg:block" style={{ width: 240, flexShrink: 0 }}>
              <div className="glass-card" style={{ padding: "0.75rem", position: "sticky", top: 88 }}>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0.4rem 0.5rem 0.6rem" }}>
                  Дарсҳо
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {lessonList.map((l, i) => {
                    const isCurrent = String(l.id) === String(id);
                    return (
                      <button
                        key={l.id}
                        onClick={() => isCurrent ? null : navigate(`/lessons/${l.id}`, { state: { courseId, moduleId } })}
                        style={{
                          textAlign: "left", border: "none", cursor: isCurrent ? "default" : "pointer",
                          borderRadius: 6, padding: "8px 10px", fontSize: 13,
                          background: isCurrent ? "rgba(20,184,166,0.15)" : "transparent",
                          color: isCurrent ? "#2DD4BF" : "rgba(255,255,255,0.55)",
                          fontWeight: isCurrent ? 600 : 500,
                        }}
                      >
                        {i + 1}. {l.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="glass-card fade-up-1" style={{ padding: "1.75rem 2rem" }} key={readingIndex}>
              {onVocabStep ? (
                <>
                  <h2 style={{ color: "#2DD4BF", fontSize: 20, fontWeight: 600, margin: "0 0 4px" }}>Калимаҳо</h2>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "0 0 16px" }}>
                    Барои гардондан курсорро болои корт баред
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                    {vocab.map((v, i) => (
                      <VocabCard key={i} word={v.word} translation={v.translation} />
                    ))}
                  </div>
                  <div style={{ borderTop: "1px solid rgba(45,212,191,0.15)", paddingTop: 14, marginTop: 6 }}>
                    <p style={{ color: "rgba(45,212,191,0.8)", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
                      ✨ Мисолҳои AI
                    </p>
                    {vocab.map((v, i) => (
                      <AIWordExamples key={i} word={v.word} translation={v.translation} />
                    ))}
                  </div>
                </>
              ) : (
                <ReactMarkdown components={markdownComponents}>
                  {(section.heading ? `## ${section.heading}\n` : "") + section.body}
                </ReactMarkdown>
              )}

              {!onVocabStep && (
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, fontSize: 14, color: "rgba(255,255,255,0.65)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={understood}
                    onChange={(e) => setUnderstood(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: "#14B8A6" }}
                  />
                  Ман инро фаҳмидам
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 30,
          background: "rgba(6,26,28,0.95)", backdropFilter: "blur(10px)",
          borderTop: "1px solid rgba(45,212,191,0.15)",
          padding: "16px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <button
            onClick={() => readingIndex > 0 && setReadingIndex((i) => i - 1)}
            disabled={readingIndex === 0}
            style={{
              background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6,
              color: readingIndex === 0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.6)",
              padding: "0.6rem 1.1rem", fontSize: 13.5, fontWeight: 500,
              cursor: readingIndex === 0 ? "not-allowed" : "pointer",
            }}
          >
            ← Қаблӣ
          </button>

          <div style={{ display: "flex", gap: 6 }}>
            {Array.from({ length: totalReadingSteps }).map((_, i) => (
              <span
                key={i}
                style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: i <= readingIndex ? "#14B8A6" : "rgba(255,255,255,0.12)",
                  transition: "background 0.25s",
                }}
              />
            ))}
          </div>

          <button
            onClick={goToNextReadingStep}
            disabled={!canAdvance}
            style={{
              background: canAdvance ? "#14B8A6" : "rgba(255,255,255,0.06)",
              color: canAdvance ? "#04231F" : "rgba(255,255,255,0.3)",
              border: "none", borderRadius: 6,
              padding: "0.6rem 1.1rem", fontSize: 13.5, fontWeight: 600,
              cursor: canAdvance ? "pointer" : "not-allowed",
            }}
          >
            Баъдӣ →
          </button>
        </div>

        <button
          onClick={() => navigate(`/quiz/${lesson.id}`)}
          style={{
            position: "fixed", bottom: 140, right: 24, zIndex: 30,
            display: "flex", alignItems: "center", gap: 8,
            background: "#14B8A6", color: "#04231F", border: "none", borderRadius: 6,
            padding: "0.75rem 1.1rem", fontWeight: 600, fontSize: 13.5, cursor: "pointer",
            boxShadow: "0 6px 20px rgba(20,184,166,0.35)",
          }}
        >
          <Trophy size={16} /> Тест супоридан
        </button>

        <VoiceModal lessonId={lesson.id} bottom={80} />
      </div>
    );
  }

  if (step === "practice") {
    const exercise = exercises[practiceIndex];
    return (
      <div className="min-h-screen" style={{ background: BG }}>
        <Navbar />
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "2.5rem 1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "rgba(255,255,255,0.4)", marginBottom: 14, fontWeight: 600 }}>
            <span>Машқи хурд</span>
            <span>{practiceIndex + 1} / {exercises.length}</span>
          </div>

          <div className="glass-card fade-up-1" style={{ padding: "1.75rem 2rem" }} key={practiceIndex}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "0 0 4px" }}>Ҷои холиро пур кун</p>
            <h2 style={{ color: "white", fontWeight: 500, fontSize: 18, margin: "0 0 22px" }}>
              ___ маънояш "{exercise.translation}"
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {exercise.options.map((opt) => {
                const isSelected = practiceSelected === opt;
                const isCorrect = isSelected && practiceFeedback === "correct";
                const isWrong = isSelected && practiceFeedback === "wrong";
                let border = "1.5px solid rgba(45,212,191,0.15)";
                let bg = "rgba(255,255,255,0.03)";
                let color = "rgba(255,255,255,0.8)";
                if (isCorrect) { border = "1.5px solid #2DD4BF"; bg = "rgba(45,212,191,0.1)"; color = "#2DD4BF"; }
                if (isWrong) { border = "1.5px solid #F87171"; bg = "rgba(248,113,113,0.08)"; color = "#F87171"; }
                return (
                  <button
                    key={opt}
                    onClick={() => handlePracticeSelect(opt, exercise)}
                    style={{
                      padding: "0.85rem 1rem", borderRadius: 6, fontSize: 14, fontWeight: 600,
                      border, background: bg, color, cursor: "pointer", transition: "all 0.2s",
                    }}
                  >
                    {opt} {isCorrect && "✅"} {isWrong && "❌"}
                  </button>
                );
              })}
            </div>
            {practiceFeedback === "wrong" && (
              <p style={{ color: "#F87171", fontSize: 13.5, marginTop: 16 }}>Боз кӯшиш кун</p>
            )}
          </div>
        </div>
        <VoiceModal lessonId={lesson.id} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <Navbar />
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "4rem 1rem", textAlign: "center" }}>
        <div className="glass-card fade-up-1" style={{ padding: "2.5rem 2rem" }}>
          <p style={{ fontSize: 56, margin: "0 0 12px" }}>🎉</p>
          <h1 style={{ color: "white", fontWeight: 600, fontSize: 22, margin: "0 0 6px" }}>Дарс тамом шуд!</h1>

          {completion?.xp_awarded && (
            <p style={{
              display: "inline-block", background: "rgba(251,191,36,0.12)", color: "#FBBF24",
              fontWeight: 700, fontSize: 16, padding: "6px 16px", borderRadius: 20, margin: "10px 0",
            }}>
              +10 XP
            </p>
          )}

          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13.5, margin: "0 0 26px" }}>
            🔥 Силсилаи рӯзҳо нигоҳ дошта шуд!
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={() => navigate(`/quiz/${lesson.id}`)}
              style={{ width: "100%", background: "#14B8A6", color: "#04231F", border: "none", borderRadius: 6, padding: "0.8rem", fontWeight: 600, fontSize: 14.5, cursor: "pointer" }}
            >
              Тест супоридан →
            </button>
            {nextLesson && (
              <button
                onClick={() => navigate(`/lessons/${nextLesson.id}`, { state: courseId && moduleId ? { courseId, moduleId } : undefined })}
                style={{ width: "100%", background: "rgba(255,255,255,0.06)", color: "white", border: "none", borderRadius: 6, padding: "0.8rem", fontWeight: 500, fontSize: 14.5, cursor: "pointer" }}
              >
                Дарси навбатӣ →
              </button>
            )}
            <button
              onClick={() => navigate("/courses")}
              style={{ width: "100%", background: "none", color: "rgba(255,255,255,0.45)", border: "none", borderRadius: 6, padding: "0.8rem", fontWeight: 500, fontSize: 14, cursor: "pointer" }}
            >
              Бозгашт ба курсҳо
            </button>
          </div>
        </div>
      </div>

      {completion?.level_up && !levelUpDismissed && (
        <LevelUpModal
          levelUp={completion.level_up}
          unlockedCourses={levelUpCourses}
          onClose={() => setLevelUpDismissed(true)}
        />
      )}

      <VoiceModal lessonId={lesson.id} />
    </div>
  );
}
