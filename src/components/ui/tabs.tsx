import { type Component, splitProps } from "solid-js";
import { Tabs } from "@kobalte/core";
import type { TabsProps } from "./types";

export const TabsContainer: Component<TabsProps> = (props) => {
  const [local, others] = splitProps(props, [
    "tabs",
    "value",
    "onValueChange",
    "orientation",
    "class",
    "id",
  ]);

  const orientation = local.orientation ?? "horizontal";
  const value = typeof local.value === "function" ? local.value() : local.value;

  return (
    <Tabs.Root
      {...(local.id ? { id: local.id } : {})}
      value={value}
      onChange={local.onValueChange}
      orientation={orientation}
      class={`flex ${orientation === "vertical" ? "flex-row" : "flex-col"} ${local.class ?? ""}`}
      {...others}
    >
      <Tabs.List
        class={`
          ${orientation === "vertical" ? "flex-col" : "flex-row"}
          flex items-center gap-1 rounded-lg bg-muted p-1
        `}
      >
        {local.tabs.map((tab) => (
          <Tabs.Trigger
            value={tab.value}
            class="data-[selected]:bg-background data-[selected]:text-foreground data-[selected]:shadow-sm inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined ? (
              <span class="ml-1.5 rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-xs">
                {tab.count}
              </span>
            ) : null}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {local.tabs.map((tab) => (
        <Tabs.Content value={tab.value} class="mt-0 flex-1" />
      ))}
    </Tabs.Root>
  );
};

export default TabsContainer;
