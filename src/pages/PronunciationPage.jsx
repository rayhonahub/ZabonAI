import { useState } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import Navbar from "../components/Navbar";
import NeuralBackground from "../components/NeuralBackground";
import api from "../api/axios";
import { usePageTitle } from "../hooks/usePageTitle";

const practiceWords = [
  { word: "hello", phonetic: "/həˈloʊ/", tajik: "салом" },
  { word: "beautiful", phonetic: "/ˈbjuːtɪfəl/", tajik: "зебо" },
  { word: "pronunciation", phonetic: "/prəˌnʌnsiˈeɪʃən/", tajik: "талаффуз" },
  { word: "English", phonetic: "/ˈɪŋɡlɪʃ/", tajik: "англисӣ" },
  { word: "learning", phonetic: "/ˈlɜːrnɪŋ/", tajik: "омӯхтан" },
  { word: "vocabulary", phonetic: "/vəˈkæbjəleri/", tajik: "луғат" },
  { word: "grammar", phonetic: "/ˈɡræmər/", tajik: "грамматика" },
  { word: "practice", phonetic: "/ˈpræktɪs/", tajik: "машқ" },
];

const practiceSentences = [
  { word: "How are you today?", phonetic: "", tajik: "Имрӯз чӣ ҳол доред?" },
  { word: "My name is ...", phonetic: "", tajik: "Номи ман ... аст" },
  { word: "I am learning English.", phonetic: "", tajik: "Ман забони англисиро мёмӯзам." },
  { word: "Nice to meet you!", phonetic: "", tajik: "Аз вохӯрӣ бо шумо хурсандам!" },
  { word: "Can you help me please?", phonetic: "", tajik: "Лутфан ба ман ёрӣ расонед?" },
];

function speak(text) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

function scoreColor(score) {
  if (score >= 80) return "#2DD4BF";
  if (score >= 60) return "#FBBF24";
  return "#F87171";
}

function ScoreRing({ score }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
      <circle
        cx="55"
        cy="55"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 55 55)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="55" y="61" textAnchor="middle" fill={color} fontSize="24" fontWeight="800">
        {score}%
      </text>
    </svg>
  );
}

