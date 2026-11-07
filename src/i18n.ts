import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import hi from './locales/hi.json'
import te from './locales/te.json'
import dealboardEn from './games/dealboard/content/core.json'
import dealboardJudgement from './games/dealboard/content/judgement.json'
import dbTeJudgement from './games/dealboard/content/te/judgement.json'
import dealboardLessons from './games/dealboard/content/lessons.json'
import dealboardPlay from './games/dealboard/content/play.json'
import dbTeCore from './games/dealboard/content/te/core.json'
import dbTePlay from './games/dealboard/content/te/play.json'
import dbTeLearn from './games/dealboard/content/te/learn.json'
import dbTeLessons from './games/dealboard/content/te/lessons.json'
import dbHiCore from './games/dealboard/content/hi/core.json'
import dbHiPlay from './games/dealboard/content/hi/play.json'
import dbHiLearn from './games/dealboard/content/hi/learn.json'
import dbHiJudgement from './games/dealboard/content/hi/judgement.json'
import dbHiLessons from './games/dealboard/content/hi/lessons.json'
import dealboardLearn from './games/dealboard/content/learn.json'
import { useGame } from './store/game'

void i18n.use(initReactI18next).init({
  // game namespaces ship in English first; hi/te fall back to it until translated
  resources: { en: { translation: en, dealboard: { ...dealboardEn, ...dealboardPlay, ...dealboardLearn, ...dealboardJudgement, ...dealboardLessons } }, hi: { translation: hi, dealboard: { ...dbHiCore, ...dbHiPlay, ...dbHiLearn, ...dbHiJudgement, ...dbHiLessons } }, te: { translation: te, dealboard: { ...dbTeCore, ...dbTePlay, ...dbTeLearn, ...dbTeJudgement, ...dbTeLessons } } },
  lng: useGame.getState().language,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

const apply = (l: string) => {
  document.documentElement.lang = l
  void i18n.changeLanguage(l)
}
apply(useGame.getState().language)
useGame.subscribe((s, p) => {
  if (s.language !== p.language) apply(s.language)
})

export default i18n
