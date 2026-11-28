import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Trash2 } from "lucide-react";
import type { Card } from "../../types/Card";
import { boxColorStyle } from "../../lib/leitner";
import { formatDate, isDue } from "../../lib/date";
import CardForm from "./CardForm";

type CardItemProps = {
    card: Card;
    onUpdate: (id: number, front: string, back: string) => Promise<boolean>;
    onDelete: (card: Card) => void;
};

// one card in the deck detail list, can switch into an inline edit form
export default function CardItem({ card, onUpdate, onDelete }: CardItemProps) {
    const [editing, setEditing] = useState(false);
    const { t, i18n } = useTranslation();

    if (editing) {
        return (
            <li className="card-item">
                <CardForm
                    initialFront={card.front}
                    initialBack={card.back}
                    variant="edit"
                    onSubmit={async (front, back) => {
                        const ok = await onUpdate(card.id, front, back);
                        if (ok) setEditing(false);
                        return ok;
                    }}
                    onCancel={() => setEditing(false)}
                />
            </li>
        );
    }

    return (
        <li className="card-item">
            <div className="card-item__text">
                <p className="card-item__front">{card.front}</p>
                <p className="card-item__back">{card.back}</p>
            </div>
            <div className="card-item__meta">
                <span className="box-badge" style={boxColorStyle(card.box)}>
                    {t("common.box", { box: card.box })}
                </span>
                <span className="text-muted card-item__due">
                    {isDue(card.next_review)
                        ? t("card.dueToday")
                        : t("card.dueFrom", { date: formatDate(card.next_review, i18n.language) })}
                </span>
                <div className="deck__actions">
                    <button
                        type="button"
                        className="btn btn--icon"
                        onClick={() => setEditing(true)}
                        aria-label={t("card.editAria", { front: card.front })}
                        title={t("common.edit")}
                    >
                        <Pencil aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className="btn btn--icon btn--danger"
                        onClick={() => onDelete(card)}
                        aria-label={t("card.deleteAria", { front: card.front })}
                        title={t("common.delete")}
                    >
                        <Trash2 aria-hidden="true" />
                    </button>
                </div>
            </div>
        </li>
    );
}
