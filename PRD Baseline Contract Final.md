# PRD — Petora: Sistem Manajemen Terpadu Petshop & Petcare
## Baseline Contract Final | 13 September 2026

---

## 1. Executive Summary

### 1.1 Product Vision
Petora adalah sistem manajemen terpadu untuk bisnis petshop & petcare yang mengintegrasikan seluruh operasional bisnis dalam satu platform: CRM, klinik, pet hotel, grooming, POS, inventory, loyalty program, dan customer portal.

### 1.2 Core Principles
| Prinsip | Implementasi |
|---------|--------------|
| **Contract-First** | Semua interface, schema, dan workflow didefinisikan eksplisit sebelum implementasi |
| **Type-Safe** | TypeScript strict mode + Zod runtime validation di setiap layer |
| **Fail-Fast** | Validasi dilakukan sedini mungkin (Zod → Service → DB) |
| **Atomic Operations** | Multi-table operations menggunakan Supabase RPC/transaction |
| **Audit Everything** | Setiap perubahan state tercatat di `audit_logs` |
| **Role-Based Access** | Isolasi data dan fitur berdasarkan role (OWNER, ADMIN, DOKTER, KASIR, CUSTOMER) |
| **Modern & Lightweight** | SolidJS + Supabase + Vercel (performa tinggi, bundle kecil) |
| **Zero Config Deployment** | Vercel + Supabase = minimal setup, auto-scaling |

### 1.3 Success Criteria
- ✅ Semua workflow diimplementasikan sesuai spesifikasi
- ✅ Semua edge cases ditangani
- ✅ Error codes sesuai matrix
- ✅ State transitions mengikuti state machine
- ✅ Audit logging di setiap operasi
- ✅ RLS policies di-test
- ✅ Unit tests untuk business rules (≥80% coverage)
- ✅ Integration tests untuk workflows
- ✅ E2E tests untuk critical paths
- ✅ Deploy ke Vercel + Supabase tanpa error

---

## 2. Product Overview & Goals

### 2.1 Target Users
| Role | Deskripsi | Akses Utama |
|------|-----------|-------------|
| **OWNER** | Pemilik bisnis | Full access: semua modul, settings, financial reports, user management |
| **ADMIN** | Manajer operasional | Semua modul kecuali financial reports & user creation (hanya customer) |
| **DOKTER** | Dokter hewan | Appointments, medical records, pets (read/write own) |
| **KASIR** | Kasir POS | POS, invoices, payments, products (read), customers (read) |
| **CUSTOMER** | Pelanggan (via portal) | Own data: pets, appointments, invoices, loyalty points |

### 2.2 Core Modules
1. **Auth & User Management** — Login, PIN management, role-based access
2. **CRM & Pasien** — Customers, pets, medical history
3. **Appointments & Medical Records** — Scheduling, queue management, medical records
4. **Pet Hotel** — Room management, bookings, check-in/check-out
5. **Grooming** — Service packages, bookings, records
6. **Petshop & Inventory** — Products, stock management, purchase orders
7. **POS & Billing** — Invoices, payments, cash shifts
8. **Engagement & Loyalty** — Points, tiers, promotions, feedback
9. **Keuangan & Operasional** — Expenses, reports, settings
10. **Customer Portal** — Self-service booking, invoices, loyalty

### 2.3 Key Features
- **Real-time Updates** — Dashboard POS, Pet Hotel, Appointments update via Supabase Realtime
- **Offline-First (Future)** — Service workers untuk POS (opsional)
- **Multi-Currency (Future)** — Siap untuk ekspansi
- **WhatsApp Integration** — Notifikasi otomatis via Fonnte
- **Payment Gateway** — Midtrans/Xendit untuk online payments
- **Email Notifications** — Resend untuk receipts & reminders

---

## 3. User Roles & Permissions Matrix

### 3.1 Permission Matrix (Complete)

| Module | Operation | OWNER | ADMIN | DOKTER | KASIR | CUSTOMER |
|--------|-----------|-------|-------|--------|-------|----------|
| **Auth** | Login | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Logout | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Change PIN (self) | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Reset PIN (others) | ✅ All | ✅ Customer only | ❌ | ❌ | ❌ |
| | Create User | ✅ Staff | ✅ Customer only | ❌ | ❌ | ❌ |
| | Deactivate User | ✅ Staff | ✅ Customer only | ❌ | ❌ | ❌ |
| **CRM** | List Customers | ✅ | ✅ | ✅ (read) | ✅ (read) | ✅ (own) |
| | Create Customer | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Update Customer | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Delete Customer | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Convert Guest → Registered | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Pets** | List Pets | ✅ | ✅ | ✅ (read) | ✅ (read) | ✅ (own) |
| | Create Pet | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Update Pet | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Delete Pet | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Add Weight Log | ✅ | ✅ | ✅ | ❌ | ❌ |
| | Add Vaccine | ✅ | ✅ | ✅ | ❌ | ❌ |
| | Add Disease | ✅ | ✅ | ✅ | ❌ | ❌ |
| | Add Allergy | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Appointments** | List | ✅ | ✅ | ✅ (all read, own write) | ✅ (read) | ✅ (own) |
| | Create | ✅ | ✅ | ❌ | ❌ | ✅ (own) |
| | Update Status | ✅ | ✅ | ✅ (own) | ❌ | ❌ |
| | Update Details | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Cancel | ✅ | ✅ | ❌ | ❌ | ✅ (own) |
| **Medical Records** | List | ✅ | ✅ | ✅ (all read, own write) | ❌ | ❌ |
| | Create | ❌ | ❌ | ✅ (own appointments) | ❌ | ❌ |
| | Update | ❌ | ❌ | ✅ (creator only) | ❌ | ❌ |
| | Delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Pet Hotel** | List Rooms | ✅ | ✅ | ✅ (read) | ✅ (read) | ❌ |
| | Create/Update Room | ✅ | ✅ | ❌ | ❌ | ❌ |
| | List Bookings | ✅ | ✅ | ✅ (read) | ✅ (read) | ✅ (own) |
| | Create Booking | ✅ | ✅ | ❌ | ❌ | ✅ (own) |
| | Check-in | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Check-out | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Add Log | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Extend Booking | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Cancel Booking | ✅ | ✅ | ❌ | ❌ | ✅ (own) |
| **Grooming** | List Services | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Create/Update Service | ✅ | ✅ | ❌ | ❌ | ❌ |
| | List Bookings | ✅ | ✅ | ✅ (own) | ✅ (read) | ✅ (own) |
| | Create Booking | ✅ | ✅ | ❌ | ❌ | ✅ (own) |
| | Start Grooming | ✅ | ✅ | ✅ (own) | ❌ | ❌ |
| | Finish Grooming | ✅ | ✅ | ✅ (own) | ❌ | ❌ |
| | Create Record | ✅ | ✅ | ✅ (own) | ❌ | ❌ |
| | Cancel Booking | ✅ | ✅ | ❌ | ❌ | ✅ (own) |
| **Products** | List | ✅ | ✅ | ✅ | ✅ | ✅ (active only) |
| | Create/Update | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Archive | ✅ | ❌ | ❌ | ❌ | ❌ |
| | Delete | ✅ (no refs) | ❌ | ❌ | ❌ | ❌ |
| **Inventory** | Get Stock | ✅ | ✅ | ❌ | ✅ (read) | ❌ |
| | Record Movement | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Stock Opname | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Get Low Stock | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Purchase Orders** | List | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Create/Update | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Send | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Receive | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Cancel | ✅ | ✅ | ❌ | ❌ | ❌ |
| **POS/Invoices** | List | ✅ | ✅ | ❌ | ✅ | ✅ (own) |
| | Create Invoice | ✅ | ✅ | ❌ | ✅ | ❌ |
| | Record Payment | ✅ | ✅ | ❌ | ✅ | ❌ |
| | Cancel Invoice | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Get Daily Sales | ✅ | ✅ | ❌ | ✅ (own) | ❌ |
| **Loyalty** | Get Member | ✅ | ✅ | ❌ | ❌ | ✅ (own) |
| | Earn Points | System | System | ❌ | ❌ | ❌ |
| | Redeem Points | ✅ | ✅ | ❌ | ✅ | ✅ (own) |
| | Reverse Points | System | System | ❌ | ❌ | ❌ |
| | Get Transaction History | ✅ | ✅ | ❌ | ❌ | ✅ (own) |
| **Promotions** | List | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Create/Update | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Cancel | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Validate Code | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Expenses** | List | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Create | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Update (PENDING) | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Approve | ✅ | ❌ | ❌ | ❌ | ❌ |
| | Reject | ✅ | ❌ | ❌ | ❌ | ❌ |
| | Reverse | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Reports** | Revenue | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Profit & Loss | ✅ | ❌ | ❌ | ❌ | ❌ |
| | Inventory Valuation | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Settings** | View | ✅ | ✅ | ❌ | ❌ | ❌ |
| | Update | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Feedback** | Create | ❌ | ❌ | ❌ | ❌ | ✅ (own invoices) |
| | List | ✅ | ✅ | ❌ | ❌ | ❌ |

