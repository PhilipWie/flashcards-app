import { useId } from "react";
import { RotateCcw } from "lucide-react";
import { ANSWER_MAX } from "./constants";

type AnswerInputProps = {
    value: string;
    onChange: (value: string) => void;
    // Enter or the button: flip the card
    onSubmit: () => void;
};

// Answer field shown before the card is flipped (setting "Antwort eintippen").
// Controlled: LearnSession owns the text, it is needed after flipping (and later for the AI check).
// Mounted fresh for every card, so autoFocus puts the cursor in the field each time.
export default function AnswerInput({ value, onChange, onSubmit }: AnswerInputProps) {
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
            <button type="submit" className="btn btn--primary">
                <RotateCcw aria-hidden="true" />
                Umdrehen
            </button>
        </form>
    );
}
