import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import type { Card } from "../types/Card";
import { getDeck } from "../api/decks";
import { getReviewCards, submitReview } from "../api/review";
import { ApiError } from "../api/client";
import { useApiError } from "../hooks/useApiError";
import LearnSession from "../features/learn/LearnSession";

// learn mode: due cards only, every answer is saved (Leitner)
export default function LearnPage() {
    const { id } = useParams();
    const deckId = Number(id);
    const validId = Number.isInteger(deckId) && deckId > 0;

    const [deckName, setDeckName] = useState<string | null>(null);
    const [dueCards, setDueCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(validId);
    const [notFound, setNotFound] = useState(!validId);
    const [error, setError] = useState<string | null>(null);
    const handleApiError = useApiError();
    const { t } = useTranslation();

    useEffect(() => {
        if (!validId) return;
        let ignore = false;
        Promise.all([getDeck(deckId), getReviewCards(deckId)])
            .then(([deck, due]) => {
                if (ignore) return;
                setDeckName(deck.name);
                setDueCards(due);
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

    // the backend moves the card to the next box (or back to box 1, due today)
    // and returns it, so a repeated card shows its new box
    function saveAnswer(card: Card, correct: boolean): Promise<Card> {
        return submitReview(card.id, correct);
    }

    const backLink = (
        <Link to={validId && !notFound ? `/decks/${deckId}` : "/decks"} className="back-link">
            <ArrowLeft aria-hidden="true" /> {deckName ?? t("common.back")}
        </Link>
    );

    if (notFound) {
        return (
            <div className="stack stack--narrow">
                {backLink}
                <section className="panel glass">
                    <h1>{t("common.deckNotFound")}</h1>
                    <p className="text-muted">{t("common.deckNotFoundText")}</p>
                </section>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="stack stack--narrow">
                {backLink}
                <p className="text-muted" role="status">
                    {t("common.cardsLoading")}
                </p>
            </div>
        );
    }

    const deckActions = (
        <>
            <Link to={`/decks/${deckId}`} className="btn btn--glass">
                {t("common.toDeck")}
            </Link>
            <Link to="/decks" className="btn btn--primary">
                {t("common.allDecks")}
            </Link>
        </>
    );

    // nothing due today (or loading failed)
    if (dueCards.length === 0) {
        return (
            <div className="stack stack--narrow">
                {backLink}
                <section className="panel glass learn-done" aria-labelledby="done-title">
                    <h1 id="done-title">{error ? t("learn.loadFailed") : t("learn.nothingDueTitle")}</h1>
                    {error ? (
                        <p className="notice notice--error" role="alert">
                            {error}
                        </p>
                    ) : (
                        <p className="text-muted">{t("learn.nothingDueText")}</p>
                    )}
                    <div className="learn-actions">
                        <Link to={`/decks/${deckId}`} className="btn btn--glass">
                            {t("common.toDeck")}
                        </Link>
                        <Link to={`/decks/${deckId}/practice`} className="btn btn--primary">
                            {t("common.practice")}
                        </Link>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <div className="stack stack--narrow">
            {backLink}
            <LearnSession initialCards={dueCards} onAnswer={saveAnswer} doneActions={deckActions} />
        </div>
    );
}
