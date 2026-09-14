# AGENTS.md — Aturan Pengembangan Petora

## Constitution & Implementation Rules | Baseline Final

---

## 1. Preamble & Tujuan

Dokumen ini adalah **konstitusi pengembangan** untuk sistem Petora. Setiap AI agent dan developer **WAJIB** mengikuti aturan di sini tanpa pengecualian. Dokumen ini melengkapi:

- `docs/00-baseline-governance.md` — sumber kebenaran, precedence, status, dan change control
- `docs/01-product-baseline.md` — spesifikasi produk dan feature requirements
- `docs/02-technical-architecture-contract.md` — kontrak arsitektur teknis
- `docs/03-module-workflows-contract.md` — detail workflow dan business rules per modul

Jika aturan di dokumen ini dan baseline governance tampak bertentangan, hentikan implementasi dan catat keputusan di `docs/06-decision-register.md` sebelum melanjutkan.

**Tujuan utama:**

1. Menghilangkan ambiguitas dalam implementasi
2. Mencegah placeholder, hardcode, dan solusi temporer
3. Menjamin konsistensi kode di seluruh sistem
4. Memastikan type-safety, security, dan maintainability
5. Memudahkan kolaborasi antar developer dan AI agent

---

## 2. Prinsip Fundamental (The Constitution)

### 2.1 The Ten Commandments of Petora

| # | Prinsip | Penjelasan |
|---|---------|------------|
| 1 | **NO PLACEHOLDERS** | Tidak ada `TODO`, `FIXME`, `// implement later`, atau stub function |
| 2 | **NO HARDCODE** | Tidak ada magic number/string. Semua via constants, env vars, atau settings |
| 3 | **TYPE-SAFE ALWAYS** | TypeScript strict mode. Tidak ada `any`, `@ts-ignore`, atau `as unknown` |
| 4 | **VALIDATE EVERYTHING** | Zod validation di setiap input/output. Tidak ada data mentah masuk DB |
| 5 | **ATOMIC OPERATIONS** | Multi-table operations harus dalam transaction/RPC |
| 6 | **FAIL-FAST** | Validasi sedini mungkin. Error harus eksplisit dengan error code |
| 7 | **AUDIT EVERYTHING** | Setiap perubahan state tercatat di `audit_logs` |
| 8 | **RLS ENFORCED** | Authorization di level database. Application-level hanya secondary |
| 9 | **CONTRACT-FIRST** | Interface & schema dulu, implementasi mengikuti |
| 10 | **TEST-DRIVEN** | Tidak ada fitur tanpa test (unit + integration + E2E) |

### 2.2 Red Lines (DILARANG KERAS)

❌ **DILARANG** menggunakan `any` di TypeScript
❌ **DILARANG** menggunakan `@ts-ignore` atau `@ts-nocheck`
❌ **DILARANG** menggunakan `console.log` di production code (gunakan logger)
❌ **DILARANG** Hardcode URL, API key, atau credentials di source code
❌ **DILARANG** Hardcode business rules (pakai settings/config)
❌ **DILARANG** Bypass RLS dengan `service_role` di client-side
❌ **DILARANG** Menyimpan PIN/password dalam plain text
❌ **DILARANG** Menghapus data fisik tanpa audit log (kecuali hard-delete yang diizinkan)
❌ **DILARANG** Melompat state machine (misal: WAITING → DONE tanpa IN_PROGRESS)
❌ **DILARANG** Menggunakan `useEffect` di SolidJS (pakai `createEffect`)
❌ **DILARANG** Membuat komponen React di codebase SolidJS
❌ **DILARANG** Direct query tanpa RLS check di client
❌ **DILARANG** Commit tanpa test yang passing
❌ **DILARANG** Merge PR tanpa code review

---

## 3. Aturan Arsitektur & Layer

### 3.1 Layer Separation (WAJIB)

