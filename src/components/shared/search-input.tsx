import { type Component, splitProps, createSignal } from 'solid-js';
import { Show } from 'solid-js';
import type { SearchInputProps } from '@/components/ui/types';
import { Search, X } from 'lucide-solid';

export const SearchInput: Component<SearchInputProps> = (props) => {
  const [local] = splitProps(props, [
    'placeholder',
    'value',
    'onSearch',
    'debounceMs',
    'disabled',
    'class',
  ]);

  const [internal, setInternal] = createSignal(local.value());
  const debounceMs = local.debounceMs ?? 300;
  let timeoutId: ReturnType<typeof setTimeout>;

  const handleInput = (e: InputEvent) => {
    const target = e.target as HTMLInputElement;
    const value = target.value;
    setInternal(value);
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      local.onSearch(value);
    }, debounceMs);
  };

  const clear = () => {
    setInternal('');
    clearTimeout(timeoutId);
    local.onSearch('');
  };

  return (
    <div class={`relative ${local.class ?? ''}`}>
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="search"
        class="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        placeholder={local.placeholder ?? 'Cari...'}
        value={internal()}
        onInput={handleInput}
        disabled={local.disabled}
      />
      <Show when={internal()}>
        <button
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
          onClick={clear}
          aria-label="Clear search"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </Show>
    </div>
  );
};

export default SearchInput;
