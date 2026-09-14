# Baseline Governance Contract

## Petora | Sumber Kebenaran dan Aturan Perubahan

**Status:** Normative
**Versi:** `v1.0-draft`
**Tanggal baseline:** 2026-09-13
**Owner:** Product Owner Petora
**Review wajib:** sebelum setiap release dan minimal setiap perubahan domain

## 1. Tujuan dan batasan

Dokumen ini mengatur cara seluruh dokumen dan implementasi Petora dibaca, diputuskan, diuji, dan diubah. Dokumen ini tidak menggantikan detail produk atau teknis; dokumen ini menentukan bagaimana detail tersebut menjadi kontrak yang dapat dieksekusi.

Baseline adalah sumber kebenaran proyek, tetapi tidak dapat menjamin perangkat lunak bebas dari seluruh bug. Jaminan release hanya boleh diberikan setelah semua gate pada [Production Readiness Checklist](05-production-readiness-checklist.md) lulus dan bukti verifikasinya disimpan.

## 2. Precedence ketika terjadi konflik

Urutan tertinggi ke terendah:

1. Keamanan dan kewajiban hukum yang berlaku.
2. `AGENTS.md` untuk aturan engineering repository.
3. Dokumen ini untuk governance dan change control.
4. [Technical Architecture Contract](02-technical-architecture-contract.md) untuk kontrak lintas layer, schema, auth, RLS, API, dan deployment.
5. [Module Workflows Contract](03-module-workflows-contract.md) untuk aturan state, validasi, workflow, dan edge case.
6. [Product Baseline](01-product-baseline.md) untuk scope dan acceptance intent.
7. [Operational Guide](04-operational-guide.md) untuk instruksi penggunaan.
8. Source code, test, migration, dan konfigurasi yang belum diselaraskan dengan dokumen di atas.

Jika dua dokumen dengan level sama bertentangan, requirement yang lebih ketat berlaku sementara dan release diblokir sampai keputusan dicatat. Tidak boleh menyelesaikan konflik hanya dengan memilih implementasi yang paling mudah.

## 2.1 Canonical ownership dan aturan anti-duplikasi

Setiap jenis informasi hanya memiliki satu pemilik normatif:

| Informasi | Pemilik canonical | Dokumen lain boleh berisi |
|---|---|---|
| Product intent, scope, target user, product invariant | `01-product-baseline.md` | Ringkasan dan link saja |
| Schema, type, Zod, service, hooks, UI contract, RLS, API, deployment | `02-technical-architecture-contract.md` | Link dan acceptance dependency saja |
| State machine, business workflow, permission per operation, edge case, error matrix | `03-module-workflows-contract.md` | Link dan outcome product saja |
| Cara penggunaan staff/customer | `04-operational-guide.md` | Tidak boleh mendefinisikan aturan baru |
| Release gate | `05-production-readiness-checklist.md` | Link saja |
| Keputusan dan pengecualian | `06-decision-register.md` | Reference ID saja |
| Requirement-to-evidence mapping | `07-requirement-traceability.md` | Reference ID saja |
| Urutan fase implementasi | `08-implementation-roadmap.md` | Link saja |

Salinan penuh dari section canonical dilarang. Bila konteks diperlukan, tulis ringkasan maksimal satu paragraf dan tautkan section pemiliknya.

## 3. Bahasa kontrak dan status requirement

| Kata/status | Arti | Dampak implementasi |
|---|---|---|
| `MUST` / `WAJIB` | Keharusan normatif | Harus ada implementasi dan test |
| `MUST NOT` / `DILARANG` | Larangan normatif | Pelanggaran memblokir merge/release |
| `SHOULD` | Default yang direkomendasikan | Penyimpangan wajib punya alasan tertulis |
| `MAY` | Pilihan yang diizinkan | Tidak boleh diasumsikan tersedia |
| `Initial release` | Wajib untuk milestone operasional pertama | Harus memiliki acceptance criteria dan bukan akhir product roadmap |
| `Target track` | Bagian dari keseluruhan product target pada release berikutnya | Harus memiliki owner, dependency, dan release gate |
| `Future` / `Planned` | Belum memiliki release commitment | Tidak boleh dibuat seolah-olah aktif |
| `Optional` | Hanya aktif jika dikonfigurasi | Config, fallback, dan test wajib jelas |
| `OPEN` | Keputusan belum ditetapkan | Memblokir release bila menyentuh risiko tinggi |
| `DEPRECATED` | Tidak boleh dipakai untuk fitur baru | Migrasi dan tanggal penghapusan wajib dicatat |

