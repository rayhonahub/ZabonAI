import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { extractVocab } from "../utils/extractVocab";
import { usePageTitle } from "../hooks/usePageTitle";

const BG = "linear-gradient(160deg, #061A1C 0%, #0A2A2E 45%, #0E3A3F 100%)";

const DEFAULT_WORDS = [
  { word: "hello", translation: "салом" },
  { word: "book", translation: "китоб" },
  { word: "water", translation: "об" },
  { word: "house", translation: "хона" },
  { word: "friend", translation: "дӯст" },
  { word: "school", translation: "мактаб" },
  { word: "teacher", translation: "муаллим" },
  { word: "student", translation: "донишҷӯ" },
  { word: "family", translation: "оила" },
  { word: "apple", translation: "себ" },
  { word: "sun", translation: "офтоб" },
  { word: "learn", translation: "омӯхтан" },
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
    cards.push({ id: `tj-${i}`, pairId: i, type: "tj", text: p.translation });
  });
  return shuffle(cards);
}

const cardBaseStyle = {
  minHeight: 70,
  borderRadius: 6,
  fontSize: 15,
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "20px 16px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(45,212,191,0.15)",
  color: "white",
};

function cardStyleFor(state) {
  if (state === "matched") {
    return { ...cardBaseStyle, border: "1px solid #14B8A6", background: "rgba(20,184,166,0.12)", color: "rgba(255,255,255,0.4)", cursor: "default" };
  }
  if (state === "wrong") {
    return { ...cardBaseStyle, border: "2px solid #EF4444", background: "rgba(239,68,68,0.1)" };
  }
  if (state === "selected") {
    return { ...cardBaseStyle, border: "2px solid #2DD4BF", background: "rgba(45,212,191,0.15)", color: "#2DD4BF" };
  }
  return cardBaseStyle;
}

export default function WordGamePage() {
  usePageTitle("Бозии калимаҳо");
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
  const [hoveredId, setHoveredId] = useState(null);
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
      }, 600);
    }
  }

  function cardState(card) {
    if (card.matched) return "matched";
    if (wrongIds.includes(card.id)) return "wrong";
    if (selected?.id === card.id) return "selected";
    return "idle";
  }

  const shareText = `Ман ${matchedCount}/${pairs.length} ҷуфтро дар ${seconds} сония дар ZaboniAI пайдо кардам! 🎮`;

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 style={{ color: "white", fontWeight: 500, fontSize: 24, margin: "0 0 4px" }}>Калима пайдо кун 🎮</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 24 }}>
          Калимаро бо тарҷумааш пайваст кун
        </p>

        {loadingWords ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 80,
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(45,212,191,0.15)",
                }}
                className="animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(45,212,191,0.2)",
                borderRadius: 6,
                padding: "12px 20px",
                color: "white",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                Натиҷа: <span>{matchedCount}</span>/{pairs.length}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#2DD4BF" }}>
                ⏱ {seconds}
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {cards.map((card) => {
                const state = cardState(card);
                const isHovered = hoveredId === card.id && state === "idle";
                const style = isHovered
                  ? { ...cardStyleFor(state), border: "1px solid rgba(45,212,191,0.5)", background: "rgba(45,212,191,0.08)", transform: "translateY(-2px)" }
                  : cardStyleFor(state);
                return (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    onMouseEnter={() => setHoveredId(card.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    disabled={card.matched}
                    style={style}
                  >
                    {card.text}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {gameOver && (
          <div className="fixed inset-0 flex items-center justify-center px-4 z-50" style={{ background: "rgba(6,26,28,0.75)" }}>
            <div className="glass-card" style={{ padding: 32, maxWidth: 380, width: "100%", textAlign: "center" }}>
              <p style={{ fontSize: 44, margin: "0 0 8px" }}>🏆</p>
              <h2 style={{ color: "white", fontWeight: 700, fontSize: 20, margin: "0 0 4px" }}>Шумо ғалаба кардед!</h2>
              <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>
                Шумо <span style={{ color: "#2DD4BF", fontWeight: 700 }}>{matchedCount}/{pairs.length}</span> ҷуфтро дар {seconds} сония пайдо кардед!
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
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 14,
                    border: "1px solid rgba(45,212,191,0.3)",
                    background: "rgba(45,212,191,0.1)",
                    color: "#2DD4BF",
                    cursor: "pointer",
                  }}
                >
                  Мубодила кардани натиҷа
                </button>
                <button
                  onClick={resetGame}
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 14,
                    border: "none",
                    background: "#14B8A6",
                    color: "#04231F",
                    cursor: "pointer",
                  }}
                >
                  Боз бозӣ кун
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
