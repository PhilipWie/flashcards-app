import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Dumbbell, GraduationCap } from "lucide-react";
import type { Card } from "../types/Card";
import type { DeckSummary } from "../types/Deck";
import { getDeck } from "../api/decks";
import { createCard, deleteCard, getCards, updateCard } from "../api/cards";
import { ApiError } from "../api/client";
import { useApiError } from "../hooks/useApiError";
import BoxBar from "../features/cards/BoxBar";
import CardForm from "../features/cards/CardForm";
import CardItem from "../features/cards/CardItem";
import ConfirmDialog from "../components/ConfirmDialog";

export default function DeckDetailPage() {
    const { id } = useParams();
    const deckId = Number(id);
    const validId = Number.isInteger(deckId) && deckId > 0;

    const [deck, setDeck] = useState<DeckSummary | null>(null);
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(validId);
    const [notFound, setNotFound] = useState(!validId);
    const [error, setError] = useState<string | null>(null);
    const [cardToDelete, setCardToDelete] = useState<Card | null>(null);
    const [deleting, setDeleting] = useState(false);
    const handleApiError = useApiError();
    const { t } = useTranslation();

    useEffect(() => {
        if (!validId) return;
        let ignore = false;
        Promise.all([getDeck(deckId), getCards(deckId)])
            .then(([deckData, deckCards]) => {
                if (ignore) return;
                setDeck(deckData);
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

    // card and due counts come from the backend (database date),
    // so reload them after cards were added or deleted
    const reloadCounts = useCallback(async () => {
        try {
            setDeck(await getDeck(deckId));
        } catch (err) {
            setError(handleApiError(err));
        }
    }, [deckId, handleApiError]);

    async function handleCreate(front: string, back: string): Promise<boolean> {
        setError(null);
        try {
            const card = await createCard(deckId, front, back);
            setCards((prev) => [...prev, card]);
            void reloadCounts();
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

    async function confirmDelete() {
        if (!cardToDelete) return;
        const card = cardToDelete;
        setError(null);
        setDeleting(true);
        try {
            await deleteCard(card.id);
            setCards((prev) => prev.filter((c) => c.id !== card.id));
            void reloadCounts();
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setDeleting(false);
            setCardToDelete(null);
        }
    }

    const backLink = (
        <Link to="/decks" className="back-link">
            <ArrowLeft aria-hidden="true" /> {t("common.allDecks")}
        </Link>
    );

    if (notFound) {
        return (
            <div className="stack">
                {backLink}
                <section className="panel glass">
                    <h1>{t("common.deckNotFound")}</h1>
                    <p className="text-muted">{t("common.deckNotFoundText")}</p>
                </section>
            </div>
        );
    }

    const dueCount = deck?.due_count ?? 0;

    return (
        <div className="stack">
            {backLink}

            <section className="panel glass deck-hero" aria-labelledby="deck-title" aria-busy={loading}>
                <div className="deck-hero__head">
                    <div>
                        <h1 id="deck-title">{deck?.name ?? t("deck.fallbackTitle")}</h1>
                        <p className="text-muted">
                            {loading ? t("common.loading") : t("deck.summary", { count: cards.length, due: dueCount })}
                        </p>
                    </div>
                    <div className="deck-hero__actions">
                        {/* a link can't be disabled, so show a disabled button instead */}
                        {cards.length > 0 ? (
                            <Link to={`/decks/${deckId}/practice`} className="btn btn--glass">
                                <Dumbbell aria-hidden="true" />
                                {t("common.practice")}
                            </Link>
                        ) : (
                            <button type="button" className="btn btn--glass" disabled>
                                <Dumbbell aria-hidden="true" />
                                {t("common.practice")}
                            </button>
                        )}
                        {dueCount > 0 ? (
                            <Link to={`/decks/${deckId}/learn`} className="btn btn--primary">
                                <GraduationCap aria-hidden="true" />
                                {t("common.learn")}
                            </Link>
                        ) : (
                            <button type="button" className="btn btn--primary" disabled>
                                <GraduationCap aria-hidden="true" />
                                {t("deck.nothingDue")}
                            </button>
                        )}
                    </div>
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
                    {t("deck.newCard")}
                </h2>
                <CardForm variant="create" onSubmit={handleCreate} />
            </section>

            <section className="panel glass" aria-labelledby="card-list-title">
                <h2 id="card-list-title" className="panel__title">
                    {t("deck.cardsTitle")}
                </h2>
                {!loading && cards.length === 0 && (
                    <p className="empty text-muted">{t("deck.empty")}</p>
                )}
                {cards.length > 0 && (
                    <ul className="list">
                        {cards.map((card) => (
                            <CardItem key={card.id} card={card} onUpdate={handleUpdate} onDelete={setCardToDelete} />
                        ))}
                    </ul>
                )}
            </section>

            <ConfirmDialog
                open={cardToDelete !== null}
                title={t("deck.deleteCardTitle")}
                message={t("deck.deleteCardMessage", { front: cardToDelete?.front ?? "" })}
                confirmLabel={t("common.delete")}
                busy={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setCardToDelete(null)}
            />
        </div>
    );
}
