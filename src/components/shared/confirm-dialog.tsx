import { type Component, splitProps } from "solid-js";
import { Dialog } from "@kobalte/core";
import type { ConfirmDialogProps } from "@/components/ui/types";
import { Button } from "@/components/ui/button";

export const ConfirmDialog: Component<ConfirmDialogProps> = (props) => {
  const [local] = splitProps(props, [
    "open",
    "onOpenChange",
    "title",
    "description",
    "confirmLabel",
    "cancelLabel",
    "variant",
    "onConfirm",
    "isLoading",
    "class",
  ]);

  const variant = local.variant ?? "default";
  const isLoading = !!local.isLoading;
  const open = local.open();

  const handleConfirm = () => {
    void local.onConfirm();
  };

  return (
    <Dialog.Root open={open} onOpenChange={local.onOpenChange}>
      <Dialog.Trigger as="span">
        <span />
      </Dialog.Trigger>
      <Dialog.Overlay class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
      <Dialog.Content
        class={`fixed top-1/2 left-1/2 z-50 grid w-full max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg ${local.class ?? ""}`}
      >
        <Dialog.Title class="text-lg font-semibold text-foreground">
          {local.title}
        </Dialog.Title>
        {local.description ? (
          <Dialog.Description class="text-sm text-muted-foreground">
            {local.description}
          </Dialog.Description>
        ) : null}
        <div class="flex justify-end gap-2 pt-2">
          <Dialog.CloseButton as="span">
            <Button variant="outline" size="sm" disabled={isLoading}>
              {local.cancelLabel ?? "Batal"}
            </Button>
          </Dialog.CloseButton>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            size="sm"
            loading={isLoading}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {local.confirmLabel ?? "Konfirmasi"}
          </Button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default ConfirmDialog;
