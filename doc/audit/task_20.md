Membuat setiap pekerjaan utama madrasah dapat diselesaikan dari konteks yang tepat, dengan input minimum, bantuan yang sesuai tingkat kemampuan pengguna, validasi otomatis, permission yang benar, dan jejak audit yang lengkap.

Saya akan mengubah backlog menjadi 5 jalur kerja paralel.

P0 — Security & Contract Integrity

Ini harus selesai sebelum UX enhancement besar.

Wajib:
Backend Policy/Gate
action-level authorization
multi-tenant isolation seluruh entity akar
export isolation
attachment isolation
audit trail
auth/session
FE PermissionGuard
FE tenant-aware state
FE↔BE type parity.

Audit menemukan backend policy masih menjadi gap nyata.

12. P1 — Operational UX Foundation

Perbaiki sistem sehingga workflow benar-benar usable.

Wajib:
loading state
skeleton
error state
empty state
success state
retry
confirmation
undo hanya untuk operasi yang aman
responsive
low-bandwidth behavior.

Audit menemukan banyak halaman belum memiliki loading state dan DataTable belum mendukung loading.

13. P1 — Contextual Experience

Bangun:

Global context
Madrasah
Tahun Ajaran
Semester
User
Kapabilitas
Local context
Guru
 ↓
Jadwal
 ↓
Rombel
 ↓
Mapel
 ↓
Sesi

Kemudian gunakan context inheritance.

Ini kemungkinan besar akan memberikan peningkatan UX terbesar dengan perubahan UI relatif kecil.

14. P1 — Design seluruh workflow kritis

Jangan mengaudit 25 halaman sebagai halaman.

Audit berdasarkan journey:

Journey Guru
Login
→ Jadwal
→ Presensi
→ Jurnal
→ Nilai
Journey Wali Kelas
Dashboard
→ Rombel
→ Presensi
→ Nilai
→ Siswa bermasalah
→ Tindak lanjut
Journey Operator
Siswa
→ Kenaikan
→ Pindah
→ Mutasi
→ Persetujuan
→ Surat
→ Arsip
Journey Kamad
Dashboard
→ Approval
→ Surat
→ Kedisiplinan
→ Analitik
→ Audit
Journey BK
Siswa
→ Kasus
→ Catatan
→ Tindak lanjut

Ini jauh lebih bernilai daripada sekadar "audit page 1–25".

15. P2 — Power-user UX

Baru setelah workflow stabil:

Command Palette
keyboard shortcut
virtualized table
advanced filter
bulk actions
batch approval
quick actions
saved views.

Ini adalah accelerator, bukan fondasi.

---
