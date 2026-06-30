import { useEffect, useState } from "react";
import { Trophy, BookOpen, Gem, Flame, Users, Star } from "lucide-react";
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
  { key: "first_steps", Icon: Star, color: "text-gold", title: "First Steps", sub: "Первый шаг", check: (s) => s.total_lessons_completed >= 1 },
  { key: "on_fire", Icon: Flame, color: "text-accent", title: "On Fire", sub: "3-дневная серия", check: (s) => s.streak >= 3 },
  { key: "quiz_master", Icon: Trophy, color: "text-primary-light", title: "Quiz Master", sub: "5 тестов пройдено", check: (s) => s.total_quizzes_passed >= 5 },
  { key: "bookworm", Icon: BookOpen, color: "text-emerald-400", title: "Bookworm", sub: "10 уроков пройдено", check: (s) => s.total_lessons_completed >= 10 },
  { key: "traveler", Icon: Star, color: "text-gold", title: "Traveler", sub: "Курс пройден", check: (s) => s.travel_completed },
];

function levelProgress(xp) {
  const band = LEVEL_BANDS.find((b) => xp >= b.min && xp <= b.max) || LEVEL_BANDS[0];
  if (band.max === Infinity) return { band, percent: 100, toNext: 0 };
  const percent = Math.round(((xp - band.min) / (band.max - band.min + 1)) * 100);
  return { band, percent: Math.min(100, Math.max(0, percent)), toNext: band.max + 1 - xp };
}

