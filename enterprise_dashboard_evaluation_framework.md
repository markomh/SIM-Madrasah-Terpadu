# Enterprise Dashboard Evaluation Framework
**Metodologi Evaluasi UI/UX & Frontend Platform Pendidikan Indonesia**  
*(Madrasah, School ERP, SIS, LMS, University ERP)*  

**Otoritas Evaluasi**: Senior Enterprise Product Designer, UX Researcher, Information Architect, Staff Frontend Engineer, HCI Specialist  
**Status**: Kerangka Kerja Evaluasi Resmi (*Official Evaluation Methodology*) — **Siap Produksi**  

---

# BAGIAN I: SEVERITY CLASSIFICATION & MATRIX BENCHMARK

### Skala Keparahan (*Severity Classification*)
1. **Critical (P0)**: Menghambat penyelesaian tugas utama pengguna, menyebabkan kehilangan data, merusak aksesibilitas dasar (WCAG A fail), atau melanggar keharmonisan hak akses (RBAC violation).
2. **Major (P1)**: Menyebabkan kebingungan kognitif yang signifikan, inkonsistensi terminologi antar-modul, pergeseran visual (*layout shift*), atau menghambat efisiensi alur kerja tanpa pemulihan mandiri yang jelas.
3. **Moderate (P2)**: Menyebabkan ketidaknyamanan visual, inkonsistensi ukuran font/spasi, atau kegagalan minor pada mikro-interaksi yang tidak menghentikan operasional.
4. **Minor (P3)**: Penyimpangan estetika kecil, ketidaksempurnaan alignment 1-2px, atau saran penyempurnaan teks pembantu.

---

# BAGIAN II: EVALUASI 24 DOMAIN UI

---

## 1. App Shell

1. **Business Objective**: Menjaga identitas platform, integritas tenant/lembaga, dan konsistensi konteks operasional utama di seluruh modul.
2. **UX Objective**: Memastikan antarmuka aplikasi terstruktur dengan jelas tanpa fragmentasi visual saat berpindah halaman.
3. **Enterprise Best Practice**: Menggunakan layout bertingkat fixed/sticky dengan pembagian wilayah visual yang tegas antara Shell Header, Navigation Sidebar, dan Main Canvas.
4. **Evaluation Criteria**: Stabilitas struktur visual, penanganan loading state saat perpindahan rute, kebersihan batas area visual.
5. **Measurable Checklist**:
   - [ ] Shell tidak mengalami *Cumulative Layout Shift* (CLS < 0.1) saat memuat halaman baru.
   - [ ] Pembagian wilayah visual tertutup rapat tanpa celah piksel acak.
   - [ ] Terintegrasi langsung dengan `ThemeContext` dan `AuthContext` terpusat.
6. **Common Anti-pattern**: Memuat ulang (*full page re-render*) seluruh App Shell saat navigasi antar-modul.
7. **Severity Classification**: **Critical (P0)** jika navigasi memicu reload halaman secara penuh.
8. **Improvement Recommendation**: Gunakan Next.js Layout / React Persistent Shell Component.
9. **Success Indicator**: Zero full-page reload saat perpindahan navigasi internal.
10. **Scoring Rubric (0–5)**:
    - **0**: Tidak ada struktur shell; setiap halaman render ulang dari nol.
    - **1-2**: Shell tidak stabil, mengalami CLS tinggi saat berpindah modul.
    - **3-4**: Shell stabil, namun terdapat fragmentasi kecil pada border atau padding.
    - **5**: Persistent Shell sempurna, zero CLS, terintegrasi utuh dengan Context Store.

---

## 2. Navbar

1. **Business Objective**: Memfasilitasi perpindahan konteks lembaga/tahun ajaran dan eksposur utilitas global enterprise.
2. **UX Objective**: Memberikan akses instan ke switch role, pencarian global (`Cmd+K`), dan profil tanpa mengganggu fokus kerja.
3. **Enterprise Best Practice**: Top bar horizontal (`h-14` / `h-16`) dengan alignment tegas (Logo & Switcher di kiri, Utilities di kanan).
4. **Evaluation Criteria**: Kecepatan akses fungsi switcher, kejelasan indikator role/tahun aktif, prediktabilitas dropdown.
5. **Measurable Checklist**:
   - [ ] Menampilkan konteks Tahun Ajaran & Semester aktif secara eksplisit.
   - [ ] Memiliki Command Search Palette pemicu `Cmd+K` / `Ctrl+K`.
   - [ ] Menampilkan indikator peran aktif pengguna saat ini.
6. **Common Anti-pattern**: Menyembunyikan selector Tahun Ajaran di dalam menu pengaturan yang dalam.
7. **Severity Classification**: **Major (P1)** jika pengguna tidak bisa melihat Tahun Ajaran aktif saat ini.
8. **Improvement Recommendation**: Pindahkan selector Tahun Ajaran & Semester langsung ke Top Bar Navbar.
9. **Success Indicator**: Pengguna dapat mengidentifikasi Tahun Ajaran aktif dalam < 1 detik.
10. **Scoring Rubric (0–5)**:
    - **0**: Navbar tidak ada atau tidak memiliki utilitas operasional.
    - **1-2**: Konteks Tahun Ajaran/Role tersembunyi; tidak ada utilitas pencarian.
    - **3-4**: Navbar memuat switcher namun belum memiliki pintasan `Cmd+K`.
    - **5**: Navbar enterprise lengkap dengan Context Switcher instan dan Command Palette.

---

## 3. Sidebar

1. **Business Objective**: Navigasi hirarkis utama untuk mengakses seluruh modul operasional madrasah (Kesiswaan, Akademik, Kepegawaian, Keuangan, Wawasan, Referensi).
2. **UX Objective**: Mengurangi beban memori pengguna melalui pemetaan grup navigasi yang logis dan konsisten.
3. **Enterprise Best Practice**: Sidebar vertikal (`w-64` / `w-16`) berbasis accordion 2-tingkat dengan pengelompokan huruf kapital (`UPPERCASE`).
4. **Evaluation Criteria**: Kesesuaian pengelompokan modul, kejelasan indikator state aktif, efisiensi fitur collapse.
5. **Measurable Checklist**:
   - [ ] Mengelompokkan modul dengan label UPPERCASE deskriptif.
   - [ ] Item aktif ditandai secara visual (`bg-primary text-white`).
   - [ ] Menyembunyikan modul yang tidak diizinkan oleh peran pengguna (RBAC filtering).