### 3.2 RLS Enforcement
Semua permission di atas **WAJIB** di-enforce di level database menggunakan Supabase RLS policies. Application-level checks adalah secondary defense.

---

## 4. Feature Requirements (Per Module)

### 4.1 Auth & User Management

#### 4.1.1 Login
**Input:**
```typescript
{
  username: string, // 3-50 chars, pattern [a-z0-9._]+
  pin: string // exactly 6 digits
}
```

**Workflow:**
1. Validasi input via Zod
2. Query user by username (case-sensitive)
3. Jika tidak ditemukan → increment `failed_login_attempts`, return 401
4. Cek lockout (`locked_until > NOW()`) → return 423
5. Cek `is_active = false` → return 403
6. Verify PIN (bcrypt.compare)
   - Jika tidak match → increment `failed_login_attempts`
   - Jika `>= 5` → set `locked_until = NOW() + 15 minutes`
   - Return 401
7. Login berhasil:
   - Reset `failed_login_attempts = 0`
   - Clear `locked_until = null`
   - Update `last_login_at = NOW()`
   - Generate JWT session (exp: 24h)
   - Insert `audit_log: action='LOGIN'`
   - Return 200 `{ user, session_token }`

**Edge Cases:**
- Username dengan spasi → ditolak di Zod
- PIN dengan huruf → ditolak di Zod
- Concurrent login dari device berbeda → diizinkan (session terpisah)
- User yang sudah login lalu PIN di-reset oleh admin → session lama tetap valid sampai expire

#### 4.1.2 Create User (Staff — Owner Only)
**Input:**
```typescript
{
  username: string,
  pin: string,
  role: 'ADMIN' | 'DOKTER' | 'KASIR',
  full_name: string,
  customer_id?: string // optional, untuk role CUSTOMER
}
```

**Workflow:**
1. Authorization check → caller.role MUST be OWNER
2. Validate input via Zod
3. Check username uniqueness (case-sensitive)
4. Hash PIN (bcrypt, salt rounds = 12)
5. Insert user dengan `is_active = true`, `failed_login_attempts = 0`
6. Insert `audit_log: action='CREATE_USER'`
7. Return user (without `pin_hash`)

**Edge Cases:**
- Owner mencoba membuat akun OWNER lain → ditolak (role OWNER hanya via seed)
- Username yang sama dengan user yang sudah di-soft-delete → tetap ditolak
- Admin mencoba membuat akun staff → ditolak di RLS + Edge Function

#### 4.1.3 Reset PIN
**Input:**
```typescript
{
  target_user_id: string,
  new_pin: string
}
```

**Workflow:**
1. Authorization check:
   - Jika target.role in [OWNER, ADMIN, DOKTER, KASIR] AND caller.role != OWNER → throw FORBIDDEN
   - Jika target.role == CUSTOMER AND caller.role not in [OWNER, ADMIN] → throw FORBIDDEN
   - Tidak boleh reset PIN sendiri via endpoint ini
2. Validate new_pin via Zod
3. Hash new_pin
4. Update user: `pin_hash`, reset `failed_login_attempts = 0`, clear `locked_until`
5. Insert `audit_log: action='RESET_PIN'`
6. Return success

#### 4.1.4 Change PIN (Self)
**Input:**
```typescript
{
  old_pin: string,
  new_pin: string
}
```

**Workflow:**
1. Fetch current user
2. Verify `old_pin` matches `pin_hash` → jika tidak match: throw 401
3. Validate `new_pin`
4. Hash `new_pin`
5. Update user
6. Insert `audit_log: action='CHANGE_PIN'`
7. Return success

### 4.2 CRM & Pasien

#### 4.2.1 Customers

**Create Customer:**
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
1. Authorization check → caller MUST be OWNER or ADMIN
2. Validate via Zod
   - Jika `create_account = true`: `username` & `pin` wajib
   - Jika `username` provided: validate uniqueness
3. Insert customer dengan `is_guest = false` (default), `tags = []`, `is_active = true`
4. Jika `create_account = true`:
   - Call `fn_create_user` internally dengan `role = 'CUSTOMER'`, `customer_id = new_customer.id`
   - Jika username conflict: rollback customer creation
5. Insert `audit_log: action='CREATE_CUSTOMER'`
6. Return customer (with user if created)

**Edge Cases:**
- Email duplikat → diizinkan (tidak ada unique constraint)
- Phone duplikat → diizinkan (satu keluarga bisa punya nomor sama)
- Guest customer tanpa data apapun → minimal `name` wajib
- Create account dengan username yang sudah dipakai → ditolak

**Convert Guest → Registered:**
```typescript
{
  customer_id: string,
  data: Partial<Customer>
}
```

**Workflow:**
1. Fetch customer → jika `is_guest = false`: throw ALREADY_REGISTERED
2. Validate data
3. Update customer: `is_guest = false`, merge with provided data
4. Insert `audit_log: action='CONVERT_GUEST_TO_REGISTERED'`
5. Return updated customer

**Invariant:** Riwayat transaksi (invoices, appointments) tetap ter-link ke customer yang sama.

#### 4.2.2 Pets

**Create Pet:**
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
1. Verify customer exists AND `is_active = true` → jika tidak: throw CUSTOMER_NOT_FOUND
2. Validate via Zod
   - `birth_date` tidak boleh di masa depan
   - `species` wajib
3. Insert pet
4. Insert `audit_log`
5. Return pet

**Edge Cases:**
- Customer yang sudah di-soft-delete → tidak bisa tambah pet
- `birth_date` di masa depan → ditolak
- Duplicate `microchip_number` → diizinkan (tidak ada unique constraint)

**Add Vaccine:**
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
1. Verify pet exists
2. `vaccination_date` tidak boleh di masa depan
3. Insert vaccine
4. Jika `due_date` provided:
   - Schedule reminder H-14 via `notifications` table
   - Insert notification untuk customer (jika punya akun)
