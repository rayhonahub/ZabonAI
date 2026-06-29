import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { LANGUAGES, setLang } from "../utils/lang";
import { AVATAR_STYLES, avatarUrl, randomAvatarSeed } from "../utils/avatar";
import { showToast } from "../utils/toastBus";
import { usePageTitle } from "../hooks/usePageTitle";

const LEVEL_BANDS = [
  { key: "beginner", min: 0, max: 100, label: "Beginner 🌱" },
  { key: "elementary", min: 101, max: 300, label: "Elementary 📚" },
  { key: "intermediate", min: 301, max: 600, label: "Intermediate 🚀" },
  { key: "advanced", min: 601, max: Infinity, label: "Advanced ⭐" },
];

const ACHIEVEMENTS = [
  { key: "first_steps", emoji: "🥇", title: "First Steps", sub: "Первый шаг", check: (s) => s.total_lessons_completed >= 1 },
  { key: "on_fire", emoji: "🔥", title: "On Fire", sub: "3-дневная серия", check: (s) => s.streak >= 3 },
  { key: "quiz_master", emoji: "🧠", title: "Quiz Master", sub: "5 тестов пройдено", check: (s) => s.total_quizzes_passed >= 5 },
  { key: "bookworm", emoji: "📖", title: "Bookworm", sub: "10 уроков пройдено", check: (s) => s.total_lessons_completed >= 10 },
  { key: "traveler", emoji: "✈️", title: "Traveler", sub: "Курс Travel English пройден", check: (s) => s.travel_completed },
];

function levelProgress(xp) {
  const band = LEVEL_BANDS.find((b) => xp >= b.min && xp <= b.max) || LEVEL_BANDS[0];
  if (band.max === Infinity) return { band, percent: 100, toNext: 0 };
  const percent = Math.round(((xp - band.min) / (band.max - band.min + 1)) * 100);
  return { band, percent: Math.min(100, Math.max(0, percent)), toNext: band.max + 1 - xp };
}