6. **Common Anti-pattern**: Menampilkan seluruh menu dalam keadaan disembunyikan/disabled alih-alih di-unmount, atau kedalaman menu > 2 level.
7. **Severity Classification**: **Critical (P0)** jika pengguna dapat mengklik menu yang tidak sesuai dengan RBAC-nya.
8. **Improvement Recommendation**: Terapkan penyaringan RBAC di tingkat definisi `navigation` array sebelum render.
9. **Success Indicator**: 100% item navigasi yang tampil relevan dengan hak akses pengguna aktif.
10. **Scoring Rubric (0–5)**:
    - **0**: Navigasi acak tanpa pengelompokan visual.
    - **1-2**: Kedalaman menu > 2 level; item tanpa izin tetap tampil (disabled).
    - **3-4**: Pengelompokan rapi, namun state aktif kadang tidak sinkron dengan sub-rute.
    - **5**: Hirarki navigasi 2-tingkat sempurna, RBAC filtering 100% akurat.

---

## 4. Topbar

1. **Business Objective**: Menyediakan area utilitas cepat spesifik rute halaman.
2. **UX Objective**: Mempersepat akses tombol aksi sekunder tanpa memakan area kerja utama.
3. **Enterprise Best Practice**: Sub-bar horizontal tipis (`h-10`) yang terintegrasi di bawah Navbar atau di atas Page Header.
4. **Evaluation Criteria**: Efisiensi spasi, kejernihan tombol utilitas.
5. **Measurable Checklist**:
   - [ ] Bebas dari tombol aksi utama yang seharusnya berada di Page Header.
   - [ ] Memiliki alignment vertikal presisi dengan elemen sekitarnya.
6. **Common Anti-pattern**: Menduplikasi tombol dari Page Header ke Topbar.
7. **Severity Classification**: **Minor (P3)**.
8. **Improvement Recommendation**: Konsolidasikan utilitas halaman hanya pada satu tempat resmi.
9. **Success Indicator**: Zero redundansi tombol antara Topbar dan Page Header.
10. **Scoring Rubric (0–5)**:
    - **0**: Topbar berantakan dan membingungkan.
    - **3**: Topbar berfungsi namun terjadi sedikit redundansi tombol.
    - **5**: Topbar bersih dan beroperasi sesuai peruntukannya.

---

## 5. Breadcrumb

1. **Business Objective**: Mencegah pengguna tersesat dalam struktur hirarki data yang dalam (misal: `Kesiswaan` / `Data Siswa` / `Detail Siswa`).
2. **UX Objective**: Memberikan kepastian posisi pengguna (*spatial orientation*) dan akses sekali-klik ke halaman induk.
3. **Enterprise Best Practice**: Navigasi jejak baris horizontal dengan pemisah chevron (`ChevronRight`), di mana item aktif adalah teks biasa non-klik.
4. **Evaluation Criteria**: Akurasi jejak hirarki, keterklikan item induk, penanganan teks panjang.
5. **Measurable Checklist**:
   - [ ] Menggunakan pembungkus `<nav aria-label="Breadcrumb">`.
   - [ ] Item terakhir (halaman aktif) memiliki `aria-current="page"`.
   - [ ] Mengondensasi langkah menengah menjadi ellipsis (`...`) pada layar sempit.
6. **Common Anti-pattern**: Item halaman aktif dapat diklik yang memicu reload halaman yang sama.
7. **Severity Classification**: **Moderate (P2)**.
8. **Improvement Recommendation**: Setel item terakhir sebagai span non-interaktif dengan warna `text-ink font-semibold`.
9. **Success Indicator**: Pengguna dapat kembali ke modul induk dalam 1 kali klik.
10. **Scoring Rubric (0–5)**:
    - **0**: Tidak ada breadcrumb pada halaman hirarki dalam.
    - **1-2**: Breadcrumb tidak akurat dengan rute URL.
    - **3-4**: Breadcrumb akurat namun tidak memiliki visual ellipsis pada mobile.
    - **5**: Breadcrumb ARIA-compliant sempurna dengan responsive truncation.

---

## 6. Workspace

1. **Business Objective**: Area kerja utama tempat pengguna menyelesaikan tugas operasional madrasah.
2. **UX Objective**: Memaksimalkan fokus dan kenyamanan visual saat membaca atau menginput data berdurasi panjang.
3. **Enterprise Best Practice**: Main canvas dengan padding konsisten (`p-4 sm:p-6 lg:p-8`), latar belakang `bg-paper`, dan max-width constraint.
4. **Evaluation Criteria**: Kerapian visual, keterbacaan data, responsivitas grid layout.
5. **Measurable Checklist**:
   - [ ] Menggunakan tag `<main id="main-content">`.
   - [ ] Batas lebar maksimum `max-w-7xl` untuk form/dashboard, atau `w-full` untuk tabel luas.
   - [ ] Memiliki tombol hidden "Skip to main content" untuk pengguna keyboard.
6. **Common Anti-pattern**: Membiarkan konten melebar tanpa batas pada monitor 4K yang menyebabkan baris teks terlalu panjang.
7. **Severity Classification**: **Major (P1)** jika keterbacaan terganggu pada layar besar.
8. **Improvement Recommendation**: Bungkus kontainer workspace dengan `max-w-7xl mx-auto`.
9. **Success Indicator**: Panjang baris teks berada pada rentang ideal 60–80 karakter per baris.
10. **Scoring Rubric (0–5)**:
    - **0**: Workspace berantakan tanpa struktur padding atau max-width.
    - **1-2**: Teks meledak pada layar lebar; tidak ada tag `<main>`.
    - **3-4**: Layout rapi namun belum memiliki pintasan skip link.
    - **5**: Canvas workspace sempurna, ARIA-compliant, dan responsif di seluruh breakpoint.

---

## 7. Page Header

1. **Business Objective**: Menegaskan identitas dan tujuan operasional halaman serta mengekspos aksi utama modul (Tambah, Export, Import).
2. **UX Objective**: Memastikan pengguna langsung memahami aksi utama apa yang bisa dilakukan di halaman ini.
3. **Enterprise Best Practice**: Flex container (`flex-col sm:flex-row justify-between`), memuat `<h1>`, deskripsi singkat, dan kelompok tombol aksi di kanan atas.
4. **Evaluation Criteria**: Kejelasan `<h1>`, penataan tombol aksi, responsivitas susunan tombol.
5. **Measurable Checklist**:
   - [ ] Mengandung tepat satu elemen `<h1>` per halaman.
   - [ ] Memiliki deskripsi kontekstual singkat di bawah judul (`text-sm text-muted`).
   - [ ] Tombol aksi utama menggunakan `PrimaryButton` (`bg-primary text-white`).
