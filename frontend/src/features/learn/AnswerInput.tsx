import { useId, type ReactNode } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import { ANSWER_MAX } from "./constants";

type AnswerInputProps = {
    value: string;
    onChange: (value: string) => void;
    // Enter or the flip button: flip the card
    onSubmit: () => void;
    // if set, a "Prüfen" button is shown (AI check mode "button")
    onCheck?: () => void;
    // e.g. the AI switch of the session
    children?: ReactNode;
};

// Answer field shown before the card is flipped (setting "Antwort eintippen").
// Controlled: LearnSession owns the text, it is needed after flipping and for the AI check.
// Mounted fresh for every card, so autoFocus puts the cursor in the field each time.
export default function AnswerInput({ value, onChange, onSubmit, onCheck, children }: AnswerInputProps) {
    const id = useId();

    return (
        <form
            className="answer-input"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit();
            }}
        >
            <div className="field">
                <label htmlFor={id}>Deine Antwort</label>
                <input
                    id={id}
                    className="input"
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    maxLength={ANSWER_MAX}
                    // no suggestions from earlier answers
                    autoComplete="off"
                    autoFocus
                />
            </div>
            {children}
            <div className="answer-input__actions">
                {onCheck && (
                    <button
                        type="button"
                        className="btn btn--glass"
                        onClick={onCheck}
                        // nothing to check without an answer
                        disabled={value.trim() === ""}
                    >
                        <Sparkles aria-hidden="true" />
                        Prüfen
                    </button>
                )}
                <button type="submit" className="btn btn--primary">
                    <RotateCcw aria-hidden="true" />
                    Umdrehen
                </button>
            </div>
        </form>
    );
}
