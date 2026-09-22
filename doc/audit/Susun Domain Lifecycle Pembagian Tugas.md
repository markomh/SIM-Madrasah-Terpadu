Kita susun Domain Lifecycle Pembagian Tugas → SK → Jadwal berdasarkan skenario operasional yang Anda jelaskan. Saya akan sengaja memisahkan fakta yang sudah jelas dari keputusan domain yang masih harus dikunci, supaya lifecycle ini tidak diam-diam menjadi SSoT baru sebelum divalidasi.


Domain Lifecycle Pembagian Tugas → SK → Jadwal
1. Gambaran besar
Secara realita madrasah, lifecycle-nya seharusnya:
┌───────────────────────────────────────────────────────────┐
│                 AWAL TAHUN AJARAN                         │
└────────────────────────────┬──────────────────────────────┘
                             ↓
                  1. PENETAPAN KONTEKS
                             │
             ┌───────────────┼────────────────┐
             ↓               ↓                ↓
          Rombel           Guru             Mapel/
        terbaru          tersedia          Kurikulum
             │               │                │
             └───────────────┼────────────────┘
                             ↓
                  2. ANALISIS KEBUTUHAN
                             │
                             ↓
                 3. PEMBAGIAN TUGAS
                             │
              ┌──────────────┼───────────────┐
              ↓              ↓               ↓
            Guru           Mapel           Rombel
              │              │               │
              └──────────────┼───────────────┘
                             ↓
                            JTM
                             │
                             ↓
                  4. PENETAPAN WALI KELAS
                             │
                             ↓
                    5. VALIDASI
                             │
                ┌────────────┼────────────┐
                ↓            ↓            ↓
            Guru/JTM      Rombel       Linearitas
                │            │            │
                └────────────┼────────────┘
                             ↓
                    6. PENGESAHAN SK
                             │
                             ↓
                    7. SK BERLAKU
                             │
                             ↓
                  8. PENYUSUNAN JADWAL
                             │
          ┌──────────────────┼─────────────────┐
          ↓                  ↓                 ↓
        Waktu              Guru             Ruang/
                                               Fasilitas
          │                  │                 │
          └──────────────────┼─────────────────┘
                             ↓
                    9. VALIDASI JADWAL
                             │
                             ↓
                    10. JADWAL DITERBITKAN
                             │
                             ↓
                      11. REALISASI KBM
Ini adalah domain lifecycle, bukan struktur menu.

2. Tahap 0 — Tahun Ajaran Baru
Semua proses dimulai dari konteks:
Tahun Ajaran
+
Semester
+
Kurikulum
Contoh:
2026/2027
Semester 1
Kurikulum Merdeka
Ini penting karena seluruh pembagian tugas dan jadwal berikutnya harus memiliki konteks waktu yang jelas.

3. Tahap 1 — Penetapan Kondisi Madrasah
Ini terjadi setelah kondisi peserta didik dan guru untuk tahun ajaran baru diketahui.
Yang berubah dibanding tahun sebelumnya dapat berupa:
Jumlah siswa
       ↓
Jumlah rombel
       ↓
Kebutuhan pembelajaran
       ↓
Kebutuhan guru
       ↓
Beban/JTM
Contoh:
Tahun sebelumnya
6 rombel
20 guru
Setelah PPDB
8 rombel
22 guru
Maka pembagian tugas tahun sebelumnya tidak boleh otomatis dianggap masih berlaku.
Harus dilakukan penyusunan ulang/penyesuaian untuk tahun ajaran baru.

4. Tahap 2 — Penetapan Rombel
Rombel terbaru menjadi salah satu input utama.
Contoh:
7-A
7-B
7-C

8-A
8-B

9-A
9-B
Pada tahap ini juga terdapat pertanyaan:
Siapa wali kelas masing-masing rombel?
Namun berdasarkan skenario Anda, penetapan wali kelas merupakan bagian dari proses pembagian/penetapan tugas awal tahun, sehingga tidak seharusnya dipandang hanya sebagai field CRUD Rombel.
Konsepnya:
Rombel
   ↓
calon/penetapan wali kelas
   ↓
validasi
   ↓
pengesahan

5. Tahap 3 — Inventarisasi Guru
Selanjutnya madrasah melihat kondisi SDM:
Guru tersedia
Guru baru
Guru keluar
Guru pindah
Guru tambahan
Guru dengan tugas tambahan
Kemudian diperiksa:
Guru
+
kompetensi/sertifikasi
+
ijazah tervalidasi
+
konteks tugas
Ini menjadi input pembagian tugas.

