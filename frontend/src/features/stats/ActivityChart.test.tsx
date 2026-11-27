import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ActivityChart from "./ActivityChart";

const days = [
    { date: "2026-11-26", correct: 0, wrong: 0 },
    { date: "2026-11-27", correct: 3, wrong: 1 },
];

describe("ActivityChart", () => {
    it("describes every day as text for screen readers", () => {
        render(<ActivityChart days={days} today="2026-11-27" />);
        expect(screen.getByText(/26\. November: keine Antworten/)).toBeInTheDocument();
        expect(screen.getByText(/27\. November: 4 Antworten, 3 gewusst, 1 nicht gewusst/)).toBeInTheDocument();
    });

    it("marks today", () => {
        render(<ActivityChart days={days} today="2026-11-27" />);
        const items = screen.getAllByRole("listitem");
        expect(items[1]).toHaveAttribute("aria-current", "date");
        expect(items[0]).not.toHaveAttribute("aria-current");
    });

    it("scales the highest day to the full height", () => {
        const { container } = render(<ActivityChart days={days} today="2026-11-27" />);
        const bars = container.querySelectorAll<HTMLElement>(".activity__bar");
        expect(bars[0].style.height).toBe("0%");
        expect(bars[1].style.height).toBe("100%");
    });
});
