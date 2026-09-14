import { type Component, splitProps } from 'solid-js';
import type { BadgeProps } from './types';

const badgeClass: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-muted text-muted-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  outline: 'border border-border text-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  muted: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const badgeSizeClass: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
};

export const Badge: Component<BadgeProps> = (props) => {
  const [local] = splitProps(props, ['variant', 'size', 'class', 'children']);
  const variant = local.variant ?? 'default';
  const size = local.size ?? 'md';
  const baseClass = 'inline-flex items-center rounded-full font-medium';

  return (
    <span
      class={`${baseClass} ${badgeClass[variant]} ${badgeSizeClass[size]} ${local.class ?? ''}`}
    >
      {local.children}
    </span>
  );
};

export default Badge;