6. **Common Anti-pattern**: Memiliki lebih dari satu `<h1>` atau meletakkan tombol aksi utama di bagian paling bawah halaman (di luar jangkauan viewport).
7. **Severity Classification**: **Major (P1)**.
8. **Improvement Recommendation**: Gunakan komponen reusable `<PageHeader title="..." description="..." action={...} />`.
9. **Success Indicator**: Pengguna menemukan tombol aksi utama dalam < 1 detik setelah halaman terbuka.
10. **Scoring Rubric (0–5)**:
    - **0**: Halaman tidak memiliki judul atau header.
    - **1-2**: Judul tidak menggunakan `<h1>`; tombol aksi berserakan.
    - **3-4**: Memiliki PageHeader baku namun susunan tombol pecah di layar mobile.
    - **5**: PageHeader reusable sempurna dengan responsivitas tombol yang rapi.

---

## 8. Page Title

1. **Business Objective**: Menampilkan entitas spesifik yang sedang dikelola (misal: "Ahmad Hasan - Detail Siswa").
2. **UX Objective**: Menghindari kesalahan edit data akibat salah mengenali entitas target.
3. **Enterprise Best Practice**: Penggabungan Avatar/Icon entitas, Nama Utama (`text-2xl font-bold`), dan badge status entitas.
4. **Evaluation Criteria**: Kejelasan entitas, keterbacaan metadata pendukung (NIK/NISN/NIP).
5. **Measurable Checklist**:
   - [ ] Menampilkan nama entitas secara dominan.
   - [ ] Menyandingkan NISN/NIP/NIK dalam format tabular (`tabular-nums font-mono`).
   - [ ] Dilengkapi badge status entitas yang jelas.
6. **Common Anti-pattern**: Memotong (*truncate*) nama entitas penting tanpa tooltip penjelasan.
7. **Severity Classification**: **Moderate (P2)**.
8. **Improvement Recommendation**: Gunakan `truncate` yang didampingi atribut `title="[Nama Lengkap]"`.
9. **Success Indicator**: Zero insiden kesalahan identifikasi data entitas oleh pengguna.
10. **Scoring Rubric (0–5)**:
    - **0**: Judul entitas tidak jelas.
    - **3**: Judul jelas namun metadata pendukung tidak format tabular.
    - **5**: Judul entitas sempurna dengan metadata tabular dan badge status.

---

## 9. Global Filter

1. **Business Objective**: Menyaring seluruh data workspace berdasarkan konteks operasional terpusat (Tahun Ajaran, Semester, Rombel).
2. **UX Objective**: Memastikan seluruh tabel/kartu di bawahnya merespons perubahan filter secara otomatis tanpa perlu refresh manual.
3. **Enterprise Best Practice**: Sticky horizontal bar (`bg-paper border border-border/70 rounded-[4px] px-3 py-2`) tepat di bawah Page Header.
4. **Evaluation Criteria**: Reaktivitas komponen anak, kejelasan label filter, ketersediaan indikator "Tahun Aktif".
5. **Measurable Checklist**:
   - [ ] Menampilkan label UPPERCASE penanda baris filter (misal: `KONTEKS DATA`).
   - [ ] Mengubah state global tanpa memicu reload halaman.
   - [ ] Menampilkan badge penanda jika Tahun Ajaran terpilih adalah "Tahun Ajaran Aktif".
6. **Common Anti-pattern**: Komponen anak di bawah filter tidak bereaksi saat pilihan dropdown diganti.
7. **Severity Classification**: **Critical (P0)** jika data yang tampil tidak cocok dengan filter global yang dipasang.
8. **Improvement Recommendation**: Hubungkan komponen Global Filter langsung dengan `TahunAjaranContext`.
9. **Success Indicator**: 100% komponen workspace memperbarui datanya secara otomatis begitu filter diganti.
10. **Scoring Rubric (0–5)**:
    - **0**: Filter tidak berfungsi atau tidak ada.
    - **1-2**: Filter hanya mengubah sebagian komponen di halaman.
    - **3-4**: Reaktif sempurna namun tidak memiliki indikator "Tahun Aktif".
    - **5**: Global Filter reaktif 100%, terhubung Context Store, dan ARIA-compliant.

---

## 10. Action Panel

1. **Business Objective**: Memberikan area kontrol manipulasi data tabel (Search, Filter Kategori, View Switcher, Bulk Action).
2. **UX Objective**: Memungkinkan pencarian instan dan penyaringan multi-kriteria tanpa berpindah antarmuka.
3. **Enterprise Best Practice**: Baris kontrol fleksibel (`flex-wrap items-center justify-between gap-2 mb-4`).
4. **Evaluation Criteria**: Kecepatan pencarian (debounce 300ms), ketersediaan tombol "Reset Filter", kejelasan baris aksi massal (*bulk actions*).
5. **Measurable Checklist**:
   - [ ] Input pencarian dilengkapi ikon kaca pembesar dan placeholder deskriptif.
   - [ ] Pencarian live di-debounce `300ms`.
   - [ ] Baris Bulk Action muncul secara mulus saat ada baris tabel yang dicentang.
6. **Common Anti-pattern**: Memicu request API pada setiap ketukan tombol (*keystroke*) tanpa debounce, atau tanpa tombol "Reset Filter".
7. **Severity Classification**: **Major (P1)** jika pencarian tanpa debounce membebani server backend.
8. **Improvement Recommendation**: Gunakan `useDebouncedCallback` 300ms untuk input pencarian.
9. **Success Indicator**: Pencarian tabel terasa instan tanpa memicu banjir API request.
10. **Scoring Rubric (0–5)**:
    - **0**: Tidak ada panel filter/pencarian data.
    - **1-2**: Pencarian tanpa debounce; tidak ada aksi massal.
    - **3-4**: Pencarian lancar namun panel bulk action tidak konsisten.
    - **5**: Action Panel sempurna, debounced search, bulk action smooth, dan responsive.

---

## 11. KPI Card

