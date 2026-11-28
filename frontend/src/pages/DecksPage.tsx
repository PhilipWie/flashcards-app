import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Plus } from "lucide-react";
import type { DeckSummary } from "../types/Deck";
import { createDeck, deleteDeck, getDecks, updateDeck } from "../api/decks";
import { useApiError } from "../hooks/useApiError";
import DeckItem from "../features/decks/DeckItem";
import ConfirmDialog from "../components/ConfirmDialog";
import { DECK_NAME_MAX } from "../features/decks/constants";

export default function DecksPage() {
    const [decks, setDecks] = useState<DeckSummary[]>([]);
    // deck waiting for confirmation in the dialog, null = dialog closed
    const [deckToDelete, setDeckToDelete] = useState<DeckSummary | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newName, setNewName] = useState("");
    const [creating, setCreating] = useState(false);
    const handleApiError = useApiError();
    const { t } = useTranslation();

    // load the decks once when the page opens
    useEffect(() => {
        // ignore the answer if the page was left in the meantime
        let ignore = false;
        getDecks()
            .then((data) => {
                if (!ignore) setDecks(data);
            })
            .catch((err) => {
                if (!ignore) setError(handleApiError(err));
            })
            .finally(() => {
                if (!ignore) setLoading(false);
            });
        return () => {
            ignore = true;
        };
    }, [handleApiError]);

    async function handleCreate(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const name = newName.trim();
        if (name === "") return;
        setError(null);
        setCreating(true);
        try {
            const deck = await createDeck(name);
            // a new deck has no cards yet
            setDecks((prev) => [...prev, { ...deck, card_count: 0, due_count: 0 }]);
            setNewName("");
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setCreating(false);
        }
    }

    // returns true on success, so DeckItem can close its form
    async function handleRename(id: number, name: string): Promise<boolean> {
        setError(null);
        try {
            const updated = await updateDeck(id, name);
            // PATCH only returns id and name, keep the counts
            setDecks((prev) => prev.map((d) => (d.id === id ? { ...d, name: updated.name } : d)));
            return true;
        } catch (err) {
            setError(handleApiError(err));
            return false;
        }
    }

    async function confirmDelete() {
        if (!deckToDelete) return;
        const deck = deckToDelete;
        setError(null);
        setDeleting(true);
        try {
            await deleteDeck(deck.id);
            setDecks((prev) => prev.filter((d) => d.id !== deck.id));
        } catch (err) {
            setError(handleApiError(err));
        } finally {
            setDeleting(false);
            setDeckToDelete(null);
        }
    }

    return (
        <div className="stack">
            <header className="page-header">
                <div>
                    <h1>{t("decks.title")}</h1>
                    <p className="text-muted">
                        {loading ? t("common.loading") : t("decks.count", { count: decks.length })}
                    </p>
                </div>
                <Link to="/dashboard" className="btn btn--glass">
                    <LayoutDashboard aria-hidden="true" />
                    {t("layout.dashboard")}
                </Link>
            </header>

            {error && (
                <p className="notice notice--error" role="alert">
                    {error}
                </p>
            )}

            <section className="panel glass" aria-labelledby="new-deck-title">
                <h2 id="new-deck-title" className="panel__title">
                    {t("decks.newTitle")}
                </h2>
                <form className="inline-form" onSubmit={handleCreate}>
                    <label htmlFor="new-deck-name" className="visually-hidden">
                        {t("decks.nameLabel")}
                    </label>
                    <input
                        id="new-deck-name"
                        className="input"
                        placeholder={t("decks.namePlaceholder")}
                        maxLength={DECK_NAME_MAX}
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />
                    <button type="submit" className="btn btn--primary" disabled={creating || newName.trim() === ""}>
                        <Plus aria-hidden="true" />
                        {t("common.create")}
                    </button>
                </form>
            </section>

            <section className="panel glass" aria-labelledby="deck-list-title" aria-busy={loading}>
                <h2 id="deck-list-title" className="panel__title">
                    {t("decks.listTitle")}
                </h2>
                {!loading && decks.length === 0 && (
                    <p className="empty text-muted">{t("decks.empty")}</p>
                )}
                {decks.length > 0 && (
                    <ul className="list">
                        {decks.map((deck) => (
                            <DeckItem key={deck.id} deck={deck} onRename={handleRename} onDelete={setDeckToDelete} />
                        ))}
                    </ul>
                )}
            </section>

            <ConfirmDialog
                open={deckToDelete !== null}
                title={t("decks.deleteTitle")}
                message={t("decks.deleteMessage", { name: deckToDelete?.name ?? "", count: deckToDelete?.card_count ?? 0 })}
                confirmLabel={t("common.delete")}
                busy={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeckToDelete(null)}
            />
        </div>
    );
}
