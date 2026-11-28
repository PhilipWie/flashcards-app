import { useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Check, RotateCcw, X } from "lucide-react";
import type { Card } from "../../types/Card";
import { checkAnswer } from "../../api/review";
import { ApiError } from "../../api/client";
import { useApiError } from "../../hooks/useApiError";
import { useSettings } from "../../hooks/useSettings";
import AnswerInput from "./AnswerInput";
import AiResult, { type CheckState } from "./AiResult";
import CardChat from "./CardChat";
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
    // typed answer for the current card (setting "Antwort eintippen")
    const [typedAnswer, setTypedAnswer] = useState("");
    const cardRef = useRef<HTMLButtonElement>(null);
    // AI check of the typed answer (only a suggestion)
    const [check, setCheck] = useState<CheckState>({ status: "idle" });
    // position the running check belongs to: a late result for an earlier card is ignored
    const checkFor = useRef<number | null>(null);
    const handleApiError = useApiError();
    const { settings, updateSettings } = useSettings();
    const { t } = useTranslation();

    // AI can be used at all (both settings) / is switched on for this session
    const aiAvailable = settings.typeAnswer && settings.aiEnabled;
    const aiActive = aiAvailable && settings.aiCheck;
    const autoCheck = aiActive && settings.aiCheckMode === "auto";

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
            // the Flashcard key resets the card, but not this state
            setTypedAnswer("");
            resetCheck();
            setIndex((i) => i + 1);
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setSending(false);
        }
    }

    function resetCheck() {
        checkFor.current = null;
        setCheck({ status: "idle" });
    }

    function changeAnswer(value: string) {
        setTypedAnswer(value);
        // an old result does not belong to the changed answer
        if (check.status !== "idle") resetCheck();
    }

    async function runCheck() {
        const text = typedAnswer.trim();
        // nothing to check, or already checked / checking
        if (!aiActive || text === "" || check.status === "loading" || check.status === "done") return;
        const position = index;
        checkFor.current = position;
        setCheck({ status: "loading" });
        try {
            const result = await checkAnswer(cards[position].id, text);
            if (checkFor.current === position) setCheck({ status: "done", result });
        } catch (err) {
            if (checkFor.current !== position) return;
            // 503: no key, timeout or OpenRouter error. The session goes on with self-grading.
            const message =
                err instanceof ApiError && err.status === 503
                    ? t("session.aiUnavailable")
                    : handleApiError(err);
            // null: 401, the user is logged out and leaves the page. Never stay in "loading".
            setCheck(message === null ? { status: "idle" } : { status: "error", message });
        }
    }

    // flip from the answer field: the field disappears, so move the focus to the card.
    // Its accessible name is the back side, the answer buttons follow with Tab.
    function flipFromInput(withCheck: boolean) {
        setFlipped(true);
        cardRef.current?.focus();
        if (withCheck) void runCheck();
    }

    function toggleCard() {
        if (flipped) {
            setFlipped(false);
            return;
        }
        setFlipped(true);
        if (autoCheck) void runCheck();
    }

    const total = cards.length;

    if (index >= total) {
        return (
            <section className="panel glass learn-done" aria-labelledby="done-title">
                <h1 id="done-title">{t("session.doneTitle")}</h1>
                <ul className="learn-stats">
                    <li>
                        <strong className="learn-stats__value learn-stats__value--known">
                            {initialCards.length - repeatedIds.size}
                        </strong>
                        {t("session.knownFirst")}
                    </li>
                    <li>
                        <strong className="learn-stats__value">{repeatedIds.size}</strong>
                        {t("session.repeated")}
                    </li>
                </ul>
                <div className="learn-actions">{doneActions}</div>
            </section>
        );
    }

    const card = cards[index];
    // button the AI suggests ("partial": none, the user decides)
    const suggested = check.status === "done" ? check.result.verdict : null;
    // the card was already shown earlier in this round
    const isRepeat = cards.findIndex((c) => c.id === card.id) < index;

    return (
        <>
            <section className="panel glass learn-progress" aria-label={t("session.progress")}>
                <p className="learn-progress__text">
                    {t("session.position", { current: index + 1, total })}
                    {isRepeat && ` · ${t("session.repeat")}`}
                </p>
                <progress className="progress" max={total} value={index} aria-label={t("session.progress")} />
            </section>

            {/* key: every position is mounted fresh, so the card does not flip back visibly,
                also when the same card comes up twice in a row */}
            <Flashcard
                key={`${card.id}-${index}`}
                ref={cardRef}
                card={card}
                flipped={flipped}
                onFlip={toggleCard}
            />

            {settings.typeAnswer && flipped && (
                <div className="panel glass answer-typed">
                    <p className="answer-typed__label">{t("session.yourAnswer")}</p>
                    {typedAnswer.trim() ? <p>{typedAnswer.trim()}</p> : <p className="text-muted">{t("session.noAnswer")}</p>}
                    {check.status !== "idle" && <AiResult state={check} />}
                </div>
            )}

            {error && (
                <p className="notice notice--error" role="alert">
                    {error}
                </p>
            )}

            <div className="learn-actions">
                {flipped ? (
                    <>
                        <button
                            type="button"
                            className={`btn btn--glass${suggested === "wrong" ? " is-suggested" : ""}`}
                            disabled={sending}
                            onClick={() => answer(false)}
                        >
                            <X aria-hidden="true" />
                            {t("session.didntKnow")}
                        </button>
                        <button
                            type="button"
                            className={`btn btn--success${suggested === "correct" ? " is-suggested" : ""}`}
                            disabled={sending}
                            onClick={() => answer(true)}
                        >
                            <Check aria-hidden="true" />
                            {t("session.knew")}
                        </button>
                    </>
                ) : settings.typeAnswer ? (
                    <AnswerInput
                        key={`${card.id}-${index}`}
                        value={typedAnswer}
                        onChange={changeAnswer}
                        onSubmit={() => flipFromInput(autoCheck)}
                        onCheck={aiActive && !autoCheck ? () => flipFromInput(true) : undefined}
                    >
                        {aiAvailable && (
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    role="switch"
                                    className="switch__input"
                                    checked={settings.aiCheck}
                                    onChange={(e) => updateSettings({ aiCheck: e.target.checked })}
                                />
                                <span className="switch__track" aria-hidden="true" />
                                {t("session.aiSwitch")}
                            </label>
                        )}
                    </AnswerInput>
                ) : (
                    <button type="button" className="btn btn--primary" onClick={() => setFlipped(true)}>
                        <RotateCcw aria-hidden="true" />
                        {t("session.flip")}
                    </button>
                )}
            </div>

            {/* only after flipping: before, the chat could give away the solution */}
            {settings.aiEnabled && flipped && (
                <CardChat
                    key={`${card.id}-${index}`}
                    cardId={card.id}
                    answer={typedAnswer}
                    check={check.status === "done" ? check.result : null}
                />
            )}
        </>
    );
}