1. **Business Objective**: Menampilkan ringkasan metrik kuantitatif utama operasional (Siswa Aktif, Pengajuan Menunggu, Attendance %, Skor AI Risk).
2. **UX Objective**: Memberikan wawasan cepat (*glanceable insight*) tanpa mengharuskan pengguna membaca seluruh baris tabel.
3. **Enterprise Best Practice**: Kartu bertepi halus (`rounded-[6px] border border-border bg-surface p-4`), angka metrik besar (`text-3xl font-bold tabular-nums`).
4. **Evaluation Criteria**: Keterbacaan angka, kejelasan warna semantik, keberadaan tautan eksplorasi detail.
5. **Measurable Checklist**:
   - [ ] Angka utama menggunakan format tabular (`tabular-nums font-semibold`).
   - [ ] Warna angka mencerminkan status semantik (`text-ink`, `text-amber`, `text-danger`, `text-ai`).
   - [ ] Memiliki tautan eksplorasi detail di bagian bawah kartu (misal: `Kelola siswa →`).
6. **Common Anti-pattern**: Angka metrik bergeser posisinya saat nilai bertambah/berkurang karena tidak menggunakan font tabular.
7. **Severity Classification**: **Moderate (P2)**.
8. **Improvement Recommendation**: Tambahkan kelas `tabular-nums` atau `font-mono` pada angka metrik.
9. **Success Indicator**: Pengguna dapat membaca seluruh metrik utama dalam < 3 detik.
10. **Scoring Rubric (0–5)**:
    - **0**: Metrik tidak terstruktur atau membingungkan.
    - **1-2**: Angka tidak font tabular; warna acak.
    - **3-4**: Kartu rapi namun tidak memiliki tautan eksplorasi ke modul detail.
    - **5**: KPI Card sempurna, angka tabular, semantik warna akurat, dan memiliki pintasan rute.

---

## 12. Card Header

1. **Business Objective**: Menjelaskan batasan lingkup data di dalam kartu/panel.
2. **UX Objective**: Memberikan judul kontekstual dan area tindakan spesifik kartu.
3. **Enterprise Best Practice**: Baris header bergaris bawah pemisah (`flex items-center justify-between border-b border-border px-4 py-3`).
4. **Evaluation Criteria**: Kejelasan judul kartu, kerapian tombol/badge tindakan di kanan header.
5. **Measurable Checklist**:
   - [ ] Judul kartu menggunakan `font-semibold text-ink text-sm`.
   - [ ] Memiliki garis pemisah baku dengan isi kartu (`border-b border-border`).
6. **Common Anti-pattern**: Judul kartu menyatu dengan isi kartu tanpa pemisah visual yang tegas.
7. **Severity Classification**: **Minor (P3)**.
8. **Improvement Recommendation**: Gunakan komponen `<SurfaceCard title="...">` baku.
9. **Success Indicator**: 100% kartu memiliki judul pembatas yang konsisten.
10. **Scoring Rubric (0–5)**:
    - **0**: Kartu tidak memiliki judul.
    - **3**: Kartu memiliki judul namun tanpa garis pemisah.
    - **5**: Card Header baku dan rapi.

---

## 13. Data Table

1. **Business Objective**: Menampilkan kumpulan data operasional berdensitas tinggi untuk ditinjau, difilter, dan dieksekusi.
2. **UX Objective**: Kemudahan membaca baris data, mengurutkan kolom, dan melakukan navigasi halaman (*pagination*).
3. **Enterprise Best Practice**: Tabel HTML semantik (`<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`), didampingi footer paginasi baku (`Menampilkan X–Y dari Z | Prev | Next`).
4. **Evaluation Criteria**: Kejelasan header kolom, keterbacaan teks baris, kerapian paginasi, penerapan Signature Element (StatusStrip 3px border kiri).
5. **Measurable Checklist**:
   - [ ] Header kolom rata kiri untuk teks, rata tengah/kanan untuk angka/status.
   - [ ] Baris tabel menggunakan Signature Element border kiri 3px sesuai status/risiko.
   - [ ] Footer paginasi menampilkan informasi jumlah data dan tombol Prev/Next yang jelas.
   - [ ] Memiliki penanganan tampilan data kosong (*Empty Table View*).
6. **Common Anti-pattern**: Memotong tabel tanpa horizontal scrollbar pada mobile, atau menyembunyikan footer paginasi saat data banyak.
7. **Severity Classification**: **Critical (P0)** jika data tabel meluap keluar layar tanpa bisa di-scroll pada perangkat mobile.
8. **Improvement Recommendation**: Bungkus komponen `<DataTable>` dengan `overflow-x-auto` dan sertakan footer paginasi baku.
9. **Success Indicator**: Pengguna dapat menavigasi baris data dengan lancar pada desktop maupun mobile.
10. **Scoring Rubric (0–5)**:
    - **0**: Tabel berantakan, pecah di mobile, tanpa paginasi.
    - **1-2**: Paginasi tidak ada; header tidak jelas.
    - **3-4**: Tabel rapi dan responsif namun belum menerapkan Signature Element border kiri 3px.
    - **5**: DataTable enterprise sempurna, ARIA-compliant, signature element aktif, dan paginasi lengkap.

---

## 14. Form

1. **Business Objective**: Memfasilitasi perekaman data baru atau pembaruan entitas madrasah (Registrasi Siswa, Input Nilai, Catat Izin).
2. **UX Objective**: Meminimalkan kesalahan input data pengguna melalui validasi langsung dan petunjuk yang jelas.
3. **Enterprise Best Practice**: Layout form 2-kolom responsif, label di atas input, pesan kesalahan berwarna merah tepat di bawah input terkait.
4. **Evaluation Criteria**: Kejelasan label, responsivitas validasi real-time, kejelasan tombol simpan.
5. **Measurable Checklist**:
   - [ ] Seluruh kontrol input terhubung dengan `<label htmlFor="...">`.
   - [ ] Input bermasalah ditandai `aria-invalid="true"` dan border merah (`border-danger`).
   - [ ] Tombol submit menampilkan loading spinner dan dalam state `disabled` saat data sedang dikirim.
6. **Common Anti-pattern**: Mengandalkan *placeholder* sebagai pengganti label, atau menyembunyikan alasan mengapa tombol simpan mati/disabled.
7. **Severity Classification**: **Critical (P0)** jika form gagal mengirimkan data tanpa memberi tahu kesalahan pada pengguna.
8. **Improvement Recommendation**: Gunakan React Hook Form + Zod Schema Validation.
9. **Success Indicator**: Tingkat keberhasilan pengisian form pada percobaan pertama > 95%.
10. **Scoring Rubric (0–5)**:
    - **0**: Form tanpa validasi dan tanpa label terhubung.
    - **1-2**: Pesan kesalahan tidak jelas; placeholder digunakan sebagai label.
    - **3-4**: Validasi rapi namun indikator loading tombol submit tidak ada.
    - **5**: Form enterprise sempurna dengan React Hook Form + Zod, ARIA-compliant, dan feedback instan.

