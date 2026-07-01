import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Swords, Trophy, RefreshCw, Users, Plus, LogIn, Clock } from "lucide-react";
import api from "../api/axios";
import NeuralBackground from "../components/NeuralBackground";
import Navbar from "../components/Navbar";

const WS_BASE = "ws://localhost:8000";
const QUESTION_SECONDS = 30;

export default function DuelPage() {
  const navigate = useNavigate();
  const wsRef = useRef(null);

  const [screen, setScreen] = useState("lobby"); // lobby | waiting | game | result
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [availableRooms, setAvailableRooms] = useState([]);
  const [error, setError] = useState("");

  // Game state
  const [myId, setMyId] = useState(null);
  const [players, setPlayers] = useState({});
  const [scores, setScores] = useState({});
  const [question, setQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [opponentAnswered, setOpponentAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS);

  // Result state
  const [result, setResult] = useState(null); // { scores, playerNames, winnerId, winnerName }

  const timerRef = useRef(null);

  const me = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = me.id || 1;
  const userName = encodeURIComponent(me.full_name || "Корбар");

  // Fetch available rooms on lobby load
  useEffect(() => {
    if (screen === "lobby") {
      fetchRooms();
      const interval = setInterval(fetchRooms, 5000);
      return () => clearInterval(interval);
    }
  }, [screen]);

  function fetchRooms() {
    api.get("/duel/rooms").then((r) => setAvailableRooms(r.data)).catch(() => {});
  }

  function clearTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function startTimer() {
    clearTimer();
    setTimeLeft(QUESTION_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearTimer();
          // Auto-submit blank if not answered
          setAnswered((prev) => {
            if (!prev && wsRef.current) {
              wsRef.current.send(JSON.stringify({ type: "answer", answer: "__timeout__" }));
            }
            return true;
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  const connectWS = useCallback((roomId) => {
    const ws = new WebSocket(`${WS_BASE}/duel/ws/${roomId}/${userId}/${userName}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "error") {
        setError(msg.message);
        setScreen("lobby");
      } else if (msg.type === "joined") {
        setMyId(msg.your_id);
        setRoomCode(msg.room_id);
        if (msg.player_count < 2) setScreen("waiting");
      } else if (msg.type === "waiting") {
        setScreen("waiting");
      } else if (msg.type === "duel_start") {
        setPlayers(msg.players);
        setScores(Object.fromEntries(Object.keys(msg.players).map((k) => [k, 0])));
        setTotalQuestions(msg.total_questions);
        setScreen("game");
      } else if (msg.type === "question") {
        setQuestion(msg);
        setQuestionNumber(msg.question_number);
        setSelected(null);
        setAnswered(false);
        setOpponentAnswered(false);
        startTimer();
      } else if (msg.type === "player_answered") {
        if (msg.player_id !== String(myId)) {
          setOpponentAnswered(true);
        }
        if (msg.correct && msg.player_id) {
          setScores((prev) => ({
            ...prev,
            [msg.player_id]: (prev[msg.player_id] || 0) + 1,
          }));
        }
      } else if (msg.type === "duel_end") {
        clearTimer();
        setResult({
          scores: msg.scores,
          playerNames: msg.player_names,
          winnerId: msg.winner_id,
          winnerName: msg.winner_name,
        });
        setScreen("result");
      } else if (msg.type === "opponent_left") {
        clearTimer();
        setError("Рақиб бозиро тарк кард");
        setScreen("lobby");
      }
    };

    ws.onerror = () => {
      setError("Хатои пайвастшавӣ. Дубора кӯшиш кунед.");
      setScreen("lobby");
    };

    ws.onclose = () => {
      if (screen === "game") {
        setError("Пайваст қатъ шуд");
        setScreen("lobby");
      }
    };
  }, [userId, userName, myId, screen]);

  function handleCreate() {
    setError("");
    api.post("/duel/create").then((r) => {
      const roomId = r.data.room_id;
      setRoomCode(roomId);
      connectWS(roomId);
    }).catch(() => setError("Хонаро сохтан нашуд"));
  }

  function handleJoin(code) {
    const id = (code || joinCode).trim().toUpperCase();
    if (!id) return;
    setError("");
    connectWS(id);
  }

  function handleAnswer(opt) {
    if (answered || !wsRef.current) return;
    setSelected(opt);
    setAnswered(true);
    clearTimer();
    wsRef.current.send(JSON.stringify({ type: "answer", answer: opt }));
  }

  function handleRestart() {
    if (wsRef.current) wsRef.current.close();
    setScreen("lobby");
    setRoomCode("");
    setJoinCode("");
    setQuestion(null);
    setResult(null);
    setError("");
    setScores({});
    setPlayers({});
    setMyId(null);
  }

  useEffect(() => () => {
    clearTimer();
    if (wsRef.current) wsRef.current.close();
  }, []);

  const myIdStr = String(myId);
  const opponentId = Object.keys(players).find((k) => k !== myIdStr);
  const myName = players[myIdStr] || me.full_name || "Ман";
  const opponentName = players[opponentId] || "Рақиб";
  const myScore = scores[myIdStr] || 0;
  const opponentScore = scores[opponentId] || 0;

  const optionLabels = ["a", "b", "c", "d"];
  const optionKeys = ["option_a", "option_b", "option_c", "option_d"];

  const timerPct = (timeLeft / QUESTION_SECONDS) * 100;
  const timerColor = timeLeft > 10 ? "#14B8A6" : "#FBBF24";

  // ─── LOBBY ───────────────────────────────────────────────────────────
  if (screen === "lobby") {
    return (
      <div style={{ minHeight: "100vh", background: "#061A1C", color: "white" }}>
        <NeuralBackground />
        <Navbar />
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1rem" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 64, height: 64, borderRadius: 16,
              background: "linear-gradient(135deg, rgba(20,184,166,0.25), rgba(251,191,36,0.15))",
              border: "1.5px solid rgba(20,184,166,0.3)", marginBottom: "1rem",
            }}>
              <Swords size={30} color="#14B8A6" />
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: "0 0 0.5rem" }}>Дуэл</h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem", margin: 0 }}>
              Бо корбари дигар дар вақти воқеӣ мусобиқа кун!
            </p>
          </div>

          {error && (
            <div style={{
              background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)",
              borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1.5rem",
              color: "#FBBF24", fontSize: "0.9rem", textAlign: "center",
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
            {/* Create Room */}
            <div className="glass-card" style={{ padding: "1.5rem", borderRadius: 12, textAlign: "center" }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem",
              }}>
                <Plus size={20} color="#14B8A6" />
              </div>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 600 }}>Хонаи нав созед</h3>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem", margin: "0 0 1.25rem" }}>
                Рамзро бо дӯст мубодила кунед
              </p>
              <button
                onClick={handleCreate}
                style={{
                  width: "100%", padding: "0.65rem", borderRadius: 8, border: "none",
                  background: "linear-gradient(135deg, #0D9488, #14B8A6)",
                  color: "white", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer",
                }}
              >
                Созед
              </button>
            </div>

            {/* Join Room */}
            <div className="glass-card" style={{ padding: "1.5rem", borderRadius: 12, textAlign: "center" }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem",
              }}>
                <LogIn size={20} color="#FBBF24" />
              </div>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 600 }}>Ба хона ворид шав</h3>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Рамзи хона..."
                maxLength={8}
                style={{
                  width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8, border: "1.5px solid rgba(20,184,166,0.25)",
                  background: "rgba(255,255,255,0.04)", color: "white", fontSize: "0.9rem",
                  marginBottom: "0.75rem", outline: "none", boxSizing: "border-box",
                  fontFamily: "Inter, sans-serif", letterSpacing: 2,
                }}
                onFocus={(e) => (e.target.style.borderColor = "#14B8A6")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(20,184,166,0.25)")}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
              <button
                onClick={() => handleJoin()}
                style={{
                  width: "100%", padding: "0.65rem", borderRadius: 8, border: "none",
                  background: "linear-gradient(135deg, #B45309, #FBBF24)",
                  color: "white", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer",
                }}
              >
                Пайваст шудан
              </button>
            </div>
          </div>

          {/* Available Rooms */}
          {availableRooms.length > 0 && (
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: "0.75rem" }}>
                <Users size={14} style={{ display: "inline", marginRight: 6 }} />
                Хонаҳои кушода:
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {availableRooms.map((room) => (
                  <div
                    key={room.room_id}
                    className="glass-card"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "0.75rem 1rem", borderRadius: 10,
                    }}
                  >
                    <span style={{ fontSize: "0.9rem" }}>
                      Хона <span style={{ color: "#14B8A6", fontWeight: 700, letterSpacing: 1 }}>{room.room_id}</span>
                      <span style={{ color: "rgba(255,255,255,0.4)", marginLeft: 8, fontSize: "0.8rem" }}>
                        — мунтазири бозингар
                      </span>
                    </span>
                    <button
                      onClick={() => handleJoin(room.room_id)}
                      style={{
                        padding: "0.4rem 0.9rem", borderRadius: 6, border: "1px solid rgba(20,184,166,0.3)",
                        background: "rgba(20,184,166,0.08)", color: "#14B8A6",
                        fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      Ворид шудан
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── WAITING ─────────────────────────────────────────────────────────
  if (screen === "waiting") {
    return (
      <div style={{ minHeight: "100vh", background: "#061A1C", color: "white" }}>
        <NeuralBackground />
        <Navbar />
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "calc(100vh - 64px)", padding: "2rem",
        }}>
          <div className="glass-card" style={{ padding: "2.5rem", borderRadius: 16, textAlign: "center", maxWidth: 420, width: "100%" }}>
            <Swords size={40} color="#14B8A6" style={{ marginBottom: "1rem" }} />
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: "0 0 0.5rem" }}>Хона сохта шуд!</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", margin: "0 0 1.5rem" }}>
              Рамзи хонаро бо дӯст мубодила кунед:
            </p>
            <div style={{
              fontSize: "2.5rem", fontWeight: 800, color: "#14B8A6",
              letterSpacing: 8, marginBottom: "1.5rem",
              background: "rgba(20,184,166,0.08)", borderRadius: 10, padding: "0.75rem",
              border: "1.5px solid rgba(20,184,166,0.25)",
            }}>
              {roomCode}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", color: "rgba(255,255,255,0.5)" }}>
              <span style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 8, height: 8, borderRadius: "50%", background: "#14B8A6",
                      animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </span>
              Мунтазири рақиб...
            </div>
            <style>{`@keyframes pulse { 0%,100%{opacity:.2} 50%{opacity:1} }`}</style>
          </div>
          <button
            onClick={handleRestart}
            style={{
              marginTop: "1.5rem", padding: "0.6rem 1.5rem", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)", background: "transparent",
              color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "0.875rem",
            }}
          >
            Бозгашт
          </button>
        </div>
      </div>
    );
  }

  // ─── GAME ─────────────────────────────────────────────────────────────
  if (screen === "game") {
    const circumference = 2 * Math.PI * 20;
    const strokeOffset = circumference - (timerPct / 100) * circumference;

    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #061A1C 0%, #0A2A2E 100%)", color: "white" }}>
        <NeuralBackground />

        {/* Top scoreboard */}
        <div style={{
          position: "sticky", top: 0, zIndex: 30,
          background: "rgba(6,26,28,0.85)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(20,184,166,0.15)",
          padding: "0.75rem 1.5rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#14B8A6" }}>{myName}</span>
            <span style={{
              fontWeight: 800, fontSize: "1.3rem", color: "#14B8A6",
              background: "rgba(20,184,166,0.1)", borderRadius: 6, padding: "0 0.5rem",
            }}>{myScore}</span>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Савол</div>
            <div style={{ fontWeight: 700, color: "white" }}>{questionNumber} / {totalQuestions}</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontWeight: 800, fontSize: "1.3rem", color: "#FBBF24",
              background: "rgba(251,191,36,0.1)", borderRadius: 6, padding: "0 0.5rem",
            }}>{opponentScore}</span>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#FBBF24" }}>{opponentName}</span>
          </div>
        </div>

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem" }}>
          {/* Timer ring */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
            <div style={{ position: "relative", width: 56, height: 56 }}>
              <svg width="56" height="56" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="28" cy="28" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="20" fill="none"
                  stroke={timerColor} strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
                />
              </svg>
              <span style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 700, fontSize: "0.9rem", color: timerColor,
              }}>
                {timeLeft}
              </span>
            </div>
          </div>

          {/* Question card */}
          {question && (
            <div className="glass-card" style={{ padding: "2rem", borderRadius: 16, marginBottom: "1.25rem" }}>
              <p style={{ fontSize: "1.15rem", fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
                {question.question}
              </p>
            </div>
          )}

          {/* Answer buttons */}
          {question && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {optionKeys.map((key, i) => {
                const val = question[key];
                if (!val) return null;
                const label = optionLabels[i];
                const isSelected = selected === label;
                const isCorrect = answered && label === question.correct_answer;
                const isWrong = answered && isSelected && !isCorrect;

                let bg = "rgba(255,255,255,0.04)";
                let border = "1.5px solid rgba(255,255,255,0.1)";
                let color = "rgba(255,255,255,0.85)";

                if (isCorrect) { bg = "rgba(20,184,166,0.18)"; border = "1.5px solid #14B8A6"; color = "#14B8A6"; }
                else if (isWrong) { bg = "rgba(251,191,36,0.12)"; border = "1.5px solid #FBBF24"; color = "#FBBF24"; }
                else if (isSelected) { bg = "rgba(20,184,166,0.08)"; border = "1.5px solid rgba(20,184,166,0.4)"; }

                return (
                  <button
                    key={key}
                    onClick={() => handleAnswer(label)}
                    disabled={answered}
                    style={{
                      padding: "0.85rem 1rem", borderRadius: 10,
                      background: bg, border, color,
                      fontWeight: 500, fontSize: "0.9rem", textAlign: "left",
                      cursor: answered ? "default" : "pointer",
                      transition: "all 0.2s",
                      display: "flex", alignItems: "center", gap: 10,
                    }}
                  >
                    <span style={{
                      minWidth: 26, height: 26, borderRadius: 6,
                      background: isCorrect ? "rgba(20,184,166,0.2)" : isWrong ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.06)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: "0.8rem", color: "inherit",
                    }}>
                      {label.toUpperCase()}
                    </span>
                    {val}
                  </button>
                );
              })}
            </div>
          )}

          {/* Opponent indicator */}
          {opponentAnswered && !answered && (
            <p style={{ textAlign: "center", color: "#FBBF24", fontSize: "0.85rem", marginTop: "1rem" }}>
              Рақиб ҷавоб дод ✓
            </p>
          )}
          {answered && opponentAnswered && (
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.82rem", marginTop: "1rem" }}>
              Мунтазири саволи навбатӣ...
            </p>
          )}
          {answered && !opponentAnswered && (
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.82rem", marginTop: "1rem" }}>
              Мунтазири рақиб...
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── RESULT ───────────────────────────────────────────────────────────
  if (screen === "result" && result) {
    const iWon = result.winnerId === myIdStr;
    const myFinalScore = result.scores[myIdStr] || 0;
    const opponentFinalScore = result.scores[opponentId] || 0;

    return (
      <div style={{ minHeight: "100vh", background: "#061A1C", color: "white" }}>
        <NeuralBackground />
        <Navbar />
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "calc(100vh - 64px)", padding: "2rem",
        }}>
          <div className="glass-card" style={{ padding: "2.5rem", borderRadius: 20, textAlign: "center", maxWidth: 480, width: "100%" }}>
            {iWon ? (
              <>
                <div style={{
                  width: 72, height: 72, borderRadius: 20, margin: "0 auto 1rem",
                  background: "rgba(20,184,166,0.15)", border: "1.5px solid rgba(20,184,166,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 32px rgba(20,184,166,0.2)",
                }}>
                  <Trophy size={36} color="#14B8A6" />
                </div>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#14B8A6", margin: "0 0 0.5rem" }}>
                  Ту ғалаба кардӣ!
                </h2>
              </>
            ) : (
              <>
                <div style={{
                  width: 72, height: 72, borderRadius: 20, margin: "0 auto 1rem",
                  background: "rgba(251,191,36,0.1)", border: "1.5px solid rgba(251,191,36,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <RefreshCw size={36} color="#FBBF24" />
                </div>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#FBBF24", margin: "0 0 0.5rem" }}>
                  Ту бохтӣ.
                </h2>
                <p style={{ color: "rgba(255,255,255,0.45)", margin: "0 0 1.5rem" }}>Боз талош кун!</p>
              </>
            )}

            {/* Scores */}
            <div style={{ display: "flex", gap: "1rem", margin: "1.5rem 0", justifyContent: "center" }}>
              <div style={{
                flex: 1, padding: "1.25rem", borderRadius: 12,
                background: "rgba(20,184,166,0.07)", border: "1.5px solid rgba(20,184,166,0.2)",
              }}>
                <p style={{ color: "#14B8A6", fontWeight: 700, margin: "0 0 0.25rem", fontSize: "0.85rem" }}>{myName}</p>
                <p style={{ color: "white", fontWeight: 800, fontSize: "2rem", margin: 0 }}>{myFinalScore}</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem", margin: 0 }}>ҷавоби дуруст</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", color: "rgba(255,255,255,0.25)", fontWeight: 700 }}>VS</div>
              <div style={{
                flex: 1, padding: "1.25rem", borderRadius: 12,
                background: "rgba(251,191,36,0.07)", border: "1.5px solid rgba(251,191,36,0.2)",
              }}>
                <p style={{ color: "#FBBF24", fontWeight: 700, margin: "0 0 0.25rem", fontSize: "0.85rem" }}>{opponentName}</p>
                <p style={{ color: "white", fontWeight: 800, fontSize: "2rem", margin: 0 }}>{opponentFinalScore}</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem", margin: 0 }}>ҷавоби дуруст</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
              <button
                onClick={handleRestart}
                style={{
                  padding: "0.75rem", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #0D9488, #14B8A6)",
                  color: "white", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
                }}
              >
                <Swords size={16} /> Дубора бозӣ
              </button>
              <button
                onClick={() => navigate("/courses")}
                style={{
                  padding: "0.75rem", borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "transparent", color: "rgba(255,255,255,0.6)",
                  fontWeight: 600, fontSize: "0.95rem", cursor: "pointer",
                }}
              >
                Ба курсҳо
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
