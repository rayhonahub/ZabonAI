import { Trophy } from "lucide-react";

export default function LevelUpModal({ levelUp, unlockedCourses = [], onClose }) {
  if (!levelUp) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(6,26,28,0.75)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        className="glass-card fade-up-1"
        style={{
          width: "100%", maxWidth: 420, padding: "2.25rem",
          textAlign: "center",
          border: "1.5px solid rgba(251,191,36,0.5)",
          boxShadow: "0 0 40px rgba(251,191,36,0.2)",
        }}
      >
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 76, height: 76, borderRadius: "50%",
          background: "rgba(251,191,36,0.12)",
          border: "2.5px solid #FBBF24",
          boxShadow: "0 0 32px rgba(251,191,36,0.35)",
          marginBottom: "1.25rem",
        }}>
          <Trophy size={34} style={{ color: "#FBBF24" }} />
        </div>

        <h1 style={{ color: "#FBBF24", fontWeight: 700, fontSize: 22, margin: "0 0 8px" }}>
          Табрик! Шумо сатҳи баъдиро кушодед!
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, margin: "0 0 1.5rem" }}>
          Акнун сатҳи {levelUp.new_level_label_tj} кушода аст!
        </p>

        {unlockedCourses.length > 0 && (
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(251,191,36,0.15)",
            borderRadius: 8,
            padding: "1rem 1.1rem",
            marginBottom: "1.75rem",
            textAlign: "left",
          }}>
            <p style={{ color: "#FBBF24", fontWeight: 600, fontSize: 13, margin: "0 0 8px" }}>
              Курсҳои нав кушода шуданд:
            </p>
            {unlockedCourses.map((title, i) => (
              <p key={i} style={{ color: "rgba(255,255,255,0.75)", fontSize: 13.5, margin: "0 0 6px" }}>
                📖 {title}
              </p>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: "100%", background: "#14B8A6", color: "#04231F",
            border: "none", borderRadius: 6, padding: "0.8rem",
            fontWeight: 600, fontSize: 15, cursor: "pointer",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Идома деҳ
        </button>
      </div>
    </div>
  );
}
