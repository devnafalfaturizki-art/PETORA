import {
  createQuery,
  createMutation,
  useQueryClient,
} from "@tanstack/solid-query";
import { invoiceService } from "@/services/invoice.service";
import { supabase } from "@/lib/supabase";
import { QueryKeys } from "@/lib/query-keys";
import type {
  Payment,
  CashShift,
  CreateInvoiceInput,
  RecordPaymentInput,
  CancelInvoiceInput,
  UUID,
} from "@/types";

export function useInvoices(params?: {
  status?: "UNPAID" | "PARTIAL_PAYMENT" | "PAID" | "CANCELLED";
  invoice_type?: "POS" | "CLINICAL" | "PET_HOTEL" | "GROOMING" | "MIXED";
  date?: string;
  customer_id?: UUID;
  limit?: number;
  offset?: number;
}) {
  return createQuery(() => ({
    queryKey: [...QueryKeys.invoices, params],
    queryFn: () => invoiceService.list(params),
  }));
}

export function useInvoice(id: UUID) {
  return createQuery(() => ({
    queryKey: QueryKeys.invoice(id),
    queryFn: () => invoiceService.getById(id),
    enabled: !!id,
  }));
}

export function useInvoicePayments(invoiceId: UUID) {
  return createQuery(() => ({
    queryKey: QueryKeys.payments(invoiceId),
    queryFn: () => invoiceService.getPayments(invoiceId),
    enabled: !!invoiceId,
  }));
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (input: CreateInvoiceInput) => invoiceService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.invoices });
    },
  }));
}

export function useRecordPayment() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (input: RecordPaymentInput) =>
      invoiceService.recordPayment(input),
    onSuccess: (payment: Payment) => {
      queryClient.invalidateQueries({
        queryKey: QueryKeys.invoice(payment.invoice_id),
      });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.invoiceItems(payment.invoice_id),
      });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.payments(payment.invoice_id),
      });
      queryClient.invalidateQueries({ queryKey: QueryKeys.invoices });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.dailySales(
          new Date().toISOString().split("T")[0] as string,
        ),
      });
    },
  }));
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (input: CancelInvoiceInput) => invoiceService.cancel(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.invoices });
    },
  }));
}

export function useCashShifts() {
  return createQuery(() => ({
    queryKey: QueryKeys.cashShifts,
    queryFn: () => invoiceService.list({}),
  }));
}

export function useActiveCashShift() {
  return createQuery(() => ({
    queryKey: QueryKeys.activeCashShift,
    queryFn: async (): Promise<CashShift | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("cash_shifts")
        .select("*")
        .eq("kasir_id", user.id)
        .is("close_time", null)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as CashShift | null;
    },
  }));
}

export function useOpenCashShift() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (openingCash: number) =>
      invoiceService.openCashShift(openingCash),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.cashShifts });
      queryClient.invalidateQueries({ queryKey: QueryKeys.activeCashShift });
    },
  }));
}

export function useCloseCashShift() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: ({
      shiftId,
      closingCash,
    }: {
      shiftId: UUID;
      closingCash: number;
    }) => invoiceService.closeCashShift(shiftId, closingCash),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.cashShifts });
      queryClient.invalidateQueries({ queryKey: QueryKeys.activeCashShift });
      queryClient.invalidateQueries({
        queryKey: QueryKeys.dailySales(
          new Date().toISOString().split("T")[0] as string,
        ),
      });
    },
  }));
}
