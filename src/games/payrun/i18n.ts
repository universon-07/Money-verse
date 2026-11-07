import i18n from '../../i18n'
import en from './content/en.json'
import enLearning from './content/en.learning.json'

/** Pay Run keeps its strings in its own `payrun` namespace. Hindi and Telugu fall back to English until their files are added. */
i18n.addResourceBundle('en', 'payrun', en, true, true)
i18n.addResourceBundle('en', 'payrun', enLearning, true, true)
