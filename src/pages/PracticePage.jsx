import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { WORD_PAIRS, FILL_GAP_SENTENCES } from "../data/practiceWords";
import { usePageTitle } from "../hooks/usePageTitle";

const TABS = [
  { key: "match", label: "Word Match", sub: "Карточки" },
  { key: "gap", label: "Fill the Gap", sub: "Заполни пропуск" },
  { key: "spelling", label: "Spelling Bee", sub: "Орфография" },
];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const BEST_TIME_KEY = "word_match_best_time";

function WordMatchGame() {
  const [pairs, setPairs] = useState(() => shuffle(WORD_PAIRS).slice(0, 3));
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [done, setDone] = useState(false);
  const [bestTime, setBestTime] = useState(() => {
    const stored = localStorage.getItem(BEST_TIME_KEY);
    return stored ? Number(stored) : null;
  });
  const intervalRef = useRef(null);

  useEffect(() => {
    const built = [];
    pairs.forEach((p, i) => {
      built.push({ id: `en-${i}`, pairId: i, text: p.word });
      built.push({ id: `ru-${i}`, pairId: i, text: p.translation });
    });
    setCards(shuffle(built));
  }, [pairs]);

  useEffect(() => {
    if (done) return;
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(intervalRef.current);
  }, [done]);

  useEffect(() => {
    if (matched.length === pairs.length && pairs.length > 0) {
      setDone(true);
      clearInterval(intervalRef.current);
      if (bestTime === null || seconds < bestTime) {
        localStorage.setItem(BEST_TIME_KEY, String(seconds));
        setBestTime(seconds);
      }
    }
  }, [matched, pairs.length, seconds, bestTime]);

  function handleFlip(card) {
    if (done || wrongFlash || matched.includes(card.pairId) || flipped.some((c) => c.id === card.id)) return;
    if (flipped.length === 0) {
      setFlipped([card]);
      return;
    }
    const first = flipped[0];
    if (first.pairId === card.pairId) {
      setMatched((m) => [...m, card.pairId]);
      setFlipped([]);
    } else {
      setFlipped([first, card]);
      setWrongFlash(true);
      setTimeout(() => {
        setFlipped([]);
        setWrongFlash(false);
      }, 700);
    }
  }

  function reset() {
    setPairs(shuffle(WORD_PAIRS).slice(0, 3));
    setFlipped([]);
    setMatched([]);
    setSeconds(0);
    setDone(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 text-sm font-semibold text-slate-500">
        <span>⏱ {seconds}s</span>
        <span>🏆 Best / Лучшее: {bestTime !== null ? `${bestTime}s` : "—"}</span>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {cards.map((card) => {
          const isFlipped = flipped.some((c) => c.id === card.id) || matched.includes(card.pairId);
          const isWrong = wrongFlash && flipped.some((c) => c.id === card.id);
          const isMatched = matched.includes(card.pairId);
          return (
            <button
              key={card.id}
              onClick={() => handleFlip(card)}
              className={`h-20 rounded-xl text-sm font-semibold flex items-center justify-center text-center px-2 transition-all duration-200 ${
                isMatched
                  ? "bg-emerald-50 border-2 border-emerald-300 text-emerald-600"
                  : isWrong
                  ? "bg-rose-50 border-2 border-rose-300 text-rose-600"
                  : isFlipped
                  ? "bg-navy text-white border-2 border-navy"
                  : "bg-white border-2 border-slate-100 hover:border-navy/30 text-slate-300"
              }`}
            >
              {isFlipped ? card.text : "❓"}
            </button>
          );
        })}
      </div>
      {done && (
        <div className="text-center bg-gold/10 rounded-xl p-4 animate-pop">
          <p className="font-bold text-navy mb-2">🎉 Matched in {seconds}s!</p>
          <button
            onClick={reset}
            className="px-5 py-2 rounded-lg font-semibold text-sm text-navy-dark bg-gradient-to-r from-gold-light to-gold"
          >
            Play again / Играть снова
          </button>
        </div>
      )}
    </div>
  );
}

function FillGapGame() {
  const [sentences, setSentences] = useState(() => shuffle(FILL_GAP_SENTENCES));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const current = sentences[index];

  function handleSelect(option) {
    if (feedback) return;
    const correct = option === current.answer;
    setSelected(option);
    setFeedback(correct ? "correct" : "wrong");
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      if (index + 1 < sentences.length) {
        setIndex((i) => i + 1);
        setSelected(null);
        setFeedback(null);
      } else {
        setDone(true);
      }
    }, 600);
  }

  function reset() {
    setSentences(shuffle(FILL_GAP_SENTENCES));
    setIndex(0);
    setSelected(null);
    setFeedback(null);
    setScore(0);
    setDone(false);
  }

  if (done) {
    return (
      <div className="text-center bg-gold/10 rounded-xl p-6 animate-pop">
        <p className="font-bold text-navy text-lg mb-2">
          {score}/{sentences.length} correct!
        </p>
        <button
          onClick={reset}
          className="px-5 py-2 rounded-lg font-semibold text-sm text-navy-dark bg-gradient-to-r from-gold-light to-gold"
        >
          Play again / Играть снова
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between text-xs font-semibold text-slate-400 mb-3">
        <span>
          {index + 1} / {sentences.length}
        </span>
        <span>Score: {score}</span>
      </div>
      <p className="text-lg font-bold text-navy mb-5">{current.sentence}</p>
      <div className="grid grid-cols-2 gap-3">
        {current.options.map((opt) => {
          const isSelected = selected === opt;
          const isCorrect = isSelected && feedback === "correct";
          const isWrong = isSelected && feedback === "wrong";
          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={!!feedback}
              className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                isCorrect
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : isWrong
                  ? "border-rose-400 bg-rose-50 text-rose-700 animate-[shake_0.4s_ease-in-out]"
                  : "border-slate-100 text-slate-700 hover:border-navy/30 hover:bg-slate-50"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

function SpellingBeeGame() {
  const [pool] = useState(() => shuffle(WORD_PAIRS));
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const current = pool[index];

  function handleSubmit() {
    if (feedback || !value.trim()) return;
    const correct = value.trim().toLowerCase() === current.word.toLowerCase();
    setFeedback(correct ? "correct" : "wrong");
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      if (index + 1 < pool.length) {
        setIndex((i) => i + 1);
        setValue("");
        setFeedback(null);
      } else {
        setDone(true);
      }
    }, correct ? 600 : 1400);
  }

  function reset() {
    setIndex(0);
    setValue("");
    setFeedback(null);
    setScore(0);
    setDone(false);
  }

  if (done) {
    return (
      <div className="text-center bg-gold/10 rounded-xl p-6 animate-pop">
        <p className="font-bold text-navy text-lg mb-2">
          {score}/{pool.length} correct!
        </p>
        <button
          onClick={reset}
          className="px-5 py-2 rounded-lg font-semibold text-sm text-navy-dark bg-gradient-to-r from-gold-light to-gold"
        >
          Play again / Играть снова
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="flex justify-between text-xs font-semibold text-slate-400 mb-3">
        <span>
          {index + 1} / {pool.length}
        </span>
        <span>Score: {score}</span>
      </div>
      <div className="text-5xl mb-2">{current.emoji}</div>
      <p className="text-lg font-bold text-navy mb-5">{current.translation}</p>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        disabled={!!feedback}
        autoFocus
        placeholder="Type the English word..."
        className={`w-full max-w-xs mx-auto px-4 py-3 rounded-xl border-2 text-center text-sm font-semibold outline-none transition-all duration-200 ${
          feedback === "correct"
            ? "border-emerald-400 bg-emerald-50 text-emerald-700"
            : feedback === "wrong"
            ? "border-rose-400 bg-rose-50 text-rose-700"
            : "border-slate-200 focus:border-navy"
        }`}
      />
      {feedback === "wrong" && (
        <p className="text-sm text-rose-500 mt-2">Correct answer / Правильный ответ: {current.word}</p>
      )}
      <button
        onClick={handleSubmit}
        disabled={!!feedback}
        className="mt-4 px-6 py-2.5 rounded-xl font-semibold text-sm text-navy-dark bg-gradient-to-r from-gold-light to-gold disabled:opacity-50"
      >
        Check / Проверить
      </button>
    </div>
  );
}

export default function PracticePage() {
  usePageTitle("Practice");
  const [activeTab, setActiveTab] = useState("match");

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-extrabold text-navy mb-1">Word Practice 🎮</h1>
        <p className="text-slate-500 mb-6">Практика слов</p>

        <div className="flex gap-1 bg-white rounded-xl shadow-card p-1.5 mb-6 w-full sm:w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === t.key ? "bg-navy text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8" key={activeTab}>
          {activeTab === "match" && <WordMatchGame />}
          {activeTab === "gap" && <FillGapGame />}
          {activeTab === "spelling" && <SpellingBeeGame />}
        </div>
      </div>
    </div>
  );
}
