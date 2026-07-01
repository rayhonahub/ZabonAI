import { useState } from "react";
import { PenLine } from "lucide-react";
import Navbar from "../components/Navbar";
import NeuralBackground from "../components/NeuralBackground";
import api from "../api/axios";

const ERROR_TYPE_LABELS = {
  grammar: "Грамматика",
  spelling: "Имло",
  punctuation: "Нуқтагузорӣ",
  word_choice: "Интихоби калима",
};

export default function WritingPracticePage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleCheck() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post("/ai/writing-check", { text });
      setResult(res.data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setText("");
    setResult(null);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#061A1C", color: "white" }}>
      <Navbar />
      <div style={{ position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <NeuralBackground />
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 16px 60px", position: "relative", zIndex: 1 }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <PenLine size={26} style={{ color: "#14B8A6" }} />
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "white", margin: 0 }}>Навиштани Озод</h1>
            </div>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, margin: 0 }}>
              Матни англисӣ бинавис — AI хатоҳоятро ислоҳ мекунад ва ба тоҷикӣ фаҳмонад
            </p>
          </div>

          {/* Input card */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(45,212,191,0.18)",
            borderRadius: 10,
            padding: 20,
            backdropFilter: "blur(8px)",
            marginBottom: 20,
          }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              disabled={loading}
              placeholder="Матни англисиро ин ҷо нависед... Масалан: I goed to school yesterday and learn many things."
              style={{
                width: "100%",
                minHeight: 160,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(45,212,191,0.2)",
                borderRadius: 8,
                color: "white",
                fontSize: 15,
                padding: "12px 14px",
                resize: "vertical",
                outline: "none",
                fontFamily: "Inter, sans-serif",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
                {text.length} ҳарф
              </span>
              <button
                onClick={handleCheck}
                disabled={!text.trim() || loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: loading || !text.trim() ? "rgba(20,184,166,0.3)" : "#14B8A6",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 24px",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: loading || !text.trim() ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                <PenLine size={16} />
                {loading ? "AI санҷиш мекунад..." : "Санҷидан"}
              </button>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Score + encouragement row */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                <div style={{
                  background: "rgba(20,184,166,0.1)",
                  border: "1px solid rgba(45,212,191,0.25)",
                  borderRadius: 10,
                  padding: "16px 24px",
                  textAlign: "center",
                  minWidth: 100,
                  flexShrink: 0,
                }}>
                  <p style={{ fontSize: 36, fontWeight: 800, color: "#2DD4BF", margin: "0 0 2px" }}>
                    {result.overall_score}%
                  </p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0 }}>Натиҷа</p>
                </div>
                {result.encouragement_tj && (
                  <div style={{
                    background: "rgba(251,191,36,0.08)",
                    border: "1px solid rgba(251,191,36,0.2)",
                    borderRadius: 10,
                    padding: "14px 18px",
                    flex: 1,
                    minWidth: 200,
                  }}>
                    <p style={{ color: "#FBBF24", fontSize: 14, fontWeight: 500, margin: 0 }}>
                      {result.encouragement_tj}
                    </p>
                  </div>
                )}
              </div>

              {/* No errors */}
              {result.errors.length === 0 && (
                <div style={{
                  background: "rgba(20,184,166,0.08)",
                  border: "1.5px solid rgba(45,212,191,0.35)",
                  borderRadius: 10,
                  padding: "16px 18px",
                  color: "#2DD4BF",
                  fontWeight: 600,
                  fontSize: 15,
                }}>
                  Аъло! Хато нест! Матни ту комилан дуруст аст. ✓
                </div>
              )}

              {/* Corrected text */}
              {result.errors.length > 0 && result.corrected_text && (
                <div style={{
                  background: "rgba(16,185,129,0.06)",
                  border: "1px solid rgba(16,185,129,0.25)",
                  borderRadius: 10,
                  padding: "14px 16px",
                }}>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 600, marginBottom: 6, marginTop: 0 }}>
                    МАТНИ ИСЛОҲШУДА:
                  </p>
                  <p style={{ color: "#6EE7B7", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                    {result.corrected_text}
                  </p>
                </div>
              )}

              {/* Errors list */}
              {result.errors.length > 0 && (
                <div>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, marginBottom: 10, marginTop: 0 }}>
                    ХАТОҲО:
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {result.errors.map((err, i) => (
                      <div key={i} style={{
                        background: "rgba(239,68,68,0.06)",
                        borderLeft: "3px solid #EF4444",
                        borderRadius: "0 8px 8px 0",
                        padding: "12px 14px",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={{ color: "#F87171", fontSize: 13, fontWeight: 500 }}>
                            ❌ Нодуруст: {err.original}
                          </span>
                          {err.type && (
                            <span style={{
                              background: "rgba(239,68,68,0.15)",
                              color: "#F87171",
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: 4,
                            }}>
                              {ERROR_TYPE_LABELS[err.type] || err.type}
                            </span>
                          )}
                        </div>
                        <p style={{ color: "#2DD4BF", fontSize: 13, fontWeight: 500, margin: "4px 0" }}>
                          ✅ Дуруст: {err.fixed}
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: 0 }}>
                          💡 {err.explanation_tj}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset button */}
              <button
                onClick={handleReset}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 8,
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 14,
                  fontWeight: 600,
                  padding: "10px 20px",
                  cursor: "pointer",
                  alignSelf: "flex-start",
                }}
              >
                Боз санҷидан
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