6. Tahap 4 — Analisis Kebutuhan Pembelajaran
Sekarang madrasah mengetahui:
Rombel berapa?
Mapel apa?
Berapa kebutuhan JTM?
Guru siapa yang tersedia?
Secara konseptual:
Rombel
  +
Mapel
  +
Kurikulum
  +
alokasi/kebutuhan JTM
       ↓
Kebutuhan Pembelajaran
Catatan penting: arti persis Alokasi Jam dari data EMIS yang Anda berikan belum boleh otomatis dianggap sama dengan JTM pembagian tugas. Hubungan tersebut masih perlu dikunci dalam SSoT.

7. Tahap 5 — Penyusunan Pembagian Tugas Mengajar
Inilah inti lifecycle.
Madrasah menetapkan:
Guru
   ↓
Mapel
   ↓
Rombel
   ↓
JTM
Contoh:
Ahmad
→ Matematika
→ 8-A
→ 4 JTM
Kemudian:
Ahmad
→ IPA
→ 8-B
→ 4 JTM
dan seterusnya.

8. Ini yang seharusnya menjadi makna Beban Mengajar
Berdasarkan skenario lapangan Anda, secara konseptual:
Beban Mengajar merepresentasikan pembagian tugas mengajar yang akan menjadi dasar penyusunan SK dan kemudian direalisasikan melalui jadwal.
Dengan demikian:
Beban Mengajar
       ↓
WHAT
"Apa yang ditugaskan kepada guru?"
sedangkan:
Jadwal
       ↓
WHEN + WHERE
"Kapan dan di mana tugas tersebut dilaksanakan?"
Ini adalah pemisahan domain yang sangat penting.

9. Tahap 6 — Penetapan Wali Kelas
Secara paralel/terintegrasi dengan pembagian tugas:
Guru
   ↓
Wali Kelas
   ↓
Rombel
Contoh:
Siti
→ Wali Kelas
→ 8-A
Perlu dibedakan dari:
Siti
→ Matematika
→ 8-A
→ 4 JTM
Yang pertama adalah:
Penugasan Wali Kelas
Yang kedua:
Penugasan Mengajar
Keduanya dapat disahkan dalam rangkaian SK yang sama, tetapi secara domain bukan berarti keduanya harus menjadi satu record/entity.

10. Tahap 7 — Validasi Pembagian Tugas
Sebelum SK diterbitkan, pembagian tugas harus diperiksa.
Secara konseptual:
Pembagian Tugas
       │
       ├── Guru valid?
       ├── Rombel valid?
       ├── Mapel valid?
       ├── JTM valid?
       ├── Linearitas valid?
       ├── Wali kelas valid?
       └── Tidak ada konflik?
Di sinilah sistem seharusnya membantu rapat/administrasi, bukan sekadar menyediakan form input.

11. Validasi ini berbeda dari validasi Jadwal
Ini sangat penting.
Validasi Pembagian Tugas
Pertanyaannya:
"Apakah guru ini memang ditugaskan mengajar ini?"
Sedangkan:
Validasi Jadwal
Pertanyaannya:
"Apakah tugas tersebut dapat ditempatkan pada waktu dan tempat tertentu tanpa konflik?"
Jangan mencampurkan keduanya.

12. Tahap 8 — SK Pembagian Tugas
Setelah pembagian tugas dianggap valid:
Pembagian Tugas
       ↓
Pengesahan
       ↓
SK
SK menjadi bukti formal bahwa pembagian tugas tersebut telah ditetapkan.
Secara domain:
DRAFT
   ↓
VALIDATED
   ↓
APPROVED / DISAHKAN
   ↓
ACTIVE
Status persisnya belum saya tetapkan sebagai SSoT, karena perlu disesuaikan dengan mekanisme administrasi madrasah Anda.

13. Mengapa SK menjadi batas penting?
Karena setelah SK disahkan, sistem harus mengetahui:
Pembagian tugas mana yang menjadi dasar jadwal?
Contohnya:
SK 001
2026/2027 Semester 1

Guru A → Matematika → 8-A → 4 JTM
Guru B → IPA → 8-A → 4 JTM
Guru C → Bahasa Indonesia → 8-A → 4 JTM
Kemudian Jadwal bekerja terhadap pembagian tersebut.

