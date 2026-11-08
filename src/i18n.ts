import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import dealboardEn from './games/dealboard/content/core.json'
import dealboardJudgement from './games/dealboard/content/judgement.json'
import dealboardLessons from './games/dealboard/content/lessons.json'
import dealboardPlay from './games/dealboard/content/play.json'
import dealboardLearn from './games/dealboard/content/learn.json'
import { useGame } from './store/game'

void i18n.use(initReactI18next).init({
  // Only English resources are shipped.
  resources: { en: { translation: en, dealboard: { ...dealboardEn, ...dealboardPlay, ...dealboardLearn, ...dealboardJudgement, ...dealboardLessons } } },
  lng: 'en',
  supportedLngs: ['en'],
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

const apply = () => {
  document.documentElement.lang = 'en'
  void i18n.changeLanguage('en')
}
apply()
useGame.subscribe((s, p) => {
  if (s.language !== p.language) apply()
})

export default i18n
