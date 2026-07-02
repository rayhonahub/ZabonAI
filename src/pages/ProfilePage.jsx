import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Trophy, BookOpen, Gem, Flame, Star, Lock, UserPlus, Copy, Smile, Bot, Palette, User, Zap,
  BarChart2, CheckCircle, Sparkles,
} from "lucide-react";
import Navbar from "../components/Navbar";
import NeuralBackground from "../components/NeuralBackground";
import api from "../api/axios";
import { avatarUrl } from "../utils/avatar";
import { showToast } from "../utils/toastBus";
import { usePageTitle } from "../hooks/usePageTitle";
import { useCountUp } from "../hooks/useCountUp";

const LEVEL_BANDS = [
  { key: "beginner", min: 0, max: 100, label: "Сатҳи ибтидоӣ 🌱" },
  { key: "elementary", min: 101, max: 300, label: "Сатҳи миёна 📖" },
  { key: "intermediate", min: 301, max: 600, label: "Сатҳи болотар ⭐" },
  { key: "advanced", min: 601, max: Infinity, label: "Сатҳи баланд 🏆" },
];

const AVATAR_STYLE_OPTIONS = [
  { key: "adventurer", Icon: Smile, label: "Рӯй" },
  { key: "bottts", Icon: Bot, label: "Робот" },
  { key: "pixel-art", Icon: Palette, label: "Санъат" },
  { key: "personas", Icon: User, label: "Инсон" },
  { key: "croodles", Icon: Star, label: "Аъло" },
];

const ACHIEVEMENTS = [
  { id: "first_lesson", Icon: BookOpen, color: "#2DD4BF", title: "Аввалин дарс", desc: "Аввалин дарсро гузаштӣ", check: (p) => p.total_lessons_completed >= 1 },
  { id: "streak3", Icon: Flame, color: "#FBBF24", title: "Оташин", desc: "3 рӯз пай дар пай", check: (p) => p.streak >= 3 },
  { id: "streak10", Icon: Zap, color: "#FBBF24", title: "Устувор", desc: "10 рӯз пай дар пай", check: (p) => p.streak >= 10 },
  { id: "quiz5", Icon: Trophy, color: "#2DD4BF", title: "Қаҳрамони тест", desc: "5 тест супоридӣ", check: (p) => p.total_quizzes_passed >= 5 },
  { id: "lessons10", Icon: Star, color: "#FBBF24", title: "Хонанда", desc: "10 дарс гузаштӣ", check: (p) => p.total_lessons_completed >= 10 },
  { id: "coins100", Icon: Gem, color: "#2DD4BF", title: "Сарватманд", desc: "100 танга ҷамъ кардӣ", check: (p) => p.coins >= 100 },
];

function levelProgress(xp) {
  const band = LEVEL_BANDS.find((b) => xp >= b.min && xp <= b.max) || LEVEL_BANDS[0];
  if (band.max === Infinity) return { band, percent: 100, toNext: 0 };
  const percent = Math.round(((xp - band.min) / (band.max - band.min + 1)) * 100);
  return { band, percent: Math.min(100, Math.max(0, percent)), toNext: band.max + 1 - xp };
}

const statCardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(45,212,191,0.12)",
  borderRadius: 8,
  padding: "24px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const cardLabelRowStyle = { display: "flex", alignItems: "center", gap: 6 };

const cardLabelTextStyle = {
  color: "rgba(255,255,255,0.45)",
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  margin: 0,
};

const cardValueStyle = {
  color: "white",
  fontSize: 32,
  fontWeight: 500,
  letterSpacing: "-0.02em",
  margin: "4px 0",
};

const cardSublabelStyle = { color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0 };

const glassSectionStyle = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8,
  padding: 20,
};

const sectionHeadingStyle = {
  color: "rgba(255,255,255,0.7)",
  fontSize: 14,
  fontWeight: 500,
  margin: "0 0 16px",
};

function ProgressRing({ percent, size = 72, stroke = 7 }) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimatedPercent(percent), 100);
    return () => clearTimeout(t);
  }, [percent]);

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercent / 100) * circumference;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#14B8A6"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
    </div>
  );
}

function StatCard({ Icon, iconColor, label, value, sublabel }) {
  return (
    <div style={statCardStyle}>
      <div style={cardLabelRowStyle}>
        <Icon size={14} color={iconColor} />
        <p style={cardLabelTextStyle}>{label}</p>
      </div>
      <p style={cardValueStyle}>{value}</p>
      {sublabel && <p style={cardSublabelStyle}>{sublabel}</p>}
    </div>
  );
}