14. Tahap 9 — Penyusunan Jadwal
Baru setelah pembagian tugas valid/disahkan:
SK
 ↓
Pembagian Tugas
 ↓
Jadwal
Jadwal menentukan:
Hari
+
Jam
+
Guru
+
Rombel
+
Mapel
+
Ruang/Fasilitas
Contoh:
Senin
08:00–08:40
8-A
Matematika
Ahmad
Ruang 8-A
Jadwal adalah realisasi operasional dari pembagian tugas.

15. Di sinilah Room/Fasilitas masuk
Ruang tidak menentukan:
siapa guru yang mengajar.
Ruang membantu menjawab:
di mana kegiatan tersebut berlangsung?
Karena itu:
Pembagian Tugas
       ↓
Jadwal
       ↓
Resource:
Ruang/Fasilitas
Dan constraint seperti:
Lab Komputer
→ hanya satu rombel pada satu waktu
berlaku pada penyusunan jadwal, bukan pada pembagian tugas.

16. Ketersediaan Guru juga masuk di tahap Jadwal
Misalnya:
Guru A
tidak tersedia
Senin 13:00–15:00
Guru A tetap bisa mempunyai:
Beban Mengajar:
Matematika 8-A
4 JTM
Tetapi ketika dibuat jadwal:
Senin 13:00
muncul constraint.
Jadi:
Beban Mengajar
= tugas

Availability
= constraint penempatan

Jadwal
= realisasi penempatan
Ini pemisahan yang sangat bersih.

17. Tahap 10 — Validasi Jadwal
Setelah jadwal disusun, baru dilakukan validasi constraint:
Jadwal
 │
 ├── Guru bentrok?
 ├── Rombel bentrok?
 ├── Ruang bentrok?
 ├── Fasilitas bentrok?
 ├── Guru tidak tersedia?
 ├── JTM melebihi assignment?
 ├── Interval overlap?
 └── constraint lainnya
Ini adalah area yang sedang diaudit dalam Phase 3.

18. Tahap 11 — Jadwal Diterbitkan
Setelah valid:
Draft Jadwal
     ↓
Validasi
     ↓
Publish
Barulah jadwal menjadi jadwal operasional.
Kemudian:
Jadwal
 ↓
Sesi KBM
 ↓
Presensi
 ↓
Nilai
Ini juga konsisten dengan prinsip yang sebelumnya Anda tetapkan bahwa konteks Guru Mapel/Pengajar muncul dari jadwal_pelajaran.

19. Seluruh lifecycle jika dibuat sebagai timeline
AWAL TAHUN AJARAN
        │
        ▼
┌─────────────────────────────┐
│ 1. KONTEKS TAHUN AJARAN     │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ 2. PPDB & KONDISI SISWA     │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ 3. PENETAPAN ROMBEL         │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ 4. KONDISI & KETERSEDIAAN   │
│    GURU                     │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ 5. ANALISIS KEBUTUHAN JTM   │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ 6. PEMBAGIAN TUGAS MENGAJAR │
│    Guru → Mapel → Rombel    │
│    → JTM                    │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ 7. PENETAPAN WALI KELAS     │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ 8. VALIDASI                  │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ 9. PENGESAHAN SK             │
└─────────────┬───────────────┘
              ↓
         SK BERLAKU
              │
              ▼
┌─────────────────────────────┐
│ 10. PENYUSUNAN JADWAL       │
│     Waktu + Guru + Rombel   │
│     + Ruang/Fasilitas       │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ 11. VALIDASI CONSTRAINT      │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ 12. PUBLISH JADWAL          │
└─────────────┬───────────────┘
              ↓
        REALISASI KBM

20. Sekarang kita cocokkan dengan route Anda
Kondisi sekarang:
/akun
   └── Penugasan Jabatan

/referensi
   ├── Tingkat
   ├── Mata Pelajaran
   └── Rombel

/akademik/jadwal/master-data
   ├── Beban Mengajar
   ├── Ruang/Fasilitas
   └── Ketersediaan Guru

/akademik/jadwal
   └── Penyusunan Jadwal
Jika dilihat dari database, ini mungkin terlihat logis.
Tetapi jika dilihat dari lifecycle bisnis, terdapat perbedaan:
REALITA

Rombel
  ↓
Pembagian Tugas
  ↓
SK
  ↓
