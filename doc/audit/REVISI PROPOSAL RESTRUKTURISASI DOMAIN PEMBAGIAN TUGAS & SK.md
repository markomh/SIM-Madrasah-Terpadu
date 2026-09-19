# PHASE 3.2 — REVISI PROPOSAL RESTRUKTURISASI DOMAIN PEMBAGIAN TUGAS & SK

## ROLE

Kamu adalah **Senior Domain Architect + DDD Architect + Enterprise UX Architect + Frontend Architect** untuk proyek SIM-Madrasah Terpadu.

Tugasmu BUKAN melakukan coding.

Tugasmu adalah **merevisi proposal “Restrukturisasi Domain Penugasan — DDD Implementation Plan”** yang diberikan setelah instruksi ini, sehingga proposal tersebut benar-benar mencerminkan:

1. proses operasional nyata madrasah;
2. keputusan domain yang sudah dikunci;
3. bukti dari EMIS GTK;
4. batas antara Pembagian Tugas/SK dan Jadwal;
5. prinsip DDD;
6. kebutuhan frontend saat ini tanpa menciptakan kontrak backend yang belum disepakati.

---

# A. TUJUAN UTAMA

Revisi proposal agar pusat desain bukan lagi “jenis tugas” secara teknis, tetapi:

> **PEMBAGIAN TUGAS & SK sebagai proses/artefak administratif yang menetapkan tugas dan beban kerja PTK untuk suatu periode.**

Lifecycle yang harus menjadi dasar:

```text
KONDISI MADRASAH
→ PEMBAGIAN TUGAS
→ PERHITUNGAN BEBAN KERJA
→ VALIDASI
→ SK
→ JADWAL
→ REALISASI KBM
```

Jangan membalik lifecycle hanya karena struktur route, database, atau component saat ini berbeda.

Prinsip utama:

```text
PEMBAGIAN TUGAS / SK
        ↓
menetapkan siapa melakukan tugas apa
dan bagaimana beban/ekuivalensinya
        ↓
JADWAL
        ↓
merealisasikan tugas mengajar ke hari/jam/tempat
```

---

# B. KEPUTUSAN DOMAIN YANG SUDAH DIKUNCI

Gunakan keputusan berikut sebagai baseline. Jangan mengubahnya tanpa bukti yang bertentangan.

### 1. Beban Mengajar

`Beban Mengajar` secara fungsional adalah **Pembagian Tugas Mengajar**:

```text
Guru
→ Mapel
→ Rombel
→ JTM
```

Ini merupakan bagian dari proses Pembagian Tugas/SK, bukan data pendukung Jadwal.

---

### 2. Wali Kelas

Wali Kelas merupakan bagian dari pembagian tugas/beban kerja yang ditetapkan dalam konteks SK.

Wali Kelas berbeda secara struktur dari tugas mengajar, tetapi **tidak boleh dipisahkan dari proses Pembagian Tugas & SK hanya karena struktur datanya berbeda**.

Keputusan proyek:

```text
Wali Kelas
→ Rombel
→ ekuivalensi +6 JTM
```

6 JTM adalah ekuivalensi beban kerja, bukan enam slot jadwal.

---

### 3. Tugas Tambahan / Jabatan

Tugas tambahan/jabatan yang mempunyai ekuivalensi JTM merupakan bagian dari pembagian tugas dan perhitungan beban kerja dalam SK.

Termasuk contoh:

* Kepala Madrasah;
* Waka;
* Wali Kelas;
* Kepala Lab;
* Kepala Perpustakaan;
* tugas tambahan lain yang memang mempunyai ekuivalensi.

Jangan menganggap setiap tugas tambahan sebagai jadwal KBM.

---

### 4. Kepala Madrasah

Keputusan proyek:

```text
Kepala Madrasah
→ 24 JTM ekuivalen
```

dan **tidak mensyaratkan adanya jadwal mengajar agar ekuivalensi tersebut dihitung**.

