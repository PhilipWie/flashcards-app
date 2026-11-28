import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { changeLanguage, isLanguage, LANGUAGES } from "../i18n";

// language switch in the top bar: a native select, so keyboard and screen readers work as usual.
// The current language stays visible as the selected option.
export default function LanguageSelect() {
    const { t, i18n } = useTranslation();
    const id = useId();

    return (
        <div className="lang-select">
            <label htmlFor={id} className="visually-hidden">
                {t("layout.language")}
            </label>
            <Languages aria-hidden="true" className="lang-select__icon" />
            <select
                id={id}
                className="lang-select__input"
                value={i18n.resolvedLanguage}
                onChange={(e) => {
                    if (isLanguage(e.target.value)) changeLanguage(e.target.value);
                }}
                title={t("layout.language")}
            >
                {LANGUAGES.map((language) => (
                    // lang: a screen reader reads "English" with English pronunciation
                    <option key={language.code} value={language.code} lang={language.code}>
                        {language.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
