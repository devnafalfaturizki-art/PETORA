# Petora Documentation

Petora adalah sistem manajemen terpadu untuk petshop dan petcare. Repository ini saat ini berisi baseline produk dan kontrak teknis; implementasi aplikasi, migration, test, dan deployment harus mengikuti dokumen di `docs/`.

## Mulai dari sini

1. Baca [Baseline Governance](docs/00-baseline-governance.md). Dokumen ini menetapkan sumber kebenaran, precedence, status requirement, dan Definition of Done.
2. Baca [Product Baseline](docs/01-product-baseline.md) untuk scope, role, permission, dan requirement produk.
3. Baca [Technical Architecture Contract](docs/02-technical-architecture-contract.md) untuk schema, layer, type, validation, RLS, API envelope, dan deployment contract.
4. Baca [Module Workflows Contract](docs/03-module-workflows-contract.md) untuk state machine, workflow, edge case, dan error behavior.
5. Gunakan [Operational Guide](docs/04-operational-guide.md) untuk panduan pengguna non-teknis.
6. Jalankan [Production Readiness Checklist](docs/05-production-readiness-checklist.md) sebelum release.
7. Catat perubahan kontrak di [Decision Register](docs/06-decision-register.md).
8. Gunakan [Requirement Traceability Matrix](docs/07-requirement-traceability.md) untuk menghubungkan requirement dengan permission, implementasi, test, dan evidence.
9. Ikuti [Implementation Roadmap](docs/08-implementation-roadmap.md) untuk urutan kerja dari contract freeze sampai deployment.

## Struktur repository

```text
AGENTS.md                              Aturan pengembangan wajib
README.md                              Entry point dokumentasi
docs/
  00-baseline-governance.md            Precedence, status, change control
  01-product-baseline.md               Scope dan product requirements
  02-technical-architecture-contract.md Architecture dan kontrak teknis
  03-module-workflows-contract.md     Workflow dan business rules
  04-operational-guide.md              Panduan operasional
  05-production-readiness-checklist.md Release gate
  06-decision-register.md              Keputusan dan pengecualian yang disetujui
  07-requirement-traceability.md       Requirement ke implementation dan evidence
  08-implementation-roadmap.md         Urutan implementasi dan exit gate
```

## Aturan penggunaan

- Dokumen bernomor `00` sampai `03` adalah kontrak normatif. Dokumen `07` adalah artifact delivery normatif. Ketentuan yang menggunakan kata `MUST`, `MUST NOT`, `REQUIRED`, atau `WAJIB` bersifat mengikat.
- README dan operational guide menjelaskan penggunaan, tetapi tidak dapat mengubah kontrak teknis atau business rule.
- Tidak ada implementasi yang boleh dimulai dari asumsi yang tidak tercatat. Requirement yang belum diputuskan harus berstatus `OPEN` dan memblokir release jika mempengaruhi security, data integrity, billing, atau authorization.
- Initial release adalah milestone pertama, bukan akhir product roadmap. Status `Future`, `Optional`, atau `Planned` berarti capability belum aktif pada release tertentu; capability tersebut tetap harus memiliki track, owner, dependency, dan acceptance criteria sebelum dijadwalkan.

## Status baseline saat ini

- Baseline dokumentasi: `v1.0-draft`.
- Status implementasi: belum ada source code aplikasi, migration, test suite, atau konfigurasi deployment di repository ini.
- Karena itu repository belum dapat dinyatakan production-ready. Checklist release menjadi syarat perubahan status menjadi `initial-release` atau release train berikutnya; status tersebut belum berarti complete product.
