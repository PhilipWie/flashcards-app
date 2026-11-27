import { request } from "./client";
import type { ChatMessage } from "../types/Chat";
import type { CheckResult } from "../types/Check";

type ChatContext = {
    // typed answer and AI check result of the current card, if there are any
    answer?: string;
    check?: Pick<CheckResult, "verdict" | "feedback"> | null;
};

// asks the AI about one card. The whole conversation is sent every time,
// the backend stores nothing. 503 = AI not available.
export async function askAboutCard(cardId: number, messages: ChatMessage[], context: ChatContext): Promise<string> {
    const data = await request<{ reply: string }>("POST", `/api/cards/${cardId}/chat`, { messages, ...context });
    return data.reply;
}
