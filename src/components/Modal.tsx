import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

let openModals = 0;
let previousOverflow = "";
const escapeStack: symbol[] = [];

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  panelClassName?: string;
  overlayClassName?: string;
  showClose?: boolean;
  level?: number;
  labelledBy?: string;
}

export function Modal({
  open,
  onClose,
  children,
  panelClassName = "",
  overlayClassName = "bg-[#0b1018]/75 backdrop-blur-[6px]",
  showClose = true,
  level = 100,
  labelledBy,
}: ModalProps) {
  const generatedId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    if (openModals === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    openModals += 1;

    const id = Symbol("modal");
    escapeStack.push(id);

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        escapeStack[escapeStack.length - 1] === id
      ) {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const index = escapeStack.indexOf(id);
      if (index >= 0) escapeStack.splice(index, 1);
      openModals = Math.max(0, openModals - 1);
      if (openModals === 0) document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className={`fixed inset-0 flex items-center justify-center overflow-y-auto p-3 sm:p-6 ${overlayClassName}`}
      style={{ zIndex: level }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy || generatedId}
        className={`relative my-auto w-full ${panelClassName}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {showClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/90 text-[#24303e] transition hover:bg-white"
          >
            <X size={17} strokeWidth={1.8} />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
}
