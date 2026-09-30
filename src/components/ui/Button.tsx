import Link from 'next/link';
import type { ButtonHTMLAttributes, ComponentProps } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'outline' | 'gold' | 'danger' | 'dangerOutline';
type Size = 'lg' | 'md';

interface StyleProps {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-cream [&_svg]:text-gold hover:bg-[#123a41] disabled:bg-ink/45',
  outline:
    'border border-ink bg-transparent text-ink hover:bg-ink/5 disabled:opacity-50 disabled:hover:bg-transparent',
  gold: 'bg-gold text-ink hover:bg-[#d3b06a]',
  danger: 'bg-danger text-white hover:bg-[#9a2f16] disabled:opacity-50',
  dangerOutline: 'border border-danger bg-transparent text-danger hover:bg-danger/5 disabled:opacity-50',
};

const SIZES: Record<Size, string> = {
  lg: 'h-14 rounded-2xl px-6',
  md: 'h-12 rounded-2xl px-5',
};

function buttonClasses({ variant = 'primary', size = 'lg', block = true }: StyleProps, extra?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2.5 text-[15px] font-semibold tracking-[0.03em] no-underline transition-colors duration-150',
    VARIANTS[variant],
    SIZES[size],
    block && 'w-full',
    extra,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & StyleProps;

export function Button({ variant, size, block, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, block }, className)} {...rest} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & StyleProps;

export function ButtonLink({ variant, size, block, className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, size, block }, className)} {...rest} />;
}
