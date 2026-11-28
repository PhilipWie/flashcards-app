import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Card } from "../../types/Card";
import BoxFilter from "./BoxFilter";

function card(id: number, box: number): Card {
    return { id, front: "f", back: "b", box, next_review: "2026-11-27" };
}

// two cards in box 1, one in box 2, one in box 5
const cards = [card(1, 1), card(2, 1), card(3, 2), card(4, 5)];

// BoxFilter is controlled: this wrapper holds the state like PracticePage does
function Wrapper({ onStart = () => {} }: { onStart?: () => void }) {
    const [boxes, setBoxes] = useState([1, 2, 3, 4, 5]);
    const [shuffled, setShuffled] = useState(true);
    return (
        <BoxFilter
            cards={cards}
            selectedBoxes={boxes}
            onSelectedBoxesChange={setBoxes}
            shuffled={shuffled}
            onShuffledChange={setShuffled}
            onStart={onStart}
        />
    );
}

describe("BoxFilter", () => {
    it("shows the number of selected cards on the start button", () => {
        render(<Wrapper />);
        expect(screen.getByRole("button", { name: /4 Karten üben/ })).toBeEnabled();
        expect(screen.getByRole("button", { name: "Alle" })).toHaveAttribute("aria-pressed", "true");
    });

    it("quick pick 'Schwierige' selects boxes 1 and 2", async () => {
        const user = userEvent.setup();
        render(<Wrapper />);

        await user.click(screen.getByRole("button", { name: "Schwierige" }));

        expect(screen.getByRole("checkbox", { name: /Fach 1/ })).toBeChecked();
        expect(screen.getByRole("checkbox", { name: /Fach 5/ })).not.toBeChecked();
        expect(screen.getByRole("button", { name: /3 Karten üben/ })).toBeInTheDocument();
    });

    it("disables the start button when no card is selected", async () => {
        const user = userEvent.setup();
        const onStart = vi.fn();
        render(<Wrapper onStart={onStart} />);

        // only box 3 and 4 (both empty)
        await user.click(screen.getByRole("button", { name: "Schwierige" }));
        await user.click(screen.getByRole("checkbox", { name: /Fach 1/ }));
        await user.click(screen.getByRole("checkbox", { name: /Fach 2/ }));

        const start = screen.getByRole("button", { name: /0 Karten üben/ });
        expect(start).toBeDisabled();
        await user.click(start);
        expect(onStart).not.toHaveBeenCalled();
    });

    it("calls onStart when started", async () => {
        const user = userEvent.setup();
        const onStart = vi.fn();
        render(<Wrapper onStart={onStart} />);

        await user.click(screen.getByRole("button", { name: /Karten üben/ }));
        expect(onStart).toHaveBeenCalledTimes(1);
    });
});
