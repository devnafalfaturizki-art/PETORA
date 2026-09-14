import { AppError, ErrorCode } from '@/lib/errors';
import { BaseService } from '@/services/base.service';
import type {
  Room,
  PetHotelBooking,
  PetHotelLog,
  CreatePetHotelBookingInput,
  CreatePetHotelLogInput,
  PaginatedResponse,
  UUID,
} from '@/types';
import { PAGE_LIMIT_DEFAULT, PAGE_LIMIT_OPTIONS } from '@/lib/constants';

class PetHotelService extends BaseService {
  async listRooms(): Promise<Room[]> {
    const { data, error } = await this.supabase
      .from('rooms')
      .select('*')
      .eq('is_active', true)
      .eq('deleted_at', null)
      .order('room_number', { ascending: true });

    if (error) throw this.handleError(error, 'Failed to list rooms');
    return (data ?? []) as Room[];
  }

  async getBookings(params?: {
    status?: string;
    date?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<PetHotelBooking>> {
    const limit = params?.limit ?? PAGE_LIMIT_DEFAULT;
    const offset = params?.offset ?? 0;

    let query = this.supabase
      .from('pet_hotel_bookings')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params?.status) {
      query = query.eq('status', params.status);
    }
    if (params?.date) {
      query = query.eq('check_in_date', params.date);
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
      data: (data ?? []) as PetHotelBooking[],
      total,
      page: Math.floor(offset / validLimit) + 1,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  async createBooking(input: CreatePetHotelBookingInput): Promise<PetHotelBooking> {
    const { data, error } = await this.supabase
      .from('pet_hotel_bookings')
      .insert({
        ...input,
        status: 'BOOKED',
        is_from_portal: input.is_from_portal ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError(ErrorCode.CONFLICT, 'Booking sudah ada untuk periode ini');
      }
      throw this.handleError(error, 'Failed to create booking');
    }

    await this.audit({
      action: 'CREATE_PET_HOTEL_BOOKING',
      entity_type: 'pet_hotel_bookings',
      entity_id: (data as PetHotelBooking).id,
      new_values: data,
    });

    return data as PetHotelBooking;
  }

  async checkIn(bookingId: UUID): Promise<PetHotelBooking> {
    const { data, error } = await this.supabase
      .from('pet_hotel_bookings')
      .update({
        status: 'CHECKED_IN',
        actual_check_in_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .eq('status', 'BOOKED')
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError(ErrorCode.BOOKING_NOT_ACTIVE, 'Booking tidak ditemukan atau sudah check-in');
      }
      throw this.handleError(error, 'Failed to check in');
    }

    await this.audit({
      action: 'CHECK_IN_PET_HOTEL',
      entity_type: 'pet_hotel_bookings',
      entity_id: bookingId,
      old_values: { status: 'BOOKED' },
      new_values: { status: 'CHECKED_IN' },
    });

    return data as PetHotelBooking;
  }

  async checkOut(bookingId: UUID): Promise<PetHotelBooking> {
    const { data, error } = await this.supabase
      .from('pet_hotel_bookings')
      .update({
        status: 'CHECKED_OUT',
        actual_check_out_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .eq('status', 'CHECKED_IN')
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError(ErrorCode.BOOKING_NOT_ACTIVE, 'Booking tidak ditemukan atau belum check-in');
      }
      throw this.handleError(error, 'Failed to check out');
    }

    await this.audit({
      action: 'CHECK_OUT_PET_HOTEL',
      entity_type: 'pet_hotel_bookings',
      entity_id: bookingId,
      old_values: { status: 'CHECKED_IN' },
      new_values: { status: 'CHECKED_OUT' },
    });

    return data as PetHotelBooking;
  }

  async addLog(input: CreatePetHotelLogInput): Promise<PetHotelLog> {
    const { data, error } = await this.supabase
      .from('pet_hotel_logs')
      .insert({
        ...input,
        logged_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw this.handleError(error, 'Failed to add log');

    await this.audit({
      action: 'ADD_PET_HOTEL_LOG',
      entity_type: 'pet_hotel_logs',
      entity_id: (data as PetHotelLog).id,
      new_values: data,
    });

    return data as PetHotelLog;
  }
}

export const petHotelService = new PetHotelService();
export default petHotelService;