Nilai harus bersifat dinamis/configurable berdasarkan parameter yang berlaku, bukan hardcoded di UI.

---

### 5. BK/TIK

BK/TIK merupakan bentuk pembagian tugas/beban kerja khusus.

EMIS menunjukkan adanya plotting Guru BK/TIK ke rombel dan model beban berbasis rombel binaan.

Namun **jangan mengarang formula ekuivalensi BK/TIK** jika formula resmi belum tersedia dalam evidence yang diberikan.

Modelkan assignment-nya terlebih dahulu dan tandai formula yang belum terbukti sebagai:

`EVIDENCE REQUIRED`.

---

### 6. Team Teaching

Team Teaching diperbolehkan.

EMIS menggunakan pembagian tugas per guru.

Karena itu setiap guru yang terlibat harus dapat direpresentasikan sebagai assignment individual dengan JTM/share yang jelas.

Namun jangan mengasumsikan:

```text
4 JTM = 2 + 2
5 JTM = 3 + 2
```

sebagai aturan nasional.

Jika belum ada policy resmi proyek, tandai:

`NEEDS DECISION` atau `EVIDENCE REQUIRED`.

---

### 7. JTM Assignment vs Jadwal

Harus dipisahkan secara konseptual:

```text
JTM Pembagian Tugas
=
target/normatif yang ditetapkan dalam pembagian tugas/SK
```

sedangkan:

```text
JTM Jadwal
=
realisasi operasional kapan tugas mengajar dilaksanakan
```

Jadwal tidak boleh mengubah target Pembagian Tugas secara diam-diam.

---

### 8. Kuota JTM Kurikulum

Keputusan proyek:

> Alokasi/kuota JTM mata pelajaran ditentukan oleh **kurikulum + tingkat + mata pelajaran**.

Model konseptual:

```text
Kurikulum
+
Tingkat
+
Mapel
→
Alokasi/Kuota JTM
```

EMIS mendukung pengelolaan mata pelajaran berdasarkan kurikulum dan menampilkan alokasi jam.

Jangan menyamakan `Alokasi JTM Kurikulum` dengan `JTM guru` tanpa membuktikan hubungan keduanya.

---

### 9. Linearitas

Jangan implementasikan linearitas hanya sebagai:

```text
pegawai.mapel_sertifikasi.includes(mapel)
```

Bukti yang tersedia menunjukkan linearitas berkaitan dengan:

```text
PTK
+
sertifikasi / ijazah tervalidasi
+
mapel
+
kurikulum
→
status linearitas
```

Jika mapping resmi belum lengkap, jangan membuat engine final. Tandai bagian tersebut sebagai:

`EVIDENCE REQUIRED`.

---

### 10. EMIS Data vs EMIS UI

Pertahankan:

> kompatibilitas data, proses, dan kebutuhan pelaporan EMIS.

Jangan menyalin UI EMIS sebagai SSoT.

UI SIM-Madrasah boleh berbeda selama domain/data/process contract tetap kompatibel.

---

# C. KOREKSI KONSEPTUAL TERHADAP PROPOSAL LAMA

Proposal lama menggunakan:

```text
Tab:
1. Tugas Struktural
2. Wali Kelas
3. Beban Mengajar
4. Plotting BK
5. Rekap & Validasi
```

Jangan otomatis mempertahankan struktur tersebut.

Evaluasi ulang berdasarkan pertanyaan:

> “Bagaimana Admin/Kamad menyelesaikan penyusunan SK Pembagian Tugas secara nyata?”

Bukan:

> “Bagaimana entity database saat ini dikelompokkan?”

Jenis tugas boleh tetap mempunyai form/component/data model berbeda, tetapi semuanya harus berada dalam satu **workspace/proses Pembagian Tugas & SK**.

Gunakan prinsip:

```text
SATU PROSES BISNIS
+
BEBERAPA JENIS PENUGASAN
+
SATU REKAP BEBAN KERJA
+
SATU VALIDASI SK
```

Bukan:

