import { AppError, ErrorCode } from '@/lib/errors';
import { BaseService } from '@/services/base.service';
import type {
  GroomingService,
  GroomingBooking,
  GroomingRecord,
  CreateGroomingBookingInput,
  CreateGroomingRecordInput,
  PaginatedResponse,
  UUID,
} from '@/types';
import { PAGE_LIMIT_DEFAULT, PAGE_LIMIT_OPTIONS } from '@/lib/constants';
import type { GroomingBookingStatus } from '@/types/grooming';

class GroomingServiceService extends BaseService {
  async listServices(): Promise<GroomingService[]> {
    const { data, error } = await this.supabase
      .from('grooming_services')
      .select('*')
      .eq('is_active', true)
      .eq('deleted_at', null)
      .order('name');

    if (error) throw this.handleError(error, 'Failed to list services');
    return (data ?? []) as GroomingService[];
  }

  async listBookings(params?: {
    status?: GroomingBookingStatus;
    date?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<GroomingBooking>> {
    const limit = params?.limit ?? PAGE_LIMIT_DEFAULT;
    const offset = params?.offset ?? 0;

    let query = this.supabase
      .from('grooming_bookings')
      .select('*', { count: 'exact' })
      .order('appointment_date', { ascending: false });

    if (params?.status) {
      query = query.eq('status', params.status);
    }
    if (params?.date) {
      query = query.eq('appointment_date', params.date);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw this.handleError(error, 'Failed to list bookings');

    const total = count ?? 0;
    const validLimit = PAGE_LIMIT_OPTIONS.includes(
      limit as (typeof PAGE_LIMIT_OPTIONS)[number]
    )
      ? limit
      : PAGE_LIMIT_DEFAULT;

    return {
      data: (data ?? []) as GroomingBooking[],
      total,
      page: Math.floor(offset / validLimit) + 1,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  async createBooking(input: CreateGroomingBookingInput): Promise<GroomingBooking> {
    const { data, error } = await this.supabase
      .from('grooming_bookings')
      .insert({
        ...input,
        status: 'BOOKED',
        is_from_portal: input.is_from_portal ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw this.handleError(error, 'Failed to create booking');
    return data as GroomingBooking;
  }

  async updateStatus(
    id: UUID,
    status: GroomingBookingStatus
  ): Promise<GroomingBooking> {
    const ALLOWED_TRANSITIONS: Record<string, GroomingBookingStatus[]> = {
      BOOKED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['DONE', 'CANCELLED'],
      DONE: [],
      CANCELLED: [],
    };

    const { data: existing, error: fetchError } = await this.supabase
      .from('grooming_bookings')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw new AppError(ErrorCode.NOT_FOUND, 'Booking grooming tidak ditemukan');
      }
      throw this.handleError(fetchError, 'Failed to fetch booking');
    }

    const currentStatus = (existing as { status: string }).status;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];

    if (!allowed.includes(status)) {
      throw new AppError(
        ErrorCode.INVALID_STATE_TRANSITION,
        `Tidak dapat mengubah status dari ${currentStatus} ke ${status}`
      );
    }

    const { data, error } = await this.supabase
      .from('grooming_bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw this.handleError(error, 'Failed to update status');

    await this.audit({
      action: 'UPDATE_GROOMING_BOOKING_STATUS',
      entity_type: 'grooming_bookings',
      entity_id: id,
      old_values: { status: currentStatus },
      new_values: { status },
    });

    return data as GroomingBooking;
  }

  async createRecord(input: CreateGroomingRecordInput): Promise<GroomingRecord> {
    const { data, error } = await this.supabase
      .from('grooming_records')
      .insert({
        ...input,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw this.handleError(error, 'Failed to create record');
    return data as GroomingRecord;
  }

  async createService(input: {
    name: string;
    description?: string;
    base_price: number;
    duration_minutes?: number;
  }): Promise<GroomingService> {
    const { data, error } = await this.supabase
      .from('grooming_services')
      .insert({
        ...input,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw this.handleError(error, 'Failed to create service');
    return data as GroomingService;
  }
}

export const groomingService = new GroomingServiceService();
export default groomingService;
