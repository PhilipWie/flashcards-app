import { useTranslation } from "react-i18next";
import type { CheckResult } from "../../types/Check";

// state of the AI check for the current card
export type CheckState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "done"; result: CheckResult }
    | { status: "error"; message: string };

// Result of the AI check below the typed answer.
// role="status": the result arrives later, screen readers announce it when it is there.
// Block elements (div/p), so label and text are read as separate parts, not as one word.
export default function AiResult({ state }: { state: CheckState }) {
    const { t } = useTranslation();
    return (
        <div className="ai-result" role="status">
            {state.status === "loading" && <p className="text-muted">{t("aiResult.checking")}</p>}
            {state.status === "error" && <p className="text-muted">{state.message}</p>}
            {state.status === "done" && (
                <>
                    <p className={`ai-result__verdict ai-result__verdict--${state.result.verdict}`}>
                        {t("aiResult.verdict", { verdict: t(`aiResult.verdicts.${state.result.verdict}`) })}
                        <span className="ai-result__suggestion"> · {t(`aiResult.suggestions.${state.result.verdict}`)}</span>
                    </p>
                    {/* plain text from the model, React escapes it */}
                    {state.result.feedback && <p>{state.result.feedback}</p>}
                    {state.result.explanation && (
                        <div className="ai-result__explanation">
                            <p className="ai-result__label">{t("aiResult.explanation")}</p>
                            <p>{state.result.explanation}</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
