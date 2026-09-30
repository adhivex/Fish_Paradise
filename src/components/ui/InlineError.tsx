import { Icon } from './Icon';

/** Inline error with an optional retry (design system: errors = inline message with retry). */
export function InlineError({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`border-danger/30 text-danger flex items-center gap-3 rounded-2xl border bg-[#FBEDE8] p-3.5 text-sm ${className ?? ''}`}
    >
      <Icon name="alert" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="h-11 rounded-xl px-3 font-bold underline">
          Retry
        </button>
      )}
    </div>
  );
}
