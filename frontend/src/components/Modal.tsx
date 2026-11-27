import { useEffect, useRef, type MouseEvent, type ReactNode, type RefObject } from "react";

type ModalProps = {
    open: boolean;
    // called for Escape, backdrop click and when the browser closes the dialog
    onClose: () => void;
    // id of the heading inside the modal
    labelledBy: string;
    describedBy?: string;
    // element to focus when opening, otherwise the browser picks the first focusable one
    initialFocusRef?: RefObject<HTMLElement | null>;
    // e.g. while a request runs: Escape and backdrop click are ignored
    preventClose?: boolean;
    children: ReactNode;
};

// Shared base for dialogs, built on the native <dialog> element.
// showModal() gives focus trap, Escape and an inert background for free.
// The open prop is the single source of truth, the dialog follows it.
export default function Modal({ open, onClose, labelledBy, describedBy, initialFocusRef, preventClose = false, children }: ModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) {
            dialog.showModal();
            initialFocusRef?.current?.focus();
        } else if (!open && dialog.open) {
            dialog.close();
        }
    }, [open, initialFocusRef]);

    function requestClose() {
        if (!preventClose) onClose();
    }

    // a click on the dialog element itself is a click on the backdrop
    // (the content sits in .dialog__body, which covers the whole box)
    function handleClick(e: MouseEvent<HTMLDialogElement>) {
        if (e.target === e.currentTarget) requestClose();
    }

    return (
        <dialog
            ref={dialogRef}
            className="dialog glass"
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
            onClick={handleClick}
            // Escape: let React state close the dialog, not the browser
            onCancel={(e) => {
                e.preventDefault();
                requestClose();
            }}
            // the browser may still close it (e.g. Escape pressed twice): keep state in sync
            onClose={() => {
                if (open) onClose();
            }}
        >
            <div className="dialog__body">{children}</div>
        </dialog>
    );
}
