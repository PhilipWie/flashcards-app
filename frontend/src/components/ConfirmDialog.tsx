import { useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import Modal from "./Modal";

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

// modal confirmation, e.g. before deleting
export default function ConfirmDialog({ open, title, message, confirmLabel, busy = false, onConfirm, onCancel }: ConfirmDialogProps) {
    const cancelRef = useRef<HTMLButtonElement>(null);
    const titleId = useId();
    const messageId = useId();
    const { t } = useTranslation();

    return (
        <Modal
            open={open}
            onClose={onCancel}
            labelledBy={titleId}
            describedBy={messageId}
            // safe default: Enter right away must not delete anything
            initialFocusRef={cancelRef}
            preventClose={busy}
        >
            <h2 id={titleId} className="dialog__title">
                {title}
            </h2>
            <p id={messageId} className="text-muted">
                {message}
            </p>
            <div className="dialog__actions">
                <button ref={cancelRef} type="button" className="btn btn--glass" onClick={onCancel} disabled={busy}>
                    {t("common.cancel")}
                </button>
                <button type="button" className="btn btn--primary" onClick={onConfirm} disabled={busy}>
                    {busy ? t("common.busy", { label: confirmLabel }) : confirmLabel}
                </button>
            </div>
        </Modal>
    );
}
