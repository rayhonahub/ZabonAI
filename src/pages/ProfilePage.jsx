import { useEffect, useState } from "react";
import { Trophy, BookOpen, Gem, Flame, Users, Star, Lock, UserPlus, Copy, Smile, Bot, Palette, User, Zap } from "lucide-react";
import Navbar from "../components/Navbar";
import NeuralBackground from "../components/NeuralBackground";
import api from "../api/axios";
import { avatarUrl } from "../utils/avatar";
import { showToast } from "../utils/toastBus";
import { usePageTitle } from "../hooks/usePageTitle";

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

export default function ProfilePage() {
  usePageTitle("Профил");
  const [profile, setProfile] = useState(null);
  const [referral, setReferral] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", bio: "" });

  useEffect(() => {
    Promise.all([api.get("/profile/me"), api.get("/profile/referral").catch(() => null)])
      .then(([profileRes, referralRes]) => {
        setProfile(profileRes.data);
        setForm({ full_name: profileRes.data.full_name, bio: profileRes.data.bio || "" });
        setReferral(referralRes?.data ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

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

  const { band, percent, toNext } = levelProgress(profile.xp_points);

  return (
    <div className="min-h-screen page-enter" style={{ background: "linear-gradient(160deg, #061A1C 0%, #0A2A2E 45%, #0E3A3F 100%)" }}>
      <Navbar />
      <div className="relative" style={{ minHeight: "calc(100vh - 64px)" }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: 0.3, pointerEvents: "none" }}>
          <NeuralBackground />
        </div>

        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">

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

            <h1 className="font-medium mb-1" style={{ color: "white", fontSize: 20 }}>{profile.full_name}</h1>
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
      </div>
    </div>
  );
}
