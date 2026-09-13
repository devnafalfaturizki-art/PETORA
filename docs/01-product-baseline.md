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

## 2. Scope MVP

| Module | MVP outcome | Canonical detail |
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

Fitur dengan status `Optional`, `Future`, atau `OPEN` bukan bagian dari acceptance MVP sampai decision register menyetujuinya.

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

## 6. Non-goals dan status fitur

- Offline POS belum termasuk MVP sampai `DEC-OPEN-005` diputuskan.
- Multi-currency belum termasuk MVP; currency, rounding, tax, refund, dan money representation mengikuti `DEC-OPEN-003`.
- Provider payment, WhatsApp, dan email belum dianggap tersedia sampai `DEC-OPEN-008` disetujui.
- Multi-business/multi-branch belum boleh diasumsikan karena business boundary masih `DEC-OPEN-002`.
- SSR portal bukan bagian runtime MVP; MVP menggunakan Vite + Solid SPA sesuai `DEC-APPROVED-007`.

## 7. Product change rule

Perubahan scope, role, permission, harga, payment, cancellation/refund, state machine, retention, atau data customer wajib:

- memiliki requirement ID;
- memperbarui workflow dan traceability yang terdampak;
- memiliki acceptance test dan migration/recovery plan jika data berubah;
- dicatat di [Decision Register](06-decision-register.md);
- mendapat persetujuan Product Owner dan Technical Owner sebelum implementasi.

Dokumen ini tidak menduplikasi schema, API envelope, TypeScript type, Zod schema, RLS policy, component contract, atau langkah deployment. Semua detail tersebut hanya didefinisikan di dokumen teknis kanonik dan checklist release.
