Berikut adalah *wireframe* teks yang merepresentasikan hasil akhir dari restrukturisasi arsitektur halaman tersebut.

*Wireframe* ini memvisualisasikan transisi dari "Dasbor Papan Petunjuk" (yang mengharuskan *user* mengklik tombol untuk pergi ke halaman lain) menjadi **"Meja Kerja Eksekutif" (Enterprise Workbench)** di mana Kepala Madrasah (Kamad) bisa langsung mengeksekusi tugasnya di halaman depan.

```text
====================================================================================================
≡   SIM Madrasah Terpadu                                                        [ 🔔 ] [ Profil ▼ ]
====================================================================================================

[ 🏷️ ZONA 1: PITA IDENTITAS & FILTER KONTEKS ] 
👤 Drs. H. Ahmad Dahlan, M.Pd. | Akses: Kamad, Guru |             📅 TA 2025/2026 - Semester Ganjil
  [ Semua Pekerjaan ]   [ Pengajaran ]   [ Manajerial & Ops ]
----------------------------------------------------------------------------------------------------

[ ⚡ ZONA 2: AKSI CEPAT (Pindah ke atas, horizontal memanjang) ] 
  [ + Ajukan Izin Pegawai ]   [ + Input Nilai Harian ]   [ + Buat Pengumuman ]   [ + Delegasikan Tugas ]
----------------------------------------------------------------------------------------------------

[ 📊 ZONA 3: KARTU METRIK EKSEKUTIF (Pertahankan desain elegan Anda saat ini) ]
+-------------------------+-------------------------+-------------------------+--------------------+
| 📥 KOTAK PERSETUJUAN    | 🕒 KEHADIRAN HARI INI   | ⚠️ SISWA PANTAUAN AI    | 👥 TOTAL SISWA AKTIF|
|                         |                         |                         |                    |
| 3 Perlu Tindakan        | 0% Tepat Waktu          | 13 Butuh Bimbingan      | 29 Terdaftar       |
+-------------------------+-------------------------+-------------------------+--------------------+

====================================================================================================
[ 🖥️ ZONA 4: WORKSPACE UTAMA (Grid Asimetris 70/30) ]

+------------------------------------------------------+-------------------------------------------+
| KOLOM KIRI (70% - Area Eksekusi Kamad & Guru)        | KOLOM KANAN (30% - Area Informasi)        |
+------------------------------------------------------+-------------------------------------------+
|                                                      |                                           |
| [ 📋 ANTREAN PERSETUJUAN DOKUMEN ]                   | [ 📢 PENGUMUMAN MADRASAH ]                |
| (Tabel ini menggantikan blok "Tugas Prioritas" yg    | 20 September 2026                         |
| lama. Kamad bisa langsung approve dari sini)         | Rapat Paripurna Persiapan UTS...          |
|                                                      | Mohon seluruh dewan guru membawa...       |
| JENIS BERKAS | PEMOHON       | AKSI                  | [ Baca Selengkapnya -> ]                  |
|--------------|---------------|-----------------------|                                           |
| Mutasi Siswa | sw_05 (7-A)   | [ ✅ Setujui ] [ ❌ ]  |-------------------------------------------|
| Pindah Rombel| sw_31 (8-B)   | [ ✅ Setujui ] [ ❌ ]  |                                           |
| Izin PTK     | Siti Nurhaliza| [ ✅ Setujui ] [ ❌ ]  | [ 📈 TREN KEHADIRAN SISWA ]               |
|                                                      | (Pindahkan grafik garis ke sidebar ini,   |
|------------------------------------------------------|  atur agar tingginya pas dan rapi)        |
|                                                      |                                           |
| [ 📅 JADWAL & JURNAL SESI MENGAJAR HARI INI ]        |                                           |
| *Scrollable Table (Tinggi maksimal: 400px)*          |                                           |
|                                                      |                                           |
| WAKTU  | KELAS | MATA PELAJARAN     | STATUS PRESENSI|                                           |
|--------|-------|--------------------|----------------|                                           |
| 08:00  | 7-A   | Matematika         | 🔴 Kosong      |                                           |
| 09:30  | 8-B   | Bahasa Indonesia   | 🔴 Kosong      |                                           |
| ... (scroll down)                                    |                                           |
|                                                      |                                           |
+------------------------------------------------------+-------------------------------------------+
====================================================================================================

```

### 🧠 Apa yang Berubah Secara Signifikan di Wireframe Ini?

