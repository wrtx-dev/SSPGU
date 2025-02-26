import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { getSupportedLanguageCodes } from "./config"

import * as zh from "./zh.json"
import * as en from "./en.json"

const languageModules: { [key: string]: any } = {
    en,
    zh
};

const resources = getSupportedLanguageCodes().reduce((acc, lang) => {
    if (languageModules[lang]) {
        acc[lang] = { translation: languageModules[lang] };
    }
    return acc;
}, {} as { [key: string]: { translation: any } });

i18n.use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'zh',
        interpolation: {
            escapeValue: false,
        }
    });

export default i18n;