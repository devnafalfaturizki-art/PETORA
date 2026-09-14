import { AppError, ErrorCode } from '@/lib/errors';
import { BaseService } from '@/services/base.service';
import {
  createMedicalRecordSchema,
  updateMedicalRecordSchema,
} from '@/schemas';
import type {
  MedicalRecord,
  CreateMedicalRecordInput,
  UpdateMedicalRecordInput,
  PaginatedResponse,
  UUID,
} from '@/types';
import type { MedicalRecordStatus } from '@/types/medical-record';
import { PAGE_LIMIT_DEFAULT, PAGE_LIMIT_OPTIONS } from '@/lib/constants';

class MedicalRecordService extends BaseService {
  async list(params?: {
    appointment_id?: UUID;
    doctor_id?: UUID;
    status?: MedicalRecordStatus;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<MedicalRecord>> {
    const limit = params?.limit ?? PAGE_LIMIT_DEFAULT;
    const offset = params?.offset ?? 0;

    let query = this.supabase
      .from('medical_records')
      .select('*, appointment:appointments(*, customer:customers(name), pet:pets(name))', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params?.appointment_id) {
      query = query.eq('appointment_id', params.appointment_id);
    }

    if (params?.doctor_id) {
      query = query.eq('doctor_id', params.doctor_id);
    }

    if (params?.status) {
      query = query.eq('status', params.status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw this.handleError(error, 'Failed to list medical records');

    const total = count ?? 0;
    const validLimit = PAGE_LIMIT_OPTIONS.includes(
      limit as (typeof PAGE_LIMIT_OPTIONS)[number]
    )
      ? limit
      : PAGE_LIMIT_DEFAULT;

    return {
      data: (data ?? []) as MedicalRecord[],
      total,
      page: Math.floor(offset / validLimit) + 1,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  async getById(id: UUID): Promise<MedicalRecord> {
    const { data, error } = await this.supabase
      .from('medical_records')
      .select('*, appointment:appointments(*, customer:customers(name), pet:pets(name))')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError(ErrorCode.NOT_FOUND, 'Rekam medis tidak ditemukan');
      }
      throw this.handleError(error, 'Failed to fetch medical record');
    }

    return data as MedicalRecord;
  }

  async create(input: CreateMedicalRecordInput): Promise<MedicalRecord> {
    const validated = createMedicalRecordSchema.parse(input);

    const { data: appointment, error: appointmentError } = await this.supabase
      .from('appointments')
      .select('status, doctor_id')
      .eq('id', validated.appointment_id)
      .single();

    if (appointmentError) {
      if (appointmentError.code === 'PGRST116') {
        throw new AppError(ErrorCode.APPOINTMENT_NOT_FOUND, 'Janji temu tidak ditemukan');
      }
      throw this.handleError(appointmentError, 'Failed to fetch appointment');
    }

    if (appointment.status !== 'IN_PROGRESS' && appointment.status !== 'DONE') {
      throw new AppError(ErrorCode.INVALID_STATE_TRANSITION, 'Hanya bisa membuat rekam medis untuk janji temu yang sudah dimulai atau selesai');
    }

    const { data: newRecord, error: insertError } = await this.supabase
      .from('medical_records')
      .insert({
        ...validated,
        doctor_id: appointment.doctor_id,
        status: 'OPEN',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      throw this.handleError(insertError, 'Failed to create medical record');
    }

    await this.audit({
      action: 'CREATE_MEDICAL_RECORD',
      entity_type: 'medical_records',
      entity_id: (newRecord as MedicalRecord).id,
      new_values: newRecord,
    });

    await this.supabase
      .from('appointments')
      .update({ status: 'IN_PROGRESS', updated_at: new Date().toISOString() })
      .eq('id', validated.appointment_id);

    return newRecord as MedicalRecord;
  }

  async update(
    id: UUID,
    input: UpdateMedicalRecordInput
  ): Promise<MedicalRecord> {
    const validated = updateMedicalRecordSchema.parse(input);

    const { data: existing, error: fetchError } = await this.supabase
      .from('medical_records')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new AppError(ErrorCode.NOT_FOUND, 'Rekam medis tidak ditemukan');
      }
      throw this.handleError(fetchError, 'Failed to fetch medical record');
    }

    const { data, error } = await this.supabase
      .from('medical_records')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw this.handleError(error, 'Failed to update medical record');
    }

    await this.audit({
      action: 'UPDATE_MEDICAL_RECORD',
      entity_type: 'medical_records',
      entity_id: id,
      old_values: existing,
      new_values: data,
    });

    return data as MedicalRecord;
  }

  async close(id: UUID): Promise<MedicalRecord> {
    const { data: existing, error: fetchError } = await this.supabase
      .from('medical_records')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new AppError(ErrorCode.NOT_FOUND, 'Rekam medis tidak ditemukan');
      }
      throw this.handleError(fetchError, 'Failed to fetch medical record');
    }

    if (existing.status === 'CLOSED') {
      throw new AppError(ErrorCode.INVALID_STATE_TRANSITION, 'Rekam medis sudah ditutup');
    }

    const { data, error } = await this.supabase
      .from('medical_records')
      .update({
        status: 'CLOSED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw this.handleError(error, 'Failed to close medical record');
    }

    await this.audit({
      action: 'CLOSE_MEDICAL_RECORD',
      entity_type: 'medical_records',
      entity_id: id,
      old_values: { status: existing.status },
      new_values: { status: 'CLOSED' },
    });

    return data as MedicalRecord;
  }

  async delete(id: UUID): Promise<void> {
    const { data: existing, error: fetchError } = await this.supabase
      .from('medical_records')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new AppError(ErrorCode.NOT_FOUND, 'Rekam medis tidak ditemukan');
      }
      throw this.handleError(fetchError, 'Failed to fetch medical record for deletion');
    }

    const { error: deleteError } = await this.supabase
      .from('medical_records')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw this.handleError(deleteError, 'Failed to delete medical record');
    }

    await this.audit({
      action: 'DELETE_MEDICAL_RECORD',
      entity_type: 'medical_records',
      entity_id: id,
      old_values: existing,
    });
  }
}

export const medicalRecordService = new MedicalRecordService();
export default medicalRecordService;