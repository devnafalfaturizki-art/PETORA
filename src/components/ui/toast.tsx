import { type Component, splitProps } from 'solid-js';
import { For } from 'solid-js';
import { toastStack, removeToast, toastPosition } from '@/stores/ui.store';
import type { ToastContainerProps } from './types';
import { X } from 'lucide-solid';

const toastVariantClass: Record<string, string> = {
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200',
  warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-200',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200',
};

interface ToastElementProps {
  toast: {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
  };
}

const ToastElement: Component<ToastElementProps> = (props) => {
  const handleRemove = () => {
    removeToast(props.toast.id);
  };

  return (
    <div class={`relative flex items-start gap-3 rounded-lg border p-4 text-sm shadow-lg ${toastVariantClass[props.toast.type]}`}>
      <div class="flex-1">
        <span class="block font-medium">{props.toast.title}</span>
        {props.toast.message ? <span class="mt-0.5 block">{props.toast.message}</span> : null}
      </div>
      <button
        type="button"
        class="rounded p-1 text-current opacity-60 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
        onClick={handleRemove}
        aria-label="Close toast"
      >
        <X class="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export const ToastContainer: Component<ToastContainerProps> = (props) => {
  const [local, others] = splitProps(props, ['position', 'class']);
  const positionValue = local.position ?? toastPosition();
  const toasts = toastStack;

  const positionClass = (() => {
    switch (positionValue) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  })();

  return (
    <div
      class={`fixed z-50 flex flex-col gap-2 w-80 ${positionClass} ${local.class ?? ''}`}
      {...others}
    >
      <For each={toasts}>
        {(toast) => <ToastElement toast={toast} />}
      </For>
    </div>
  );
};

export default ToastContainer;
