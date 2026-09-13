# Implementation Roadmap
## Petora | Urutan Kerja dari Baseline ke Deployment

Roadmap ini mengatur dependency pekerjaan. Setiap fase memiliki exit gate; fase berikutnya tidak boleh dimulai dengan mengabaikan blocker fase sebelumnya.

## Phase 0 - Contract freeze

**Tujuan:** mengubah draft menjadi keputusan yang dapat diimplementasikan.

- Tutup `DEC-OPEN-001` sampai `DEC-OPEN-006` sesuai owner dan evidence.
- Putuskan MVP single-business atau multi-tenant.
- Bekukan auth/session model, money/refund policy, staffing model, dan offline policy.
- Tetapkan requirement ID pada [Requirement Traceability Matrix](07-requirement-traceability.md).

**Exit gate:** tidak ada `OPEN` high-risk decision; Product Owner dan Technical Owner menyetujui baseline `v1.0`.

## Phase 1 - Repository and toolchain

**Tujuan:** membuat build dan test reproducible.

- Bootstrap SolidJS + Vite + TypeScript strict.
- Tetapkan package manager dan lockfile.
- Tambahkan lint, formatter, typecheck, unit test, integration test, E2E test, dan CI.
- Tambahkan env schema dan `.env.example` tanpa secret.
- Tetapkan branch protection dan required checks.

**Exit gate:** clean checkout dapat install, typecheck, lint, test, dan build melalui satu command CI.

## Phase 2 - Database foundation

**Tujuan:** membangun storage yang aman dan repeatable.

- Buat migration berurutan berdasarkan dependency.
- Buat enums, tables, indexes, constraints, timestamp triggers, seed minimal, dan rollback/recovery plan.
- Implementasikan RLS dan helper authorization berdasarkan auth decision.
- Implementasikan `audit_logs`, sequence/number generator, dan atomic RPC untuk invariant penting.
- Jalankan migration pada database kosong dan snapshot upgrade.

**Exit gate:** schema diff terkendali, semua role RLS test lulus, backup/restore drill tercatat.

## Phase 3 - Contracts and service layer

**Tujuan:** membuat boundary backend yang dapat diuji.

- Buat domain types dan Zod input/output schema.
- Buat `AppError` dan error code registry.
- Implementasikan service per domain sesuai layer contract.
- Pastikan service tidak mengembalikan raw database response.
- Tambahkan unit dan integration test untuk happy path, authorization, invalid state, concurrency, retry, dan duplicate request.

**Exit gate:** capability pada traceability matrix memiliki contract, service, test, dan audit evidence.

## Phase 4 - Data hooks and UI

**Tujuan:** membangun workflow pengguna tanpa business logic di component.

- Buat Solid Query hooks untuk query/mutation.
- Buat route guards dan permission-aware navigation.
- Buat UI untuk loading, empty, validation, forbidden, error, retry, dan success state.
- Implementasikan accessibility dan responsive behavior.
- Jangan mengekspos secret, internal error, atau data lintas boundary.

**Exit gate:** setiap critical flow memiliki E2E test pada viewport target.

## Phase 5 - External integrations

**Tujuan:** menghubungkan payment, notification, email, dan storage dengan failure handling.

- Pisahkan sandbox dan production credentials.
- Validasi webhook signature dan idempotency.
- Tetapkan timeout, retry, dead-letter, reconciliation, dan provider outage behavior.
- Test duplicate callback, timeout setelah provider sukses, dan partial failure.

**Exit gate:** external integration test dan recovery runbook disetujui.

## Phase 6 - Hardening and release

**Tujuan:** membuktikan readiness sebelum traffic nyata.

- Jalankan [Production Readiness Checklist](05-production-readiness-checklist.md).
- Jalankan dependency, secret, SAST, DAST, and RLS/security review.
- Load test untuk POS, booking, login, dan report yang relevan.
- Jalankan migration rehearsal, backup restore, smoke test, dan rollback rehearsal.
- Tag release hanya setelah sign-off.

**Exit gate:** release status `READY`, evidence tersimpan, monitoring dan incident owner aktif.

## Aturan penghentian

Hentikan rollout dan kembali ke fase terkait bila ditemukan data corruption, authorization bypass, duplicate financial settlement, negative stock, invalid state transition, atau migration drift. Jangan menutup temuan dengan perubahan UI saja; perbaiki boundary yang mengontrol state tersebut.
