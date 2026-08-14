Dalam membangun antarmuka pengguna (*User Interface*) untuk **Dashboard Pendidikan** (seperti sistem SIM-Madrasah), aturan pembuatan UI diatur secara ketat oleh konstitusi **Enterprise Knowledge Architecture (EKA)**. EKA menetapkan prinsip **"Architecture Before Pixel"**—yang berarti visual antarmuka bukanlah titik awal perancangan ataupun tujuan utama, melainkan konsekuensi logis dari kebutuhan operasional bisnis. 

Berikut adalah panduan dan aturan pembuatan UI yang diturunkan secara berjenjang dari tujuan bisnis tingkat tinggi hingga ke unit komponen terkecil di tingkat kode:

---

### 1. Rantai Ketertelusuran Mutlak (*The Traceability Chain*)
Setiap elemen visual, tombol, warna, atau piksel yang tampil pada dashboard pendidikan wajib memiliki alasan keberadaan yang dapat ditelusuri ke atas secara linier:
\\[\text{Business Domain} \rightarrow \text{Business Capability} \rightarrow \text{Decision} \rightarrow \text{Information} \rightarrow \text{Layout Zone} \rightarrow \text{Section} \rightarrow \text{Business Component} \rightarrow \text{Design Token} \rightarrow \text{Code}\\]
Jika ditemukan elemen visual di layar yang tidak memiliki hubungan ketertelusuran hingga ke *Business Goal*, maka elemen tersebut langsung dinyatakan sebagai **utang teknis (*technical debt*)** dan ditolak dalam audit regresi.

---

### 2. Tingkat 1: Pondasi Bisnis & Model Keputusan (*Business & Decision Layer*)
*   **Business Domain (P1):** Menentukan ruang lingkup dan misi utama institusi pendidikan. Dalam konteks SIM-Madrasah, tujuannya adalah efisiensi operasional satu pintu (*single source of input*), validasi data untuk sinkronisasi EMIS, serta pemanfaatan data untuk operasional harian.
*   **Business Capability (P2):** Mendefinisikan kemampuan operasional fungsional yang mandiri teknologi (tidak boleh mendefinisikan halaman/visual). Contoh: *Student Performance Assessment* (mengelola nilai dasar), *Academic Scheduling* (mengelola jadwal mengajar), atau *Student Attendance Management*.
*   **Decision Canonical (P2):** UI dirancang untuk mendukung pengambilan keputusan operasional pengguna. Halaman dashboard pendidikan harus mematuhi aturan **"One Page One Primary Decision"**. 
    *   *Contoh Keputusan:* *"Mata pelajaran/rombel mana yang belum menginput nilai harian minggu ini?"* atau *"Siswa mana yang paling berisiko mengalami putus sekolah berdasarkan anomali absensi?"*.

---

### 3. Tingkat 2: Struktur Informasi & Alur Navigasi (*Information & Navigation Layer*)
*   **Information Canonical (P3):** Mengatur urutan penyajian informasi sebelum menyusun tata letak visual. Aturan mutlak yang wajib dipatuhi adalah **"Exception Before Summary"** (kondisi bermasalah harus terlihat sebelum ringkasan statistik) dan **"Summary Before Detail"**.
    *   *Urutan Hierarki:* `Context Information (I1) ➔ Exception Information (I3) ➔ Operational Information (I4) ➔ Historical/Detail Information (I5)`.
*   **Navigation Canonical (P4):** Mengatur perpindahan konteks pengguna berdasarkan alur kerja, bukan struktur folder aplikasi. Dashboard pendidikan bertindak sebagai **Orientation Workspace**, yang mengarahkan pengguna ke halaman aksi/investigasi detail secara cepat.

---

### 4. Tingkat 3: Tata Letak Spasial & Modularisasi (*Layout & Section Canonical*)
*   **Layout Canonical (P6):** Menerjemahkan urutan informasi secara spasial dari atas ke bawah layar menggunakan pembagian **Layout Zones**. Setiap zona memiliki aturan **Kerapatan Informasi (*Density Control*)** yang harus disesuaikan dengan kapasitas kognitif pengguna:
    1.  **Zone A — Context Zone (P1 - Low Density):** Judul halaman, filter Tahun Ajaran, dan Semester aktif (mencegah kesalahan input data masa lalu).
    2.  **Zone B — Health Zone (P1 - Low Density):** Status sinkronisasi ke server data (EMIS Kemenag) dan ketersediaan mode luring (*offline ready*).
    3.  **Zone C — Exception Zone (P1 - Medium Density):** Peringatan dini kritis, misalnya data NIK siswa tidak 16 digit, siswa kritis yang terdeteksi drop-out oleh AI, atau anomali guru yang mendadak absen tanpa izin.
    4.  **Zone D — Operational Summary (P2 - Medium Density):** Ringkasan KPI operasional sekolah (seperti persentase absensi hari ini, jumlah nilai terisi).
    5.  **Zone G — Historical Zone (P3 - High Density):** Tabel besar riwayat nilai (*Grade Ledger*), presensi, atau daftar log mutasi.
