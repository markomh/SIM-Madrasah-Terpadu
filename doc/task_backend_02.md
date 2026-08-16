## TUGAS: STABILISASI AUTHORIZATION BACKEND

**Jangan mengerjakan fitur baru atau Milestone 2. Fokus hanya pada stabilisasi backend.**

Masalah saat ini:

> User dengan role/jabatan berbeda mendapatkan `capabilities` yang sama pada `GET /api/v1/me`.

### 1. Diagnosis terlebih dahulu

Telusuri alur:

```text
Pegawai
→ Penugasan Jabatan
→ Jabatan/Role
→ PegawaiAccessService
→ GET /api/v1/me
→ capabilities
```

Periksa juga Seeder dan relasi model.

**Jangan mengubah kode sebelum menemukan root cause.**

Tentukan apakah masalah berasal dari:

* data Seeder yang semua memiliki penugasan sama;
* resolver capability;
* relasi jabatan;
* authorization/policy;
* atau kombinasi beberapa hal.

### 2. Validasi dengan beberapa user

Gunakan minimal 3 persona yang memang berbeda, misalnya:

* Kepala Madrasah
* Operator
* Guru

Untuk masing-masing user:

```text
Login
→ GET /api/v1/me
→ catat capabilities
```

Capability **tidak boleh identik** jika penugasan mereka memang berbeda.

### 3. Negative test

Pastikan:

```text
Guru ≠ Kepala Madrasah
Guru ≠ Operator
Operator ≠ Guru BK
```

User tidak boleh memperoleh capability hanya karena endpoint `/me` mengembalikan semua flag `true`.

### 4. Perbaiki root cause

Lakukan perubahan **seminimal mungkin**.

Jangan:

* hardcode capability berdasarkan email;
* membuat semua capability `true`;
* mengubah frontend untuk menutupi backend;
* melakukan perubahan arsitektur yang tidak diperlukan;
* `migrate:fresh` tanpa alasan dan konfirmasi.

### 5. Regression test

Setelah fix, wajib buktikan:

* login berhasil;
* `/me` berhasil;
* setiap persona menghasilkan capability sesuai penugasannya;
* unauthorized access ditolak;
* tidak ada HTTP 500;
* tidak ada HTTP 404 yang berasal dari endpoint yang sudah dikontrak;
* test authorization lulus.

### OUTPUT WAJIB

Sebelum coding, berikan:

1. **Root cause**
2. **Evidence dari kode/database**
3. **Fix minimal**
4. **Test yang akan dijalankan**

Setelah coding, tampilkan hasil test.

**Jangan menyatakan backend stabil hanya karena satu akun berhasil login.**

Jangan lanjut ke fitur lain sebelum authorization dan capability terbukti benar.

---

SETUJUI IMPLEMENTASI, tetapi dengan scope berikut:

### PRIORITAS 1 — Role & Capability

Implementasikan terlebih dahulu:

* persona terpisah di Seeder;
* validasi `PegawaiAccessService`;
* `GET /api/v1/me`;
* automated test untuk perbedaan capability antar persona;
* negative test capability.

Jangan mengubah frontend.

### PENTING

Jangan menganggap semua capability `true` sebagai bug jika akun tersebut memang memiliki beberapa penugasan. Akun multi-role harus tetap didukung.

Pastikan persona berikut benar-benar memiliki data penugasan yang berbeda:

```text
Kamad
Admin
Operator
Guru BK
Guru
Wali Kelas
```

Setelah Seeder dibuat, tampilkan hasil aktual:

```text
email
→ jabatan/penugasan
→ capabilities
```

### PRIORITAS 2 — Authorization Guard

Jangan melakukan perubahan authorization endpoint secara luas sebelum Prioritas 1 lulus.

Setelah capability matrix lulus, baru implementasikan guard endpoint kritis yang memang sudah ditentukan kontrak/domain.

### TEST

Jalankan test yang relevan.

Jika ada test lama yang gagal, **jangan melakukan perubahan tambahan hanya untuk mengejar 100% pass**. Laporkan:

```text
TEST
STATUS
ROOT CAUSE
RELEVAN / TIDAK RELEVAN
```

### STOP CONDITION

Jangan lanjut ke Milestone 2.

Jangan mengubah UI.

Jangan membuat workaround frontend.

Jangan menyatakan backend stabil sebelum:

1. persona berbeda menghasilkan capability berbeda;
2. multi-role tetap bekerja;
3. negative capability test lulus;
4. authorization test yang relevan lulus;
5. root cause dan hasil test dilaporkan.

Implementasikan secara minimal dan tampilkan bukti hasil pengujian.

---

Temuan ini mengindikasikan kemungkinan **API contract mismatch antara Backend dan Frontend** pada modul Auth & Otorisasi.

JANGAN langsung melakukan perubahan kode.

Audit terlebih dahulu tiga SSoT (Single Source of Truth):
1. `doc/SIM_Madrasah_Terpadu_SRS_v2.md` (atau SRS di workspace)
2. `doc/backend.md` (atau BACKEND.MD di workspace)
3. Kontrak/type Frontend yang terkait `Pegawai`, `PenugasanJabatan`, dan `GET /api/v1/me` (seperti `types/pegawai.ts`, `services/auth.service.ts`, atau `AuthContext`)

Bandingkan secara eksplisit alur datanya:
Database/domain
→ Backend response JSON (Laravel Controller / Resource)
→ API contract (BACKEND.MD Bab 3 & 6.1)
→ Frontend TypeScript Types (FRONTEND.MD Bab 4)
→ AuthContext / Access Store
→ Access/capability logic (Menu Sidebar & Policy)

Khusus untuk endpoint `GET /api/v1/me`, buatkan TABEL PERBANDINGAN:
| FIELD | SSoT Specification | Backend JSON Response | Frontend Type (TS) | STATUS (Match / Mismatch / Missing) |

Khusus periksa bidang-bidang berikut:
* `id_pegawai`
* `id_madrasah` & `nama_madrasah`
* `status` & `tugas_utama`
* `penugasan_aktif` / `penugasan_jabatan`
* `capabilities` (misal: `isAdminMadrasah`, `isKepalaMadrasah`, `isOperatorKesiswaan`, `isGuruBk`, `isWaliKelas`)
* Penulisan bidang wajib `snake_case` (TIDAK boleh di-convert ke `camelCase` di response backend API)

Tentukan apakah masalah ini benar-benar **pelanggaran kontrak SSoT** atau hanya bug implementasi/seeder.

PRINSIP UTAMA:
1. Backend adalah pemegang otoritas tunggal untuk authorization/capability.
2. Frontend tidak boleh menghitung ulang business authorization jika capability sudah disediakan backend.
3. Jangan menambahkan field atau endpoint baru sebelum memastikan field tersebut memang diwajibkan oleh kontrak SSoT.
4. Jangan mengubah kode frontend hanya untuk menutupi (workaround) response backend yang salah.

OUTPUT YANG DIHARAPKAN:
1. Contract mismatch yang terbukti (jika ada)
2. SSoT yang dilanggar
3. Root cause (akar masalah)
4. Source of truth authorization yang seharusnya
5. Rencana minimal fix yang diperlukan (backend/seeder)

STOP setelah audit selesai. Tampilkan hasil audit terlebih dahulu dan MINTA PERSETUJUAN SAYA sebelum mulai coding!

---

Runtime TypeError

1. {imported module ./src/services/index.ts}.services.keanggotaan.getAnggotaAktif is not a function
Call Stack

2. :8080/api/v1/ekstrakurikuler:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)

3. http://localhost:8080/api/v1/siswa?status_siswa=Aktif