---

## 15. Dialog (Modal)

1. **Business Objective**: Memfokuskan perhatian pengguna pada konfirmasi penting atau sub-tugas cepat tanpa meninggalkan konteks halaman.
2. **UX Objective**: Mencegah aksi tidak sengaja (terutama tindakan destruktif/hapus) melalui konfirmasi eksplisit.
3. **Enterprise Best Practice**: Overlay terpusat (`fixed inset-0 z-50 flex items-center justify-center`), latar belakang redup (*scrim* `bg-ink/40`), tombol konfirmasi jelas.
4. **Evaluation Criteria**: Efektivitas *focus trap*, keterbacaan judul & pesan dialog, kemudahan menutup modal (`Esc` / klik luar).
5. **Measurable Checklist**:
   - [ ] Menggunakan `role="dialog"` dan `aria-modal="true"`.
   - [ ] Memiliki tombol penutup `X` di kanan atas dan tombol "Batal" di footer.
   - [ ] Tombol aksi utama mencerminkan tindakan spesifik (misal: "Ya, Hapus Siswa", bukan cuma "OK").
6. **Common Anti-pattern**: Tidak bisa ditutup dengan tombol `Esc`, atau fokus keyboard terlepas ke halaman latar belakang (*focus leak*).
7. **Severity Classification**: **Major (P1)**.
8. **Improvement Recommendation**: Gunakan headless ARIA Dialog primitive dengan Focus Trap.
9. **Success Indicator**: Focus keyboard terkunci sempurna di dalam modal saat terbuka dan kembali ke tombol pemicu saat ditutup.
10. **Scoring Rubric (0–5)**:
    - **0**: Modal buatan sendiri tanpa ARIA dan tanpa penanganan Esc.
    - **1-2**: Focus leak ke latar belakang; label tombol konfirmasi tidak eksplisit.
    - **3-4**: ARIA-compliant namun belum responsif pada layar mobile kecil.
    - **5**: Dialog enterprise sempurna, ARIA-compliant, focus trap 100%, dan responsif.

---

## 16. Drawer (Side Panel Overlay)

1. **Business Objective**: Memampilkan detail mendalam entitas atau form sekunder tanpa mengacak-acak tampilan tabel utama.
2. **UX Objective**: Memberikan ruang kerja tambahan temporer yang mudah dibuka dan ditutup.
3. **Enterprise Best Practice**: Panel geser dari kanan (`fixed right-0 top-0 h-full w-full max-w-md bg-surface z-50 shadow-xl`).
4. **Evaluation Criteria**: Kehalusan animasi transisi geser, kejelasan tombol tutup, responsivitas isi drawer.
5. **Measurable Checklist**:
   - [ ] Panel bergeser secara mulus dari tepi kanan layar.
   - [ ] Dilengkapi latar belakang scrim redup yang dapat diklik untuk menutup.
   - [ ] Memiliki header dengan judul jelas dan tombol `X`.
6. **Common Anti-pattern**: Drawer menutupi seluruh layar tanpa batas visual pada desktop sehingga membingungkan pengguna apakah ini halaman baru atau drawer.
7. **Severity Classification**: **Moderate (P2)**.
8. **Improvement Recommendation**: Batasi lebar maksimum drawer desktop pada `max-w-md` atau `max-w-lg`.
9. **Success Indicator**: Pengguna dengan mudah membuka detail dan kembali ke tabel utama tanpa kehilang rute.
10. **Scoring Rubric (0–5)**:
    - **0**: Drawer kaku tanpa animasi dan tanpa tombol penutup.
    - **3**: Drawer berfungsi namun tidak memiliki penanganan tombol `Esc`.
    - **5**: Drawer enterprise mulus, ARIA-compliant, dan responsif.

---

## 17. Toast (System Feedback Notification)

1. **Business Objective**: Memberikan umpan balik instan atas keberhasilan atau kegagalan aksi asinkron (misal: "Data siswa berhasil diperbarui").
2. **UX Objective**: Mengonfirmasi hasil aksi pengguna tanpa menginterupsi alur kerja atau membutuhkan klik penutupan manual.
3. **Enterprise Best Practice**: Pemberitahuan mengambang di sudut bawah/atas kanan (`fixed bottom-4 right-4 z-60 max-w-sm`), berdurasi 4000ms.
4. **Evaluation Criteria**: Kejelasan pesan, kesesuaian warna semantik status (Hijau/Merah/Amber), ketersediaan tombol tutup manual.
5. **Measurable Checklist**:
   - [ ] Menggunakan `role="status"` atau `role="alert"`.
   - [ ] Warna indikator sesuai status (Primary/Green = Sukses, Red = Gagal, Amber = Peringatan).
   - [ ] Toast otomatis menghilang dalam 4 detik, kecuali pesan error kritis.
6. **Common Anti-pattern**: Menampilkan pesan error teknis backend yang mentah (*unhandled internal error 500 stacktrace*) kepada pengguna akhir.
7. **Severity Classification**: **Major (P1)** jika toast error menyembunyikan instruksi perbaikan yang dibutuhkan pengguna.
8. **Improvement Recommendation**: Terjemahkan error code backend menjadi pesan bahasa Indonesia yang ramah pengguna di service layer.
9. **Success Indicator**: 100% aksi simpan/edit/hapus memberikan konfirmasi toast yang relevan.
10. **Scoring Rubric (0–5)**:
    - **0**: Tidak ada umpan balik toast sama sekali setelah aksi selesai.
    - **1-2**: Toast menampilkan stacktrace teknis mentahBackend.
    - **3-4**: Toast rapi namun tidak memiliki role ARIA `alert`/`status`.
    - **5**: System Toast enterprise sempurna, ramah pengguna, berwaktu presisi, dan ARIA-compliant.

---

## 18. Empty State

