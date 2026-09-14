import { type Component, splitProps } from 'solid-js';
import type { ButtonProps, Variant, Size } from './types';

const buttonBaseClass =
  'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

const buttonVariantClass: Record<Variant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border border-border bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
};

const buttonSizeClass: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-9 w-9',
};

export const Button: Component<ButtonProps> = (props) => {
  const [local, others] = splitProps(props, [
    'variant',
    'size',
    'disabled',
    'loading',
    'type',
    'class',
    'onClick',
    'children',
  ]);

  const variant = local.variant ?? 'default';
  const size = local.size ?? 'md';
  const baseClass = `${buttonBaseClass} ${buttonVariantClass[variant]} ${buttonSizeClass[size]} ${local.class ?? ''}`;

  return (
    <button
      type={local.type ?? 'button'}
      class={baseClass.trim()}
      disabled={local.disabled || local.loading}
      onClick={local.onClick}
      {...others}
    >
      {local.loading ? (
        <span class="absolute inset-0 flex items-center justify-center">
          <svg
            class="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-label="loading"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.125 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      ) : null}
      <span class={local.loading ? 'invisible' : ''}>{local.children}</span>
    </button>
  );
};

export default Button;
