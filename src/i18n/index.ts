import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18next, { LanguageDetectorAsyncModule } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import es from './es.json';
import fr from './fr.json';

const RESOURCES = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
};

const LANGUAGE_DETECTOR: LanguageDetectorAsyncModule = {
  type: 'languageDetector',
  async: true,
  detect: (callback: (lang: string | readonly string[] | undefined) => void) => {
    const findLanguage = async () => {
      try {
        // 1. Check AsyncStorage
        const storedLanguage = await AsyncStorage.getItem('user-language');
        if (storedLanguage) {
          return callback(storedLanguage);
        }

        // 2. Check Device Locale
        const locales = Localization.getLocales();
        const deviceLanguage = locales && locales[0] ? locales[0].languageCode : 'en';

        if (deviceLanguage && ['en', 'es', 'fr'].includes(deviceLanguage)) {
          return callback(deviceLanguage);
        }

        // 3. Fallback
        return callback('en');
      } catch (error) {
        console.log('Error reading language', error);
        callback('en');
      }
    };
    findLanguage();
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem('user-language', language);
    } catch (error) {
      console.log('Error saving language', error);
    }
  },
};

// eslint-disable-next-line import/no-named-as-default-member
i18next
  .use(initReactI18next)
  .use(LANGUAGE_DETECTOR)
  .init({
    resources: RESOURCES,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18next;