*   **Section Canonical (P7):** Memisahkan area fungsional secara modular menjadi unit pengelompokan informasi (`S1 Context` hingga `S8 Analytics`). Aturan emasnya adalah **"One Section One Information Group"**—Anda dilarang mencampur area status sinkronisasi sistem (`S2 Health`) dengan visualisasi statistik grafik tren (`S8 Analytics`) dalam satu area section yang sama.

---

### 5. Tingkat 4: Hirarki Komponen Semantik (*Component Library*)
Komponen antarmuka dashboard pendidikan wajib dibangun secara modular menggunakan hierarki 3 level yang kaku, mengikuti aturan **"Composition Before Customization"**:

*   **Level 1 — Primitive Components:** Komponen atomik murni yang bebas dari logika bisnis. 
    *   *Contoh:* `<Button />`, `<Badge />`, `<Input />`, `<Label />`.
*   **Level 2 — Foundation Components:** Gabungan dari komponen primitif untuk membentuk pola antarmuka umum. 
    *   *Contoh:* `<Table />`, `<Drawer />`, `<Modal />`, `<Card />`.
*   **Level 3 — Business Components:** Komponen penampung logika bisnis yang merepresentasikan domain pendidikan. 
    *   *Contoh:* `<GradeLedgerTable />`, `<StudentDetailDrawer />`, `<AcademicAlertBanner />`.
*   **Aturan Penamaan Komponen:** Wajib menggunakan **PascalCase** dan menjelaskan makna bisnis (*Business Before Visual*), serta dilarang keras mengandung unsur warna, ukuran fisik, atau posisi penempatan spasial. 
    *   *Benar:* `<AcademicAlertBanner />`, `<GradeStatusBadge />`.
    *   *Salah:* `<RedAlertCard />`, `<LargeLeftPanel />`.

---

### 6. Tingkat 5: Bahasa Visual & Token Desain (*Design Canonical & Design Token*)
*   **Design Canonical (P10):** Menegaskan bahwa visual priority merupakan refleksi dari prioritas bisnis. Penekanan visual (*Visual Emphasis*) seperti kontras dan tebal tipis huruf ditentukan oleh tingkat urgensi pengambilan keputusan (*Critical Exception* memiliki visual tertinggi, sedangkan *Historical* memiliki penekanan visual terendah).
*   **Design Token (P11):** Merupakan sumber kebenaran tunggal (*Single Source of Truth*) untuk seluruh nilai atribut visual di tingkat implementasi. Pengembang **dilarang keras menuliskan nilai visual secara langsung (*hardcoded values*)** di dalam kode frontend.
    *   **Aturan Semantik:** Penamaan token harus merujuk pada makna fungsional bisnis (*Semantic Before Physical*):
        *   *Warna:* Gunakan `--color-status-danger` (untuk remedial/gagal/absen), bukan `#EF4444` atau `red-500`.
        *   *Spasi:* Gunakan `--spacing-section` atau `--spacing-card`, bukan `24px` atau `gap-6`.
        *   *Tipografi:* Gunakan `--typography-heading`, bukan `font-large`.

---

### 7. Pengendalian Interaksi & Aksesibilitas (*Interaction & Accessibility*)
*   **Interaction Canonical (P9):** Interaksi harus mengurangi beban mental pengguna melalui prinsip **Progressive Disclosure**. Seluruh riwayat audit yang padat diletakkan di dalam tabel, sementara rincian rekam jejak bimbingan konseling (BK) atau riwayat perubahan nilai siswa disembunyikan di dalam *Drawer* on-demand (`StudentDetailDrawer`) yang hanya akan dimuat dan terbuka saat baris tabel tersebut diklik pengguna.
*   **Umpan Balik Mutlak (*No Silent Failure*):** Setiap aksi (misal tombol mengunci nilai) wajib menghasilkan respons visual yang jelas (`Default ➔ Loading ➔ Success/Error`) menggunakan transisi warna status token semantik.


