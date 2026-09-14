import { AppError, ErrorCode } from "@/lib/errors";
import { BaseService } from "@/services/base.service";
import {
  createProductSchema,
  updateProductSchema,
  createStockMovementSchema,
} from "@/schemas";
import type {
  Product,
  Category,
  Supplier,
  StockMovement,
  CreateProductInput,
  UpdateProductInput,
  CreateStockMovementInput,
  PaginatedResponse,
  UUID,
} from "@/types";
import {
  PAGE_LIMIT_DEFAULT,
  PAGE_LIMIT_OPTIONS,
  LOW_STOCK_THRESHOLD,
} from "@/lib/constants";

class ProductService extends BaseService {
  async list(params?: {
    search?: string;
    category_id?: UUID;
    status?: "ACTIVE" | "ARCHIVED";
    low_stock?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<Product>> {
    const limit = params?.limit ?? PAGE_LIMIT_DEFAULT;
    const offset = params?.offset ?? 0;
    const search = params?.search?.trim();

    let query = this.supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("deleted_at", null)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`,
      );
    }

    if (params?.category_id) {
      query = query.eq("category_id", params.category_id);
    }

    if (params?.status) {
      query = query.eq("status", params.status);
    }

    if (params?.low_stock) {
      query = query.lt(
        "stock_quantity",
        params.low_stock ? LOW_STOCK_THRESHOLD : undefined,
      );
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw this.handleError(error, "Failed to list products");

    const total = count ?? 0;
    const validLimit = PAGE_LIMIT_OPTIONS.includes(
      limit as (typeof PAGE_LIMIT_OPTIONS)[number],
    )
      ? limit
      : PAGE_LIMIT_DEFAULT;

    return {
      data: (data ?? []) as Product[],
      total,
      page: Math.floor(offset / validLimit) + 1,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  async getById(id: UUID): Promise<Product> {
    const { data, error } = await this.supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new AppError(ErrorCode.NOT_FOUND, "Produk tidak ditemukan");
      }
      throw this.handleError(error, "Failed to fetch product");
    }

    return data as Product;
  }

  async create(input: CreateProductInput): Promise<Product> {
    const validated = createProductSchema.parse(input);

    const { data: existingSku, error: skuError } = await this.supabase
      .from("products")
      .select("id")
      .eq("sku", validated.sku)
      .maybeSingle();

    if (skuError && skuError.code !== "PGRST116") {
      throw this.handleError(skuError, "Failed to check SKU");
    }

    if (existingSku) {
      throw new AppError(ErrorCode.SKU_ALREADY_EXISTS, "SKU sudah digunakan");
    }

    if (validated.barcode) {
      const { data: existingBarcode, error: barcodeError } = await this.supabase
        .from("products")
        .select("id")
        .eq("barcode", validated.barcode)
        .maybeSingle();

      if (barcodeError && barcodeError.code !== "PGRST116") {
        throw this.handleError(barcodeError, "Failed to check barcode");
      }

      if (existingBarcode) {
        throw new AppError(
          ErrorCode.BARCODE_ALREADY_EXISTS,
          "Barcode sudah digunakan",
        );
      }
    }

    const { data: newProduct, error: insertError } = await this.supabase
      .from("products")
      .insert({
        ...validated,
        stock_quantity: validated.stock_quantity ?? 0,
        stock_minimum: validated.stock_minimum ?? 0,
        stock_maximum: validated.stock_maximum ?? 0,
        status: "ACTIVE",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      throw this.handleError(insertError, "Failed to create product");
    }

    await this.audit({
      action: "CREATE_PRODUCT",
      entity_type: "products",
      entity_id: (newProduct as Product).id,
      new_values: newProduct,
    });

    return newProduct as Product;
  }

  async update(id: UUID, input: UpdateProductInput): Promise<Product> {
    const validated = updateProductSchema.parse(input);

    const { data, error } = await this.supabase
      .from("products")
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("deleted_at", null)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new AppError(ErrorCode.NOT_FOUND, "Produk tidak ditemukan");
      }
      throw this.handleError(error, "Failed to update product");
    }

    await this.audit({
      action: "UPDATE_PRODUCT",
      entity_type: "products",
      entity_id: id,
      new_values: data,
    });

    return data as Product;
  }

  async delete(id: UUID): Promise<void> {
    const { data: existing, error: fetchError } = await this.supabase
      .from("products")
      .select("name, sku")
      .eq("id", id)
      .eq("deleted_at", null)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        throw new AppError(ErrorCode.NOT_FOUND, "Produk tidak ditemukan");
      }
      throw this.handleError(
        fetchError,
        "Failed to fetch product for deletion",
      );
    }

    const { error: deleteError } = await this.supabase
      .from("products")
      .update({
        deleted_at: new Date().toISOString(),
        status: "ARCHIVED",
      })
      .eq("id", id);

    if (deleteError) {
      throw this.handleError(deleteError, "Failed to archive product");
    }

    await this.audit({
      action: "DELETE_PRODUCT",
      entity_type: "products",
      entity_id: id,
      old_values: existing,
    });
  }

  async createStockMovement(
    input: CreateStockMovementInput,
  ): Promise<StockMovement> {
    const validated = createStockMovementSchema.parse(input);

    const { data: product, error: productError } = await this.supabase
      .from("products")
      .select("stock_quantity, name, sku")
      .eq("id", validated.product_id)
      .single();

    if (productError) {
      if (productError.code === "PGRST116") {
        throw new AppError(ErrorCode.NOT_FOUND, "Produk tidak ditemukan");
      }
      throw this.handleError(productError, "Failed to fetch product");
    }

    const currentStock = (product as { stock_quantity: number }).stock_quantity;
    let newStock = currentStock;

    if (
      validated.movement_type === "IN" ||
      validated.movement_type === "RETURN"
    ) {
      newStock = currentStock + validated.quantity;
    } else if (
      validated.movement_type === "OUT" ||
      validated.movement_type === "DAMAGED" ||
      validated.movement_type === "EXPIRED"
    ) {
      newStock = currentStock - Math.abs(validated.quantity);
    } else if (
      validated.movement_type === "ADJUSTMENT" ||
      validated.movement_type === "OPNAME"
    ) {
      newStock = validated.quantity;
    }

    if (newStock < 0) {
      throw new AppError(
        ErrorCode.INSUFFICIENT_STOCK,
        "Stok tidak mencukupi untuk operasi ini",
      );
    }

    const { data: movement, error: movementError } = await this.supabase.rpc(
      "fn_create_stock_movement",
      {
        p_product_id: validated.product_id,
        p_movement_type: validated.movement_type,
        p_quantity: validated.quantity,
        p_reference_type: validated.reference_type ?? null,
        p_reference_id: validated.reference_id ?? null,
        p_notes: validated.notes ?? null,
        p_new_stock: newStock,
      },
    );

    if (movementError) {
      throw this.handleError(movementError, "Failed to create stock movement");
    }

    await this.audit({
      action: "CREATE_STOCK_MOVEMENT",
      entity_type: "stock_movements",
      new_values: {
        product_id: validated.product_id,
        movement_type: validated.movement_type,
        quantity: validated.quantity,
      },
    });

    return movement as StockMovement;
  }

  async getCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) throw this.handleError(error, "Failed to fetch categories");
    return (data ?? []) as Category[];
  }

  async getSuppliers(): Promise<Supplier[]> {
    const { data, error } = await this.supabase
      .from("suppliers")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) throw this.handleError(error, "Failed to fetch suppliers");
    return (data ?? []) as Supplier[];
  }

  async getLowStockProducts(): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from("products")
      .select("*")
      .eq("deleted_at", null)
      .lt("stock_quantity", LOW_STOCK_THRESHOLD)
      .order("stock_quantity", { ascending: true });

    if (error)
      throw this.handleError(error, "Failed to fetch low stock products");
    return (data ?? []) as Product[];
  }
}

export const productService = new ProductService();
export default productService;