1. **Kemusnahan "Blok Peringatan":** Blok raksasa *"Ada 3 berkas (surat/mutasi) menunggu pengesahan Anda"* benar-benar dihilangkan. Sebagai gantinya, **Tabel Antrean Persetujuan Dokumen** langsung muncul di kolom kiri. Ini menghemat 1 kali klik bagi Kepala Madrasah.
2. **Pemadatan Ruang Kosong:** Pengumuman madrasah (yang sebelumnya ditaruh di pojok kanan bawah yang canggung) kini dinaikkan posisinya ke kolom kanan atas (30%). Ini menciptakan pilar informasi (*sidebar*) yang sangat solid dan memanfaatkan ruang layar lebar secara optimal.
3. **Aksi Cepat Menjadi Universal:** Tombol-tombol Aksi Cepat tidak lagi menempel pada kartu tugas tertentu. Mereka diletakkan di atas (Zona 2) sebagai kendali (*command center*) yang horizontal. Nanti, visibilitas tombol-tombol ini (`[+ Input Nilai Harian]`, `[+ Buat Pengumuman]`) akan bersembunyi/muncul secara dinamis tergantung *Tab* apa yang sedang diklik Kamad.

### 💻 Panduan Terjemahan Kode untuk Developer Anda

Untuk mewujudkan struktur di atas menggunakan Tailwind CSS yang sudah Anda gunakan, struktur *container* pembungkus di `app/page.tsx` akan terlihat seperti ini:

```tsx
<div className="flex flex-col space-y-6 p-6">
  {/* ZONA 1 & 2 */}
  <IdentityStrip />
  <FilterTabs />
  <QuickActionsHorizontal />

  {/* ZONA 3 */}
  <MetricCards className="grid grid-cols-4 gap-4" />

  {/* ZONA 4: The 70/30 Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
    
    {/* Kolom Kiri: 70% */}
    <div className="lg:col-span-8 flex flex-col space-y-6">
      <TabelPersetujuanKamad />
      
      {/* Container dengan max-height agar halaman tidak melar ke bawah */}
      <div className="max-h-[400px] overflow-y-auto bg-white rounded-lg border shadow-sm">
         <TabelJadwalMengajar />
      </div>
    </div>

    {/* Kolom Kanan: 30% */}
    <div className="lg:col-span-4 flex flex-col space-y-6 sticky top-6">
      <WidgetPengumuman />
      <WidgetGrafikTren />
    </div>

  </div>
</div>

```

Ini adalah visualisasi keajaiban dari arsitektur *Role-Tailored Workspace* yang dipadukan dengan *State Management*.

Ketika Drs. H. Ahmad Dahlan, M.Pd. (yang menjabat sebagai Kamad sekaligus Guru) mengeklik Tab **[ Pengajaran ]**, layar akan mengalami *morphing* (perubahan wujud) secara instan. Semua beban birokrasi dan manajerial dilenyapkan dari pandangannya, membiarkan beliau fokus 100% pada tugas akademiknya sebagai seorang pendidik.

Berikut adalah *wireframe* teks untuk **Tab Pengajaran**:

