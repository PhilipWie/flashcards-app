import type { Card } from "../../types/Card";
import { BOXES, countPerBox } from "../../lib/leitner";

type BoxBarProps = {
    cards: Card[];
};

// thin bar: how the cards are spread across the 5 Leitner boxes
export default function BoxBar({ cards }: BoxBarProps) {
    return <BoxCountsBar counts={countPerBox(cards)} />;
}

type BoxCountsBarProps = {
    // index 0 = box 1
    counts: number[];
};

// same bar from counts, e.g. from the statistics (no card list needed)
export function BoxCountsBar({ counts }: BoxCountsBarProps) {
    const total = counts.reduce((sum, n) => sum + n, 0);

    return (
        <div className="box-summary">
            <div className="box-bar" aria-hidden="true">
                {total > 0 &&
                    counts.map((count, i) => (
                        <span
                            key={BOXES[i]}
                            style={{ width: `${(count / total) * 100}%`, background: `var(--box-${BOXES[i]})` }}
                        />
                    ))}
            </div>
            {/* same information as text, also for screen readers */}
            <ul className="box-legend">
                {counts.map((count, i) => (
                    <li key={BOXES[i]}>
                        <span className="box-legend__dot" style={{ background: `var(--box-${BOXES[i]})` }} />
                        Fach {BOXES[i]}: {count}
                    </li>
                ))}
            </ul>
        </div>
    );
}
