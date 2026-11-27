import { useId, useState, type FormEvent } from "react";
import { Check, Plus, X } from "lucide-react";
import { CARD_TEXT_MAX } from "./constants";

type CardFormProps = {
    initialFront?: string;
    initialBack?: string;
    submitLabel: "Anlegen" | "Speichern";
    // returns true on success: a new card form is cleared then
    onSubmit: (front: string, back: string) => Promise<boolean>;
    onCancel?: () => void;
};

// used for "new card" and for editing a card inline
export default function CardForm({ initialFront = "", initialBack = "", submitLabel, onSubmit, onCancel }: CardFormProps) {
    const [front, setFront] = useState(initialFront);
    const [back, setBack] = useState(initialBack);
    const [saving, setSaving] = useState(false);
    // unique ids, the form can be on the page several times
    const id = useId();

    const isEmpty = front.trim() === "" || back.trim() === "";

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (isEmpty) return;
        setSaving(true);
        const ok = await onSubmit(front.trim(), back.trim());
        setSaving(false);
        if (ok && !onCancel) {
            setFront("");
            setBack("");
        }
    }

    return (
        <form className="card-form" onSubmit={handleSubmit} onKeyDown={(e) => e.key === "Escape" && onCancel?.()}>
            <div className="card-form__fields">
                <div className="field">
                    <label htmlFor={`${id}-front`}>Vorderseite</label>
                    <textarea
                        id={`${id}-front`}
                        className="input"
                        rows={3}
                        placeholder="Frage"
                        maxLength={CARD_TEXT_MAX}
                        required
                        autoFocus={!!onCancel}
                        value={front}
                        onChange={(e) => setFront(e.target.value)}
                    />
                </div>
                <div className="field">
                    <label htmlFor={`${id}-back`}>Rückseite</label>
                    <textarea
                        id={`${id}-back`}
                        className="input"
                        rows={3}
                        placeholder="Antwort"
                        maxLength={CARD_TEXT_MAX}
                        required
                        value={back}
                        onChange={(e) => setBack(e.target.value)}
                    />
                </div>
            </div>
            <div className="card-form__actions">
                {onCancel && (
                    <button type="button" className="btn btn--glass" onClick={onCancel}>
                        <X aria-hidden="true" />
                        Abbrechen
                    </button>
                )}
                <button type="submit" className="btn btn--primary" disabled={saving || isEmpty}>
                    {submitLabel === "Anlegen" ? <Plus aria-hidden="true" /> : <Check aria-hidden="true" />}
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}
