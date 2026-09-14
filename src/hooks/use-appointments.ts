import {
  createQuery,
  createMutation,
  useQueryClient,
} from "@tanstack/solid-query";
import { appointmentService } from "@/services/appointment.service";
import { QueryKeys } from "@/lib/query-keys";
import type { Appointment, CreateAppointmentInput, UUID } from "@/types";
import type { AppointmentStatus } from "@/types/appointment";

export function useAppointments(params?: {
  date?: string;
  status?: AppointmentStatus;
  doctor_id?: UUID;
  limit?: number;
  offset?: number;
}) {
  return createQuery(() => ({
    queryKey: [...QueryKeys.appointments, params],
    queryFn: () => appointmentService.list(params),
  }));
}

export function useAppointment(id: UUID) {
  return createQuery(() => ({
    queryKey: QueryKeys.appointment(id),
    queryFn: () => appointmentService.getById(id),
    enabled: !!id,
  }));
}

export function useTodayQueue() {
  return createQuery(() => ({
    queryKey: [...QueryKeys.appointments, "today-queue"],
    queryFn: () => appointmentService.getTodayQueue(),
  }));
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (input: CreateAppointmentInput) =>
      appointmentService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.appointments });
    },
  }));
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: ({ id, status }: { id: UUID; status: AppointmentStatus }) =>
      appointmentService.updateStatus(id, { status }),
    onSuccess: (updated: Appointment) => {
      queryClient.invalidateQueries({
        queryKey: QueryKeys.appointment(updated.id),
      });
      queryClient.invalidateQueries({ queryKey: QueryKeys.appointments });
      queryClient.invalidateQueries({
        queryKey: [...QueryKeys.appointments, "today-queue"],
      });
    },
  }));
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: ({
      id,
      input,
    }: {
      id: UUID;
      input: {
        doctor_id?: UUID | null;
        appointment_date?: string;
        appointment_time?: string;
        complaint?: string | null;
        notes?: string | null;
      };
    }) => appointmentService.update(id, input),
    onSuccess: (updated: Appointment) => {
      queryClient.invalidateQueries({
        queryKey: QueryKeys.appointment(updated.id),
      });
      queryClient.invalidateQueries({ queryKey: QueryKeys.appointments });
    },
  }));
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (id: UUID) => appointmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.appointments });
    },
  }));
}
