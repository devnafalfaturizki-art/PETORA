# Technical Specification — Baseline Contract & Workflow
## Petora — Sistem Manajemen Terpadu Petshop & Petcare
### Dokumen Baseline Final | 13 September 2026

---

## Daftar Isi
1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Modul Auth & User Management](#2-modul-auth--user-management)
3. [Modul CRM & Pasien](#3-modul-crm--pasien)
4. [Modul Appointments & Medical Records](#4-modul-appointments--medical-records)
5. [Modul Pet Hotel](#5-modul-pet-hotel)
6. [Modul Grooming](#6-modul-grooming)
7. [Modul Petshop & Inventory](#7-modul-petshop--inventory)
8. [Modul POS & Billing](#8-modul-pos--billing)
9. [Modul Engagement & Loyalty](#9-modul-engagement--loyalty)
10. [Modul Keuangan & Operasional](#10-modul-keuangan--operasional)
11. [Modul Customer Portal](#11-modul-customer-portal)
12. [Cross-Cutting Contracts](#12-cross-cutting-contracts)
13. [Edge Cases & Error Matrix](#13-edge-cases--error-matrix)
14. [Glosarium Kontrak](#14-glosarium-kontrak)

---

## 1. Ringkasan Eksekutif

### 1.1 Cakupan Dokumen

Dokumen ini mendefinisikan **kontrak teknis + workflow detail** untuk setiap modul Petora. Dokumen ini menjadi acuan implementasi tunggal untuk developer dan AI agent agar tidak ada ambiguitas dalam:

- **State transitions** — alur status yang eksplisit, tidak boleh melompat
- **Validasi rules** — aturan bisnis yang harus ditegakkan di setiap layer
- **Workflow step-by-step** — urutan aksi yang harus diikuti, termasuk failure path
- **Edge cases** — kasus khusus yang harus ditangani
- **API contracts** — input/output yang eksak untuk setiap operasi
- **Permission checks** — siapa boleh melakukan apa, di kondisi apa

### 1.2 Prinsip Kontrak

| Prinsip | Penjelasan |
|---------|------------|
| **Explicit over implicit** | Semua aturan ditulis eksplisit, tidak ada asumsi |
| **Fail-fast** | Validasi dilakukan sedini mungkin (Zod → Service → DB) |
| **Atomic operations** | Operasi multi-tabel menggunakan Supabase RPC/transaction |
| **Idempotent where possible** | Operasi yang sama menghasilkan hasil yang sama |
| **Audit everything** | Setiap perubahan state tercatat di `audit_logs` |
| **Type-safe** | TypeScript strict mode + Zod runtime validation |
| **SolidJS native** | Menggunakan `createSignal`, `createStore`, `createQuery`, `createMutation` |

### 1.3 Tech Stack Confirmation

| Layer | Technology |
|-------|-----------|
| Frontend Framework | **SolidJS** (bukan React) |
| Meta Framework | Vite + Solid (SPA) atau SolidStart (SSR untuk Portal) |
| UI Components | shadcn-solid atau Kobalte + Tailwind |
| Data Fetching | `@tanstack/solid-query` (`createQuery`, `createMutation`) |
| State Management | SolidJS native (`createSignal`, `createStore`) |
| Backend | Supabase (PostgreSQL + Edge Functions + Auth + Storage + Realtime) |
| Validation | Zod |
| Deployment | Vercel (Frontend) + Supabase (Backend) |

---

## 2. Modul Auth & User Management

### 2.1 Contract Overview

| Operasi | Endpoint/RPC | Akses |
|---------|--------------|-------|
| Login | `fn_auth_login` | Public |
| Logout | `fn_auth_logout` | Authenticated |
| Change PIN | `fn_auth_change_pin` | Self |
| Reset PIN | `fn_auth_reset_pin` | Owner (all) / Admin (Customer only) |
| Create User | `fn_auth_create_user` | Owner (staff) / Owner+Admin (customer) |
| Deactivate User | `fn_auth_deactivate_user` | Owner (staff) / Owner+Admin (customer) |
| List Users | Query `users` | Role-based RLS |

### 2.2 Workflow: Login

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Client mengirim { username, pin } ke Edge Function │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Edge Function validasi input via Zod                │
│   - username: string, 3-50 chars, pattern [a-z0-9._]+      │
│   - pin: string, exactly 6 digits                           │
│   → Jika invalid: return 400 BAD_REQUEST                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Query users by username (case-sensitive)            │
│   → Jika tidak ditemukan:                                   │
│     - Increment failed_login_attempts (jika user ada)       │
│     - Return 401 INVALID_CREDENTIALS (generic message)      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Cek lockout                                         │
│   - Jika locked_until > NOW():                              │
│     → Return 423 ACCOUNT_LOCKED { locked_until, remaining } │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Cek isActive                                        │
│   - Jika is_active = false:                                 │
│     → Return 403 ACCOUNT_INACTIVE                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 6: Verify PIN (bcrypt.compare)                         │
│   - Jika tidak match:                                       │
│     - failed_login_attempts += 1                            │
│     - Jika >= 5: locked_until = NOW() + 15 minutes          │
│     - Return 401 INVALID_CREDENTIALS                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 7: Login berhasil                                      │
│   - Reset failed_login_attempts = 0                         │
│   - Clear locked_until = null                               │
│   - Update last_login_at = NOW()                            │
│   - Generate JWT session (exp: 24h)                         │
│   - Insert audit_log: action='LOGIN'                        │
│   - Return 200 { user, session_token }                      │
└─────────────────────────────────────────────────────────────┘
```

**Edge Cases:**
- Username dengan spasi → ditolak di validasi Zod
- PIN dengan huruf → ditolak di validasi Zod
- Concurrent login dari device berbeda → diizinkan (session terpisah)
- User yang sudah login lalu PIN di-reset oleh admin → session lama tetap valid sampai expire (atau bisa di-invalidate via token versioning)

### 2.3 Workflow: Create User (Staff — Owner Only)

**Input:**
```typescript
{
  username: string,
  pin: string,
  role: 'ADMIN' | 'DOKTER' | 'KASIR',
  full_name: string,
  customer_id?: string
}
```

**Workflow:**
```
Step 1: Authorization check
  → Jika caller.role != OWNER: throw FORBIDDEN

Step 2: Validate input via Zod (createUserSchema)

Step 3: Check username uniqueness (case-sensitive)
  → Jika exists: throw CONFLICT "Username already taken"

Step 4: Hash PIN (bcrypt, salt rounds = 12)

Step 5: Insert user with:
  - created_by = caller.id
  - is_active = true
  - failed_login_attempts = 0

Step 6: Insert audit_log:
  - action = 'CREATE_USER'
  - entity_type = 'users'
  - new_values = { id, username, role, created_by }

Step 7: Return user (without pin_hash)
```

**Edge Cases:**
- Owner mencoba membuat akun OWNER lain → ditolak (role OWNER hanya via seed)
- Username yang sama dengan user yang sudah di-soft-delete → tetap ditolak (unique constraint global)
- Admin mencoba membuat akun staff → ditolak di RLS + Edge Function

### 2.4 Workflow: Reset PIN

**Input:**
```typescript
{
  target_user_id: string,
  new_pin: string
}
```

**Workflow:**
```
Step 1: Authorization check
  - Fetch target_user
  - Jika target.role in [OWNER, ADMIN, DOKTER, KASIR] AND caller.role != OWNER:
    → throw FORBIDDEN
  - Jika target.role == CUSTOMER AND caller.role not in [OWNER, ADMIN]:
    → throw FORBIDDEN
  - Tidak boleh reset PIN sendiri via endpoint ini (gunakan change_pin)

Step 2: Validate new_pin via Zod

Step 3: Hash new_pin

Step 4: Update user:
  - pin_hash = new_hash
  - failed_login_attempts = 0
  - locked_until = null

Step 5: Insert audit_log:
  - action = 'RESET_PIN'
  - entity_id = target_user_id
  - new_values = { reset_by: caller.id }

Step 6: Return success
```

### 2.5 Workflow: Change PIN (Self)

**Input:**
```typescript
{
  old_pin: string,
  new_pin: string
}
```

**Workflow:**
```
Step 1: Fetch current user

Step 2: Verify old_pin matches pin_hash
  → Jika tidak match: throw 401 INVALID_OLD_PIN

Step 3: Validate new_pin

Step 4: Hash new_pin

Step 5: Update user

Step 6: Insert audit_log: action = 'CHANGE_PIN'

Step 7: Return success
```

### 2.6 RLS Policies — `users` Table

```sql
-- SELECT: semua authenticated users bisa lihat user lain (untuk referensi)
CREATE POLICY "Users can view all users" ON users
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: hanya Owner bisa buat staff, Owner+Admin bisa buat customer
CREATE POLICY "Owner can create staff" ON users
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) = 'OWNER'
    AND role IN ('ADMIN', 'DOKTER', 'KASIR')
  );

CREATE POLICY "Owner or Admin can create customer" ON users
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) IN ('OWNER', 'ADMIN')
    AND role = 'CUSTOMER'
  );

-- UPDATE: user bisa update diri sendiri (profile, pin); Owner bisa update semua
CREATE POLICY "Users can update self" ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Owner can update any user" ON users
  FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) = 'OWNER');

CREATE POLICY "Admin can update customers" ON users
  FOR UPDATE TO authenticated
  USING (
    get_user_role(auth.uid()) = 'ADMIN'
    AND role = 'CUSTOMER'
  );

-- DELETE: soft-delete only; same rules as update
```

---

## 3. Modul CRM & Pasien

### 3.1 Customers

#### 3.1.1 Contract

| Operasi | Method | Akses |
|---------|--------|-------|
| List customers | Query | Owner, Admin, Dokter (read), Kasir (read) |
| Get by ID | Query | Same as list |
| Create | RPC `fn_create_customer` | Owner, Admin |
| Update | RPC `fn_update_customer` | Owner, Admin |
| Soft delete | RPC `fn_delete_customer` | Owner, Admin |
| Convert guest → registered | RPC `fn_convert_guest` | Owner, Admin |
| Search | Query with `ilike` | Same as list |

#### 3.1.2 Workflow: Create Customer

**Input:**
```typescript
{
  name: string,
  phone?: string,
  email?: string,
  address?: string,
  emergency_contact?: string,
  photo_url?: string,
  notes?: string,
  is_guest?: boolean,
  tags?: ('VIP' | 'REGULAR' | 'NEW' | 'BLACKLIST')[],
  create_account?: boolean,
  username?: string,
  pin?: string
}
```

**Workflow:**
```
Step 1: Authorization check
  → Caller must be OWNER or ADMIN

Step 2: Validate via createCustomerSchema
  - Jika create_account = true: username & pin wajib
  - Jika username provided: validate uniqueness

Step 3: Insert customer with:
  - is_guest default = false (kecuali di-specify)
  - tags default = []
  - is_active = true

Step 4: Jika create_account = true:
  - Call fn_create_user internally dengan:
    - role = 'CUSTOMER'
    - customer_id = new_customer.id
    - created_by = caller.id
    - username & pin as provided
  - Jika username conflict: rollback customer creation

Step 5: Insert audit_log: action = 'CREATE_CUSTOMER'

Step 6: Return customer (with user if created)
```

**Edge Cases:**
- Email duplikat → diizinkan (tidak ada unique constraint pada email)
- Phone duplikat → diizinkan (satu keluarga bisa punya nomor sama)
- Guest customer tanpa data apapun → minimal `name` wajib
- Create account dengan username yang sudah dipakai user lain (role apapun) → ditolak

#### 3.1.3 Workflow: Convert Guest → Registered

**Input:**
```typescript
{
  customer_id: string,
  data: Partial<Customer>
}
```

**Workflow:**
```
Step 1: Fetch customer
  → Jika is_guest = false: throw ALREADY_REGISTERED

Step 2: Validate data

Step 3: Update customer:
  - is_guest = false
  - merge with provided data

Step 4: Insert audit_log: action = 'CONVERT_GUEST_TO_REGISTERED'

Step 5: Return updated customer
```

**Invariant:** Riwayat transaksi (invoices, appointments) tetap ter-link ke customer yang sama. Tidak ada data yang hilang.

### 3.2 Pets

#### 3.2.1 Contract

| Operasi | Method | Akses |
|---------|--------|-------|
| List by customer | Query | Owner, Admin, Dokter, Kasir, Customer (own) |
| Create | RPC `fn_create_pet` | Owner, Admin |
| Update | RPC `fn_update_pet` | Owner, Admin |
| Soft delete | RPC `fn_delete_pet` | Owner, Admin |
| Add weight log | RPC `fn_add_weight_log` | Owner, Admin, Dokter |
| Add vaccine | RPC `fn_add_vaccine` | Owner, Admin, Dokter |
| Add disease | RPC `fn_add_disease` | Owner, Admin, Dokter |
| Add allergy | RPC `fn_add_allergy` | Owner, Admin, Dokter |

#### 3.2.2 Workflow: Create Pet

**Input:**
```typescript
{
  customer_id: string,
  name: string,
  species: string,
  breed?: string,
  birth_date?: string,
  gender?: string,
  photo_url?: string,
  microchip_number?: string
}
```

**Workflow:**
```
Step 1: Verify customer exists AND is_active = true
  → Jika tidak: throw CUSTOMER_NOT_FOUND

Step 2: Validate via createPetSchema
  - birth_date tidak boleh di masa depan
  - species wajib (anjing/kucing/kelinci/dll)

Step 3: Insert pet

Step 4: Insert audit_log

Step 5: Return pet
```

**Edge Cases:**
- Customer yang sudah di-soft-delete → tidak bisa tambah pet
- `birth_date` di masa depan → ditolak
- Duplicate `microchip_number` → diizinkan (tidak ada unique constraint)

#### 3.2.3 Workflow: Add Vaccine

**Input:**
```typescript
{
  pet_id: string,
  vaccine_name: string,
  vaccination_date: string,
  due_date?: string,
  notes?: string
}
```

**Workflow:**
```
Step 1: Verify pet exists

Step 2: vaccination_date tidak boleh di masa depan

Step 3: Insert vaccine

Step 4: Jika due_date provided:
  - Schedule reminder H-14 via notifications table
  - Insert notification untuk customer (jika punya akun)

Step 5: Return vaccine
```

**Business Rule:** Vaksin "Overdue" dihitung di client-side:
```typescript
const isOverdue = (vaccine: PetVaccine) => {
  if (!vaccine.due_date) return false;
  return new Date(vaccine.due_date) < new Date() && vaccine.is_active;
};
```

---

## 4. Modul Appointments & Medical Records

### 4.1 Appointments

#### 4.1.1 State Machine

```
                    ┌─────────────┐
                    │   WAITING   │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              │              ▼
    ┌──────────────┐       │       ┌──────────────┐
    │ IN_PROGRESS  │       │       │  CANCELLED   │
    └──────┬───────┘       │       └──────────────┘
           │               │
           ▼               │
    ┌──────────────┐       │
    │     DONE     │◄──────┘
    └──────────────┘
```

**Transisi yang diizinkan:**
- `WAITING` → `IN_PROGRESS` (dokter mulai periksa)
- `WAITING` → `CANCELLED`
- `IN_PROGRESS` → `DONE`
- `IN_PROGRESS` → `CANCELLED` (rare, tapi diizinkan)

**Transisi yang DITOLAK:**
- `DONE` → apapun (final state)
- `CANCELLED` → apapun (final state)

#### 4.1.2 Contract

| Operasi | Method | Akses |
|---------|--------|-------|
| List | Query | Owner, Admin, Dokter (own+all read), Kasir (read) |
| Create | RPC `fn_create_appointment` | Owner, Admin, Customer (own) |
| Update status | RPC `fn_update_appointment_status` | Owner, Admin, Dokter (own) |
| Update details | RPC `fn_update_appointment` | Owner, Admin |
| Cancel | RPC `fn_cancel_appointment` | Owner, Admin, Customer (own, with reason) |

#### 4.1.3 Workflow: Create Appointment

**Input:**
```typescript
{
  customer_id: string,
  pet_id: string,
  doctor_id?: string,
  appointment_date: string,
  appointment_time: string,
  complaint?: string,
  notes?: string,
  is_from_portal?: boolean
}
```

**Workflow:**
```
Step 1: Validate via createAppointmentSchema
  - appointment_date tidak boleh di masa lalu (kecuali is_from_portal = false dan caller = Owner/Admin)
  - appointment_time dalam jam operasional (configurable)
  - Verify customer & pet exist & active
  - Verify pet belongs to customer

Step 2: Generate queue_number
  - RPC: SELECT COALESCE(MAX(queue_number), 0) + 1
    FROM appointments
    WHERE appointment_date = input.appointment_date
  - Atomic operation untuk hindari race condition

Step 3: Insert appointment with status = 'WAITING'

Step 4: Jika is_from_portal = true:
  - Insert notification untuk Admin: "New appointment request from {customer_name}"

Step 5: Schedule reminder H-1 via notification (jika customer punya akun)

Step 6: Insert audit_log

Step 7: Return appointment with queue_number
```

**Edge Cases:**
- Pet tidak belong to customer → ditolak
- Doctor tidak exist / bukan role DOKTER → ditolak
- Multiple appointments untuk pet yang sama di tanggal yang sama → diizinkan (tapi warning di UI)
- Appointment di hari libur → diizinkan (konfigurasi jam operasional di Settings)

#### 4.1.4 Workflow: Update Status

**Input:**
```typescript
{
  appointment_id: string,
  new_status: 'IN_PROGRESS' | 'DONE' | 'CANCELLED'
}
```

**Workflow:**
```
Step 1: Fetch appointment

Step 2: Validate state transition (lihat state machine)
  → Jika invalid: throw INVALID_STATE_TRANSITION

Step 3: Jika new_status = 'IN_PROGRESS':
  - Verify caller is assigned doctor OR caller is Owner/Admin

Step 4: Jika new_status = 'DONE':
  - Check if medical_record exists for this appointment
  - Jika belum ada: set flag `prompt_create_medical_record = true` di response
  - Update appointment status

Step 5: Update appointment

Step 6: Insert audit_log

Step 7: Return { appointment, prompt_create_medical_record? }
```

### 4.2 Medical Records

#### 4.2.1 Contract

| Operasi | Method | Akses |
|---------|--------|-------|
| List | Query | Owner, Admin, Dokter (all read, own write) |
| Create | RPC `fn_create_medical_record` | Dokter (own appointments) |
| Update | RPC `fn_update_medical_record` | Dokter (creator only) |
| Delete (soft) | RPC `fn_delete_medical_record` | Owner, Admin |
| Get by appointment | Query | Same as list |

#### 4.2.2 Workflow: Create Medical Record

**Input:**
```typescript
{
  appointment_id: string,
  chief_complaint?: string,
  history?: string,
  physical_exam?: string,
  weight_kg?: number,
  temperature_c?: number,
  heart_rate_bpm?: number,
  respiratory_rate_bpm?: number,
  diagnosis?: string,
  treatment?: string,
  prescription?: string,
  lab_results?: string,
  additional_notes?: string,
  attachments?: string[]
}
```

**Workflow:**
```
Step 1: Fetch appointment
  → Jika tidak exist: throw APPOINTMENT_NOT_FOUND
  → Jika status != 'IN_PROGRESS' dan caller bukan Owner/Admin:
    → throw APPOINTMENT_NOT_IN_PROGRESS

Step 2: Check if medical_record already exists for this appointment
  → Jika ya: throw MEDICAL_RECORD_ALREADY_EXISTS
  (Satu appointment = maksimal satu medical record)

Step 3: Verify caller is assigned doctor of the appointment
  → Jika tidak: throw FORBIDDEN (kecuali Owner)

Step 4: Generate record_number
  - Format: MR-YYYYMMDD-XXXX
  - RPC: atomic increment per hari

Step 5: Insert medical_record with status = 'OPEN'

Step 6: Insert audit_log

Step 7: Return medical_record
```

**Edge Cases:**
- Dokter lain mencoba edit medical record bukan miliknya → ditolak
- Appointment `status = DONE` tapi belum ada medical record → diizinkan (warning di UI)
- Attachment upload → via Supabase Storage, URL disimpan di array `attachments`

#### 4.2.3 Workflow: Update Medical Record

**Input:**
```typescript
{
  medical_record_id: string,
  updates: Partial<MedicalRecord>
}
```

**Workflow:**
```
Step 1: Fetch medical_record

Step 2: Verify caller is creator OR caller is Owner
  → Jika tidak: throw FORBIDDEN

Step 3: Validate updates via updateMedicalRecordSchema

Step 4: Update medical_record, set updated_at = NOW()

Step 5: Insert audit_log dengan old_values & new_values

Step 6: Return updated medical_record
```

---

## 5. Modul Pet Hotel

### 5.1 State Machines

#### 5.1.1 Booking State Machine

```
┌─────────┐     check-in     ┌─────────────┐    check-out    ┌──────────────┐
│ BOOKED  │ ───────────────► │ CHECKED_IN  │ ──────────────► │ CHECKED_OUT  │
└────┬────┘                  └─────────────┘                 └──────────────┘
     │                                                             
     │ cancel                                                      
     ▼                                                             
┌─────────────┐                                                    
│  CANCELLED  │                                                    
└─────────────┘                                                    
```

#### 5.1.2 Room State Machine

```
AVAILABLE ──reserve──► RESERVED ──check-in──► OCCUPIED ──check-out──► AVAILABLE
    ▲                                           │
    │                                           │
    └─────── mark clean ──── UNDER_CLEANING ◄───┘

MAINTENANCE ◄── set maintenance ─── (dari status manapun kecuali OCCUPIED)
(available) ──► clear maintenance ──► AVAILABLE
```

### 5.2 Contract

| Operasi | Method | Akses |
|---------|--------|-------|
| List rooms | Query | Owner, Admin, Dokter (read), Kasir (read) |
| Create room | RPC | Owner, Admin |
| Update room | RPC | Owner, Admin |
| List bookings | Query | Same as rooms |
| Create booking | RPC `fn_create_pet_hotel_booking` | Owner, Admin, Customer (own) |
| Check-in | RPC `fn_pet_hotel_checkin` | Owner, Admin |
| Check-out | RPC `fn_pet_hotel_checkout` | Owner, Admin |
| Add log | RPC `fn_add_pet_hotel_log` | Owner, Admin |
| Extend booking | RPC `fn_extend_pet_hotel_booking` | Owner, Admin |
| Cancel booking | RPC `fn_cancel_pet_hotel_booking` | Owner, Admin, Customer (own) |

### 5.3 Workflow: Create Booking

**Input:**
```typescript
{
  pet_id: string,
  customer_id: string,
  room_id?: string,
  check_in_date: string,
  check_out_date: string,
  price_per_night?: number,
  special_notes?: string,
  is_from_portal?: boolean
}
```

**Workflow:**
```
Step 1: Validate dates
  - check_in_date >= TODAY
  - check_out_date > check_in_date
  - Verify pet belongs to customer

Step 2: Jika room_id provided:
  - Check room availability for date range
  - RPC: check overlapping bookings with status in [BOOKED, CHECKED_IN]
  - Jika occupied: throw ROOM_NOT_AVAILABLE

Step 3: Jika price_per_night not provided:
  - Fetch from room.price_per_night

Step 4: Calculate total_price:
  - nights = (check_out_date - check_in_date) in days
  - total_price = nights * price_per_night

Step 5: Generate booking_number: BK-YYYYMMDD-XXXX (atomic)

Step 6: Insert booking with status = 'BOOKED'

Step 7: Jika room_id provided:
  - Update room status = 'RESERVED' (jika room sebelumnya AVAILABLE)

Step 8: Insert audit_log

Step 9: Return booking
```

### 5.4 Workflow: Check-in

**Input:**
```typescript
{
  booking_id: string,
  actual_room_id?: string
}
```

**Workflow:**
```
Step 1: Fetch booking
  → Jika status != 'BOOKED': throw INVALID_STATE

Step 2: Jika actual_room_id provided dan berbeda dari booking.room_id:
  - Check new room availability
  - Release old room (set AVAILABLE)
  - Reserve new room (set RESERVED)
  - Update booking.room_id

Step 3: Update booking:
  - status = 'CHECKED_IN'
  - actual_check_in_at = NOW()

Step 4: Update room status = 'OCCUPIED'

Step 5: Insert audit_log

Step 6: Return booking
```

### 5.5 Workflow: Check-out

**Input:**
```typescript
{
  booking_id: string,
  actual_check_out_date?: string
}
```

**Workflow:**
```
Step 1: Fetch booking
  → Jika status != 'CHECKED_IN': throw INVALID_STATE

Step 2: Determine actual_check_out_at:
  - Jika provided: use it
  - Else: NOW()

Step 3: Recalculate total_price berdasarkan actual stay:
  - actual_nights = ceil((actual_check_out_at - actual_check_in_at) in days)
  - new_total = actual_nights * price_per_night
  - Update booking.total_price

Step 4: Update booking:
  - status = 'CHECKED_OUT'
  - actual_check_out_at

Step 5: Update room:
  - status = 'AVAILABLE'
  - cleanliness = 'DIRTY' (perlu dibersihkan untuk guest berikutnya)

Step 6: Auto-create or update invoice:
  - RPC `fn_create_pet_hotel_invoice_item`
  - Jika customer sudah punya invoice UNPAID untuk kunjungan ini: add item
  - Else: create new invoice with type = 'PET_HOTEL'

Step 7: Insert audit_log

Step 8: Return booking
```

**Edge Cases:**
- Check-out di tengah malam (melewati midnight) → dihitung 1 hari tambahan
- Check-out lebih awal dari rencana → tidak ada refund otomatis (kebijakan bisnis)
- Check-out lebih lama dari rencana → charge tambahan otomatis
- Room rusak saat occupansi → pindah room via check-in ulang dengan `actual_room_id`

### 5.6 Workflow: Add Pet Hotel Log

**Input:**
```typescript
{
  booking_id: string,
  log_type: 'FEEDING' | 'MEDICINE' | 'NOTE',
  description?: string,
  photo_urls?: string[]
}
```

**Workflow:**
```
Step 1: Fetch booking
  → Jika status != 'CHECKED_IN': throw BOOKING_NOT_ACTIVE

Step 2: Validate log_type: 'FEEDING' | 'MEDICINE' | 'NOTE'

Step 3: Insert log with logged_at = NOW()

Step 4: Return log
```

---

## 6. Modul Grooming

### 6.1 State Machine

```
┌─────────┐   start    ┌─────────────┐   finish   ┌──────┐
│ BOOKED  │ ─────────► │ IN_PROGRESS │ ─────────► │ DONE │
└────┬────┘            └─────────────┘            └──────┘
     │
     │ cancel
     ▼
┌─────────────┐
│  CANCELLED  │
└─────────────┘
```

### 6.2 Contract

| Operasi | Method | Akses |
|---------|--------|-------|
| List services | Query | All authenticated |
| Create service | RPC | Owner, Admin |
| List bookings | Query | Owner, Admin, Groomer (own), Customer (own) |
| Create booking | RPC `fn_create_grooming_booking` | Owner, Admin, Customer (own) |
| Start grooming | RPC `fn_start_grooming` | Owner, Admin, Groomer (own) |
| Finish grooming | RPC `fn_finish_grooming` | Owner, Admin, Groomer (own) |
| Create record | RPC `fn_create_grooming_record` | Owner, Admin, Groomer (own) |
| Cancel | RPC `fn_cancel_grooming` | Owner, Admin, Customer (own) |

### 6.3 Workflow: Create Grooming Booking

**Input:**
```typescript
{
  pet_id: string,
  customer_id: string,
  groomer_id?: string,
  service_id: string,
  appointment_date: string,
  appointment_time: string,
  notes?: string,
  is_from_portal?: boolean
}
```

**Workflow:**
```
Step 1: Validate
  - Verify pet belongs to customer
  - Verify service exists and is_active
  - Verify groomer (if provided) has role that allows grooming

Step 2: Check groomer availability (optional, berdasarkan config)
  - Query existing bookings di slot waktu yang sama
  - Jika overlap: throw GROOMER_NOT_AVAILABLE

Step 3: Calculate total_price:
  - base_price dari service
  - + size adjustment (jika ada)
  - + addons (jika ada)

Step 4: Generate booking_number: GR-YYYYMMDD-XXXX (atomic)

Step 5: Insert booking with status = 'BOOKED'

Step 6: Insert audit_log

Step 7: Return booking
```

### 6.4 Workflow: Finish Grooming

**Input:**
```typescript
{
  booking_id: string,
  skin_condition?: string,
  flea_tick_found?: boolean,
  recommendations?: string,
  before_photo_url?: string,
  after_photo_url?: string
}
```

**Workflow:**
```
Step 1: Fetch booking
  → Jika status != 'IN_PROGRESS': throw INVALID_STATE

Step 2: Update booking status = 'DONE'

Step 3: Insert grooming_record with all fields

Step 4: Auto-create invoice item:
  - RPC `fn_create_grooming_invoice_item`
  - Type = 'GROOMING'

Step 5: Insert audit_log

Step 6: Return { booking, record }
```

---

## 7. Modul Petshop & Inventory

### 7.1 Products

#### 7.1.1 Contract

| Operasi | Method | Akses |
|---------|--------|-------|
| List | Query | All authenticated (Customer: read only active) |
| Create | RPC `fn_create_product` | Owner, Admin |
| Update | RPC `fn_update_product` | Owner, Admin |
| Archive | RPC `fn_archive_product` | Owner |
| Hard delete | RPC `fn_delete_product` | Owner (only if no transactions) |
| Get by SKU | Query | Same as list |
| Search by barcode | Query | Same as list |

#### 7.1.2 Workflow: Create Product

**Input:**
```typescript
{
  sku: string,
  name: string,
  category_id?: string,
  supplier_id?: string,
  barcode?: string,
  description?: string,
  purchase_price: number,
  selling_price: number,
  stock_quantity?: number,
  stock_minimum?: number,
  stock_maximum?: number,
  photo_url?: string,
  expiry_date?: string
}
```

**Workflow:**
```
Step 1: Validate via createProductSchema
  - selling_price >= purchase_price (warning, not error)
  - stock_minimum <= stock_maximum (jika keduanya provided)

Step 2: Check SKU uniqueness
  → Jika exists: throw SKU_ALREADY_EXISTS

Step 3: Check barcode uniqueness (jika provided)
  → Jika exists: throw BARCODE_ALREADY_EXISTS

Step 4: Insert product with status = 'ACTIVE'

Step 5: Jika stock_quantity > 0:
  - Insert stock_movement: type = 'IN', quantity = stock_quantity
  - reference_type = 'INITIAL_STOCK'

Step 6: Insert audit_log

Step 7: Return product
```

**Edge Cases:**
- SKU dengan spasi → ditolak di Zod
- `selling_price < purchase_price` → warning di UI, tapi diizinkan (bisa saja clearance)
- `expiry_date` di masa lalu → ditolak

#### 7.1.3 Workflow: Archive vs Delete

**`fn_archive_product(product_id)`:**
- Caller must be OWNER
- Update `status = 'ARCHIVED'`
- Product tetap muncul di historical invoices
- Tidak muncul di POS grid

**`fn_delete_product(product_id)`:**
- Caller must be OWNER
- Check: tidak ada `InvoiceItem` yang mereferensikan `product_id`
- Check: tidak ada `StockMovement` yang mereferensikan `product_id`
- Jika ada referensinya: throw `CANNOT_DELETE_HAS_REFERENCES`
- Jika bersih: hard delete

### 7.2 Inventory

#### 7.2.1 Contract

| Operasi | Method | Akses |
|---------|--------|-------|
| Get stock by product | Query | Owner, Admin, Kasir (read) |
| Record movement | RPC `fn_record_stock_movement` | Owner, Admin |
| Stock opname | RPC `fn_stock_opname` | Owner, Admin |
| Get low stock | Query | Owner, Admin |
| Get movements by product | Query | Owner, Admin |

#### 7.2.2 Workflow: Record Stock Movement (Atomic)

**Input:**
```typescript
{
  product_id: string,
  movement_type: 'IN' | 'OUT' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGED' | 'EXPIRED' | 'OPNAME',
  quantity: number,
  reference_type?: string,
  reference_id?: string,
  notes?: string
}
```

**Workflow:**
```
Step 1: Validate
  - quantity != 0
  - movement_type valid
  - Untuk OUT/RETURN/DAMAGED/EXPIRED: quantity harus positif (sistem yang negate)

Step 2: Determine signed_quantity:
  - IN, RETURN: +quantity
  - OUT, DAMAGED, EXPIRED: -quantity
  - ADJUSTMENT, OPNAME: signed quantity (bisa + atau -)

Step 3: Atomic stock update via RPC:
  ```sql
  UPDATE products
  SET stock_quantity = stock_quantity + signed_quantity,
      updated_at = NOW()
  WHERE id = product_id
    AND (
      signed_quantity >= 0  -- always allow increase
      OR stock_quantity + signed_quantity >= 0  -- prevent negative stock
    )
  RETURNING *;
  ```
  → Jika tidak ada row returned: throw INSUFFICIENT_STOCK

Step 4: Insert stock_movement record

Step 5: Check low stock alert:
  Jika new_stock < stock_minimum:
  Insert notification untuk Admin & Owner

Step 6: Insert audit_log

Step 7: Return { movement, new_stock }
```

**Edge Cases:**
- Concurrent stock updates → atomic SQL prevents race condition
- Stock menjadi negatif → ditolak di SQL guard
- Movement dengan reference ke invoice yang di-cancel → handled oleh `cancel_invoice` RPC

#### 7.2.3 Workflow: Stock Opname

**Input:**
```typescript
{
  product_id: string,
  actual_quantity: number,
  notes?: string
}
```

**Workflow:**
```
Step 1: Fetch current product

Step 2: Calculate difference = actual_quantity - current_stock

Step 3: Jika difference = 0: throw NO_CHANGE_NEEDED

Step 4: Call fn_record_stock_movement dengan:
  - movement_type = 'OPNAME'
  - quantity = difference (signed)
  - notes = `Opname: ${current_stock} → ${actual_quantity}. ${notes}`

Step 5: Return movement
```

### 7.3 Purchase Orders

#### 7.3.1 State Machine

```
┌─────────┐   send    ┌──────┐   receive all   ┌──────────┐
│  DRAFT  │ ────────► │ SENT │ ───────────────►│ RECEIVED │
└────┬────┘           └──┬───┘                 └──────────┘
     │                   │
     │ cancel            │ partial receive
     ▼                   ▼
┌─────────────┐   ┌───────────────────┐
│  CANCELLED  │   │ PARTIAL_RECEIVED  │ ──► RECEIVED
└─────────────┘   └───────────────────┘
```

#### 7.3.2 Contract

| Operasi | Method | Akses |
|---------|--------|-------|
| List | Query | Owner, Admin |
| Create | RPC `fn_create_po` | Owner, Admin |
| Update (DRAFT only) | RPC `fn_update_po` | Owner, Admin |
| Send | RPC `fn_send_po` | Owner, Admin |
| Receive | RPC `fn_receive_po` | Owner, Admin |
| Cancel | RPC `fn_cancel_po` | Owner, Admin |

#### 7.3.3 Workflow: Receive PO

**Input:**
```typescript
{
  po_id: string,
  actual_arrival_date: string,
  items: Array<{
    po_item_id: string,
    received_quantity: number
  }>
}
```

**Workflow:**
```
Step 1: Fetch PO
  → Jika status in [RECEIVED, CANCELLED]: throw INVALID_STATE

Step 2: Update PO:
  - status = 'RECEIVED' (jika semua item fully received)
  - status = 'PARTIAL_RECEIVED' (jika ada yang kurang)
  - actual_arrival_date

Step 3: For each item:
  - Update purchase_order_item.received_quantity
  - Call fn_record_stock_movement:
    - movement_type = 'IN'
    - quantity = received_quantity
    - reference_type = 'PURCHASE_ORDER'
    - reference_id = po_id

Step 4: Update PO total_amount (jika ada perubahan)

Step 5: Insert audit_log

Step 6: Return PO with items
```

**Edge Cases:**
- Receive lebih banyak dari yang di-order → diizinkan (bonus dari supplier), tapi warning
- Receive lebih sedikit → `status = PARTIAL_RECEIVED`, bisa receive lagi nanti
- PO yang sudah RECEIVED tidak bisa diubah

---

## 8. Modul POS & Billing

### 8.1 Invoice State Machine

```
┌─────────┐  payment   ┌──────────────────┐  full payment   ┌──────┐
│ UNPAID  │ ─────────► │ PARTIAL_PAYMENT  │ ──────────────► │ PAID │
└────┬────┘            └──────────────────┘                 └──────┘
     │
     │ cancel
     ▼
┌─────────────┐
│  CANCELLED  │
└─────────────┘
```

### 8.2 Contract

| Operasi | Method | Akses |
|---------|--------|-------|
| List invoices | Query | Owner, Admin, Kasir, Customer (own) |
| Create invoice | RPC `fn_create_invoice` | Owner, Admin, Kasir |
| Record payment | RPC `fn_record_payment` | Owner, Admin, Kasir |
| Cancel invoice | RPC `fn_cancel_invoice` | Owner, Admin |
| Get invoice detail | Query | Same as list |
| Get daily sales | RPC `fn_get_daily_sales` | Owner, Admin, Kasir (own) |

### 8.3 Workflow: Create Invoice (POS Checkout)

**Input:**
```typescript
{
  invoice_type: 'POS' | 'CLINICAL' | 'PET_HOTEL' | 'GROOMING' | 'MIXED',
  customer_id?: string,
  items: Array<{
    item_type: string,
    product_id?: string,
    procedure_id?: string,
    pet_hotel_booking_id?: string,
    grooming_booking_id?: string,
    description: string,
    quantity?: number,
    unit_price: number
  }>,
  discount_amount?: number,
  tax_amount?: number,
  promotion_id?: string,
  loyalty_points_to_redeem?: number,
  notes?: string
}
```

**Workflow:**
```
Step 1: Validate via createInvoiceSchema

Step 2: Calculate subtotal:
  subtotal = SUM(item.quantity * item.unit_price)

Step 3: Validate promotion (if provided):
  - Fetch promotion
  - Check status = 'ACTIVE'
  - Check start_date <= TODAY <= end_date
  - Check max_usage (current_usage < max_usage)
  - Check min_purchase (subtotal >= min_purchase)
  - Check applicable_products (if specified)
  - Calculate discount from promotion
  → Jika invalid: throw PROMOTION_INVALID

Step 4: Validate loyalty points (if provided):
  - Fetch loyalty_member by customer_id
  - Check available_points >= loyalty_points_to_redeem
  - Calculate discount: points * point_value (e.g., 1 point = Rp 100)
  → Jika insufficient: throw INSUFFICIENT_LOYALTY_POINTS

Step 5: Calculate totals:
  promotion_discount = calculate from promotion
  loyalty_discount = loyalty_points_to_redeem * point_value
  total_discount = discount_amount + promotion_discount + loyalty_discount
  total_amount = (subtotal - total_discount) + tax_amount

Step 6: Validate stock for PRODUCT items (atomic):
  For each item where item_type = 'PRODUCT':
    SELECT stock_quantity FROM products WHERE id = product_id FOR UPDATE
    Jika stock < quantity: throw INSUFFICIENT_STOCK { product_name }

Step 7: Generate invoice_number: INV-YYYYMMDD-XXXX (atomic)

Step 8: Insert invoice (status = 'UNPAID')

Step 9: Insert all invoice_items

Step 10: Deduct stock for PRODUCT items (atomic):
  For each PRODUCT item:
    UPDATE products SET stock_quantity = stock_quantity - quantity
    INSERT stock_movement (type = 'OUT', reference = invoice_id)

Step 11: Update promotion usage (if used):
  UPDATE promotions SET current_usage = current_usage + 1
  INSERT promotion_usage

Step 12: Redeem loyalty points (if used):
  Call fn_redeem_loyalty_points

Step 13: Insert audit_log

Step 14: Return invoice with items
```

**Critical:** Step 6-10 **HARUS** dalam satu transaction untuk mencegah oversell.

**Edge Cases:**
- Concurrent checkout untuk produk yang sama → atomic SQL prevents oversell
- Promotion expired saat checkout → ditolak di validasi
- Customer tidak punya loyalty account tapi mau redeem → ditolak
- Invoice tanpa customer (walk-in) → loyalty & promotion tidak bisa dipakai (kecuali dikonfigurasi lain)

### 8.4 Workflow: Record Payment

**Input:**
```typescript
{
  invoice_id: string,
  payment_method: 'CASH' | 'QRIS' | 'TRANSFER' | 'E_WALLET' | 'CREDIT_CARD' | 'MIXED',
  amount: number,
  reference_number?: string,
  notes?: string
}
```

**Workflow:**
```
Step 1: Fetch invoice
  → Jika status = 'CANCELLED': throw INVOICE_CANCELLED
  → Jika status = 'PAID': throw INVOICE_ALREADY_PAID

Step 2: Validate amount > 0

Step 3: Calculate new paid_amount:
  new_paid = invoice.paid_amount + amount

Step 4: Insert payment record

Step 5: Update invoice:
  paid_amount = new_paid
  Determine new status:
    new_paid = 0 → UNPAID (tidak mungkin karena amount > 0)
    0 < new_paid < total → PARTIAL_PAYMENT
    new_paid >= total → PAID

Step 6: Jika status berubah menjadi PAID:
  - Call fn_award_loyalty_points (jika customer registered)
  - Insert notification untuk customer: "Pembayaran berhasil"
  - Trigger feedback request (H+1 via scheduled job)

Step 7: Insert audit_log

Step 8: Return { payment, invoice }
```

### 8.5 Workflow: Cancel Invoice

**Input:**
```typescript
{
  invoice_id: string,
  reason?: string
}
```

**Workflow:**
```
Step 1: Fetch invoice with items
  → Jika status = 'CANCELLED': throw ALREADY_CANCELLED

Step 2: Update invoice status = 'CANCELLED'

Step 3: Restore stock for PRODUCT items:
  For each item where item_type = 'PRODUCT':
    UPDATE products SET stock_quantity = stock_quantity + (quantity)
    INSERT stock_movement (type = 'RETURN', reference = invoice_id)

Step 4: Reverse loyalty points (if awarded):
  Call fn_reverse_loyalty_points

Step 5: Reverse promotion usage (if used):
  UPDATE promotions SET current_usage = current_usage - 1
  DELETE promotion_usage where invoice_id

Step 6: Handle refund (jika ada pembayaran):
  - Create refund record (business decision)
  - Insert audit_log dengan refund details

Step 7: Insert audit_log: action = 'CANCEL_INVOICE'

Step 8: Return invoice
```

**Edge Cases:**
- Invoice yang sudah PAID dan ada pembayaran cash → refund manual di luar sistem (catat di notes)
- Invoice dengan item PET_HOTEL yang sudah CHECKED_OUT → tetap bisa cancel, tapi pet hotel booking tidak otomatis berubah status
- Partial payment yang sudah diterima → refund logic perlu kebijakan bisnis (TBD)

### 8.6 Workflow: Cash Shift

**Open Shift:**
- Kasir login → sistem auto-create `cash_shift` dengan:
  - `open_time = NOW()`
  - `opening_cash = input dari kasir` (modal awal)

**Close Shift:**
- Kasir klik "Tutup Shift"
- Input `closing_cash` (uang fisik di laci)
- Sistem hitung `expected_cash`:
  ```typescript
  expected = opening_cash + SUM(payments where method = 'CASH')
  ```
- Calculate `difference = closing_cash - expected`
- Update `cash_shift` dengan `close_time`, `closing_cash`, `expected_cash`, `difference`
- Jika `difference != 0`: flag untuk review oleh Admin/Owner

---

## 9. Modul Engagement & Loyalty

### 9.1 Loyalty Program

#### 9.1.1 Contract

| Operasi | Method | Akses |
|---------|--------|-------|
| Get member by customer | Query | Owner, Admin, Customer (own) |
| Earn points | RPC `fn_earn_loyalty_points` | System (triggered by payment) |
| Redeem points | RPC `fn_redeem_loyalty_points` | Owner, Admin, Kasir, Customer (own) |
| Reverse points | RPC `fn_reverse_loyalty_points` | System (triggered by cancel) |
| Get transaction history | Query | Owner, Admin, Customer (own) |
| Check tier upgrade | RPC `fn_check_tier_upgrade` | System (triggered by earn) |

#### 9.1.2 Workflow: Earn Points (Auto-triggered)

**Trigger:** Invoice status berubah ke PAID

**Input:**
```typescript
{
  customer_id: string,
  invoice_id: string,
  total_amount: number
}
```

**Workflow:**
```
Step 1: Fetch loyalty_member by customer_id
  → Jika tidak ada: skip (guest customer)

Step 2: Fetch loyalty_tier by member.tier_id

Step 3: Calculate points:
  base_points = floor(total_amount / 10000)  // Rp 10.000 = 1 point
  final_points = floor(base_points * tier.point_multiplier)

Step 4: Update loyalty_member:
  total_points += final_points
  available_points += final_points
  total_spending += total_amount

Step 5: Insert loyalty_transaction:
  transaction_type = 'EARN'
  points = final_points
  invoice_id
  description = `Earned from invoice ${invoice_number}`

Step 6: Check tier upgrade:
  Call fn_check_tier_upgrade

Step 7: Return transaction
```

#### 9.1.3 Workflow: Redeem Points

**Input:**
```typescript
{
  customer_id: string,
  points_to_redeem: number,
  invoice_id?: string
}
```

**Workflow:**
```
Step 1: Fetch loyalty_member
  → Jika tidak ada: throw NO_LOYALTY_ACCOUNT

Step 2: Validate:
  - available_points >= points_to_redeem
  - points_to_redeem > 0
  - Tier allows redemption (check tier benefits)
  → Jika insufficient: throw INSUFFICIENT_POINTS

Step 3: Calculate discount:
  discount_value = points_to_redeem * 100  // 1 point = Rp 100

Step 4: Update loyalty_member:
  available_points -= points_to_redeem
  total_points -= points_to_redeem (optional, tergantung kebijakan)

Step 5: Insert loyalty_transaction:
  transaction_type = 'REDEEM'
  points = -points_to_redeem
  invoice_id

Step 6: Return { transaction, discount_value }
```

#### 9.1.4 Workflow: Check Tier Upgrade

**Input:**
```typescript
{
  member_id: string
}
```

**Workflow:**
```
Step 1: Fetch member with current tier

Step 2: Fetch all tiers ordered by min_points ASC

Step 3: Find highest tier where member qualifies:
  member.total_points >= tier.min_points
  OR member.total_spending >= tier.min_spending

Step 4: Jika qualified tier > current tier:
  - Update member.tier_id
  - Insert notification: "Selamat! Anda naik ke tier {tier_name}"
  - Insert audit_log

Step 5: Return { upgraded: boolean, new_tier? }
```

### 9.2 Promotions

#### 9.2.1 Contract

| Operasi | Method | Akses |
|---------|--------|-------|
| List | Query | All authenticated |
| Create | RPC `fn_create_promotion` | Owner, Admin |
| Update | RPC `fn_update_promotion` | Owner, Admin |
| Cancel | RPC `fn_cancel_promotion` | Owner, Admin |
| Validate code | RPC `fn_validate_promo_code` | Owner, Admin, Kasir, Customer |
| Apply to invoice | (done inside `fn_create_invoice`) | — |

#### 9.2.2 Workflow: Validate Promo Code

**Input:**
```typescript
{
  code: string,
  subtotal: number,
  customer_id?: string
}
```

**Workflow:**
```
Step 1: Fetch promotion by code
  → Jika tidak ada: throw PROMO_NOT_FOUND

Step 2: Validate:
  - status = 'ACTIVE'
  - start_date <= TODAY <= end_date
  - current_usage < max_usage (jika max_usage set)
  - subtotal >= min_purchase
  - Jika applicable_products specified: check items (done at invoice level)
  - Jika promotion_type = 'BIRTHDAY': check customer birth month
  - Jika promotion_type = 'HAPPY_HOUR': check current time

Step 3: Calculate discount:
  PERCENTAGE: subtotal * (discount_value / 100)
  FIXED: discount_value
  BUNDLE/HAPPY_HOUR/BIRTHDAY: sesuai konfigurasi

Step 4: Return { valid: true, promotion, discount_amount }
```

### 9.3 Customer Feedback

#### 9.3.1 Contract

| Operasi | Method | Akses |
|---------|--------|-------|
| Create | RPC `fn_create_feedback` | Customer (own invoices) |
| List | Query | Owner, Admin |
| Get by invoice | Query | Owner, Admin, Customer (own) |

#### 9.3.2 Workflow: Create Feedback

**Input:**
```typescript
{
  customer_id: string,
  invoice_id?: string,
  rating: '1' | '2' | '3' | '4' | '5',
  comment?: string,
  nps_score?: number
}
```

**Workflow:**
```
Step 1: Validate:
  - rating in [1, 2, 3, 4, 5]
  - Jika invoice_id provided: verify invoice belongs to customer
  - Check if feedback already exists for this invoice
  → Jika ya: throw FEEDBACK_ALREADY_EXISTS

Step 2: Insert feedback

Step 3: Insert notification untuk Admin: "New feedback received"

Step 4: Return feedback
```

---

## 10. Modul Keuangan & Operasional

### 10.1 Expenses

#### 10.1.1 Contract

| Operasi | Method | Akses |
|---------|--------|-------|
| List | Query | Owner, Admin |
| Create | RPC `fn_create_expense` | Owner, Admin |
| Update (PENDING only) | RPC `fn_update_expense` | Owner, Admin |
| Approve | RPC `fn_approve_expense` | Owner |
| Reject | RPC `fn_reject_expense` | Owner |
| Reverse | RPC `fn_reverse_expense` | Owner |

#### 10.1.2 Workflow: Create Expense

**Input:**
```typescript
{
  expense_date: string,
  category_id: string,
  amount: number,
  description?: string,
  receipt_url?: string,
  is_recurring?: boolean,
  recurring_day?: number
}
```

**Workflow:**
```
Step 1: Validate
  - expense_date <= TODAY
  - amount > 0
  - category exists

Step 2: Insert expense with status = 'PENDING'
  created_by = caller.id

Step 3: Insert audit_log

Step 4: Return expense
```

#### 10.1.3 Workflow: Approve/Reject/Reverse

**Approve:**
- Caller must be OWNER
- Expense status must be PENDING
- Update `status = 'APPROVED'`, `approved_by = caller.id`

**Reject:**
- Caller must be OWNER
- Expense status must be PENDING
- Update `status = 'REJECTED'`

**Reverse** (untuk APPROVED expense):
- Caller must be OWNER
- Expense status must be APPROVED
- Update `status = 'REVERSED'`
- Insert `audit_log` dengan reason

### 10.2 Reports

Reports adalah read-only queries. Tiap report memiliki contract sendiri.

#### 10.2.1 Revenue Report

**Input:**
```typescript
{
  start_date: string,
  end_date: string,
  group_by: 'day' | 'week' | 'month'
}
```

**Output:**
```typescript
{
  total_revenue: number,
  breakdown: Array<{
    period: string,
    pos_revenue: number,
    clinical_revenue: number,
    pet_hotel_revenue: number,
    grooming_revenue: number,
    total: number
  }>,
  chart_data: Array<{...}>
}
```

**Query Logic:**
```sql
SUM(invoices.total_amount) WHERE status = 'PAID'
GROUP BY invoice_type, date period
Exclude CANCELLED invoices
```

#### 10.2.2 Profit & Loss Report

**Input:**
```typescript
{
  start_date: string,
  end_date: string
}
```

**Output:**
```typescript
{
  revenue: number,
  cogs: number,  // cost of goods sold (from stock movements OUT * purchase_price)
  expenses: number,
  net_profit: number
}
```

**Query Logic:**
```sql
revenue = SUM(paid invoices)
cogs = SUM(stock_movement OUT qty * product.purchase_price)
expenses = SUM(approved expenses)
net_profit = revenue - cogs - expenses
```

#### 10.2.3 Inventory Valuation Report

**Input:**
```typescript
{
  as_of_date: string
}
```

**Output:**
```typescript
{
  total_value: number,
  items: Array<{
    product_id: string,
    sku: string,
    name: string,
    stock_quantity: number,
    purchase_price: number,
    value: number
  }>
}
```

**Query Logic:**
```sql
value = stock_quantity * purchase_price
total_value = SUM(value)
```

### 10.3 Settings

Settings adalah konfigurasi sistem. Disimpan di tabel `settings` (key-value) atau tabel khusus.

#### 10.3.1 Contract

| Key | Tipe | Default |
|-----|------|---------|
| `clinic.name` | string | 'Petora' |
| `clinic.logo_url` | string | null |
| `clinic.address` | string | null |
| `clinic.operating_hours` | JSON | `{ open: '08:00', close: '20:00' }` |
| `clinic.timezone` | string | 'Asia/Jakarta' |
| `numbering.invoice_prefix` | string | 'INV' |
| `numbering.medical_record_prefix` | string | 'MR' |
| `numbering.booking_prefix` | string | 'BK' |
| `numbering.grooming_prefix` | string | 'GR' |
| `numbering.po_prefix` | string | 'PO' |
| `security.pin_length` | integer | 6 |
| `security.max_login_attempts` | integer | 5 |
| `security.lockout_duration_minutes` | integer | 15 |
| `loyalty.point_value` | integer | 100 (Rp per point) |
| `loyalty.min_transaction_for_points` | integer | 10000 |
| `tax.default_rate` | decimal | 0 |
| `tax.enabled` | boolean | false |

#### 10.3.2 Workflow: Update Setting

**Input:**
```typescript
{
  key: string,
  value: any
}
```

**Workflow:**
```
Step 1: Verify caller is OWNER

Step 2: Validate key exists in allowed keys

Step 3: Validate value type matches expected type

Step 4: Upsert settings table

Step 5: Insert audit_log

Step 6: Return setting
```

---

## 11. Modul Customer Portal

### 11.1 Contract Overview

Portal customer menggunakan kontrak yang sama dengan staff dashboard, tapi dengan scope terbatas pada data milik sendiri (enforced by RLS).

### 11.2 Workflow: Book Appointment via Portal

```
Step 1: Customer login ke /portal

Step 2: Navigate to Appointments → "Book New"

Step 3: Select pet (from own pets list)

Step 4: Select date & time (dalam jam operasional)

Step 5: Input complaint

Step 6: Submit
  - Call fn_create_appointment dengan is_from_portal = true
  - Status = 'WAITING'

Step 7: Notification sent to Admin

Step 8: Confirmation shown to customer
```

### 11.3 Workflow: Book Grooming via Portal

```
Step 1: Navigate to Grooming → "Book New"

Step 2: Select pet

Step 3: Select service package

Step 4: Select date & time

Step 5: Submit
  - Call fn_create_grooming_booking dengan is_from_portal = true

Step 6: Confirmation shown
```

### 11.4 Workflow: Book Pet Hotel via Portal

```
Step 1: Navigate to Pet Hotel → "Book New"

Step 2: Select pet

Step 3: Select date range

Step 4: Select room (from available rooms)

Step 5: Input special notes

Step 6: Submit
  - Call fn_create_pet_hotel_booking dengan is_from_portal = true

Step 7: Confirmation shown
```

### 11.5 Workflow: Pay Invoice Online

```
Step 1: Navigate to Invoices

Step 2: Select unpaid invoice

Step 3: Click "Pay Now"

Step 4: Select payment method (QRIS/E-Wallet/Transfer)

Step 5: Redirect to payment gateway (Midtrans/Xendit)

Step 6: Payment gateway callback → update invoice status

Step 7: Notification sent to customer
```

### 11.6 Workflow: Shop (E-Commerce Ringan)

```
Step 1: Browse products (hanya ACTIVE)

Step 2: Add to cart (local state)

Step 3: Checkout
  - Select delivery method (pickup/delivery)
  - Input address (jika delivery)

Step 4: Payment via payment gateway

Step 5: Invoice created dengan type = 'POS'

Step 6: Stock deducted

Step 7: Order tracking available di portal
```

---

## 12. Cross-Cutting Contracts

### 12.1 Number Generation (Atomic)

```sql
-- Function untuk generate nomor urut per hari
CREATE OR REPLACE FUNCTION fn_generate_sequence_number(
  p_prefix TEXT,
  p_date DATE
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sequence INTEGER;
  v_date_str TEXT;
BEGIN
  v_date_str := TO_CHAR(p_date, 'YYYYMMDD');
  -- Atomic increment dengan row lock
  INSERT INTO sequence_counters (prefix, date, current_value)
  VALUES (p_prefix, v_date_str, 1)
  ON CONFLICT (prefix, date)
  DO UPDATE SET current_value = sequence_counters.current_value + 1
  RETURNING current_value INTO v_sequence;
  RETURN p_prefix || '-' || v_date_str || '-' || LPAD(v_sequence::TEXT, 4, '0');
END;
$$;
```

**Usage:**
- Invoice: `fn_generate_sequence_number('INV', CURRENT_DATE)`
- Medical Record: `fn_generate_sequence_number('MR', CURRENT_DATE)`
- Pet Hotel Booking: `fn_generate_sequence_number('BK', CURRENT_DATE)`
- Grooming Booking: `fn_generate_sequence_number('GR', CURRENT_DATE)`
- Purchase Order: `fn_generate_sequence_number('PO', CURRENT_DATE)`

### 12.2 Audit Logging

```typescript
// lib/audit.ts
export async function logAudit(params: {
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}) {
  await supabase.from('audit_logs').insert({
    ...params,
    created_at: new Date().toISOString(),
  });
}
```

**Actions yang wajib di-log:**
- LOGIN, LOGOUT
- CREATE_USER, UPDATE_USER, RESET_PIN, CHANGE_PIN, DEACTIVATE_USER
- CREATE_CUSTOMER, UPDATE_CUSTOMER, DELETE_CUSTOMER, CONVERT_GUEST
- CREATE_PET, UPDATE_PET, DELETE_PET
- CREATE_APPOINTMENT, UPDATE_APPOINTMENT_STATUS, CANCEL_APPOINTMENT
- CREATE_MEDICAL_RECORD, UPDATE_MEDICAL_RECORD, DELETE_MEDICAL_RECORD
- CREATE_PET_HOTEL_BOOKING, PET_HOTEL_CHECKIN, PET_HOTEL_CHECKOUT
- CREATE_GROOMING_BOOKING, START_GROOMING, FINISH_GROOMING
- CREATE_PRODUCT, UPDATE_PRODUCT, ARCHIVE_PRODUCT, DELETE_PRODUCT
- RECORD_STOCK_MOVEMENT, STOCK_OPNAME
- CREATE_PO, RECEIVE_PO, CANCEL_PO
- CREATE_INVOICE, RECORD_PAYMENT, CANCEL_INVOICE
- EARN_LOYALTY_POINTS, REDEEM_LOYALTY_POINTS, REVERSE_LOYALTY_POINTS
- CREATE_PROMOTION, UPDATE_PROMOTION, CANCEL_PROMOTION
- CREATE_EXPENSE, APPROVE_EXPENSE, REJECT_EXPENSE, REVERSE_EXPENSE
- CREATE_FEEDBACK
- UPDATE_SETTING

### 12.3 Notifications

```typescript
// lib/notifications.ts
export async function sendNotification(params: {
  user_id?: string;  // null = broadcast
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'REMINDER';
  data?: Record<string, any>;
}) {
  await supabase.from('notifications').insert({
    ...params,
    is_read: false,
    created_at: new Date().toISOString(),
  });
  
  // Optional: trigger WhatsApp/Email via Edge Function
  if (process.env.ENABLE_WHATSAPP_NOTIFICATIONS) {
    await supabase.functions.invoke('send-whatsapp', { body: params });
  }
}
```

### 12.4 Realtime Subscriptions (SolidJS)

```typescript
// lib/realtime.ts
export function subscribeToAppointments(date: string, callback: (payload: any) => void) {
  return supabase
    .channel('appointments-' + date)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'appointments',
      filter: `appointment_date=eq.${date}`,
    }, callback)
    .subscribe();
}

export function subscribeToPetHotelRooms(callback: (payload: any) => void) {
  return supabase
    .channel('rooms')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'rooms',
    }, callback)
    .subscribe();
}

export function subscribeToNotifications(userId: string, callback: (payload: any) => void) {
  return supabase
    .channel('notifications-' + userId)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, callback)
    .subscribe();
}
```

### 12.5 File Upload (Supabase Storage)

```typescript
// lib/storage.ts
export async function uploadFile(
  bucket: 'medical-records' | 'pet-hotel' | 'grooming' | 'products' | 'customers' | 'pets' | 'expenses',
  file: File,
  path: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${path}/${crypto.randomUUID()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);
  
  return publicUrl;
}
```

**Storage Buckets & RLS:**
- `medical-records` — Owner, Admin, Dokter (read/write), Customer (read own)
- `pet-hotel` — Owner, Admin (read/write), Customer (read own)
- `grooming` — Owner, Admin, Groomer (read/write), Customer (read own)
- `products` — Owner, Admin (read/write), All authenticated (read)
- `customers` — Owner, Admin (read/write), Customer (read own)
- `pets` — Owner, Admin (read/write), Customer (read own)
- `expenses` — Owner, Admin (read/write)

---

## 13. Edge Cases & Error Matrix

### 13.1 Error Codes Standard

```typescript
// lib/errors.ts
export enum ErrorCode {
  // Auth
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  INVALID_OLD_PIN = 'INVALID_OLD_PIN',
  
  // Validation
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Authorization
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  
  // Business
  CONFLICT = 'CONFLICT',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  INSUFFICIENT_LOYALTY_POINTS = 'INSUFFICIENT_LOYALTY_POINTS',
  PROMOTION_INVALID = 'PROMOTION_INVALID',
  PROMO_NOT_FOUND = 'PROMO_NOT_FOUND',
  SKU_ALREADY_EXISTS = 'SKU_ALREADY_EXISTS',
  BARCODE_ALREADY_EXISTS = 'BARCODE_ALREADY_EXISTS',
  USERNAME_ALREADY_EXISTS = 'USERNAME_ALREADY_EXISTS',
  CANNOT_DELETE_HAS_REFERENCES = 'CANNOT_DELETE_HAS_REFERENCES',
  APPOINTMENT_NOT_IN_PROGRESS = 'APPOINTMENT_NOT_IN_PROGRESS',
  MEDICAL_RECORD_ALREADY_EXISTS = 'MEDICAL_RECORD_ALREADY_EXISTS',
  ROOM_NOT_AVAILABLE = 'ROOM_NOT_AVAILABLE',
  BOOKING_NOT_ACTIVE = 'BOOKING_NOT_ACTIVE',
  GROOMER_NOT_AVAILABLE = 'GROOMER_NOT_AVAILABLE',
  INVOICE_CANCELLED = 'INVOICE_CANCELLED',
  INVOICE_ALREADY_PAID = 'INVOICE_ALREADY_PAID',
  ALREADY_CANCELLED = 'ALREADY_CANCELLED',
  ALREADY_REGISTERED = 'ALREADY_REGISTERED',
  CUSTOMER_NOT_FOUND = 'CUSTOMER_NOT_FOUND',
  APPOINTMENT_NOT_FOUND = 'APPOINTMENT_NOT_FOUND',
  NO_LOYALTY_ACCOUNT = 'NO_LOYALTY_ACCOUNT',
  FEEDBACK_ALREADY_EXISTS = 'FEEDBACK_ALREADY_EXISTS',
  NO_CHANGE_NEEDED = 'NO_CHANGE_NEEDED',
}
```

### 13.2 Error Matrix per Module

| Module | Scenario | Error Code | HTTP Status |
|--------|----------|------------|-------------|
| Auth | Wrong PIN | INVALID_CREDENTIALS | 401 |
| Auth | Account locked | ACCOUNT_LOCKED | 423 |
| Auth | Account inactive | ACCOUNT_INACTIVE | 403 |
| Auth | Wrong old PIN | INVALID_OLD_PIN | 401 |
| User | Username exists | USERNAME_ALREADY_EXISTS | 409 |
| User | Admin create staff | FORBIDDEN | 403 |
| Customer | Email exists | (allowed) | 200 |
| Pet | Customer not found | CUSTOMER_NOT_FOUND | 404 |
| Pet | Future birth date | VALIDATION_ERROR | 400 |
| Appointment | Pet not belong to customer | VALIDATION_ERROR | 400 |
| Appointment | Invalid state transition | INVALID_STATE_TRANSITION | 400 |
| Appointment | Past date (portal) | VALIDATION_ERROR | 400 |
| Medical Record | Appointment not IN_PROGRESS | APPOINTMENT_NOT_IN_PROGRESS | 400 |
| Medical Record | Already exists | MEDICAL_RECORD_ALREADY_EXISTS | 409 |
| Medical Record | Not owner doctor | FORBIDDEN | 403 |
| Pet Hotel | Room not available | ROOM_NOT_AVAILABLE | 409 |
| Pet Hotel | Check-in non-BOOKED | INVALID_STATE_TRANSITION | 400 |
| Pet Hotel | Check-out non-CHECKED_IN | INVALID_STATE_TRANSITION | 400 |
| Grooming | Groomer not available | GROOMER_NOT_AVAILABLE | 409 |
| Product | SKU exists | SKU_ALREADY_EXISTS | 409 |
| Product | Barcode exists | BARCODE_ALREADY_EXISTS | 409 |
| Product | Delete with references | CANNOT_DELETE_HAS_REFERENCES | 400 |
| Inventory | Insufficient stock | INSUFFICIENT_STOCK | 400 |
| PO | Receive RECEIVED PO | INVALID_STATE_TRANSITION | 400 |
| Invoice | Insufficient stock (checkout) | INSUFFICIENT_STOCK | 400 |
| Invoice | Invalid promotion | PROMOTION_INVALID | 400 |
| Invoice | Insufficient loyalty | INSUFFICIENT_LOYALTY_POINTS | 400 |
| Invoice | Pay CANCELLED invoice | INVOICE_CANCELLED | 400 |
| Invoice | Pay PAID invoice | INVOICE_ALREADY_PAID | 400 |
| Invoice | Cancel CANCELLED invoice | ALREADY_CANCELLED | 400 |
| Loyalty | No account | NO_LOYALTY_ACCOUNT | 400 |
| Loyalty | Insufficient points | INSUFFICIENT_LOYALTY_POINTS | 400 |
| Feedback | Already exists | FEEDBACK_ALREADY_EXISTS | 409 |
| Expense | Approve non-PENDING | INVALID_STATE_TRANSITION | 400 |

### 13.3 Concurrency Handling

| Scenario | Strategy |
|----------|----------|
| Concurrent login | Allowed (separate sessions) |
| Concurrent appointment creation | Atomic queue number generation |
| Concurrent POS checkout (same product) | Atomic stock update with `FOR UPDATE` |
| Concurrent stock movement | Atomic SQL update with guard |
| Concurrent invoice payment | Atomic `paid_amount` update |
| Concurrent loyalty points | Atomic update via RPC |
| Concurrent booking same room | Check overlap in transaction |

### 13.4 Data Integrity Rules

| Rule | Enforcement |
|------|-------------|
| SKU unique | DB unique constraint |
| Username unique | DB unique constraint |
| Invoice number unique | DB unique constraint |
| Booking number unique | DB unique constraint |
| Medical record per appointment | DB unique constraint on `appointment_id` |
| Loyalty member per customer | DB unique constraint on `customer_id` |
| Stock never negative | SQL guard in update |
| Total payment <= invoice total | Application logic + DB trigger |
| `createdBy` immutable | DB trigger (prevent update) |
| PIN never in plain text | Edge Function only, never in DB response |

---

## 14. Glosarium Kontrak

| Istilah | Definisi |
|---------|----------|
| **RPC** | Remote Procedure Call — fungsi yang dijalankan di Supabase (Edge Function atau Postgres function) |
| **Atomic** | Operasi yang要么 berhasil semua,要么 gagal semua (transaction) |
| **Idempotent** | Operasi yang bisa dipanggil berkali-kali tanpa efek samping berbeda |
| **State machine** | Model transisi status yang eksplisit |
| **Edge case** | Kasus khusus yang jarang terjadi tapi harus ditangani |
| **Race condition** | Bug akibat konkurensi, di mana hasil tergantung urutan eksekusi |
| **Soft-delete** | Hapus logis (set `deleted_at`), data tetap ada |
| **Hard-delete** | Hapus fisik dari database |
| **RLS** | Row Level Security — otorisasi di level database |
| **FORBIDDEN** | Error 403 — user tidak punya akses |
| **NOT_FOUND** | Error 404 — resource tidak ada |
| **CONFLICT** | Error 409 — resource sudah ada / konflik |
| **BAD_REQUEST** | Error 400 — input tidak valid |

---

## Ringkasan Eksekutif

### Cakupan Dokumen

✅ **Auth & User Management** — login, create user, reset PIN, change PIN, RLS policies
✅ **CRM & Pasien** — customers, pets, appointments, medical records, pet hotel, grooming
✅ **Petshop** — products, inventory, purchase orders
✅ **POS & Billing** — invoice creation, payment, cancellation, cash shifts
✅ **Engagement & Loyalty** — earn/redeem points, tier upgrade, promotions, feedback
✅ **Keuangan & Operasional** — expenses, reports, settings
✅ **Customer Portal** — self-service workflows
✅ **Cross-Cutting** — number generation, audit logging, notifications, realtime, storage
✅ **Edge Cases** — comprehensive error matrix & concurrency handling

### Prinsip Implementasi

1. **Contract-first** — Implementasi harus mengikuti kontrak yang didefinisikan di sini
2. **Fail-fast** — Validasi di setiap layer (Zod → Service → DB)
3. **Atomic operations** — Multi-table operations harus dalam transaction
4. **Audit everything** — Setiap perubahan state tercatat
5. **Explicit state transitions** — Tidak boleh melompat state
6. **Type-safe** — TypeScript strict mode + Zod runtime validation
7. **SolidJS native** — Menggunakan `createSignal`, `createStore`, `createQuery`, `createMutation`

### Checklist Implementasi per Modul

Sebelum menyelesaikan setiap modul, developer **WAJIB** memastikan:

- [ ] Semua workflow diimplementasikan sesuai spesifikasi
- [ ] Semua edge cases ditangani
- [ ] Error codes sesuai matrix
- [ ] State transitions mengikuti state machine
- [ ] Audit logging di setiap operasi
- [ ] RLS policies di-test
- [ ] Unit tests untuk business rules (≥80% coverage)
- [ ] Integration tests untuk workflows
- [ ] E2E tests untuk critical paths

---

**Dokumen ini merupakan baseline final untuk implementasi Petora. Seluruh developer dan AI agent wajib mengikuti kontrak yang didefinisikan di sini untuk memastikan konsistensi, keamanan, dan maintainability sistem.** 🚀
