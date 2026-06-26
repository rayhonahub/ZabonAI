import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

const optionKeys = ["a", "b", "c", "d"];

function resultEmoji(score) {
  if (score >= 80) return "🎉";
  if (score >= 60) return "👍";
  return "💪";
}

function resultMessage(score) {
  if (score >= 80) return "Excellent! / Отлично!";
  if (score >= 60) return "Good job! / Хорошая работа!";
  return "Keep practicing! / Продолжай практиковаться!";
}

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/quiz/${id}`)
      .then((res) => setQuestions(res.data))
      .catch(() => setQuestions([]));
  }, [id]);

  function selectOption(questionId, key) {
    if (selected) return;
    setSelected(key);
    const updated = { ...answers, [questionId]: key };
    setAnswers(updated);

    setTimeout(() => {
      if (index + 1 < questions.length) {
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
    } catch (err) {
      setError(err.response?.data?.detail || "Could not submit quiz / Не удалось отправить тест");
    } finally {
      setSubmitting(false);
    }
  }

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

  if (result) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16 text-center animate-slide-up">
          <div className="bg-white rounded-2xl shadow-soft p-10">
            <div className="text-6xl mb-4">{resultEmoji(result.score)}</div>
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
              <button
                onClick={() => navigate(`/lessons/${id}`)}
                className="w-full py-3 rounded-xl font-semibold text-navy-dark bg-gradient-to-r from-gold-light to-gold shadow-lg shadow-gold/30 hover:shadow-gold/50 transition-all duration-200"
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
        </div>
      </div>
    );
  }

  const question = questions[index];
  const progress = Math.round(((index + (selected ? 1 : 0)) / questions.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
            <span>
              Question {index + 1} / {questions.length}
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
