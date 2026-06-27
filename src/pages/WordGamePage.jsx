import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { extractVocab } from "../utils/extractVocab";

const DEFAULT_WORDS = [
  { word: "hello", translation: "привет" },
  { word: "book", translation: "книга" },
  { word: "water", translation: "вода" },
  { word: "house", translation: "дом" },
  { word: "friend", translation: "друг" },
  { word: "learn", translation: "учить" },
];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildCards(pairs) {
  const cards = [];
  pairs.forEach((p, i) => {
    cards.push({ id: `en-${i}`, pairId: i, type: "en", text: p.word });
    cards.push({ id: `ru-${i}`, pairId: i, type: "ru", text: p.translation });
  });
  return shuffle(cards);
}

export default function WordGamePage() {
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get("lesson_id");

  const [pairs, setPairs] = useState(DEFAULT_WORDS);
  const [loadingWords, setLoadingWords] = useState(!!lessonId);
  const [cards, setCards] = useState(() => buildCards(DEFAULT_WORDS));
  const [selected, setSelected] = useState(null);
  const [wrongIds, setWrongIds] = useState([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!lessonId) return;
    api
      .get(`/courses/lessons/${lessonId}`)
      .then((res) => {
        const extracted = extractVocab(res.data.content).slice(0, 6);
        if (extracted.length >= 4) {
          setPairs(extracted);
          setCards(buildCards(extracted));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingWords(false));
  }, [lessonId]);

  useEffect(() => {
    if (gameOver || loadingWords) return;
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(intervalRef.current);
  }, [gameOver, loadingWords]);

  useEffect(() => {
    if (matchedCount === pairs.length && pairs.length > 0) {
      setGameOver(true);
      clearInterval(intervalRef.current);
    }
  }, [matchedCount, pairs.length]);

  function resetGame() {
    setCards(buildCards(pairs));
    setSelected(null);
    setWrongIds([]);
    setMatchedCount(0);
    setSeconds(0);
    setGameOver(false);
  }

  function handleCardClick(card) {
    if (gameOver || card.matched || wrongIds.length > 0) return;

    if (!selected) {
      setSelected(card);
      return;
    }

    if (selected.id === card.id) {
      setSelected(null);
      return;
    }

    if (selected.pairId === card.pairId && selected.type !== card.type) {
      setCards((prev) =>
        prev.map((c) => (c.pairId === card.pairId ? { ...c, matched: true } : c))
      );
      setMatchedCount((n) => n + 1);
      setSelected(null);
    } else {
      setWrongIds([selected.id, card.id]);
      setTimeout(() => {
        setWrongIds([]);
        setSelected(null);
      }, 500);
    }
  }

  function cardState(card) {
    if (card.matched) return "matched";
    if (wrongIds.includes(card.id)) return "wrong";
    if (selected?.id === card.id) return "selected";
    return "idle";
  }

  const shareText = `I matched ${matchedCount}/${pairs.length} pairs in ${seconds}s on ZaboniAI Word Game! 🎮`;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-extrabold text-navy mb-1">Word Match 🎮</h1>
        <p className="text-slate-500 mb-6">Сопоставь слова с переводом</p>

        {loadingWords ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-xl shadow-card animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5 bg-white rounded-2xl shadow-card px-5 py-3">
              <div className="text-sm font-semibold text-slate-500">
                Score / Очки: <span className="text-navy font-bold">{matchedCount}</span>/{pairs.length}
              </div>
              <div className="text-sm font-semibold text-slate-500">
                ⏱ <span className="text-navy font-bold">{seconds}s</span>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {cards.map((card) => {
                const state = cardState(card);
                return (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    disabled={card.matched}
                    className={`h-20 rounded-xl px-2 text-sm font-semibold flex items-center justify-center text-center transition-all duration-200 border-2 ${
                      state === "matched"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-600 opacity-0 scale-90 pointer-events-none"
                        : state === "wrong"
                        ? "bg-red-50 border-red-300 text-red-600 animate-[shake_0.4s_ease-in-out]"
                        : state === "selected"
                        ? "bg-navy border-navy text-white shadow-md scale-105"
                        : "bg-white border-slate-100 text-slate-700 hover:border-navy/30 hover:-translate-y-0.5"
                    }`}
                  >
                    {card.text}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {gameOver && (
          <div className="fixed inset-0 bg-navy/60 flex items-center justify-center px-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-soft p-8 max-w-sm w-full text-center animate-slide-up">
              <p className="text-5xl mb-3">🎉</p>
              <h2 className="text-xl font-extrabold text-navy mb-1">Well done!</h2>
              <p className="text-slate-500 mb-6">
                You matched {matchedCount}/{pairs.length} pairs in {seconds} seconds!
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ text: shareText }).catch(() => {});
                    } else {
                      navigator.clipboard?.writeText(shareText);
                    }
                  }}
                  className="w-full py-3 rounded-xl font-semibold text-navy-dark bg-gradient-to-r from-gold-light to-gold shadow-lg shadow-gold/30 hover:shadow-gold/50 transition-all duration-200"
                >
                  Share result / Поделиться
                </button>
                <button
                  onClick={resetGame}
                  className="w-full py-3 rounded-xl font-semibold text-navy bg-slate-100 hover:bg-slate-200 transition-all duration-200"
                >
                  Play again / Играть снова
                </button>
              </div>
            </div>
          </div>
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
  );
}
