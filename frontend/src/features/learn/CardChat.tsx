import { useId, useState, type FormEvent } from "react";
import { MessageCircle, Send } from "lucide-react";
import type { ChatMessage } from "../../types/Chat";
import type { CheckResult } from "../../types/Check";
import { askAboutCard } from "../../api/chat";
import { ApiError } from "../../api/client";
import { useApiError } from "../../hooks/useApiError";
import { CHAT_MESSAGE_MAX, CHAT_MESSAGES_MAX } from "./constants";

type CardChatProps = {
    cardId: number;
    // typed answer and check result, the AI knows them
    answer: string;
    check: CheckResult | null;
};

// Small chat with the AI about the current card, shown after flipping.
// Nothing is stored: LearnSession mounts it fresh for every card (key), so it starts empty.
export default function CardChat({ cardId, answer, check }: CardChatProps) {
    const id = useId();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const handleApiError = useApiError();

    // one more question needs room for the question and the reply
    const full = messages.length + 2 > CHAT_MESSAGES_MAX;

    async function send(e: FormEvent) {
        e.preventDefault();
        const text = input.trim();
        if (text === "" || sending || full) return;

        const next: ChatMessage[] = [...messages, { role: "user", content: text }];
        setMessages(next);
        setInput("");
        setError(null);
        setSending(true);
        try {
            const reply = await askAboutCard(cardId, next, {
                answer: answer.trim() || undefined,
                check: check ? { verdict: check.verdict, feedback: check.feedback } : null,
            });
            setMessages([...next, { role: "assistant", content: reply }]);
        } catch (err) {
            // take the question back into the field, so it can be sent again
            setMessages(messages);
            setInput(text);
            const message =
                err instanceof ApiError && err.status === 503
                    ? "Die KI ist gerade nicht erreichbar. Versuch es später noch einmal."
                    : handleApiError(err);
            setError(message);
        } finally {
            setSending(false);
        }
    }

    return (
        <details className="panel glass card-chat">
            <summary className="card-chat__summary">
                <MessageCircle aria-hidden="true" />
                Frag die KI zu dieser Karte
            </summary>

            {/* role="log": new messages are read out by screen readers */}
            <ol className="card-chat__log" role="log" aria-label="Chatverlauf">
                {messages.map((m, i) => (
                    <li key={i} className={`card-chat__msg card-chat__msg--${m.role}`}>
                        <span className="card-chat__who">{m.role === "user" ? "Du" : "KI"}</span>
                        {/* plain text, React escapes it */}
                        <p>{m.content}</p>
                    </li>
                ))}
                {sending && (
                    <li className="card-chat__msg card-chat__msg--assistant">
                        <span className="card-chat__who">KI</span>
                        <p className="text-muted">schreibt …</p>
                    </li>
                )}
            </ol>

            {error && (
                <p className="notice notice--error" role="alert">
                    {error}
                </p>
            )}

            {full ? (
                <p className="text-muted">Der Chat zu dieser Karte ist voll. Bei der nächsten Karte geht es neu los.</p>
            ) : (
                <form className="card-chat__form" onSubmit={send}>
                    <label htmlFor={id} className="visually-hidden">
                        Frage an die KI
                    </label>
                    <input
                        id={id}
                        className="input"
                        placeholder="z. B. Gib mir ein weiteres Beispiel"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        maxLength={CHAT_MESSAGE_MAX}
                        autoComplete="off"
                    />
                    <button type="submit" className="btn btn--primary" disabled={sending || input.trim() === ""}>
                        <Send aria-hidden="true" />
                        Senden
                    </button>
                </form>
            )}

            <p className="text-muted card-chat__note">Die KI kann sich irren. Der Chat wird nicht gespeichert.</p>
        </details>
    );
}
