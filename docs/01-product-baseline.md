# Product Baseline Contract

## Petora | Sistem Manajemen Terpadu Petshop & Petcare

**Status:** Normative product contract
**Versi:** `v1.0-draft`
**Tanggal baseline:** 2026-09-13
**Owner:** Product Owner Petora
**Canonical detail:** Workflow dan business rules ada di [Module Workflows Contract](03-module-workflows-contract.md). Technical implementation ada di [Technical Architecture Contract](02-technical-architecture-contract.md).

## 1. Product intent

Petora adalah platform operasional untuk bisnis petshop dan petcare yang menyatukan CRM, layanan klinik, pet hotel, grooming, retail, inventory, billing, loyalty, dan customer portal.

Nilai utama produk:

- satu sumber data untuk customer, pet, layanan, stok, transaksi, dan histori;
- operasi yang dapat ditelusuri melalui permission, state transition, dan audit;
- pencegahan overselling, double booking, pembayaran ganda, dan perubahan data tanpa otorisasi;
- pengalaman staff yang cepat untuk operasi harian dan portal customer yang terbatas pada data miliknya.

## 2. Product scope dan release tracks

| Module | Initial release outcome | Canonical detail |
|---|---|---|
| Auth & User Management | Login, PIN lifecycle, lockout, session, role access | Workflow section 2 |
| CRM & Pets | Customer, guest conversion, pet profile, health history | Workflow section 3 |
| Clinic | Appointment queue dan medical record | Workflow section 4 |
| Pet Hotel | Room, booking, check-in, check-out, daily log | Workflow section 5 |
| Grooming | Service, booking, assigned worker, completion record | Workflow section 6; staffing decision required |
| Retail & Inventory | Product, stock movement, opname, purchase order | Workflow section 7 |
| POS & Billing | Invoice, payment, cash shift, cancellation policy | Workflow section 8; money decision required |
| Loyalty & Engagement | Points, tier, promotion, feedback | Workflow section 9 |
| Finance & Operations | Expense, approval, reports, settings | Workflow section 10 |
| Customer Portal | Own booking, invoice, loyalty, feedback | Workflow section 11 |

Initial release adalah milestone pertama, bukan batas keseluruhan produk. Setiap capability yang belum aktif tetap berada dalam product target dan harus mendapat release track, requirement ID, owner, acceptance criteria, serta evidence.

### 2.1 Full product target

Target keseluruhan Petora mencakup kemampuan berikut setelah initial release dan decision terkait disetujui:

| Track | Target capability | Prasyarat utama |
|---|---|---|
| Core operations | Seluruh modul pada tabel di atas stabil untuk operasi harian | Contract, migration, RLS, service, UI, dan E2E lulus |
| Multi-business | Multi-cabang/tenant, branch settings, cross-branch reporting, tenant isolation | `DEC-OPEN-002`, data migration, RLS matrix penuh |
| Resilient POS | Offline queue, reconciliation, conflict resolution, device recovery | `DEC-OPEN-005`, payment restrictions, recovery drill |
| Commerce expansion | Customer shop, delivery/pickup, catalog, order tracking, return/refund | `DEC-OPEN-003`, inventory and payment ledger contract |
| Service expansion | Recurring care, packages, memberships, subscriptions, advanced scheduling | Product decision, billing lifecycle, cancellation policy |
| Integration platform | Payment, WhatsApp, email, webhook, provider adapter, reconciliation | `DEC-OPEN-008`, sandbox/live contract |
| Intelligence | Operational dashboards, cohort/retention, demand and stock forecasting, export | Data retention, metric definitions, privacy review |
| Platform scale | Background jobs, observability, SLO, disaster recovery, performance envelope | Load test, restore drill, incident runbook |
| Lifecycle | Versioned API, migration compatibility, deprecation, support and audit retention | Change control and release governance |

`Optional`, `Future`, dan `OPEN` berarti belum aktif pada release tertentu, bukan berarti dihapus dari target produk. Statusnya harus dipindahkan ke release track melalui decision register.

