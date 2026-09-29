'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  headerAction?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Modal bottom sheet on the native <dialog>: `showModal()` traps focus and makes the page inert,
 * Esc closes it, the scrim (backdrop) closes it, and focus returns to the opener.
 */
export function BottomSheet({ open, onClose, title, headerAction, footer, children }: BottomSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      document.documentElement.style.overflow = 'hidden';
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => {
      document.documentElement.style.overflow = '';
      opener.current?.focus();
      onClose();
    };
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  useEffect(() => () => void (document.documentElement.style.overflow = ''), []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className="sheet"
      onClick={(e) => {
        // A click whose target is the <dialog> itself landed on the backdrop.
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      <div className="sheet-panel bg-cream flex max-h-[84dvh] flex-col rounded-t-[28px]">
        <div className="flex-none px-[18px] pt-2.5">
          <div aria-hidden="true" className="bg-line-strong mx-auto mb-2 h-1 w-10 rounded-full" />
          <div className="mb-1 flex items-center justify-between">
            <h2 id={titleId} className="m-0 font-serif text-[26px] font-semibold tracking-[-0.5px]">
              {title}
            </h2>
            <div className="flex items-center gap-1">
              {headerAction}
              <button
                type="button"
                aria-label={`Close ${title.toLowerCase()}`}
                onClick={() => ref.current?.close()}
                className="hover:bg-ink/5 flex size-11 items-center justify-center rounded-full"
              >
                <svg
                  viewBox="0 0 24 24"
                  width={22}
                  height={22}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[18px] pb-2">{children}</div>
        {footer && (
          <div className="flex-none px-[18px] pt-3 pb-[calc(20px+env(safe-area-inset-bottom))]">{footer}</div>
        )}
      </div>
    </dialog>
  );
}
