import {
  createQuery,
  createMutation,
  useQueryClient,
} from "@tanstack/solid-query";
import { productService } from "@/services/product.service";
import { QueryKeys } from "@/lib/query-keys";
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  CreateStockMovementInput,
  UUID,
} from "@/types";

export function useProducts(params?: {
  search?: string;
  category_id?: UUID;
  status?: "ACTIVE" | "ARCHIVED";
  low_stock?: boolean;
  limit?: number;
  offset?: number;
}) {
  return createQuery(() => ({
    queryKey: [...QueryKeys.products, params],
    queryFn: () => productService.list(params),
  }));
}

export function useProduct(id: UUID) {
  return createQuery(() => ({
    queryKey: QueryKeys.product(id),
    queryFn: () => productService.getById(id),
    enabled: !!id,
  }));
}

export function useCategories() {
  return createQuery(() => ({
    queryKey: QueryKeys.categories,
    queryFn: () => productService.getCategories(),
  }));
}

export function useSuppliers() {
  return createQuery(() => ({
    queryKey: QueryKeys.suppliers,
    queryFn: () => productService.getSuppliers(),
  }));
}

export function useLowStockProducts() {
  return createQuery(() => ({
    queryKey: QueryKeys.lowStock,
    queryFn: () => productService.getLowStockProducts(),
  }));
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (input: CreateProductInput) => productService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.products });
    },
  }));
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: ({ id, input }: { id: UUID; input: UpdateProductInput }) =>
      productService.update(id, input),
    onSuccess: (updated: Product) => {
      queryClient.invalidateQueries({
        queryKey: QueryKeys.product(updated.id),
      });
      queryClient.invalidateQueries({ queryKey: QueryKeys.products });
    },
  }));
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (id: UUID) => productService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.products });
    },
  }));
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (input: CreateStockMovementInput) =>
      productService.createStockMovement(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.products });
    },
  }));
}