```text
SATU JENIS TUGAS
=
SATU DOMAIN TERPISAH
```

---

# D. REVISI WAJIB UNTUK 6 COMPONENT UTAMA

Proposal hasil revisi WAJIB tetap memiliki keenam komponen berikut, tetapi isi masing-masing harus diperbaiki berdasarkan keputusan domain di atas.

---

## COMPONENT 1 — TYPE SYSTEM

Tinjau ulang seluruh type:

```text
ParameterEkuivalensiJTM
KuotaJTMKurikulum
PlottingBK
RingkasanJTMGuru
```

### Wajib tentukan:

1. type mana yang merupakan **source data/assignment**;
2. type mana yang merupakan **parameter/reference**;
3. type mana yang merupakan **computed projection/read model**;
4. type mana yang belum boleh dibuat karena kontraknya belum terkunci.

### Untuk ParameterEkuivalensiJTM

Pertimbangkan konteks:

```text
jenis tugas
nilai ekuivalensi
periode berlaku
status
sumber ketentuan
```

Jangan membuat parameter sebagai angka global tanpa periode berlaku.

### Untuk KuotaJTMKurikulum

Minimal evaluasi:

```text
id_kurikulum
id_tingkat
id_mapel
alokasi_jtm
```

Jangan kehilangan dimensi kurikulum.

### Untuk RingkasanJTMGuru

Bedakan:

```text
JTM pembelajaran
JTM wali kelas
JTM tugas tambahan
JTM BK/TIK
JTM lainnya
total beban
status validasi
```

Jangan otomatis menyimpulkan:

```text
jtm_total >= 24
=
TPG eligible
```

jika rule eligibility lengkap belum menjadi kontrak proyek.

---

# COMPONENT 2 — SERVICE LAYER

Pertahankan:

```text
penugasan.mock.ts
penugasan.api.ts
penugasan.service.ts
```

Tetapi pastikan:

> Mock merepresentasikan kontrak domain, bukan menciptakan business rule baru.

Pisahkan secara konseptual:

```text
source assignment
      ↓
calculation
      ↓
validation
      ↓
projection
```

Jangan membuat business rule tersebar di React component.

Service harus memungkinkan backend menggantikan mock tanpa mengubah makna domain.

---

# COMPONENT 3 — HALAMAN `/penugasan`

Ini adalah bagian yang paling harus direvisi.

Tujuan halaman:

> **Workspace penyusunan Pembagian Tugas & SK untuk periode tertentu.**

Bukan:

> kumpulan CRUD berbagai assignment.

Evaluasi ulang lima tab lama.

Boleh menggunakan tab jika memang mendukung workflow, tetapi urutan dan nama harus mengikuti proses nyata.

Minimal harus menjelaskan:

```text
Periode Pembagian Tugas
        ↓
Data/Assignment
        ↓
Perhitungan Beban Kerja
        ↓
Validasi
        ↓
SK
```

### Wajib jelaskan bagaimana UI menangani:

* Pembagian Tugas Mengajar;
* Wali Kelas;
* Tugas Tambahan;
* BK/TIK;
* Team Teaching;
* rekap beban per guru;
* validasi kuota;
* validasi linearitas;
* status Draft/Validasi/Disahkan.

### Jangan membuat:

```text
Kamad/Admin/Ops/BK
```

sebagai satu tabel baru yang mengambil alih ownership `penugasan_jabatan`.

`penugasan_jabatan` tetap mempunyai konteks Identity & Access.

Namun informasi tugas yang relevan dapat diproyeksikan ke workspace Pembagian Tugas & SK.

Dengan prinsip:

```text
SOURCE OF TRUTH
        ↓
PROJECTION / CONTEXT VIEW
```

bukan duplikasi data.

---

# COMPONENT 4 — REFACTOR EXISTING

Evaluasi tiga route:

```text
/akun
/referensi
/akademik/jadwal/master-data
```

Tujuan refactor:

> menghilangkan duplicate ownership/action, bukan sekadar memindahkan UI.

