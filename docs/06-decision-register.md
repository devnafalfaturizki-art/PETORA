# Decision Register

## Petora | Approved Decisions and Open Questions

Register ini adalah tempat resmi untuk keputusan yang mengubah atau memperjelas baseline. Setiap keputusan baru harus memiliki ID unik, owner, tanggal, dampak, dan dokumen yang diperbarui.

## Status

- `PROPOSED`: sedang dibahas, belum boleh menjadi asumsi implementasi.
- `APPROVED`: menjadi kontrak setelah dokumen terdampak diperbarui.
- `REJECTED`: tidak boleh diimplementasikan.
- `SUPERSEDED`: digantikan keputusan baru dengan referensi jelas.
- `OPEN`: belum diputuskan dan dapat memblokir release sesuai governance.

## Template keputusan

```markdown
### DEC-YYYY-MM-DD-NNN: Judul keputusan
- Status: PROPOSED | APPROVED | REJECTED | SUPERSEDED | OPEN
- Owner: nama/role
- Tanggal: YYYY-MM-DD
- Area: product | security | data | architecture | operations
- Context: masalah atau ambiguitas yang harus diselesaikan
- Decision: keputusan eksplisit
- Alternatives rejected: opsi yang tidak dipilih dan alasannya
- Impact: dokumen, schema, API, UI, migration, test, dan operasi yang terdampak
- Rollout/rollback: cara menerapkan dan memulihkan
- Evidence: link PR, test, atau design review
```

## Keputusan awal baseline

### DEC-2026-09-13-001: Dokumen kanonik dan precedence

- Status: `APPROVED`
- Owner: Product Owner Petora
- Tanggal: `2026-09-13`
- Area: governance
- Decision: `00-baseline-governance.md` mengatur precedence; dokumen `01` sampai `03` adalah kontrak normatif sesuai domainnya. README dan operational guide tidak boleh mengubah kontrak.
- Impact: seluruh PR dan AI task wajib menautkan requirement dan evidence.

### DEC-2026-09-13-002: Status repository sebelum implementasi

- Status: `APPROVED`
- Owner: Technical Owner Petora
- Tanggal: `2026-09-13`
- Area: operations
- Decision: repository ini belum production-ready karena belum memiliki source code aplikasi, migration, test suite, CI, atau deployment configuration. Status release tidak boleh diklaim hanya berdasarkan kelengkapan dokumentasi.
- Impact: release checklist menjadi gate wajib untuk implementasi berikutnya.

## Open decisions yang wajib ditutup sebelum release

### DEC-OPEN-001: Model authentication

- Status: `OPEN`
- Area: security | architecture
- Context: dokumen existing menyebut Supabase Auth sekaligus custom username/PIN, JWT 24 jam, bcrypt, dan `users` table. Model identity, session, reset, revocation, dan RLS subject belum dipilih secara final.
- Required decision: pilih satu model kanonik atau definisikan boundary integrasi secara lengkap, termasuk token issuance, `auth.uid()` mapping, session revocation, rate limit, dan migration.
- Blocker: `HIGH`

### DEC-OPEN-002: Multi-tenant dan business boundary

- Status: `OPEN`
- Area: data | security
- Context: schema belum memiliki `business_id`/tenant key, tetapi dokumen menyebut kesiapan multi-cabang dan RLS.
- Required decision: tetapkan apakah initial release single-business atau multi-tenant; jika multi-tenant, semua entity, unique key, query, RLS, audit, dan report harus membawa boundary tersebut.
- Blocker: `HIGH`

### DEC-OPEN-003: Sumber kebenaran harga dan uang

- Status: `OPEN`
- Area: product | data | finance
- Context: aturan invoice, partial payment, refund, discount, tax, loyalty reversal, dan currency belum memiliki policy final yang konsisten.
- Required decision: tetapkan money representation, rounding, tax, invoice numbering, refund/void policy, dan rekonsiliasi payment provider.
- Blocker: `HIGH`

### DEC-OPEN-004: Groomer dan staffing model

- Status: `OPEN`
- Area: product | authorization
- Context: role matrix memakai groomer dalam workflow, tetapi role resmi hanya OWNER, ADMIN, DOKTER, KASIR, CUSTOMER.
- Required decision: tambahkan role `GROOMER` atau tetapkan role existing yang berwenang, lalu selaraskan permission, schema, UI, dan RLS.
- Blocker: `MEDIUM`

### DEC-OPEN-005: Scope offline POS

- Status: `OPEN`
- Area: architecture | operations
- Context: offline-first disebut Future/opsional, sedangkan FAQ hanya memberi peringatan saat internet mati.
- Required decision: initial release online-only dengan hard failure, atau offline mode dengan local queue, conflict resolution, payment restrictions, dan reconciliation.
- Blocker: `MEDIUM`

### DEC-OPEN-006: Canonical migration artifact

- Status: `OPEN`
- Area: data | operations
- Context: schema contract saat ini masih berupa blok besar dan urutan deklarasinya belum executable pada database kosong karena dependency foreign key.
- Required decision: tetapkan folder migration sebagai artifact kanonik, urutan migration, policy rollback/recovery, dan CI check yang menjalankan migration dari database kosong serta database snapshot.
- Blocker: `HIGH`

### DEC-APPROVED-007: Initial release frontend runtime

- Status: `APPROVED`
- Owner: Technical Owner Petora
- Tanggal: `2026-09-13`
- Area: architecture
- Decision: initial release menggunakan Vite + Solid sebagai SPA. SolidStart SSR tidak boleh ditambahkan sebagai jalur kedua tanpa kontrak routing, session, caching, deployment, dan test yang diperbarui.
- Impact: menghapus percabangan runtime dari implementation roadmap dan deployment contract.

### DEC-OPEN-008: External provider selection

- Status: `OPEN`
- Area: operations | architecture | finance
- Context: dokumen menyebut beberapa provider untuk payment, WhatsApp, dan email tanpa provider kanonik, SLA, biaya, data residency, atau behavior saat provider gagal.
- Required decision: pilih provider per capability, definisikan adapter contract, sandbox/live credential, webhook signature, retry, reconciliation, dan exit strategy.
- Blocker: `MEDIUM` untuk fitur opsional; `HIGH` bila provider payment diaktifkan pada initial release.
