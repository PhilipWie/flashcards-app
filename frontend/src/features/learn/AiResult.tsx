import type { CheckResult } from "../../types/Check";

// state of the AI check for the current card
export type CheckState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "done"; result: CheckResult }
    | { status: "error"; message: string };

const VERDICT_TEXT = {
    correct: "Richtig",
    partial: "Teilweise richtig",
    wrong: "Falsch",
} as const;

const SUGGESTION_TEXT = {
    correct: "Vorschlag: Gewusst",
    partial: "Entscheide selbst",
    wrong: "Vorschlag: Nicht gewusst",
} as const;

// Result of the AI check below the typed answer.
// role="status": the result arrives later, screen readers announce it when it is there.
export default function AiResult({ state }: { state: CheckState }) {
    return (
        <div className="ai-result" role="status">
            {state.status === "loading" && <span className="text-muted">KI prüft deine Antwort …</span>}
            {state.status === "error" && <span className="text-muted">{state.message}</span>}
            {state.status === "done" && (
                <>
                    <span className={`ai-result__verdict ai-result__verdict--${state.result.verdict}`}>
                        KI: {VERDICT_TEXT[state.result.verdict]}
                        <span className="ai-result__suggestion"> · {SUGGESTION_TEXT[state.result.verdict]}</span>
                    </span>
                    {/* plain text from the model, React escapes it */}
                    {state.result.feedback && <span>{state.result.feedback}</span>}
                    {state.result.explanation && (
                        <span className="ai-result__explanation">
                            <span className="ai-result__label">Erklärung</span>
                            {state.result.explanation}
                        </span>
                    )}
                </>
            )}
        </div>
    );
}
