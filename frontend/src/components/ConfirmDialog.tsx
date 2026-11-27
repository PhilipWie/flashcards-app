import { useEffect, useId, useRef, type MouseEvent } from "react";

type ConfirmDialogProps = {
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    // true while the request runs: buttons are disabled, the dialog stays open
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

// Modal confirmation based on the native <dialog> element.
// showModal() gives focus trap, Escape and an inert background for free.
// The open prop is the single source of truth, the dialog follows it.
export default function ConfirmDialog({ open, title, message, confirmLabel, busy = false, onConfirm, onCancel }: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const titleId = useId();
    const messageId = useId();

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) {
            dialog.showModal();
            // safe default: Enter right away must not delete anything
            cancelRef.current?.focus();
        } else if (!open && dialog.open) {
            dialog.close();
        }
    }, [open]);

    function cancel() {
        if (!busy) onCancel();
    }

    // a click on the dialog element itself is a click on the backdrop
    // (the content sits in .dialog__body, which covers the whole box)
    function handleClick(e: MouseEvent<HTMLDialogElement>) {
        if (e.target === e.currentTarget) cancel();
    }

    return (
        <dialog
            ref={dialogRef}
            className="dialog glass"
            aria-labelledby={titleId}
            aria-describedby={messageId}
            onClick={handleClick}
            // Escape: let React state close the dialog, not the browser
            onCancel={(e) => {
                e.preventDefault();
                cancel();
            }}
            // the browser may still close it (e.g. Escape pressed twice): keep state in sync
            onClose={() => {
                if (open) onCancel();
            }}
        >
            <div className="dialog__body">
                <h2 id={titleId} className="dialog__title">
                    {title}
                </h2>
                <p id={messageId} className="text-muted">
                    {message}
                </p>
                <div className="dialog__actions">
                    <button ref={cancelRef} type="button" className="btn btn--glass" onClick={cancel} disabled={busy}>
                        Abbrechen
                    </button>
                    <button type="button" className="btn btn--primary" onClick={onConfirm} disabled={busy}>
                        {busy ? `${confirmLabel} …` : confirmLabel}
                    </button>
                </div>
            </div>
        </dialog>
    );
}
