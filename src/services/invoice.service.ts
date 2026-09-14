import { AppError, ErrorCode } from "@/lib/errors";
import { BaseService } from "@/services/base.service";
import { createInvoiceSchema, recordPaymentSchema } from "@/schemas";
import type {
  Invoice,
  InvoiceItem,
  Payment,
  CashShift,
  CreateInvoiceInput,
  RecordPaymentInput,
  CancelInvoiceInput,
  PaginatedResponse,
  UUID,
} from "@/types";
import { PAGE_LIMIT_DEFAULT, PAGE_LIMIT_OPTIONS } from "@/lib/constants";

class InvoiceService extends BaseService {
  async create(input: CreateInvoiceInput): Promise<Invoice> {
    const validated = createInvoiceSchema.parse(input);

    const { data: result, error } = await this.supabase.rpc(
      "fn_create_invoice",
      {
        p_invoice_type: validated.invoice_type,
        p_customer_id: validated.customer_id ?? null,
        p_items: validated.items.map((item) => ({
          item_type: item.item_type,
          product_id: item.product_id ?? null,
          procedure_id: item.procedure_id ?? null,
          pet_hotel_booking_id: item.pet_hotel_booking_id ?? null,
          grooming_booking_id: item.grooming_booking_id ?? null,
          description: item.description,
          quantity: item.quantity ?? 1,
          unit_price: item.unit_price,
        })),
        p_discount_amount: validated.discount_amount ?? 0,
        p_tax_amount: validated.tax_amount ?? 0,
        p_promotion_id: validated.promotion_id ?? null,
        p_loyalty_points_to_redeem: validated.loyalty_points_to_redeem ?? 0,
        p_notes: validated.notes ?? null,
      },
    );

    if (error) {
      throw this.handleError(error, "Failed to create invoice");
    }

    const invoice = result as unknown as Invoice;

    await this.audit({
      action: "CREATE_INVOICE",
      entity_type: "invoices",
      entity_id: (invoice as { id: string }).id,
      new_values: invoice as unknown as Record<string, unknown>,
    });

    return invoice;
  }

  async getById(id: UUID): Promise<Invoice & { items: InvoiceItem[] }> {
    const { data: invoice, error: invoiceError } = await this.supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (invoiceError) {
      if (invoiceError.code === "PGRST116") {
        throw new AppError(ErrorCode.NOT_FOUND, "Invoice tidak ditemukan");
      }
      throw this.handleError(invoiceError, "Failed to fetch invoice");
    }

    const { data: items, error: itemsError } = await this.supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id);

    if (itemsError) {
      throw this.handleError(itemsError, "Failed to fetch invoice items");
    }

