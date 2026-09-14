import type { Component, JSX } from 'solid-js';

export type Variant = 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
export type Size = 'sm' | 'md' | 'lg' | 'icon';

export interface BaseComponentProps {
  class?: string;
  classList?: Record<string, boolean>;
  id?: string;
  onClick?: (e: MouseEvent) => void;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  children: JSX.Element;
}

export interface InputProps extends BaseComponentProps {
  type?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onInput?: (e: InputEvent) => void;
  onChange?: (e: Event) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  autocomplete?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  rows?: number;
  error?: string;
  label?: string;
  helperText?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  prefix?: JSX.Element;
}

export interface SelectProps extends BaseComponentProps {
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  onInput?: (e: Event) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  helperText?: string;
  clearable?: boolean;
}

export interface BadgeProps extends BaseComponentProps {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info' | 'muted';
  size?: 'sm' | 'md';
  children: JSX.Element;
}

export interface ModalProps extends BaseComponentProps {
  open: () => boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: JSX.Element;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
}

export interface CardProps extends BaseComponentProps {
  title?: string;
  description?: string;
  children: JSX.Element;
  footer?: JSX.Element;
  hoverable?: boolean;
}

export interface DataTableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  headerClass?: string;
  cellClass?: string;
  render?: (row: T) => JSX.Element;
  className?: (row: T) => string;
}

export interface DataTableProps<T> extends BaseComponentProps {
  data: T[] | (() => T[]);
  columns: DataTableColumn<T>[];
  isLoading?: boolean | (() => boolean);
  onRowClick?: (row: T) => void;
  rowKey?: keyof T | ((row: T) => string);
  emptyMessage?: string;
  striped?: boolean;
  hoverable?: boolean;
}

export interface StatusBadgeProps extends BaseComponentProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'muted';
}

export interface LoadingSpinnerProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export interface EmptyStateProps extends BaseComponentProps {
  title?: string;
  description?: string;
  icon?: JSX.Element;
  actions?: JSX.Element;
}

export interface ConfirmDialogProps extends BaseComponentProps {
  open: () => boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export interface SearchInputProps extends BaseComponentProps {
  placeholder?: string;
  value: () => string;
  onSearch: (value: string) => void;
  debounceMs?: number;
  disabled?: boolean;
}

export interface TabsProps extends BaseComponentProps {
  tabs: Array<{ value: string; label: string; icon?: JSX.Element; count?: number }>;
  value: () => string;
  onValueChange: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

export interface ToastContainerProps extends BaseComponentProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export type { Component, JSX };
