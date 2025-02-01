import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

import en from './translations/en';
import fr from './translations/fr';

const i18n = new I18n({
  en,
  fr,
});

i18n.defaultLocale = 'en';
i18n.locale = Localization.locale.split('-')[0];
i18n.enableFallback = true;

export default i18n; 