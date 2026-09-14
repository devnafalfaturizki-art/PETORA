import {
  createQuery,
  createMutation,
  useQueryClient,
} from "@tanstack/solid-query";
import { customerService } from "@/services/customer.service";
import { QueryKeys } from "@/lib/query-keys";
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  UUID,
} from "@/types";

export function useCustomers(params?: {
  search?: string;
  is_guest?: boolean;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}) {
  return createQuery(() => ({
    queryKey: [...QueryKeys.customers, params],
    queryFn: () => customerService.list(params),
  }));
}

export function useCustomer(id: UUID) {
  return createQuery(() => ({
    queryKey: QueryKeys.customer(id),
    queryFn: () => customerService.getById(id),
    enabled: !!id,
  }));
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (input: CreateCustomerInput) => customerService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.customers });
    },
  }));
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: ({ id, input }: { id: UUID; input: UpdateCustomerInput }) =>
      customerService.update(id, input),
    onSuccess: (updated: Customer) => {
      queryClient.invalidateQueries({
        queryKey: QueryKeys.customer(updated.id),
      });
      queryClient.invalidateQueries({ queryKey: QueryKeys.customers });
    },
  }));
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (id: UUID) => customerService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.customers });
    },
  }));
}

export function useConvertToCustomer() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (input: {
      guest_id: UUID;
      full_name: string;
      username?: string;
      pin?: string;
    }) => customerService.convertToCustomer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.customers });
    },
  }));
}
