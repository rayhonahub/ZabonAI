import { useState } from "react";
import { BookMarked, RefreshCw, Volume2, MessageCircle, Send, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import Navbar from "../components/Navbar";
import { usePageTitle } from "../hooks/usePageTitle";
import api from "../api/axios";

function renderStoryText(story) {
  const parts = story.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} style={{ color: "#2DD4BF", fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function speak(text) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

export default function StoryPage() {
  usePageTitle("Ҳикоя");

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [revealedAnswers, setRevealedAnswers] = useState({});

  const [chatMessages, setChatMessages] = useState([
    { role: "ai", content: "Ҳикояро хондед? Агар чизе нафаҳмидед ё мехоҳед муҳокима кунед — аз ман бипурсед!" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  async function generateStory() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/ai/generate-story");
      setStory(res.data);
      setRevealedAnswers({});
      setChatMessages([
        { role: "ai", content: "Ҳикояро хондед? Агар чизе нафаҳмидед ё мехоҳед муҳокима кунед — аз ман бипурсед!" },
      ]);
    } catch {
      setError("Ҳикоя офарида нашуд. Лутфан боз кӯшиш кунед.");
    }
    setLoading(false);
  }

  async function sendStoryMessage() {
    if (!chatInput.trim() || chatLoading || !story) return;

    const userMsg = { role: "user", content: chatInput };
    const nextMessages = [...chatMessages, userMsg];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await api.post("/ai/story-chat", {
        story_text: story.story,
        message: userMsg.content,
        history: nextMessages.slice(-4),
      });
      setChatMessages((prev) => [...prev, { role: "ai", content: res.data.reply }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "ai", content: "Хато рух дод. Боз кӯшиш кунед." }]);
    }
    setChatLoading(false);
  }

  function toggleAnswer(i) {
    setRevealedAnswers((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #061A1C 0%, #0A2A2E 45%, #0E3A3F 100%)", color: "white" }}>
      <Navbar />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px 48px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BookMarked size={24} style={{ color: "#14B8A6" }} />
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Ҳикоя</h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>
                Ҳикояи шахсишудаи англисӣ мувофиқи сатҳи шумо
              </p>
            </div>
          </div>
          {story && (
            <button
              onClick={generateStory}
              disabled={loading}
              title="Ҳикояи нав"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(45,212,191,0.25)",
                borderRadius: 8, padding: "9px 14px",
                color: "#2DD4BF", fontSize: 13, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer", flexShrink: 0,
              }}
            >
              <RefreshCw size={15} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              Ҳикояи нав
            </button>
          )}
        </div>

        {/* Empty state / generate CTA */}
        {!story && (
          <div style={{
            textAlign: "center", padding: "56px 20px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(45,212,191,0.12)",
            borderRadius: 12,
          }}>
            <Sparkles size={36} style={{ color: "rgba(45,212,191,0.5)", margin: "0 auto 16px" }} />
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, marginBottom: 20 }}>
              AI барои шумо ҳикояи англисиро мувофиқи сатҳ ва луғати омӯхтаатон месозад
            </p>
            <button
              onClick={generateStory}
              disabled={loading}
              style={{
                background: loading ? "rgba(20,184,166,0.4)" : "#14B8A6",
                color: "#04231F", border: "none", borderRadius: 8,
                padding: "12px 24px", fontWeight: 700, fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
                  Офарида истодааст...
                </>
              ) : (
                "Ҳикояи нав созед"
              )}
            </button>
            {error && (
              <p style={{ color: "#F87171", fontSize: 13, marginTop: 14 }}>{error}</p>
            )}
          </div>
        )}

        {/* Story content */}
        {story && (
          <>
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(45,212,191,0.12)",
              borderRadius: 12, padding: 20, marginBottom: 20,
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 2px" }}>{story.title_en}</h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 14 }}>{story.title_tj}</p>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.9)", whiteSpace: "pre-wrap" }}>
                {renderStoryText(story.story)}
              </p>
              <button
                onClick={() => speak(story.story.replace(/\*\*/g, ""))}
                style={{
                  marginTop: 14, display: "flex", alignItems: "center", gap: 6,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(45,212,191,0.2)",
                  borderRadius: 8, padding: "8px 14px", color: "#2DD4BF", fontSize: 13,
                  cursor: "pointer",
                }}
              >
                <Volume2 size={15} /> Гӯш кардани ҳикоя
              </button>
            </div>

            {/* New vocabulary */}
            {story.new_words?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: "white", fontWeight: 600, fontSize: 15, marginBottom: 10 }}>Калимаҳои нав</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {story.new_words.map((w, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(45,212,191,0.1)",
                      borderRadius: 8, padding: "10px 14px",
                    }}>
                      <div>
                        <span style={{ color: "#2DD4BF", fontWeight: 700, fontSize: 14 }}>{w.word}</span>
                        {w.phonetic && (
                          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginLeft: 8 }}>{w.phonetic}</span>
                        )}
                        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 2 }}>{w.translation_tj}</div>
                      </div>
                      <button
                        onClick={() => speak(w.word)}
                        style={{ background: "none", border: "none", color: "#2DD4BF", cursor: "pointer", padding: 4, flexShrink: 0 }}
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comprehension questions */}
            {story.comprehension_questions?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ color: "white", fontWeight: 600, fontSize: 15, marginBottom: 10 }}>Саволҳои фаҳмиш</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {story.comprehension_questions.map((q, i) => (
                    <div key={i} style={{
                      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(45,212,191,0.1)",
                      borderRadius: 8, padding: "12px 14px",
                    }}>
                      <button
                        onClick={() => toggleAnswer(i)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          width: "100%", background: "none", border: "none", color: "white",
                          fontSize: 14, cursor: "pointer", padding: 0, textAlign: "left",
                        }}
                      >
                        <span>{q.question_tj}</span>
                        {revealedAnswers[i] ? <ChevronUp size={16} color="#2DD4BF" /> : <ChevronDown size={16} color="rgba(255,255,255,0.4)" />}
                      </button>
                      {revealedAnswers[i] && (
                        <p style={{ color: "#2DD4BF", fontSize: 13, marginTop: 8, marginBottom: 0 }}>{q.answer}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Story AI chat */}
            <div style={{ marginTop: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, background: "rgba(45,212,191,0.15)",
                  border: "1px solid rgba(45,212,191,0.3)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <MessageCircle size={18} style={{ color: "#2DD4BF" }} />
                </div>
                <div>
                  <p style={{ color: "white", fontWeight: 500, fontSize: 15, margin: 0 }}>Ҳикояро муҳокима кун</p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>Саволатро аз AI бипурс</p>
                </div>
              </div>

              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(45,212,191,0.12)",
                borderRadius: 8, padding: 16, maxHeight: 280, overflowY: "auto", marginBottom: 12,
              }}>
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
                    <div style={{
                      maxWidth: "80%", padding: "10px 14px",
                      borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                      background: msg.role === "user" ? "#14B8A6" : "rgba(255,255,255,0.07)",
                      color: msg.role === "user" ? "#04231F" : "white",
                      fontSize: 14, lineHeight: 1.5,
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, padding: "8px 0" }}>
                    AI ҷавоб медиҳад...
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendStoryMessage()}
                  placeholder="Саволатро бинавис... (ба тоҷикӣ ё англисӣ)"
                  style={{
                    flex: 1, background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(45,212,191,0.2)", borderRadius: 6,
                    padding: "11px 14px", color: "white", fontSize: 14, outline: "none",
                  }}
                />
                <button
                  onClick={sendStoryMessage}
                  disabled={!chatInput.trim() || chatLoading}
                  style={{
                    background: chatInput.trim() ? "#14B8A6" : "rgba(255,255,255,0.1)",
                    color: chatInput.trim() ? "#04231F" : "rgba(255,255,255,0.3)",
                    border: "none", borderRadius: 6, padding: "11px 20px",
                    fontWeight: 600, fontSize: 14,
                    cursor: chatInput.trim() ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  <Send size={15} />
                  Фиристодан
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
