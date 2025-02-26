export interface LanguageConfig {
    value: string;
    label: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
    { value: "en", label: "English" },
    { value: "zh", label: "简体中文" },
];

export const getSupportedLanguageCodes = (): string[] => {
    return SUPPORTED_LANGUAGES.map(lang => lang.value);
};

export const getLanguageLabel = (code: string): string => {
    const lang = SUPPORTED_LANGUAGES.find(lang => lang.value === code);
    return lang?.label || code;
};

export const getLanguageCode = (label: string): string => {
    const lang = SUPPORTED_LANGUAGES.find(lang => lang.label === label);
    return lang?.value || label;
};

export const getLanguageOptions = (): LanguageConfig[] => {
    return SUPPORTED_LANGUAGES;
};