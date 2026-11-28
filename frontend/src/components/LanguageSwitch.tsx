import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { changeLanguage, LANGUAGES } from "../i18n";
import Modal from "./Modal";

// Language switch in the top bar: icon button with the current language code,
// opens a small dialog with the same radio style as the settings.
// Also shown when logged out (login and register).
export default function LanguageSwitch() {
    const { t, i18n } = useTranslation();
    const [open, setOpen] = useState(false);
    const id = useId();
    const current = LANGUAGES.find((l) => l.code === i18n.resolvedLanguage) ?? LANGUAGES[0];
    const label = t("layout.languageButton", { language: current.label });

    return (
        <>
            <button
                type="button"
                className="btn btn--icon lang-switch"
                onClick={() => setOpen(true)}
                aria-label={label}
                title={label}
            >
                <Languages aria-hidden="true" />
                <span className="lang-switch__code" aria-hidden="true">
                    {current.short}
                </span>
            </button>

            <Modal open={open} onClose={() => setOpen(false)} labelledBy={`${id}-title`}>
                <h2 id={`${id}-title`} className="dialog__title">
                    {t("layout.language")}
                </h2>
                <fieldset className="settings-group">
                    <legend className="settings-group__legend">{t("languageDialog.legend")}</legend>
                    {LANGUAGES.map((language) => (
                        <label key={language.code} className="radio">
                            <input
                                type="radio"
                                name={`${id}-language`}
                                value={language.code}
                                checked={current.code === language.code}
                                // changes apply immediately, like in the settings
                                onChange={() => changeLanguage(language.code)}
                            />
                            {/* lang: a screen reader reads "English" with English pronunciation */}
                            <span className="radio__label" lang={language.code}>
                                {language.label}
                            </span>
                        </label>
                    ))}
                </fieldset>
                <p className="text-muted settings-note">{t("languageDialog.browserOnly")}</p>
                <div className="dialog__actions">
                    <button type="button" className="btn btn--primary" onClick={() => setOpen(false)}>
                        {t("settings.done")}
                    </button>
                </div>
            </Modal>
        </>
    );
}
