Anda bertindak sebagai Senior Full-Stack Architect, QA Architect, dan SSoT Compliance Auditor untuk proyek SIM Madrasah Terpadu.

TUJUAN UTAMA

Sinkronkan hasil audit implementasi terakhir dengan Contract Matrix resmi tanpa mengubah isi 3 SSoT secara sepihak.

3 SSoT resmi:
1. doc/SIM_Madrasah_Terpadu_SRS_v2.md
2. doc/FRONTEND.md + src/types/
3. doc/backend.md

Contract Matrix:
- CONTRACT LOCKED
- OFFICIAL BASELINE FOR TAHAP 2 BACKEND IMPLEMENTATION

PRINSIP PENTING

1. Jangan menganggap status "PASS" pada Contract Matrix lama sebagai bukti bahwa runtime implementation sudah benar.
2. Jangan mengubah Structural Reconciliation Status hanya karena ditemukan implementation/behavioral defect.
3. Jangan mengubah SSoT untuk menyesuaikan kode.
4. Jangan mengubah Contract Matrix secara arbitrer untuk membuat hasil audit menjadi PASS.
5. Jika audit menemukan implementasi yang menyimpang dari SSoT/Contract, kode harus disesuaikan dengan contract kecuali ada keputusan arsitektural resmi.
6. Jangan membuat business rule baru tanpa bukti dari 3 SSoT atau keputusan arsitektural yang terdokumentasi.
7. Jangan menghapus GAP audit hanya karena entity/enum/FK pada Contract Matrix berstatus PASS.
8. Semua klaim PASS baru harus mempunyai implementation evidence atau automated test evidence.
9. Jangan menggunakan `as unknown as` untuk menutupi interface mismatch.
10. Jangan melakukan refactor besar di luar GAP yang teridentifikasi.

==================================================
TAHAP 1 — BACA DAN REKONSILIASI
==================================================

Baca terlebih dahulu:

1. 3 SSoT
2. Contract Matrix saat ini
3. seluruh file yang terkait dengan hasil audit
4. routes
5. controller
6. policy
7. service
8. model
9. migration
10. frontend service/interface/mock/api
11. test yang sudah ada

Jangan mengubah kode pada tahap ini.

Buat terlebih dahulu pemetaan:

SSoT
→ Contract Matrix
→ Actual Implementation
→ Test Evidence

Tujuan tahap ini adalah memastikan apakah setiap temuan audit:
- benar-benar valid,
- false positive,
- sudah diperbaiki tetapi matrix belum diperbarui,
- atau memang merupakan gap baru yang belum tercakup matrix.

==================================================
TAHAP 2 — TAMBAHKAN VERIFICATION LAYER KE CONTRACT MATRIX
==================================================

Pertahankan kolom:

Reconciliation Status

JANGAN mengubah arti kolom tersebut.

Reconciliation Status hanya berarti:

"SSoT ↔ Frontend Contract ↔ Backend Contract/Schema telah direkonsiliasi."

Tambahkan kolom:

1. API Contract Status
2. Implementation Status
3. Behavioral Status
4. Security Status
5. Test Evidence Status
6. Evidence Reference
7. Final Compliance Status

Definisi:

API Contract Status:
- apakah frontend service, endpoint, request, response, dan error contract konsisten.

Implementation Status:
- apakah kontrak benar-benar diimplementasikan dalam source code.

Behavioral Status:
- apakah business workflow/state transition/side effect berjalan sesuai SSoT.

Security Status:
- authorization, policy, tenant isolation, ownership, RLS/global scope.

Test Evidence Status:
- apakah terdapat automated test yang membuktikan requirement dan test tersebut PASS.

Evidence Reference:
- path file, class, method, route, atau test yang menjadi bukti.

Final Compliance Status:
- PASS hanya jika seluruh requirement yang relevan telah terimplementasi dan diverifikasi.
- FAIL jika terdapat implementasi yang bertentangan dengan contract.
- PARTIAL jika implementasi hanya sebagian.
- NOT VERIFIED jika belum mempunyai bukti.
- OUT_OF_SCOPE jika memang berada di luar scope resmi.
- DEFERRED hanya jika ada keputusan resmi untuk menunda.

