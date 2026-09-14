# Implementation Roadmap

## Petora | Urutan Kerja dari Baseline ke Deployment

Roadmap ini mengatur dependency pekerjaan dari contract freeze sampai lifecycle produk jangka panjang. Initial release adalah milestone pertama; fase berikutnya membangun full product target dan tidak boleh mengabaikan blocker fase sebelumnya.

## Phase 0 - Contract freeze

**Tujuan:** mengubah draft menjadi keputusan yang dapat diimplementasikan.

- Tutup `DEC-OPEN-001` sampai `DEC-OPEN-006` sesuai owner dan evidence.
- Putuskan apakah initial release single-business atau multi-tenant.
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

## Phase 7 - Multi-business and scale foundation

**Tujuan:** menjadikan business boundary siap untuk cabang, tenant, dan pertumbuhan data.

- Finalisasi `business_id`/tenant model, branch hierarchy, membership, dan cross-tenant isolation.
- Migrasikan unique key, foreign key, query, RLS, audit, storage path, notification, dan report ke boundary baru.
- Tambahkan branch settings, timezone, business calendar, pricing scope, dan permission delegation.
- Uji tenant isolation, cross-branch reporting, migration compatibility, load, dan data export.

**Exit gate:** tenant/branch isolation lulus adversarial RLS test, data migration dapat diulang, dan report lintas branch terverifikasi.

## Phase 8 - Resilient POS and commerce expansion

**Tujuan:** mendukung operasi dengan koneksi tidak stabil dan alur retail yang lebih lengkap.

- Implementasikan offline queue yang dibatasi pada operasi yang aman untuk offline.
- Tambahkan idempotency key, conflict resolution, device recovery, reconciliation, dan offline audit trail.
- Bangun catalog, pickup/delivery, order tracking, return, refund, partial fulfillment, dan stock reservation.
- Uji payment restriction, duplicate settlement, queue replay, clock skew, dan recovery setelah device loss.

**Exit gate:** offline/reconnect drill dan financial reconciliation lulus tanpa negative stock atau duplicate settlement.

## Phase 9 - Service, membership, and automation expansion

**Tujuan:** memperluas recurring care dan otomatisasi operasional.

- Tambahkan service package, membership, recurring appointment, subscription, reminder policy, dan cancellation window.
- Tambahkan capacity planning untuk doctor, groomer, room, equipment, dan holiday calendar.
- Tambahkan notification preference, consent, template versioning, retry policy, dan customer communication history.
- Uji pause/cancel/renew, missed appointment, timezone, consent withdrawal, dan notification failure.

**Exit gate:** lifecycle billing dan service tidak menghasilkan orphan booking, charge ganda, atau notification tanpa consent.

## Phase 10 - Intelligence and reporting platform

**Tujuan:** mengubah data operasional menjadi insight yang konsisten dan dapat diaudit.

- Definisikan metric catalog untuk revenue, margin, retention, utilization, inventory, SLA, dan service outcome.
- Bangun reporting read model, export, scheduled report, dashboard role-based, dan data freshness indicator.
- Tambahkan forecasting atau recommendation hanya setelah kualitas data dan explainability criteria ditetapkan.
- Uji reconciliation report terhadap ledger, timezone/currency, late-arriving data, dan access boundary.

**Exit gate:** setiap metric memiliki definisi, owner, query contract, freshness target, dan rekonsiliasi dengan source of truth.

## Phase 11 - Platform resilience and lifecycle

**Tujuan:** memastikan Petora dapat dipelihara dan dioperasikan dalam jangka panjang.

- Tetapkan SLO/SLA, capacity limit, alert threshold, incident severity, on-call, dan customer communication.
- Jalankan disaster recovery, region/provider outage, backup retention, restore, and failover rehearsal.
- Versioning API/schema, backward compatibility, feature flag cleanup, deprecation window, dan migration tooling.
- Tetapkan data retention, legal hold, subject access/deletion workflow, audit retention, dan security review cadence.
- Review accessibility, performance budget, dependency upgrade, threat model, dan support runbook setiap release train.

**Exit gate:** recovery objectives terukur, deprecation memiliki migration path, dan support owner menerima runbook.

## Phase 12 - Continuous product delivery

**Tujuan:** menjaga seluruh product target tetap sehat setelah scale.

- Kelola release train berbasis evidence, customer feedback, defect trend, cost, performance, dan risk.
- Setiap capability baru masuk traceability matrix sebelum discovery berubah menjadi implementation.
- Setiap perubahan kontrak memiliki decision record, compatibility note, test update, dan observability update.
- Tinjau target product secara periodik tanpa menghapus histori keputusan atau mengubah data secara diam-diam.

**Exit gate:** release review menyatakan product health, operational health, security health, dan documentation health memenuhi target.

## Aturan penghentian

Hentikan rollout dan kembali ke fase terkait bila ditemukan data corruption, authorization bypass, duplicate financial settlement, negative stock, invalid state transition, atau migration drift. Jangan menutup temuan dengan perubahan UI saja; perbaiki boundary yang mengontrol state tersebut.
