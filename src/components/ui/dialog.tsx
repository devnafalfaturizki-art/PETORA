import { type Component, splitProps } from "solid-js";
import { Dialog } from "@kobalte/core";
import type { ModalProps } from "./types";
import { X } from "lucide-solid";

export const Modal: Component<ModalProps> = (props) => {
  const [local] = splitProps(props, [
    "open",
    "onOpenChange",
    "title",
    "description",
    "children",
    "size",
    "closeOnEsc",
    "showCloseButton",
    "class",
  ]);

  const sizeValue = local.size ?? "md";
  const openValue =
    typeof local.open === "function" ? local.open() : local.open;

  const sizeClasses: Record<NonNullable<ModalProps["size"]>, string> = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-7xl",
  };

  return (
    <Dialog.Root open={openValue} onOpenChange={local.onOpenChange}>
      <Dialog.Trigger as="span">
        <span />
      </Dialog.Trigger>
      <Dialog.Overlay class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
      <Dialog.Content
        class={`fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg overflow-y-auto ${sizeClasses[sizeValue]} ${local.class ?? ""}`}
      >
        <div class="flex items-start justify-between">
          <div>
            <Dialog.Title class="text-lg font-semibold text-foreground">
              {local.title}
            </Dialog.Title>
            {local.description ? (
              <Dialog.Description class="text-sm text-muted-foreground mt-1">
                {local.description}
              </Dialog.Description>
            ) : null}
          </div>
          {local.showCloseButton !== false ? (
            <Dialog.CloseButton
              as="span"
              class="rounded p-1 text-muted-foreground hover:text-foreground focus:outline-none"
            >
              <X class="h-4 w-4" />
            </Dialog.CloseButton>
          ) : null}
        </div>
        <div class="py-2">{local.children}</div>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default Modal;
