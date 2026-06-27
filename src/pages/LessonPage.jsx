import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import confetti from "canvas-confetti";
import Navbar from "../components/Navbar";
import VocabCard from "../components/VocabCard";
import api from "../api/axios";
import { extractVocab } from "../utils/extractVocab";
import { parseSections, emojiForLesson } from "../utils/lessonSections";
import { generatePracticeExercises } from "../utils/practiceExercises";

function readingTimeMinutes(content) {
  if (!content) return 1;
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

const markdownComponents = {
  h2: (props) => <h2 className="text-xl font-bold text-blue-700 mt-2 mb-3" {...props} />,
  h3: (props) => <h3 className="text-base font-bold text-blue-600 mt-2 mb-2" {...props} />,
  strong: (props) => <strong className="bg-gold/20 text-navy px-1 rounded font-semibold" {...props} />,
  p: (props) => <p className="mb-3" {...props} />,
  ul: (props) => <ul className="space-y-1.5 my-3 pl-0" {...props} />,
  li: (props) => (
    <li className="list-none bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 font-mono text-[13px] text-slate-600" {...props} />
  ),
};

export default function LessonPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { courseId, moduleId } = location.state || {};

  const [lesson, setLesson] = useState(null);
  const [siblings, setSiblings] = useState(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState("intro");
  const [readingIndex, setReadingIndex] = useState(0);
  const [understood, setUnderstood] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceSelected, setPracticeSelected] = useState(null);
  const [practiceFeedback, setPracticeFeedback] = useState(null);
  const [completion, setCompletion] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setStep("intro");
    setReadingIndex(0);
    setPracticeIndex(0);
    setCompletion(null);
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

  const lessonList = siblings || (lesson ? [lesson] : []);
  const positionIndex = lessonList.findIndex((l) => String(l.id) === String(id));
  const positionLabel =
    positionIndex >= 0 && lessonList.length > 0 ? `Lesson ${positionIndex + 1} of ${lessonList.length}` : "";
  const nextLesson = positionIndex >= 0 ? lessonList[positionIndex + 1] : null;

  const totalReadingSteps = sections.length + (vocab.length > 0 ? 1 : 0);
  const onVocabStep = readingIndex === sections.length && vocab.length > 0;

  useEffect(() => {
    setUnderstood(false);
  }, [readingIndex]);

  useEffect(() => {
    if (step === "complete" && lesson) {
      api
        .post(`/progress/complete-lesson/${lesson.id}`)
        .then((res) => setCompletion(res.data))
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
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-10 animate-pulse">
          <div className="h-8 w-64 bg-white rounded mb-6" />
          <div className="h-64 bg-white rounded-2xl shadow-card" />
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="text-center py-20 text-slate-400">Lesson not found / Урок не найден</div>
      </div>
    );
  }

  if (step === "intro") {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-16 text-center animate-slide-up">
          {positionLabel && (
            <span className="inline-block bg-slate-100 text-slate-500 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              {positionLabel}
            </span>
          )}
          <div className="text-6xl mb-4">{emoji}</div>
          <h1 className="text-2xl font-extrabold text-navy mb-6">{lesson.title}</h1>

          <div className="bg-white rounded-2xl shadow-card p-6 text-left mb-6">
            <p className="text-xs font-bold uppercase text-slate-400 mb-3">
              What you'll learn today / Что вы изучите
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span>✅</span> Key vocabulary for "{lesson.title}"
              </li>
              <li className="flex items-start gap-2">
                <span>✅</span> Real example sentences
              </li>
              <li className="flex items-start gap-2">
                <span>✅</span> A grammar tip to avoid common mistakes
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-center gap-3 mb-8 text-sm font-semibold">
            <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full">⏱ {minutes} minutes</span>
            <span className="bg-gold/15 text-gold-dark px-3 py-1.5 rounded-full">+10 XP</span>
          </div>

          <button
            onClick={() => setStep("reading")}
            className="w-full sm:w-auto px-10 py-3.5 rounded-xl font-semibold text-navy-dark bg-gradient-to-r from-gold-light to-gold shadow-lg shadow-gold/30 hover:shadow-gold/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            Start Lesson / Начать урок →
          </button>
        </div>
      </div>
    );
  }

  if (step === "reading") {
    const progress = Math.round(((readingIndex + 1) / Math.max(totalReadingSteps, 1)) * 100);
    const section = !onVocabStep ? sections[readingIndex] : null;

    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          <div className="mb-6">
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
              <span>
                Section {readingIndex + 1} / {totalReadingSteps}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-navy to-gold rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8 animate-slide-up" key={readingIndex}>
            {onVocabStep ? (
              <>
                <h2 className="text-lg font-bold text-navy mb-1">Vocabulary / Словарь</h2>
                <p className="text-xs text-slate-400 mb-4">Hover a card to flip it / Наведи, чтобы перевернуть</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {vocab.map((v, i) => (
                    <VocabCard key={i} word={v.word} translation={v.translation} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-[17px] leading-[1.8] text-slate-700">
                <ReactMarkdown components={markdownComponents}>
                  {(section.heading ? `## ${section.heading}\n` : "") + section.body}
                </ReactMarkdown>
              </div>
            )}

            {!onVocabStep && (
              <label className="flex items-center gap-2 mt-4 text-sm text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={understood}
                  onChange={(e) => setUnderstood(e.target.checked)}
                  className="w-4 h-4 accent-navy"
                />
                I understand this / Я понимаю это
              </label>
            )}

            <button
              onClick={() => {
                if (readingIndex + 1 < totalReadingSteps) {
                  setReadingIndex((i) => i + 1);
                } else {
                  setStep(exercises.length > 0 ? "practice" : "complete");
                }
              }}
              disabled={!onVocabStep && !understood}
              className="mt-6 w-full py-3 rounded-xl font-semibold text-navy-dark bg-gradient-to-r from-gold-light to-gold shadow-lg shadow-gold/30 hover:shadow-gold/50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {readingIndex + 1 < totalReadingSteps ? "Next / Далее →" : "Continue / Продолжить →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "practice") {
    const exercise = exercises[practiceIndex];
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex justify-between text-xs font-semibold text-slate-400 mb-4">
            <span>Mini Practice / Мини-практика</span>
            <span>
              {practiceIndex + 1} / {exercises.length}
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8" key={practiceIndex}>
            <p className="text-sm text-slate-400 mb-1">Fill in the blank / Заполни пропуск</p>
            <h2 className="text-lg font-bold text-navy mb-6">
              ___ means "{exercise.translation}"
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {exercise.options.map((opt) => {
                const isSelected = practiceSelected === opt;
                const isCorrect = isSelected && practiceFeedback === "correct";
                const isWrong = isSelected && practiceFeedback === "wrong";
                return (
                  <button
                    key={opt}
                    onClick={() => handlePracticeSelect(opt, exercise)}
                    className={`px-4 py-3.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                      isCorrect
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700 animate-pop"
                        : isWrong
                        ? "border-rose-400 bg-rose-50 text-rose-700 animate-[shake_0.4s_ease-in-out]"
                        : "border-slate-100 text-slate-700 hover:border-navy/30 hover:bg-slate-50"
                    }`}
                  >
                    {opt} {isCorrect && "✅"} {isWrong && "❌"}
                  </button>
                );
              })}
            </div>
            {practiceFeedback === "wrong" && (
              <p className="text-sm text-rose-500 mt-4">Try again / Попробуй ещё раз</p>
            )}
          </div>

          <style>{`
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-6px); }
              75% { transform: translateX(6px); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-16 text-center animate-slide-up">
        <div className="bg-white rounded-2xl shadow-soft p-10">
          <p className="text-6xl mb-4">🎉</p>
          <h1 className="text-2xl font-extrabold text-navy mb-1">Lesson Complete!</h1>
          <p className="text-slate-500 mb-6">Урок завершён!</p>

          {completion?.xp_awarded && (
            <p className="inline-block bg-gold/10 text-gold-dark text-lg font-bold px-4 py-2 rounded-full mb-4 animate-pop">
              +10 XP
            </p>
          )}

          <p className="text-sm text-slate-500 mb-8">
            🔥 Streak maintained — keep it up! / Серия продолжается!
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate(`/quiz/${lesson.id}`)}
              className="w-full py-3 rounded-xl font-semibold text-navy-dark bg-gradient-to-r from-gold-light to-gold shadow-lg shadow-gold/30 hover:shadow-gold/50 transition-all duration-200"
            >
              Take Quiz / Начать тест →
            </button>
            {nextLesson && (
              <button
                onClick={() =>
                  navigate(`/lessons/${nextLesson.id}`, {
                    state: courseId && moduleId ? { courseId, moduleId } : undefined,
                  })
                }
                className="w-full py-3 rounded-xl font-semibold text-navy bg-slate-100 hover:bg-slate-200 transition-all duration-200"
              >
                Continue to next lesson / Следующий урок →
              </button>
            )}
            <button
              onClick={() => navigate("/courses")}
              className="w-full py-3 rounded-xl font-semibold text-slate-500 hover:bg-slate-100 transition-all duration-200"
            >
              Back to courses / Назад к курсам
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