## 3. Target users dan boundary

| Role | Tujuan | Boundary utama |
|---|---|---|
| `OWNER` | Kontrol bisnis, user staff, settings, laporan finansial | Semua data dalam business boundary |
| `ADMIN` | Operasional, CRM, inventory, booking, customer account | Semua data operasional sesuai permission; tidak mengambil alih approval Owner |
| `DOKTER` | Pemeriksaan dan rekam medis | Data klinik yang ditugaskan/diizinkan; tidak mengakses finance/POS |
| `KASIR` | POS, pembayaran, shift kas | Data transaksi yang diperlukan; tidak mengubah master cost atau permission |
| `CUSTOMER` | Self-service booking, invoice, loyalty, feedback | Hanya data customer dan pet miliknya |

Role grooming belum final. Implementasi grooming yang memerlukan worker khusus diblokir oleh `DEC-OPEN-004` sampai role dan permission disetujui.

## 4. Product invariants

Invariants berikut adalah acceptance requirement dan harus ditegakkan server/database, bukan hanya UI:

- customer tidak dapat melihat atau mengubah data customer lain;
- pet harus selalu terhubung ke customer aktif yang benar;
- stok tidak boleh menjadi negatif;
- booking room atau groomer tidak boleh overlap pada slot aktif;
- state final tidak boleh berpindah ke state lain tanpa policy reversal resmi;
- invoice dan payment ledger tidak boleh menghasilkan settlement ganda;
- pembatalan/refund harus memiliki policy, alasan, actor, dan audit event;
- poin loyalty hanya berubah melalui ledger yang dapat ditelusuri;
- setiap perubahan permission, state, stok, uang, dan data medis penting diaudit;
- data sensitif seperti PIN, token, dan secret tidak boleh tampil di response, log, atau client storage.

## 5. Product acceptance gates

Capability dianggap diterima hanya jika:

1. happy path dan failure path tertulis di [Module Workflows Contract](03-module-workflows-contract.md);
2. permission dan data visibility diuji untuk setiap role yang relevan;
3. state transition, concurrency, idempotency, dan audit event diuji;
4. UI menyediakan loading, empty, validation, forbidden, error, retry, dan success state;
5. evidence masuk ke [Requirement Traceability Matrix](07-requirement-traceability.md);
6. release memenuhi [Production Readiness Checklist](05-production-readiness-checklist.md).

## 6. Release sequencing, bukan non-goals permanen

- Offline POS masuk track `Resilient POS` setelah `DEC-OPEN-005` diputuskan dan conflict/recovery test lulus.
- Multi-currency dan aturan uang masuk track `Commerce expansion` setelah currency, rounding, tax, refund, dan money representation ditetapkan melalui `DEC-OPEN-003`.
- Provider payment, WhatsApp, dan email masuk track `Integration platform` setelah `DEC-OPEN-008` disetujui.
- Multi-business/multi-branch masuk track `Multi-business` setelah boundary tenant, migration, RLS, audit, dan report ditetapkan melalui `DEC-OPEN-002`.
- Runtime initial release tetap Vite + Solid SPA sesuai `DEC-APPROVED-007`; SSR dapat menjadi track platform terpisah hanya dengan kontrak dan decision baru.

## 7. Product change rule

Perubahan scope, role, permission, harga, payment, cancellation/refund, state machine, retention, atau data customer wajib:

- memiliki requirement ID;
- memperbarui workflow dan traceability yang terdampak;
- memiliki acceptance test dan migration/recovery plan jika data berubah;
- dicatat di [Decision Register](06-decision-register.md);
- mendapat persetujuan Product Owner dan Technical Owner sebelum implementasi.

Dokumen ini tidak menduplikasi schema, API envelope, TypeScript type, Zod schema, RLS policy, component contract, atau langkah deployment. Semua detail tersebut hanya didefinisikan di dokumen teknis kanonik dan checklist release.
