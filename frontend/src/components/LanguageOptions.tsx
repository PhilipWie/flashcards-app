import { useId } from "react";
import { useTranslation } from "react-i18next";
import { changeLanguage, LANGUAGES } from "../i18n";

// Radio group to pick the UI language, same style as the other settings.
// Used in the settings (logged in) and in the top bar dialog (logged out).
export default function LanguageOptions() {
    const { t, i18n } = useTranslation();
    const id = useId();

    return (
        <fieldset className="settings-group">
            <legend className="settings-group__legend">{t("languageDialog.legend")}</legend>
            {LANGUAGES.map((language) => (
                <label key={language.code} className="radio">
                    <input
                        type="radio"
                        name={`${id}-language`}
                        value={language.code}
                        checked={i18n.resolvedLanguage === language.code}
                        // changes apply immediately, like the other settings
                        onChange={() => changeLanguage(language.code)}
                    />
                    {/* lang: a screen reader reads "English" with English pronunciation */}
                    <span className="radio__label" lang={language.code}>
                        {language.label}
                    </span>
                </label>
            ))}
        </fieldset>
    );
}