export default function ProfilePage() {
  usePageTitle("Profile");
  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState([]);
  const [referral, setReferral] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", bio: "", selected_language: "ru" });
  const [editingName, setEditingName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [bioDraft, setBioDraft] = useState("");

  useEffect(() => {
    Promise.all([api.get("/profile/me"), api.get("/progress/lessons"), api.get("/profile/referral")])
      .then(([profileRes, progressRes, referralRes]) => {
        setProfile(profileRes.data);
        setForm({
          full_name: profileRes.data.full_name,
          bio: profileRes.data.bio || "",
          selected_language: profileRes.data.selected_language,
        });
        setActivity(progressRes.data.slice(0, 5));
        setReferral(referralRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  function handleCopyReferralLink() {
    navigator.clipboard.writeText(referral.referral_link);
    showToast("✅ Ссылка скопирована!", "success");
  }

  async function saveProfile(patch) {
    const res = await api.put("/profile/update", patch);
    setProfile(res.data);
    return res.data;
  }

  async function handleSave() {
    setSaving(true);
    try {
      const data = await saveProfile(form);
      setLang(data.selected_language);
      setEditing(false);
    } catch {
      // keep the form open so the user can retry
    } finally {
      setSaving(false);
    }
  }

  async function handleStyleChange(style) {
    try {
      await saveProfile({ avatar_style: style });
    } catch {
      // ignore, avatar stays as-is
    }
  }

  async function handleRandomize() {
    try {
      await saveProfile({ avatar_seed: randomAvatarSeed() });
    } catch {
      // ignore, avatar stays as-is
    }
  }

  async function handleNameSave() {
    setEditingName(false);
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === profile.full_name) return;
    try {
      await saveProfile({ full_name: trimmed });
    } catch {
      // ignore, name stays as-is
    }
  }

  async function handleBioSave() {
    setEditingBio(false);
    if (bioDraft === (profile.bio || "")) return;
    try {
      await saveProfile({ bio: bioDraft });
    } catch {
      // ignore, bio stays as-is
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

  const { band, percent, toNext } = levelProgress(profile.xp_points);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
          <div className="flex flex-col items-center text-center gap-3">
            <img
              src={avatarUrl(profile.avatar_style, profile.avatar_seed)}
              alt={profile.full_name}
              className="w-[120px] h-[120px] rounded-full bg-slate-100 shadow-sm"
            />

            <div className="flex flex-wrap items-center justify-center gap-2">
              {AVATAR_STYLES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => handleStyleChange(s.key)}
                  title={s.label}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-150 ${
                    profile.avatar_style === s.key
                      ? "bg-navy text-white shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  <span>{s.emoji}</span> {s.label}
                </button>
              ))}
              <button
                onClick={handleRandomize}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold bg-gold/15 text-navy hover:bg-gold/25 transition-all duration-150"
              >
                🎲 Randomize
              </button>
            </div>

            {editingName ? (
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
                className="text-2xl font-extrabold text-navy text-center border-b-2 border-navy/30 outline-none bg-transparent"
              />
            ) : (
              <h1
                onClick={() => { setNameDraft(profile.full_name); setEditingName(true); }}
                title="Click to edit / Нажмите для редактирования"
                className="text-2xl font-extrabold text-navy cursor-pointer hover:opacity-70 transition-opacity duration-150"
              >
                {profile.full_name}
              </h1>
            )}
            <p className="text-sm text-slate-400">{profile.email}</p>

            {editingBio ? (
              <textarea
                autoFocus
                rows={2}
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                onBlur={handleBioSave}
                className="text-sm text-slate-600 text-center border border-slate-200 rounded-lg outline-none w-full max-w-md p-2 resize-none"
              />
            ) : (
              <p
                onClick={() => { setBioDraft(profile.bio || ""); setEditingBio(true); }}
                title="Click to edit / Нажмите для редактирования"
                className="text-sm text-slate-500 cursor-pointer hover:opacity-70 transition-opacity duration-150 max-w-md"
              >
                {profile.bio || "Add a bio / Добавить описание"}
              </p>
            )}

            <div className="w-full max-w-xs">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-sm font-bold text-navy">{band.label}</span>
                <span className="text-xs text-slate-400">{profile.xp_points} XP</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
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
              className="mt-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-navy-dark bg-gradient-to-r from-gold-light to-gold shadow-md shadow-gold/20 hover:shadow-gold/40 transition-all duration-200"
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
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-navy hover:bg-navy-light transition-all duration-200 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save / Сохранить"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-6 py-2.5 rounded-xl font-semibold text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all duration-200"
                >
                  Cancel / Отмена
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-4 gap-4">
          <StatCard emoji="🔥" value={profile.streak} label="Day streak" sub="дней подряд" />
          <StatCard emoji="⭐" value={profile.xp_points} label="XP points" sub="очков опыта" />
          <StatCard emoji="📚" value={profile.total_lessons_completed} label="Lessons done" sub="уроков пройдено" />
          <StatCard emoji="💎" value={profile.coins} label="Coins" sub="монеты" />
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
          <h2 className="text-lg font-bold text-navy mb-1">Achievements</h2>
          <p className="text-sm text-slate-400 mb-5">Достижения</p>
          <div className="grid sm:grid-cols-5 gap-4">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = a.check(profile);
              return (
                <div
                  key={a.key}
                  className={`relative rounded-xl p-4 text-center border-2 transition-all duration-200 ${
                    unlocked ? "border-gold bg-gold/5" : "border-slate-100 bg-slate-50 opacity-50"
                  }`}
                >
                  {!unlocked && <span className="absolute top-2 right-2 text-sm">🔒</span>}
                  <div className={`text-3xl mb-1 ${unlocked ? "" : "grayscale"}`}>{a.emoji}</div>
                  <p className="text-sm font-bold text-navy">{a.title}</p>
                  <p className="text-xs text-slate-400">{a.sub}</p>
                </div>
              );
            })}
          </div>
        </div>

        {referral && (
          <div className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
            <h2 className="text-lg font-bold text-navy mb-1">Пригласи друга / Даъват кун дӯстро 🎁</h2>
            <p className="text-sm text-slate-500 mb-1">За каждого приглашённого друга ты получаешь 💎 50 монет!</p>
            <p className="text-sm text-slate-500 mb-5">Твой друг получает 💎 20 монет в подарок!</p>

            <div className="flex flex-col sm:flex-row gap-2 mb-5">
              <input
                readOnly
                value={referral.referral_link}
                onFocus={(e) => e.target.select()}
                className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none text-sm text-slate-600"
              />
              <button
                onClick={handleCopyReferralLink}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-navy hover:bg-navy-light transition-all duration-200 whitespace-nowrap"
              >
                Copy 📋
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <StatCard emoji="👥" value={referral.referral_count} label="Приглашено друзей" sub="referrals" />
              <StatCard emoji="💎" value={referral.coins_earned} label="Заработано монет" sub="coins earned" />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(referral.referral_link)}&text=${encodeURIComponent("Учи английский бесплатно с ИИ!")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#229ED9] hover:opacity-90 transition-all duration-200"
              >
                📱 Поделиться в Telegram
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Учи английский с ZaboniAI! ${referral.referral_link}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#25D366] hover:opacity-90 transition-all duration-200"
              >
                📲 Поделиться в WhatsApp
              </a>
            </div>
          </div>
        )}

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