5. Return vaccine

**Business Rule:** Vaksin "Overdue" dihitung di client-side:
```typescript
const isOverdue = (vaccine: PetVaccine) => {
  if (!vaccine.due_date) return false;
  return new Date(vaccine.due_date) < new Date() && vaccine.is_active;
};
```

### 4.3 Appointments & Medical Records

#### 4.3.1 Appointments

**State Machine:**
```
WAITING → IN_PROGRESS (dokter mulai periksa)
WAITING → CANCELLED
IN_PROGRESS → DONE
IN_PROGRESS → CANCELLED (rare, tapi diizinkan)

DONE → apapun (DITOLAK - final state)
CANCELLED → apapun (DITOLAK - final state)
```

**Create Appointment:**
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
1. Validate via Zod
   - `appointment_date` tidak boleh di masa lalu (kecuali `is_from_portal = false` dan caller = Owner/Admin)
   - `appointment_time` dalam jam operasional (configurable)
   - Verify customer & pet exist & active
   - Verify pet belongs to customer
2. Generate `queue_number` (atomic):
   ```sql
   SELECT COALESCE(MAX(queue_number), 0) + 1
   FROM appointments
   WHERE appointment_date = input.appointment_date
   ```
3. Insert appointment dengan `status = 'WAITING'`
4. Jika `is_from_portal = true`:
   - Insert notification untuk Admin: "New appointment request from {customer_name}"
5. Schedule reminder H-1 via notification (jika customer punya akun)
6. Insert `audit_log`
7. Return appointment with `queue_number`

**Edge Cases:**
- Pet tidak belong to customer → ditolak
- Doctor tidak exist / bukan role DOKTER → ditolak
- Multiple appointments untuk pet yang sama di tanggal yang sama → diizinkan (tapi warning di UI)
- Appointment di hari libur → diizinkan (konfigurasi jam operasional di Settings)

**Update Status:**
```typescript
{
  appointment_id: string,
  new_status: 'IN_PROGRESS' | 'DONE' | 'CANCELLED'
}
```

**Workflow:**
1. Fetch appointment
2. Validate state transition (lihat state machine) → jika invalid: throw INVALID_STATE_TRANSITION
3. Jika `new_status = 'IN_PROGRESS'`:
   - Verify caller is assigned doctor OR caller is Owner/Admin
4. Jika `new_status = 'DONE'`:
   - Check if `medical_record` exists for this appointment
   - Jika belum ada: set flag `prompt_create_medical_record = true` di response
5. Update appointment
6. Insert `audit_log`
7. Return `{ appointment, prompt_create_medical_record? }`

#### 4.3.2 Medical Records

**Create Medical Record:**
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
1. Fetch appointment
   - Jika tidak exist: throw APPOINTMENT_NOT_FOUND
   - Jika `status != 'IN_PROGRESS'` dan caller bukan Owner/Admin: throw APPOINTMENT_NOT_IN_PROGRESS
2. Check if `medical_record` already exists for this appointment → jika ya: throw MEDICAL_RECORD_ALREADY_EXISTS
3. Verify caller is assigned doctor of the appointment → jika tidak: throw FORBIDDEN (kecuali Owner)
4. Generate `record_number` (atomic): Format `MR-YYYYMMDD-XXXX`
5. Insert `medical_record` dengan `status = 'OPEN'`
6. Insert `audit_log`
7. Return `medical_record`

**Edge Cases:**
- Dokter lain mencoba edit medical record bukan miliknya → ditolak
- Appointment `status = DONE` tapi belum ada medical record → diizinkan (warning di UI)
- Attachment upload → via Supabase Storage, URL disimpan di array `attachments`

**Update Medical Record:**
```typescript
{
  medical_record_id: string,
  updates: Partial<MedicalRecord>
}
```

**Workflow:**
1. Fetch `medical_record`
2. Verify caller is creator OR caller is Owner → jika tidak: throw FORBIDDEN
3. Validate updates via Zod
4. Update `medical_record`, set `updated_at = NOW()`
5. Insert `audit_log` dengan `old_values` & `new_values`
6. Return updated `medical_record`

### 4.4 Pet Hotel

#### 4.4.1 State Machines

**Booking:**
```
BOOKED → CHECKED_IN (check-in)
CHECKED_IN → CHECKED_OUT (check-out)
BOOKED → CANCELLED (cancel)

CHECKED_OUT → apapun (DITOLAK - final state)
CANCELLED → apapun (DITOLAK - final state)
```

**Room:**
```
AVAILABLE → RESERVED (reserve)
RESERVED → OCCUPIED (check-in)
OCCUPIED → AVAILABLE (check-out)
AVAILABLE → UNDER_CLEANING (mark clean)
UNDER_CLEANING → AVAILABLE (cleaning done)
ANY (except OCCUPIED) → MAINTENANCE (set maintenance)
MAINTENANCE → AVAILABLE (clear maintenance)
```

#### 4.4.2 Create Booking
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
1. Validate dates
   - `check_in_date >= TODAY`
   - `check_out_date > check_in_date`
   - Verify pet belongs to customer
2. Jika `room_id` provided:
   - Check room availability for date range
   - RPC: check overlapping bookings dengan `status in [BOOKED, CHECKED_IN]`
   - Jika occupied: throw ROOM_NOT_AVAILABLE
3. Jika `price_per_night` not provided:
   - Fetch from `room.price_per_night`
4. Calculate `total_price`:
   - `nights = (check_out_date - check_in_date)` in days
   - `total_price = nights * price_per_night`
5. Generate `booking_number`: `BK-YYYYMMDD-XXXX` (atomic)
6. Insert booking dengan `status = 'BOOKED'`
7. Jika `room_id` provided:
   - Update `room.status = 'RESERVED'` (jika room sebelumnya AVAILABLE)
8. Insert `audit_log`
9. Return booking

#### 4.4.3 Check-in
```typescript
{
  booking_id: string,
  actual_room_id?: string
}
```

**Workflow:**
1. Fetch booking → jika `status != 'BOOKED'`: throw INVALID_STATE
2. Jika `actual_room_id` provided dan berbeda dari `booking.room_id`:
   - Check new room availability
   - Release old room (set AVAILABLE)
   - Reserve new room (set RESERVED)
   - Update `booking.room_id`
3. Update booking:
   - `status = 'CHECKED_IN'`
   - `actual_check_in_at = NOW()`
4. Update `room.status = 'OCCUPIED'`
5. Insert `audit_log`
6. Return booking

#### 4.4.4 Check-out
```typescript
{
  booking_id: string,
  actual_check_out_date?: string
}
```

**Workflow:**
1. Fetch booking → jika `status != 'CHECKED_IN'`: throw INVALID_STATE
2. Determine `actual_check_out_at`:
   - Jika provided: use it
   - Else: `NOW()`
3. Recalculate `total_price` berdasarkan actual stay:
   - `actual_nights = ceil((actual_check_out_at - actual_check_in_at)` in days)
   - `new_total = actual_nights * price_per_night`
   - Update `booking.total_price`
4. Update booking:
   - `status = 'CHECKED_OUT'`
   - `actual_check_out_at`
5. Update room:
   - `status = 'AVAILABLE'`
   - `cleanliness = 'DIRTY'` (perlu dibersihkan untuk guest berikutnya)
