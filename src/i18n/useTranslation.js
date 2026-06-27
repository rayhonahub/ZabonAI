import { useState, useEffect } from 'react'
import { translations } from './translations'

export function useTranslation() {
  const [lang, setLang] = useState(
    localStorage.getItem('app_language') || 'ru'
  )

  const changeLang = (newLang) => {
    setLang(newLang)
    localStorage.setItem('app_language', newLang)
    window.dispatchEvent(new Event('languageChanged'))
  }

  useEffect(() => {
    const handleChange = () => {
      setLang(localStorage.getItem('app_language') || 'ru')
    }
    window.addEventListener('languageChanged', handleChange)
    return () => window.removeEventListener('languageChanged', handleChange)
  }, [])

  const t = (key) => translations[lang]?.[key] || translations['ru']?.[key] || key

  return { t, lang, changeLang }
}