## 4. Aturan implementasi yang mengikat

- Kontrak dimulai dari type/interface, Zod schema, permission, state machine, dan acceptance test.
- Input dari UI, API, job, webhook, dan external provider dianggap `unknown` sampai divalidasi.
- Authorization wajib ditegakkan di database/RLS atau boundary server yang setara; pemeriksaan UI hanya membantu UX.
- Operasi lintas tabel yang mengubah state, stok, uang, poin, booking, atau invoice wajib atomic dan idempotent.
- Semua state transition, perubahan master data penting, transaksi finansial, perubahan permission, dan tindakan administratif wajib diaudit.
- Nominal uang disimpan sebagai integer minor unit atau tipe decimal yang konsisten; format tampilan tidak boleh dipakai untuk perhitungan.
- Waktu disimpan dalam UTC dengan timezone bisnis tersentralisasi untuk aturan tanggal, jam operasional, reminder, dan cut-off.
- Soft delete tidak boleh menghapus histori transaksi. Hard delete memerlukan alasan, permission khusus, dan audit.
- Error publik harus menggunakan error code stabil. Pesan untuk pengguna tidak boleh membocorkan rahasia, hash, atau data lintas tenant.
- Tidak ada `TODO`, `FIXME`, stub, placeholder, `any`, `@ts-ignore`, credential, atau magic business rule dalam release code.

## 5. Definition of Done

Sebuah requirement selesai hanya jika seluruh hal berikut benar:

- Acceptance criteria tertulis dan dapat diuji.
- Type, schema input/output, permission matrix, state transition, dan error behavior selaras.
- Implementasi service tidak melewati layer yang ditentukan.
- Migration idempotent, memiliki rollback/recovery plan, constraint, index, dan RLS yang diperlukan.
- Unit, integration, dan E2E test tersedia sesuai risiko.
- Audit event dan observability tersedia.
- Loading, empty, error, retry, dan unauthorized state tersedia pada UI.
- Dokumentasi, changelog, environment contract, dan runbook diperbarui.
- `typecheck`, lint, test, build, migration verification, dan security checks lulus.
- Evidence disimpan pada PR atau release record.

## 6. Change control

Perubahan yang menyentuh schema, permission, state machine, invoice/payment, stock, public API, data retention, atau external provider adalah **breaking-risk change**. Perubahan tersebut wajib:

1. Menjelaskan alasan dan dampak.
2. Memperbarui semua dokumen turunan yang terdampak.
3. Menambah atau mengubah acceptance test.
4. Menyediakan migration dan rollback/recovery plan.
5. Mendapat review Product Owner dan technical owner.
6. Dicatat di [Decision Register](06-decision-register.md).

Perubahan kecil seperti typo tetap boleh dilakukan langsung, tetapi tidak boleh mengubah makna kontrak.

## 7. Traceability minimum

Setiap fitur harus dapat ditelusuri dengan pola:

`Requirement ID -> Permission -> Schema/API -> Service -> UI flow -> Test -> Audit event -> Release evidence`

ID requirement harus stabil, misalnya `AUTH-001`, `POS-014`, atau `HOTEL-007`. Jangan memakai nomor baris sebagai ID.

## 8. Definition of release

Release hanya boleh diberi status `READY` bila tidak ada `OPEN` high-risk decision, critical/high vulnerability, failing test, migration drift, unresolved RLS finding, atau missing rollback plan. Status `READY` harus ditandatangani oleh Product Owner dan technical owner.

## 9. Definition of complete product

Petora baru boleh disebut mencapai target produk lengkap bila:

- seluruh capability `Core operations` dan target track yang telah disetujui memiliki status `DONE`, atau memiliki keputusan `DEPRECATED` dengan migration path dan alasan yang disetujui;
- tidak ada capability yang diam-diam dihapus hanya karena belum masuk initial release;
- seluruh tenant, security, financial, data retention, accessibility, performance, observability, recovery, support, dan deprecation gate telah memiliki evidence;
- setiap release train memperbarui [Requirement Traceability Matrix](07-requirement-traceability.md) dan [Decision Register](06-decision-register.md);
- perubahan kontrak lintas versi dapat dimigrasikan, dipantau, dan dipulihkan tanpa kehilangan histori transaksi atau audit.

Initial release, production-ready release, dan complete product adalah tiga status berbeda. Lulus initial release tidak otomatis berarti target produk lengkap.