6. Auto-create or update invoice:
   - RPC `fn_create_pet_hotel_invoice_item`
   - Jika customer sudah punya invoice UNPAID untuk kunjungan ini: add item
   - Else: create new invoice dengan `type = 'PET_HOTEL'`
7. Insert `audit_log`
8. Return booking

**Edge Cases:**
- Check-out di tengah malam (melewati midnight) → dihitung 1 hari tambahan
- Check-out lebih awal dari rencana → tidak ada refund otomatis (kebijakan bisnis)
- Check-out lebih lama dari rencana → charge tambahan otomatis
- Room rusak saat occupansi → pindah room via check-in ulang dengan `actual_room_id`

#### 4.4.5 Add Pet Hotel Log
```typescript
{
  booking_id: string,
  log_type: 'FEEDING' | 'MEDICINE' | 'NOTE',
  description?: string,
  photo_urls?: string[]
}
```

**Workflow:**
1. Fetch booking → jika `status != 'CHECKED_IN'`: throw BOOKING_NOT_ACTIVE
2. Validate `log_type`
3. Insert log dengan `logged_at = NOW()`
4. Return log

### 4.5 Grooming

#### 4.5.1 State Machine
```
BOOKED → IN_PROGRESS (start)
IN_PROGRESS → DONE (finish)
BOOKED → CANCELLED (cancel)

DONE → apapun (DITOLAK - final state)
CANCELLED → apapun (DITOLAK - final state)
```

#### 4.5.2 Create Grooming Booking
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
1. Validate
   - Verify pet belongs to customer
   - Verify service exists and `is_active`
   - Verify groomer (if provided) has role that allows grooming
2. Check groomer availability (optional, berdasarkan config)
   - Query existing bookings di slot waktu yang sama
   - Jika overlap: throw GROOMER_NOT_AVAILABLE
3. Calculate `total_price`:
   - `base_price` dari service
   - + size adjustment (jika ada)
   - + addons (jika ada)
4. Generate `booking_number`: `GR-YYYYMMDD-XXXX` (atomic)
5. Insert booking dengan `status = 'BOOKED'`
6. Insert `audit_log`
7. Return booking

#### 4.5.3 Finish Grooming
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
1. Fetch booking → jika `status != 'IN_PROGRESS'`: throw INVALID_STATE
2. Update booking `status = 'DONE'`
3. Insert `grooming_record` dengan all fields
4. Auto-create invoice item:
   - RPC `fn_create_grooming_invoice_item`
   - `type = 'GROOMING'`
5. Insert `audit_log`
6. Return `{ booking, record }`

### 4.6 Petshop & Inventory

#### 4.6.1 Products

**Create Product:**
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
1. Validate via Zod
   - `selling_price >= purchase_price` (warning, not error)
   - `stock_minimum <= stock_maximum` (jika keduanya provided)
2. Check SKU uniqueness → jika exists: throw SKU_ALREADY_EXISTS
3. Check barcode uniqueness (jika provided) → jika exists: throw BARCODE_ALREADY_EXISTS
4. Insert product dengan `status = 'ACTIVE'`
5. Jika `stock_quantity > 0`:
   - Insert `stock_movement`: `type = 'IN'`, `quantity = stock_quantity`
   - `reference_type = 'INITIAL_STOCK'`
6. Insert `audit_log`
7. Return product

**Edge Cases:**
- SKU dengan spasi → ditolak di Zod
- `selling_price < purchase_price` → warning di UI, tapi diizinkan (bisa saja clearance)
- `expiry_date` di masa lalu → ditolak

**Archive vs Delete:**
- `fn_archive_product(product_id)`:
  - Caller MUST be OWNER
  - Update `status = 'ARCHIVED'`
  - Product tetap muncul di historical invoices
  - Tidak muncul di POS grid
- `fn_delete_product(product_id)`:
  - Caller MUST be OWNER
  - Check: tidak ada `InvoiceItem` yang mereferensikan `product_id`
  - Check: tidak ada `StockMovement` yang mereferensikan `product_id`
  - Jika ada referensinya: throw CANNOT_DELETE_HAS_REFERENCES
  - Jika bersih: hard delete

#### 4.6.2 Inventory

**Record Stock Movement (Atomic):**
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
1. Validate
   - `quantity != 0`
   - `movement_type` valid
   - Untuk OUT/RETURN/DAMAGED/EXPIRED: quantity harus positif (sistem yang negate)
2. Determine `signed_quantity`:
   - IN, RETURN: `+quantity`
   - OUT, DAMAGED, EXPIRED: `-quantity`
   - ADJUSTMENT, OPNAME: signed quantity (bisa + atau -)
3. Atomic stock update via RPC:
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
4. Insert `stock_movement` record
5. Check low stock alert:
   - Jika `new_stock < stock_minimum`:
   - Insert notification untuk Admin & Owner
6. Insert `audit_log`
7. Return `{ movement, new_stock }`

**Edge Cases:**
- Concurrent stock updates → atomic SQL prevents race condition
- Stock menjadi negatif → ditolak di SQL guard
- Movement dengan reference ke invoice yang di-cancel → handled oleh `cancel_invoice` RPC

**Stock Opname:**
```typescript
{
  product_id: string,
  actual_quantity: number,
  notes?: string
}
```

**Workflow:**
1. Fetch current product
2. Calculate `difference = actual_quantity - current_stock`
3. Jika `difference = 0`: throw NO_CHANGE_NEEDED
4. Call `fn_record_stock_movement` dengan:
   - `movement_type = 'OPNAME'`
   - `quantity = difference` (signed)
   - `notes = "Opname: ${current_stock} → ${actual_quantity}. ${notes}"`
5. Return movement

#### 4.6.3 Purchase Orders

**State Machine:**
```
DRAFT → SENT (send)
SENT → RECEIVED (receive all)
SENT → PARTIAL_RECEIVED (partial receive)
PARTIAL_RECEIVED → RECEIVED (receive remaining)
DRAFT → CANCELLED (cancel)
SENT → CANCELLED (cancel)

RECEIVED → apapun (DITOLAK - final state)
CANCELLED → apapun (DITOLAK - final state)
```

**Receive PO:**
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
1. Fetch PO → jika `status in [RECEIVED, CANCELLED]`: throw INVALID_STATE
2. Update PO:
   - `status = 'RECEIVED'` (jika semua item fully received)
   - `status = 'PARTIAL_RECEIVED'` (jika ada yang kurang)
   - `actual_arrival_date`
3. For each item:
   - Update `purchase_order_item.received_quantity`
   - Call `fn_record_stock_movement`:
     - `movement_type = 'IN'`
     - `quantity = received_quantity`
     - `reference_type = 'PURCHASE_ORDER'`
     - `reference_id = po_id`
4. Update PO `total_amount` (jika ada perubahan)
5. Insert `audit_log`
6. Return PO with items

**Edge Cases:**
- Receive lebih banyak dari yang di-order → diizinkan (bonus dari supplier), tapi warning
- Receive lebih sedikit → `status = PARTIAL_RECEIVED`, bisa receive lagi nanti
- PO yang sudah RECEIVED tidak bisa diubah

### 4.7 POS & Billing

#### 4.7.1 Invoice State Machine
```
UNPAID → PARTIAL_PAYMENT (partial payment)
PARTIAL_PAYMENT → PAID (full payment)
UNPAID → PAID (full payment)
UNPAID/PARTIAL_PAYMENT → CANCELLED (cancel)

PAID → apapun (DITOLAK - final state)
CANCELLED → apapun (DITOLAK - final state)
```

