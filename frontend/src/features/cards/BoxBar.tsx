import type { Card } from "../../types/Card";
import { BOXES, countPerBox } from "../../lib/leitner";

type BoxBarProps = {
    cards: Card[];
};

// thin bar: how the cards are spread across the 5 Leitner boxes
export default function BoxBar({ cards }: BoxBarProps) {
    const counts = countPerBox(cards);
    const total = cards.length;

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