```text
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Presentation (SolidJS Components)              │
│ - HANYA UI logic, TIDAK ada business logic              │
│ - HANYA panggil hooks, TIDAK langsung panggil service   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Data Fetching (Solid Query Hooks)              │
│ - HANYA orchestrate query/mutation                      │
│ - HANYA panggil service layer                           │
│ - TIDAK ada validasi bisnis (delegasi ke service)       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Service Layer (Business Logic)                 │
│ - SEMUA business logic di sini                          │
│ - Validasi via Zod                                      │
│ - Panggil Supabase client/RPC                           │
│ - Handle error & transform data                         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Database (Supabase + RLS)                      │
│ - Data integrity via constraints                        │
│ - Authorization via RLS policies                        │
│ - Complex logic via Edge Functions/RPC                  │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Aturan Per Layer

**Layer 1 (Components):**

- ✅ Boleh: UI rendering, event handling, panggil hooks
- ❌ Dilarang: Business logic, direct Supabase calls, state management kompleks
- ❌ Dilarang: Inline styles (pakai Tailwind)
- ❌ Dilarang: Magic strings (pakai constants)

**Layer 2 (Hooks):**

- ✅ Boleh: Query orchestration, optimistic updates, cache invalidation
- ❌ Dilarang: Business logic, data transformation kompleks
- ❌ Dilarang: Direct Supabase calls (harus via service)

**Layer 3 (Services):**

- ✅ Boleh: Business logic, validation, data transformation, error handling
- ❌ Dilarang: UI logic, routing logic
- ❌ Dilarang: Skip validation (Zod wajib)

**Layer 4 (Database):**

- ✅ Boleh: Constraints, RLS, triggers, RPC functions
- ❌ Dilarang: Business logic di SQL (kecuali atomic operations)
- ❌ Dilarang: Bypass RLS

---

## 4. Aturan Database & RLS

### 4.1 Schema Rules

```sql
-- ✅ WAJIB: Setiap tabel punya
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()

-- ✅ WAJIB: Soft-delete jika data bisa dihapus
deleted_at TIMESTAMPTZ

-- ✅ WAJIB: Foreign key dengan ON DELETE behavior eksplisit
customer_id UUID REFERENCES customers(id) ON DELETE CASCADE

-- ✅ WAJIB: Index untuk kolom yang sering di-query
CREATE INDEX idx_<table>_<column> ON <table>(<column>);

-- ✅ WAJIB: Unique constraint untuk kolom unik
CREATE UNIQUE INDEX uniq_<table>_<column> ON <table>(<column>);
```

### 4.2 RLS Policies (WAJIB)

**Setiap tabel WAJIB punya RLS policies:**

```sql
-- ✅ WAJIB: Enable RLS
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

