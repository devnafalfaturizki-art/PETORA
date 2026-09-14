# Requirement Traceability Matrix

## Petora | Requirement -> Delivery Evidence

**Status:** Normative delivery artifact
**Owner:** Technical Owner bersama Product Owner
**Update rule:** Setiap requirement baru atau perubahan kontrak wajib menambah atau memperbarui baris di sini.

## 1. Cara membaca

Satu baris mewakili satu capability yang dapat dirilis. Kolom `Contract source` menunjuk sumber intent/aturan; kolom delivery diisi saat implementasi berjalan. Status `PLANNED` berarti belum boleh dianggap selesai.

| ID | Capability | Contract source | Permission | State/data boundary | Required evidence | Status |
|---|---|---|---|---|---|---|
| `AUTH-001` | Login username + PIN, lockout, session | Product 4.1; Workflow 2 | Public login; role after auth | User identity and session | schema, auth integration test, E2E, audit `LOGIN` | `BLOCKED` by `DEC-OPEN-001` |
| `AUTH-002` | Change/reset PIN | Product 4.1; Workflow 2 | Self; Owner/Admin according to matrix | No plaintext PIN | unit, authorization integration, audit | `BLOCKED` by `DEC-OPEN-001` |
| `CRM-001` | Customer create/update/guest conversion | Product 4.2; Workflow 3 | Owner/Admin | Customer soft-delete invariant | service test, RLS test, audit | `PLANNED` |
| `CRM-002` | Pet profile and health history | Product 4.2; Workflow 3 | Owner/Admin/Doctor/customer-own | Pet belongs to customer | service, RLS, E2E portal | `PLANNED` |
| `CLINIC-001` | Appointment queue and state machine | Product 4.3; Workflow 4 | Role matrix | `WAITING -> IN_PROGRESS -> DONE`; cancel rules | transition unit, concurrency integration, E2E | `PLANNED` |
| `CLINIC-002` | Medical record ownership and audit | Product 4.3; Workflow 4 | Assigned Doctor; Owner/Admin | Appointment and record relation | RLS, output schema, audit test | `PLANNED` |
| `HOTEL-001` | Room availability and booking | Product 4.4; Workflow 5 | Owner/Admin/customer-own | No overlapping active booking | exclusion/concurrency test, E2E | `PLANNED` |
| `HOTEL-002` | Check-in/check-out and billing handoff | Product 4.4; Workflow 5 | Owner/Admin | Booking and room state atomicity | RPC integration, invoice test, audit | `PLANNED` |
| `GROOM-001` | Grooming booking and completion | Product 4.5; Workflow 6 | Depends on staffing decision | Booking state and assigned worker | RLS, transition, E2E | `BLOCKED` by `DEC-OPEN-004` |
| `INV-001` | Product, stock movement, opname | Product 4.7; Workflow 7 | Owner/Admin; POS read | Stock cannot become negative | concurrency test, invariant test, audit | `PLANNED` |
| `INV-002` | Purchase order receive | Product 4.7; Workflow 7 | Owner/Admin | PO status and stock movement atomicity | RPC, partial receive test, audit | `PLANNED` |
| `POS-001` | Invoice creation and payment | Product 4.8; Workflow 8 | Owner/Admin/Cashier | Invoice status and payment ledger | money calculation tests, integration, E2E | `BLOCKED` by `DEC-OPEN-003` |
| `POS-002` | Cash shift open/close and variance | Product 4.8; Workflow 8 | Cashier; Owner/Admin review | Shift is single active session | invariant, reconciliation test, audit | `PLANNED` |
| `LOYALTY-001` | Earn/redeem/reverse points | Product 4.9; Workflow 9 | System; cashier/customer-own redeem | Ledger never silently mutates | ledger tests, reversal integration | `BLOCKED` by `DEC-OPEN-003` |
| `PORTAL-001` | Customer self-service booking/invoice view | Product 4.11; Workflow 11 | Customer own data only | RLS customer boundary | RLS matrix, E2E, privacy review | `BLOCKED` by `DEC-OPEN-002` |
| `PLATFORM-001` | Audit log and observability | Governance 4; Architecture audit sections | System/admin | Immutable enough for investigation | audit completeness test, alert smoke test | `PLANNED` |
| `PLATFORM-002` | Database migration and recovery | Governance 5; Architecture 17 | Deployment identity | Fresh DB and upgrade path | CI migration test, restore drill | `BLOCKED` by `DEC-OPEN-006` |
| `PLATFORM-003` | Multi-business and branch isolation | Product full-product target; Roadmap Phase 7 | Tenant/branch membership | Every tenant-scoped entity and query | adversarial RLS, migration, export, cross-branch report | `BLOCKED` by `DEC-OPEN-002` |
| `POS-003` | Offline queue and reconciliation | Product full-product target; Roadmap Phase 8 | Authorized device and operation allowlist | Replay must be idempotent and auditable | reconnect drill, conflict, settlement, device recovery | `BLOCKED` by `DEC-OPEN-005` |
| `COMMERCE-001` | Retail order, fulfillment, return, refund | Product full-product target; Roadmap Phase 8 | Customer/order/stock boundary | Reservation, fulfillment, and refund ledger | integration, inventory, payment, E2E | `BLOCKED` by `DEC-OPEN-003` |
| `SERVICE-001` | Membership, recurring service, subscription | Product full-product target; Roadmap Phase 9 | Customer consent and billing lifecycle | Pause/cancel/renew transitions | lifecycle, billing, notification, E2E | `PLANNED` |
| `INTEGRATION-001` | Provider adapters and webhook platform | Product full-product target; Roadmap Phase 9 | Provider credential and webhook boundary | Signature, idempotency, reconciliation | sandbox/live, duplicate callback, outage drill | `BLOCKED` by `DEC-OPEN-008` |
| `ANALYTICS-001` | Metric catalog and auditable reporting | Product full-product target; Roadmap Phase 10 | Role and tenant report scope | Metric definition and freshness | ledger reconciliation, freshness, access test | `PLANNED` |
| `RESILIENCE-001` | SLO, DR, failover, incident operations | Product full-product target; Roadmap Phase 11 | Operational control plane | RTO/RPO and restore evidence | load, outage, restore, alert test | `PLANNED` |
| `LIFECYCLE-001` | API/schema versioning and deprecation | Product full-product target; Roadmap Phase 11 | Consumer compatibility | Migration path before removal | compatibility, migration, deprecation test | `PLANNED` |
| `GOV-001` | Continuous product delivery and evidence review | Product full-product target; Roadmap Phase 12 | Release governance | No undocumented contract drift | release review, decision, traceability audit | `PLANNED` |

## 2. Evidence rules

Untuk mengubah status menjadi `DONE`, PR wajib menyertakan:

- link ke implementation files dan migration;
- test command dan hasilnya;
- permission/RLS test untuk setiap role yang relevan;
- audit event yang dihasilkan;
- screenshot atau recording hanya sebagai bukti UI, bukan pengganti test;
- rollback/recovery note untuk perubahan data atau external integration.

`DONE` tidak boleh dipakai bila ada `OPEN` decision yang mempengaruhi capability tersebut.

## 3. Status vocabulary

- `PLANNED`: sudah berada dalam scope, belum diimplementasikan.
- `IN_PROGRESS`: implementasi sedang berjalan, belum memenuhi Definition of Done.
- `BLOCKED`: menunggu decision, dependency, atau environment yang wajib.
- `DONE`: semua evidence lengkap dan gate lulus.
- `DEPRECATED`: tidak boleh dipakai untuk pekerjaan baru.