Jadwal
sedangkan UI sekarang terasa seperti:
REFERENSI
  ↓
MASTER DATA
  ↓
JADWAL
Inilah akar persoalan UX yang mulai terlihat pada audit sebelumnya.

21. Namun jangan langsung mengubah menu
Ini keputusan penting.
Kita belum mengatakan:
/akademik/jadwal/master-data harus dihapus.
Kita juga belum mengatakan:
/referensi/rombel harus dipindahkan.
Yang pertama harus kita kunci adalah:
Domain ownership dan lifecycle.
Baru kemudian route mengikuti hasil tersebut.

22. Model konseptual yang saya sarankan untuk kita uji
Bukan final SSoT, tetapi model kandidat:
                   TAHUN AJARAN
                          │
                          ▼
                 KONDISI MADRASAH
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
        ROMBEL           GURU            MAPEL
          │               │               │
          └───────────────┼───────────────┘
                          ↓
                 PEMBAGIAN TUGAS
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
          MENGAJAR     WALI KELAS    TUGAS LAIN
            │             │
            └─────────────┼─────────────┘
                          ↓
                     VALIDASI
                          ↓
                         SK
                          ↓
                    JADWAL PLANNING
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
           WAKTU         GURU      RUANG/FASILITAS
             │            │            │
             └────────────┼────────────┘
                          ↓
                       JADWAL
                          ↓
                     REALISASI

23. Yang menarik: ini juga menyelesaikan beberapa kebingungan audit sebelumnya
Temuan audit:
Mengapa guru di JadwalForm bebas dipilih?
Sekarang pertanyaannya:
Apakah guru tersebut memiliki assignment dalam Pembagian Tugas?

Temuan:
Mengapa Beban Mengajar ada di Master Data?
Sekarang pertanyaannya:
Apakah "Beban Mengajar" sebenarnya bagian dari Pembagian Tugas?

Temuan:
Mengapa readiness indicator belum jelas?
Sekarang readiness dapat secara konseptual berarti:
Rombel siap
+
Guru siap
+
Pembagian tugas valid
+
SK sah
+
constraint jadwal tersedia
Tetapi formula readiness belum boleh kita tetapkan sebelum kontrak domain selesai.

24. Ada satu hal yang sangat penting: perubahan setelah SK
Realita lapangan tidak berhenti setelah SK.
Misalnya setelah SK:
Guru A mengundurkan diri
atau:
Rombel bertambah
atau:
Guru baru masuk
Maka kita tidak boleh sekadar:
Edit Beban Mengajar
seolah-olah tidak pernah ada SK.
Harus ada konsep:
SK berlaku
     ↓
perubahan diperlukan
     ↓
revisi/perubahan pembagian tugas
     ↓
validasi ulang
     ↓
SK/revisi
     ↓
dampak ke jadwal
Lifecycle perubahan ini belum kita kunci, tetapi sangat penting untuk dimasukkan dalam Contract Closure.

25. Ini akan menjadi kunci untuk mencegah kerusakan jadwal
Misalnya:
SK:
Guru A → Matematika → 8-A → 4 JTM
sudah menghasilkan jadwal:
Senin 08:00
Rabu 09:20
Kemudian Admin mengubah assignment menjadi:
Guru B → Matematika → 8-A → 4 JTM
Maka sistem harus tahu:
Apa yang terjadi terhadap jadwal lama?
Kemungkinan:
Assignment berubah
       ↓
Jadwal terdampak
       ↓
Jadwal harus divalidasi ulang
Ini alasan mengapa Beban Mengajar dan Jadwal tidak boleh dianggap dua CRUD independen.

26. Maka batas domain yang mulai terlihat
Secara konseptual:
Context 1 — Identity & Access
/akun
Mengatur:
siapa memiliki kewenangan apa

Context 2 — Academic Planning / Pembagian Tugas
Mengatur:
siapa mengajar apa
kepada siapa
berapa JTM
siapa wali kelas

Context 3 — Scheduling
Mengatur:
kapan
di mana
dengan resource apa
dengan constraint:
availability
facility
collision
routine
dll.

Context 4 — Academic Execution
Menggunakan jadwal:
Sesi KBM
Presensi
Nilai

