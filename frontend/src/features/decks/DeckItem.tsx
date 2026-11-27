import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Check, GraduationCap, Pencil, Trash2, X } from "lucide-react";
import type { Deck } from "../../types/Deck";
import { DECK_NAME_MAX } from "./constants";

type DeckItemProps = {
    deck: Deck;
    onRename: (id: number, name: string) => Promise<boolean>;
    onDelete: (deck: Deck) => void;
};

// one row in the deck list, can switch into an inline rename form
export default function DeckItem({ deck, onRename, onDelete }: DeckItemProps) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(deck.name);
    const [saving, setSaving] = useState(false);

    function startEditing() {
        setName(deck.name);
        setEditing(true);
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const trimmed = name.trim();
        if (trimmed === "" || trimmed === deck.name) {
            setEditing(false);
            return;
        }
        setSaving(true);
        const ok = await onRename(deck.id, trimmed);
        setSaving(false);
        if (ok) setEditing(false);
    }

    if (editing) {
        return (
            <li className="deck">
                <form
                    className="inline-form"
                    onSubmit={handleSubmit}
                    // Escape cancels editing
                    onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
                >
                    <label htmlFor={`deck-name-${deck.id}`} className="visually-hidden">
                        Neuer Name für {deck.name}
                    </label>
                    <input
                        id={`deck-name-${deck.id}`}
                        className="input"
                        value={name}
                        maxLength={DECK_NAME_MAX}
                        required
                        autoFocus
                        onChange={(e) => setName(e.target.value)}
                    />
                    <div className="deck__actions">
                        <button type="submit" className="btn btn--icon" disabled={saving} aria-label="Speichern" title="Speichern">
                            <Check aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            className="btn btn--icon"
                            onClick={() => setEditing(false)}
                            aria-label="Abbrechen"
                            title="Abbrechen"
                        >
                            <X aria-hidden="true" />
                        </button>
                    </div>
                </form>
            </li>
        );
    }

    return (
        <li className="deck">
            <h3 className="deck__name">
                <Link to={`/decks/${deck.id}`} className="deck__link">
                    {deck.name}
                </Link>
            </h3>
            <div className="deck__actions">
                <Link
                    to={`/decks/${deck.id}/learn`}
                    className="btn btn--icon"
                    aria-label={`${deck.name} lernen`}
                    title="Lernen"
                >
                    <GraduationCap aria-hidden="true" />
                </Link>
                <button
                    type="button"
                    className="btn btn--icon"
                    onClick={startEditing}
                    aria-label={`${deck.name} umbenennen`}
                    title="Umbenennen"
                >
                    <Pencil aria-hidden="true" />
                </button>
                <button
                    type="button"
                    className="btn btn--icon btn--danger"
                    onClick={() => onDelete(deck)}
                    aria-label={`${deck.name} löschen`}
                    title="Löschen"
                >
                    <Trash2 aria-hidden="true" />
                </button>
            </div>
        </li>
    );
}
