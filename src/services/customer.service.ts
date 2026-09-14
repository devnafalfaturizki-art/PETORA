import { AppError, ErrorCode } from "@/lib/errors";
import { BaseService } from "@/services/base.service";
import { createCustomerSchema, updateCustomerSchema } from "@/schemas";
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  PaginatedResponse,
  UUID,
} from "@/types";
import { PAGE_LIMIT_DEFAULT, PAGE_LIMIT_OPTIONS } from "@/lib/constants";

class CustomerService extends BaseService {
  async list(params?: {
    search?: string;
    is_guest?: boolean;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<Customer>> {
    const limit = params?.limit ?? PAGE_LIMIT_DEFAULT;
    const offset = params?.offset ?? 0;
    const search = params?.search?.trim();

    let query = this.supabase
      .from("customers")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`,
      );
    }

    if (params?.is_guest !== undefined) {
      query = query.eq("is_guest", params.is_guest);
    }

    if (params?.is_active !== undefined) {
      query = query.eq("is_active", params.is_active);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw this.handleError(error, "Failed to list customers");

    const total = count ?? 0;
    const validLimit = PAGE_LIMIT_OPTIONS.includes(
      limit as (typeof PAGE_LIMIT_OPTIONS)[number],
    )
      ? limit
      : PAGE_LIMIT_DEFAULT;

    return {
      data: (data ?? []) as Customer[],
      total,
      page: Math.floor(offset / validLimit) + 1,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  async getById(id: UUID): Promise<Customer> {
    const { data, error } = await this.supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new AppError(ErrorCode.NOT_FOUND, "Customer tidak ditemukan");
      }
      throw this.handleError(error, "Failed to fetch customer");
    }

    return data as Customer;
  }

  async create(input: CreateCustomerInput): Promise<Customer> {
    const validated = createCustomerSchema.parse(input);

    const { data: existing, error: dupError } = await this.supabase
      .from("customers")
      .select("id")
      .eq("phone", validated.phone ?? "")
      .neq("phone", null)
      .maybeSingle();

    if (dupError && dupError.code !== "PGRST116") {
      throw this.handleError(dupError, "Failed to check duplicate");
    }

    if (existing) {
      throw new AppError(
        ErrorCode.CONFLICT,
        "Customer dengan nomor telepon yang sama sudah ada",
      );
    }

    const { data: newCustomer, error: insertError } = await this.supabase
      .from("customers")
      .insert({
        name: validated.name,
        phone: validated.phone ?? null,
        email: validated.email ?? null,
        address: validated.address ?? null,
        emergency_contact: validated.emergency_contact ?? null,
        photo_url: validated.photo_url ?? null,
        notes: validated.notes ?? null,
        is_guest: validated.is_guest ?? false,
        tags: validated.tags ?? [],
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      throw this.handleError(insertError, "Failed to create customer");
    }

    await this.audit({
      action: "CREATE_CUSTOMER",
      entity_type: "customers",
      entity_id: (newCustomer as Customer).id,
      new_values: newCustomer,
    });

    if (validated.create_account && validated.username && validated.pin) {
      const { data: existingUser, error: userCheckError } = await this.supabase
        .from("users")
        .select("id")
        .eq("username", validated.username)
        .maybeSingle();

      if (userCheckError && userCheckError.code !== "PGRST116") {
        throw this.handleError(userCheckError, "Failed to check username");
      }

      if (existingUser) {
        throw new AppError(
          ErrorCode.USERNAME_ALREADY_EXISTS,
          "Username sudah digunakan",
        );
      }

      const { error: userInsertError } = await this.supabase
        .from("users")
        .insert({
          username: validated.username,
          pin_hash: validated.pin,
          role: "CUSTOMER",
          full_name: validated.name,
          customer_id: (newCustomer as Customer).id,
          created_by: await this.getCurrentUserId(),
          failed_login_attempts: 0,
          is_active: true,
        });

      if (userInsertError) {
        throw this.handleError(
          userInsertError,
          "Failed to create customer account",
        );
      }

      await this.audit({
        action: "CREATE_USER",
        entity_type: "users",
        new_values: { username: validated.username, role: "CUSTOMER" },
      });
    }

    return newCustomer as Customer;
  }

  async update(id: UUID, input: UpdateCustomerInput): Promise<Customer> {
    const validated = updateCustomerSchema.parse(input);

    const { data, error } = await this.supabase
      .from("customers")
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new AppError(ErrorCode.NOT_FOUND, "Customer tidak ditemukan");
      }
      throw this.handleError(error, "Failed to update customer");
    }

    await this.audit({
      action: "UPDATE_CUSTOMER",
      entity_type: "customers",
      entity_id: id,
      new_values: data,
    });

    return data as Customer;
  }

  async delete(id: UUID): Promise<void> {
    const { data: existing, error: fetchError } = await this.supabase
      .from("customers")
      .select("name, is_guest")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        throw new AppError(ErrorCode.NOT_FOUND, "Customer tidak ditemukan");
      }
      throw this.handleError(
        fetchError,
        "Failed to fetch customer for deletion",
      );
    }

    const { error: deleteError } = await this.supabase
      .from("customers")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw this.handleError(deleteError, "Failed to delete customer");
    }

    await this.audit({
      action: "DELETE_CUSTOMER",
      entity_type: "customers",
      entity_id: id,
      old_values: existing,
    });
  }

  async convertToCustomer(input: {
    guest_id: UUID;
    full_name: string;
    username?: string;
    pin?: string;
  }): Promise<Customer> {
    const { data, error } = await this.supabase
      .from("customers")
      .update({
        name: input.full_name,
        is_guest: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.guest_id)
      .select()
      .single();

    if (error) {
      throw this.handleError(error, "Failed to convert guest to customer");
    }

    await this.audit({
      action: "CONVERT_GUEST_TO_CUSTOMER",
      entity_type: "customers",
      entity_id: input.guest_id,
      new_values: { is_guest: false, full_name: input.full_name },
    });

    return data as Customer;
  }

  private async getCurrentUserId(): Promise<UUID | null> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    return user?.id ?? null;
  }
}

export const customerService = new CustomerService();
export default customerService;