-- ✅ WAJIB: Minimal 1 policy per operation (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "<description>" ON <table>
  FOR <operation> TO authenticated
  USING (<condition>)
  WITH CHECK (<condition>);
```

**Aturan RLS:**

- ✅ Gunakan `auth.uid()` untuk identifikasi user
- ✅ Gunakan helper function `get_user_role(auth.uid())` untuk role check
- ✅ Customer hanya bisa akses data sendiri (`customer_id = get_customer_id(auth.uid())`)
- ✅ Staff bisa akses data sesuai role (lihat Permission Matrix di PRD)
- ✅ Owner bisa akses semua data
- ❌ JANGAN bypass RLS di client-side
- ❌ JANGAN gunakan `service_role` di client

### 4.3 Migration Rules

```sql
-- ✅ WAJIB: Migration harus idempotent
-- ✅ WAJIB: Migration harus reversible (ada UP dan DOWN)
-- ✅ WAJIB: Migration harus di-test di local environment
-- ❌ DILARANG: Migration yang menghapus data tanpa backup
-- ❌ DILARANG: Migration yang mengubah tipe data tanpa migration script
```

---

## 5. Aturan TypeScript & Validation

### 5.1 TypeScript Strict Mode

```typescript
// tsconfig.json WAJIB:
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 5.2 Type Definitions

```typescript
// ✅ WAJIB: Setiap entity punya type definition
export interface Customer extends SoftDeletable {
  id: UUID;
  name: string;
  phone: string | null;
  // ... semua field eksplisit
}

// ❌ DILARANG: Menggunakan any
function processData(data: any) { ... }

// ✅ WAJIB: Menggunakan type yang eksplisit
function processData(data: Customer) { ... }

// ❌ DILARANG: Type assertion tanpa validasi
const customer = response as Customer;

// ✅ WAJIB: Validasi dengan Zod sebelum type assertion
const customer = customerSchema.parse(response);
```

### 5.3 Zod Validation (WAJIB)

```typescript
// ✅ WAJIB: Setiap input/output punya Zod schema
export const createCustomerSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(100).optional(),
  // ... semua field dengan validasi eksplisit
});

// ✅ WAJIB: Validasi di service layer
async function createCustomer(input: unknown) {
  const validated = createCustomerSchema.parse(input);
  // ... business logic
}

// ❌ DILARANG: Skip validation
async function createCustomer(input: any) {
  // langsung insert ke DB tanpa validasi
}
```

---

## 6. Aturan Service Layer

### 6.1 Structure

```typescript
// src/services/customer.service.ts

// ✅ WAJIB: Export semua functions
export const CustomerService = {
  list: async (params: ListCustomersParams) => { ... },
  getById: async (id: UUID) => { ... },
  create: async (input: CreateCustomerInput) => { ... },
  update: async (id: UUID, input: UpdateCustomerInput) => { ... },
  delete: async (id: UUID) => { ... },
};
```

### 6.2 Rules

```typescript
// ✅ WAJIB: Validasi input dengan Zod
async function create(input: unknown) {
  const validated = createCustomerSchema.parse(input);
  // ...
}

// ✅ WAJIB: Handle error dengan error code eksplisit
try {
  // ...
} catch (error) {
  if (error instanceof ZodError) {
    throw new AppError(ErrorCode.VALIDATION_ERROR, error.errors);
  }
  if (error.code === '23505') { // unique violation
    throw new AppError(ErrorCode.CONFLICT, 'Customer already exists');
  }
  throw error;
}

// ✅ WAJIB: Audit log di setiap operasi
await logAudit({
  user_id: currentUser.id,
  action: 'CREATE_CUSTOMER',
  entity_type: 'customers',
  entity_id: newCustomer.id,
  new_values: newCustomer,
});

// ❌ DILARANG: Return raw database response
return await supabase.from('customers').select('*');

// ✅ WAJIB: Transform response
const { data, error } = await supabase.from('customers').select('*');
if (error) throw error;
return data.map(transformCustomerResponse);
```

---

## 7. Aturan UI Components (SolidJS)

### 7.1 Component Structure

```typescript
// ✅ WAJIB: Component structure yang konsisten
import { Component, Show, For } from 'solid-js';
import { createQuery } from '@tanstack/solid-query';
import { CustomerService } from '@/services/customer.service';

interface CustomerListProps {
  // Props yang eksplisit
  filter?: string;
}

export const CustomerList: Component<CustomerListProps> = (props) => {
  // ✅ WAJIB: Data fetching via hooks
  const query = createQuery(() => ({
    queryKey: ['customers', props.filter],
    queryFn: () => CustomerService.list({ filter: props.filter }),
  }));

  // ✅ WAJIB: Handle loading & error states
  return (
    <Show when={!query.isLoading} fallback={<LoadingSpinner />}>
      <Show when={!query.isError} fallback={<ErrorMessage error={query.error} />}>
        <For each={query.data}>
          {(customer) => <CustomerCard customer={customer} />}
        </For>
      </Show>
    </Show>
  );
};
```

### 7.2 Rules

```typescript
// ✅ WAJIB: Gunakan SolidJS primitives
import { createSignal, createEffect, createMemo } from 'solid-js';

// ❌ DILARANG: useEffect (ini React)
useEffect(() => { ... });

// ✅ WAJIB: createEffect (SolidJS)
createEffect(() => { ... });

// ✅ WAJIB: Props sebagai accessor untuk reactivity
interface Props {
  value: () => string; // accessor
}

// ❌ DILARANG: Props sebagai value (tidak reactive)
interface Props {
  value: string; // ❌
}

// ✅ WAJIB: Gunakan shadcn-solid components
import { Button } from '@/components/ui/button';

// ❌ DILARANG: Custom button tanpa accessibility
<button onClick={...}>Click me</button>
```

---

## 8. Aturan Testing

### 8.1 Testing Pyramid

```text
        ╱╲
       ╱  ╲
      ╱ E2E╲        ← 10% (Critical paths)
     ╱──────╲
    ╱Integration╲    ← 30% (Workflows)
   ╱──────────────╲
  ╱   Unit Tests   ╲  ← 60% (Business logic)
 ╱──────────────────╲
```

### 8.2 Unit Tests (WAJIB)

```typescript
// ✅ WAJIB: Test setiap business rule
describe('CustomerService.create', () => {
  it('should create customer with valid input', async () => {
    // Arrange
    const input = { name: 'John Doe', phone: '081234567890' };
    
    // Act
    const result = await CustomerService.create(input);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.name).toBe('John Doe');
  });

  it('should reject invalid input', async () => {
    // Arrange
    const input = { name: '' }; // invalid
    
    // Act & Assert
    await expect(CustomerService.create(input)).rejects.toThrow();
  });

  it('should handle duplicate email', async () => {
    // ... test edge case
  });
});
```

### 8.3 Integration Tests (WAJIB)

```typescript
// ✅ WAJIB: Test complete workflows
describe('Appointment Workflow', () => {
  it('should create, start, and complete appointment', async () => {
    // 1. Create appointment
    const appointment = await AppointmentService.create({ ... });
    expect(appointment.status).toBe('WAITING');
    
    // 2. Update to IN_PROGRESS
    const updated = await AppointmentService.updateStatus(appointment.id, 'IN_PROGRESS');
    expect(updated.status).toBe('IN_PROGRESS');
    
    // 3. Create medical record
    const record = await MedicalRecordService.create({ appointment_id: appointment.id, ... });
    expect(record).toBeDefined();
    
    // 4. Update to DONE
    const completed = await AppointmentService.updateStatus(appointment.id, 'DONE');
    expect(completed.status).toBe('DONE');
  });
});
```

### 8.4 E2E Tests (WAJIB untuk Critical Paths)

```typescript
// ✅ WAJIB: Test critical user journeys
test('POS checkout flow', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.fill('[name="username"]', 'kasir01');
  await page.fill('[name="pin"]', '123456');
  await page.click('button[type="submit"]');
  
  // 2. Navigate to POS
  await page.click('text=POS');
  
  // 3. Add product to cart
  await page.click('[data-testid="product-123"]');
  
  // 4. Checkout
  await page.click('text=Checkout');
  
  // 5. Assert: invoice created
  await expect(page.locator('text=Invoice created')).toBeVisible();
});
```

### 8.5 Coverage Requirements

- ✅ Unit tests: ≥80% coverage
- ✅ Integration tests: semua workflows
- ✅ E2E tests: semua critical paths
- ❌ DILARANG: Commit tanpa test yang passing

---

## 9. Aturan Error Handling

### 9.1 Error Codes (WAJIB)

```typescript
// ✅ WAJIB: Gunakan error codes yang eksplisit
export enum ErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  // ... semua error codes di PRD
}

// ✅ WAJIB: Throw AppError dengan error code
throw new AppError(ErrorCode.INVALID_CREDENTIALS, 'Wrong PIN');

// ❌ DILARANG: Throw generic error
throw new Error('Wrong PIN');
```

### 9.2 Error Response Format

```typescript
// ✅ WAJIB: Konsisten error response
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Wrong PIN",
    "details": { ... } // optional
  }
}
```

---

## 10. Aturan Audit & Logging

### 10.1 Audit Log (WAJIB)

```typescript
// ✅ WAJIB: Log setiap operasi penting
await logAudit({
  user_id: currentUser.id,
  action: 'CREATE_CUSTOMER',
  entity_type: 'customers',
  entity_id: newCustomer.id,
  old_values: null,
  new_values: newCustomer,
  ip_address: request.ip,
  user_agent: request.userAgent,
});
```

### 10.2 Actions yang Wajib Di-log

Lihat daftar lengkap di PRD Section 7.2. Minimal:

- LOGIN, LOGOUT
- CREATE, UPDATE, DELETE untuk semua entity
- State transitions
- Payment operations
- Settings changes

---

## 11. Aturan Git & Commit

### 11.1 Branch Naming

```bash
# ✅ WAJIB: Format branch name
feature/<module>-<description>
bugfix/<module>-<description>
hotfix/<module>-<description>
refactor/<module>-<description>

# Contoh:
feature/auth-login
bugfix/pos-stock-calculation
hotfix/rls-customer-data
refactor/service-layer-structure
```

### 11.2 Commit Messages

```bash
# ✅ WAJIB: Conventional Commits
<type>(<scope>): <description>

[optional body]

[optional footer]

# Types:
feat: fitur baru
fix: bug fix
docs: dokumentasi
style: formatting, tidak ada logic change
refactor: refactor code
test: add tests
chore: maintenance

# Contoh:
feat(auth): implement login with PIN
fix(pos): correct stock calculation on checkout
docs(api): update invoice endpoint documentation
test(customer): add unit tests for create function
```

### 11.3 Pull Request Rules

```markdown
# ✅ WAJIB: PR description
## What
Deskripsi perubahan

## Why
Alasan perubahan

## How
Cara implementasi

## Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing (jika applicable)
- [ ] Manual testing done

## Checklist
- [ ] No placeholders
- [ ] No hardcode
- [ ] Type-safe (no any)
- [ ] Zod validation added
- [ ] Audit logging added
- [ ] RLS policies tested
- [ ] Documentation updated
```

---

## 12. Aturan Deployment

### 12.1 Environment Variables

```bash
# ✅ WAJIB: Semua config via env vars
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ENABLE_WHATSAPP_NOTIFICATIONS=false

# ❌ DILARANG: Hardcode di source code
const SUPABASE_URL = 'https://your-project.supabase.co'; // ❌
```

### 12.2 Deployment Checklist

```markdown
# ✅ WAJIB: Sebelum deploy
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies tested
- [ ] Edge functions deployed
- [ ] Storage buckets configured
- [ ] Smoke test done
```

---

## 13. Anti-Patterns (DILARANG KERAS)

### 13.1 Code Anti-Patterns

```typescript
// ❌ DILARANG: Magic numbers
if (stock < 10) { ... }

// ✅ WAJIB: Constants
const LOW_STOCK_THRESHOLD = 10;
if (stock < LOW_STOCK_THRESHOLD) { ... }

// ❌ DILARANG: Magic strings
if (status === 'PAID') { ... }

// ✅ WAJIB: Enums
enum InvoiceStatus { PAID = 'PAID' }
if (status === InvoiceStatus.PAID) { ... }

// ❌ DILARANG: Nested ternary
const result = a ? b ? c : d : e;

// ✅ WAJIB: If-else atau switch
let result;
if (a) {
  if (b) result = c;
  else result = d;
} else {
  result = e;
}

// ❌ DILARANG: God function (>50 lines)
async function processEverything() {
  // 200 lines of code
}

// ✅ WAJIB: Small, focused functions
async function validateInput() { ... }
async function processData() { ... }
async function saveToDatabase() { ... }
```

### 13.2 Architecture Anti-Patterns

```typescript
// ❌ DILARANG: Business logic di component
const CustomerList = () => {
  const calculateDiscount = (customer) => {
    // business logic di component ❌
  };
  // ...
};

// ✅ WAJIB: Business logic di service
const calculateDiscount = (customer) => {
  // business logic di service ✅
};

// ❌ DILARANG: Direct Supabase call di component
const CustomerList = () => {
  const { data } = useQuery({
    queryKey: ['customers'],
    queryFn: () => supabase.from('customers').select('*'), // ❌
  });
};

// ✅ WAJIB: Via service layer
const CustomerList = () => {
  const query = createQuery(() => ({
    queryKey: ['customers'],
    queryFn: () => CustomerService.list(), // ✅
  }));
};
```

---

## 14. Definition of Done per Modul

Sebelum menyelesaikan setiap modul, developer **WAJIB** memastikan:

### 14.1 Database

- [ ] Schema created dengan naming conventions
- [ ] Indexes untuk kolom yang sering di-query
- [ ] Foreign keys dengan ON DELETE behavior
- [ ] RLS policies untuk semua operations
- [ ] RLS tested dengan berbagai roles
- [ ] Migration scripts reversible
- [ ] Seed data untuk testing

### 14.2 Backend (Service Layer)

- [ ] All functions implemented sesuai workflow di PRD
- [ ] Zod validation untuk semua input/output
- [ ] Error handling dengan error codes
- [ ] Audit logging untuk semua operations
- [ ] Atomic operations untuk multi-table changes
- [ ] State machine transitions validated
- [ ] Edge cases handled sesuai PRD

### 14.3 Frontend (Components)

- [ ] All pages implemented sesuai design
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Empty states handled
- [ ] Form validation (client-side + server-side)
- [ ] Optimistic updates (jika applicable)
- [ ] Realtime subscriptions (jika applicable)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Accessibility (ARIA labels, keyboard navigation)

### 14.4 Testing

- [ ] Unit tests untuk semua business rules (≥80% coverage)
- [ ] Integration tests untuk semua workflows
- [ ] E2E tests untuk critical paths
- [ ] All tests passing
- [ ] No test skipped without reason

### 14.5 Documentation

- [ ] JSDoc untuk semua functions
- [ ] README untuk modul (jika kompleks)
- [ ] API documentation updated
- [ ] Changelog updated

### 14.6 Code Quality

- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] No placeholders
- [ ] No hardcode
- [ ] No `any` types
- [ ] Code reviewed by minimal 1 developer
- [ ] Performance optimized (no unnecessary re-renders)

