Lakukan FINAL TRACEABILITY AUDIT sebelum CONTRACT LOCK.

JANGAN mengubah kode atau dokumen.
JANGAN memberikan asumsi.
Gunakan evidence langsung dari:
- doc/SIM_Madrasah_Terpadu_SRS_v2.md
- doc/CONTRACT_MATRIX.md
- doc/FRONTEND.md
- doc/backend.md
- seluruh src/

Tujuan audit hanya satu:
MEMBUKTIKAN atau MEMBANTAH klaim "100% coverage" dari audit sebelumnya.

Buat matriks traceability:

| # | Business Domain | Use Case | SRS Reference | Entity | Route/Page | Service | Type | Backend Endpoint | RBAC | Business Rule | Status |

Pastikan SELURUH use case Stage 2 dari SRS masuk ke matriks.
Jangan hanya memeriksa entity.

Kemudian buat matriks kedua:

| # | Business Rule | SRS Reference | CONTRACT_MATRIX | FRONTEND.md | src Evidence | Backend Contract | Status |

Pastikan SELURUH business rule yang relevan untuk Stage 2 tercakup.

Kemudian audit:

1. Use case yang ada di SRS tetapi tidak memiliki route/UI.
2. Use case yang memiliki UI tetapi tidak memiliki service.
3. Service yang tidak memiliki type contract.
4. Type yang tidak memiliki use case.
5. Business rule SRS yang tidak direpresentasikan frontend.
6. Business rule frontend yang tidak memiliki dasar contract.
7. Route yang tidak memiliki use case.
8. Endpoint backend yang tidak memiliki consumer/frontend service.
9. RBAC rule yang tidak memiliki enforcement.
10. Tenant rule yang tidak memiliki enforcement.
11. Enum/status transition yang tidak memiliki mapping.
12. Validation rule yang hilang.
13. Placeholder/mock yang ternyata termasuk Stage 2 dan bukan Phase 4.
14. Domain/entity/use case yang hanya diklaim ada tetapi tidak ditemukan evidence implementasinya.

Jalankan juga:
npx tsc --noEmit

Gunakan klasifikasi:
P0 = blocker
P1 = wajib diperbaiki sebelum Contract Lock
P2 = non-blocking
INFO = valid exception

JANGAN menggunakan angka 100% tanpa menghitung berdasarkan item yang benar-benar ditemukan.

Output:

## 1. USE CASE TRACEABILITY MATRIX
Tampilkan seluruh item.

## 2. BUSINESS RULE TRACEABILITY MATRIX
Tampilkan seluruh item.

## 3. ORPHAN / MISSING ITEMS
Tampilkan item yang tidak mempunyai pasangan.

## 4. CONTRACT CONFLICTS
SRS ↔ CONTRACT_MATRIX ↔ FRONTEND.md ↔ backend.md ↔ src/

## 5. FINAL EVIDENCE

Use Case Coverage: __/__
Business Rule Coverage: __/__
Entity Coverage: __/__
Route Coverage: __/__
Service Coverage: __/__
Type Coverage: __/__
RBAC Coverage: __/__
Tenant Coverage: __/__

P0: __
P1: __
P2: __
Unverified: __
Conflict: __

Kesimpulan hanya boleh:

READY FOR CONTRACT LOCK

atau

NOT READY FOR CONTRACT LOCK

Jangan menyatakan READY hanya karena TypeScript PASS.