import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface EmptyStateProps {
  title: string;
  body: string;
  icon?: IconName;
  action?: ReactNode;
}

export function EmptyState({ title, body, icon, action }: EmptyStateProps) {
  return (
    <div className="mx-8 mt-14 flex flex-col items-center gap-2.5 text-center">
      {icon && <Icon name={icon} size={44} className="text-gold-glyph" />}
      <h2 className="mt-1.5 mb-0 font-serif text-2xl font-semibold">{title}</h2>
      <p className="text-ink-muted m-0 mb-3 text-sm leading-normal">{body}</p>
      {action}
    </div>
  );
}
