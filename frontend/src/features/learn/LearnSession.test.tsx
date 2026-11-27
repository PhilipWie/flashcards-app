import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import type { Card } from "../../types/Card";
import { getSettings, updateSettings } from "../../lib/settings";
import { ApiError } from "../../api/client";
import { checkAnswer } from "../../api/review";
import LearnSession from "./LearnSession";

// no backend in tests: only checkAnswer is replaced, LearnSession gets onAnswer as a prop
vi.mock("../../api/review", () => ({ checkAnswer: vi.fn() }));
const checkMock = vi.mocked(checkAnswer);

function card(id: number, front: string, back: string): Card {
    return { id, front, back, box: 1, next_review: "2026-11-27" };
}

const cards = [card(1, "Hund", "dog"), card(2, "Katze", "cat")];

// useApiError inside LearnSession needs a router
function renderSession() {
    // the page decides what an answer does, here: just return the card
    const onAnswer = vi.fn(async (c: Card) => c);
    render(
        <MemoryRouter>
            <LearnSession initialCards={cards} onAnswer={onAnswer} doneActions={null} />
        </MemoryRouter>,
    );
    return { onAnswer };
}

describe("LearnSession without typed answer", () => {
    beforeEach(() => {
        // the settings store lives on between tests, set it explicitly
        updateSettings({ typeAnswer: false, aiEnabled: false });
    });

    it("shows no answer field", () => {
        renderSession();
        expect(screen.queryByLabelText("Deine Antwort")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Umdrehen" })).toBeInTheDocument();
    });
});

describe("LearnSession with typed answer", () => {
    beforeEach(() => {
        updateSettings({ typeAnswer: true, aiEnabled: false });
    });

    it("shows no AI controls while the AI is off in the settings", () => {
        renderSession();
        expect(screen.queryByRole("button", { name: "Prüfen" })).not.toBeInTheDocument();
        expect(screen.queryByRole("switch", { name: "KI-Prüfung" })).not.toBeInTheDocument();
    });

    it("flips the card with Enter and shows the typed answer", async () => {
        const user = userEvent.setup();
        renderSession();

        const input = screen.getByLabelText("Deine Antwort");
        expect(input).toHaveFocus();
        await user.type(input, "  dog {Enter}");

        expect(screen.getByRole("button", { name: /Rückseite/ })).toHaveFocus();
        expect(screen.getByText("Deine Antwort").parentElement).toHaveTextContent("Deine Antwortdog");
        expect(screen.queryByLabelText("Deine Antwort")).not.toBeInTheDocument();
    });

    it("says so when nothing was typed", async () => {
        const user = userEvent.setup();
        renderSession();

        await user.click(screen.getByRole("button", { name: "Umdrehen" }));

        expect(screen.getByText("Keine Antwort eingegeben")).toBeInTheDocument();
    });

    it("starts the next card with an empty field", async () => {
        const user = userEvent.setup();
        const { onAnswer } = renderSession();

        await user.type(screen.getByLabelText("Deine Antwort"), "dog{Enter}");
        await user.click(screen.getByRole("button", { name: "Gewusst" }));

        expect(onAnswer).toHaveBeenCalledWith(cards[0], true);
        expect(screen.getByText("Karte 2 von 2")).toBeInTheDocument();
        const input = screen.getByLabelText("Deine Antwort");
        expect(input).toHaveValue("");
        expect(input).toHaveFocus();
    });

    it("limits the answer length", () => {
        renderSession();
        expect(screen.getByLabelText("Deine Antwort")).toHaveAttribute("maxLength", "500");
    });
});

describe("LearnSession with AI check", () => {
    beforeEach(() => {
        checkMock.mockReset();
        updateSettings({ typeAnswer: true, aiEnabled: true, aiCheck: true, aiCheckMode: "button" });
    });

    it("checks only after a click on Prüfen and highlights the suggestion", async () => {
        checkMock.mockResolvedValue({ verdict: "correct", feedback: "Genau." });
        const user = userEvent.setup();
        renderSession();

        const checkButton = screen.getByRole("button", { name: "Prüfen" });
        expect(checkButton).toBeDisabled();
        await user.type(screen.getByLabelText("Deine Antwort"), "dog");
        await user.click(checkButton);

        expect(checkMock).toHaveBeenCalledWith(1, "dog");
        expect(await screen.findByText(/KI: Richtig/)).toBeInTheDocument();
        expect(screen.getByText("Genau.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Gewusst" })).toHaveClass("is-suggested");
        expect(screen.getByRole("button", { name: "Nicht gewusst" })).not.toHaveClass("is-suggested");
    });

    it("does not check on Enter in button mode", async () => {
        const user = userEvent.setup();
        renderSession();
        await user.type(screen.getByLabelText("Deine Antwort"), "dog{Enter}");
        expect(checkMock).not.toHaveBeenCalled();
    });

    it("checks on flip in automatic mode", async () => {
        updateSettings({ aiCheckMode: "auto" });
        checkMock.mockResolvedValue({ verdict: "wrong", feedback: "Nein." });
        const user = userEvent.setup();
        renderSession();

        expect(screen.queryByRole("button", { name: "Prüfen" })).not.toBeInTheDocument();
        await user.type(screen.getByLabelText("Deine Antwort"), "cat{Enter}");

        expect(checkMock).toHaveBeenCalledWith(1, "cat");
        expect(await screen.findByText(/KI: Falsch/)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Nicht gewusst" })).toHaveClass("is-suggested");
    });

    it("does not check an empty answer in automatic mode", async () => {
        updateSettings({ aiCheckMode: "auto" });
        const user = userEvent.setup();
        renderSession();
        await user.click(screen.getByRole("button", { name: "Umdrehen" }));
        expect(checkMock).not.toHaveBeenCalled();
    });

    it("highlights nothing for a partly correct answer", async () => {
        checkMock.mockResolvedValue({ verdict: "partial", feedback: "Fast." });
        const user = userEvent.setup();
        renderSession();
        await user.type(screen.getByLabelText("Deine Antwort"), "do");
        await user.click(screen.getByRole("button", { name: "Prüfen" }));

        expect(await screen.findByText(/KI: Teilweise richtig/)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Gewusst" })).not.toHaveClass("is-suggested");
        expect(screen.getByRole("button", { name: "Nicht gewusst" })).not.toHaveClass("is-suggested");
    });

    it("falls back to self-grading if the AI is not available", async () => {
        checkMock.mockRejectedValue(new ApiError(503, "AI check not available"));
        const user = userEvent.setup();
        renderSession();
        await user.type(screen.getByLabelText("Deine Antwort"), "dog");
        await user.click(screen.getByRole("button", { name: "Prüfen" }));

        expect(await screen.findByText(/KI-Prüfung gerade nicht verfügbar/)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Gewusst" })).toBeEnabled();
    });

    it("can be switched off in the session and remembers it", async () => {
        const user = userEvent.setup();
        renderSession();
        await user.click(screen.getByRole("switch", { name: "KI-Prüfung" }));

        expect(screen.queryByRole("button", { name: "Prüfen" })).not.toBeInTheDocument();
        expect(getSettings().aiCheck).toBe(false);
    });
});
