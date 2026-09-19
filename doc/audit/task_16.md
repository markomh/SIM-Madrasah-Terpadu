Instruksi Eksekusi Frontend: Implementasi Enterprise App Shell & Dashboard
Berdasarkan arsitektur frontend-first dan file global.css (Tailwind v4) yang sudah ada, lakukan perombakan antarmuka pengguna (UI) menuju standar Enterprise Educational Dashboard.
Fokus pada pemisahan navigasi dan implementasi sistem Grid/Widget untuk halaman Dashboard utama (/).
1. Implementasi Pola "App Shell"
Tinggalkan tata letak halaman web konvensional. Bangun kerangka aplikasi (Layout.tsx atau sejenisnya) dengan struktur berikut:
Sidebar (Kiri): Lebar tetap (misal w-64), tinggi layar penuh (h-screen), posisi fixed. Berisi menu navigasi. Beri warna latar bg-surface dengan batas kanan border-r border-border.
Topbar (Atas): Tinggi tetap (misal h-16), lebar menyesuaikan sisa layar, posisi fixed (atau sticky). Berisi Context/Role Switcher, notifikasi, dan profil pengguna. Beri warna latar bg-surface dengan batas bawah border-b border-border.
Main Canvas (Area Konten): Mengambil sisa ruang layar (menggunakan ml-64 dan mt-16). Wajib menggunakan warna latar bg-paper. Area ini adalah satu-satunya bagian aplikasi yang dapat di-scroll secara vertikal.
2. Standardisasi Komponen "Kartu" (Elevated Surfaces)
Setiap kontainer data (tabel, form, atau widget) di dalam Main Canvas wajib mematuhi standar desain elevasi berikut:
Gunakan class: bg-surface border border-border shadow-sm rounded-md p-4 (atau p-6).
Teks utama harus menggunakan text-ink dan teks penunjang/sekunder menggunakan text-muted.
(Aturan ini menegaskan pemisahan visual antara latar belakang abu-abu terang dan kartu konten yang berwarna putih bersih).
3. Perombakan Dashboard Kepala Madrasah (Sistem Grid)
Ubah tampilan Beranda (/) menjadi dashboard analitik modern.
KPI Bar (Top Row): Buat 4 kartu indikator utama (Key Performance Indicators) menggunakan CSS Grid: className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4".
Kartu 1: Total Siswa Aktif
Kartu 2: Persentase Kehadiran Hari Ini (Gunakan teks hijau text-primary jika >95%)
Kartu 3: Surat Menunggu TTD (Wajib ada badge merah/amber menggunakan bg-danger atau bg-amber)
Kartu 4: Peringatan AI / Anomali Kedisiplinan (Gunakan styling ungu text-ai dan bg-ai-soft)
Middle Row (Data Visualization & Tabel Ringkas): Di bawah KPI Bar, buat grid 2 kolom (grid-cols-1 lg:grid-cols-3 gap-4).
Kolom Kiri (Spanning 2 col, lg:col-span-2): Siapkan wadah (kartu) untuk "Grafik Kehadiran Siswa". (Gunakan mock layout atau library seperti recharts jika tersedia).
Kolom Kanan (Spanning 1 col, lg:col-span-1): Kartu "Tugas Tertunda / Antrean Surat", berisi daftar ringkas 3-5 item yang bisa diklik.
4. Tipografi & Ikonografi
Pastikan tabel yang menampilkan angka (NISN, Nominal, NIP) menggunakan class tabular yang sudah didefinisikan di global.css agar angka rata vertikal.
Gunakan ikon dari lucide-react dengan warna text-muted untuk elemen netral, dan warna spesifik (text-primary, text-danger, text-ai) untuk status yang membutuhkan perhatian.

Instruksi Eksekusi Frontend: Implementasi Grafik Visual (Recharts) pada Dashboard
Sebagai kelanjutan dari perombakan "Enterprise App Shell", aplikasikan visualisasi data pada baris tengah (Middle Row) di halaman Beranda.tsx untuk pengguna dengan peran Kepala Madrasah atau Admin.
1. Persiapan Library
Gunakan recharts karena ini adalah library visualisasi data paling optimal dan React-native.
Jalankan: npm install recharts (atau pnpm add recharts).
Jangan gunakan Chart.js atau ApexCharts agar bundle size tetap ringan dan terintegrasi baik dengan komponen fungsional React.
2. Pembuatan Komponen GrafikKehadiran.tsx
Buat satu komponen khusus bernama GrafikKehadiran di dalam folder src/components/dashboard/ (atau direktori komponen yang relevan).
Gunakan <ResponsiveContainer width="100%" height={300}> agar grafik otomatis menyesuaikan lebar kartu (fluid).
Gunakan <AreaChart> atau <BarChart> untuk menampilkan tren kehadiran siswa selama 6 bulan terakhir.
3. Integrasi Warna Tailwind (Krusial)
Agar grafik tidak terlihat seperti library tempelan, warnanya wajib menggunakan design tokens dari global.css. Jangan gunakan kode hex (hardcode) di dalam properti Recharts.
Contoh injeksi warna CSS Variable ke Recharts:
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Data mock statis untuk Tahap 1
const mockData = [
  { name: 'Jul', hadir: 98, izin: 2 },
  { name: 'Ags', hadir: 95, izin: 5 },
  { name: 'Sep', hadir: 97, izin: 3 },
  { name: 'Okt', hadir: 92, izin: 8 }, // Simulasi penurunan
  { name: 'Nov', hadir: 96, izin: 4 },
  { name: 'Des', hadir: 99, izin: 1 },
];

export default function GrafikKehadiran() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={mockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
          <XAxis dataKey="name" stroke="var(--color-muted)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--color-muted)" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius-md)' }}
            itemStyle={{ color: 'var(--color-ink)' }}
          />
          <Area type="monotone" dataKey="hadir" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorHadir)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

4. Penempatan di Dashboard (Beranda.tsx)
Panggil <GrafikKehadiran /> di dalam kartu (elevated surface) pada area "Middle Row" (kolom yang membentang 2 kolom penuh atau col-span-2).
Beri judul kartu yang elegan, misalnya: "Tren Kehadiran Siswa (Semester Ganjil)".
Pastikan kartu tersebut menggunakan class pembungkus standar kita: bg-surface border border-border shadow-sm rounded-md p-6.

