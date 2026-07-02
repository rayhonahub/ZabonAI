export const LANGUAGES = [
  { code: "ru", flag: "🇷🇺", label: "RU" },
  { code: "tj", flag: "🇹🇯", label: "TJ" },
  { code: "en", flag: "🇬🇧", label: "EN" },
];

export function getLang() {
  return localStorage.getItem("lang") || "tj";
}

export function setLang(code) {
  localStorage.setItem("lang", code);
}
