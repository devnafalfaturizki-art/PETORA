import { type Component, splitProps } from 'solid-js';
import type { EmptyStateProps } from '@/components/ui/types';

export const EmptyState: Component<EmptyStateProps> = (props) => {
  const [local] = splitProps(props, ['title', 'description', 'icon', 'actions', 'class']);

  return (
    <div
      class={'flex flex-col items-center justify-center py-12 px-4 text-center'.concat(local.class ? ` ${local.class}` : '')}
    >
      {local.icon ? (
        <div class="mb-4 text-muted-foreground">{local.icon}</div>
      ) : (
        <svg
          class="mb-4 h-12 w-12 text-muted-foreground/50"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 13h6m-3 3l3-3m0 0l-3-3m3 3H9"
          />
        </svg>
      )}
      <h3 class="mb-1 font-medium text-foreground">
        {local.title ?? 'Tidak ada data'}
      </h3>
      {local.description ? (
        <p class="text-sm text-muted-foreground mb-4 max-w-sm">
          {local.description}
        </p>
      ) : null}
      {local.actions}
    </div>
  );
};

export default EmptyState;
