import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, GraduationCap } from "lucide-react";
import type { Card } from "../types/Card";
import type { Deck } from "../types/Deck";
import { getDecks } from "../api/decks";
import { createCard, deleteCard, getCards, updateCard } from "../api/cards";
import { ApiError } from "../api/client";
import { useApiError } from "../hooks/useApiError";
import { isDue } from "../lib/date";
import BoxBar from "../features/cards/BoxBar";
import CardForm from "../features/cards/CardForm";
import CardItem from "../features/cards/CardItem";

export default function DeckDetailPage() {
    const { id } = useParams();
    const deckId = Number(id);
    const validId = Number.isInteger(deckId) && deckId > 0;

    const [deck, setDeck] = useState<Deck | null>(null);
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(validId);
    const [notFound, setNotFound] = useState(!validId);
    const [error, setError] = useState<string | null>(null);
    const handleApiError = useApiError();

    useEffect(() => {
        if (!validId) return;
        let ignore = false;
        // there is no GET /api/decks/:id, so the name comes from the deck list
        Promise.all([getDecks(), getCards(deckId)])
            .then(([decks, deckCards]) => {
                if (ignore) return;
                const found = decks.find((d) => d.id === deckId) ?? null;
                setDeck(found);
                setNotFound(found === null);
                setCards(deckCards);
            })
            .catch((err) => {
                if (ignore) return;
                // 404: deck does not exist or belongs to another user
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

    async function handleCreate(front: string, back: string): Promise<boolean> {
        setError(null);
        try {
            const card = await createCard(deckId, front, back);
            setCards((prev) => [...prev, card]);
            return true;
        } catch (err) {
            setError(handleApiError(err));
            return false;
        }
    }

    async function handleUpdate(cardId: number, front: string, back: string): Promise<boolean> {
        setError(null);
        try {
            const updated = await updateCard(cardId, { front, back });
            setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));
            return true;
        } catch (err) {
            setError(handleApiError(err));
            return false;
        }
    }

    async function handleDelete(card: Card) {
        if (!window.confirm(`Karte "${card.front}" löschen?`)) return;
        setError(null);
        try {
            await deleteCard(card.id);
            setCards((prev) => prev.filter((c) => c.id !== card.id));
        } catch (err) {
            setError(handleApiError(err));
        }
    }

    const backLink = (
        <Link to="/decks" className="back-link">
            <ArrowLeft aria-hidden="true" /> Alle Stapel
        </Link>
    );

    if (notFound) {
        return (
            <div className="stack">
                {backLink}
                <section className="panel glass">
                    <h1>Stapel nicht gefunden</h1>
                    <p className="text-muted">Diesen Stapel gibt es nicht oder er gehört einem anderen Konto.</p>
                </section>
            </div>
        );
    }

    const dueCount = cards.filter((c) => isDue(c.next_review)).length;

    return (
        <div className="stack">
            {backLink}

            <section className="panel glass deck-hero" aria-labelledby="deck-title" aria-busy={loading}>
                <div className="deck-hero__head">
                    <div>
                        <h1 id="deck-title">{deck?.name ?? "Stapel"}</h1>
                        <p className="text-muted">
                            {loading
                                ? "Wird geladen …"
                                : `${cards.length} ${cards.length === 1 ? "Karte" : "Karten"} · ${dueCount} heute fällig`}
                        </p>
                    </div>
                    {dueCount > 0 ? (
                        <Link to={`/decks/${deckId}/learn`} className="btn btn--primary">
                            <GraduationCap aria-hidden="true" />
                            Lernen
                        </Link>
                    ) : (
                        // a link can't be disabled, so show a disabled button instead
                        <button type="button" className="btn btn--primary" disabled>
                            <GraduationCap aria-hidden="true" />
                            Nichts fällig
                        </button>
                    )}
                </div>
                {cards.length > 0 && <BoxBar cards={cards} />}
            </section>

            {error && (
                <p className="notice notice--error" role="alert">
                    {error}
                </p>
            )}

            <section className="panel glass" aria-labelledby="new-card-title">
                <h2 id="new-card-title" className="panel__title">
                    Neue Karte
                </h2>
                <CardForm submitLabel="Anlegen" onSubmit={handleCreate} />
            </section>

            <section className="panel glass" aria-labelledby="card-list-title">
                <h2 id="card-list-title" className="panel__title">
                    Karten
                </h2>
                {!loading && cards.length === 0 && (
                    <p className="empty text-muted">Noch keine Karten. Lege oben die erste an.</p>
                )}
                {cards.length > 0 && (
                    <ul className="list">
                        {cards.map((card) => (
                            <CardItem key={card.id} card={card} onUpdate={handleUpdate} onDelete={handleDelete} />
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