1. **Business Objective**: Memberikan arahan produktif saat sebuah modul atau tabel belum memiliki data.
2. **UX Objective**: Mencegah kebingungan pengguna yang mengira antarmuka rusak/stuck saat data kosong.
3. **Enterprise Best Practice**: Blok bergaris putus-putus (*dashed border*) di tengah area kerja dengan ilustrasi/ikon netral, judul, deskripsi, dan tombol aksi pembuat data.
4. **Evaluation Criteria**: Kejelasan pesan keberadaan data kosong, ketersediaan tombol pemicu aksi pembuatan data.
5. **Measurable Checklist**:
   - [ ] Menggunakan komponen `<EmptyBlock title description action />`.
   - [ ] Menyediakan tombol aksi langsung (misal: `+ Tambah Data Baru`).
   - [ ] Menjelaskan mengapa data kosong (misal: "Belum ada siswa di rombel ini" vs "Pencarian tidak ditemukan").
6. **Common Anti-pattern**: Membiarkan tabel benar-benar kosong melompong (*blank white area*) tanpa pesan penjelasan.
7. **Severity Classification**: **Moderate (P2)**.
8. **Improvement Recommendation**: Pasang komponen `<EmptyBlock>` pada seluruh perulangan tabel/list data.
9. **Success Indicator**: Zero tampilan layar putih kosong tanpa penjelasan di seluruh aplikasi.
10. **Scoring Rubric (0–5)**:
    - **0**: Layar kosong melompong tanpa teks apapun saat data nol.
    - **1-2**: Hanya tulisan "Data Kosong" tanpa petunjuk aksi.
    - **3-4**: Blok data kosong rapi namun belum membedakan antara "Data Nol" vs "Hasil Filter Nol".
    - **5**: Empty State enterprise sempurna, informatif, dan memiliki tombol aksi pembuat data.

---

## 19. Loading State

1. **Business Objective**: Menjaga kepercayaaan pengguna bahwa sistem sedang memproses permintaan data.
2. **UX Objective**: Mengurangi persepsi waktu tunggu (*perceived latency*) dan mencegah klik ganda selama pemuatan data.
3. **Enterprise Best Practice**: Penggunaan *Skeleton Process Loaders* atau `<LoadingBlock label="..." />` yang mempertahankan dimensi layout asli.
4. **Evaluation Criteria**: Kehalusan indikator muat, stabilitas layout saat data selesai dimuat (*zero CLS*).
5. **Measurable Checklist**:
   - [ ] Menampilkan indikator muat dalam waktu < 200ms setelah permintaan dimulai.
   - [ ] Teks indikator muat menyebutkan proses yang sedang terjadi (misal: "Memuat data siswa...").
   - [ ] Dimensi skeleton loader cocok dengan dimensi komponen asli yang akan tampil.
6. **Common Anti-pattern**: Spinner berputar di tengah layar yang menghancurkan struktur layout halaman (*layout collapse*).
7. **Severity Classification**: **Moderate (P2)**.
8. **Improvement Recommendation**: Gunakan Skeleton Card/Table Loaders.
9. **Success Indicator**: Perubahan dari loading state ke content state terjadi tanpa pergeseran elemen sekitarnya.
10. **Scoring Rubric (0–5)**:
    - **0**: Tidak ada indikator muat; halaman membeku saat ambil data.
    - **1-2**: Spinner kasar yang merusak layout halaman.
    - **3-4**: Loading block rapi namun teks indikator tidak deskriptif.
    - **5**: Skeleton Loading State enterprise sempurna dengan zero CLS.

---

## 20. Error State

1. **Business Objective**: Menangani kegagalan jaringan atau API secara anggun tanpa menyebabkan aplikasi *crash*.
2. **UX Objective**: Memberikan jalur pemulihan (*recovery path*) yang jelas agar pengguna dapat mencoba kembali tanpa reload penuh.
3. **Enterprise Best Practice**: Kotak peringatan berwarna merah lembut (`bg-[#F8E8E6] border border-danger/30 text-danger p-4 rounded-[6px]`), dilengkapi pesan penjelasan dan tombol "Coba Lagi".
4. **Evaluation Criteria**: Kejelasan pesan error, ketersediaan tombol pemulihan `onRetry`, keamanan informasi (tidak membocorkan kredensial/stacktrace).
5. **Measurable Checklist**:
   - [ ] Menggunakan komponen `<ErrorBlock message onRetry />`.
   - [ ] Menyediakan tombol "Coba Lagi" yang memicu fungsi fetch ulang.
   - [ ] Pesan kesalahan ditulis dalam Bahasa Indonesia baku yang mudah dipahami.
6. **Common Anti-pattern**: Menampilkan *white screen of death* atau membiarkan aplikasi macet tanpa tombol coba lagi.
7. **Severity Classification**: **Critical (P0)** jika kesalahan menghentikan aplikasi tanpa opsi coba lagi.
8. **Improvement Recommendation**: Pasang React Error Boundary pada tingkat modul dan komponen data fetching.
9. **Success Indicator**: 100% error jaringan/API dapat dipulihkan dengan menekan tombol "Coba Lagi".
10. **Scoring Rubric (0–5)**:
    - **0**: Aplikasi mengalami *white screen crash* saat terjadi error.
    - **1-2**: Pesan error tampil tetapi tanpa opsi coba lagi.
    - **3-4**: Error block rapi dengan tombol coba lagi namun pesan masih dalam bahasa Inggris teknis.
    - **5**: Error Handling enterprise sempurna, ramah pengguna, dilengkapi `onRetry`, dan dilindungi React Error Boundary.

---

## 21. History (Audit Log Timeline)

1. **Business Objective**: Menyediakan jejak audit transparansi mutasi data untuk akuntabilitas operasional dan keamanan sistem.
2. **UX Objective**: Memudahkan administrator menelusuri kronologi perubahan data entitas secara cepat.
3. **Enterprise Best Practice**: Timeline vertikal bertanda titik status (`relative border-l-2 border-border ml-4 space-y-4`) atau tabel audit terstruktur.
4. **Evaluation Criteria**: Kejelasan waktu kejadian (format ISO & relatif), identitas pelaku perubahan (*actor*), dan rincian perubahan data.
5. **Measurable Checklist**:
   - [ ] Format waktu menggunakan angka tabular (`tabular-nums font-mono`).
   - [ ] Menampilkan nama dan peran pelaku yang melakukan perubahan data.
   - [ ] Memiliki pembeda visual yang jelas antara data sebelum dan sesudah diubah.
