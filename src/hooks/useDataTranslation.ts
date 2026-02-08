import { useTranslation } from 'react-i18next';

type BilingualText = {
    en: string;
    es: string;
    [key: string]: string;
};

export const useDataTranslation = () => {
    const { i18n } = useTranslation();

    // Ensure we get 'en' or 'es', fallback to 'en'
    const language = (i18n.language?.split('-')[0] || 'en') as 'en' | 'es';

    const translateData = (data: BilingualText | undefined | null): string => {
        if (!data) return '';
        return data[language] || data['en'] || '';
    };

    return { translateData, language };
};
