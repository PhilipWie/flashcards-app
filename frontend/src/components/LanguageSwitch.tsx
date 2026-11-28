import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { LANGUAGES } from "../i18n";
import LanguageOptions from "./LanguageOptions";
import Modal from "./Modal";

// Language switch in the top bar, only for guests (login, register):
// icon button with the current language code, opens a small dialog.
// Logged in users change the language in the settings instead.
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
                <LanguageOptions />
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
