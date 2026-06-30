import { translations } from './translations'

export function useTranslation() {
  const lang = 'tj'
  const t = (key) => translations['tj']?.[key] || key
  const changeLang = () => {}
  return { t, lang, changeLang }
}