6. **Common Anti-pattern**: Menampilkan ID pengguna mentah (misal: `usr_123899`) tanpa nama jelas pelaku.
7. **Severity Classification**: **Moderate (P2)**.
8. **Improvement Recommendation**: Lakukan resolusi ID pelaku menjadi `Nama Lengkap (Peran)` di layer service sebelum ditampilkan.
9. **Success Indicator**: Auditor dapat mengidentifikasi siapa, kapan, dan apa yang diubah dalam < 5 detik.
10. **Scoring Rubric (0–5)**:
    - **0**: Tidak ada histori atau jejak audit perubahan data.
    - **1-2**: Histori menampilkan data ID mentah yang tidak terbaca manusia.
    - **3-4**: Histori rapi namun tidak memiliki format waktu tabular.
    - **5**: History Audit Trail enterprise sempurna, terbaca manusia, tabular, dan informatif.

---

## 22. Analytics

1. **Business Objective**: Menyajikan visualisasi data agregat (Tren Kehadiran, Statistik Nilai, Distribusi Kedisiplinan) untuk pengambilan keputusan eksekutif.
2. **UX Objective**: Membantu pimpinan (Kepala Madrasah) memahami pola data secara visual tanpa kerumitan perhitungan manual.
3. **Enterprise Best Practice**: Kartu grafik yang responsif (`<SurfaceCard title="...">`), dilengkapi label penjelasan AI (`<AiLabel />`) jika data berbasis algoritma prediksi.
4. **Evaluation Criteria**: Kontras warna seri data, ketersediaan legenda grafik, keterbacaan label sumbu (X/Y).
5. **Measurable Checklist**:
   - [ ] Menggunakan palet warna grafik yang konsisten dengan token sistem desain (Primary, Amber, Danger, AI Violet).
   - [ ] Dilengkapi label penjelasan atau *tooltip* nilai presisi saat kursor mengambang di atas grafik.
   - [ ] Menyediakan tabel alternatif data bagi pengguna pembaca layar (*screen reader fallback*).
6. **Common Anti-pattern**: Grafik yang pecah/terpotong pada layar mobile atau menggunakan warna-warni pelangi yang melanggar standar kontras a11y.
7. **Severity Classification**: **Major (P1)** jika grafik tidak dapat terbaca atau menyesuaikan diri pada perangkat mobile.
8. **Improvement Recommendation**: Gunakan pembungkus `ResponsiveContainer` dari Recharts/Chart.js dengan token warna CSS.
9. **Success Indicator**: Grafik menyesuaikan ukurannya secara mulus pada seluruh lebar layar.
10. **Scoring Rubric (0–5)**:
    - **0**: Grafik tidak responsif, warna acak, tanpa legend.
    - **1-2**: Grafik pecah di mobile; kontras warna buruk.
    - **3-4**: Grafik bagus dan responsif namun tanpa alternatif tabel a11y.
    - **5**: Analytics Dashboard enterprise sempurna, responsif, kontras a11y compliant, dan dilengkapi AI Insights.

---

## 23. Report (Dokumen Cetak & PDF)

1. **Business Objective**: Menghasilkan dokumen cetak resmi (Surat Keterangan, Rapor, Rekap Absensi) yang sah secara administratif.
2. **UX Objective**: Memastikan pratinjau antarmuka di layar kaca presisi 100% sama dengan hasil cetakan fisik di atas kertas A4.
3. **Enterprise Best Practice**: Tampilan kanvas pratinjau A4 berlatar belakang kontras, dilengkapi tombol "Cetak Surat (PDF)" yang memicu `window.print()`.
4. **Evaluation Criteria**: Presisi Kop Surat, kebersihan halaman cetak dari elemen navigasi web, penanganan pemotongan halaman (*page break*).
5. **Measurable Checklist**:
   - [ ] Menggunakan kelas `@media print` untuk menyembunyikan 100% navigasi, tombol, dan sidebar saat dicetak (`print:hidden`).
   - [ ] Memaksa format teks hitam di atas kertas putih murni (`text-black bg-white`).
   - [ ] Mencegah pemotongan canggung pada blok tanda tangan atau tabel (`page-break-inside: avoid`).
6. **Common Anti-pattern**: Latar belakang bayangan web atau tombol navigasi ikut tercetak di atas kertas A4.
7. **Severity Classification**: **Critical (P0)** jika elemen UI web ikut tercetak pada dokumen resmi.
8. **Improvement Recommendation**: Bungkus seluruh UI navigasi dan tombol aksi dengan kelas Tailwind `print:hidden`.
9. **Success Indicator**: Hasil cetak di atas kertas A4 bersih 100% hanya berisi dokumen resmi tanpa artefak UI web.
10. **Scoring Rubric (0–5)**:
    - **0**: Tidak ada penanganan cetak; halaman web tercetak berantakan.
    - **1-2**: Elemen tombol/sidebar ikut tercetak pada kertas.
    - **3-4**: Dokumen bersih dari UI web namun blok tanda tangan terpotong di batas halaman.
    - **5**: Report Print Engine enterprise sempurna, presisi A4, zero UI artifact, dan page-break teratur.

---

## 24. Mobile Experience

1. **Business Objective**: Menjamin operasional madrasah tetap dapat berjalan lancar saat staf/guru mengakses sistem melalui ponsel pintar (*smartphone*).
2. **UX Objective**: Memastikan seluruh fungsi dasar (input presensi, lihat jadwal, catat izin) dapat dijangkau dan dioperasikan dengan satu ibu jari.
3. **Enterprise Best Practice**: Transisi *Sidebar* menjadi *Off-Canvas Drawer*, penyusunan form dari 2-kolom menjadi 1-kolom, dan tombol target sentuh minimal 44x44px.
4. **Evaluation Criteria**: Responsivitas layout, keterjangkauan tombol sentuh (*touch target*), ketiadaan scrollbar horizontal yang tidak disengaja.
5. **Measurable Checklist**:
   - [ ] Minimum ukuran area sentuh tombol/input adalah 44x44px.
   - [ ] Tidak terjadi overflow horizontal pada layar lebar 360px–414px.
   - [ ] Menu navigasi berubah menjadi slide-out drawer dengan tombol hamburger yang jelas.
6. **Common Anti-pattern**: Membiarkan tombol aksi terlalu kecil dan saling berdempetan sehingga sering salah tekan pada layar sentuh.
7. **Severity Classification**: **Critical (P0)** jika modul operasional tidak dapat diisi melalui layar ponsel.
8. **Improvement Recommendation**: Terapkan kelas responsif Tailwind (`grid-cols-1 md:grid-cols-2`, `p-4 sm:p-6`).
9. **Success Indicator**: 100% fitur operasional utama dapat diselesaikan menggunakan ponsel pintar tanpa hambatan.
10. **Scoring Rubric (0–5)**:
    - **0**: Tampilan mobile hancur, teks saling tumpang tindih, tidak bisa di-scroll.
    - **1-2**: Layout mengecil kasar (desktop view di-zoom out); target sentuh sangat kecil.
    - **3-4**: Responsif rapi namun beberapa tabel meluap keluar layar tanpa scrollbar khusus.
    - **5**: Mobile Experience enterprise sempurna, touch-target $\ge 44px$, off-canvas drawer mulus, dan zero layout overflow.

