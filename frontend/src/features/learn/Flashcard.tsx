import type { Ref } from "react";
import { useTranslation } from "react-i18next";
import type { Card } from "../../types/Card";
import { boxColorStyle } from "../../lib/leitner";

type FlashcardProps = {
    card: Card;
    flipped: boolean;
    onFlip: () => void;
    // lets LearnSession move the focus to the card (React 19: ref is a normal prop)
    ref?: Ref<HTMLButtonElement>;
};

// the index card from base.css (.flashcard), click turns it around
export default function Flashcard({ card, flipped, onFlip, ref }: FlashcardProps) {
    const { t } = useTranslation();
    return (
        <button
            ref={ref}
            type="button"
            className={`flashcard glass${flipped ? " is-flipped" : ""}`}
            onClick={onFlip}
            // no aria-label: the visible side and its text are the accessible name
            aria-pressed={flipped}
        >
            <span className="flashcard__side">{flipped ? t("card.back") : t("card.front")}</span>
            <span className="box-badge flashcard__box" style={boxColorStyle(card.box)}>
                {t("common.box", { box: card.box })}
            </span>
            {/* both faces are stacked, only the visible one is read out */}
            <span className="flashcard__face flashcard__face--front" aria-hidden={flipped}>
                {card.front}
            </span>
            <span className="flashcard__face flashcard__face--back" aria-hidden={!flipped}>
                {card.back}
            </span>
        </button>
    );
}
