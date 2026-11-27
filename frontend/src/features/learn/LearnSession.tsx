import { useState, type ReactNode } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import type { Card } from "../../types/Card";
import { useApiError } from "../../hooks/useApiError";
import Flashcard from "./Flashcard";

type LearnSessionProps = {
    // cards of this session, must not be empty
    initialCards: Card[];
    // The page decides what happens with an answer (save it or not).
    // Returns the card to repeat at the end if it was not known,
    // e.g. with the new box from the backend.
    onAnswer: (card: Card, correct: boolean) => Promise<Card>;
    // buttons/links on the summary at the end
    doneActions: ReactNode;
};

// One round of learning: show card, flip, answer.
// Cards answered with "didn't know" are appended to the end,
// the round ends when every card was known once.
// Remount (new key) to start a new round.
export default function LearnSession({ initialCards, onAnswer, doneActions }: LearnSessionProps) {
    const [cards, setCards] = useState(initialCards);
    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    // ids of cards that were not known at least once
    const [repeatedIds, setRepeatedIds] = useState<Set<number>>(() => new Set());
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const handleApiError = useApiError();

    async function answer(correct: boolean) {
        const card = cards[index];
        setError(null);
        // also blocks a double click from answering twice
        setSending(true);
        try {
            const next = await onAnswer(card, correct);
            if (!correct) {
                setCards((prev) => [...prev, next]);
                setRepeatedIds((prev) => new Set(prev).add(card.id));
            }
            setFlipped(false);
            setIndex((i) => i + 1);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setSending(false);
        }
    }

    const total = cards.length;

    if (index >= total) {
        return (
            <section className="panel glass learn-done" aria-labelledby="done-title">
                <h1 id="done-title">Geschafft!</h1>
                <ul className="learn-stats">
                    <li>
                        <strong className="learn-stats__value learn-stats__value--known">
                            {initialCards.length - repeatedIds.size}
                        </strong>
                        auf Anhieb gewusst
                    </li>
                    <li>
                        <strong className="learn-stats__value">{repeatedIds.size}</strong>
                        wiederholt
                    </li>
                </ul>
                <div className="learn-actions">{doneActions}</div>
            </section>
        );
    }

    const card = cards[index];
    // the card was already shown earlier in this round
    const isRepeat = cards.findIndex((c) => c.id === card.id) < index;

    return (
        <>
            <section className="panel glass learn-progress" aria-label="Fortschritt">
                <p className="learn-progress__text">
                    Karte {index + 1} von {total}
                    {isRepeat && " · Wiederholung"}
                </p>
                <progress className="progress" max={total} value={index} aria-label="Fortschritt" />
            </section>

            {/* key: every position is mounted fresh, so the card does not flip back visibly,
                also when the same card comes up twice in a row */}
            <Flashcard key={`${card.id}-${index}`} card={card} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />

            {error && (
                <p className="notice notice--error" role="alert">
                    {error}
                </p>
            )}

            <div className="learn-actions">
                {flipped ? (
                    <>
                        <button type="button" className="btn btn--glass" disabled={sending} onClick={() => answer(false)}>
                            <X aria-hidden="true" />
                            Nicht gewusst
                        </button>
                        <button type="button" className="btn btn--success" disabled={sending} onClick={() => answer(true)}>
                            <Check aria-hidden="true" />
                            Gewusst
                        </button>
                    </>
                ) : (
                    <button type="button" className="btn btn--primary" onClick={() => setFlipped(true)}>
                        <RotateCcw aria-hidden="true" />
                        Umdrehen
                    </button>
                )}
            </div>
        </>
    );
}