```text
====================================================================================================
≡   SIM Madrasah Terpadu                                                        [ 🔔 ] [ Profil ▼ ]
====================================================================================================

[ 🏷️ ZONA 1: PITA IDENTITAS & FILTER KONTEKS ] 
👤 Drs. H. Ahmad Dahlan, M.Pd. | Akses: Kamad, Guru |             📅 TA 2025/2026 - Semester Ganjil
  [ Semua Pekerjaan ]   [ ✓ Pengajaran ]   [ Manajerial & Ops ]
----------------------------------------------------------------------------------------------------

[ ⚡ ZONA 2: AKSI CEPAT (Berubah wujud menyesuaikan konteks akademik) ] 
  [ + Ajukan Izin Pegawai ]   [ + Input Nilai Harian ]   [ + Catat Kasus Siswa ]
----------------------------------------------------------------------------------------------------

[ 📊 ZONA 3: KARTU METRIK AKADEMIK (Berubah wujud dari Metrik Eksekutif ke Metrik Guru) ]
+-------------------------+-------------------------+-------------------------+--------------------+
| 📚 JTM MINGGU INI       | 👥 PRESENSI KELAS BINAAN| ⚠️ SISWA BERISIKO       | 📝 TUGAS MENUNGGU  |
|                         |                         |                         |                    |
| 12 / 24 Jam             | 95% Hadir               | 2 Butuh Perhatian       | 5 Belum Dinilai    |
+-------------------------+-------------------------+-------------------------+--------------------+

====================================================================================================
[ 🖥️ ZONA 4: WORKSPACE UTAMA (Grid Asimetris 70/30) ]

+------------------------------------------------------+-------------------------------------------+
| KOLOM KIRI (70% - Fokus Mengajar & Akademik)         | KOLOM KANAN (30% - Area Informasi)        |
+------------------------------------------------------+-------------------------------------------+
|                                                      |                                           |
| [ 📅 JADWAL & JURNAL SESI MENGAJAR HARI INI ]        | [ 📢 PENGUMUMAN MADRASAH ]                |
| (Tabel melebar lega tanpa gangguan Kotak Persetujuan)| 20 September 2026                         |
|                                                      | Rapat Paripurna Persiapan UTS...          |
| WAKTU  | KELAS | MATA PELAJARAN     | STATUS PRESENSI| Mohon seluruh dewan guru membawa...       |
|--------|-------|--------------------|----------------| [ Baca Selengkapnya -> ]                  |
| 08:00  | 7-A   | Matematika         | 🔴 Kosong      |                                           |
| 09:30  | 8-B   | Matematika Lanjut  | 🔴 Kosong      |-------------------------------------------|
| 11:00  | 9-A   | Matematika         | 🟢 Selesai     |                                           |
|                                                      | [ 🎯 PROGRESS TARGET KURIKULUM ]          |
|                                                      | (Grafik Tren Eksekutif diganti dengan     |
|------------------------------------------------------|  pengingat progres bab pelajaran guru)    |
|                                                      |                                           |
| [ 🏆 DAFTAR SISWA KELAS BINAAN (Jika Wali Kelas) ]   | Bab 3: Aljabar (Kelas 7) - 80% Selesai    |
| (Widget tambahan yang hanya muncul di tab ini)       | Bab 4: Geometri (Kelas 8) - 50% Selesai   |
| Ahmad Azza (7-A) - 🔴 Tidak Hadir (Sakit)            |                                           |
| Siti Aisyah (7-A) - 🟡 Ijin                          |                                           |
|                                                      |                                           |
+------------------------------------------------------+-------------------------------------------+
====================================================================================================

```

### 🧠 Analisis Perubahan (Mengapa Ini Sangat Nyaman Digunakan)

1. **Metrik yang Relevan (Zona 3):** Kepala Madrasah tidak lagi memikirkan "Berapa total siswa aktif di sekolah?" saat berada di tab ini. Matanya langsung disuguhkan data yang penting bagi seorang guru: *"Apakah Jam Tatap Muka (JTM) saya minggu ini sudah mencukupi syarat SIMPATIKA?"* dan *"Ada berapa tugas siswa yang belum saya nilai?"*
2. **Aksi Cepat yang Tajam (Zona 2):** Tombol `[+ Buat Pengumuman]` dan `[+ Delegasikan Tugas]` disembunyikan. Sebagai gantinya, muncul tombol operasional guru seperti `[+ Catat Kasus Siswa]` (jika ada siswa yang bermasalah di kelas).
3. **Visual Silence (Ketenangan Visual):** Pada Kolom Kiri (Zona 4), Kotak Persetujuan Mutasi yang tegang itu lenyap. Ruang tersebut sepenuhnya diserahkan kepada **Tabel Jadwal Mengajar**. Ini memberikan efek psikologis *Cognitive Relief* (kelegaan kognitif), di mana pengguna merasa tugasnya lebih ringan dan terfokus.

### 💻 Cara Kerja di Balik Layar (Developer View)

Dari sisi *programmer*, kode ini sangat elegan. Mereka tidak membuat tiga halaman web yang berbeda, melainkan hanya menggunakan struktur percabangan sederhana (*conditional rendering*) di dalam satu *file*:

```tsx
{/* Di dalam Zona 3: Metrik */}
{activeTab === 'MANAGERIAL' && <MetrikEksekutif />}
{activeTab === 'PENGAJARAN' && <MetrikGuru />}
{(activeTab === 'SEMUA') && <MetrikGabungan />}

{/* Di dalam Zona 4: Kolom Kiri */}
{(activeTab === 'MANAGERIAL' || activeTab === 'SEMUA') && (
   <TabelPersetujuanKamad />
)}

{(activeTab === 'PENGAJARAN' || activeTab === 'SEMUA') && (
   <TabelJadwalMengajar />
   <DaftarSiswaBinaan />
)}

```