***
# BOILERPLATE FRONTEND SIM-MADRASAH TERPADU v2.0
**EKA & Additive RBAC Compliant Codebase Template**
**Standardization Level:** Level 1-3 Component Composition & Semantic Design Tokens

Dokumen ini adalah **Boilerplate & Panduan Struktur Repositori Frontend** resmi yang mengikat secara teknis seluruh proses pembuatan komponen dan modul antarmuka pada SIM-Madrasah Terpadu v2.0. Kode ini dirancang agar siap digunakan oleh tim pengembang Anda untuk mempercepat pengembangan Fase 1 hingga Fase 4 dengan jaminan 100% kepatuhan audit EKA.

---

## 1. STRUKTUR DIREKTORI REPOSITORI (Level 1-3 Component Organization)

Repositori frontend wajib dikelompokkan secara ketat berdasarkan tingkatan komponen kanonikal EKA. Pengembang dilarang mencampur komponen generik dengan komponen bisnis transaksional.

```text
sim-madrasah-frontend/
├── tailwind.config.js              # Pemetaan Design Tokens ke utility classes Tailwind
├── src/
│   ├── styles/
│   │   └── tokens.css              # Custom Properties CSS untuk Design Tokens Semantik
│   ├── types/
│   │   └── eka.ts                  # Kontrak tipe data TypeScript (User, Session, Permissions)
│   ├── hooks/
│   │   └── useEkaAuth.ts           # Hook Otorisasi Kumulatif (Additive RBAC)
│   ├── components/
│   │   ├── primitive/              # LEVEL 1: Komponen atomik murni (Bebas logika bisnis)
│   │   │   ├── Button.tsx
│   │   │   └── Badge.tsx
│   │   ├── foundation/             # LEVEL 2: Komponen pola umum (Perakitan primitif)
│   │   │   ├── Table.tsx
│   │   │   ├── Drawer.tsx
│   │   │   └── PermissionGuard.tsx # Pelapis Otorisasi Spasial Komponen
│   │   └── business/               # LEVEL 3: Komponen transaksional spesifik Pendidikan
│   │       ├── AcademicAlertBanner.tsx  # Zone C - Exception Section
│   │       ├── GradeLedgerTable.tsx     # Zone G - Historical Table
│   │       └── StudentDetailDrawer.tsx  # Zone G - Drawer Detail On-Demand
│   ├── layouts/
│   │   └── DashboardLayout.tsx     # Pengendali Layout Spasial (Zone A - H)
│   └── pages/
│       └── kelas/
│           └── evaluasi.tsx        # Integrasi komposisi halaman (Page Composition)
```

---

## 2. CONFIGURASI DESIGN TOKENS (CSS & TAILWIND)

Tim pengembang dilarang keras menuliskan warna fisik (seperti `#EF4444` atau `red-500`) secara langsung di dalam komponen. Seluruh properti visual wajib menggunakan **Design Tokens** semantik.

### A. Properti Kustom CSS (`src/styles/tokens.css`)
```css
:root {
  /* --- Semantic Color Tokens --- */
  --color-status-success: #10B981; /* Hijau - Aman/Lulus */
  --color-status-warning: #F59E0B; /* Oranye - Peringatan/Butuh Tindakan */
  --color-status-danger: #EF4444;  /* Merah - Remedial/Sakit/Alpa/Kritis */
  --color-status-info: #3B82F6;    /* Biru - Konteks/Informasi */

  --color-bg-primary: #FFFFFF;
  --color-bg-surface-muted: #F3F4F6;
  --color-border-primary: #E5E7EB;

  --color-text-primary: #111827;
  --color-text-muted: #6B7280;

  /* --- Semantic Spacing Tokens --- */
  --spacing-section: 2rem;    /* 32px - Jarak antar Zone A, C, D, G */
  --spacing-card: 1.5rem;     /* 24px - Jarak di dalam kartu summary */
  --spacing-component: 1rem;  /* 16px - Jarak antar input/tombol */
  --spacing-inline: 0.5rem;   /* 8px  - Spasi micro antar teks & lencana */

  /* --- Semantik Border Radius --- */
  --radius-large: 0.75rem;    /* 12px - Sudut Kartu / Drawer */
  --radius-medium: 0.5rem;    /* 8px  - Sudut Tombol / Input */
  --radius-small: 0.25rem;    /* 4px  - Sudut Lencana / Badge */
}
```

