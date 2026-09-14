import { type Component, splitProps, createMemo, Show, For } from 'solid-js';
import type { JSX } from 'solid-js';
import type { DataTableProps, DataTableColumn } from './types';

export function createDataTableColumns<T>(
  columns: DataTableColumn<T>[]
): DataTableColumn<T>[] {
  return columns;
}

interface TableProps {
  headers: Array<{ label: string; class?: string }>;
  children: JSX.Element;
  class?: string;
}

export const Table: Component<TableProps> = (props) => {
  const [local] = splitProps(props, ['headers', 'children', 'class']);

  return (
    <div class="w-full overflow-x-auto rounded-lg border border-border bg-background">
      <table class={`w-full border-collapse text-left text-sm ${local.class ?? ''}`}>
        <thead class="bg-muted/50">
          <tr>
            <For each={local.headers}>
              {(header) => (
                <th class={`px-4 py-2.5 font-medium text-muted-foreground ${header.class ?? ''}`}>
                  {header.label}
                </th>
              )}
            </For>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">{local.children}</tbody>
      </table>
    </div>
  );
};

export const DataTable = <T extends Record<string, unknown>>(
  props: DataTableProps<T>
) => {
  const [local, others] = splitProps(props, [
    'data',
    'columns',
    'isLoading',
    'onRowClick',
    'rowKey',
    'emptyMessage',
    'striped',
    'hoverable',
    'class',
  ]);

  const resolvedData = createMemo(() =>
    typeof local.data === 'function' ? local.data() : local.data
  );
  const resolvedLoading = createMemo(() =>
    typeof local.isLoading === 'function' ? local.isLoading() : !!local.isLoading
  );

  const getCellValue = (row: T, column: DataTableColumn<T>): unknown => {
    if (column.render) return column.render(row);
    const key = column.key as string;
    return key.split('.').reduce<unknown>((obj, k) => {
      if (obj && typeof obj === 'object' && k in obj) {
        return (obj as Record<string, unknown>)[k];
      }
      return undefined;
    }, row);
  };

  return (
    <div class={`w-full overflow-x-auto rounded-lg border border-border bg-background ${local.class ?? ''}`} {...others}>
      <table class="w-full border-collapse text-sm">
        <thead class="bg-muted/50">
          <tr>
            <For each={local.columns}>
              {(column) => (
                <th
                  class={`px-4 py-2.5 text-left font-medium text-muted-foreground ${column.headerClass ?? ''}`}
                >
                  {column.label}
                </th>
              )}
            </For>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <Show when={resolvedLoading()} fallback={null}>
            <tr>
              <td colSpan={local.columns.length} class="py-8">
                <div class="flex items-center justify-center">
                  <svg
                    class="animate-spin h-6 w-6 text-muted-foreground"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.125 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              </td>
            </tr>
          </Show>
          <Show when={!resolvedLoading()}>
            <Show
              when={resolvedData().length === 0}
              fallback={
                <For each={resolvedData()}>
                  {(row) => (
                    <tr
                      class={`
                        ${local.striped ? 'odd:bg-background even:bg-muted/20' : ''}
                        ${local.hoverable ? 'hover:bg-muted/50 cursor-pointer transition-colors' : ''}
                      `}
                      onClick={() => local.onRowClick?.(row)}
                    >
                      <For each={local.columns}>
                        {(column) => (
                          <td class={`px-4 py-2.5 align-middle ${column.cellClass ?? ''}`}>
                            {getCellValue(row, column) as JSX.Element ?? '-'}
                          </td>
                        )}
                      </For>
                    </tr>
                  )}
                </For>
              }
            >
              <tr>
                <td colSpan={local.columns.length} class="py-8">
                  <div class="flex items-center justify-center text-center">
                    <span class="text-sm text-muted-foreground">
                      {local.emptyMessage ?? 'Tidak ada data'}
                    </span>
                  </div>
                </td>
              </tr>
            </Show>
          </Show>
        </tbody>
      </table>
    </div>
  );
};

export default Table;