#### 4.7.2 Create Invoice (POS Checkout)
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
1. Validate via Zod
2. Calculate `subtotal`:
   ```typescript
   subtotal = SUM(item.quantity * item.unit_price)
   ```
3. Validate promotion (if provided):
   - Fetch promotion
   - Check `status = 'ACTIVE'`
   - Check `start_date <= TODAY <= end_date`
   - Check `max_usage` (`current_usage < max_usage`)
   - Check `min_purchase` (`subtotal >= min_purchase`)
   - Check `applicable_products` (if specified)
   - Calculate discount from promotion
   - → Jika invalid: throw PROMOTION_INVALID
4. Validate loyalty points (if provided):
   - Fetch `loyalty_member` by `customer_id`
   - Check `available_points >= loyalty_points_to_redeem`
   - Calculate discount: `points * point_value` (e.g., 1 point = Rp 100)
   - → Jika insufficient: throw INSUFFICIENT_LOYALTY_POINTS
5. Calculate totals:
   ```typescript
   promotion_discount = calculate from promotion
   loyalty_discount = loyalty_points_to_redeem * point_value
   total_discount = discount_amount + promotion_discount + loyalty_discount
   total_amount = (subtotal - total_discount) + tax_amount
   ```
6. Validate stock for PRODUCT items (atomic):
   ```sql
   For each item where item_type = 'PRODUCT':
   SELECT stock_quantity FROM products WHERE id = product_id FOR UPDATE
   Jika stock < quantity: throw INSUFFICIENT_STOCK { product_name }
   ```
7. Generate `invoice_number`: `INV-YYYYMMDD-XXXX` (atomic)
8. Insert invoice (`status = 'UNPAID'`)
9. Insert all `invoice_items`
10. Deduct stock for PRODUCT items (atomic):
    ```sql
    For each PRODUCT item:
    UPDATE products SET stock_quantity = stock_quantity - quantity
    INSERT stock_movement (type = 'OUT', reference = invoice_id)
    ```
11. Update promotion usage (if used):
    ```sql
    UPDATE promotions SET current_usage = current_usage + 1
    INSERT promotion_usage
    ```
12. Redeem loyalty points (if used):
    - Call `fn_redeem_loyalty_points`
13. Insert `audit_log`
14. Return invoice with items

**Critical:** Step 6-10 **HARUS** dalam satu transaction untuk mencegah oversell.

**Edge Cases:**
- Concurrent checkout untuk produk yang sama → atomic SQL prevents oversell
- Promotion expired saat checkout → ditolak di validasi
- Customer tidak punya loyalty account tapi mau redeem → ditolak
- Invoice tanpa customer (walk-in) → loyalty & promotion tidak bisa dipakai (kecuali dikonfigurasi lain)

#### 4.7.3 Record Payment
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
1. Fetch invoice
   - → Jika `status = 'CANCELLED'`: throw INVOICE_CANCELLED
   - → Jika `status = 'PAID'`: throw INVOICE_ALREADY_PAID
2. Validate `amount > 0`
3. Calculate `new_paid_amount`:
   ```typescript
   new_paid = invoice.paid_amount + amount
   ```
4. Insert payment record
5. Update invoice:
   ```typescript
   paid_amount = new_paid
   Determine new status:
   new_paid = 0 → UNPAID (tidak mungkin karena amount > 0)
   0 < new_paid < total → PARTIAL_PAYMENT
   new_paid >= total → PAID
   ```
6. Jika status berubah menjadi PAID:
   - Call `fn_award_loyalty_points` (jika customer registered)
   - Insert notification untuk customer: "Pembayaran berhasil"
   - Trigger feedback request (H+1 via scheduled job)
7. Insert `audit_log`
8. Return `{ payment, invoice }`

#### 4.7.4 Cancel Invoice
```typescript
{
  invoice_id: string,
  reason?: string
}
```

**Workflow:**
1. Fetch invoice with items
   - → Jika `status = 'CANCELLED'`: throw ALREADY_CANCELLED
2. Update invoice `status = 'CANCELLED'`
3. Restore stock for PRODUCT items:
   ```sql
   For each item where item_type = 'PRODUCT':
   UPDATE products SET stock_quantity = stock_quantity + quantity
   INSERT stock_movement (type = 'RETURN', reference = invoice_id)
   ```
4. Reverse loyalty points (if awarded):
   - Call `fn_reverse_loyalty_points`
5. Reverse promotion usage (if used):
   ```sql
   UPDATE promotions SET current_usage = current_usage - 1
   DELETE promotion_usage where invoice_id
   ```
6. Handle refund (jika ada pembayaran):
   - Create refund record (business decision)
   - Insert `audit_log` dengan refund details
7. Insert `audit_log: action = 'CANCEL_INVOICE'`
8. Return invoice

**Edge Cases:**
- Invoice yang sudah PAID dan ada pembayaran cash → refund manual di luar sistem (catat di notes)
- Invoice dengan item PET_HOTEL yang sudah CHECKED_OUT → tetap bisa cancel, tapi pet hotel booking tidak otomatis berubah status
- Partial payment yang sudah diterima → refund logic perlu kebijakan bisnis (TBD)

#### 4.7.5 Cash Shift

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

### 4.8 Engagement & Loyalty

#### 4.8.1 Loyalty Program

**Earn Points (Auto-triggered):**
- **Trigger:** Invoice status berubah ke PAID
- **Input:** `{ customer_id, invoice_id, total_amount }`

**Workflow:**
1. Fetch `loyalty_member` by `customer_id`
   - → Jika tidak ada: skip (guest customer)
2. Fetch `loyalty_tier` by `member.tier_id`
3. Calculate points:
   ```typescript
   base_points = floor(total_amount / 10000)  // Rp 10.000 = 1 point
   final_points = floor(base_points * tier.point_multiplier)
   ```
4. Update `loyalty_member`:
   ```typescript
   total_points += final_points
   available_points += final_points
   total_spending += total_amount
   ```
5. Insert `loyalty_transaction`:
   ```typescript
   transaction_type = 'EARN'
   points = final_points
   invoice_id
   description = `Earned from invoice ${invoice_number}`
   ```
6. Check tier upgrade:
   - Call `fn_check_tier_upgrade`
7. Return transaction

**Redeem Points:**
```typescript
{
  customer_id: string,
  points_to_redeem: number,
  invoice_id?: string
}
```

**Workflow:**
1. Fetch `loyalty_member`
   - → Jika tidak ada: throw NO_LOYALTY_ACCOUNT
2. Validate:
   - `available_points >= points_to_redeem`
   - `points_to_redeem > 0`
   - Tier allows redemption (check tier benefits)
   - → Jika insufficient: throw INSUFFICIENT_POINTS
3. Calculate discount:
   ```typescript
   discount_value = points_to_redeem * 100  // 1 point = Rp 100
   ```
4. Update `loyalty_member`:
   ```typescript
   available_points -= points_to_redeem
   total_points -= points_to_redeem (optional, tergantung kebijakan)
   ```
5. Insert `loyalty_transaction`:
   ```typescript
   transaction_type = 'REDEEM'
   points = -points_to_redeem
   invoice_id
   ```
6. Return `{ transaction, discount_value }`

**Check Tier Upgrade:**
```typescript
{
  member_id: string
}
```

**Workflow:**
1. Fetch member with current tier
2. Fetch all tiers ordered by `min_points ASC`
3. Find highest tier where member qualifies:
   ```typescript
   member.total_points >= tier.min_points
   OR member.total_spending >= tier.min_spending
   ```