---

## 15. Workflow Pengembangan (Step-by-Step)

### 15.1 Phase 1: Setup & Database

```bash
# Step 1: Setup project
npm create vite@latest petora -- --template solid-ts
cd petora
npm install

# Step 2: Install dependencies
npm install @supabase/supabase-js @tanstack/solid-query zod
npm install @solidjs/router @kobalte/core tailwindcss
npm install -D typescript @types/node vitest @testing-library/solid

# Step 3: Setup Supabase
npx supabase init
npx supabase start

# Step 4: Create database schema
# - Buat migration files di supabase/migrations/
# - Jalankan: npx supabase db push
# - Test RLS policies
```

### 15.2 Phase 2: Type Definitions & Schemas

```bash
# Step 5: Define TypeScript types
# - Buat files di src/types/
# - Define semua interfaces sesuai PRD

# Step 6: Define Zod schemas
# - Buat files di src/schemas/
# - Define semua validation schemas
```

### 15.3 Phase 3: Service Layer

```bash
# Step 7: Implement service layer
# - Buat files di src/services/
# - Implement semua functions sesuai workflow
# - Add Zod validation
# - Add error handling
# - Add audit logging

# Step 8: Test service layer
# - Buat unit tests di tests/services/
# - Test semua business rules
# - Test semua edge cases
```

