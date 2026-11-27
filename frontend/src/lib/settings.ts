import { BOXES } from "./leitner";

// Settings of the app, stored per device in localStorage.
// A small store: all components using useSettings() see changes immediately.

// what free practice does with the learning progress
//   "none":          nothing is saved
//   "reset-unknown": "didn't know" moves the card back to box 1 (due today)
export type PracticeEffect = "none" | "reset-unknown";

// when the AI checks a typed answer
//   "button": only after a click on "Prüfen"
//   "auto":   automatically when the card is flipped
export type AiCheckMode = "button" | "auto";

export type Settings = {
    practiceEffect: PracticeEffect;
    shuffleByDefault: boolean;
    // last box selection on the free practice start screen
    practiceBoxes: number[];
    // learn session: type the answer before flipping the card
    typeAnswer: boolean;
    // main switch: may card texts and answers be sent to the AI at all (privacy)
    aiEnabled: boolean;
    // quick switch in the learn session, only shown when aiEnabled is on
    aiCheck: boolean;
    aiCheckMode: AiCheckMode;
};

const STORAGE_KEY = "flashcards_settings";

export const DEFAULT_SETTINGS: Settings = {
    practiceEffect: "none",
    shuffleByDefault: true,
    practiceBoxes: [...BOXES],
    typeAnswer: false,
    aiEnabled: false,
    aiCheck: true,
    aiCheckMode: "button",
};

// localStorage can be edited by anyone in the browser: treat it as untrusted input.
// Every value is checked on its own, anything invalid falls back to the default.
function parseSettings(raw: string | null): Settings {
    if (raw === null) return DEFAULT_SETTINGS;
    let data: unknown;
    try {
        data = JSON.parse(raw);
    } catch {
        return DEFAULT_SETTINGS;
    }
    if (typeof data !== "object" || data === null || Array.isArray(data)) return DEFAULT_SETTINGS;
    const obj = data as Record<string, unknown>;

    return {
        practiceEffect: obj.practiceEffect === "reset-unknown" ? "reset-unknown" : "none",
        shuffleByDefault:
            typeof obj.shuffleByDefault === "boolean" ? obj.shuffleByDefault : DEFAULT_SETTINGS.shuffleByDefault,
        practiceBoxes: parseBoxes(obj.practiceBoxes),
        typeAnswer: typeof obj.typeAnswer === "boolean" ? obj.typeAnswer : DEFAULT_SETTINGS.typeAnswer,
        aiEnabled: typeof obj.aiEnabled === "boolean" ? obj.aiEnabled : DEFAULT_SETTINGS.aiEnabled,
        aiCheck: typeof obj.aiCheck === "boolean" ? obj.aiCheck : DEFAULT_SETTINGS.aiCheck,
        aiCheckMode: obj.aiCheckMode === "auto" ? "auto" : "button",
    };
}

// allow list: only boxes 1 to 5, no duplicates, sorted
function parseBoxes(value: unknown): number[] {
    if (!Array.isArray(value)) return DEFAULT_SETTINGS.practiceBoxes;
    const boxes = BOXES.filter((box) => value.includes(box));
    return boxes.length > 0 ? boxes : DEFAULT_SETTINGS.practiceBoxes;
}

function readStorage(): string | null {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        // storage can be blocked (e.g. privacy settings)
        return null;
    }
}

// useSyncExternalStore needs the same object as long as nothing changed
let current: Settings = parseSettings(readStorage());
const listeners = new Set<() => void>();

function notify() {
    listeners.forEach((listener) => listener());
}

// settings changed in another tab
function handleStorage(e: StorageEvent) {
    if (e.key !== STORAGE_KEY) return;
    current = parseSettings(e.newValue);
    notify();
}

export function getSettings(): Settings {
    return current;
}

export function subscribeSettings(listener: () => void): () => void {
    if (listeners.size === 0) window.addEventListener("storage", handleStorage);
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener("storage", handleStorage);
    };
}

export function updateSettings(changes: Partial<Settings>) {
    // validate the merged result the same way as stored data
    const next = parseSettings(JSON.stringify({ ...current, ...changes }));
    current = next;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        // not saved, but still active until reload
    }
    notify();
}
