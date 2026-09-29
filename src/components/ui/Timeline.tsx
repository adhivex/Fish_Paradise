import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/datetime';
import type { TimelineStep } from '@/lib/orders';
import { Icon } from './Icon';

const STATE_TEXT = { done: 'completed', current: 'in progress', pending: 'upcoming' } as const;

/** Vertical order timeline: done = ink dot + gold check, current = gold dot, pending = outline. */
export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="m-0 list-none p-0">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        const next = steps[i + 1];
        return (
          <li
            key={step.label}
            className="flex gap-4"
            aria-current={step.state === 'current' ? 'step' : undefined}
          >
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex size-7 flex-none items-center justify-center rounded-full border-[1.5px]',
                  step.state === 'done' && 'border-ink bg-ink text-gold',
                  step.state === 'current' && 'border-gold bg-gold',
                  step.state === 'pending' && 'border-rail bg-card',
                )}
              >
                {step.state === 'done' && <Icon name="check" size={16} strokeWidth={2.4} />}
                {step.state === 'current' && <span className="bg-ink size-2 rounded-full" />}
              </span>
              {!last && (
                <span
                  className={cn(
                    'min-h-[34px] w-[1.5px] flex-1',
                    next && next.state !== 'pending' ? 'bg-ink' : 'bg-[#DCCFB4]',
                  )}
                />
              )}
            </div>
            <div className="flex flex-col gap-0.5 pb-[22px]">
              <b className="text-[15px]">{step.label}</b>
              <span className="text-ink-muted text-[13px]">
                {step.estimated ? `Est. ${formatTime(step.at)}` : formatTime(step.at)}
                <span className="sr-only"> – {STATE_TEXT[step.state]}</span>
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
