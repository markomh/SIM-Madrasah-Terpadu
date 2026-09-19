
### 1. Instruksi Perbaikan Ikon (*Hardcoded Icon to Primitive*)

> **"Audit semua elemen tombol pada halaman ini. Temukan tombol yang menggunakan ikon *hardcode* berupa inline `<svg>` mentah atau emoji (khususnya pada tombol 'Rekomendasi AI' atau sejenisnya). Hapus elemen *hardcode* tersebut dan ganti menggunakan komponen ikon primitif dari *library* standar proyek (misalnya `lucide-react` atau `heroicons`). Pastikan ikon dipanggil di dalam komponen standar `<Button>` bawaan *design system* agar otomatis mewarisi *styling* yang benar (seperti `w-4 h-4`, `gap/margin`, dan `currentColor`)."**

### 2. Instruksi Perbaikan Layout Kartu (*Card White Space / Stretch*)

> **"Periksa layout `grid` atau `flex` yang membungkus komponen Kartu (Card). Saat ini kartu mengalami *stretch* (sama tinggi) yang menyebabkan penumpukan *white space* (ruang kosong) secara tidak rapi di bagian bawah teks. Tolong *refactor* bagian dalam setiap kartu: tambahkan class `flex flex-col h-full` pada *container* utama kartu, lalu tambahkan class `mt-auto` pada elemen paling bawah (seperti *footer* atau tombol aksi). Tujuannya agar tombol aksi selalu merapat ke bawah (rata bawah) dan ruang kosong terdistribusi secara rapi di antara konten teks dan tombol."**