Dengan desain ini, Kepala Madrasah bisa "berganti topi" dari seorang Manajer Manusia menjadi Pendidik hanya dengan menekan satu tombol Tab, tanpa *loading* halaman sama sekali. Ini adalah standar sejati dari *Enterprise Dashboard UX*.

---

Untuk melengkapi trilogi arsitektur *Role-Tailored Workspace* ini, mari kita bedah wujud layar ketika Kepala Madrasah (Drs. H. Ahmad Dahlan, M.Pd.) mengeklik Tab **[ Manajerial & Ops ]**.

Berdasarkan *Software Requirements Specification (SRS) v2.0* yang Anda jadikan *Single Source of Truth*, tugas manajerial Kamad sangat spesifik: melakukan persetujuan akhir ( *Approval* ) untuk mutasi dan pindah rombel, memantau kedisiplinan JTM guru, serta melihat laporan peringatan dini dari AI.

Di tab ini, layar akan membuang semua urusan jadwal mengajar pribadinya, dan berubah 100% menjadi **Ruang Kendali Eksekutif (Executive Control Room)**.

Berikut adalah *wireframe* teks untuk **Tab Manajerial & Ops**:

```text
====================================================================================================
≡   SIM Madrasah Terpadu                                                        [ 🔔 ] [ Profil ▼ ]
====================================================================================================

[ 🏷️ ZONA 1: PITA IDENTITAS & FILTER KONTEKS ] 
👤 Drs. H. Ahmad Dahlan, M.Pd. | Akses: Kamad, Guru | 📅 TA 2025/2026 - Semester Ganjil
  [ Semua Pekerjaan ]   [ Pengajaran ]   [ ✓ Manajerial & Ops ]
----------------------------------------------------------------------------------------------------

[ ⚡ ZONA 2: AKSI CEPAT (Berubah wujud menyesuaikan konteks eksekutif) ] 
  [ + Pengumuman ]   [ 📝 Izin Pegawai ]   [ + Delegasikan Tugas ]
----------------------------------------------------------------------------------------------------

[ 📊 ZONA 3: KARTU METRIK EKSEKUTIF (Sesuai dengan Wewenang di SRS) ]
+-------------------------+-------------------------+-------------------------+--------------------+
| 📥 KOTAK PERSETUJUAN    | 👥 KEHADIRAN MADRASAH   | 🚨 ANOMALI KEDISIPLINAN | ⚠️ PREDIKSI AI (DROP|
|                         |                         |                         |    OUT)            |
| 3 Menunggu Tanda Tangan | 92% (Normal)            | 2 Guru Perlu Ditegur    | 5 Siswa Berisiko   |
+-------------------------+-------------------------+-------------------------+--------------------+

====================================================================================================
[ 🖥️ ZONA 4: WORKSPACE UTAMA (Grid Asimetris 70/30) ]

+------------------------------------------------------+-------------------------------------------+
| KOLOM KIRI (70% - Area Eksekusi Eksekutif)           | KOLOM KANAN (30% - Area Wawasan & AI)     |
+------------------------------------------------------+-------------------------------------------+
|                                                      |                                           |
| [ 📋 ANTREAN PERSETUJUAN / E-SIGNATURE ]             | [ 📈 TREN KEHADIRAN SISWA ]               |
| (Area utama Kamad mengeksekusi dokumen mutasi/pindah)|                                           |
|                                                      |    /\_/\        (Grafik semester          |
| JENIS BERKAS | PEMOHON       | AKSI                   |   /     \        skala madrasah)          |
|--------------|---------------|-----------------------|                                           |
| Mutasi Keluar| Operator Kes. | [ ✅ Setujui ] [ ❌ ]  |-------------------------------------------|
| Pindah Rombel| Operator Kes. | [ ✅ Setujui ] [ ❌ ]  |                                           |
| Izin PTK     | Siti Nurhaliza| [ ✅ Setujui ] [ ❌ ]  | [ 🤖 WAWASAN AI: PERINGATAN DINI ]        |
|                                                      | (Sesuai Bab 5 SRS: Deteksi siswa berisiko)|
|------------------------------------------------------|                                           |
|                                                      | ⚠️ Ahmad Azza (7-A)                       |
| [ 🚨 REKAP KEDISIPLINAN GURU (Bulan Ini) ]           | Indikasi: Alpa > 5x beruntun.             |
| (Sesuai Bab 10 Poin 15: Memantau guru yang sering    | [ Delegasikan ke BK -> ]                  |
|  digantikan mendadak atau JTM kurang)                |                                           |
|                                                      | ⚠️ Maya Anggraini (Mapel)                 |
| NAMA GURU       | STATUS               | AKSI        | Indikasi: JTM kurang dari standar.        |
|-----------------|----------------------|-------------| [ Tinjau Beban Mengajar -> ]              |
| Dr. Syaiful R.  | 3x Diganti Mendadak  | [ ✉️ Tegur ] |                                           |
| Bambang S.      | JTM Underload (18/24)| [ 🔍 Cek ]   |                                           |
|                                                      |                                           |
+------------------------------------------------------+-------------------------------------------+
====================================================================================================

```

