import { useId } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../hooks/useSettings";
import type { AiCheckMode, PracticeEffect } from "../lib/settings";
import Modal from "./Modal";

type SettingsDialogProps = {
    open: boolean;
    onClose: () => void;
};

// texts: settings.practiceEffects.<value> and settings.aiModes.<value>
const PRACTICE_EFFECTS: PracticeEffect[] = ["none", "reset-unknown"];
const AI_CHECK_MODES: AiCheckMode[] = ["button", "auto"];

// settings menu, changes apply immediately (no save button)
export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
    const { settings, updateSettings } = useSettings();
    const id = useId();
    const { t } = useTranslation();

    return (
        <Modal open={open} onClose={onClose} labelledBy={`${id}-title`}>
            <h2 id={`${id}-title`} className="dialog__title">
                {t("settings.title")}
            </h2>

            <h3 className="settings-heading">{t("settings.learnHeading")}</h3>
            <label className="switch">
                <input
                    type="checkbox"
                    role="switch"
                    className="switch__input"
                    checked={settings.typeAnswer}
                    onChange={(e) => updateSettings({ typeAnswer: e.target.checked })}
                />
                <span className="switch__track" aria-hidden="true" />
                {t("settings.typeAnswer")}
            </label>

            <h3 className="settings-heading">{t("settings.aiHeading")}</h3>
            <label className="switch">
                <input
                    type="checkbox"
                    role="switch"
                    className="switch__input"
                    checked={settings.aiEnabled}
                    onChange={(e) => updateSettings({ aiEnabled: e.target.checked })}
                    aria-describedby={`${id}-ai-hint`}
                />
                <span className="switch__track" aria-hidden="true" />
                {t("settings.aiEnabled")}
            </label>
            <p id={`${id}-ai-hint`} className="text-muted settings-note">
                {t("settings.aiHint")}
                {!settings.typeAnswer && ` ${t("settings.aiNeedsTyping")}`}
            </p>
            {settings.aiEnabled && (
                <fieldset className="settings-group">
                    <legend className="settings-group__legend">{t("settings.aiModeLegend")}</legend>
                    {AI_CHECK_MODES.map((mode) => (
                        <label key={mode} className="radio">
                            <input
                                type="radio"
                                name={`${id}-ai-mode`}
                                value={mode}
                                checked={settings.aiCheckMode === mode}
                                onChange={() => updateSettings({ aiCheckMode: mode })}
                            />
                            <span>
                                <span className="radio__label">{t(`settings.aiModes.${mode}.label`)}</span>
                                <span className="radio__hint text-muted">{t(`settings.aiModes.${mode}.hint`)}</span>
                            </span>
                        </label>
                    ))}
                </fieldset>
            )}

            <h3 className="settings-heading">{t("settings.practiceHeading")}</h3>
            <fieldset className="settings-group">
                <legend className="settings-group__legend">{t("settings.practiceLegend")}</legend>
                {PRACTICE_EFFECTS.map((effect) => (
                    <label key={effect} className="radio">
                        <input
                            type="radio"
                            name={`${id}-practice-effect`}
                            value={effect}
                            checked={settings.practiceEffect === effect}
                            onChange={() => updateSettings({ practiceEffect: effect })}
                        />
                        <span>
                            <span className="radio__label">{t(`settings.practiceEffects.${effect}.label`)}</span>
                            <span className="radio__hint text-muted">{t(`settings.practiceEffects.${effect}.hint`)}</span>
                        </span>
                    </label>
                ))}
            </fieldset>

            <label className="switch">
                <input
                    type="checkbox"
                    role="switch"
                    className="switch__input"
                    checked={settings.shuffleByDefault}
                    onChange={(e) => updateSettings({ shuffleByDefault: e.target.checked })}
                />
                <span className="switch__track" aria-hidden="true" />
                {t("settings.shuffle")}
            </label>

            <p className="text-muted settings-note">{t("settings.browserOnly")}</p>

            <div className="dialog__actions">
                <button type="button" className="btn btn--primary" onClick={onClose}>
                    {t("settings.done")}
                </button>
            </div>
        </Modal>
    );
}
