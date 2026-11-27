import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Check, RotateCcw, X } from "lucide-react";
import type { Card } from "../types/Card";
import { getDecks } from "../api/decks";
import { getReviewCards, submitReview } from "../api/review";
import { ApiError } from "../api/client";
import { useApiError } from "../hooks/useApiError";
import Flashcard from "../features/learn/Flashcard";

export default function LearnPage() {
    const { id } = useParams();
    const deckId = Number(id);
    const validId = Number.isInteger(deckId) && deckId > 0;

    const [deckName, setDeckName] = useState<string | null>(null);
    // the due cards are loaded once, the session works through this list
    const [cards, setCards] = useState<Card[]>([]);
    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [known, setKnown] = useState(0);
    const [unknown, setUnknown] = useState(0);
    const [loading, setLoading] = useState(validId);
    const [sending, setSending] = useState(false);
    const [notFound, setNotFound] = useState(!validId);
    const [error, setError] = useState<string | null>(null);
    const handleApiError = useApiError();

    useEffect(() => {
        if (!validId) return;
        let ignore = false;
        Promise.all([getDecks(), getReviewCards(deckId)])
            .then(([decks, due]) => {
                if (ignore) return;
                const deck = decks.find((d) => d.id === deckId);
                setDeckName(deck?.name ?? null);
                setNotFound(deck === undefined);
                setCards(due);
            })
            .catch((err) => {
                if (ignore) return;
                if (err instanceof ApiError && err.status === 404) setNotFound(true);
                else setError(handleApiError(err));
            })
            .finally(() => {
                if (!ignore) setLoading(false);
            });
        return () => {
            ignore = true;
        };
    }, [deckId, validId, handleApiError]);

    async function answer(correct: boolean) {
        const card = cards[index];
        setError(null);
        setSending(true);
        try {
            // the backend moves the card to the next box (or back to box 1)
            await submitReview(card.id, correct);
            if (correct) setKnown((n) => n + 1);
            else setUnknown((n) => n + 1);
            setFlipped(false);
            setIndex((i) => i + 1);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setSending(false);
        }
    }

    const backLink = (
        <Link to={validId && !notFound ? `/decks/${deckId}` : "/decks"} className="back-link">
            <ArrowLeft aria-hidden="true" /> {deckName ?? "Zurück"}
        </Link>
    );

    if (notFound) {
        return (
            <div className="stack stack--narrow">
                {backLink}
                <section className="panel glass">
                    <h1>Stapel nicht gefunden</h1>
                    <p className="text-muted">Diesen Stapel gibt es nicht oder er gehört einem anderen Konto.</p>
                </section>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="stack stack--narrow">
                {backLink}
                <p className="text-muted" role="status">
                    Karten werden geladen …
                </p>
            </div>
        );
    }

    const total = cards.length;
    const finished = index >= total;

    // nothing due today, or session done
    if (finished) {
        return (
            <div className="stack stack--narrow">
                {backLink}
                <section className="panel glass learn-done" aria-labelledby="done-title">
                    <h1 id="done-title">{total === 0 ? "Heute nichts fällig" : "Geschafft!"}</h1>
                    {total === 0 ? (
                        <p className="text-muted">
                            In diesem Stapel ist heute keine Karte fällig. Schau morgen wieder vorbei.
                        </p>
                    ) : (
                        <ul className="learn-stats">
                            <li>
                                <strong className="learn-stats__value learn-stats__value--known">{known}</strong>
                                gewusst
                            </li>
                            <li>
                                <strong className="learn-stats__value">{unknown}</strong>
                                nicht gewusst
                            </li>
                        </ul>
                    )}
                    {error && (
                        <p className="notice notice--error" role="alert">
                            {error}
                        </p>
                    )}
                    <div className="learn-actions">
                        <Link to={`/decks/${deckId}`} className="btn btn--glass">
                            Zum Stapel
                        </Link>
                        <Link to="/decks" className="btn btn--primary">
                            Alle Stapel
                        </Link>
                    </div>
                </section>
            </div>
        );
    }

    const card = cards[index];

    return (
        <div className="stack stack--narrow">
            {backLink}

            <section className="panel glass learn-progress" aria-label="Fortschritt">
                <p className="learn-progress__text">
                    Karte {index + 1} von {total}
                </p>
                <progress className="progress" max={total} value={index} aria-label="Fortschritt" />
            </section>

            {/* key: a new card is mounted fresh, so it does not flip back visibly */}
            <Flashcard key={card.id} card={card} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />

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
        </div>
    );
}
