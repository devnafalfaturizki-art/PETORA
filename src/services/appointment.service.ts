import { AppError, ErrorCode } from "@/lib/errors";
import { BaseService } from "@/services/base.service";
import {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
} from "@/schemas";
import type {
  Appointment,
  CreateAppointmentInput,
  UpdateAppointmentStatusInput,
  PaginatedResponse,
  UUID,
} from "@/types";
import { PAGE_LIMIT_DEFAULT, PAGE_LIMIT_OPTIONS } from "@/lib/constants";
import type { AppointmentStatus } from "@/types/appointment";

class AppointmentService extends BaseService {
  async list(params?: {
    date?: string;
    status?: AppointmentStatus;
    doctor_id?: UUID;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<Appointment>> {
    const limit = params?.limit ?? PAGE_LIMIT_DEFAULT;
    const offset = params?.offset ?? 0;

    let query = this.supabase
      .from("appointments")
      .select("*", { count: "exact" })
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });

    if (params?.date) {
      query = query.eq("appointment_date", params.date);
    }

    if (params?.status) {
      query = query.eq("status", params.status);
    }

    if (params?.doctor_id) {
      query = query
        .eq("doctor_id", params?.doctor_id)
        .not("doctor_id", "is", null);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw this.handleError(error, "Failed to list appointments");

    const total = count ?? 0;
    const validLimit = PAGE_LIMIT_OPTIONS.includes(
      limit as (typeof PAGE_LIMIT_OPTIONS)[number],
    )
      ? limit
      : PAGE_LIMIT_DEFAULT;

    return {
      data: (data ?? []) as Appointment[],
      total,
      page: Math.floor(offset / validLimit) + 1,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    };
  }

  async getById(id: UUID): Promise<Appointment> {
    const { data, error } = await this.supabase
      .from("appointments")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new AppError(
          ErrorCode.APPOINTMENT_NOT_FOUND,
          "Janji temu tidak ditemukan",
        );
      }
      throw this.handleError(error, "Failed to fetch appointment");
    }

    return data as Appointment;
  }

  async create(input: CreateAppointmentInput): Promise<Appointment> {
    const validated = createAppointmentSchema.parse(input);

    const { data: lastQueue, error: queueError } = await this.supabase
      .from("appointments")
      .select("queue_number")
      .eq("appointment_date", validated.appointment_date)
      .order("queue_number", { ascending: false })
      .limit(1)
      .single();

    let queueNumber = 1;
    if (!queueError && lastQueue?.queue_number) {
      queueNumber = lastQueue.queue_number + 1;
    }

    const { data: newAppointment, error: insertError } = await this.supabase
      .from("appointments")
      .insert({
        ...validated,
        queue_number: queueNumber,
        status: "WAITING",
        is_from_portal: validated.is_from_portal ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      throw this.handleError(insertError, "Failed to create appointment");
    }

    await this.audit({
      action: "CREATE_APPOINTMENT",
      entity_type: "appointments",
      entity_id: (newAppointment as Appointment).id,
      new_values: newAppointment,
    });

    return newAppointment as Appointment;
  }

  async updateStatus(
    id: UUID,
    input: UpdateAppointmentStatusInput,
  ): Promise<Appointment> {
    const validated = updateAppointmentStatusSchema.parse(input);

    const { data: existing, error: fetchError } = await this.supabase
      .from("appointments")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        throw new AppError(
          ErrorCode.APPOINTMENT_NOT_FOUND,
          "Janji temu tidak ditemukan",
        );
      }
      throw this.handleError(fetchError, "Failed to fetch appointment");
    }

    const current = existing as { status: string };

    const ALLOWED_TRANSITIONS: Record<string, AppointmentStatus[]> = {
      WAITING: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["DONE", "CANCELLED"],
      DONE: [],
      CANCELLED: [],
    };

    const allowed = ALLOWED_TRANSITIONS[current.status] ?? [];
    if (!allowed.includes(validated.status)) {
      throw new AppError(
        ErrorCode.INVALID_STATE_TRANSITION,
        `Tidak dapat mengubah status dari ${current.status} ke ${validated.status}`,
      );
    }

    const { data, error } = await this.supabase
      .from("appointments")
      .update({
        status: validated.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw this.handleError(error, "Failed to update appointment status");
    }

    await this.audit({
      action: "UPDATE_APPOINTMENT_STATUS",
      entity_type: "appointments",
      entity_id: id,
      old_values: { status: current.status },
      new_values: { status: validated.status },
    });

    return data as Appointment;
  }

  async update(
    id: UUID,
    input: {
      doctor_id?: UUID | null;
      appointment_date?: string;
      appointment_time?: string;
      complaint?: string | null;
      notes?: string | null;
    },
  ): Promise<Appointment> {
    const { data: existing, error: fetchError } = await this.supabase
      .from("appointments")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        throw new AppError(
          ErrorCode.APPOINTMENT_NOT_FOUND,
          "Janji temu tidak ditemukan",
        );
      }
      throw this.handleError(fetchError, "Failed to fetch appointment");
    }

    const { data, error } = await this.supabase
      .from("appointments")
      .update({
        doctor_id: input.doctor_id ?? existing.doctor_id,
        appointment_date: input.appointment_date ?? existing.appointment_date,
        appointment_time: input.appointment_time ?? existing.appointment_time,
        complaint: input.complaint ?? existing.complaint,
        notes: input.notes ?? existing.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw this.handleError(error, "Failed to update appointment");
    }

    await this.audit({
      action: "UPDATE_APPOINTMENT",
      entity_type: "appointments",
      entity_id: id,
      old_values: existing,
      new_values: data,
    });

    return data as Appointment;
  }

  async delete(id: UUID): Promise<void> {
    const { data: existing, error: fetchError } = await this.supabase
      .from("appointments")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        throw new AppError(
          ErrorCode.APPOINTMENT_NOT_FOUND,
          "Janji temu tidak ditemukan",
        );
      }
      throw this.handleError(
        fetchError,
        "Failed to fetch appointment for deletion",
      );
    }

    const { error: deleteError } = await this.supabase
      .from("appointments")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw this.handleError(deleteError, "Failed to delete appointment");
    }

    await this.audit({
      action: "DELETE_APPOINTMENT",
      entity_type: "appointments",
      entity_id: id,
      old_values: existing,
    });
  }

  async getTodayQueue(): Promise<Appointment[]> {
    const today = new Date().toISOString().split("T")[0] as string;

    const { data, error } = await this.supabase
      .from("appointments")
      .select("*")
      .eq("appointment_date", today)
      .in("status", ["WAITING", "IN_PROGRESS"])
      .order("queue_number", { ascending: true });

    if (error) throw this.handleError(error, "Failed to fetch today's queue");

    return (data ?? []) as Appointment[];
  }
}

export const appointmentService = new AppointmentService();
export default appointmentService;
