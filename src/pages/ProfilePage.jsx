import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { LANGUAGES, setLang } from "../utils/lang";

const AVATAR_COLORS = [
  "#f0a500", "#1e3a5f", "#10b981", "#3b82f6", "#a855f7",
  "#ec4899", "#f43f5e", "#f97316", "#14b8a6", "#6366f1",
];

const LEVEL_BANDS = [
  { key: "beginner", min: 0, max: 100, label: "Beginner 🌱" },
  { key: "elementary", min: 101, max: 300, label: "Elementary 📚" },
  { key: "intermediate", min: 301, max: 600, label: "Intermediate 🚀" },
  { key: "advanced", min: 601, max: Infinity, label: "Advanced ⭐" },
];

const ACHIEVEMENTS = [
  { key: "first_lesson", emoji: "🥇", title: "First Lesson", sub: "Первый урок", check: (s) => s.total_lessons_completed >= 1 },
  { key: "on_fire", emoji: "🔥", title: "On Fire", sub: "3-дневная серия", check: (s) => s.streak >= 3 },
  { key: "quiz_master", emoji: "🧠", title: "Quiz Master", sub: "5 тестов пройдено", check: (s) => s.total_quizzes_passed >= 5 },
  { key: "bookworm", emoji: "📖", title: "Bookworm", sub: "10 уроков пройдено", check: (s) => s.total_lessons_completed >= 10 },
];

function levelProgress(xp) {
  const band = LEVEL_BANDS.find((b) => xp >= b.min && xp <= b.max) || LEVEL_BANDS[0];
  if (band.max === Infinity) return { band, percent: 100, toNext: 0 };
  const percent = Math.round(((xp - band.min) / (band.max - band.min + 1)) * 100);
  return { band, percent: Math.min(100, Math.max(0, percent)), toNext: band.max + 1 - xp };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", bio: "", avatar_color: "", selected_language: "ru" });

  useEffect(() => {
    Promise.all([api.get("/profile/me"), api.get("/progress/lessons")])
      .then(([profileRes, progressRes]) => {
        setProfile(profileRes.data);
        setForm({
          full_name: profileRes.data.full_name,
          bio: profileRes.data.bio || "",
          avatar_color: profileRes.data.avatar_color,
          selected_language: profileRes.data.selected_language,
        });
        setActivity(progressRes.data.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await api.put("/profile/update", form);
      setProfile(res.data);
      setLang(res.data.selected_language);
      setEditing(false);
    } catch {
      // keep the form open so the user can retry
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse space-y-5">
          <div className="h-40 bg-white rounded-2xl shadow-card" />
          <div className="grid sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-white rounded-2xl shadow-card" />)}
          </div>
        </div>
      </div>
    );
  }

  const initial = profile.full_name?.trim()?.[0]?.toUpperCase() || "?";
  const { band, percent, toNext } = levelProgress(profile.xp_points);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-6">
            <div
              style={{ backgroundColor: profile.avatar_color }}
              className="w-20 h-20 rounded-full text-white font-extrabold text-3xl flex items-center justify-center shadow-sm flex-shrink-0"
            >
              {initial}
            </div>
            <div className="flex-1 min-w-[200px]">
              <h1 className="text-2xl font-extrabold text-navy">{profile.full_name}</h1>
              <p className="text-sm text-slate-400 mb-2">{profile.email}</p>
              {profile.bio && <p className="text-sm text-slate-600 mb-2">{profile.bio}</p>}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-navy">{band.label}</span>
                <span className="text-xs text-slate-400">{profile.xp_points} XP</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden max-w-xs">
                <div
                  className="h-full bg-gradient-to-r from-navy to-gold rounded-full transition-all duration-700"
                  style={{ width: `${percent}%` }}
                />
              </div>
              {band.max !== Infinity && (
                <p className="text-xs text-slate-400 mt-1">{toNext} XP to next level</p>
              )}
            </div>
            <button
              onClick={() => setEditing((v) => !v)}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-navy-dark bg-gradient-to-r from-gold-light to-gold shadow-md shadow-gold/20 hover:shadow-gold/40 transition-all duration-200 flex-shrink-0"
            >
              {editing ? "Close / Закрыть" : "Edit Profile / Редактировать"}
            </button>
          </div>

          {editing && (
            <div className="mt-6 pt-6 border-t border-slate-100 space-y-4 animate-slide-up">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-1.5 block">Full name / Имя</label>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-navy focus:ring-2 focus:ring-navy/10 outline-none transition-all duration-200 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-1.5 block">Bio / О себе</label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-navy focus:ring-2 focus:ring-navy/10 outline-none transition-all duration-200 text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-1.5 block">
                  Language / Язык объяснений
                </label>
                <div className="flex gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setForm((f) => ({ ...f, selected_language: l.code }))}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                        form.selected_language === l.code
                          ? "bg-navy text-white shadow-sm"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {l.flag} {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-400 mb-1.5 block">
                  Avatar color / Цвет аватара
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm((f) => ({ ...f, avatar_color: c }))}
                      style={{ backgroundColor: c }}
                      className={`w-9 h-9 rounded-full transition-all duration-150 ${
                        form.avatar_color === c ? "ring-2 ring-offset-2 ring-navy scale-110" : "hover:scale-105"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-navy hover:bg-navy-light transition-all duration-200 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save / Сохранить"}
              </button>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-4 gap-4">
          <StatCard emoji="🔥" value={profile.streak} label="Day streak" sub="дней подряд" />
          <StatCard emoji="⭐" value={profile.xp_points} label="XP points" sub="очков опыта" />
          <StatCard emoji="📚" value={profile.total_lessons_completed} label="Lessons done" sub="уроков пройдено" />
          <StatCard emoji="🏆" value={profile.total_quizzes_passed} label="Quizzes passed" sub="тестов пройдено" />
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
          <h2 className="text-lg font-bold text-navy mb-1">Achievements</h2>
          <p className="text-sm text-slate-400 mb-5">Достижения</p>
          <div className="grid sm:grid-cols-4 gap-4">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = a.check(profile);
              return (
                <div
                  key={a.key}
                  className={`rounded-xl p-4 text-center border-2 transition-all duration-200 ${
                    unlocked ? "border-gold bg-gold/5" : "border-slate-100 bg-slate-50 opacity-50"
                  }`}
                >
                  <div className={`text-3xl mb-1 ${unlocked ? "" : "grayscale"}`}>{a.emoji}</div>
                  <p className="text-sm font-bold text-navy">{a.title}</p>
                  <p className="text-xs text-slate-400">{a.sub}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
          <h2 className="text-lg font-bold text-navy mb-1">Recent Activity</h2>
          <p className="text-sm text-slate-400 mb-5">Недавняя активность</p>
          {activity.length === 0 ? (
            <p className="text-sm text-slate-400">No activity yet / Пока нет активности</p>
          ) : (
            <div className="space-y-2">
              {activity.map((a) => (
                <div
                  key={a.lesson_id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50"
                >
                  <span className="text-sm font-medium text-navy">{a.lesson_title || `Lesson #${a.lesson_id}`}</span>
                  <span
                    className={`text-sm font-bold px-2.5 py-1 rounded-full ${
                      a.score >= 60 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {a.score}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ emoji, value, label, sub }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5 text-center">
      <div className="text-2xl mb-1">{emoji}</div>
      <p className="text-2xl font-extrabold text-navy">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="text-xs text-slate-300">{sub}</p>
    </div>
  );
}