4. Jika qualified tier > current tier:
   - Update `member.tier_id`
   - Insert notification: "Selamat! Anda naik ke tier {tier_name}"
   - Insert `audit_log`
5. Return `{ upgraded: boolean, new_tier? }`

#### 4.8.2 Promotions

**Validate Promo Code:**
```typescript
{
  code: string,
  subtotal: number,
  customer_id?: string
}
```

**Workflow:**
1. Fetch promotion by code
   - → Jika tidak ada: throw PROMO_NOT_FOUND
2. Validate:
   - `status = 'ACTIVE'`
   - `start_date <= TODAY <= end_date`
   - `current_usage < max_usage` (jika `max_usage` set)
   - `subtotal >= min_purchase`
   - Jika `applicable_products` specified: check items (done at invoice level)
   - Jika `promotion_type = 'BIRTHDAY'`: check customer birth month
   - Jika `promotion_type = 'HAPPY_HOUR'`: check current time
3. Calculate discount:
   ```typescript
   PERCENTAGE: subtotal * (discount_value / 100)
   FIXED: discount_value
   BUNDLE/HAPPY_HOUR/BIRTHDAY: sesuai konfigurasi
   ```
4. Return `{ valid: true, promotion, discount_amount }`

#### 4.8.3 Customer Feedback

**Create Feedback:**
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
1. Validate:
   - `rating` in [1, 2, 3, 4, 5]
   - Jika `invoice_id` provided: verify invoice belongs to customer
   - Check if feedback already exists for this invoice
   - → Jika ya: throw FEEDBACK_ALREADY_EXISTS
2. Insert feedback
3. Insert notification untuk Admin: "New feedback received"
4. Return feedback

### 4.9 Keuangan & Operasional

#### 4.9.1 Expenses

**Create Expense:**
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
1. Validate
   - `expense_date <= TODAY`
   - `amount > 0`
   - category exists
2. Insert expense dengan `status = 'PENDING'`, `created_by = caller.id`
3. Insert `audit_log`
4. Return expense

**Approve/Reject/Reverse:**
- **Approve:**
  - Caller MUST be OWNER
  - Expense `status` MUST be PENDING
  - Update `status = 'APPROVED'`, `approved_by = caller.id`
- **Reject:**
  - Caller MUST be OWNER
  - Expense `status` MUST be PENDING
  - Update `status = 'REJECTED'`
- **Reverse** (untuk APPROVED expense):
  - Caller MUST be OWNER
  - Expense `status` MUST be APPROVED
  - Update `status = 'REVERSED'`
  - Insert `audit_log` dengan reason

#### 4.9.2 Reports

**Revenue Report:**
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

**Profit & Loss Report:**
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
  cogs: number,  // cost of goods sold
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

**Inventory Valuation Report:**
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

#### 4.9.3 Settings

**Configurable Settings:**
| Key | Type | Default |
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

**Update Setting:**
```typescript
{
  key: string,
  value: any
}
```

**Workflow:**
1. Verify caller is OWNER
2. Validate key exists in allowed keys
3. Validate value type matches expected type
4. Upsert `settings` table
5. Insert `audit_log`
6. Return setting

### 4.10 Customer Portal

#### 4.10.1 Book Appointment via Portal
1. Customer login ke `/portal`
2. Navigate to Appointments → "Book New"
3. Select pet (from own pets list)
4. Select date & time (dalam jam operasional)
5. Input complaint
6. Submit
   - Call `fn_create_appointment` dengan `is_from_portal = true`
   - `status = 'WAITING'`
7. Notification sent to Admin
8. Confirmation shown to customer

#### 4.10.2 Book Grooming via Portal
1. Navigate to Grooming → "Book New"
2. Select pet
3. Select service package
4. Select date & time
5. Submit
   - Call `fn_create_grooming_booking` dengan `is_from_portal = true`
6. Confirmation shown

#### 4.10.3 Book Pet Hotel via Portal
1. Navigate to Pet Hotel → "Book New"
2. Select pet
3. Select date range
4. Select room (from available rooms)
5. Input special notes
6. Submit
   - Call `fn_create_pet_hotel_booking` dengan `is_from_portal = true`
7. Confirmation shown

#### 4.10.4 Pay Invoice Online
1. Navigate to Invoices
2. Select unpaid invoice
3. Click "Pay Now"
4. Select payment method (QRIS/E-Wallet/Transfer)
5. Redirect to payment gateway (Midtrans/Xendit)
6. Payment gateway callback → update invoice status
7. Notification sent to customer

#### 4.10.5 Shop (E-Commerce Ringan)
1. Browse products (hanya ACTIVE)
2. Add to cart (local state)
3. Checkout
   - Select delivery method (pickup/delivery)
   - Input address (jika delivery)
4. Payment via payment gateway
5. Invoice created dengan `type = 'POS'`
6. Stock deducted
7. Order tracking available di portal

---

## 5. Technical Architecture

### 5.1 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend Framework** | SolidJS | Fine-grained reactivity, no VDOM, blazing fast |
| **Meta Framework** | Vite + Solid (SPA) atau SolidStart (SSR untuk Portal) | Fast dev experience, optimal bundle |
| **UI Components** | shadcn-solid atau Kobalte + Tailwind | Accessible, customizable, lightweight |
| **Routing** | @solidjs/router atau SolidStart file-based | Type-safe, flexible |
| **State Management** | SolidJS native (`createSignal`, `createStore`) | No external deps, optimal performance |
| **Data Fetching** | @tanstack/solid-query | Caching, refetching, optimistic updates |
| **Forms** | @modular-forms/solid atau @tanstack/solid-form | Type-safe, validation integration |
| **Icons** | lucide-solid | Consistent, tree-shakeable |
| **Backend** | Supabase (PostgreSQL + Edge Functions + Auth + Storage + Realtime) | All-in-one, scalable, RLS |
| **Validation** | Zod | Type-safe, runtime validation |
| **Deployment** | Vercel (Frontend) + Supabase (Backend) | Zero config, auto-scaling |
| **External Services** | Midtrans/Xendit (Payments), Fonnte (WhatsApp), Resend (Email) | Best-in-class integrations |

