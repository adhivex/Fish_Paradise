import Link from 'next/link';
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './Icon';

type Tone = 'plain' | 'ink' | 'cream';

const TONES: Record<Tone, string> = {
  plain: 'bg-transparent hover:bg-ink/5',
  ink: 'bg-ink text-gold hover:bg-[#123a41] disabled:opacity-40',
  cream: 'bg-cream text-ink hover:bg-white',
};

const base = 'flex size-11 flex-none items-center justify-center rounded-full transition-colors duration-150';

interface Common {
  icon: IconName;
  /** Required: icon-only controls must be labelled. */
  label: string;
  tone?: Tone;
  iconSize?: number;
  filled?: boolean;
  children?: ReactNode;
}

export function IconButton({
  icon,
  label,
  tone = 'plain',
  iconSize,
  filled,
  className,
  children,
  type = 'button',
  ...rest
}: Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  return (
    <button type={type} aria-label={label} className={cn(base, TONES[tone], className)} {...rest}>
      <Icon name={icon} size={iconSize} filled={filled} />
      {children}
    </button>
  );
}

export function IconLink({
  icon,
  label,
  tone = 'plain',
  iconSize,
  className,
  children,
  ...rest
}: Common & Omit<ComponentProps<typeof Link>, 'children'>) {
  return (
    <Link aria-label={label} className={cn(base, TONES[tone], className)} {...rest}>
      <Icon name={icon} size={iconSize} />
      {children}
    </Link>
  );
}
