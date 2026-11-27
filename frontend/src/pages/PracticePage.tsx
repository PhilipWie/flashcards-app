import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import type { Card } from "../types/Card";
import { getDeck } from "../api/decks";
import { getCards } from "../api/cards";
import { ApiError } from "../api/client";
import { useApiError } from "../hooks/useApiError";
import { BOXES, filterByBoxes } from "../lib/leitner";
import { shuffle } from "../lib/shuffle";
import BoxFilter from "../features/learn/BoxFilter";
import LearnSession from "../features/learn/LearnSession";

// free practice: all cards of a deck, independent of the due date
export default function PracticePage() {
    const { id } = useParams();
    const deckId = Number(id);
    const validId = Number.isInteger(deckId) && deckId > 0;

    const [deckName, setDeckName] = useState<string | null>(null);
    const [allCards, setAllCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(validId);
    const [notFound, setNotFound] = useState(!validId);
    const [error, setError] = useState<string | null>(null);

    const [selectedBoxes, setSelectedBoxes] = useState<number[]>([...BOXES]);
    const [shuffled, setShuffled] = useState(true);
    // null = start screen, otherwise the cards of the running round
    const [sessionCards, setSessionCards] = useState<Card[] | null>(null);
    // new key for every round, so LearnSession starts fresh
    const [round, setRound] = useState(0);
    const handleApiError = useApiError();

    useEffect(() => {
        if (!validId) return;
        let ignore = false;
        Promise.all([getDeck(deckId), getCards(deckId)])
            .then(([deck, cards]) => {
                if (ignore) return;
                setDeckName(deck.name);
                setAllCards(cards);
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

    function start() {
        const selected = filterByBoxes(allCards, selectedBoxes);
        setSessionCards(shuffled ? shuffle(selected) : selected);
        setRound((r) => r + 1);
    }

    // free practice doesn't save anything: box and due date stay as they are
    async function practiceAnswer(card: Card): Promise<Card> {
        return card;
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

    if (sessionCards !== null) {
        return (
            <div className="stack stack--narrow">
                {backLink}
                <LearnSession
                    key={round}
                    initialCards={sessionCards}
                    onAnswer={practiceAnswer}
                    doneActions={
                        <>
                            <Link to={`/decks/${deckId}`} className="btn btn--glass">
                                Zum Stapel
                            </Link>
                            <button type="button" className="btn btn--primary" onClick={() => setSessionCards(null)}>
                                Nochmal üben
                            </button>
                        </>
                    }
                />
            </div>
        );
    }

    return (
        <div className="stack stack--narrow">
            {backLink}
            <section className="panel glass" aria-labelledby="practice-title">
                <div>
                    <h1 id="practice-title">Frei üben</h1>
                    <p className="text-muted">Zählt nicht für den Lernfortschritt: Fächer und Fälligkeit bleiben unverändert.</p>
                </div>
                {error && (
                    <p className="notice notice--error" role="alert">
                        {error}
                    </p>
                )}
                {error ? null : allCards.length === 0 ? (
                    <p className="empty text-muted">
                        Dieser Stapel hat noch keine Karten. <Link to={`/decks/${deckId}`}>Karten anlegen</Link>
                    </p>
                ) : (
                    <BoxFilter
                        cards={allCards}
                        selectedBoxes={selectedBoxes}
                        onSelectedBoxesChange={setSelectedBoxes}
                        shuffled={shuffled}
                        onShuffledChange={setShuffled}
                        onStart={start}
                    />
                )}
            </section>
        </div>
    );
}
