import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { usePageTitle } from "../hooks/usePageTitle";
import { avatarUrl } from "../utils/avatar";

const BG = "linear-gradient(160deg, #061A1C 0%, #0A2A2E 45%, #0E3A3F 100%)";

const RANK_META = [
  { color: "#FBBF24", shadow: "0 0 20px rgba(251,191,36,0.3)", size: 64, iconSize: 20 },
  { color: "#C0C0C0", shadow: "0 0 16px rgba(192,192,192,0.2)", size: 52, iconSize: 17 },
  { color: "#CD7F32", shadow: "0 0 14px rgba(205,127,50,0.2)", size: 48, iconSize: 16 },
];

function PodiumCard({ entry, rank }) {
  const meta = RANK_META[rank - 1];
  const isFirst = rank === 1;
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "rgba(255,255,255,0.04)",
        border: `1.5px solid ${meta.color}28`,
        borderRadius: 8,
        padding: isFirst ? "1.75rem 0.75rem 1.5rem" : "1.25rem 0.5rem 1.1rem",
        marginTop: isFirst ? 0 : "1.75rem",
        boxShadow: isFirst ? meta.shadow : "none",
        minWidth: 0,
      }}
    >
      <Trophy size={meta.iconSize} color={meta.color} style={{ marginBottom: 10, flexShrink: 0 }} />
      <img
        src={avatarUrl(entry.avatar_style, entry.avatar_seed)}
        alt={entry.full_name}
        style={{
          width: meta.size, height: meta.size,
          borderRadius: "50%",
          border: `2px solid ${meta.color}`,
          marginBottom: 10,
          flexShrink: 0,
        }}
      />
      <p style={{
        color: "white", fontWeight: 600,
        fontSize: isFirst ? 14 : 13,
        textAlign: "center", marginBottom: 4,
        wordBreak: "break-word", maxWidth: "100%",
        padding: "0 4px",
      }}>
        {entry.full_name}
      </p>
      <p style={{ color: meta.color, fontWeight: 700, fontSize: 13 }}>
        {entry.weekly_xp} XP
      </p>
    </div>
  );
}

function SkeletonPodium() {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: "2rem", alignItems: "flex-end" }}>
      {[2, 1, 3].map((rank) => (
        <div key={rank} style={{ flex: 1, height: rank === 1 ? 200 : 160, borderRadius: 8, background: "rgba(255,255,255,0.04)", marginTop: rank === 1 ? 0 : "1.75rem" }} className="animate-pulse" />
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  usePageTitle("Беҳтаринҳо");
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/progress/leaderboard")
      .then((r) => setBoard(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const top3 = board.slice(0, 3);
  const rest = board.slice(3);

  // podium order: 2nd left, 1st center, 3rd right
  const podiumOrder = [
    top3.find((e) => e.rank === 2),
    top3.find((e) => e.rank === 1),
    top3.find((e) => e.rank === 3),
  ].filter(Boolean);

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <Navbar />
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "2.5rem 1rem" }}>
        {/* Header */}
        <div className="fade-up-1" style={{ textAlign: "center", marginBottom: "2.25rem" }}>
          <h1 style={{ color: "white", fontWeight: 600, fontSize: 24, margin: "0 0 8px" }}>
            Беҳтаринҳои ҳафта
          </h1>
          <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 14, margin: 0 }}>
            Рейтинг ҳар душанбе аз нав сар мешавад
          </p>
        </div>

        {loading ? (
          <SkeletonPodium />
        ) : board.length === 0 ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.28)", padding: "3rem 0", fontSize: 15 }}>
            Ҳоло касе дар рейтинг нест.
          </div>
        ) : (
          <>
            {/* Podium top 3 */}
            {top3.length > 0 && (
              <div className="fade-up-2" style={{ display: "flex", gap: 10, marginBottom: "2rem", alignItems: "flex-end" }}>
                {podiumOrder.map((entry) => (
                  <PodiumCard key={entry.rank} entry={entry} rank={entry.rank} />
                ))}
              </div>
            )}

            {/* Ranks 4-10 list */}
            {rest.length > 0 && (
              <div className="fade-up-3" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {rest.map((entry) => (
                  <div
                    key={entry.rank}
                    className="glass-card"
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.875rem 1rem" }}
                  >
                    <span style={{ color: "rgba(255,255,255,0.28)", fontWeight: 700, fontSize: 15, width: 22, textAlign: "center", flexShrink: 0 }}>
                      {entry.rank}
                    </span>
                    <img
                      src={avatarUrl(entry.avatar_style, entry.avatar_seed)}
                      alt={entry.full_name}
                      style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid rgba(45,212,191,0.18)", flexShrink: 0 }}
                    />
                    <span style={{ color: "rgba(255,255,255,0.82)", fontSize: 14, fontWeight: 500, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {entry.full_name}
                    </span>
                    <span style={{ color: "#2DD4BF", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                      {entry.weekly_xp} XP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
