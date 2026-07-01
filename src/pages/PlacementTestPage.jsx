import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import NeuralBackground from "../components/NeuralBackground";
import { usePageTitle } from "../hooks/usePageTitle";

const questions = [
  { id: 1, question: "Калимаи 'Hello' ба тоҷикӣ чӣ маъно дорад?", options: ["Хайр", "Салом", "Раҳмат", "Бубахшед"], correct: 1 },
  { id: 2, question: "Кадоме аз ин калимаҳо дуруст аст барои 'Китоб'?", options: ["Book", "Buk", "Buck", "Back"], correct: 0 },
  { id: 3, question: "Ҷумлаи дурустро интихоб кун:", options: ["I is a student", "I am a student", "I are student", "Am I student"], correct: 1 },
  { id: 4, question: "Шакли дурусти феъл: 'She ___ to school every day.'", options: ["go", "goes", "going", "gone"], correct: 1 },
  { id: 5, question: "Замони гузаштаро интихоб кун: 'Yesterday I ___ a movie.'", options: ["watch", "watches", "watched", "watching"], correct: 2 },
  { id: 6, question: "Ҷумлаи дурустро интихоб кун:", options: ["He don't like coffee", "He doesn't likes coffee", "He doesn't like coffee", "He not like coffee"], correct: 2 },
  { id: 7, question: "Ҷумлаи дурустро интихоб кун:", options: ["I have been working here since 3 years", "I have been working here for 3 years", "I am working here since 3 years", "I work here since 3 years"], correct: 1 },
  { id: 8, question: "Калимаи 'Nevertheless' чӣ маъно дорад?", options: ["Барои он ки", "Бо вуҷуди ин", "Бинобар ин", "Масалан"], correct: 1 },
  { id: 9, question: "Шарти дурустро интихоб кун: 'If I ___ rich, I ___ travel the world.'", options: ["am / will", "were / would", "was / will", "be / would"], correct: 1 },
  { id: 10, question: "Кадоме аз ин ҷумлаҳо грамматикаи дурусттар дорад?", options: ["I suggest that he goes home", "I suggest that he go home", "I suggest that he going home", "I suggest that he to go home"], correct: 1 },
];

function getLevel(score) {
  if (score <= 3) return { key: "ibtidoi", label: "Сатҳи ибтидоӣ" };
  if (score <= 6) return { key: "miyona", label: "Сатҳи миёна" };
  if (score <= 8) return { key: "boloter", label: "Сатҳи болотар" };
  return { key: "baland", label: "Сатҳи баланд" };
}

const BG = "linear-gradient(160deg, #061A1C 0%, #0A2A2E 45%, #0E3A3F 100%)";

export default function PlacementTestPage() {
  usePageTitle("Тести ҷойгиршавӣ");
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  function handleAnswer(optionIndex) {
    if (answered) return;
    setSelected(optionIndex);
    setAnswered(true);
    const isCorrect = optionIndex === questions[index].correct;
    if (isCorrect) setCorrectCount((c) => c + 1);

    setTimeout(() => {
      if (index + 1 < questions.length) {
        setIndex((i) => i + 1);
        setSelected(null);
        setAnswered(false);
      } else {
        setFinished(true);
      }
    }, 900);
  }

  function handleFinish() {
    const level = getLevel(correctCount);
    localStorage.setItem("placement_test_done", "true");
    localStorage.setItem("user_level", level.key);
    navigate("/courses");
  }

  const q = questions[index];
  const level = getLevel(correctCount);
  const progressPct = ((index + 1) / questions.length) * 100;

  if (finished) {
    return (
      <div style={{ minHeight: "100vh", background: BG, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <NeuralBackground />
        </div>
        <div
          className="glass-card fade-up-1"
          style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 460, padding: "2.5rem", textAlign: "center" }}
        >
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, marginBottom: 20, marginTop: 0 }}>
            Тест ба охир расид!
          </p>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 84, height: 84, borderRadius: "50%",
            background: "rgba(20,184,166,0.12)",
            border: "2.5px solid #14B8A6",
            boxShadow: "0 0 32px rgba(20,184,166,0.35)",
            marginBottom: "1.25rem",
          }}>
            <span style={{ fontSize: 36 }}>🎓</span>
          </div>
          <h1 style={{ color: "#2DD4BF", fontWeight: 600, fontSize: 26, margin: "0 0 8px" }}>
            {level.label}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, margin: "0 0 2rem" }}>
            Ту {correctCount} аз 10 саволро дуруст ҷавоб додӣ
          </p>
          <button
            onClick={handleFinish}
            style={{
              width: "100%", background: "#14B8A6", color: "#04231F",
              border: "none", borderRadius: 6, padding: "0.8rem",
              fontWeight: 600, fontSize: 15, cursor: "pointer",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Омӯхтанро оғоз кун
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <NeuralBackground />
      </div>
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 560 }}>
        {/* Logo */}
        <div className="fade-up-1" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg, #0D9488, #22D3EE)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>Z</span>
            </div>
            <span style={{ color: "white", fontWeight: 600, fontSize: 16 }}>ZaboniAI</span>
          </div>
        </div>

        {/* Progress */}
        <div className="fade-up-1" style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 8 }}>
            <span>Саволи {index + 1} аз 10</span>
            <span style={{ color: "#2DD4BF", fontWeight: 600 }}>{correctCount} дуруст</span>
          </div>
          <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${progressPct}%`,
              background: "linear-gradient(90deg, #14B8A6, #2DD4BF)",
              borderRadius: 3, transition: "width 0.5s ease",
            }} />
          </div>
        </div>

        {/* Card */}
        <div className="glass-card fade-up-2" style={{ padding: "2rem" }} key={index}>
          <h2 style={{ color: "white", fontWeight: 500, fontSize: 19, textAlign: "center", marginTop: 0, marginBottom: "1.75rem", lineHeight: 1.45 }}>
            {q.question}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {q.options.map((opt, i) => {
              const isCorrect = answered && i === q.correct;
              const isWrong = answered && i === selected && i !== q.correct;
              let border = "1.5px solid rgba(45,212,191,0.13)";
              let bg = "rgba(255,255,255,0.02)";
              let color = "rgba(255,255,255,0.82)";
              if (isCorrect) { border = "1.5px solid #2DD4BF"; bg = "rgba(45,212,191,0.08)"; color = "#2DD4BF"; }
              if (isWrong)   { border = "1.5px solid #FBBF24"; bg = "rgba(251,191,36,0.06)"; color = "#FBBF24"; }
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={answered}
                  style={{
                    width: "100%", background: bg, border, borderRadius: 6,
                    padding: "0.78rem 1rem", color, fontSize: 14,
                    textAlign: "left", cursor: answered ? "default" : "pointer",
                    transition: "all 0.25s", display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  <span style={{
                    width: 26, height: 26, borderRadius: 4, flexShrink: 0,
                    background: isCorrect ? "rgba(45,212,191,0.15)" : "rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700,
                    color: isCorrect ? "#2DD4BF" : isWrong ? "#FBBF24" : "rgba(255,255,255,0.35)",
                  }}>
                    {["A", "B", "C", "D"][i]}
                  </span>
                  <span style={{ flex: 1 }}>{opt}</span>
                  {isCorrect && <CheckCircle size={15} style={{ color: "#2DD4BF", flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
