import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { WORD_PAIRS, FILL_GAP_SENTENCES } from "../data/practiceWords";
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
];

const TABS = [
  { key: "match", label: "Калима пайдо кун", sub: "Кортҳо" },
  { key: "gap", label: "Холро пур кун", sub: "Ҷои холиро пур кун" },
  { key: "spelling", label: "Ҳиҷокунӣ", sub: "Имло" },
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

const cardBaseStyle = {
  height: 80,
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "0 8px",
  cursor: "pointer",
  transition: "all 0.2s",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(45,212,191,0.2)",
  color: "white",
};

function cardStyle({ isMatched, isWrong, isFlipped }) {
  if (isMatched) {
    return { ...cardBaseStyle, border: "1px solid #14B8A6", background: "rgba(20,184,166,0.15)", color: "#14B8A6", opacity: 0.6 };
  }
  if (isWrong) {
    return { ...cardBaseStyle, border: "1.5px solid #F87171", background: "rgba(248,113,113,0.1)", color: "#F87171" };
  }
  if (isFlipped) {
    return { ...cardBaseStyle, border: "2px solid #2DD4BF", background: "rgba(45,212,191,0.1)", color: "#2DD4BF" };
  }
  return { ...cardBaseStyle, color: "rgba(255,255,255,0.35)" };
}

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
      built.push({ id: `tj-${i}`, pairId: i, text: p.translation });
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, fontSize: 13.5, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
        <span>⏱ {seconds} сония</span>
        <span>🏆 Рекорд: {bestTime !== null ? `${bestTime} сония` : "—"}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        {cards.map((card) => {
          const isFlipped = flipped.some((c) => c.id === card.id) || matched.includes(card.pairId);
          const isWrong = wrongFlash && flipped.some((c) => c.id === card.id);
          const isMatched = matched.includes(card.pairId);
          return (
            <button key={card.id} onClick={() => handleFlip(card)} style={cardStyle({ isMatched, isWrong, isFlipped })}>
              {isFlipped ? card.text : "❓"}
            </button>
          );
        })}
      </div>
      {done && (
        <div className="glass-card" style={{ textAlign: "center", padding: 20 }}>
          <p style={{ color: "#2DD4BF", fontWeight: 700, fontSize: 15, margin: "0 0 12px" }}>
            🎉 Дар {seconds} сония ёфтед!
          </p>
          <button
            onClick={reset}
            style={{ background: "#14B8A6", color: "#04231F", border: "none", borderRadius: 6, padding: "10px 22px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            Аз нав
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
      <div className="glass-card" style={{ textAlign: "center", padding: 24 }}>
        <p style={{ color: "#2DD4BF", fontWeight: 700, fontSize: 17, margin: "0 0 12px" }}>
          {score}/{sentences.length} дуруст!
        </p>
        <button
          onClick={reset}
          style={{ background: "#14B8A6", color: "#04231F", border: "none", borderRadius: 6, padding: "10px 22px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
        >
          Аз нав
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>
        <span>{index + 1} / {sentences.length}</span>
        <span>Натиҷа: {score}</span>
      </div>
      <p style={{ color: "white", fontWeight: 600, fontSize: 17, marginBottom: 22 }}>{current.sentence}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {current.options.map((opt) => {
          const isSelected = selected === opt;
          const isCorrect = isSelected && feedback === "correct";
          const isWrong = isSelected && feedback === "wrong";
          let border = "1px solid rgba(45,212,191,0.2)";
          let bg = "rgba(255,255,255,0.05)";
          let color = "white";
          if (isCorrect) { border = "1px solid #14B8A6"; bg = "rgba(20,184,166,0.2)"; color = "#5EEAD4"; }
          if (isWrong) { border = "1px solid #EF4444"; bg = "rgba(239,68,68,0.1)"; color = "#F87171"; }
          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={!!feedback}
              style={{
                padding: "12px 16px", borderRadius: 6, fontSize: 14, fontWeight: 600,
                border, background: bg, color, cursor: feedback ? "default" : "pointer", transition: "all 0.2s",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
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
      <div className="glass-card" style={{ textAlign: "center", padding: 24 }}>
        <p style={{ color: "#2DD4BF", fontWeight: 700, fontSize: 17, margin: "0 0 12px" }}>
          {score}/{pool.length} дуруст!
        </p>
        <button
          onClick={reset}
          style={{ background: "#14B8A6", color: "#04231F", border: "none", borderRadius: 6, padding: "10px 22px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
        >
          Аз нав
        </button>
      </div>
    );
  }

  const inputBorder =
    feedback === "correct" ? "1px solid #14B8A6" : feedback === "wrong" ? "1px solid #EF4444" : "1px solid rgba(45,212,191,0.25)";
  const inputColor = feedback === "correct" ? "#5EEAD4" : feedback === "wrong" ? "#F87171" : "white";

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>
        <span>{index + 1} / {pool.length}</span>
        <span>Натиҷа: {score}</span>
      </div>
      <div style={{ fontSize: 48, marginBottom: 8 }}>{current.emoji}</div>
      <p style={{ color: "white", fontWeight: 600, fontSize: 17, marginBottom: 22 }}>{current.translation}</p>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        disabled={!!feedback}
        autoFocus
        placeholder="Калимаи англисиро нависед..."
        style={{
          width: "100%", maxWidth: 280, margin: "0 auto", padding: "12px 16px", borderRadius: 6,
          border: inputBorder, background: "rgba(255,255,255,0.05)", color: inputColor,
          textAlign: "center", fontSize: 14, fontWeight: 600, outline: "none",
        }}
      />
      {feedback === "wrong" && (
        <p style={{ color: "#F87171", fontSize: 13.5, marginTop: 10 }}>Ҷавоби дуруст: {current.word}</p>
      )}
      <div>
        <button
          onClick={handleSubmit}
          disabled={!!feedback}
          style={{
            marginTop: 18, background: "#14B8A6", color: "#04231F", border: "none", borderRadius: 6,
            padding: "10px 26px", fontWeight: 600, fontSize: 14, cursor: feedback ? "default" : "pointer",
            opacity: feedback ? 0.6 : 1,
          }}
        >
          Тасдиқ
        </button>
      </div>
    </div>
  );
}

export default function PracticePage() {
  usePageTitle("Машқ");
  const [activeTab, setActiveTab] = useState("match");
  const [words, setWords] = useState(null);

  useEffect(() => {
    if (!words || words.length === 0) {
      setWords(DEFAULT_WORDS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <h1 style={{ color: "white", fontWeight: 800, fontSize: 24, margin: "0 0 4px" }}>Машқи калимаҳо 🎮</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>Бозиҳои интерактивӣ барои омӯзиши калимаҳо</p>

        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(45,212,191,0.15)", borderRadius: 8, padding: 6, marginBottom: 24, width: "fit-content", maxWidth: "100%" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: "8px 16px", borderRadius: 6, fontSize: 13.5, fontWeight: 600, border: "none",
                cursor: "pointer", transition: "all 0.2s",
                background: activeTab === t.key ? "#14B8A6" : "transparent",
                color: activeTab === t.key ? "#04231F" : "rgba(255,255,255,0.55)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="glass-card" style={{ padding: "24px 28px" }} key={activeTab}>
          {activeTab === "match" && <WordMatchGame />}
          {activeTab === "gap" && <FillGapGame />}
          {activeTab === "spelling" && <SpellingBeeGame />}
        </div>
      </div>
    </div>
  );
}
