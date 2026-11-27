import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import type { Card } from "../../types/Card";
import { updateSettings } from "../../lib/settings";
import LearnSession from "./LearnSession";

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
        updateSettings({ typeAnswer: false });
    });

    it("shows no answer field", () => {
        renderSession();
        expect(screen.queryByLabelText("Deine Antwort")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Umdrehen" })).toBeInTheDocument();
    });
});

describe("LearnSession with typed answer", () => {
    beforeEach(() => {
        updateSettings({ typeAnswer: true });
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
