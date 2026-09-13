# Production Readiness Checklist
## Petora | Release Gate

Checklist ini adalah gate, bukan daftar aspirasi. Item yang tidak relevan harus diberi alasan tertulis; item kosong berarti release belum siap.

## 1. Product dan scope

- [ ] Semua requirement MVP memiliki ID, acceptance criteria, owner, dan test.
- [ ] Semua `OPEN` decision berdampak rendah atau sudah disetujui untuk ditunda.
- [ ] Role, permission, tenant/business boundary, dan data visibility sudah disetujui.
- [ ] State machine tidak memiliki transisi tersirat atau lompatan status.
- [ ] Copy, workflow cancel/refund, dan kebijakan customer sudah ditinjau.

## 2. Database dan migration

- [ ] Schema final cocok dengan type dan Zod schema.
- [ ] Semua tabel memiliki primary key, timestamp, foreign key behavior, constraint, dan index yang diperlukan.
- [ ] Migration dapat dijalankan dari database kosong dan diuji terhadap database existing.
- [ ] Rollback atau recovery plan diuji untuk setiap migration berisiko.
- [ ] RLS aktif di semua tabel client-accessible dan diuji sebagai setiap role.
- [ ] Atomic RPC/transaction diuji untuk stock, booking, invoice, payment, loyalty, dan expense.
- [ ] Backup, restore drill, retention, dan data deletion policy tersedia.

## 3. Security dan privacy

- [ ] Secret hanya berasal dari environment/secret manager.
- [ ] Service-role credential tidak pernah dikirim ke browser.
- [ ] Auth lockout, session expiry/revocation, password/PIN hashing, dan rate limit diuji.
- [ ] Input, output, upload, webhook signature, dan redirect URL divalidasi.
- [ ] Dependency, SAST, secret scan, dan vulnerability scan lulus atau memiliki waiver.
- [ ] Audit log immutable secukupnya dan tidak menyimpan PIN, token, atau data sensitif berlebihan.
- [ ] CORS, security headers, CSP, storage policy, dan least privilege ditinjau.

## 4. Backend dan integrasi

- [ ] Semua service memakai error code stabil dan response envelope konsisten.
- [ ] Retry, timeout, idempotency key, dan duplicate webhook behavior diuji.
- [ ] Provider payment, WhatsApp, email, dan storage memiliki sandbox/live configuration terpisah.
- [ ] Failure external provider tidak menyebabkan state internal setengah jadi.
- [ ] Queue/job reminder memiliki retry limit, dead-letter handling, dan observability.

## 5. Frontend dan accessibility

- [ ] Loading, empty, validation, unauthorized, forbidden, error, offline/timeout state tersedia.
- [ ] Keyboard navigation, focus management, label, contrast, dan screen-reader semantics diuji.
- [ ] Responsive test dilakukan pada viewport target staff dan customer portal.
- [ ] Tidak ada data sensitif di URL, localStorage, log browser, atau error boundary.
- [ ] Critical flow diuji end-to-end: login, booking, clinical completion, checkout, payment, cancellation/refund.

## 6. Quality gates

- [ ] `npm ci` atau install reproducible berhasil.
- [ ] Typecheck berhasil tanpa error.
- [ ] Lint dan format check berhasil.
- [ ] Unit test berhasil dan coverage sesuai risk policy.
- [ ] Integration test database/RLS berhasil.
- [ ] E2E critical path berhasil.
- [ ] Production build berhasil.
- [ ] Smoke test pada environment release berhasil.
- [ ] Tidak ada placeholder atau warning yang disembunyikan.

## 7. Operasional dan release

- [ ] Environment variables didokumentasikan tanpa nilai rahasia.
- [ ] Monitoring, error tracking, audit search, dan alert threshold aktif.
- [ ] Runbook incident, rollback, restore, dan provider outage tersedia.
- [ ] Migration order dan deploy order terdokumentasi.
- [ ] Feature flag/default config aman untuk rollout pertama.
- [ ] Changelog dan release notes diperbarui.
- [ ] Product Owner dan technical owner menyetujui release record.

## Release decision

- **Status:** `NOT_READY` / `READY` / `ROLLED_BACK`
- **Version:** `________________`
- **Commit:** `________________`
- **Evidence/CI run:** `________________`
- **Open risks and waiver owner:** `________________`
- **Product Owner:** `________________`
- **Technical Owner:** `________________`
- **Date:** `________________`