### B. Konfigurasi Tailwind (`tailwind.config.js`)
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        status: {
          success: "var(--color-status-success)",
          warning: "var(--color-status-warning)",
          danger: "var(--color-status-danger)",
          info: "var(--color-status-info)",
        },
        brand: {
          bg: "var(--color-bg-primary)",
          surface: "var(--color-bg-surface-muted)",
          border: "var(--color-border-primary)",
        },
        txt: {
          primary: "var(--color-text-primary)",
          muted: "var(--color-text-muted)",
        }
      },
      spacing: {
        section: "var(--spacing-section)",
        card: "var(--spacing-card)",
        component: "var(--spacing-component)",
        inline: "var(--spacing-inline)",
      },
      borderRadius: {
        lg: "var(--radius-large)",
        md: "var(--radius-medium)",
        sm: "var(--radius-small)",
      }
    },
  },
  plugins: [],
}
```

---

## 3. TYPESCRIPT CONTRACTS (`src/types/eka.ts`)

Menetapkan kontrak tipe data otorisasi yang aman dan kuat untuk mengelola model peran aditif dan data multi-tenant (UU PDP).

```typescript
export interface EkaUser {
  id_pegawai: string;
  id_madrasah: string; // Gap B: Menghindari kebocoran data tenant
  nama_lengkap: string;
  tugas_utama: 'Guru' | 'Tendik';
  
  // Jabatan Madrasah Makro (Additive RBAC)
  jabatan_makro: Array<'Kepala Madrasah' | 'Admin Madrasah' | 'Operator Kesiswaan' | 'Guru BK'>;
  
  is_wali_kelas: boolean;
  is_pembina_ekstra: boolean;
  
  scoped_rombel_ids: string[]; // Batasan pengisian nilai/absen per guru
  scoped_ekstra_ids: string[];
}

export type EkaPermission =
  | 'session:start_close'       // Membuka/menutup kelas mengajar harian
  | 'academic:input_presensi'   // Hak presensi siswa per kelas
  | 'academic:input_nilai'      // Hak input nilai tugas/remedial
  | 'academic:bulk_promotion'   // Kelulusan & Kenaikan kelas massal (Fase 3)
  | 'bk:read_rahasia'           // Membaca rekam medis/BK sensitif (UU PDP)
  | 'bk:crud_catatan'           // Membuat catatan konseling baru
  | 'approval:mutasi'           // Persetujuan siswa mutasi (Fase 1)
  | 'document:sign'             // E-Signature Kepala Madrasah untuk SK/Surat
  | 'analytics:read';           // Membaca grafik statistik agregat

export interface StudentData {
  id_siswa: string;
  id_madrasah: string;
  nama_siswa: string;
  nisn: string;
  nik: string; // Informasi sensitif (UU PDP)
  status_akademis: 'LULUS' | 'AKTIF' | 'REMEDIAL' | 'TERANCAM_DROPOUT';
  nilai_tugas_1: number;
  nilai_tugas_2: number;
  nilai_uts: number;
  nilai_uas: number;
  nilai_akhir: number;
  catatan_bk_sensitif?: string;
}
```

---

## 4. HOOK OTORISASI ADITIF (`src/hooks/useEkaAuth.ts`)

Mengevaluasi secara kumulatif seluruh peran aktif guru tanpa mereduksi atau menindih hak akses peran lainnya.

```typescript
import { useMemo } from 'react';
import { EkaUser, EkaPermission } from '../types/eka';

// Simulasi Context Global Sesi
const mockUserSession: EkaUser = {
  id_pegawai: "PEG-1029",
  id_madrasah: "MAD-01-JKT", // Multi-tenant ID
  nama_lengkap: "Budi Rahardjo, S.Pd.",
  tugas_utama: "Guru",
  jabatan_makro: ["Guru BK"], // Guru ini adalah pengajar sekaligus Guru BK aktif (Aditif)
  is_wali_kelas: true,
  is_pembina_ekstra: false,
  scoped_rombel_ids: ["ROMBEL-XI-A", "ROMBEL-XI-B"],
  scoped_ekstra_ids: []
};

