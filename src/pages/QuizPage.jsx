import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import confetti from "canvas-confetti";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { showToast } from "../utils/toastBus";
import { usePageTitle } from "../hooks/usePageTitle";

const optionKeys = ["a", "b", "c", "d"];

function resultEmoji(score) {
  if (score >= 80) return "🎉";
  if (score >= 60) return "👍";
  return "😢";
}

function resultMessage(score) {
  if (score >= 80) return "Excellent! / Отлично!";
  if (score >= 60) return "Good job! / Хорошая работа!";
  return "Keep practicing! / Продолжай практиковаться!";
}

export default function QuizPage() {
  usePageTitle("Quiz");
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
      showToast("ℹ️ Quiz saved / Тест сохранён", "info");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not submit quiz / Не удалось отправить тест");
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
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 animate-pulse">
          <div className="h-3 bg-white rounded-full mb-8" />
          <div className="h-56 bg-white rounded-2xl shadow-card" />
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="text-center py-20 text-slate-400">
          No quiz available for this lesson / Тест для этого урока недоступен
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
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-bold text-navy">
              Practice Wrong Answers / Практика ошибок
            </h1>
            <span className="text-xs font-semibold text-slate-400">
              {practiceIndex + 1} / {wrongResults.length}
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8" key={pq.question_id}>
            <h2 className="text-lg font-bold text-navy mb-6">{pq.question}</h2>
            <div className="space-y-3">
              {optionKeys.map((key) => {
                const text = original?.[`option_${key}`];
                if (!text) return null;
                const isSelected = practiceSelected === key;
                const isCorrectKey = key.toLowerCase() === pq.correct_answer.toLowerCase();
                const showFeedback = !!practiceSelected;
                return (
                  <button
                    key={key}
                    disabled={showFeedback}
                    onClick={() => setPracticeSelected(key)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all duration-200 disabled:cursor-default ${
                      showFeedback && isCorrectKey
                        ? "border-emerald-400 bg-emerald-50"
                        : showFeedback && isSelected
                        ? "border-rose-400 bg-rose-50 animate-[shake_0.4s_ease-in-out]"
                        : "border-slate-100 hover:border-navy/30 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 ${
                        showFeedback && isCorrectKey
                          ? "bg-emerald-500 text-white"
                          : showFeedback && isSelected
                          ? "bg-rose-500 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {key.toUpperCase()}
                    </span>
                    <span className="text-sm text-slate-700">{text}</span>
                    {showFeedback && isCorrectKey && <span className="ml-auto">✅</span>}
                    {showFeedback && isSelected && !isCorrectKey && <span className="ml-auto">❌</span>}
                  </button>
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
                className="mt-6 w-full py-3 rounded-xl font-semibold text-navy-dark bg-gradient-to-r from-gold-light to-gold shadow-lg shadow-gold/30 hover:shadow-gold/50 transition-all duration-200"
              >
                {practiceIndex + 1 < wrongResults.length ? "Next / Далее →" : "Finish / Закончить"}
              </button>
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

  if (mode === "result" && result) {
    const failed = result.score < 60;
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 animate-slide-up">
          <div className="bg-white rounded-2xl shadow-soft p-10 text-center mb-6">
            <div className={`text-6xl mb-4 ${failed ? "animate-[droop_0.6s_ease-in-out]" : ""}`}>
              {resultEmoji(result.score)}
            </div>
            <h1 className="text-3xl font-extrabold text-navy mb-1">{result.score}%</h1>
            <p className="text-slate-500 mb-6">{resultMessage(result.score)}</p>

            <div className="flex justify-center gap-6 mb-6 text-sm">
              <div>
                <p className="text-2xl font-bold text-navy">{result.correct}</p>
                <p className="text-slate-400">Correct / Верно</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-navy">{result.total}</p>
                <p className="text-slate-400">Total / Всего</p>
              </div>
            </div>

            {result.weak_topic && (
              <div className="bg-rose-50 text-rose-600 text-sm rounded-lg px-4 py-3 mb-6">
                This topic needs more practice / Эта тема требует больше практики
              </div>
            )}

            <div className="flex flex-col gap-2">
              {failed && (
                <button
                  onClick={restartQuiz}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-rose-500 hover:bg-rose-600 transition-all duration-200"
                >
                  Try Again / Попробовать снова
                </button>
              )}
              {wrongResults.length > 0 && (
                <button
                  onClick={startPracticeWrong}
                  className="w-full py-3 rounded-xl font-semibold text-navy-dark bg-gradient-to-r from-gold-light to-gold shadow-lg shadow-gold/30 hover:shadow-gold/50 transition-all duration-200"
                >
                  Practice Wrong Answers / Практика ошибок ({wrongResults.length})
                </button>
              )}
              <button
                onClick={() => navigate(`/lessons/${id}`)}
                className="w-full py-3 rounded-xl font-semibold text-navy bg-slate-100 hover:bg-slate-200 transition-all duration-200"
              >
                Back to lesson / Назад к уроку
              </button>
              <button
                onClick={() => navigate("/progress")}
                className="w-full py-3 rounded-xl font-semibold text-navy bg-slate-100 hover:bg-slate-200 transition-all duration-200"
              >
                View progress / Посмотреть прогресс
              </button>
            </div>
          </div>

          {result.results?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
              <h2 className="text-lg font-bold text-navy mb-1">Review Mistakes</h2>
              <p className="text-sm text-slate-400 mb-5">Разбор ответов</p>

              <div className="space-y-3">
                {result.results.map((r) => (
                  <div
                    key={r.question_id}
                    className={`rounded-xl border-2 p-4 ${
                      r.is_correct ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-navy mb-2">
                      {r.is_correct ? "✅" : "❌"} {r.question}
                    </p>
                    {!r.is_correct && (
                      <p className="text-sm text-rose-600 mb-1">
                        Your answer / Твой ответ: {r.user_option_text || "—"}
                      </p>
                    )}
                    <p className="text-sm text-emerald-700">
                      Correct answer / Правильный ответ: {r.correct_option_text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <style>{`
            @keyframes droop {
              0% { transform: translateY(0) rotate(0deg); }
              50% { transform: translateY(6px) rotate(-8deg); }
              100% { transform: translateY(0) rotate(0deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  const question = activeSet[index];
  const progress = Math.round(((index + (selected ? 1 : 0)) / activeSet.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>
              Question {index + 1} / {activeSet.length}
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

        {error && (
          <div className="mb-4 text-sm bg-red-50 text-red-600 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8 animate-slide-up" key={question.id}>
          <h2 className="text-lg font-bold text-navy mb-6">{question.question}</h2>

          <div className="space-y-3">
            {optionKeys.map((key) => {
              const text = question[`option_${key}`];
              if (!text) return null;
              const isSelected = selected === key;
              return (
                <button
                  key={key}
                  disabled={!!selected || submitting}
                  onClick={() => selectOption(question.id, key)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${
                    isSelected
                      ? "border-gold bg-gold/10 scale-[1.01] animate-pop"
                      : "border-slate-100 hover:border-navy/30 hover:bg-slate-50"
                  } disabled:cursor-default`}
                >
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 ${
                      isSelected ? "bg-gold text-navy-dark" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {key.toUpperCase()}
                  </span>
                  <span className="text-sm text-slate-700">{text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {submitting && (
          <p className="text-center text-sm text-slate-400 mt-4">Submitting... / Отправка...</p>
        )}
      </div>
    </div>
  );
}
