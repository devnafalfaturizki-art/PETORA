import { createQuery, createMutation, useQueryClient } from '@tanstack/solid-query';
import { medicalRecordService } from '@/services/medical-record.service';
import { QueryKeys } from '@/lib/query-keys';
import type {
  MedicalRecord,
  CreateMedicalRecordInput,
  UpdateMedicalRecordInput,
  UUID,
} from '@/types';
import type { MedicalRecordStatus } from '@/types/medical-record';

export function useMedicalRecords(params?: {
  appointment_id?: UUID;
  doctor_id?: UUID;
  status?: MedicalRecordStatus;
  limit?: number;
  offset?: number;
}) {
  return createQuery(() => ({
    queryKey: [...QueryKeys.medicalRecords, params],
    queryFn: () => medicalRecordService.list(params),
  }));
}

export function useMedicalRecord(id: UUID) {
  return createQuery(() => ({
    queryKey: QueryKeys.medicalRecord(id),
    queryFn: () => medicalRecordService.getById(id),
    enabled: !!id,
  }));
}

export function useCreateMedicalRecord() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (input: CreateMedicalRecordInput) => medicalRecordService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.medicalRecords });
      queryClient.invalidateQueries({ queryKey: QueryKeys.appointments });
    },
  }));
}

export function useUpdateMedicalRecord() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: ({ id, input }: { id: UUID; input: UpdateMedicalRecordInput }) =>
      medicalRecordService.update(id, input),
    onSuccess: (updated: MedicalRecord) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.medicalRecord(updated.id) });
      queryClient.invalidateQueries({ queryKey: QueryKeys.medicalRecords });
    },
  }));
}

export function useCloseMedicalRecord() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (id: UUID) => medicalRecordService.close(id),
    onSuccess: (updated: MedicalRecord) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.medicalRecord(updated.id) });
      queryClient.invalidateQueries({ queryKey: QueryKeys.medicalRecords });
    },
  }));
}

export function useDeleteMedicalRecord() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (id: UUID) => medicalRecordService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.medicalRecords });
    },
  }));
}