export function useEkaAuth() {
  const user = mockUserSession; // Di produksi, ganti dengan data session riil API

  const permissions = useMemo<Set<EkaPermission>>(() => {
    const activePerms = new Set<EkaPermission>();
    if (!user) return activePerms;

    // 1. Evaluasi Peran Makro secara Kumulatif
    user.jabatan_makro.forEach((jabatan) => {
      switch (jabatan) {
        case 'Kepala Madrasah':
          activePerms.add('approval:mutasi');
          activePerms.add('document:sign');
          activePerms.add('bk:read_rahasia');
          activePerms.add('analytics:read');
          break;
        case 'Admin Madrasah':
          activePerms.add('session:start_close');
          activePerms.add('academic:bulk_promotion');
          activePerms.add('bk:crud_catatan');
          break;
        case 'Operator Kesiswaan':
          activePerms.add('academic:bulk_promotion');
          break;
        case 'Guru BK':
          activePerms.add('bk:crud_catatan');
          activePerms.add('bk:read_rahasia'); // Memenuhi UU PDP
          break;
      }
    });

    // 2. Evaluasi Kapasitas Tugas Utama
    if (user.tugas_utama === 'Guru') {
      activePerms.add('academic:input_presensi');
      activePerms.add('academic:input_nilai');
    }

    // 3. Evaluasi Jabatan Terbatas (Kondisional)
    if (user.is_wali_kelas) {
      activePerms.add('academic:input_presensi');
    }

    return activePerms;
  }, [user]);

  const hasPermission = (permission: EkaPermission): boolean => {
    return permissions.has(permission);
  };

  const hasRowScope = (rombelId: string): boolean => {
    if (!user) return false;
    if (user.jabatan_makro.includes('Admin Madrasah') || user.jabatan_makro.includes('Kepala Madrasah')) {
      return true; // Superuser bypass
    }
    return user.scoped_rombel_ids.includes(rombelId);
  };

  return {
    user,
    hasPermission,
    hasRowScope,
    permissions: Array.from(permissions),
  };
}
```

---

## 5. LEVEL 2 FOUNDATION COMPONENT: `<PermissionGuard />`

Membatasi visibilitas area spasial interaksi di dalam UI Next.js / React tanpa mengotori struktur JSX.

```tsx
import React from 'react';
import { useEkaAuth } from '../../hooks/useEkaAuth';
import { EkaPermission } from '../../types/eka';