Jangan menggunakan "PASS" hanya karena entity/model/table/type tersedia.

==================================================
TAHAP 3 — BUAT MATRIX TAMBAHAN
==================================================

Jangan membuat Entity Matrix menjadi tabel raksasa.

Pertahankan 3 matrix yang sudah ada:

1. Entity Reconciliation Matrix
2. Enum & Value Set Audit Matrix
3. Relationship & Foreign Key Audit Matrix

Tambahkan matrix:

4. API & Service Contract Matrix
5. Business Workflow Compliance Matrix
6. Security & Tenant Isolation Matrix
7. Implementation Duplication & Deviation Register

==================================================
TAHAP 4 — API & SERVICE CONTRACT MATRIX
==================================================

Buat inventory seluruh service frontend.

Minimal periksa:

- services/*.service.ts
- *.api.ts
- *.mock.ts
- services/index.ts
- src/types/

Untuk setiap service/method catat:

Service
Method
Frontend Interface
Mock Implementation
API Implementation
Endpoint
HTTP Method
Request Contract
Response Contract
Auth Requirement
Tenant Requirement
Test Evidence
Final Compliance

Fokus khusus pada:

- MutasiService
- bkService
- seluruh service yang menggunakan `as unknown as`

Temukan seluruh interface mismatch.

Target:

Mock implementation == API implementation == Service interface

Tidak boleh menggunakan unsafe cast untuk menyembunyikan mismatch.

==================================================
TAHAP 5 — BUSINESS WORKFLOW MATRIX
==================================================

Buat inventory seluruh workflow yang memiliki state transition atau side effect.

Minimal audit:

1. Mutasi Masuk
2. Mutasi Keluar
3. Approval Mutasi
4. Reject Mutasi
5. Pindah Rombel
6. Approval Pindah Rombel
7. Kenaikan Kelas
8. workflow lain yang ditentukan oleh SSoT

Untuk setiap workflow catat:

Workflow
Trigger
Actor
Precondition
Expected State Transition
Required Side Effect
Transaction Requirement
Authorization
Tenant Boundary
Implementation
Test
Final Compliance

Contoh Mutasi Keluar:

Approve
→ siswa.status = Mutasi Keluar
→ anggota_rombel aktif ditutup
→ tanggal_selesai diisi
→ status_keanggotaan = Keluar
→ seluruh operasi atomic

Jangan mengarang side effect.
Validasi setiap requirement terhadap SSoT.

==================================================
TAHAP 6 — SECURITY & TENANT ISOLATION MATRIX
==================================================

Audit seluruh root tenant entity dan inherited tenant entity.

Minimal:

- Siswa
- Pegawai
- Rombel
- TahunAjaran
- MataPelajaran
- Ekstrakurikuler
- CatatanBk
- ProfilMadrasah
- TemplateSurat
- Surat
- seluruh child entity yang tenant inheritance-nya ditentukan Contract Matrix

Periksa:

- Global scope
- RLS
- Policy
- Controller authorization
- Route model binding
- Relationship traversal
- Read isolation
- Create isolation
- Update isolation
- Delete isolation

Jangan menyatakan PASS hanya berdasarkan keberadaan `id_madrasah`.

Harus ada test evidence.

==================================================
TAHAP 7 — DUPLICATE & DEVIATION REGISTER
==================================================

Masukkan hasil audit:

DUP-01
DUP-02
DEV-01

dan temuan duplicate/deviation lain yang ditemukan.

Untuk setiap item:

ID
Capability
Implementation A
Implementation B
Canonical Implementation
SSoT Reference
Impact
Required Action
Status
Evidence

Fokus:

DUP-01:
MutasiController@setujui
vs
PersetujuanController@approveMutasi

PindahRombelController@setujui
vs
PersetujuanController@approvePindahRombel

DUP-02:
bk.api.ts duplicate methods
lembagaApi duplicate methods

DEV-01:
BerkasPendukung / attachment

Jangan menghapus salah satu implementasi sebelum menentukan canonical implementation berdasarkan SSoT dan arsitektur.

==================================================
TAHAP 8 — REVALIDASI HASIL AUDIT
==================================================

Gunakan temuan audit berikut sebagai initial verification backlog:

GAP-01
Broken Mutasi Masuk/Keluar API dan hanging frontend code.

GAP-02
Mutasi Keluar approval tidak menutup anggota_rombel.

GAP-03
BK service signature mismatch.

GAP-04
Batch Mutasi Masuk tidak mengaktifkan siswa.

DUP-01
Duplicate approval endpoints/controller logic.

DUP-02
Duplicate frontend helper methods.

DEV-01
BerkasPendukung belum memiliki backend/storage implementation.

Tech Debt:
- unsafe typecasting
- global LocalStorage key
- raw input
- authorization mismatch
- incomplete tenant isolation tests

Untuk setiap item:

1. Temukan SSoT reference.
2. Temukan Contract Matrix reference.
3. Temukan actual source implementation.
4. Tentukan apakah audit finding valid.
5. Masukkan ke matrix.
6. Tentukan status.
7. Jangan memperbaiki kode sebelum klasifikasi selesai.

==================================================
TAHAP 9 — IMPLEMENTATION
==================================================

Setelah matrix diperbarui dan seluruh finding terklasifikasi, baru lakukan implementasi.

Prioritas:

P0 — Security / Authorization / Tenant Isolation
P0 — Mutasi Masuk/Masih Keluar contract failure
P0 — Data integrity/state transition
P1 — API/service parity
P1 — Duplicate business logic
P1 — Test coverage
P2 — UI/design-system debt

Untuk Mutasi:

- pilih satu canonical approval use case/service;
- controller hanya menjadi transport/orchestration layer;
- authorization harus konsisten dengan Policy;
- Mutasi Keluar harus menutup anggota_rombel;
- Mutasi Masuk harus menghasilkan siswa aktif sesuai contract;
- jika siswa belum ada, gunakan transaction yang sesuai dengan contract;
- API dan frontend service harus mempunyai contract yang sama.

==================================================
TAHAP 10 — TEST
==================================================

Setelah implementasi:

Backend:

docker exec sim_madrasah_app php artisan test

Frontend:

npx tsc --noEmit

dan:

npm run build

Kemudian test runtime dengan:

NEXT_PUBLIC_USE_MOCK=false

Uji minimal:

1. Mutasi listing
2. Mutasi Masuk
3. Mutasi Keluar
4. Approval
5. Reject
6. BK
7. Tenant isolation
8. Authorization

Jangan hanya mengandalkan unit test.

==================================================
TAHAP 11 — UPDATE EVIDENCE
==================================================

Setelah test PASS:

Update:

Implementation Status
Behavioral Status
Security Status
Test Evidence Status
Evidence Reference
Final Compliance Status

Jangan mengubah Structural Reconciliation Status kecuali ditemukan bahwa reconciliation SSoT ↔ FE ↔ BE memang salah.

==================================================
TAHAP 12 — FINAL GATE
==================================================

Jangan menyatakan "100% Full SSoT Alignment" kecuali:

- Structural Reconciliation = PASS
- API Contract = PASS
- Implementation = PASS
- Behavioral = PASS
- Security = PASS
- Test Evidence = PASS
- unresolved critical GAP = 0
- unresolved critical DUP = 0
- unresolved critical DEV = 0
- unsafe typecast = 0 untuk service contract
- tenant isolation test coverage sesuai matrix
- production build PASS
- live API runtime PASS

Jika salah satu belum terbukti, gunakan:

NOT VERIFIED

bukan PASS.

==================================================
OUTPUT WAJIB
==================================================

Jangan langsung memberikan kode.

Berikan laporan dalam urutan:

1. Structural reconciliation result
2. Audit finding reconciliation
3. Contract Matrix changes
4. New API/Service Matrix
5. Business Workflow Matrix
6. Security/Tenant Matrix
7. Duplicate/Deviation Register
8. Gap classification
9. Recommended implementation order
10. Test plan
11. Final compliance status

Tampilkan secara eksplisit:

- apa yang memang sudah PASS,
- apa yang ternyata FAIL,
- apa yang PARTIAL,
- apa yang belum diverifikasi,
- apa yang OUT_OF_SCOPE,
- dan apa yang DEFERRED.

Jangan mengubah status menjadi PASS hanya karena source code terlihat masuk akal.
Setiap PASS harus memiliki evidence.