### 15.4 Phase 4: Data Fetching Hooks

```bash
# Step 9: Implement Solid Query hooks
# - Buat files di src/hooks/
# - Implement createQuery untuk GET operations
# - Implement createMutation untuk POST/PUT/DELETE
# - Add optimistic updates (jika applicable)

# Step 10: Test hooks
# - Buat integration tests di tests/hooks/
```

### 15.5 Phase 5: UI Components

```bash
# Step 11: Setup UI library
# - Install shadcn-solid atau Kobalte
# - Setup Tailwind CSS
# - Create base components

# Step 12: Implement feature components
# - Buat files di src/components/features/
# - Implement semua pages sesuai design
# - Add loading, error, empty states
# - Add form validation
# - Add responsive design

# Step 13: Test components
# - Buat E2E tests di tests/e2e/
# - Test critical user journeys
```

### 15.6 Phase 6: Integration & Deployment

```bash
# Step 14: Integration testing
# - Test complete workflows
# - Test cross-module interactions
# - Test realtime subscriptions

# Step 15: Deployment
# - Setup Vercel
# - Configure environment variables
# - Deploy Supabase Edge Functions
# - Deploy frontend
# - Smoke test
```

---

## 16. Checklist Final

Sebelum menyelesaikan seluruh sistem, pastikan:

### 16.1 Functional Requirements

- [ ] Semua modul diimplementasikan sesuai PRD
- [ ] Semua workflow berfungsi sesuai spesifikasi
- [ ] Semua edge cases ditangani
- [ ] Semua error codes sesuai matrix
- [ ] Semua state transitions mengikuti state machine

### 16.2 Non-Functional Requirements

- [ ] Type-safe (no `any`)
- [ ] Performance optimal (Lighthouse score ≥ 90)
- [ ] Security (RLS tested, no vulnerabilities)
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Responsive design (mobile, tablet, desktop)

### 16.3 Quality Requirements

- [ ] Unit tests ≥80% coverage
- [ ] Integration tests untuk semua workflows
- [ ] E2E tests untuk critical paths
- [ ] All tests passing
- [ ] No linting errors
- [ ] No TypeScript errors
- [ ] Code reviewed

### 16.4 Documentation Requirements

- [ ] JSDoc untuk semua functions
- [ ] README untuk setup & deployment
- [ ] API documentation
- [ ] Changelog

### 16.5 Deployment Requirements

- [ ] Deployed to Vercel
- [ ] Supabase configured
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Smoke test passed

---

## 17. Glossary

| Istilah | Definisi |
|---------|----------|
| **PRD** | Product Requirements Document — spesifikasi fitur & workflow |
| **Contract** | Kesepakatan teknis yang wajib diikuti |
| **Baseline** | Acuan dasar yang tidak boleh diubah tanpa approval |
| **Placeholder** | Kode sementara yang belum diimplementasi (DILARANG) |
| **Hardcode** | Nilai tetap yang ditulis langsung di kode (DILARANG) |
| **Type-safe** | Kode yang divalidasi oleh TypeScript compiler |
| **Atomic** | Operasi yang要么 berhasil semua,要么 gagal semua |
| **Idempotent** | Operasi yang bisa dipanggil berkali-kali tanpa efek samping |
| **RLS** | Row Level Security — otorisasi di level database |
| **Edge Function** | Serverless function di Supabase |
| **State Machine** | Model transisi status yang eksplisit |

