import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import { DEFAULT_TOAST_POSITION, TOAST_DURATION_MS, type ToastPosition } from '@/lib/constants';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export const [toastStack, setToastStack] = createStore<Toast[]>([]);
export const [toastPosition, setToastPosition] = createSignal<ToastPosition>(DEFAULT_TOAST_POSITION);

export function addToast(
  toast: Omit<Toast, 'id'> & { duration?: number }
): string {
  const id = crypto.randomUUID();
  const duration = toast.duration ?? TOAST_DURATION_MS;
  const entry: Toast = { ...toast, duration, id };
  setToastStack((prev) => [...prev, entry]);
  setTimeout(() => {
    setToastStack((prev) => prev.filter((t) => t.id !== id));
  }, duration);
  return id;
}

export function removeToast(id: string): void {
  setToastStack((prev) => prev.filter((t) => t.id !== id));
}

export const [isSidebarOpen, setSidebarOpen] = createSignal(true);
export const [isMobileSidebarOpen, setMobileSidebarOpen] = createSignal(false);
export const [activeCashShiftId, setActiveCashShiftId] = createSignal<string | null>(null);
export const [globalLoading, setGlobalLoading] = createSignal(false);