export default function PronunciationPage() {
  usePageTitle("Талаффуз");
  const [category, setCategory] = useState("words");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | recording | processing | done
  const [userSaid, setUserSaid] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const list = category === "words" ? practiceWords : practiceSentences;
  const current = list[selectedIndex];

  function selectCategory(cat) {
    setCategory(cat);
    setSelectedIndex(0);
    setResult(null);
    setUserSaid("");
    setStatus("idle");
    setError("");
  }

  function selectTarget(index) {
    setSelectedIndex(index);
    setResult(null);
    setUserSaid("");
    setStatus("idle");
    setError("");
  }

  async function checkPronunciation(transcript) {
    setStatus("processing");
    try {
      const res = await api.post("/ai/pronunciation-check", {
        target_text: current.word,
        user_said: transcript,
      });
      setResult(res.data);
      setStatus("done");
    } catch {
      setError("Хатогӣ рух дод. Боз кӯшиш кунед.");
      setStatus("idle");
    }
  }

  function startRecording() {
    const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionImpl) {
      setError("Браузери шумо ин функсияро дастгирӣ намекунад");
      return;
    }
    setError("");
    setResult(null);
    const recognition = new SpeechRecognitionImpl();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setUserSaid(transcript);
      setIsRecording(false);
      await checkPronunciation(transcript);
    };
    recognition.onerror = () => {
      setIsRecording(false);
      setStatus("idle");
      setError("Садо ошкор нашуд. Боз кӯшиш кунед.");
    };
    recognition.onend = () => setIsRecording(false);

    recognition.start();
    setIsRecording(true);
    setStatus("recording");
  }

  function tryAgain() {
    setResult(null);
    setUserSaid("");
    setStatus("idle");
    setError("");
  }

  function nextWord() {
    const nextIndex = (selectedIndex + 1) % list.length;
    selectTarget(nextIndex);
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #061A1C 0%, #0A2A2E 45%, #0E3A3F 100%)", color: "white" }}>
      <Navbar />
      <div style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <NeuralBackground />
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 16px 60px", position: "relative", zIndex: 1 }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Mic size={26} style={{ color: "#14B8A6" }} />
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "white", margin: 0 }}>Талаффуз машқ кун</h1>
            </div>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, margin: 0 }}>
              Калима ё ҷумларо гӯед — AI талаффузи шуморо месанҷад
            </p>
          </div>

          {/* Category tabs */}
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(45,212,191,0.15)", borderRadius: 8, padding: 6, marginBottom: 20, width: "fit-content" }}>
            {[
              { key: "words", label: "Калимаҳо" },
              { key: "sentences", label: "Ҷумлаҳо" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => selectCategory(t.key)}
                style={{
                  padding: "8px 16px", borderRadius: 6, fontSize: 13.5, fontWeight: 600, border: "none",
                  cursor: "pointer", transition: "all 0.2s",
                  background: category === t.key ? "#14B8A6" : "transparent",
                  color: category === t.key ? "#04231F" : "rgba(255,255,255,0.55)",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Word chip selector */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {list.map((item, i) => (
              <button
                key={item.word}
                onClick={() => selectTarget(i)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: selectedIndex === i ? "1.5px solid #14B8A6" : "1.5px solid rgba(255,255,255,0.12)",
                  background: selectedIndex === i ? "rgba(20,184,166,0.15)" : "rgba(255,255,255,0.04)",
                  color: selectedIndex === i ? "#2DD4BF" : "rgba(255,255,255,0.6)",
                  transition: "all 0.15s",
                }}
              >
                {item.word}
              </button>
            ))}
          </div>

          {/* Selected word card */}
          <div className="glass-card" style={{ padding: "24px 28px", marginBottom: 24, textAlign: "center" }}>
            <p style={{ color: "white", fontSize: 28, fontWeight: 700, margin: "0 0 8px" }}>{current.word}</p>
            {current.phonetic && (
              <p style={{ color: "#2DD4BF", fontSize: 16, margin: "0 0 6px" }}>{current.phonetic}</p>
            )}
            <p style={{ color: "#FBBF24", fontSize: 14, margin: "0 0 16px" }}>{current.tajik}</p>
            <button
              onClick={() => speak(current.word)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(20,184,166,0.12)", border: "1px solid rgba(45,212,191,0.3)",
                borderRadius: 8, color: "#2DD4BF", fontWeight: 600, fontSize: 13.5,
                padding: "9px 18px", cursor: "pointer",
              }}
            >
              <Volume2 size={16} />
              Шунидан
            </button>
          </div>

          {/* Recording section */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
            <button
              onClick={startRecording}
              disabled={isRecording || status === "processing"}
              style={{
                width: 80, height: 80, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: isRecording ? "2px solid #EF4444" : "2px solid #14B8A6",
                background: isRecording ? "rgba(239,68,68,0.15)" : "rgba(20,184,166,0.1)",
                color: isRecording ? "#F87171" : "#2DD4BF",
                cursor: status === "processing" ? "not-allowed" : "pointer",
                animation: isRecording ? "mic-pulse 1.2s infinite" : "none",
                marginBottom: 14,
                transition: "all 0.2s",
              }}
            >
              {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, margin: 0 }}>
              {status === "idle" && "Тугмаро пахш кунед ва калимаро гӯед"}
              {status === "recording" && <span style={{ color: "#2DD4BF", animation: "pulse-text 1.2s infinite" }}>Гӯш мекунам...</span>}
              {status === "processing" && "AI месанҷад..."}
              {status === "done" && "Тайёр!"}
            </p>
            {error && <p style={{ color: "#F87171", fontSize: 13, marginTop: 10 }}>{error}</p>}
          </div>

          {/* Result card */}
          {result && (
            <div className="glass-card" style={{ padding: "24px 26px", display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                <ScoreRing score={result.similarity_score} />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "0 0 4px" }}>Шумо гуфтед:</p>
                  <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 15, fontStyle: "italic", margin: 0 }}>&ldquo;{userSaid}&rdquo;</p>
                </div>
              </div>

              <p style={{ color: "white", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{result.feedback_tj}</p>

              {result.specific_errors && result.specific_errors.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {result.specific_errors.map((err, i) => (
                    <div
                      key={i}
                      style={{
                        background: "rgba(239,68,68,0.06)",
                        borderLeft: "2px solid #EF4444",
                        borderRadius: "0 8px 8px 0",
                        padding: "12px 14px",
                      }}
                    >
                      <p style={{ color: "#F87171", fontSize: 13, fontWeight: 500, margin: "0 0 4px" }}>
                        ❌ Шумо: {err.wrong}
                      </p>
                      <p style={{ color: "#2DD4BF", fontSize: 13, fontWeight: 500, margin: "0 0 4px" }}>
                        ✅ Дуруст: {err.correct}
                      </p>
                      <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: 0 }}>
                        💡 {err.tip_tj}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {result.encouragement_tj && (
                <p style={{ color: "#FBBF24", fontSize: 14, fontWeight: 500, margin: 0 }}>{result.encouragement_tj}</p>
              )}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => speak(current.word)} style={secondaryBtnStyle}>
                  <Volume2 size={15} />
                  Шунидан
                </button>
                <button onClick={tryAgain} style={secondaryBtnStyle}>
                  Боз кӯшиш кун
                </button>
                <button onClick={nextWord} style={primaryBtnStyle}>
                  Калимаи дигар
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes mic-pulse {
          0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          70% { box-shadow: 0 0 0 14px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
        @keyframes pulse-text {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

const secondaryBtnStyle = {
  display: "flex", alignItems: "center", gap: 6,
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 8, color: "rgba(255,255,255,0.75)", fontSize: 13.5, fontWeight: 600,
  padding: "10px 18px", cursor: "pointer",
};

const primaryBtnStyle = {
  display: "flex", alignItems: "center", gap: 6,
  background: "#14B8A6", border: "none",
  borderRadius: 8, color: "#04231F", fontSize: 13.5, fontWeight: 600,
  padding: "10px 18px", cursor: "pointer",
};