27. Dan Referensi bukan domain bisnis utama
Ini juga penting.
Referensi lebih tepat dipandang sebagai:
supporting/master/reference context
bukan sebagai pusat workflow bisnis.
Misalnya:
Mata Pelajaran
Tingkat
referensi eksternal EMIS
digunakan oleh domain lain.
Sedangkan:
Rombel
meskipun menggunakan data referensi, memiliki lifecycle operasional yang lebih tinggi.

28. Keputusan yang sudah cukup kuat dari skenario Anda
Saya akan tandai secara hati-hati:
Konsep
Kesimpulan sementara
Tahun Ajaran
Context utama
Rombel
Input operasional awal tahun
Guru
Input SDM
Pembagian Tugas
Proses bisnis utama
Beban Mengajar
Kandidat representasi Pembagian Tugas
Wali Kelas
Penugasan kontekstual, bukan role /akun
SK
Hasil pengesahan Pembagian Tugas
Jadwal
Realisasi penempatan Pembagian Tugas
Ruang/Fasilitas
Resource/constraint Scheduling
Availability
Constraint Scheduling
/akun
Identity/Access
/referensi
Reference/Master
/akademik/jadwal
Scheduling


29. Yang belum boleh kita putuskan
Ada beberapa hal yang masih harus masuk Decision Register, terutama:
Apakah Beban Mengajar secara resmi adalah Pembagian Tugas Mengajar?
Apakah Jadwal hanya boleh dibuat dari assignment yang sudah disahkan?
Apakah SK menyimpan snapshot pembagian tugas atau hanya referensi?
Bagaimana revisi assignment setelah SK?
Bagaimana revisi SK memengaruhi jadwal yang sudah ada?
Team Teaching dihitung bagaimana terhadap JTM?
Sumber kebenaran JTM apa?
Bagaimana linearitas dihitung?
Apakah Wali Kelas masuk SK yang sama dengan pembagian tugas mengajar?
Siapa yang berwenang menyusun, memvalidasi, mengesahkan, dan merevisi?
Apakah /referensi tetap menjadi ownership Rombel atau hanya tempat administrasi UI?
Kapan status pembagian tugas dianggap "siap dijadwalkan"?

30. Kesimpulan
Dengan perspektif realita lapangan yang Anda berikan, model mental aplikasi sebaiknya bukan:
Master Data
     ↓
Buat Jadwal
tetapi:
KONDISI MADRASAH
       ↓
PEMBAGIAN TUGAS
       ↓
VALIDASI
       ↓
SK
       ↓
JADWAL
       ↓
REALISASI KBM
Dan prinsip DDD-nya menjadi sangat konkret:
Madrasah tidak "mengisi tabel Beban Mengajar lalu mengisi tabel Jadwal". Madrasah menetapkan pembagian tugas, mengesahkannya melalui SK, kemudian merealisasikan tugas tersebut dalam jadwal.
Itulah alur manusia yang harus dimodelkan oleh software.
Sedangkan tabel, controller, route, tab, dan form harus mengikuti alur tersebut — bukan memaksa operator memahami bagaimana database kita disusun.
Langkah berikut yang paling tepat adalah mengubah lifecycle di atas menjadi Domain Decision Matrix: setiap tahap kita tentukan aktor → input → keputusan → output → status → bukti/SK → dependency → route saat ini → entity/database saat ini → gap. Dari sana kita bisa mengetahui dengan presisi mana yang perlu dipertahankan, mana yang salah tempat, dan mana yang belum memiliki kontrak — tanpa menyentuh frontend terlebih dahulu.









Saya sudah meninjau dokumen **Admin Madrasah — EMIS GTK** yang Anda unggah. Untuk tahap ini saya **belum membuat Domain Decision**. Saya akan terlebih dahulu menetapkan apa yang benar-benar dapat kita ambil dari dokumen EMIS sebagai **evidence**, khususnya yang berkaitan dengan **Point 29** dan lifecycle Pembagian Tugas → Jadwal.

## 1. Temuan paling penting dari dokumen EMIS

Dokumen ini memberi bukti yang cukup kuat bahwa model operasional EMIS **tidak dimulai dari jadwal**. Ada urutan konfigurasi dan pemetaan yang mendahului jadwal.

Pada rumpun **Madrasah**, EMIS menjelaskan bahwa Admin mengelola profil, kurikulum, rombel, jadwal mengajar, dan linearitas. 

Urutan yang terdokumentasi adalah:

```text
Madrasah
   │
   ├── Mata Pelajaran / Kurikulum
   │
   ├── Pengaturan Jadwal
   │
   ├── Rombel
   │     └── Kompetensi
   │
   ├── Plotting Guru BK/TIK
   │
   └── Jadwal Mengajar
           │
           └── Pengecekan Linearitas
```

Ini jauh lebih penting daripada sekadar meniru struktur menu EMIS.

---

# 2. Point 29: Tugas Tambahan

Pada halaman 29, dokumen secara eksplisit menempatkan **Tugas Tambahan** sebagai data tersendiri yang diberikan kepada PTK. Contohnya:

* kepala laboratorium
* bendahara
* kepala perpustakaan
* pengawas sekolah
* dan tugas sejenis. 

Halaman sebelumnya menjelaskan fungsi Tugas Tambahan sebagai tugas resmi kedinasan **di luar jam mengajar utama**, yang dapat dikonversi menjadi ekuivalen JTM tambahan untuk memenuhi beban kerja mingguan guru. 

Dan halaman 31 menegaskan bahwa nilai JTM dapat menjadi ekuivalen berdasarkan kombinasi tugas tambahan. 

### Implikasi penting

Ini memberi kita bukti bahwa:

```text
BEBAN KERJA GURU
        │
        ├── JTM dari pembelajaran
        │
        └── ekuivalensi dari tugas tambahan
```

Jadi **JTM tidak boleh secara domain langsung disamakan dengan jumlah slot jadwal**.

Ini sangat penting untuk SIM Madrasah kita.

---

# 3. Bahkan lebih penting: EMIS membedakan “jadwal mengajar” dengan beban kerja

Pada halaman 19, EMIS mendefinisikan **Tambah Jadwal Mengajar** sebagai proses memasangkan:

> Guru Pengampu + Tingkat Kelas + Rombel + Mata Pelajaran + Slot Waktu Hari/Jam.

Dokumen kemudian secara eksplisit mengatakan bahwa **di sinilah JTM** dan validitas pengisian jadwal menentukan apakah guru diakui memenuhi beban kerja mingguan untuk TPG. 

Ini menghasilkan temuan yang sangat signifikan:

### EMIS menunjukkan dua konsep yang berbeda

**Konsep 1 — penugasan/beban kerja**

```text
PTK
 ↓
Tugas mengajar
 ↓
Mapel
 ↓
Rombel
 ↓
JTM
```

**Konsep 2 — realisasi jadwal**

```text
PTK
 ↓
Mapel
 ↓
Rombel
 ↓
Hari
 ↓
Jam
```

Namun EMIS menghubungkan keduanya karena **jadwal mengajar menjadi bukti realisasi JTM**.

Dengan kata lain:

> **Jadwal bukan sekadar kalender. Jadwal mempunyai konsekuensi terhadap pengakuan beban kerja PTK.**

Ini akan menjadi input penting bagi Domain Decision kita.

---

# 4. Rombel ternyata merupakan bagian penting dari perhitungan JTM

Ini juga mengubah pemahaman kita sebelumnya.

Dokumen menyebut menu **Rombel** digunakan sebagai acuan penyaringan yang akan dihitung JTM berdasarkan jumlah siswa, dengan ketentuan minimal 15 siswa untuk melanjutkan perhitungan JTM tertentu. 

Artinya:

```text
SISWA
  ↓
ROMBEL
  ↓
KEBUTUHAN / PERHITUNGAN JTM
  ↓
PEMBELAJARAN / JADWAL
```

Maka perubahan jumlah rombel setelah PPDB memang bukan sekadar perubahan master data.

**Perubahan rombel dapat berdampak terhadap beban kerja/JTM guru.**

Ini sangat konsisten dengan proses nyata yang Anda jelaskan sebelumnya.

---

# 5. Kurikulum dan Mapel juga merupakan upstream dependency

EMIS menyediakan:

### Mata Pelajaran

Menu ini digunakan untuk mengaktifkan dan mengelola mapel sesuai kurikulum serta melihat mapel berdasarkan **alokasi jam mengajar**. 

Bahkan ada:

* Generate Kurikulum
* Generate Kurikulum Tambahan
* Perbarui Mapel

dan dokumen menyatakan pembaruan dapat mengikuti perubahan nama mapel maupun bobot alokasi jam dari Kemenag. 

Kemudian **Pengaturan Jadwal** menentukan parameter:

* hari efektif;
* jam masuk;
* durasi JTM;
* maksimum jam mengajar per hari;
* model jadwal. 

