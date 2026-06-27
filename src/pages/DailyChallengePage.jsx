import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import Navbar from "../components/Navbar";
import api from "../api/axios";

const QUESTION_SECONDS = 60;
const LAST_DATE_KEY = "daily_challenge_last_date";
const STREAK_KEY = "daily_streak";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function seededRandom(seedStr) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = (Math.imul(31, h) + seedStr.charCodeAt(i)) | 0;
  }
  let state = h >>> 0 || 1;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(arr, rand) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const MOCK_LEADERBOARD = [
  { name: "Aziz K.", score: 5 },
  { name: "Sara M.", score: 4 },
  { name: "Farrukh T.", score: 4 },
  { name: "Nilufar S.", score: 3 },
  { name: "Jasur R.", score: 3 },
];

export default function DailyChallengePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);
  const [finished, setFinished] = useState(false);
  const [streakBonus, setStreakBonus] = useState(false);
  const [streak, setStreak] = useState(Number(localStorage.getItem(STREAK_KEY) || 0));
  const timerRef = useRef(null);
  const confettiFired = useRef(false);

  useEffect(() => {
    async function loadPool() {
      try {
        const coursesRes = await api.get("/courses/");
        const courses = coursesRes.data;

        const modulesByCourse = await Promise.all(
          courses.map((c) => api.get(`/courses/${c.id}/modules`).then((r) => r.data.map((m) => ({ ...m, courseId: c.id }))))
        );
        const modules = modulesByCourse.flat();

        const lessonsByModule = await Promise.all(
          modules.map((m) =>
            api
              .get(`/courses/${m.courseId}/modules/${m.id}/lessons`)
              .then((r) => r.data)
              .catch(() => [])
          )
        );
        const lessons = lessonsByModule.flat();

        const quizzesByLesson = await Promise.all(
          lessons.map((l) =>
            api
              .get(`/quiz/${l.id}`)
              .then((r) => r.data.map((q) => ({ ...q, lesson_id: l.id })))
              .catch(() => [])
          )
        );
        const pool = quizzesByLesson.flat();

        const rand = seededRandom(todayKey());
        const picked = seededShuffle(pool, rand).slice(0, 5);
        setQuestions(picked);
      } finally {
        setLoading(false);
      }
    }
    loadPool();
  }, []);

  useEffect(() => {
    if (loading || finished || questions.length === 0) return;
    clearInterval(timerRef.current);
    setTimeLeft(QUESTION_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          goNext(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, loading, questions.length, finished]);

  function goNext(answerKey) {
    const q = questions[index];
    if (answerKey && q && answerKey.toLowerCase() === q.correct_answer?.toLowerCase()) {
      setScore((s) => s + 1);
    }
    setSelected(null);
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
    } else {
      finishChallenge();
    }
  }

  function finishChallenge() {
    clearInterval(timerRef.current);
    setFinished(true);

    const last = localStorage.getItem(LAST_DATE_KEY);
    const today = todayKey();
    if (last !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const newStreak = last === yesterday ? streak + 1 : 1;
      setStreak(newStreak);
      setStreakBonus(true);
      localStorage.setItem(STREAK_KEY, String(newStreak));
      localStorage.setItem(LAST_DATE_KEY, today);
    }
  }

  function handleAnswer(key) {
    if (selected) return;
    setSelected(key);
    setTimeout(() => goNext(key), 350);
  }

  useEffect(() => {
    if (finished && !confettiFired.current) {
      confettiFired.current = true;
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
    }
  }, [finished]);

  const shareText = `I scored ${score}/${questions.length} on ZaboniAI Daily Challenge! 🎯`;
  const optionKeys = ["a", "b", "c", "d"];
  const yourPosition = [...MOCK_LEADERBOARD, { name: "You", score }]
    .sort((a, b) => b.score - a.score)
    .findIndex((e) => e.name === "You") + 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 animate-pulse">
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
          No quiz questions available yet for today's challenge / Пока нет вопросов для сегодняшнего вызова
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16 text-center animate-slide-up">
          <div className="bg-white rounded-2xl shadow-soft p-10">
            <p className="text-5xl mb-3">🎯</p>
            <h1 className="text-2xl font-extrabold text-navy mb-1">
              {score}/{questions.length}
            </h1>
            <p className="text-slate-500 mb-2">Daily Challenge complete! / Ежедневный вызов завершён!</p>

            {streakBonus && (
              <p className="inline-block bg-gold/10 text-gold-dark text-sm font-semibold px-3 py-1.5 rounded-full mb-4">
                🔥 +10 streak bonus — {streak} day streak!
              </p>
            )}

            <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs font-bold uppercase text-slate-400 mb-2">Leaderboard / Таблица лидеров</p>
              {[...MOCK_LEADERBOARD, { name: "You", score, isYou: true }]
                .sort((a, b) => b.score - a.score)
                .map((entry, i) => (
                  <div
                    key={entry.name}
                    className={`flex justify-between text-sm py-1 ${
                      entry.isYou ? "font-bold text-navy" : "text-slate-500"
                    }`}
                  >
                    <span>
                      #{i + 1} {entry.name}
                    </span>
                    <span>{entry.score}/5</span>
                  </div>
                ))}
              <p className="text-xs text-slate-400 mt-2">Your position / Твоя позиция: #{yourPosition}</p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  if (navigator.share) navigator.share({ text: shareText }).catch(() => {});
                  else navigator.clipboard?.writeText(shareText);
                }}
                className="w-full py-3 rounded-xl font-semibold text-navy-dark bg-gradient-to-r from-gold-light to-gold shadow-lg shadow-gold/30 hover:shadow-gold/50 transition-all duration-200"
              >
                Share result / Поделиться
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

  const q = questions[index];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-extrabold text-navy">⚡ Daily Challenge</h1>
          <span
            className={`text-sm font-bold px-3 py-1.5 rounded-full ${
              timeLeft <= 10 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
            }`}
          >
            ⏱ {timeLeft}s
          </span>
        </div>

        <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
          <span>
            Question {index + 1} / {questions.length}
          </span>
          <span>Score: {score}</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-gradient-to-r from-navy to-gold rounded-full transition-all duration-500"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8" key={q.id}>
          <h2 className="text-lg font-bold text-navy mb-6">{q.question}</h2>
          <div className="space-y-3">
            {optionKeys.map((key) => {
              const text = q[`option_${key}`];
              if (!text) return null;
              const isSelected = selected === key;
              return (
                <button
                  key={key}
                  disabled={!!selected}
                  onClick={() => handleAnswer(key)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${
                    isSelected
                      ? "border-gold bg-gold/10 scale-[1.01]"
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
      </div>
    </div>
  );
}
