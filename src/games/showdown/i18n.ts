import i18n from '../../i18n'
import en from './content/en.json'
import hi from './content/hi.json'
import te from './content/te.json'

/** Festival Showdown keeps its strings in its own `showdown` namespace, in English, Hindi and Telugu. */
i18n.addResourceBundle('en', 'showdown', en, true, true)
i18n.addResourceBundle('hi', 'showdown', hi, true, true)
i18n.addResourceBundle('te', 'showdown', te, true, true)