Jadi jadwal memang bukan titik awal.

---

# 6. Ada bukti kuat bahwa “SK fisik → Jadwal” memang model yang diharapkan

Ini bagian yang sangat relevan dengan lifecycle yang Anda jelaskan.

Dokumen menyatakan bahwa setelah seluruh slot terisi, pengisian dilakukan **sesuai SK Pembagian Tugas Mengajar fisik**. 

Ini adalah bukti yang jauh lebih kuat daripada asumsi kita sebelumnya.

Secara konseptual:

```text
        KONDISI MADRASAH
               │
               ▼
        KURIKULUM + MAPEL
               │
               ▼
             ROMBEL
               │
               ▼
        PEMBAGIAN TUGAS
               │
               ▼
      SK PEMBAGIAN TUGAS
               │
               ▼
        JADWAL MENGAJAR
               │
               ▼
       CEK LINEARITAS
               │
               ▼
       PENGAKUAN BEBAN KERJA
```

**Jadwal tidak boleh menjadi tempat Admin “menentukan siapa mengajar apa” secara bebas jika domain Pembagian Tugas sudah ditetapkan melalui SK.**

Jadwal adalah tahap realisasi/penempatan dari pembagian tugas.

---

# 7. Linearitas juga berada setelah pemetaan jadwal

Dokumen memiliki menu khusus **Pengecekan Linearitas**, yang memvalidasi kesesuaian mapel yang diampu dengan bidang keahlian atau sertifikasi guru. 

Dokumen kemudian membedakan kondisi:

* PTK tidak memiliki linearitas;
* PTK sesuai dengan linearitas mapel yang diampu. 

Ini memperkuat temuan kita sebelumnya bahwa:

```text
PTK
 + kompetensi/sertifikasi
 + mapel
 + kurikulum
 → LINEARITAS
```

bukan sekadar:

```text
pegawai.mapel_sertifikasi
```

---

# 8. Guru BK/TIK juga membuktikan bahwa “beban mengajar” tidak selalu identik dengan slot jadwal biasa

EMIS mempunyai **Plotting Guru BK/TIK** secara terpisah. 

Khusus BK, dokumen menyatakan beban kerja dihitung berdasarkan rasio rombel yang dibina, dengan contoh minimal 3 rombel dapat dikonversi menjadi 24 JTM. 

Ini sangat penting secara DDD.

Berarti kita tidak boleh membuat domain universal:

```text
JTM = jumlah slot jadwal
```

karena ada bentuk beban kerja yang dihitung melalui **assignment/plotting berbasis rombel**, bukan sekadar slot KBM konvensional.

---

# 9. Non-SATMINKAL adalah bukti tambahan bahwa assignment memiliki lifecycle dan approval

Dokumen menjelaskan guru dapat memperoleh tambahan jam di madrasah lain melalui **Non SATMINKAL**. Setelah pengajuan, ada approval dari pihak madrasah tujuan dan Kepala Madrasah. Setelah disetujui, barulah guru dapat memperoleh JTM tambahan melalui jadwal mengajar. 

Bahkan jika belum disetujui:

> jadwal mengajar tambahan tidak aktif dan JTM tambahan tertahan/tidak dihitung dalam perhitungan tunjangan. 

Ini memberi pola domain yang sangat jelas:

```text
REQUEST
   ↓
APPROVAL
   ↓
ACTIVE ASSIGNMENT
   ↓
SCHEDULE
   ↓
JTM RECOGNITION
```

Bukan:

```text
buat jadwal
→ otomatis dianggap assignment sah
```

---

# 10. Temuan ini mengoreksi satu hal penting dari audit kita sebelumnya

Sebelumnya kita masih menggunakan pertanyaan:

> “Apakah Beban Mengajar merupakan assignment atau hanya reporting?”

Setelah membaca dokumen EMIS, **hipotesis bahwa assignment/beban mengajar merupakan upstream dari jadwal menjadi jauh lebih kuat.**

Tetapi saya belum akan menyebutnya **LOCKED** untuk SIM-Madrasah.

Karena dokumen EMIS adalah **referensi operasional sistem eksternal**, bukan otomatis SSoT internal kita.

Status yang tepat:

| Temuan                                                                   | Status                 |
| ------------------------------------------------------------------------ | ---------------------- |
| Jadwal mengajar memasangkan Guru–Mapel–Rombel–Hari/Jam                   | **EXPLICIT EMIS**      |
| Jadwal berkaitan dengan pengakuan JTM                                    | **EXPLICIT EMIS**      |
| Jadwal diisi sesuai SK Pembagian Tugas Mengajar fisik                    | **EXPLICIT EMIS**      |
| Rombel menjadi upstream perhitungan JTM tertentu                         | **EXPLICIT EMIS**      |
| Tugas tambahan dapat menghasilkan ekuivalensi JTM                        | **EXPLICIT EMIS**      |
| BK memiliki mekanisme beban berbeda                                      | **EXPLICIT EMIS**      |
| Linearitas divalidasi terhadap mapel yang diampu                         | **EXPLICIT EMIS**      |
| Pembagian tugas harus menjadi domain sebelum jadwal                      | **STRONGLY SUPPORTED** |
| `beban_mengajar` SIM-Madrasah harus identik dengan entitas EMIS tertentu | **NOT YET PROVEN**     |
| JTM `beban_mengajar` = EMIS `Alokasi Jam`                                | **NOT PROVEN**         |
| Team teaching dan pembagian JTM-nya                                      | **NOT PROVEN**         |

---

# 11. Konsekuensi langsung terhadap desain kita

Dengan evidence ini, saya **tidak menyarankan** kita melakukan:

```text
BebanMengajarTab
→ langsung dianggap "master data"
→ lalu JadwalForm bebas memilih guru/mapel/rombel
```

Model tersebut berpotensi bertentangan dengan lifecycle operasional yang sekarang sudah didukung bukti EMIS.

Lebih tepat kita teliti:

```text
TAHUN AJARAN
      ↓
KURIKULUM + MAPEL
      ↓
ROMBEL + SISWA
      ↓
PTK + KOMPETENSI
      ↓
KEBUTUHAN / PEMBAGIAN TUGAS
      ↓
SK PEMBAGIAN TUGAS
      ↓
JADWAL MENGAJAR
      ↓
LINEARITAS + VALIDASI JTM
      ↓
REALISASI KBM
```

Sedangkan:

```text
TUGAS TAMBAHAN
      └──────→ EKUIVALENSI BEBAN KERJA

GURU BK/TIK
      └──────→ PLOTTING KHUSUS

NON SATMINKAL
      └──────→ APPROVAL → JTM TAMBAHAN
```

---

## 12. Kesimpulan sebelum Domain Decision

**Saya setuju dengan keputusan Anda untuk menahan Domain Decision sampai dokumen EMIS ditelaah.**

Dan hasil telaah ini cukup material untuk mengubah cara kita melakukan Domain Modeling.

Yang sekarang sudah memiliki dasar kuat adalah:

> **Jadwal merupakan tahap realisasi dari penugasan/pembagian tugas yang telah ditetapkan, bukan sumber utama untuk menentukan pembagian tugas.**

Dokumen EMIS bahkan secara eksplisit menyebut jadwal diisi setelah slot memenuhi **SK Pembagian Tugas Mengajar fisik**. 

Namun kita **belum boleh langsung mengubah `Beban Mengajar = SK` secara final**, karena masih harus kita cocokkan dengan **SRS SIM-Madrasah dan data/struktur EMIS yang sebenarnya**, terutama:

1. apakah `Beban Mengajar` kita memang merepresentasikan **Pembagian Tugas Mengajar**;
2. bagaimana **SK Wali Kelas** berhubungan dengan SK Pembagian Tugas;
3. apakah JTM pada assignment merupakan **target**, sedangkan JTM pada jadwal merupakan **realisasi**;
4. bagaimana **Team Teaching** dihitung;
5. bagaimana **Tugas Tambahan** masuk ke total beban kerja;
6. bagaimana **Guru BK/TIK** dimodelkan;
7. bagaimana **Non-SATMINKAL** mempengaruhi assignment dan JTM;
8. dan yang paling penting untuk Point 29: **apa sebenarnya kontrak data EMIS yang harus kita ikuti, dan mana yang hanya perilaku UI EMIS.**

**Jadi langkah berikutnya bukan membuat Domain Decision Matrix.** Lebih tepat kita lakukan **EMIS → SRS → SIM-Madrasah Evidence Reconciliation** terlebih dahulu. Setelah itu baru Domain Decision Register dibuat berdasarkan evidence yang sudah terkunci.