function StatCard({ Icon, iconColor, value, label, sub }) {
  return (
    <div className="glass-card p-5 text-center">
      <Icon size={22} className={`${iconColor} mx-auto mb-2`} />
      <p className="text-2xl font-extrabold text-white font-sora">{value}</p>
      <p className="text-xs font-semibold text-white/60 mt-0.5">{label}</p>
      <p className="text-xs text-white/30">{sub}</p>
    </div>
  );
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
    try { await saveProfile({ avatar_style: style }); } catch { /* ignore */ }
  }

  async function handleRandomize() {
    try { await saveProfile({ avatar_seed: randomAvatarSeed() }); } catch { /* ignore */ }
  }

  async function handleNameSave() {
    setEditingName(false);
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === profile.full_name) return;
    try { await saveProfile({ full_name: trimmed }); } catch { /* ignore */ }
  }

  async function handleBioSave() {
    setEditingBio(false);
    if (bioDraft === (profile.bio || "")) return;
    try { await saveProfile({ bio: bioDraft }); } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse space-y-5">
          <div className="h-40 bg-white/10 rounded-2xl" />
          <div className="grid sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-white/10 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const { band, percent, toNext } = levelProgress(profile.xp_points);

  return (
    <div className="min-h-screen bg-ink page-enter">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* Avatar + info */}
        <div className="glass-card p-6 sm:p-8">
          <div className="flex flex-col items-center text-center gap-3">
            <img
              src={avatarUrl(profile.avatar_style, profile.avatar_seed)}
              alt={profile.full_name}
              className="w-[120px] h-[120px] rounded-full border-2 border-primary/30 shadow-glow"
            />

            <div className="flex flex-wrap items-center justify-center gap-2">
              {AVATAR_STYLES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => handleStyleChange(s.key)}
                  title={s.label}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-150 ${
                    profile.avatar_style === s.key
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white/10 text-white/60 hover:bg-white/15"
                  }`}
                >
                  <span>{s.emoji}</span> {s.label}
                </button>
              ))}
              <button
                onClick={handleRandomize}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold bg-primary/15 text-primary-light hover:bg-primary/25 transition-all duration-150"
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
                className="text-2xl font-extrabold text-white text-center border-b-2 border-primary/40 outline-none bg-transparent"
              />
            ) : (
              <h1
                onClick={() => { setNameDraft(profile.full_name); setEditingName(true); }}
                title="Click to edit"
                className="text-2xl font-extrabold text-white font-sora cursor-pointer hover:opacity-70 transition-opacity duration-150"
              >
                {profile.full_name}
              </h1>
            )}
            <p className="text-sm text-white/40">{profile.email}</p>

            {editingBio ? (
              <textarea
                autoFocus
                rows={2}
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                onBlur={handleBioSave}
                className="glass-input w-full max-w-md p-2 text-sm resize-none rounded-xl"
              />
            ) : (
              <p
                onClick={() => { setBioDraft(profile.bio || ""); setEditingBio(true); }}
                title="Click to edit"
                className="text-sm text-white/55 cursor-pointer hover:opacity-70 transition-opacity duration-150 max-w-md"
              >
                {profile.bio || "Add a bio / Добавить описание"}
              </p>
            )}

            <div className="w-full max-w-xs">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-sm font-bold text-white">{band.label}</span>
                <span className="text-xs text-white/40">{profile.xp_points} XP</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-700"
                  style={{ width: `${percent}%` }}
                />
              </div>
              {band.max !== Infinity && (
                <p className="text-xs text-white/40 mt-1">{toNext} XP to next level</p>
              )}
            </div>

            <button
              onClick={() => setEditing((v) => !v)}
              className="mt-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-primary hover:bg-primary-dark shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all duration-200"
            >
              {editing ? "Close / Закрыть" : "Edit Profile / Редактировать"}
            </button>
          </div>

          {editing && (
            <div className="mt-6 pt-6 border-t border-white/10 space-y-4 animate-slide-up">
              <div>
                <label className="text-xs font-bold uppercase text-white/40 mb-1.5 block">Full name / Имя</label>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="glass-input w-full px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-white/40 mb-1.5 block">Bio / О себе</label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  className="glass-input w-full px-3 py-2.5 text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-white/40 mb-1.5 block">
                  Language / Язык объяснений
                </label>
                <div className="flex gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setForm((f) => ({ ...f, selected_language: l.code }))}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                        form.selected_language === l.code
                          ? "bg-primary text-white shadow-sm"
                          : "bg-white/10 text-white/60 hover:bg-white/15"
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
                  className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-primary hover:bg-primary-dark transition-all duration-200 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save / Сохранить"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white/60 bg-white/10 hover:bg-white/15 transition-all duration-200"
                >
                  Cancel / Отмена
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid sm:grid-cols-4 gap-4">
          <StatCard Icon={Flame} iconColor="text-accent" value={profile.streak} label="Day streak" sub="дней подряд" />
          <StatCard Icon={Star} iconColor="text-gold" value={profile.xp_points} label="XP points" sub="очков опыта" />
          <StatCard Icon={BookOpen} iconColor="text-primary-light" value={profile.total_lessons_completed} label="Lessons done" sub="уроков пройдено" />
          <StatCard Icon={Gem} iconColor="text-primary-light" value={profile.coins} label="Coins" sub="монеты" />
        </div>

        {/* Achievements */}
        <div className="glass-card p-6 sm:p-8">
          <h2 className="text-lg font-bold text-white font-sora mb-0.5">Achievements</h2>
          <p className="text-sm text-white/40 mb-5">Достижения</p>
          <div className="grid sm:grid-cols-5 gap-4">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = a.check(profile);
              return (
                <div
                  key={a.key}
                  className={`relative rounded-xl p-4 text-center border transition-all duration-200 ${
                    unlocked ? "border-primary/40 bg-primary/10" : "border-white/10 bg-white/5 opacity-50"
                  }`}
                >
                  {!unlocked && <span className="absolute top-2 right-2 text-xs text-white/30">🔒</span>}
                  <a.Icon size={28} className={`${a.color} mx-auto mb-2 ${!unlocked ? "opacity-40" : ""}`} />
                  <p className="text-sm font-bold text-white">{a.title}</p>
                  <p className="text-xs text-white/40">{a.sub}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Referral */}
        {referral && (
          <div className="glass-card p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white font-sora mb-1">🎁 Пригласи друга / Даъват кун дӯстро</h2>
            <p className="text-sm text-white/55 mb-1">За каждого приглашённого друга ты получаешь 💎 50 монет!</p>
            <p className="text-sm text-white/55 mb-5">Твой друг получает 💎 20 монет в подарок!</p>

            <div className="flex flex-col sm:flex-row gap-2 mb-5">
              <input
                readOnly
                value={referral.referral_link}
                onFocus={(e) => e.target.select()}
                className="glass-input flex-1 px-3 py-2.5 text-sm"
              />
              <button
                onClick={handleCopyReferralLink}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-primary hover:bg-primary-dark transition-all duration-200 whitespace-nowrap"
              >
                Copy 📋
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <StatCard Icon={Users} iconColor="text-primary-light" value={referral.referral_count} label="Приглашено друзей" sub="referrals" />
              <StatCard Icon={Gem} iconColor="text-primary-light" value={referral.coins_earned} label="Заработано монет" sub="coins earned" />
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

        {/* Activity */}
        <div className="glass-card p-6 sm:p-8">
          <h2 className="text-lg font-bold text-white font-sora mb-0.5">Recent Activity</h2>
          <p className="text-sm text-white/40 mb-5">Недавняя активность</p>
          {activity.length === 0 ? (
            <p className="text-sm text-white/40">No activity yet / Пока нет активности</p>
          ) : (
            <div className="space-y-2">
              {activity.map((a) => (
                <div
                  key={a.lesson_id}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5"
                >
                  <span className="text-sm font-medium text-white/80">{a.lesson_title || `Lesson #${a.lesson_id}`}</span>
                  <span
                    className={`text-sm font-bold px-2.5 py-1 rounded-full ${
                      a.score >= 60 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
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