### 🧠 Penyelarasan dengan SSoT (SRS v2.0)

Desain ini bukan sekadar *mockup* cantik, melainkan terjemahan langsung dari arsitektur bisnis ( *Business Rules* ) yang tertulis di SRS Anda:

1. **Aksi Cepat "Catat Izin Pegawai":** Sesuai aturan Bab 10 poin 14 SRS, pelaporan izin guru (H-1 atau darurat) *tidak diinput oleh guru itu sendiri*, melainkan dicatat oleh Admin atau Kepala Madrasah. Tombol `[ 📝 Catat Izin Pegawai ]` langsung dimunculkan di Zona 2 agar Kamad bisa cepat memproses laporan WA dari bawahannya.
2. **Tabel Rekap Kedisiplinan Guru:** Di SRS Bab 10 poin 15, disebutkan bahwa sesi berstatus *"Digantikan Mendadak ≥3 kali/bulan"* akan memicu *flag* otomatis di dashboard Kamad dan menyiapkan draf Surat Teguran. Tabel di kiri bawah inilah tempat fitur tersebut hidup.
3. **Wawasan AI (Kolom Kanan):** Sesuai SRS Bab 5 (Modul Kecerdasan Buatan), sistem dirancang memiliki "Deteksi Dini Siswa Berisiko" (berdasarkan pola absensi/nilai). Menaruh modul peringatan AI di sidebar (30%) adalah cara sempurna menerapkan *Human-in-the-loop*. Kamad bisa melihat peringatannya dan menekan tombol `[ Delegasikan ke BK -> ]` tanpa meninggalkan Beranda.
4. **Tabel Antrean Persetujuan:** SRS secara tegas menyebutkan bahwa mutasi masuk/keluar dan pindah rombel lintas tingkat wajib disetujui langsung via akun Kepala Madrasah. Inilah *workbench* utamanya.

### 💻 Pesan Implementasi untuk Developer

Dengan pola ini, file orkestrator (`app/page.tsx`) Anda menjadi sangat bersih dan *declarative*. *Developer* hanya perlu menyusun struktur kondisi seperti ini:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
  
  {/* KOLOM KIRI (70%) */}
  <div className="lg:col-span-8 flex flex-col space-y-6">
    
    {/* Muncul di tab Manajerial ATAU Semua (Hanya untuk yang punya hak Approve) */}
    <PermissionGuard require="APPROVE_DOKUMEN">
      {(activeTab === 'MANAGERIAL' || activeTab === 'ALL') && (
        <>
          <TabelPersetujuanKamad />
          <TabelKedisiplinanGuru />
        </>
      )}
    </PermissionGuard>

    {/* Muncul di tab Pengajaran ATAU Semua (Hanya untuk yang punya hak Mengajar) */}
    <PermissionGuard require="VIEW_JADWAL_PRIBADI">
      {(activeTab === 'TEACHING' || activeTab === 'ALL') && (
        <TabelJadwalMengajar />
      )}
    </PermissionGuard>

  </div>

  {/* KOLOM KANAN (30%) */}
  <div className="lg:col-span-4 flex flex-col space-y-6 sticky top-6">
    
    {/* Pengumuman selalu tampil */}
    <WidgetPengumuman />
    
    <PermissionGuard require="VIEW_EXECUTIVE_DASHBOARD">
      {(activeTab === 'MANAGERIAL' || activeTab === 'ALL') && (
        <>
          <WidgetGrafikKehadiran />
          <WidgetWawasanAI />
        </>
      )}
    </PermissionGuard>

  </div>
</div>

```

**Kesimpulan Eksekutif:**
Melalui 3 skenario tab ini (`Semua`, `Pengajaran`, `Manajerial`), kita telah membuktikan bahwa satu URL Beranda (`/`) dapat melayani kebutuhan operasional harian yang sangat kompleks tanpa membuat pengguna merasa tersesat atau kelelahan kognitif. Apakah tim Anda sudah siap mengeksekusi *refactoring* ini?