### 5.2 Arsitektur High-Level

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              SolidJS SPA (Vite + TypeScript)              │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │  │
│  │  │ Staff      │  │ Customer   │  │ Shared Components  │  │  │
│  │  │ Dashboard  │  │ Portal     │  │ (shadcn-solid)     │  │  │
│  │  │ /app/*     │  │ /portal/*  │  │ /components/*      │  │  │
│  │  └────────────┘  └────────────┘  └────────────────────┘  │  │
│  │         │                │                │                │  │
│  │         └────────────────┼────────────────┘                │  │
│  │                          ▼                                 │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │      Solid Query + Supabase JS Client                │  │  │
│  │  │  (Caching, Refetching, Optimistic Updates)           │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Platform                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ PostgreSQL   │  │ Auth         │  │ Storage              │  │
│  │ (Database)   │  │ (Sessions)   │  │ (File Uploads)       │  │
│  │ + RLS        │  │              │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Realtime     │  │ Edge         │  │ Functions            │  │
│  │ (WebSocket)  │  │ Functions    │  │ (Business Logic)     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ WhatsApp     │  │ Payment      │  │ Email                │  │
│  │ Gateway      │  │ Gateway      │  │ Service              │  │
│  │ (Fonnte)     │  │ (Midtrans)   │  │ (Resend)             │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Layer 1: Presentation (SolidJS Components)                      │
│ - UI Components (shadcn-solid + custom)                         │
│ - Feature Components (modular per domain)                       │
│ - Page Components (routing)                                     │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 2: Data Fetching (Solid Query Hooks)                      │
│ - createQuery (GET operations)                                  │
│ - createMutation (POST/PUT/DELETE operations)                   │
│ - Query keys management                                         │
│ - Optimistic updates                                            │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 3: Service Layer (Supabase Client Wrappers)               │
│ - Domain-specific services (CustomerService, ProductService)    │
│ - Business logic orchestration                                  │
│ - Data transformation                                           │
│ - Error handling                                                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 4: Validation (Zod Schemas)                               │
│ - Input validation (create/update schemas)                      │
│ - Output validation (response schemas)                          │
│ - Type inference                                                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 5: Database (Supabase PostgreSQL + RLS)                   │
│ - Tables & relationships                                        │
│ - Row Level Security policies                                   │
│ - Indexes for performance                                       │
│ - Triggers for automation                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Data Flow

```
User Action
     │
     ▼
 Component (UI)
     │
     ▼
 Solid Query Hook (createMutation)
     │
     ▼
 Service Layer (validate + transform)
     │
     ▼
 Zod Schema (runtime validation)
     │
     ▼
 Supabase Client (RPC/Insert/Update/Delete)
     │
     ▼
 Supabase Edge Function (optional, complex logic)
     │
     ▼
 PostgreSQL (with RLS enforcement)
     │
     ▼
 Response → Solid Query Cache → Component Update (fine-grained)
```

---

## 6. Database Schema

### 6.1 Naming Conventions

| Aspek | Konvensi | Contoh |
|-------|----------|--------|
| Tabel | snake_case, plural | `customers`, `medical_records` |
| Kolom | snake_case | `created_at`, `customer_id` |
| Primary Key | `id UUID DEFAULT gen_random_uuid()` | — |
| Foreign Key | `<table_singular>_id` | `customer_id`, `pet_id` |
| Timestamp | `created_at`, `updated_at`, `deleted_at` | — |
| Enum | snake_case | `appointment_status` |
| Index | `idx_<table>_<column>` | `idx_customers_phone` |
| Unique | `uniq_<table>_<column>` | `uniq_users_username` |
| Function | `fn_<action>_<entity>` | `fn_calculate_loyalty_points` |
| Trigger | `trg_<table>_<action>` | `trg_users_before_insert` |

### 6.2 Complete Schema

*(Schema SQL lengkap ada di dokumen `master-arsitektur.md` Bab 3.2 — tidak di-duplikasi di sini untuk menghindari redundansi)*

**Key Tables:**
- `users` — Staff & customer accounts
- `customers` — Customer profiles
- `pets` — Pet profiles
- `appointments` — Appointment schedules
- `medical_records` — Medical history
- `rooms` — Pet hotel rooms
- `pet_hotel_bookings` — Pet hotel reservations
- `grooming_services` — Grooming packages
- `grooming_bookings` — Grooming appointments
- `products` — Inventory items
- `stock_movements` — Stock transaction history
- `purchase_orders` — Supplier orders
- `invoices` — Sales invoices
- `payments` — Payment records
- `cash_shifts` — Cashier shift tracking
- `loyalty_tiers` — Loyalty program tiers
- `loyalty_members` — Customer loyalty accounts
- `loyalty_transactions` — Points transaction history
- `promotions` — Discount campaigns
- `expenses` — Business expenses
- `customer_feedback` — Customer reviews
- `audit_logs` — System audit trail
- `notifications` — In-app notifications
- `settings` — System configuration

---

## 7. API Contracts & Workflows

### 7.1 Number Generation (Atomic)

```sql
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

### 7.2 Audit Logging

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

### 7.3 Notifications

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

### 7.4 Realtime Subscriptions

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

### 7.5 File Upload (Supabase Storage)

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

## 8. UI/UX Requirements

### 8.1 Design System

**Color Palette:**
- Primary: `#2563eb` (Blue 600)
- Secondary: `#64748b` (Slate 500)
- Success: `#10b981` (Emerald 500)
- Warning: `#f59e0b` (Amber 500)
- Error: `#ef4444` (Red 500)
- Background: `#f8fafc` (Slate 50)
- Surface: `#ffffff` (White)
- Text: `#0f172a` (Slate 900)

**Typography:**
- Font Family: Inter (sans-serif)
- Base Size: 16px
- Line Height: 1.5

**Spacing:**
- Base Unit: 4px
- Common: 4, 8, 12, 16, 24, 32, 48, 64

### 8.2 Component Library

**Base Components (shadcn-solid):**
- Button
- Input
- Select
- Checkbox
- Radio
- Switch
- Dialog
- Dropdown Menu
- Popover
- Tooltip
- Toast
- Card
- Table
- Tabs
- Accordion
- Avatar
- Badge
- Separator
- Skeleton

**Feature Components:**
- DataTable (sortable, filterable, paginated)
- FileUpload (drag & drop, preview)
- DateTimePicker
- SearchInput (debounced)
- StatusBadge (colored by status)
- ConfirmDialog
- EmptyState
- ErrorBoundary
- LoadingSpinner

### 8.3 Layout

**Staff Dashboard (`/app/*`):**
```
┌─────────────────────────────────────────────────────────┐
│ Header (Logo, User Menu, Notifications)                 │
├──────────┬──────────────────────────────────────────────┤
│ Sidebar  │ Main Content                                 │
│          │                                              │
│ - Dashboard│                                            │
│ - CRM    │                                              │
│ - Appointments│                                         │
│ - Pet Hotel│                                            │
│ - Grooming│                                             │
│ - Products│                                             │
│ - POS    │                                              │
│ - Reports│                                              │
│ - Settings│                                             │
└──────────┴──────────────────────────────────────────────┘
```

**Customer Portal (`/portal/*`):**
```
┌─────────────────────────────────────────────────────────┐
│ Header (Logo, User Menu, Cart)                          │
├─────────────────────────────────────────────────────────┤
│ Main Content                                            │
│                                                         │
│ - My Pets                                               │
│ - Appointments                                          │
│ - Pet Hotel                                             │
│ - Grooming                                              │
│ - Invoices                                              │
│ - Loyalty                                               │
│ - Shop                                                  │
└─────────────────────────────────────────────────────────┘
```

### 8.4 Responsive Design

**Breakpoints:**
- Mobile: `< 640px`
- Tablet: `640px - 1024px`
- Desktop: `> 1024px`

**Mobile-first approach:**
- Sidebar collapsible (hamburger menu)
- Tables → cards on mobile
- Forms → single column on mobile
- Touch-friendly buttons (min 44x44px)

---

## 9. Testing Strategy

### 9.1 Testing Pyramid

```
        ╱╲
       ╱  ╲
      ╱ E2E╲        ← 10% (Critical paths)
     ╱──────╲
    ╱Integration╲    ← 30% (Workflows)
   ╱──────────────╲
  ╱   Unit Tests   ╲  ← 60% (Business logic)
 ╱──────────────────╲
```

### 9.2 Unit Tests (≥80% coverage)

**Tools:** Vitest

**Coverage:**
- Zod schemas (validation rules)
- Service layer functions (business logic)
- Utility functions (calculations, formatting)
- State machine transitions

**Example:**
```typescript
// tests/services/inventory.test.ts
describe('recordStockMovement', () => {
  it('should reject negative stock', async () => {
    // Setup: product with stock = 5
    // Action: record OUT movement with quantity = 10
    // Assert: throw INSUFFICIENT_STOCK
  });
  
  it('should allow stock increase', async () => {
    // Setup: product with stock = 5
    // Action: record IN movement with quantity = 10
    // Assert: new stock = 15
  });
});
```

### 9.3 Integration Tests

**Tools:** Vitest + Supabase local instance

**Coverage:**
- Complete workflows (create → update → delete)
- State transitions
- Multi-table operations (transactions)
- RLS policies

**Example:**
```typescript
// tests/integration/appointment.test.ts
describe('Appointment Workflow', () => {
  it('should create, start, and complete appointment', async () => {
    // 1. Create appointment (status = WAITING)
    // 2. Update status to IN_PROGRESS
    // 3. Create medical record
    // 4. Update status to DONE
    // 5. Assert: all records created correctly
  });
  
  it('should reject invalid state transition', async () => {
    // 1. Create appointment (status = WAITING)
    // 2. Try to update status to DONE (skip IN_PROGRESS)
    // 3. Assert: throw INVALID_STATE_TRANSITION
  });
});
```

### 9.4 E2E Tests

**Tools:** Playwright

**Coverage:**
- Critical user journeys
- Cross-browser testing
- Performance benchmarks

**Critical Paths:**
1. Login → Create customer → Create pet → Book appointment → Check-in → Create medical record → Check-out
2. Login → Create product → Record stock → Create invoice → Record payment
3. Login → Create pet hotel booking → Check-in → Add log → Check-out
4. Customer portal → Login → Book appointment → Pay invoice

**Example:**
```typescript
// tests/e2e/pos-checkout.spec.ts
test('POS checkout flow', async ({ page }) => {
  // 1. Login as kasir
  await page.goto('/login');
  await page.fill('[name="username"]', 'kasir01');
  await page.fill('[name="pin"]', '123456');
  await page.click('button[type="submit"]');
  
  // 2. Navigate to POS
  await page.click('text=POS');
  
  // 3. Add product to cart
  await page.click('[data-testid="product-123"]');
  await page.fill('[data-testid="quantity"]', '2');
  
  // 4. Checkout
  await page.click('text=Checkout');
  await page.click('text=Cash');
  await page.click('text=Confirm');
  
  // 5. Assert: invoice created, stock deducted
  await expect(page.locator('text=Invoice created')).toBeVisible();
});
```

### 9.5 Test Data Management

**Strategy:**
- Seed data untuk development & testing
- Factory functions untuk generate test data
- Cleanup after each test (transaction rollback)

**Example:**
```typescript
// tests/fixtures/factories.ts
export function createCustomer(overrides?: Partial<Customer>): Customer {
  return {
    id: crypto.randomUUID(),
    name: faker.person.fullName(),
    phone: faker.phone.number(),
    email: faker.internet.email(),
    // ... defaults
    ...overrides,
  };
}
```

---

## 10. Deployment & Configuration

### 10.1 Environment Variables

**Frontend (Vercel):**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ENABLE_WHATSAPP_NOTIFICATIONS=false
VITE_PAYMENT_GATEWAY=midtrans  # or xendit
```

**Backend (Supabase Edge Functions):**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FONNTE_API_KEY=your-fonnte-key
RESEND_API_KEY=your-resend-key
MIDTRANS_SERVER_KEY=your-midtrans-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
```

### 10.2 Deployment Steps

**Frontend (Vercel):**
1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variables
4. Deploy (auto on push to `main`)

**Backend (Supabase):**
1. Create Supabase project
2. Run migrations (`supabase db push`)
3. Seed initial data (`supabase db seed`)
4. Deploy Edge Functions (`supabase functions deploy`)
5. Configure RLS policies
6. Set up Storage buckets

### 10.3 CI/CD Pipeline

**GitHub Actions:**
```yaml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e
      
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 11. Edge Cases & Error Handling

### 11.1 Error Codes Standard

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

### 11.2 Error Matrix per Module

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

### 11.3 Concurrency Handling

| Scenario | Strategy |
|----------|----------|
| Concurrent login | Allowed (separate sessions) |
| Concurrent appointment creation | Atomic queue number generation |
| Concurrent POS checkout (same product) | Atomic stock update with `FOR UPDATE` |
| Concurrent stock movement | Atomic SQL update with guard |
| Concurrent invoice payment | Atomic `paid_amount` update |
| Concurrent loyalty points | Atomic update via RPC |
| Concurrent booking same room | Check overlap in transaction |

### 11.4 Data Integrity Rules

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

## 12. Glossary

| Istilah | Definisi |
|---------|----------|
| RPC | Remote Procedure Call — fungsi yang dijalankan di Supabase (Edge Function atau Postgres function) |
| Atomic | Operasi yang要么 berhasil semua,要么 gagal semua (transaction) |
| Idempotent | Operasi yang bisa dipanggil berkali-kali tanpa efek samping berbeda |
| State machine | Model transisi status yang eksplisit |
| Edge case | Kasus khusus yang jarang terjadi tapi harus ditangani |
| Race condition | Bug akibat konkurensi, di mana hasil tergantung urutan eksekusi |
| Soft-delete | Hapus logis (set `deleted_at`), data tetap ada |
| Hard-delete | Hapus fisik dari database |
| RLS | Row Level Security — otorisasi di level database |
| FORBIDDEN | Error 403 — user tidak punya akses |
| NOT_FOUND | Error 404 — resource tidak ada |
| CONFLICT | Error 409 — resource sudah ada / konflik |
| BAD_REQUEST | Error 400 — input tidak valid |

---

## 13. Implementation Checklist

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
- [ ] TypeScript strict mode (no `any`)
- [ ] Zod validation di setiap input/output
- [ ] Documentation (JSDoc) untuk setiap function
- [ ] Code review oleh minimal 1 developer lain

---

## 14. Final Notes

### 14.1 Prinsip Implementasi

1. **Contract-First:** Implementasi harus mengikuti kontrak yang didefinisikan di dokumen ini
2. **Fail-Fast:** Validasi di setiap layer (Zod → Service → DB)
3. **Atomic Operations:** Multi-table operations harus dalam transaction
4. **Audit Everything:** Setiap perubahan state tercatat
5. **Explicit State Transitions:** Tidak boleh melompat state
6. **Type-Safe:** TypeScript strict mode + Zod runtime validation
7. **Role-Based Access:** Isolasi data dan fitur berdasarkan role

### 14.2 Dokumentasi Ini Adalah

✅ **Baseline Contract Final** — acuan tunggal untuk implementasi
✅ **Bukan roadmap** — semua fitur harus diimplementasikan
✅ **Bukan fase** — tidak ada "nanti saja"
✅ **Bukan wishlist** — semua requirement wajib

### 14.3 Success Criteria

Sistem dianggap **SELESAI** jika:
- ✅ Semua modul diimplementasikan sesuai spesifikasi
- ✅ Semua test passing (unit, integration, E2E)
- ✅ Deploy ke Vercel + Supabase tanpa error
- ✅ Code review approved
- ✅ Documentation lengkap
- ✅ Performance metrics meets target (Lighthouse score ≥ 90)
- ✅ Security audit passed (RLS, input validation, etc.)

---

**Dokumen ini merupakan baseline final untuk implementasi Petora. Seluruh developer dan AI agent wajib mengikuti kontrak yang didefinisikan di sini untuk memastikan konsistensi, keamanan, dan maintainability sistem.** 🚀
