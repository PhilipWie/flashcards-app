import { useId } from "react";
import { Dumbbell } from "lucide-react";
import type { Card } from "../../types/Card";
import { BOXES, boxColorStyle, countPerBox, filterByBoxes } from "../../lib/leitner";

// quick picks, they only set the box toggles.
// box 5 = learned (see docs/technical_docu/api.md), so 1–4 = not learned yet
const PRESETS = [
    { label: "Alle", boxes: [...BOXES] },
    { label: "Noch nicht gelernt", boxes: [1, 2, 3, 4] },
    { label: "Schwierige", boxes: [1, 2] },
] as const;

type BoxFilterProps = {
    cards: Card[];
    selectedBoxes: number[];
    onSelectedBoxesChange: (boxes: number[]) => void;
    shuffled: boolean;
    onShuffledChange: (shuffled: boolean) => void;
    onStart: () => void;
};

function sameBoxes(a: readonly number[], b: readonly number[]): boolean {
    return a.length === b.length && a.every((box) => b.includes(box));
}

// Start screen of free practice: choose boxes and order.
// Controlled component: the page owns the selection.
export default function BoxFilter({
    cards,
    selectedBoxes,
    onSelectedBoxesChange,
    shuffled,
    onShuffledChange,
    onStart,
}: BoxFilterProps) {
    const id = useId();
    const counts = countPerBox(cards);
    const selectedCount = filterByBoxes(cards, selectedBoxes).length;

    function toggleBox(box: number) {
        const next = selectedBoxes.includes(box)
            ? selectedBoxes.filter((b) => b !== box)
            : [...selectedBoxes, box].sort((a, b) => a - b);
        onSelectedBoxesChange(next);
    }

    return (
        <form
            className="box-filter"
            onSubmit={(e) => {
                e.preventDefault();
                if (selectedCount > 0) onStart();
            }}
        >
            <fieldset className="box-filter__group">
                <legend className="box-filter__legend">Schnellauswahl</legend>
                <div className="chips">
                    {PRESETS.map((preset) => (
                        <button
                            key={preset.label}
                            type="button"
                            className="chip"
                            aria-pressed={sameBoxes(selectedBoxes, preset.boxes)}
                            onClick={() => onSelectedBoxesChange([...preset.boxes])}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </fieldset>

            <fieldset className="box-filter__group">
                <legend className="box-filter__legend">Fächer</legend>
                <div className="chips">
                    {BOXES.map((box, i) => (
                        <label key={box} className="chip chip--check" style={boxColorStyle(box)}>
                            <input
                                type="checkbox"
                                className="visually-hidden"
                                checked={selectedBoxes.includes(box)}
                                onChange={() => toggleBox(box)}
                            />
                            <span className="chip__dot" aria-hidden="true" />
                            Fach {box} <span className="text-muted">({counts[i]})</span>
                        </label>
                    ))}
                </div>
            </fieldset>

            <label className="switch" htmlFor={`${id}-shuffle`}>
                <input
                    id={`${id}-shuffle`}
                    type="checkbox"
                    role="switch"
                    className="switch__input"
                    checked={shuffled}
                    onChange={(e) => onShuffledChange(e.target.checked)}
                />
                <span className="switch__track" aria-hidden="true" />
                Karten mischen
            </label>

            <button type="submit" className="btn btn--primary" disabled={selectedCount === 0}>
                <Dumbbell aria-hidden="true" />
                {selectedCount === 1 ? "1 Karte üben" : `${selectedCount} Karten üben`}
            </button>
        </form>
    );
}