### `/akun`

Tetap menjadi area Identity & Access.

Penugasan jabatan tetap memiliki source/ownership di konteks tersebut.

Workspace `/penugasan` hanya menggunakan data yang relevan untuk penyusunan SK.

### `/referensi`

Rombel tetap menjadi master/operational reference.

Nama Wali Kelas boleh ditampilkan read-only.

Action perubahan Wali Kelas harus berada pada workflow Pembagian Tugas & SK jika keputusan domain memang demikian.

### `/akademik/jadwal/master-data`

Hapus ownership Pembagian Tugas Mengajar.

Pertahankan:

```text
Ruang/Fasilitas
Ketersediaan Guru
constraint scheduling
```

Jelaskan secara eksplisit mengapa:

```text
Pembagian Tugas → /penugasan
Constraint → /akademik/jadwal/master-data
Realization → /akademik/jadwal
```

---

# COMPONENT 5 — NAVIGATION

Evaluasi kembali:

```text
KEPEGAWAIAN
↓
SK & PENUGASAN
↓
AKADEMIK
```

Tujuannya adalah mencerminkan lifecycle pengguna.

Rekomendasi awal:

```text
Pembagian Tugas & SK
```

sebagai label navigasi.

Tetapi keputusan akhir harus didasarkan pada terminologi yang digunakan Admin/Kamad, bukan jargon developer seperti:

```text
Assignment
DDD
SSoT
Hard Block
Domain
```

Jelaskan:

1. lokasi menu;
2. siapa yang boleh melihat;
3. siapa yang boleh mengubah;
4. siapa yang boleh mengesahkan;
5. bagaimana context Tahun Ajaran/Semester dipertahankan.

---

# COMPONENT 6 — PARAMETER / REFERENSI

Tinjau ulang gagasan:

```text
Referensi → Parameter JTM
```

Pertahankan hanya jika memang merupakan reference/configuration.

Bedakan minimal:

### A. Parameter Ekuivalensi

Contoh:

```text
Kepala Madrasah → 24
Wali Kelas → 6
```

### B. Alokasi/Kuota Kurikulum

```text
Kurikulum
+
Tingkat
+
Mapel
→
Alokasi JTM
```

### C. Assignment

```text
Guru
+
Mapel
+
Rombel
+
JTM
```

### D. Jadwal

```text
Assignment
+
Hari
+
Jam
+
Ruang
```

Jangan mencampur keempatnya.

---

# E. TAMBAHKAN COMPONENT 0 — DOMAIN CONTRACT

Sebelum keenam component, tambahkan:

## COMPONENT 0 — DOMAIN CONTRACT ADAPTER

Bukan UI dan bukan database.

Tujuannya memastikan frontend hanya mengimplementasikan kontrak yang sudah diputuskan.

Dokumentasikan:

```text
Periode Pembagian Tugas
Assignment
Ekuivalensi
Kuota Kurikulum
Beban Kerja
Validasi
Lifecycle SK
```

Untuk setiap konsep tentukan:

| Konsep                | Status                     |
| --------------------- | -------------------------- |
| LOCKED                | kontrak sudah jelas        |
| NEEDS DECISION        | keputusan bisnis belum ada |
| EVIDENCE REQUIRED     | perlu sumber resmi         |
| IMPLEMENTATION DETAIL | boleh diputuskan teknis    |

Jika ada business rule yang belum jelas, **JANGAN mengarangnya untuk membuat UI terlihat lengkap.**

---

# F. MODELKAN SK SEBAGAI ARTEFAK PROSES

Proposal hasil revisi wajib menjelaskan apakah model UI berikut lebih tepat:

```text
PEMBAGIAN TUGAS
      ↓
REKAP
      ↓
VALIDASI
      ↓
SK
```

daripada:

```text
5 CRUD TAB
```

Gunakan bukti struktur SK nyata yang telah diberikan/ditemukan sebelumnya sebagai konteks, tetapi jangan mengklaim suatu aturan regulasi jika sumber tidak membuktikannya.