    return {
      ...(invoice as Invoice),
      items: (items ?? []) as InvoiceItem[],
    };
  }

  async getPayments(invoiceId: UUID): Promise<Payment[]> {
    const { data, error } = await this.supabase
      .from("payments")
      .select("*")
      .eq("invoice_id", invoiceId);

    if (error) throw this.handleError(error, "Failed to fetch payments");
    return (data ?? []) as Payment[];
  }

  async recordPayment(input: RecordPaymentInput): Promise<Payment> {
    const validated = recordPaymentSchema.parse(input);

    const { data: invoice, error: invoiceError } = await this.supabase
      .from("invoices")
      .select("total_amount, paid_amount, status")
      .eq("id", validated.invoice_id)
      .single();

    if (invoiceError) {
      if (invoiceError.code === "PGRST116") {
        throw new AppError(ErrorCode.NOT_FOUND, "Invoice tidak ditemukan");
      }
      throw this.handleError(invoiceError, "Failed to fetch invoice");
    }

    const inv = invoice as {
      total_amount: number;
      paid_amount: number;
      status: string;
    };

    if (inv.status === "CANCELLED") {
      throw new AppError(
        ErrorCode.INVOICE_CANCELLED,
        "Invoice sudah dibatalkan",
      );
    }

    if (inv.status === "PAID") {
      throw new AppError(ErrorCode.INVOICE_ALREADY_PAID, "Invoice sudah lunas");
    }

    const remaining = inv.total_amount - inv.paid_amount;
    if (validated.amount > remaining) {
      throw new AppError(
        ErrorCode.BAD_REQUEST,
        `Jumlah pembayaran melebihi sisa tagihan (Rp${remaining.toLocaleString("id-ID")})`,
      );
    }

    const { data: payment, error } = await this.supabase
      .from("payments")
      .insert({
        invoice_id: validated.invoice_id,
        payment_method: validated.payment_method,
        amount: validated.amount,
        reference_number: validated.reference_number ?? null,
        notes: validated.notes ?? null,
        created_by: await this.getCurrentUserId(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw this.handleError(error, "Failed to record payment");
    }

    const newPaidAmount = inv.paid_amount + validated.amount;
    let newStatus: string = inv.status;

    if (newPaidAmount >= inv.total_amount) {
      newStatus = "PAID";
    } else if (newPaidAmount > 0) {
      newStatus = "PARTIAL_PAYMENT";
    }

    await this.supabase
      .from("invoices")
      .update({
        paid_amount: newPaidAmount,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.invoice_id);

    await this.audit({
      action: "RECORD_PAYMENT",
      entity_type: "payments",
      entity_id: (payment as Payment).id,
      new_values: payment,
    });

    await this.audit({
      action: "UPDATE_INVOICE_PAYMENT",
      entity_type: "invoices",
      entity_id: validated.invoice_id,
      old_values: { status: inv.status, paid_amount: inv.paid_amount },
      new_values: { status: newStatus, paid_amount: newPaidAmount },
    });

    return payment as Payment;
  }

  async cancel(input: CancelInvoiceInput): Promise<void> {
    const { data: invoice, error: fetchError } = await this.supabase
      .from("invoices")
      .select("status, total_amount")
      .eq("id", input.invoice_id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        throw new AppError(ErrorCode.NOT_FOUND, "Invoice tidak ditemukan");
      }
      throw this.handleError(fetchError, "Failed to fetch invoice");
    }

    const inv = invoice as { status: string; total_amount: number };

    if (inv.status === "CANCELLED") {
      throw new AppError(
        ErrorCode.ALREADY_CANCELLED,
        "Invoice sudah dibatalkan",
      );
    }

    if (inv.status === "PAID") {
      throw new AppError(
        ErrorCode.INVOICE_ALREADY_PAID,
        "Invoice sudah lunas, tidak dapat dibatalkan",
      );
    }

    const { error } = await this.supabase
      .from("invoices")
      .update({
        status: "CANCELLED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.invoice_id);

    if (error) {
      throw this.handleError(error, "Failed to cancel invoice");
    }

    await this.audit({
      action: "CANCEL_INVOICE",
      entity_type: "invoices",
      entity_id: input.invoice_id,
      old_values: { status: inv.status },
      new_values: { status: "CANCELLED", reason: input.reason ?? null },
    });
  }

  async list(params?: {
    status?: "UNPAID" | "PARTIAL_PAYMENT" | "PAID" | "CANCELLED";
    invoice_type?: "POS" | "CLINICAL" | "PET_HOTEL" | "GROOMING" | "MIXED";
    date?: string;
    customer_id?: UUID;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<Invoice>> {
    const limit = params?.limit ?? PAGE_LIMIT_DEFAULT;
    const offset = params?.offset ?? 0;

    let query = this.supabase
      .from("invoices")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (params?.status) {
      query = query.eq("status", params.status);
    }

    if (params?.invoice_type) {
      query = query.eq("invoice_type", params.invoice_type);
    }

    if (params?.customer_id) {
      query = query.eq("customer_id", params.customer_id);
    }

    if (params?.date) {
      query = query
        .gte("created_at", `${params.date}T00:00:00`)
        .lte("created_at", `${params.date}T23:59:59`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw this.handleError(error, "Failed to list invoices");

    const total = count ?? 0;
    const validLimit = PAGE_LIMIT_OPTIONS.includes(
      limit as (typeof PAGE_LIMIT_OPTIONS)[number],
    )
      ? limit
      : PAGE_LIMIT_DEFAULT;

    return {
      data: (data ?? []) as Invoice[],
      total,
      page: Math.floor(offset / validLimit) + 1,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  async openCashShift(openingCash: number = 0): Promise<CashShift> {
    const { data: existing, error: existingError } = await this.supabase
      .from("cash_shifts")
      .select("*")
      .is("close_time", null)
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      throw this.handleError(
        existingError,
        "Failed to check existing cash shift",
      );
    }

    if (existing) {
      throw new AppError(ErrorCode.CONFLICT, "Shift kas sudah terbuka");
    }

    const { data: shift, error } = await this.supabase
      .from("cash_shifts")
      .insert({
        kasir_id: await this.getCurrentUserId(),
        open_time: new Date().toISOString(),
        opening_cash: openingCash,
        closing_cash: null,
        expected_cash: null,
        difference: null,
        notes: null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw this.handleError(error, "Failed to open cash shift");
    }

    await this.audit({
      action: "OPEN_CASH_SHIFT",
      entity_type: "cash_shifts",
      entity_id: (shift as CashShift).id,
      new_values: shift,
    });

    return shift as CashShift;
  }

  async closeCashShift(shiftId: UUID, closingCash: number): Promise<CashShift> {
    const { data: shift, error: fetchError } = await this.supabase
      .from("cash_shifts")
      .select("*")
      .eq("id", shiftId)
      .is("close_time", null)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        throw new AppError(
          ErrorCode.NOT_FOUND,
          "Shift kas tidak ditemukan atau sudah ditutup",
        );
      }
      throw this.handleError(fetchError, "Failed to fetch cash shift");
    }

    const currentShift = shift as CashShift;

    const { data: payments, error: paymentsError } = await this.supabase
      .from("payments")
      .select("amount")
      .eq("created_by", currentShift.kasir_id)
      .gte("created_at", currentShift.open_time)
      .eq("payment_method", "CASH");

    if (paymentsError) {
      throw this.handleError(
        paymentsError,
        "Failed to calculate expected cash",
      );
    }

    const totalCashPayments = (payments ?? []).reduce(
      (sum, p) => sum + (p as { amount: number }).amount,
      0,
    );

    const expectedCash = currentShift.opening_cash + totalCashPayments;
    const difference = closingCash - expectedCash;

    const { data: updated, error } = await this.supabase
      .from("cash_shifts")
      .update({
        closing_cash: closingCash,
        expected_cash: expectedCash,
        difference: difference,
        close_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", shiftId)
      .select()
      .single();

    if (error) {
      throw this.handleError(error, "Failed to close cash shift");
    }

    await this.audit({
      action: "CLOSE_CASH_SHIFT",
      entity_type: "cash_shifts",
      entity_id: shiftId,
      old_values: { close_time: null, closing_cash: null },
      new_values: {
        close_time: updated.close_time,
        closing_cash: closingCash,
        expected_cash: expectedCash,
        difference: difference,
      },
    });

    return updated as CashShift;
  }

  private async getCurrentUserId(): Promise<UUID | null> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    return user?.id ?? null;
  }
}

export const invoiceService = new InvoiceService();
export default invoiceService;
