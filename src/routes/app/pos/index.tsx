import { type Component, createSignal, Show, For, createMemo } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useProducts } from "@/hooks/use-products";
import {
  useCreateInvoice,
  useRecordPayment,
  useActiveCashShift,
  useOpenCashShift,
} from "@/hooks/use-invoices";
import { useCustomers } from "@/hooks/use-customers";
import type { Product, UUID } from "@/types";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { DataTable, createDataTableColumns } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@kobalte/core";
import {
  Search,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  Banknote,
  QrCode,
  Receipt,
} from "lucide-solid";
import { addToast } from "@/stores/ui.store";
import { AppError } from "@/lib/errors";

function format(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

interface CartItem {
  product_id: UUID;
  product: Product;
  quantity: number;
}

export const PosRoute: Component = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = createSignal("");
  const [cart, setCart] = createSignal<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = createSignal<UUID | null>(
    null,
  );
  const [showCustomerSelect, setShowCustomerSelect] = createSignal(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = createSignal(false);
  const [paymentMethod, setPaymentMethod] = createSignal<
    "CASH" | "QRIS" | "TRANSFER" | "E_WALLET" | "CREDIT_CARD"
  >("CASH");
  const [cashReceived, setCashReceived] = createSignal("");

  const productsResult = useProducts({ search: searchTerm() });
  const customersResult = useCustomers({ is_active: true });
  const activeCashShiftResult = useActiveCashShift();
  const createInvoiceMutation = useCreateInvoice();
  const recordPaymentMutation = useRecordPayment();
  const openCashShiftMutation = useOpenCashShift();

  const filteredProducts = createMemo(() => {
    const all = productsResult.data?.data ?? [];
    if (!searchTerm()) return all;
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm().toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm().toLowerCase()) ||
        (p.barcode?.toLowerCase().includes(searchTerm().toLowerCase()) ??
          false),
    );
  });

  const cartTotal = createMemo(() => {
    return cart().reduce(
      (sum, item) => sum + item.product.selling_price * item.quantity,
      0,
    );
  });

  const cartItemCount = createMemo(() => {
    return cart().reduce((sum, item) => sum + item.quantity, 0);
  });

  const changeAmount = createMemo(() => {
    const total = cartTotal();
    const received = Number(cashReceived()) || 0;
    return received - total;
  });

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product_id: product.id, product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: UUID, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === productId);
      if (!existing) return prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((item) => item.product_id !== productId);
      }
      return prev.map((item) =>
        item.product_id === productId ? { ...item, quantity: newQty } : item,
      );
    });
  };

  const handleRemoveItem = (productId: UUID) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomerId(null);
    setCashReceived("");
    setPaymentMethod("CASH");
  };

  const handleCheckout = async () => {
    if (cart().length === 0) {
      addToast({
        type: "error",
        title: "Keranjang Kosong",
        message: "Tambahkan produk ke keranjang",
      });
      return;
    }

    const amount = cartTotal();

    try {
      const checkoutInput = {
        invoice_type: "POS" as const,
        items: cart().map((item) => ({
          item_type: "product",
          product_id: item.product_id,
          description: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.selling_price,
        })),
        notes: "Penjualan via POS",
        ...(selectedCustomerId() ? { customer_id: selectedCustomerId()! } : {}),
      };

      let paymentMethodParam = paymentMethod();
      let amountParam = amount;

      if (paymentMethod() === "CASH") {
        const received = Number(cashReceived());
        if (received < amount) {
          addToast({
            type: "error",
            title: "Uang Kurang",
            message: `Uang tunai harus >= Rp${format(amount)}`,
          });
          return;
        }
        amountParam = amount;
      }

      const invoice = await createInvoiceMutation.mutateAsync(checkoutInput);

      if (paymentMethod() !== "CASH" && amount > 0) {
        await recordPaymentMutation.mutateAsync({
          invoice_id: invoice.id,
          payment_method: paymentMethodParam as
            "CASH" | "QRIS" | "TRANSFER" | "E_WALLET" | "CREDIT_CARD" | "MIXED",
          amount: amountParam,
        });
      } else if (
        paymentMethod() === "CASH" &&
        Number(cashReceived()) >= amount
      ) {
        await recordPaymentMutation.mutateAsync({
          invoice_id: invoice.id,
          payment_method: "CASH",
          amount: amount,
        });
      }

      addToast({
        type: "success",
        title: "Berhasil",
        message: `Pembayaran berhasil! Invoice #${invoice.invoice_number}`,
      });
      clearCart();
      setShowCheckoutDialog(false);
      void navigate("/app/dashboard");
    } catch (err) {
      if (err instanceof AppError) {
        addToast({ type: "error", title: "Error", message: err.message });
      } else {
        addToast({
          type: "error",
          title: "Error",
          message: "Terjadi kesalahan",
        });
      }
    }
  };

  const columns = createDataTableColumns<CartItem>([
    {
      key: "product.name",
      label: "Produk",
      render: (row) => (
        <div class="flex items-center gap-3">
          <div class="font-medium text-foreground">{row.product.name}</div>
          <span class="text-xs text-muted-foreground">
            SKU: {row.product.sku}
          </span>
        </div>
      ),
    },
    {
      key: "product.selling_price",
      label: "Harga",
      render: (row) => (
        <span class="text-sm">Rp{format(row.product.selling_price)}</span>
      ),
    },
    {
      key: "quantity",
      label: "Qty",
      render: (row) => (
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="rounded p-0.5 text-muted-foreground hover:text-foreground"
            onClick={() => handleUpdateQuantity(row.product_id, -1)}
            aria-label="Kurangi"
          >
            <Minus class="h-3 w-3" />
          </button>
          <span class="text-sm font-medium w-6 text-center">
            {row.quantity}
          </span>
          <button
            type="button"
            class="rounded p-0.5 text-muted-foreground hover:text-foreground"
            onClick={() => handleAddToCart(row.product)}
            aria-label="Tambah"
          >
            <Plus class="h-3 w-3" />
          </button>
        </div>
      ),
    },
    {
      key: "product.selling_price * quantity",
      label: "Subtotal",
      render: (row) => (
        <span class="text-sm">
          Rp{format(row.product.selling_price * row.quantity)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <button
          type="button"
          class="rounded p-1 text-muted-foreground hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring"
          onClick={() => handleRemoveItem(row.product_id)}
          aria-label="Hapus"
        >
          <Trash2 class="h-3 w-3" />
        </button>
      ),
    },
  ]);

  return (
    <div class="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-foreground">POS</h1>
        <Show when={cartItemCount() > 0}>
          <Button onClick={() => setShowCheckoutDialog(true)}>
            <ShoppingCart class="h-4 w-4 mr-2" />
            Checkout ({cartItemCount()})
          </Button>
        </Show>
      </div>

      <div class="flex gap-4">
        <div class="flex-1">
          <SearchInput
            placeholder="Cari produk (nama, SKU, barcode)..."
            value={searchTerm}
            onSearch={setSearchTerm}
          />
        </div>
        <Button variant="outline" onClick={() => setShowCustomerSelect(true)}>
          {selectedCustomerId() ? "Ganti Customer" : "Pilih Customer"}
        </Button>
        <Show when={activeCashShiftResult.data === null}>
          <Button
            variant="outline"
            onClick={() => void openCashShiftMutation.mutateAsync(0)}
          >
            Buka Shift Kas
          </Button>
        </Show>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <For each={filteredProducts()}>
          {(product) => (
            <button
              type="button"
              class="flex flex-col items-start rounded-lg border border-border bg-background p-3 text-left transition-all hover:border-primary hover:shadow-md"
              onClick={() => handleAddToCart(product)}
            >
              <div class="flex-1">
                <h3 class="font-medium text-foreground">{product.name}</h3>
                <p class="text-xs text-muted-foreground">SKU: {product.sku}</p>
                <div class="mt-2 flex items-center justify-between">
                  <span class="text-sm font-medium text-foreground">
                    Rp{format(product.selling_price)}
                  </span>
                  <Show when={product.stock_quantity < 5} fallback={null}>
                    <span class="text-xs text-destructive">
                      Stok: {product.stock_quantity}
                    </span>
                  </Show>
                </div>
              </div>
            </button>
          )}
        </For>
      </div>

      <Show
        when={cartItemCount() > 0}
        fallback={
          <Show
            when={filteredProducts().length === 0 && !productsResult.isLoading}
            fallback={null}
          >
            <EmptyState
              title="Produk tidak ditemukan"
              description="Coba kata kunci lain"
              icon={<Search class="h-12 w-12" />}
            />
          </Show>
        }
      >
        <div class="border-t border-border pt-4">
          <DataTable<CartItem>
            data={cart()}
            columns={columns}
            isLoading={false}
            striped
          />
          <div class="flex justify-end pt-4">
            <div class="text-right">
              <p class="text-sm text-muted-foreground">Total</p>
              <p class="text-2xl font-bold text-foreground">
                Rp{format(cartTotal())}
              </p>
            </div>
          </div>
        </div>
      </Show>

      <Dialog.Root
        open={showCustomerSelect()}
        onOpenChange={setShowCustomerSelect}
      >
        <Dialog.Trigger as="span">
          <span />
        </Dialog.Trigger>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content class="fixed top-1/2 left-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg">
          <Dialog.Title class="text-lg font-semibold text-foreground">
            Pilih Customer
          </Dialog.Title>
          <Dialog.Description class="text-sm text-muted-foreground">
            Pilih customer untuk transaksi ini (opsional)
          </Dialog.Description>
          <div class="max-h-60 overflow-y-auto">
            <For each={customersResult.data?.data ?? []}>
              {(customer) => (
                <button
                  type="button"
                  class="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-accent"
                  onClick={() => {
                    setSelectedCustomerId(customer.id);
                    setShowCustomerSelect(false);
                  }}
                >
                  <div class="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <span class="font-medium">{customer.name}</span>
                    <p class="text-xs text-muted-foreground">
                      {customer.phone ?? "-"}
                    </p>
                  </div>
                </button>
              )}
            </For>
          </div>
          <div class="flex justify-end pt-4">
            <Dialog.CloseButton as="span">
              <Button variant="outline" size="sm">
                Tutup
              </Button>
            </Dialog.CloseButton>
          </div>
        </Dialog.Content>
      </Dialog.Root>

      <Dialog.Root
        open={showCheckoutDialog()}
        onOpenChange={setShowCheckoutDialog}
      >
        <Dialog.Trigger as="span">
          <span />
        </Dialog.Trigger>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content class="fixed top-1/2 left-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg">
          <Dialog.Title class="text-lg font-semibold text-foreground">
            Checkout
          </Dialog.Title>
          <div class="space-y-4">
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">Total</span>
              <span class="text-xl font-bold text-foreground">
                Rp{format(cartTotal())}
              </span>
            </div>

            <div>
              <label class="text-sm font-medium text-foreground">
                Metode Pembayaran
              </label>
              <div class="mt-2 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  class={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${
                    paymentMethod() === "CASH"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-accent"
                  }`}
                  onClick={() => setPaymentMethod("CASH")}
                >
                  <Banknote class="h-4 w-4" />
                  Tunai
                </button>
                <button
                  type="button"
                  class={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${
                    paymentMethod() === "QRIS"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-accent"
                  }`}
                  onClick={() => setPaymentMethod("QRIS")}
                >
                  <QrCode class="h-4 w-4" />
                  QRIS
                </button>
                <button
                  type="button"
                  class={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${
                    paymentMethod() === "TRANSFER"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-accent"
                  }`}
                  onClick={() => setPaymentMethod("TRANSFER")}
                >
                  <CreditCard class="h-4 w-4" />
                  Transfer
                </button>
              </div>
            </div>

            <Show when={paymentMethod() === "CASH"}>
              <Input
                label="Uang Diterima"
                type="number"
                placeholder="0"
                value={cashReceived()}
                onInput={(e) =>
                  setCashReceived((e.target as HTMLInputElement).value)
                }
              />
              <Show
                when={
                  Number(cashReceived()) >= cartTotal() &&
                  Number(cashReceived()) > 0
                }
              >
                <div class="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
                  Kembalian: Rp{format(changeAmount())}
                </div>
              </Show>
              <Show
                when={Number(cashReceived()) < cartTotal() && cashReceived()}
                fallback={null}
              >
                <div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  Uang tidak mencukupi
                </div>
              </Show>
            </Show>
          </div>

          <div class="flex justify-end gap-2 pt-4">
            <Dialog.CloseButton as="span">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCheckoutDialog(false)}
              >
                Batal
              </Button>
            </Dialog.CloseButton>
            <Button
              size="sm"
              loading={
                createInvoiceMutation.isPending ||
                recordPaymentMutation.isPending
              }
              disabled={
                createInvoiceMutation.isPending ||
                recordPaymentMutation.isPending ||
                (paymentMethod() === "CASH" &&
                  (Number(cashReceived()) < cartTotal() || !cashReceived()))
              }
              onClick={handleCheckout}
            >
              <Receipt class="h-4 w-4 mr-2" />
              Proses Pembayaran
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
};

export default PosRoute;
