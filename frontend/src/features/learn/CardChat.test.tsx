import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { ApiError } from "../../api/client";
import { askAboutCard } from "../../api/chat";
import CardChat from "./CardChat";

// no backend in tests
vi.mock("../../api/chat", () => ({ askAboutCard: vi.fn() }));
const askMock = vi.mocked(askAboutCard);

function renderChat() {
    const user = userEvent.setup();
    render(
        <MemoryRouter>
            <CardChat cardId={7} answer="dog " check={{ verdict: "partial", feedback: "Fast.", explanation: "Lang." }} />
        </MemoryRouter>,
    );
    return user;
}

async function ask(user: ReturnType<typeof userEvent.setup>, text: string) {
    await user.type(screen.getByLabelText("Frage an die KI"), `${text}{Enter}`);
}

describe("CardChat", () => {
    beforeEach(() => {
        askMock.mockReset();
    });

    it("sends the conversation with answer and check and shows the reply", async () => {
        askMock.mockResolvedValueOnce("Weil die Datenbank fehlt.").mockResolvedValueOnce("Gern.");
        const user = renderChat();
        await user.click(screen.getByText("Frag die KI zu dieser Karte"));

        await ask(user, "Warum?");
        expect(await screen.findByText("Weil die Datenbank fehlt.")).toBeInTheDocument();
        expect(askMock).toHaveBeenCalledWith(7, [{ role: "user", content: "Warum?" }], {
            answer: "dog",
            check: { verdict: "partial", feedback: "Fast." },
        });

        await ask(user, "Danke");
        expect(await screen.findByText("Gern.")).toBeInTheDocument();
        // the whole history is sent again
        expect(askMock.mock.calls[1][1]).toEqual([
            { role: "user", content: "Warum?" },
            { role: "assistant", content: "Weil die Datenbank fehlt." },
            { role: "user", content: "Danke" },
        ]);
        expect(screen.getByLabelText("Frage an die KI")).toHaveValue("");
    });

    it("puts the question back into the field if the AI is not available", async () => {
        askMock.mockRejectedValue(new ApiError(503, "AI chat not available"));
        const user = renderChat();
        await user.click(screen.getByText("Frag die KI zu dieser Karte"));

        await ask(user, "Warum?");
        expect(await screen.findByRole("alert")).toHaveTextContent("Die KI ist gerade nicht erreichbar");
        expect(screen.getByLabelText("Frage an die KI")).toHaveValue("Warum?");
        expect(screen.getByRole("log")).toBeEmptyDOMElement();
    });

    it("stops accepting questions when the chat is full", async () => {
        askMock.mockResolvedValue("Ok.");
        const user = renderChat();
        await user.click(screen.getByText("Frag die KI zu dieser Karte"));

        for (let i = 0; i < 5; i++) {
            await ask(user, `Frage ${i}`);
            await screen.findAllByText("Ok.");
        }
        expect(askMock).toHaveBeenCalledTimes(5);
        expect(screen.queryByLabelText("Frage an die KI")).not.toBeInTheDocument();
        expect(screen.getByText(/Der Chat zu dieser Karte ist voll/)).toBeInTheDocument();
    });
});
