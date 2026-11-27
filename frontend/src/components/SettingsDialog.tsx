import { useId } from "react";
import { useSettings } from "../hooks/useSettings";
import type { PracticeEffect } from "../lib/settings";
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

// settings menu, changes apply immediately (no save button)
export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
    const { settings, updateSettings } = useSettings();
    const id = useId();

    return (
        <Modal open={open} onClose={onClose} labelledBy={`${id}-title`}>
            <h2 id={`${id}-title`} className="dialog__title">
                Einstellungen
            </h2>

            <fieldset className="settings-group">
                <legend className="settings-group__legend">Freies Üben: Wirkung auf den Lernfortschritt</legend>
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
                Beim freien Üben standardmäßig mischen
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