function StreakCalendar({ streak }) {
  const days = [];
  const today = new Date();
  const dayLabels = ["Дш", "Сш", "Чш", "Пш", "Ҷм", "Шн", "Яш"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const isActive = i < Math.min(streak, 7);
    days.push({ date: d, isActive, isToday: i === 0, label: dayLabels[(d.getDay() + 6) % 7] });
  }
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
      {days.map((d, idx) => {
        let circleStyle;
        if (d.isToday) {
          circleStyle = { background: "transparent", border: "2px solid #2DD4BF", color: d.isActive ? "#2DD4BF" : "rgba(255,255,255,0.3)" };
        } else if (d.isActive) {
          circleStyle = { background: "#14B8A6", color: "white" };
        } else {
          circleStyle = { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" };
        }
        return (
          <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                transition: "all 0.3s",
                ...circleStyle,
              }}
            >
              {d.isActive && <Flame size={14} color={circleStyle.color} />}
            </div>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, marginTop: 8 }}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function scoreColor(score) {
  if (score >= 80) return "#14B8A6";
  if (score >= 60) return "#FBBF24";
  return "#EF4444";
}

function QuizScoreList({ entries }) {
  if (entries.length === 0) {
    return <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, textAlign: "center", margin: 0 }}>Ҳоло тест нагузаштед</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {entries.map((e, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ color: "white", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {e.lesson_title || "Дарс"}
          </span>
          <span style={{ color: scoreColor(e.score), fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
            {Math.round(e.score)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function StatPill({ Icon, iconColor, label }) {
  return (
    <span
      className="flex items-center gap-1.5"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 999,
        padding: "5px 12px",
        fontSize: 12,
        fontWeight: 500,
        color: "rgba(255,255,255,0.75)",
      }}
    >
      <Icon size={12} color={iconColor} /> {label}
    </span>
  );
}

const TABS = [
  { key: "profile", label: "Профил", Icon: User },
  { key: "progress", label: "Пешрафт", Icon: BarChart2 },
];

export default function ProfilePage() {
  usePageTitle("Профил");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState("profile");

  // Profile tab state
  const [profile, setProfile] = useState(null);
  const [referral, setReferral] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", bio: "" });

  // Progress tab state
  const [summary, setSummary] = useState(null);
  const [lessonsProgress, setLessonsProgress] = useState([]);
  const [progressLoading, setProgressLoading] = useState(true);
  const [advice, setAdvice] = useState(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [digest, setDigest] = useState(null);
  const [digestLoading, setDigestLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/profile/me"), api.get("/profile/referral").catch(() => null)])
      .then(([profileRes, referralRes]) => {
        setProfile(profileRes.data);
        setForm({ full_name: profileRes.data.full_name, bio: profileRes.data.bio || "" });
        setReferral(referralRes?.data ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "progress") setActiveTab("progress");
  }, []);

  function fetchProgressData() {
    setProgressLoading(true);
    Promise.all([api.get("/progress/summary"), api.get("/progress/lessons")])
      .then(([summaryRes, lessonsRes]) => {
        setSummary(summaryRes.data);
        setLessonsProgress(lessonsRes.data);
      })
      .finally(() => setProgressLoading(false));
  }

  function fetchWeeklyDigest() {
    setDigestLoading(true);
    api
      .get("/ai/weekly-digest")
      .then((res) => setDigest(res.data))
      .catch(() => setDigest(null))
      .finally(() => setDigestLoading(false));
  }

  useEffect(() => {
    if (activeTab === "progress") {
      fetchProgressData();
      fetchWeeklyDigest();
    }
  }, [activeTab]);

  async function getAdvice() {
    setAdviceLoading(true);
    setAdvice(null);
    try {
      const res = await api.get("/ai/weak-topics-advice");
      setAdvice(res.data.advice);
    } catch {
      setAdvice("Ҳоло маслиҳатро гирифта натавонистем");
    } finally {
      setAdviceLoading(false);
    }
  }

  async function saveProfile(patch) {
    const res = await api.put("/profile/update", patch);
    setProfile(res.data);
    return res.data;
  }

  async function handleStyleChange(style) {
    try { await saveProfile({ avatar_style: style }); } catch { /* ignore */ }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveProfile(form);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCopyReferralLink() {
    navigator.clipboard.writeText(referral.referral_link);
    showToast("Нусха гирифта шуд!", "success");
  }

  const quizzesPassed = lessonsProgress.filter((p) => (p.score ?? 0) >= 60).length;
  const xp = (summary?.completed_lessons ?? 0) * 10 + quizzesPassed * 20;
  const animatedXp = useCountUp(xp);
  const animatedCompleted = useCountUp(summary?.completed_lessons ?? 0);

  const completionPercent = summary?.total_lessons
    ? (summary.completed_lessons / summary.total_lessons) * 100
    : 0;

  const scoreEntries = useMemo(
    () => lessonsProgress.filter((p) => p.score !== null && p.score !== undefined).slice(-10),
    [lessonsProgress]
  );

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #061A1C 0%, #0A2A2E 45%, #0E3A3F 100%)" }}>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-10 animate-pulse space-y-5">
          <div className="h-80 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
      </div>
    );
  }

  const { band, percent } = levelProgress(profile.xp_points);

  return (
    <div className="min-h-screen page-enter" style={{ background: "linear-gradient(160deg, #061A1C 0%, #0A2A2E 45%, #0E3A3F 100%)" }}>
      <Navbar />
      <div className="relative" style={{ minHeight: "calc(100vh - 64px)" }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: 0.3, pointerEvents: "none" }}>
          <NeuralBackground />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-10">

          <div className="flex items-center justify-between flex-wrap gap-4" style={{ marginBottom: 28 }}>
            <h1 className="font-medium" style={{ color: "white", fontSize: 24, margin: 0 }}>Профил ва Пешрафт</h1>

            <div
              style={{
                display: "flex",
                gap: 4,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(45,212,191,0.12)",
                borderRadius: 6,
                padding: 4,
                width: "fit-content",
              }}
            >
              {TABS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className="flex items-center gap-1.5"
                  style={
                    activeTab === key
                      ? { background: "#14B8A6", color: "#04231F", borderRadius: 4, padding: "8px 20px", fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer" }
                      : { background: "transparent", color: "rgba(255,255,255,0.5)", padding: "8px 20px", fontSize: 14, border: "none", cursor: "pointer" }
                  }
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "profile" && (
            <div className="tab-content max-w-2xl mx-auto space-y-6">

              {/* Top card */}
              <div className="glass-card p-6 text-center">
                <div className="relative inline-block mb-4">
                  <img
                    src={avatarUrl(profile.avatar_style, profile.avatar_seed)}
                    alt={profile.full_name}
                    className="w-20 h-20 rounded-full"
                    style={{ border: "3px solid #14B8A6", boxShadow: "0 0 20px rgba(20,184,166,0.35)" }}
                  />
                </div>

                <div className="flex items-center justify-center gap-2 mb-4">
                  {AVATAR_STYLE_OPTIONS.map(({ key, Icon, label }) => (
                    <button
                      key={key}
                      onClick={() => handleStyleChange(key)}
                      title={label}
                      className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-150"
                      style={
                        profile.avatar_style === key
                          ? { border: "2px solid #14B8A6", background: "rgba(20,184,166,0.15)", color: "#2DD4BF" }
                          : { border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.45)" }
                      }
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>

                <h2 className="font-medium mb-1" style={{ color: "white", fontSize: 20 }}>{profile.full_name}</h2>
                <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>{profile.email}</p>

                <div className="inline-block mb-4">
                  <span
                    className="glass-card px-4 py-1.5 text-sm font-medium"
                    style={{ color: "#2DD4BF", borderColor: "rgba(20,184,166,0.35)", boxShadow: "0 0 12px rgba(20,184,166,0.15)", borderRadius: 20 }}
                  >
                    {band.label}
                  </span>
                </div>

                <div className="max-w-xs mx-auto mb-5">
                  <div className="flex items-center justify-between mb-1.5 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                    <span>XP то сатҳи баъдӣ: {profile.xp_points} аз {band.max === Infinity ? "∞" : band.max + 1}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percent}%`, background: "#14B8A6" }} />
                  </div>
                </div>

                <button
                  onClick={() => setEditing((v) => !v)}
                  className="px-6 py-2 text-sm font-medium transition-all duration-200"
                  style={{ background: "rgba(20,184,166,0.12)", color: "#2DD4BF", borderRadius: 6, border: "1px solid rgba(20,184,166,0.25)" }}
                >
                  {editing ? "Бекор кардан" : "Таҳрир кардан"}
                </button>

                {editing && (
                  <div className="mt-6 text-left space-y-4">
                    <div>
                      <label className="text-xs font-medium block mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Номи пурра</label>
                      <input
                        value={form.full_name}
                        onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm outline-none"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(45,212,191,0.2)", color: "white", borderRadius: 6 }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Дар бораи худ</label>
                      <textarea
                        rows={3}
                        value={form.bio}
                        onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm outline-none resize-none"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(45,212,191,0.2)", color: "white", borderRadius: 6 }}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-60"
                        style={{ background: "#14B8A6", color: "#04231F", borderRadius: 6 }}
                      >
                        {saving ? "..." : "Нигоҳ доштан"}
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="px-6 py-2.5 text-sm font-medium transition-all duration-200"
                        style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)" }}
                      >
                        Бекор кардан
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { Icon: Flame, iconColor: "#FBBF24", value: profile.streak, label: "Рӯзи силсила" },
                  { Icon: Star, iconColor: "#2DD4BF", value: profile.xp_points, label: "XP" },
                  { Icon: BookOpen, iconColor: "#2DD4BF", value: profile.total_lessons_completed, label: "Дарсҳо" },
                  { Icon: Gem, iconColor: "#FBBF24", value: profile.coins, label: "Танга" },
                ].map(({ Icon, iconColor, value, label }) => (
                  <div key={label} className="glass-card p-4 text-center">
                    <Icon size={20} style={{ color: iconColor, margin: "0 auto 8px" }} />
                    <p className="text-xl font-semibold" style={{ color: "white" }}>{value}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Achievements */}
              <div className="glass-card p-6">
                <h2 className="text-base font-medium mb-5" style={{ color: "white" }}>Дастовардҳо</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ACHIEVEMENTS.map(({ id, Icon, color, title, desc, check }) => {
                    const unlocked = check(profile);
                    return (
                      <div
                        key={id}
                        className="relative p-4 text-center transition-all duration-200"
                        style={
                          unlocked
                            ? { border: "1px solid rgba(20,184,166,0.4)", background: "rgba(20,184,166,0.07)", borderRadius: 6 }
                            : { border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", borderRadius: 6, opacity: 0.5 }
                        }
                      >
                        {!unlocked && (
                          <Lock size={10} style={{ color: "rgba(255,255,255,0.3)", position: "absolute", top: 8, right: 8 }} />
                        )}
                        <Icon size={24} style={{ color: unlocked ? color : "rgba(255,255,255,0.2)", margin: "0 auto 8px" }} />
                        <p className="text-sm font-medium" style={{ color: "white" }}>{title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Referral card */}
              {referral && (
                <div className="glass-card p-6" style={{ borderColor: "rgba(251,191,36,0.35)" }}>
                  <h2 className="text-base font-medium mb-2 flex items-center gap-2" style={{ color: "#FBBF24" }}>
                    <UserPlus size={18} style={{ color: "#FBBF24" }} />
                    Дӯстро даъват кун
                  </h2>
                  <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Барои ҳар дӯсти даъватшуда{" "}
                    <Gem size={12} className="inline" style={{ color: "#2DD4BF" }} />{" "}
                    50 танга мегирӣ!
                  </p>
                  <div className="flex gap-2 mb-4">
                    <input
                      readOnly
                      value={referral.referral_link}
                      onFocus={(e) => e.target.select()}
                      className="flex-1 px-3 py-2 text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", borderRadius: 6 }}
                    />
                    <button
                      onClick={handleCopyReferralLink}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium"
                      style={{ background: "#14B8A6", color: "#04231F", borderRadius: 6 }}
                    >
                      <Copy size={14} /> Нусха
                    </button>
                  </div>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Даъватшудагон: {referral.referral_count} нафар
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "progress" && (
            <div className="tab-content space-y-6">

              {/* Weekly digest */}
              {digestLoading ? (
                <div className="glass-card p-6 animate-pulse" style={{ height: 180 }} />
              ) : digest ? (
                <div className="glass-card p-6" style={{ borderColor: "rgba(20,184,166,0.3)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={18} style={{ color: "#2DD4BF" }} />
                    <h2 className="text-base font-medium" style={{ color: "white" }}>Ҳисоботи ҳафтаина</h2>
                  </div>
                  <p style={{ color: "#2DD4BF", fontSize: 15, fontWeight: 500, marginBottom: 12 }}>{digest.digest.greeting}</p>
                  <div className="space-y-2" style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
                    <p style={{ margin: 0 }}>{digest.digest.achievements}</p>
                    <p style={{ margin: 0 }}>{digest.digest.stats_summary}</p>
                    <p style={{ margin: 0 }}>{digest.digest.improvement_tip}</p>
                    <p style={{ margin: 0, color: "#FBBF24" }}>{digest.digest.motivation}</p>
                    <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>{digest.digest.next_goal}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatPill Icon={BookOpen} iconColor="#2DD4BF" label={`${digest.stats.lessons_this_week} дарс дар ин ҳафта`} />
                    <StatPill Icon={BarChart2} iconColor="#2DD4BF" label={`${digest.stats.avg_score}% миёнаи натиҷа`} />
                    <StatPill Icon={Flame} iconColor="#FBBF24" label={`${digest.stats.streak} рӯзи силсила`} />
                    <StatPill Icon={Gem} iconColor="#FBBF24" label={`${digest.stats.coins} танга`} />
                  </div>
                </div>
              ) : null}

              {progressLoading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} style={{ ...statCardStyle, height: 128 }} className="animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                    <div style={statCardStyle}>
                      <div style={cardLabelRowStyle}>
                        <CheckCircle size={14} color="#14B8A6" />
                        <p style={cardLabelTextStyle}>АНҶОМШУДА</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <ProgressRing percent={completionPercent} />
                        <p style={cardValueStyle}>{Math.round(completionPercent)}%</p>
                      </div>
                      <p style={cardSublabelStyle}>
                        {animatedCompleted}/{summary?.total_lessons ?? 0} дарс
                      </p>
                    </div>
                    <StatCard Icon={Star} iconColor="#FBBF24" label="Холҳои XP" value={`${animatedXp}`} sublabel="умумии XP" />
                    <StatCard Icon={BarChart2} iconColor="#2DD4BF" label="Миёнаи натиҷа" value={`${summary?.average_score ?? 0}%`} sublabel="миёнаи натиҷа" />
                    <StatCard Icon={Flame} iconColor="#FBBF24" label="Силсилаи имрӯза" value={`${summary?.streak ?? 0}`} sublabel="рӯзи силсила" />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                    <div style={glassSectionStyle}>
                      <h2 style={sectionHeadingStyle}>7 рӯзи охир</h2>
                      <StreakCalendar streak={summary?.streak ?? 0} />
                    </div>

                    <div style={glassSectionStyle}>
                      <h2 style={sectionHeadingStyle}>Натиҷаи тестҳо</h2>
                      <QuizScoreList entries={scoreEntries} />
                    </div>
                  </div>
                </>
              )}

              <div style={{ ...glassSectionStyle, padding: 24 }}>
                <div className="flex flex-wrap items-center justify-between gap-4" style={{ marginBottom: 20 }}>
                  <h2 style={{ ...sectionHeadingStyle, margin: 0 }}>Мавзӯъҳои заиф</h2>
                  <button
                    onClick={getAdvice}
                    disabled={adviceLoading}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      fontWeight: 500,
                      fontSize: 13,
                      background: "rgba(251,191,36,0.12)",
                      border: "1px solid rgba(251,191,36,0.3)",
                      color: "#FBBF24",
                      cursor: adviceLoading ? "default" : "pointer",
                      opacity: adviceLoading ? 0.6 : 1,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {adviceLoading ? "Тайёр мешавад..." : "Маслиҳати AI"}
                  </button>
                </div>

                {!progressLoading && (!summary?.weak_topic_lessons || summary.weak_topic_lessons.length === 0) && (
                  <p
                    style={{
                      fontSize: 14,
                      borderRadius: 6,
                      padding: 16,
                      background: "rgba(20,184,166,0.06)",
                      border: "1px solid rgba(20,184,166,0.2)",
                      color: "rgba(45,212,191,0.8)",
                      textAlign: "center",
                      margin: 0,
                    }}
                  >
                    Аъло! Мавзӯи заиф надорӣ!
                  </p>
                )}

                {summary?.weak_topic_lessons?.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 8 }}>
                    {summary.weak_topic_lessons.map((wt) => (
                      <div
                        key={wt.lesson_id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          borderRadius: 6,
                          padding: "12px 16px",
                          background: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.25)",
                        }}
                      >
                        <span style={{ color: "#EF4444", fontSize: 14, fontWeight: 500 }}>{wt.title}</span>
                        <button
                          onClick={() => navigate(`/quiz/${wt.lesson_id}`)}
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#04231F",
                            background: "#EF4444",
                            border: "none",
                            borderRadius: 999,
                            padding: "6px 12px",
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                        >
                          Машқ кун →
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {advice && (
                  <div
                    style={{
                      marginTop: 20,
                      borderRadius: 6,
                      padding: "1.25rem",
                      fontSize: 14,
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(45,212,191,0.15)",
                      color: "rgba(255,255,255,0.85)",
                    }}
                  >
                    {advice}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
