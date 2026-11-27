// Small client for OpenRouter (OpenAI compatible chat completions API).
// Shared base for all AI features: answer check now, card generation later.
// The API key stays on the server, the frontend never talks to OpenRouter.

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'anthropic/claude-haiku-5.5';
const TIMEOUT_MS = 10_000;

// any problem with the AI (no key, timeout, provider error, invalid output).
// The message is for the server log only and never contains the key or provider text.
export class AiUnavailableError extends Error {}

function apiKey(): string | undefined {
    const key = process.env.OPENROUTER_API_KEY?.trim();
    return key ? key : undefined;
}

// read at call time, so the key can be added to .env without code changes (after a restart)
export function isAiConfigured(): boolean {
    return apiKey() !== undefined;
}

// the parts of the OpenRouter response we read, everything optional: nothing is trusted
type OpenRouterResponse = {
    error?: { code?: number };
    choices?: { message?: { content?: unknown }; finish_reason?: string }[];
};

export type JsonRequest = {
    // instructions, never contains user input
    system: string;
    // user input, clearly delimited inside the text
    user: string;
    // JSON schema the answer must follow
    schemaName: string;
    schema: Record<string, unknown>;
    // upper limit for the model's output (including reasoning)
    maxTokens: number;
};

// Sends one request and returns the parsed JSON answer.
// The caller must still validate the shape: strict mode is not guaranteed by every provider.
export async function completeJson({ system, user, schemaName, schema, maxTokens }: JsonRequest): Promise<unknown> {
    const key = apiKey();
    if (!key) throw new AiUnavailableError('OPENROUTER_API_KEY not set');

    let response: Response;
    try {
        response = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL,
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: user },
                ],
                response_format: {
                    type: 'json_schema',
                    json_schema: { name: schemaName, strict: true, schema },
                },
                max_tokens: maxTokens,
                // a little thinking is enough for short checks, and it is not sent back
                reasoning: { effort: 'low', exclude: true },
                provider: {
                    // only providers that support structured outputs
                    require_parameters: true,
                    // no providers that store prompts or use them for training
                    data_collection: 'deny',
                },
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
    } catch (err) {
        const reason = err instanceof Error && err.name === 'TimeoutError' ? 'timeout' : 'network error';
        throw new AiUnavailableError(`OpenRouter ${reason}`);
    }

    // OpenRouter can answer 200 and still report an error in the body
    const data = (await response.json().catch(() => null)) as OpenRouterResponse | null;
    if (!response.ok || data?.error) {
        // log only the status code, not the provider message
        throw new AiUnavailableError(`OpenRouter error ${data?.error?.code ?? response.status}`);
    }

    const choice = data?.choices?.[0];
    const content = choice?.message?.content;
    if (choice?.finish_reason === 'error' || typeof content !== 'string') {
        throw new AiUnavailableError(`OpenRouter returned no answer (finish_reason: ${choice?.finish_reason})`);
    }
    try {
        return JSON.parse(content);
    } catch {
        throw new AiUnavailableError('OpenRouter returned invalid JSON');
    }
}
