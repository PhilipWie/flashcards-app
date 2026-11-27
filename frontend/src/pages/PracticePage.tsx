import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import type { Card } from "../types/Card";
import { getDeck } from "../api/decks";
import { getCards } from "../api/cards";
import { submitReview } from "../api/review";
import { ApiError } from "../api/client";
import { useApiError } from "../hooks/useApiError";
import { useSettings } from "../hooks/useSettings";
import { filterByBoxes } from "../lib/leitner";
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

    const { settings, updateSettings } = useSettings();
    // start values come from the settings, changes here are only for this round
    const [selectedBoxes, setSelectedBoxes] = useState<number[]>(settings.practiceBoxes);
    const [shuffled, setShuffled] = useState(settings.shuffleByDefault);
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
        // remember the selection for next time
        updateSettings({ practiceBoxes: selectedBoxes });
        const selected = filterByBoxes(allCards, selectedBoxes);
        setSessionCards(shuffled ? shuffle(selected) : selected);
        setRound((r) => r + 1);
    }

    // depends on the setting: by default nothing is saved.
    // "Knew it" never changes anything, otherwise practicing ahead would skip the Leitner intervals.
    async function practiceAnswer(card: Card, correct: boolean): Promise<Card> {
        if (correct || settings.practiceEffect === "none") return card;
        // back to box 1, due today (same endpoint as the learn mode, but not counted in the statistics)
        const updated = await submitReview(card.id, false, true);
        // keep the box counts on the start screen up to date
        setAllCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        return updated;
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
                    <p className="text-muted">
                        {settings.practiceEffect === "none"
                            ? "Zählt nicht für den Lernfortschritt: Fächer und Fälligkeit bleiben unverändert."
                            : "Nicht gewusste Karten gehen zurück in Fach 1. Gewusst ändert nichts."}{" "}
                        Änderbar in den Einstellungen (Zahnrad oben).
                    </p>
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