Perhatikan bahwa satu SK dapat memiliki beberapa bagian/lampiran:

```text
Lampiran Pembagian Tugas Mengajar
Lampiran Tugas Tambahan
Lampiran/Wali Kelas
Rekap Beban Kerja
```

Namun semuanya dapat menjadi bagian dari satu keputusan administratif.

---

# G. LIFECYCLE SK

Proposal wajib memiliki state machine minimal:

```text
DRAFT
  ↓
VALIDASI
  ↓
SIAP DISAHKAN
  ↓
DISAHKAN
```

Jika proposal membutuhkan state lain, jelaskan alasannya.

Wajib tentukan:

* kapan assignment masih boleh diedit;
* kapan validasi dijalankan;
* kapan SK dianggap final;
* apa yang terjadi jika ada perubahan setelah SK disahkan;
* apakah perlu revisi SK;
* bagaimana perubahan berdampak ke jadwal.

Jangan membuat mekanisme override tanpa governance.

---

# H. VALIDATION MATRIX

Proposal hasil revisi wajib mempunyai matriks validasi.

Minimal:

| Validasi                | Sumber                       | Status   |
| ----------------------- | ---------------------------- | -------- |
| Pembagian tugas lengkap | Domain                       | tentukan |
| Kuota JTM kurikulum     | Kurikulum/EMIS               | tentukan |
| Teacher assignment      | Pembagian tugas              | tentukan |
| Wali Kelas              | Pembagian tugas              | tentukan |
| Tugas tambahan          | SK/parameter                 | tentukan |
| BK/TIK                  | EMIS/domain                  | tentukan |
| Linearitas              | Sertifikasi/ijazah + mapping | tentukan |
| Total beban kerja       | Computed                     | tentukan |
| Team Teaching           | Domain policy                | tentukan |
| SK readiness            | Aggregate validation         | tentukan |

Setiap item harus mempunyai status:

```text
LOCKED
IMPLEMENTABLE
EVIDENCE REQUIRED
NEEDS DECISION
```

---

# I. VERIFICATION PLAN

Proposal lama hanya menggunakan:

```bash
npx tsc --noEmit
```

Itu tidak cukup.

Tetap gunakan TypeScript compile test, tetapi tambahkan test konseptual dan manual untuk frontend.

Minimal:

### Type

```text
tsc --noEmit
```

### Calculation

Uji:

```text
Kamad = 24
Wali Kelas = +6
Guru mengajar + wali kelas
Guru dengan tugas tambahan
```

### Curriculum quota

Uji:

```text
kurikulum
+
tingkat
+
mapel
→
kuota
```

### Cross-context consistency

Uji:

```text
/penugasan
→
/referensi
```

dan:

```text
/penugasan
→
/akademik/jadwal
```

### Lifecycle

Uji:

```text
Draft
→ Validasi
→ Disahkan
```

### No duplicate ownership

Pastikan tidak ada dua halaman yang dapat mengubah fakta yang sama melalui dua jalur berbeda.

---

# J. BATASAN IMPLEMENTASI

Proposal hasil revisi HARUS mempertahankan:

```text
FRONTEND-ONLY
```

untuk tahap ini.

Jangan:

* membuat migration;
* mengubah Laravel model;
* mengubah controller;
* membuat endpoint backend;
* membuat Auto-Scheduler;
* membuat solver;
* mengklaim constraint backend sudah selesai.

Namun type/service contract harus dirancang agar **tidak menghambat implementasi backend berikutnya**.

---

# K. OUTPUT YANG WAJIB DIHASILKAN

Jangan menghasilkan kode.

Hasil akhir harus berupa proposal implementasi yang sudah direvisi dan siap diberikan kepada agent coding berikutnya.

Struktur output:

## 1. Executive Decision

Jawab tegas:

* apakah proposal lama dipertahankan;
* apa yang diubah;
* apa yang tidak berubah;
* mengapa.