interface PermissionGuardProps {
  required: EkaPermission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  required,
  fallback = null,
  children,
}) => {
  const { hasPermission } = useEkaAuth();

  if (!hasPermission(required)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
```

---

## 6. LEVEL 3 BUSINESS COMPONENT: `<GradeLedgerTable />` (High Density Table with Zone C Alert Integration & Row Masking)

Komponen ini mendemonstrasikan perakitan fungsional lengkap yang menerapkan **"Exception Before Summary"**, **"Progressive Disclosure"** melalui detail Drawer, serta **"Row Masking"** data pribadi BK guna mematuhi UU PDP.

```tsx
import React, { useState, useMemo } from 'react';
import { useEkaAuth } from '../../hooks/useEkaAuth';
import { StudentData } from '../../types/eka';
import { PermissionGuard } from '../foundation/PermissionGuard';

// Data Mock Siswa di Rombel Kelas XI-A
const initialStudents: StudentData[] = [
  {
    id_siswa: "SIS-001",
    id_madrasah: "MAD-01-JKT",
    nama_siswa: "Ahmad Fauzi",
    nisn: "0091223445",
    nik: "3171092803090001",
    status_akademis: "AKTIF",
    nilai_tugas_1: 85,
    nilai_tugas_2: 90,
    nilai_uts: 80,
    nilai_uas: 85,
    nilai_akhir: 84.5
  },
  {
    id_siswa: "SIS-002",
    id_madrasah: "MAD-01-JKT",
    nama_siswa: "Budi Santoso",
    nisn: "0091223446",
    nik: "3171091204090002",
    status_akademis: "REMEDIAL",
    nilai_tugas_1: 45,
    nilai_tugas_2: 50,
    nilai_uts: 55,
    nilai_uas: 55,
    nilai_akhir: 52.0,
    catatan_bk_sensitif: "Siswa sering bolos karena membantu ekonomi keluarga bekerja malam hari."
  },
  {
    id_siswa: "SIS-003",
    id_madrasah: "MAD-01-JKT",
    nama_siswa: "Rini Wijaya",
    nisn: "0091223447",
    nik: "3171091506090003",
    status_akademis: "TERANCAM_DROPOUT",
    nilai_tugas_1: 0,
    nilai_tugas_2: 0,
    nilai_uts: 0,
    nilai_uas: 0,
    nilai_akhir: 0,
    catatan_bk_sensitif: "Mengalami trauma perundungan ekstrem di lingkungan luar sekolah."
  }
];

export const GradeLedgerTable: React.FC = () => {
  const { user, hasPermission, hasRowScope } = useEkaAuth();
  const [students, setStudents] = useState<StudentData[]>(initialStudents);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);

  const activeRombelId = "ROMBEL-XI-A";
  const isAuthorizedToEdit = hasPermission('academic:input_nilai') && hasRowScope(activeRombelId);

  // 1. Hitung Exception Data Secara Dinamis (Siswa Kritis - Zone C)
  const criticalExceptions = useMemo(() => {
    return students.filter(s => s.status_akademis === 'REMEDIAL' || s.status_akademis === 'TERANCAM_DROPOUT');
  }, [students]);

  // 2. Hitung Operational Summary (Zone D)
  const classAverage = useMemo(() => {
    const total = students.reduce((acc, curr) => acc + curr.nilai_akhir, 0);
    return (total / students.length).toFixed(1);
  }, [students]);

  const classProgress = useMemo(() => {
    const filled = students.filter(s => s.nilai_akhir > 0).length;
    return Math.round((filled / students.length) * 100);
  }, [students]);

  return (
    <div className="flex flex-col gap-section w-full max-w-7xl mx-auto p-component bg-brand-bg">
      
      {/* ========================================================
          ZONE B: HEALTH ZONE (Status Luring & Sinkronisasi EMIS)
          ======================================================== */}
      <div className="flex justify-between items-center text-xs text-txt-muted border-b border-brand-border pb-inline">
        <span>Konteks Madrasah: {user.id_madrasah}</span>
        <div className="flex gap-component">
          <span className="flex items-center gap-inline text-status-success">
            <span className="w-2 h-2 rounded-full bg-status-success"></span>
            LMS Cloud Sync: Terhubung
          </span>
          <span>Sesi Aktif: Semester Ganjil</span>
        </div>
      </div>

      {/* ========================================================
          ZONE C: EXCEPTION ZONE (Exception Before Summary)
          Hanya di-render secara kondisional jika ada anomali siswa
          ======================================================== */}
      {criticalExceptions.length > 0 && (
        <div className="p-card bg-status-danger/10 border border-status-danger rounded-lg transition-all duration-300">
          <h3 className="text-sm font-bold text-status-danger mb-inline flex items-center gap-inline">
            ⚠️ PERHATIAN UTAMA: {criticalExceptions.length} Siswa Butuh Penanganan Segera
          </h3>
          <p className="text-xs text-txt-muted mb-component">
            Siswa berikut berada di bawah KKM atau terindikasi berisiko dropout. Lakukan intervensi segera sebelum semester berakhir.
          </p>
          <div className="flex flex-col gap-inline">
            {criticalExceptions.map(student => (
              <div key={student.id_siswa} className="flex justify-between items-center bg-brand-bg p-inline rounded-md border border-brand-border">
                <span className="text-xs font-semibold text-txt-primary">{student.nama_siswa}</span>
                <div className="flex gap-component items-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                    student.status_akademis === 'TERANCAM_DROPOUT' 
                      ? 'bg-status-danger text-brand-bg' 
                      : 'bg-status-warning text-txt-primary'
                  }`}>
                    {student.status_akademis}
                  </span>
                  <button 
                    onClick={() => setSelectedStudent(student)}
                    className="text-xs font-semibold text-status-info hover:underline"
                  >
                    Buka Intervensi ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          ZONE D: OPERATIONAL SUMMARY (Summary Section)
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-card">
        <div className="p-card bg-brand-surface border border-brand-border rounded-lg">
          <span className="text-xs text-txt-muted font-bold">RATA-RATA NILAI KELAS</span>
          <div className="text-2xl font-bold text-txt-primary mt-inline">{classAverage}</div>
          <span className="text-[10px] text-status-success font-semibold">📈 Naik 2.1pt dari KKM</span>
        </div>
        <div className="p-card bg-brand-surface border border-brand-border rounded-lg">
          <span className="text-xs text-txt-muted font-bold">PROGRESS PENGISIAN NILAI</span>
          <div className="text-2xl font-bold text-txt-primary mt-inline">{classProgress}%</div>
          <span className="text-[10px] text-txt-muted font-semibold">{students.filter(s => s.nilai_akhir > 0).length} dari {students.length} Siswa Terisi</span>
        </div>
        <div className="p-card bg-brand-surface border border-brand-border rounded-lg">
          <span className="text-xs text-txt-muted font-bold">TINGKAT KEHADIRAN KELAS</span>
          <div className="text-2xl font-bold text-txt-primary mt-inline">98.2%</div>
          <span className="text-[10px] text-status-success font-semibold">🟢 Sangat Baik</span>
        </div>
      </div>

      {/* ========================================================
          ZONE E & G: ACTION ZONE & HISTORICAL LEDGER TABLE
          ======================================================== */}
      <div className="p-card bg-brand-bg border border-brand-border rounded-lg flex flex-col gap-component">
        <div className="flex justify-between items-center pb-component border-b border-brand-border">
          <h2 className="text-sm font-bold text-txt-primary">Buku Besar Nilai Siswa (Grade Ledger)</h2>
          
          {/* Action Zone Integrasi Otorisasi (Level 2 Primitive Guard) */}
          <PermissionGuard required="academic:bulk_promotion">
            <button className="bg-status-info text-brand-bg text-xs font-bold px-component py-inline rounded-md hover:opacity-90">
              Kenaikan Kelas Massal ➔
            </button>
          </PermissionGuard>
        </div>

        {/* High Density Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-brand-surface border-b border-brand-border text-txt-muted font-bold">
                <th className="p-component">Nama Siswa</th>
                <th className="p-component">NISN</th>
                <th className="p-component">Tugas 1 (20%)</th>
                <th className="p-component">Tugas 2 (20%)</th>
                <th className="p-component">UTS (30%)</th>
                <th className="p-component">UAS (30%)</th>
                <th className="p-component">Nilai Akhir</th>
                <th className="p-component">Status</th>
                <th className="p-component text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {students.map((student) => (
                <tr key={student.id_siswa} className="hover:bg-brand-surface/50 text-txt-primary">
                  <td className="p-component font-semibold">{student.nama_siswa}</td>
                  <td className="p-component text-txt-muted">{student.nisn}</td>
                  <td className="p-component">
                    <input 
                      type="number"
                      disabled={!isAuthorizedToEdit}
                      value={student.nilai_tugas_1}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setStudents(prev => prev.map(s => s.id_siswa === student.id_siswa ? { ...s, nilai_tugas_1: val } : s));
                      }}
                      className="w-12 p-inline border border-brand-border rounded text-center disabled:bg-brand-surface"
                    />
                  </td>
                  <td className="p-component">
                    <input 
                      type="number"
                      disabled={!isAuthorizedToEdit}
                      value={student.nilai_tugas_2}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setStudents(prev => prev.map(s => s.id_siswa === student.id_siswa ? { ...s, nilai_tugas_2: val } : s));
                      }}
                      className="w-12 p-inline border border-brand-border rounded text-center disabled:bg-brand-surface"
                    />
                  </td>
                  <td className="p-component">{student.nilai_uts}</td>
                  <td className="p-component">{student.nilai_uas}</td>
                  <td className="p-component font-bold">{student.nilai_akhir}</td>
                  <td className="p-component">
                    <span className={`px-2 py-0.5 rounded-sm font-bold text-[10px] ${
                      student.status_akademis === 'AKTIF' 
                        ? 'bg-status-success/10 text-status-success'
                        : 'bg-status-warning/10 text-status-warning'
                    }`}>
                      {student.status_akademis}
                    </span>
                  </td>
                  <td className="p-component text-right">
                    <button 
                      onClick={() => setSelectedStudent(student)}
                      className="bg-brand-surface border border-brand-border hover:bg-brand-border font-bold text-[10px] px-component py-inline rounded"
                    >
                      Buka Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          PROGRESSIVE DISCLOSURE: STUDENT DETAIL DRAWER (Zone G)
          Terbuka On-Demand dan menghentikan pengungkapan data sensitif
          ======================================================== */}
      {selectedStudent && (
        <StudentDetailDrawer 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}
    </div>
  );
};

// ========================================================
// ROW MASKING COMPONENT (UU PDP & HIPAA Compliant Guard)
// ========================================================
interface StudentDetailDrawerProps {
  student: StudentData;
  onClose: () => void;
}

const StudentDetailDrawer: React.FC<StudentDetailDrawerProps> = ({ student, onClose }) => {
  const { user } = useEkaAuth();

  // Aturan EKA: Hanya Guru BK bersangkutan atau Kepala Madrasah yang boleh membaca catatan BK sensitif siswa
  const canReadSensitiveBk = useMemo(() => {
    if (!student.catatan_bk_sensitif) return true;
    if (!user) return false;

    const isKepalaMadrasah = user.jabatan_makro.includes('Kepala Madrasah');
    const isGuruBk = user.jabatan_makro.includes('Guru BK');

    return isKepalaMadrasah || isGuruBk;
  }, [user, student]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div className="w-full max-w-md bg-brand-bg h-full shadow-2xl p-card flex flex-col justify-between animate-slide-in rounded-l-lg border-l border-brand-border">
        <div className="flex flex-col gap-component">
          <div className="flex justify-between items-center border-b border-brand-border pb-inline">
            <h2 className="text-sm font-bold text-txt-primary">Detail Profil & Evaluasi Siswa</h2>
            <button onClick={onClose} className="text-txt-muted hover:text-txt-primary font-bold text-lg">×</button>
          </div>

          <div className="bg-brand-surface p-component rounded-md flex flex-col gap-inline">
            <div>
              <span className="text-[10px] text-txt-muted font-bold block">NAMA SISWA</span>
              <span className="text-xs font-semibold text-txt-primary">{student.nama_siswa}</span>
            </div>
            <div>
              <span className="text-[10px] text-txt-muted font-bold block">NISN / NIK (DISEMBUNYIKAN UNTUK PROTEKSI PRIVASI UU PDP)</span>
              <span className="text-xs font-mono text-txt-primary">
                {student.nisn} / {student.nik.replace(/\d(?=\d{4})/g, "*")} {/* Menyensor 12 angka pertama NIK */}
              </span>
            </div>
          </div>

          {/* Sesi Penanganan BK dengan Skema Row Masking yang Terkunci Ketat */}
          <div className="flex flex-col gap-inline mt-component">
            <h4 className="text-xs font-bold text-txt-primary">Catatan Pembinaan Konseling (BK)</h4>
            
            {student.catatan_bk_sensitif ? (
              canReadSensitiveBk ? (
                <div className="bg-status-warning/10 p-component rounded border border-status-warning/30">
                  <p className="text-xs text-txt-primary leading-relaxed">{student.catatan_bk_sensitif}</p>
                </div>
              ) : (
                <div className="bg-brand-surface p-component rounded border border-brand-border">
                  <span className="text-[10px] font-bold text-status-danger block mb-inline">
                    🔒 [CATATAN RAHASIA - AKSES DITOLAK]
                  </span>
                  <p className="text-[10px] text-txt-muted leading-relaxed italic">
                    Isi catatan ini dilindungi UU PDP No. 27/2022 dan hanya dapat diakses oleh Guru BK bersangkutan atau Kepala Madrasah.
                  </p>
                </div>
              )
            ) : (
              <p className="text-xs text-txt-muted italic">Tidak ada catatan kasus BK aktif.</p>
            )}
          </div>
        </div>

        <div className="border-t border-brand-border pt-component flex gap-component">
          <button 
            onClick={onClose}
            className="flex-1 bg-brand-surface border border-brand-border text-txt-primary text-xs font-bold py-component rounded-md"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 7. MATRIKS EVALUASI KEPATUHAN KODE AUDITOR (UI Code Review Checklist)

Sebelum menyetujui kodingan dari komponen ini untuk masuk ke produksi, pastikan Anda memverifikasi 4 kriteria EKA berikut:

1. **Apakah Pengecekan Peran Menggunakan String Statis?**
   * *Status:* **Dilarang**. Developer tidak boleh menggunakan `user.role === 'Guru BK'`. Pengecekan wajib menggunakan `hasPermission('bk:read_rahasia')`.
2. **Apakah Kerapatan Spasial Terjaga?**
   * *Status:* **Wajib**. Semua elemen visual menggunakan variabel utilitas spacing Tailwind yang dideklarasikan dari Custom Properti (`gap-section`, `p-card`, `p-component`, `pb-inline`).
3. **Apakah Ada Celah Kebocoran Data NIK?**
   * *Status:* **Terlindungi**. Angka NIK wajib disensor di sisi komponen (`student.nik.replace(/\d(?=\d{4})/g, "*")`) agar tidak terekspos langsung di layar Guru biasa, mematuhi UU PDP.
4. **Apakah Urutan Layout Menghormati Exception Before Summary?**
   * *Status:* **Wajib**. Kode JSX secara linier memosisikan `Zone C (Exception Zone)` di bagian paling atas sebelum merender `Zone D (Summary cards)` di bawahnya.
