import { useId } from "react";
import { useSettings } from "../hooks/useSettings";
import type { AiCheckMode, PracticeEffect } from "../lib/settings";
import Modal from "./Modal";

type SettingsDialogProps = {
    open: boolean;
    onClose: () => void;
};

const PRACTICE_EFFECTS: { value: PracticeEffect; label: string; hint: string }[] = [
    {
        value: "none",
        label: "Ändert nichts",
        hint: "Fächer und Fälligkeit bleiben, wie sie sind.",
    },
    {
        value: "reset-unknown",
        label: "Nicht gewusst setzt zurück",
        hint: "Nicht gewusste Karten gehen zurück in Fach 1 und sind heute fällig. Gewusst ändert nichts.",
    },
];

const AI_CHECK_MODES: { value: AiCheckMode; label: string; hint: string }[] = [
    {
        value: "button",
        label: "Mit Button",
        hint: "Die KI prüft nur, wenn du auf „Prüfen“ klickst.",
    },
    {
        value: "auto",
        label: "Automatisch",
        hint: "Die KI prüft beim Umdrehen, sobald du eine Antwort eingetippt hast.",
    },
];

// settings menu, changes apply immediately (no save button)
export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
    const { settings, updateSettings } = useSettings();
    const id = useId();

    return (
        <Modal open={open} onClose={onClose} labelledBy={`${id}-title`}>
            <h2 id={`${id}-title`} className="dialog__title">
                Einstellungen
            </h2>

            <h3 className="settings-heading">Lernen</h3>
            <label className="switch">
                <input
                    type="checkbox"
                    role="switch"
                    className="switch__input"
                    checked={settings.typeAnswer}
                    onChange={(e) => updateSettings({ typeAnswer: e.target.checked })}
                />
                <span className="switch__track" aria-hidden="true" />
                Antwort vor dem Umdrehen eintippen
            </label>

            <h3 className="settings-heading">KI</h3>
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
                KI beim Lernen verwenden
            </label>
            <p id={`${id}-ai-hint`} className="text-muted settings-note">
                Die KI prüft eingetippte Antworten und beantwortet nach dem Umdrehen Fragen zur Karte. Dafür werden
                Vorder- und Rückseite, deine Antwort und deine Fragen an einen KI-Dienst (OpenRouter) geschickt. Die KI
                macht nur Vorschläge, bewerten musst du selbst.
                {!settings.typeAnswer && " Die Prüfung braucht „Antwort eintippen“."}
            </p>
            {settings.aiEnabled && (
                <fieldset className="settings-group">
                    <legend className="settings-group__legend">Wann soll die KI deine Antwort prüfen?</legend>
                    {AI_CHECK_MODES.map((option) => (
                        <label key={option.value} className="radio">
                            <input
                                type="radio"
                                name={`${id}-ai-mode`}
                                value={option.value}
                                checked={settings.aiCheckMode === option.value}
                                onChange={() => updateSettings({ aiCheckMode: option.value })}
                            />
                            <span>
                                <span className="radio__label">{option.label}</span>
                                <span className="radio__hint text-muted">{option.hint}</span>
                            </span>
                        </label>
                    ))}
                </fieldset>
            )}

            <h3 className="settings-heading">Freies Üben</h3>
            <fieldset className="settings-group">
                <legend className="settings-group__legend">Wirkung auf den Lernfortschritt</legend>
                {PRACTICE_EFFECTS.map((option) => (
                    <label key={option.value} className="radio">
                        <input
                            type="radio"
                            name={`${id}-practice-effect`}
                            value={option.value}
                            checked={settings.practiceEffect === option.value}
                            onChange={() => updateSettings({ practiceEffect: option.value })}
                        />
                        <span>
                            <span className="radio__label">{option.label}</span>
                            <span className="radio__hint text-muted">{option.hint}</span>
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
                Standardmäßig mischen
            </label>

            <p className="text-muted settings-note">Die Einstellungen gelten nur in diesem Browser.</p>

            <div className="dialog__actions">
                <button type="button" className="btn btn--primary" onClick={onClose}>
                    Fertig
                </button>
            </div>
        </Modal>
    );
}