## 2. Domain Model Final

Tampilkan:

```text
KONDISI MADRASAH
→ PEMBAGIAN TUGAS
→ BEBAN KERJA
→ VALIDASI
→ SK
→ JADWAL
→ REALISASI
```

dan hubungan antar entitas.

## 3. Domain Decision Register

Gunakan:

| Keputusan | Status | Dasar | Konsekuensi UI |
| --------- | ------ | ----- | -------------- |

## 4. Revised Component 0–6

Untuk masing-masing component:

* tujuan;
* ownership;
* data;
* dependency;
* perubahan dari proposal lama;
* risiko;
* verification.

## 5. Revised Route Map

Tampilkan:

```text
/akun
/referensi
/penugasan
/akademik/jadwal/master-data
/akademik/jadwal
```

beserta ownership masing-masing.

## 6. Revised User Journey

Tampilkan perjalanan Admin/Kamad:

```text
Kondisi Madrasah
→ Rombel
→ Guru
→ Pembagian Tugas
→ Wali Kelas
→ Tugas Tambahan
→ Rekap Beban
→ Validasi
→ SK
→ Jadwal
```

Sesuaikan jika bukti menunjukkan urutan yang berbeda.

## 7. Validation Matrix

Pisahkan:

```text
LOCKED RULE
vs
EVIDENCE REQUIRED
vs
NEEDS DECISION
```

## 8. Frontend Implementation Boundary

Jelaskan dengan tegas apa yang BOLEH dikerjakan sekarang dan apa yang HARUS menunggu backend/domain closure.

## 9. Verification Gate

Tentukan kondisi:

```text
GO
NO-GO
```

untuk memulai coding.

## 10. Final Coding Handoff

Berikan ringkasan singkat yang dapat langsung digunakan sebagai input agent coding berikutnya.

---

# L. ATURAN ANTI-ASUMSI

Ini WAJIB.

Jika menemukan sesuatu yang belum terbukti:

> Jangan mengisi kekosongan dengan asumsi.

Gunakan salah satu:

```text
EVIDENCE REQUIRED
```

atau:

```text
NEEDS DECISION
```

Jika proposal lama bertentangan dengan keputusan domain terbaru:

> keputusan domain terbaru menang.

Jika struktur database saat ini bertentangan dengan lifecycle bisnis:

> jangan memaksa lifecycle mengikuti database.

Jika UI saat ini berbeda dengan lifecycle:

> jangan menganggap UI saat ini sebagai SSoT.

Jika EMIS UI berbeda dengan SIM:

> jangan menyalin UI EMIS; pertahankan kontrak data/proses yang memang relevan.

---

# M. HASIL YANG DIHARAPKAN

Pada akhir analisis, saya harus dapat membaca proposal tersebut dan langsung mengetahui:

1. **Apa sebenarnya domain `/penugasan`?**
2. **Apa yang sedang ditetapkan oleh SK?**
3. **Apa saja jenis tugas yang dapat masuk ke SK?**
4. **Bagaimana JTM mengajar, ekuivalensi, dan total beban dihitung?**
5. **Apa hubungan kuota kurikulum dengan pembagian tugas?**
6. **Mengapa Wali Kelas, Tugas Tambahan, dan BK/TIK berada dalam proses yang sama tetapi tidak harus menjadi satu entity database?**
7. **Apa yang menjadi source of truth masing-masing data?**
8. **Apa yang terjadi sebelum dan sesudah SK disahkan?**
9. **Mengapa Jadwal berada setelah Pembagian Tugas?**
10. **Bagian mana yang sudah dapat diimplementasikan frontend sekarang?**
11. **Bagian mana yang harus menunggu keputusan/evidence?**
12. **Apakah proposal sudah cukup stabil untuk diberikan kepada agent coding?**

Jangan berhenti pada rekomendasi umum.

**Hasil akhir harus berupa proposal revisi konkret, lengkap, konsisten, dan siap menjadi baseline implementasi frontend tahap berikutnya.**
