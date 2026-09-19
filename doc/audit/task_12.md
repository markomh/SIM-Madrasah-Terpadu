Audit `sim-madrasah-frontend` untuk memastikan seluruh UI/UX siap berpindah dari Mock Mode ke API Mode tanpa gap kontrak.

JANGAN mengubah kode. Audit saja.

Tujuan utama:
memastikan UI, service, mock implementation, TypeScript types, dan API contract memiliki perilaku yang konsisten.

Audit rantai:

SRS/aturan bisnis
→ domain types
→ service interface
→ mock service
→ API service/client
→ UI/UX

Periksa setiap domain/fitur yang sudah diimplementasikan.

Untuk setiap fitur, identifikasi:

* halaman UI
* operasi: list/detail/create/update/delete
* service method
* TypeScript request type
* TypeScript response type
* mock implementation
* API implementation
* endpoint/method HTTP
* parameter query/path/body
* pagination/filter/sort/search
* loading state
* empty state
* success state
* validation error
* authorization error
* API/network error

Cari terutama contract drift:

* field berbeda antara Mock dan API
* nullable/optional tidak konsisten
* enum/status berbeda
* ID berbeda
* format tanggal berbeda
* pagination berbeda
* response wrapper berbeda
* error shape berbeda
* UI mengasumsikan response selalu sukses
* UI membuat data shape sendiri
* transformasi data tersebar di komponen
* mock terlalu ideal dibanding kemungkinan response API
* API service memiliki kemampuan yang tidak direpresentasikan UI
* UI membutuhkan kemampuan yang belum tersedia pada service/API

Buat hasil dalam tabel:

| Domain/Fitur | UI | Service | Mock | API | Contract | UI State | Gap | Status |

Status hanya:
PASS / GAP / BLOCKER

Definisi:

* PASS = siap API Mode.
* GAP = ada ketidaksesuaian tetapi dapat diperbaiki tanpa perubahan arsitektur.
* BLOCKER = API Mode berpotensi gagal atau memerlukan perubahan kontrak/arsitektur.

Jangan menebak kontrak backend yang belum ada. Jika backend belum tersedia, tandai sebagai `UNVERIFIED`, bukan PASS.

Di akhir berikan:

1. jumlah PASS
2. jumlah GAP
3. jumlah BLOCKER
4. daftar GAP paling kritis
5. daftar kontrak yang masih UNVERIFIED
6. urutan perbaikan yang disarankan

Fokus pada bukti dari codebase. Jangan melakukan refactor.