---

## 18. Final Notes

### 18.1 Dokumen Ini Adalah

✅ **Konstitusi pengembangan** — aturan wajib untuk semua developer & AI agent
✅ **Bukan saran** — ini adalah aturan yang harus diikuti
✅ **Bukan guideline** — ini adalah requirement
✅ **Bukan optional** — semua aturan wajib dipatuhi

### 18.2 Consequences

Jika aturan di dokumen ini dilanggar:

- ❌ Code review akan ditolak
- ❌ PR tidak akan di-merge
- ❌ Deployment akan di-hold
- ❌ Developer harus refactor

### 18.3 Success Criteria

Sistem dianggap **SELESAI** jika:

- ✅ Semua aturan di dokumen ini dipatuhi
- ✅ Semua checklist di Phase 15 terpenuhi
- ✅ Semua checklist di Phase 16 terpenuhi
- ✅ Sistem deployed dan berfungsi dengan baik
- ✅ Tidak ada placeholder, hardcode, atau solusi temporer

---

**Dokumen ini adalah konstitusi pengembangan Petora. Seluruh developer dan AI agent WAJIB mengikuti aturan di sini untuk memastikan kualitas, konsistensi, dan maintainability sistem.** 🚀

**Dilarang keras:**

- ❌ Placeholder
- ❌ Hardcode
- ❌ `any` types
- ❌ Skip validation
- ❌ Skip testing
- ❌ Bypass RLS

**Wajib:**

- ✅ Type-safe
- ✅ Contract-first
- ✅ Test-driven
- ✅ Audit everything
- ✅ Fail-fast
- ✅ Atomic operations
