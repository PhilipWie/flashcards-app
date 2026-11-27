import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import type { Stats } from "../types/Stats";
import DashboardPage from "./DashboardPage";

const emptyStats: Stats = {
    today: "2026-11-27",
    streak: 0,
    total: { answers: 0, correct: 0, accuracy: null },
    period: { days: 14, answers: 0, correct: 0, accuracy: null },
    days: [],
    cards: { total: 0, due: 0, learned: 0, boxes: [0, 0, 0, 0, 0] },
};

// no backend in tests: the API function is replaced
vi.mock("../api/stats", () => ({ getStats: vi.fn(async () => emptyStats) }));

describe("DashboardPage", () => {
    it("shows empty states for a new user", async () => {
        render(
            <MemoryRouter>
                <DashboardPage />
            </MemoryRouter>,
        );
        // wait for the loaded state (the loading state has a "Dashboard" heading, too)
        expect(await screen.findByText(/Noch keine Antworten/)).toBeInTheDocument();
        expect(screen.getByText(/Noch keine Karten/)).toBeInTheDocument();
        // accuracy without answers is shown as a dash, not as "0 %"
        expect(screen.getAllByText("–")).toHaveLength(1);
    });
});