---

# BAGIAN III: MATRIKS PENILAIAN & BOBOT KATEGORI

Setiap domain yang dievaluasi akan diberi skor **0 hingga 5** berdasarkan Rubrik Penilaian di atas. Skor akhir dihitung menggunakan pembobotan kategori enterprise berikut:

| Kategori Evaluasi | Domain Terkait | Bobot Kategori |
| --- | --- | --- |
| **I. Navigasi & Arsitektur Shell** | App Shell, Navbar, Sidebar, Topbar, Breadcrumb | **20%** |
| **II. Area Kerja & Tata Layout** | Workspace, Page Header, Page Title, Global Filter, Action Panel | **20%** |
| **III. Pengelolaan Data & Form** | KPI Card, Card Header, Data Table, Form | **20%** |
| **IV. Interaksi, Overlays & Feedback** | Dialog, Drawer, Toast, Empty State, Loading State, Error State | **20%** |
| **V. Spesialisasi Modul & Mobile** | History, Analytics, Report, Mobile Experience | **20%** |

### Rumus Perhitungan Skor Akhir (*Overall Quality Score*):
$$\text{Total Score (\%)} = \sum_{k=1}^{5} \left( \frac{\text{Rata-rata Skor Domain Kategori}_k}{5} \times \text{Bobot}_k \right) \times 100$$

---

# BAGIAN IV: TINGKAT KESIAPAN PRODUKSI (PRODUCTION READINESS LEVELS - PRL)

Berdasarkan total skor (%) dan keberadaan isu kritis, tingkat kesiapan produksi diklasifikasikan ke dalam 5 PRL:

- **PRL 5 — Production Ready (90% – 100%)**:
  - Zero Isu Critical (P0) & Zero Isu Major (P1).
  - Aksesibilitas WCAG AAA compliant, 100% responsif, konsistensi terminologi sempurna.
  - Ready for immediate enterprise deployment.
- **PRL 4 — Staging Approval (80% – 89%)**:
  - Zero Isu Critical (P0), maksimum 2 Isu Major (P1).
  - Fitur operasional utama berjalan sempurna; penyesuaian minor diperlukan pada estetika/spasi.
- **PRL 3 — Operational Beta (70% – 79%)**:
  - Maksimum 1 Isu Critical (P0) (dengan workaround jelas), beberapa Isu Major (P1).
  - Butuh perbaikan pada responsivitas mobile atau penyelarasan terminologi sebelum rilis final.
- **PRL 2 — Development Refactoring (50% – 69%)**:
  - Terdapat $\ge 2$ Isu Critical (P0) dan banyak Isu Major (P1).
  - Membutuhkan refactoring arsitektur UI/UX secara signifikan.
- **PRL 1 — Unstable Prototype (< 50%)**:
  - Terjadi *full page reload*, *layout shift* parah, ketidakcocokan RBAC, atau *crash* jaringan tanpa penanganan error. Tidak layak rilis.

---

# BAGIAN V: TEMPLATE LAPORAN AUDIT RESMI (FINAL AUDIT REPORT TEMPLATE)

```markdown
# Laporan Audit UI/UX & Production Readiness
**Nama Sistem**: [Nama Aplikasi / Enterprise Platform]
**Tanggal Evaluasi**: [YYYY-MM-DD]
**Auditor**: [Nama Evaluator / Tim UX Audit]
**Versi Target**: [v1.0.0 / Build ID]

---

## 1. Executive Summary
- **Overall Quality Score**: [XX.X%]
- **Production Readiness Level**: [PRL 1 – 5]
- **Status Kelayakan**: [SIAP RILIS / BUTUH REFACTORING / DITOLAK]
- **Ringkasan Temuan**: [Ringkasan 2-3 kalimat mengenai kekuatan utama dan kelemahan terbesar antarmuka]

---

## 2. Rangkuman Skor Per Kategori

| Kategori Evaluasi | Rata-rata Skor (0-5) | Bobot | Skor Terbobot |
| --- | --- | --- | --- |
| I. Navigasi & Arsitektur Shell | X.X / 5.0 | 20% | XX.X% |
| II. Area Kerja & Tata Layout | X.X / 5.0 | 20% | XX.X% |
| III. Pengelolaan Data & Form | X.X / 5.0 | 20% | XX.X% |
| IV. Interaksi, Overlays & Feedback | X.X / 5.0 | 20% | XX.X% |
| V. Spesialisasi Modul & Mobile | X.X / 5.0 | 20% | XX.X% |
| **TOTAL SKOR AKHIR** | | **100%** | **XX.X%** |

---

## 3. Matriks Temuan Isu Kritis & Utama (P0 & P1)

| ID Isu | Domain UI | Tingkat Keparahan | Deskripsi Masalah | Dampak Operasional | Rekomendasi Perbaikan |
| --- | --- | --- | --- | --- | --- |
| ISU-01 | Data Table | Critical (P0) | [Deskripsi...] | [Dampak...] | [Rekomendasi...] |
| ISU-02 | Form | Major (P1) | [Deskripsi...] | [Dampak...] | [Rekomendasi...] |

---

## 4. Evaluasi Detail Per Domain UI (24 Domain)

### [Nama Domain UI, misal: 1. App Shell]
- **Skor Domain**: [X / 5]
- **Status Evaluasi**: [LULUS / BUTUH PERBAIKAN]
- **Temuan Spesifik**:
  - Checklist [X/3] terpenuhi.
  - [Catatan evaluasi spesifik...]
- **Rekomendasi Tindakan**: [Langkah spesifik...]

*(Ulangi untuk seluruh 24 Domain)*

---

## 5. Rencana Tindakan Perbaikan (Action Plan Required)

1. **Prioritas Utama (P0 - Immediate Fix)**:
   - [ ] Action item 1...
2. **Prioritas Kedua (P1 - Before Release)**:
   - [ ] Action item 2...
3. **Prioritas Ketiga (P2/P3 - Next Iteration)**:
   - [ ] Action item 3...

---
**Tanda Tangan Lead Auditor**: ___________________________
```
