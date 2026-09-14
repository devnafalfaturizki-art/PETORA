import { type Component, splitProps } from 'solid-js';
import type { InputProps } from './types';

export const Input: Component<InputProps> = (props) => {
  const [local, others] = splitProps(props, [
    'type',
    'placeholder',
    'value',
    'onInput',
    'onChange',
    'onKeyDown',
    'disabled',
    'readonly',
    'required',
    'autocomplete',
    'min',
    'max',
    'step',
    'rows',
    'error',
    'label',
    'helperText',
    'class',
    'id',
  ]);

  const hasError = !!local.error;

  const baseClass =
    'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

  const inputClass = hasError
    ? `${baseClass} border-destructive focus-visible:ring-destructive`
    : baseClass;

  return (
    <div class={'flex flex-col gap-1.5'.concat(local.class ? ` ${local.class}` : '')}>
      {local.label ? (
        <label class="text-sm font-medium text-foreground" for={local.id}>
          {local.label}
          {local.required && <span class="text-destructive">*</span>}
        </label>
      ) : null}
      {local.rows ? (
        <textarea
          id={local.id}
          class={inputClass}
          placeholder={local.placeholder}
          value={local.value}
          onInput={local.onInput}
          onChange={local.onChange}
          onKeyDown={local.onKeyDown}
          disabled={local.disabled}
          readonly={local.readonly}
          required={local.required}
          autocomplete={local.autocomplete}
          rows={local.rows}
          {...others}
        />
      ) : (
        <input
          id={local.id}
          class={inputClass}
          type={local.type ?? 'text'}
          placeholder={local.placeholder}
          value={local.value}
          onInput={local.onInput}
          onChange={local.onChange}
          onKeyDown={local.onKeyDown}
          disabled={local.disabled}
          readonly={local.readonly}
          required={local.required}
          autocomplete={local.autocomplete}
          min={local.min}
          max={local.max}
          step={local.step}
          {...others}
        />
      )}
      {hasError ? (
        <span class="text-xs text-destructive">{local.error}</span>
      ) : null}
      {local.helperText && !hasError ? (
        <span class="text-xs text-muted-foreground">{local.helperText}</span>
      ) : null}
    </div>
  );
};

export default Input;
