# Rencana Desain Beranda Unified Adaptive
## SIM-Madrasah Terpadu

## 1. Tujuan

Menciptakan satu pengalaman **Beranda/Dashboard yang konsisten** bagi seluruh pengguna SIM-Madrasah Terpadu, dengan struktur navigasi dan pola interaksi yang tetap, sementara data, informasi, pekerjaan, dan tindakan yang ditampilkan beradaptasi berdasarkan:

1. **Identity** — siapa pengguna.
2. **Assignment** — penugasan yang dimiliki pengguna.
3. **Capability** — kemampuan/otorisasi yang dimiliki pengguna.
4. **Scope** — batas data yang boleh diakses.
5. **Relevance & Priority** — tingkat relevansi dan prioritas pekerjaan bagi pengguna.

Prinsip utamanya:

> **One Beranda, Fixed Shell, Adaptive Content.**

Beranda bukan dashboard yang berbeda untuk setiap role. Beranda merupakan satu pengalaman universal yang melakukan presentasi terhadap konteks kerja pengguna yang sah.

---

# 2. Prinsip Arsitektur Utama

## 2.1 Satu Beranda Universal

Seluruh pengguna terautentikasi menggunakan:

```text
/beranda
```

Tidak membuat:

```text
/dashboard-kamad
/dashboard-admin
/dashboard-operator
/dashboard-bk
/dashboard-guru
```

hanya karena perbedaan role atau penugasan.

Role tidak menentukan halaman Beranda.

---

## 2.2 Fixed Shell, Adaptive Content

Struktur pengalaman pengguna dipertahankan konsisten:

```text
Beranda
├── Header / Context
├── User Orientation
├── Summary / Metrics
├── Primary Work Area
└── Secondary Utilities
```

Yang dapat berubah:

```text
├── widget
├── metric
├── task
├── activity
├── quick action
├── data
└── prioritas informasi
```

Dengan demikian:

> **Struktur pengalaman tetap; isi mengikuti capability dan konteks kerja.**

---

# 3. Model Mental Pengguna

Beranda harus menjawab tiga pertanyaan pengguna secara cepat:

```text
1. Siapa saya?
2. Apa yang sedang menjadi tanggung jawab saya?
3. Apa yang perlu saya lakukan sekarang?
```

Beranda tidak boleh memaksa pengguna memahami struktur internal:

```text
Role
Permission
Capability
ACL
Tenant
Scope
```

Istilah teknis tersebut merupakan mekanisme sistem, bukan bahasa presentasi kepada pengguna.

---

# 4. Identity, Assignment, Capability, dan Scope

Keempat konsep harus dibedakan.

```text
IDENTITY
Siapa pengguna?

        ↓

ASSIGNMENT
Penugasan apa yang dimiliki pengguna?

        ↓

CAPABILITY
Apa yang boleh dilakukan pengguna?

        ↓

SCOPE
Data/objek mana yang boleh diakses?

        ↓

PRESENTATION
Apa yang relevan untuk ditampilkan di Beranda?
```

Contoh:

```text
Pegawai
├── Penugasan: Guru Pengajar
├── Penugasan: Wali Kelas X-A
└── Penugasan: Guru BK

Capabilities:
├── teaching_schedule.read
├── attendance.manage
├── class.read
├── bk_case.read
└── bk_case.manage

Scope:
├── Kelas X-A
├── Siswa binaan
└── Data madrasah yang diizinkan
```

Frontend tidak boleh menyimpulkan capability hanya dari nama role.

---

# 5. Role Bukan Sumber Langsung Keputusan UI

Hindari pola:

```typescript
if (isGuruBk) {
    showBkWidget();
}

if (isWaliKelas) {
    showWaliWidget();
}
```

Pola tersebut menyebabkan frontend menjadi role-driven dan berpotensi mengalami proliferasi kondisi ketika jumlah role/penugasan berkembang.

Gunakan konsep:

```text
Capability
+
Assignment Context
+
Scope
+
Relevance
+
Priority
```

sebagai dasar pemilihan informasi.

Role tetap merupakan bagian dari authorization model apabila memang digunakan oleh sistem, tetapi bukan kontrak langsung untuk menentukan layout Beranda.

---

# 6. Kontrak `/me`

Endpoint pengguna dapat menyediakan authorization context yang diperlukan frontend.

Contoh konseptual:

```json
{
  "identity": {
    "id": "...",
    "name": "...",
    "status": "active"
  },
  "tenant": {
    "id": "...",
    "name": "..."
  },
  "assignments": [
    {
      "type": "pengajar",
      "scope": "..."
    },
    {
      "type": "wali_kelas",
      "scope": "class:10A"
    },
    {
      "type": "guru_bk",
      "scope": "..."
    }
  ],
  "capabilities": [
    "teaching_schedule.read",
    "attendance.manage",
    "student.read",
    "bk_case.read",
    "bk_case.manage"
  ]
}
```

Catatan:

> `/me` menyediakan **context authorization dan identity**, bukan menjadi sumber seluruh data Beranda.

Data operasional tetap berasal dari domain/API yang memiliki otoritas terhadap data tersebut.

---

# 7. Arsitektur Data Beranda

Secara konseptual:

```text
GET /me
      │
      ├── Identity
      ├── Tenant
      ├── Assignments
      ├── Capabilities
      └── Scope
              │
              ▼
        Widget Eligibility
              │
              ▼
       Relevance & Priority
              │
              ▼
          /beranda
              │
       ┌──────┼──────┐
       ▼      ▼      ▼
      KPI   Tasks  Activity
       │      │      │
       └──────┼──────┘
              ▼
        Adaptive UI
```

Authorization tetap merupakan tanggung jawab backend.

Frontend hanya melakukan presentasi terhadap hasil authorization yang diberikan sistem.

---

# 8. Struktur Universal Beranda

Beranda menggunakan empat zona konseptual.

```text
┌─────────────────────────────────────────────────────────────┐
│ ZONA 1 — HEADER / CONTEXT                                  │
│ Profil · Tahun Ajaran · Pencarian · Notifikasi             │
├─────────────────────────────────────────────────────────────┤
│ ZONA 2 — USER ORIENTATION                                  │
│ Selamat datang + ringkasan konteks penugasan               │
├─────────────────────────────────────────────────────────────┤
│ ZONA 3 — SUMMARY / METRICS                                 │
│ Metric cards yang tersedia berdasarkan capability          │
├───────────────────────────────────────────┬─────────────────┤
│ ZONA 4 — PRIMARY WORK AREA                │ SECONDARY       │
│                                           │ UTILITIES       │
│ Aktivitas utama                           │ Quick Actions   │
│ Pekerjaan yang perlu tindakan             │ Informasi       │
│ Jadwal / monitoring / tugas                │ Pengumuman      │
└───────────────────────────────────────────┴─────────────────┘
```

Pembagian kolom desktop dapat menggunakan pendekatan seperti:

```text
Primary Work Area
+
Secondary Utility Area
```

Rasio seperti 65:35 merupakan keputusan visual yang dapat disesuaikan melalui usability testing dan **bukan kontrak SSoT domain**.

---

# 9. Zona 1 — Header / Context

Header memiliki fungsi orientasi global.

Informasi yang dapat tersedia:

```text
Profil pengguna
Tahun ajaran / periode aktif
Pencarian
Notifikasi
Akses akun
```

Header harus konsisten bagi seluruh pengguna.

Perbedaan capability tidak boleh mengubah identitas dasar header secara drastis.

---

# 10. Zona 2 — User Orientation

Hero/summary digunakan untuk membantu pengguna memahami konteksnya.

Contoh:

```text
Selamat datang, Ahmad S.Pd.

3 penugasan aktif
Guru Pengajar · Wali Kelas X-A · Guru BK
```

Fungsi utama:

```text
Orientasi
+
Identitas
+
Ringkasan konteks
```

Hero bukan tempat menampilkan seluruh permission atau authorization detail.

Detail penugasan dapat tersedia pada halaman atau komponen yang memang bertanggung jawab untuk penugasan.

---

# 11. Zona 3 — Adaptive Metrics

Metric area tetap konsisten secara visual, tetapi jumlah dan jenis metric bersifat adaptif.

Contoh pengguna dengan capability pengajaran:

```text
┌────────────┐ ┌────────────┐ ┌────────────┐
│ Jam        │ │ Absensi    │ │ Jadwal     │
│ Mengajar   │ │ Hari Ini   │ │ Terdekat   │
└────────────┘ └────────────┘ └────────────┘
```

Pengguna dengan capability BK:

```text
┌────────────┐ ┌────────────┐ ┌────────────┐
│ Kasus      │ │ Konseling  │ │ Tindak     │
│ Aktif      │ │ Pending    │ │ Lanjut     │
└────────────┘ └────────────┘ └────────────┘
```

Tidak perlu memaksakan jumlah card tertentu.

Contoh:

```text
4 tersedia → tampilkan 4
3 tersedia → tampilkan 3
2 tersedia → tampilkan 2
1 tersedia → tampilkan 1
```

Prinsip:

> **Metric region fixed; metric content adaptive.**

---

# 12. Zona 4 — Primary Work Area

Primary Work Area menampilkan pekerjaan yang paling relevan bagi pengguna.

Contoh:

### Pengajar

```text
Jadwal Mengajar Hari Ini
├── Matematika — XI-B
├── Bahasa Indonesia — X-A
└── IPA — XII-A
```

### Wali Kelas

```text
Aktivitas Kelas
├── Absensi siswa
├── Informasi siswa
└── Tindak lanjut wali kelas
```

### Guru BK

```text
Aktivitas BK
├── Konseling terjadwal
├── Tindak lanjut
└── Catatan yang memerlukan perhatian
```

### Pengelola Madrasah

```text
Monitoring
├── Kondisi data
├── Persetujuan
└── Informasi operasional
```

Widget dipilih berdasarkan capability, scope, relevance, dan priority.

---

# 13. Secondary Utility Area

Secondary Utility Area menyediakan informasi dan tindakan pendukung.

Contoh:

```text
Quick Actions
├── Input Absensi
├── Input Nilai
├── Tambah Catatan
└── Akses pekerjaan terkait

Informasi
├── Pengumuman
├── Informasi madrasah
└── Reminder
```

Quick Action hanya ditampilkan apabila capability yang diperlukan tersedia.

Contoh:

```text
attendance.manage
        ↓
Input Absensi
```

Bukan:

```text
role == guru
        ↓
Input Absensi
```

---

# 14. Multi-Assignment User

Satu Pegawai dapat memiliki beberapa penugasan sekaligus.

Contoh:

```text
Pegawai
├── Guru Pengajar
├── Wali Kelas X-A
└── Guru BK
```

Beranda tidak boleh memaksa user berpindah:

```text
Mode Guru
Mode Wali Kelas
Mode BK
```

hanya untuk melihat pekerjaan.

Secara default:

```text
/beranda
   ↓
Unified Work Context
```

seluruh pekerjaan yang relevan dapat dikonsolidasikan.

---

# 15. Context Filter

Apabila jumlah informasi terlalu banyak, Beranda dapat menyediakan filter konteks.

Contoh:

```text
Konteks:

[ Semua ] [ Mengajar ] [ Wali Kelas ] [ BK ]
```

Filter tersebut:

* hanya menyaring presentasi;
* tidak mengubah identity;
* tidak mengubah authorization;
* tidak mengubah capability;
* tidak mengubah tenant;
* tidak menjadi mekanisme security.

Dengan kata lain:

> **Filter adalah UX mechanism, bukan authorization mechanism.**

---

# 16. Jangan Menyebut Context Filter sebagai Role Switching

Hindari UI:

```text
[ Guru ]
[ Wali Kelas ]
[ BK ]
```

jika itu memberikan kesan bahwa user sedang berganti role.

Lebih tepat:

```text
Konteks pekerjaan

[ Semua ]
[ Mengajar ]
[ Wali Kelas ]
[ BK ]
```

Karena pengguna tetap merupakan satu identity dengan beberapa assignment/capability.

---

# 17. Visual Context / Badge

Badge dapat digunakan untuk memperjelas konteks suatu item.

Contoh:

```text
Siswa Budi tidak hadir 3 hari
[Wali Kelas X-A]
```

atau:

```text
Permintaan konseling baru
[Guru BK]
```

Namun badge tidak boleh digunakan pada setiap item secara otomatis.

Gunakan hanya apabila:

1. item berasal dari beberapa konteks;
2. konteks tidak jelas dari struktur;
3. tanpa badge terdapat potensi salah interpretasi.

Prinsip:

> **Badge untuk mengurangi ambiguity, bukan untuk menghias UI.**

---

# 18. Relevance & Priority Engine

Capability saja tidak cukup untuk menentukan semua widget yang ditampilkan.

User multi-assignment dapat memiliki terlalu banyak informasi.

Karena itu proses seleksi perlu mempertimbangkan:

```text
Capability
+
Scope
+
Relevance
+
Priority
+
Current Context
```

Contoh prioritas:

```text
P1 — Perlu tindakan segera
P2 — Aktivitas hari ini
P3 — Pekerjaan terdekat
P4 — Ringkasan
P5 — Informasi tambahan
```

Tujuannya:

> Beranda menjadi **operational starting point**, bukan dumping ground seluruh informasi sistem.

---

# 19. Contoh Mapping Capability → Presentation

| Capability / Context                 | Presentation yang dapat muncul |
| ------------------------------------ | ------------------------------ |
| `teaching_schedule.read`             | Jadwal mengajar                |
| `attendance.manage`                  | Quick Action input absensi     |
| `grade.manage`                       | Progress input nilai           |
| `class.read` + assignment wali kelas | Ringkasan kelas                |
| `bk_case.read`                       | Ringkasan kasus BK             |
| `bk_case.manage`                     | Quick Action / pekerjaan BK    |
| `approval.read`                      | Approval queue                 |
| `master_data.manage`                 | Quick Action pengelolaan data  |

Mapping tersebut merupakan **presentation eligibility**, bukan definisi authorization.

Authorization tetap ditentukan backend.

---

# 20. Data Sensitif

Tidak semua capability dapat diperlakukan sebagai data biasa.

Contoh data BK:

```text
Kasus BK
Catatan konseling
Informasi sensitif siswa
```

Widget Beranda tidak boleh hanya mengandalkan:

```text
bk_case.read
```

tetapi harus tetap tunduk pada:

```text
Capability
+
Scope
+
Data classification
+
Backend authorization
```

Frontend tidak boleh menampilkan data sensitif hanya karena widget tersedia.

---

# 21. Backend Authorization Boundary

Aturan penting:

```text
Frontend:
"Apakah komponen ini relevan dan boleh dipresentasikan?"

Backend:
"Apakah user benar-benar boleh mengakses data/action ini?"
```

Frontend hiding bukan security.

Contoh yang salah:

```text
if (!canReadBK) {
    hideBKWidget();
}
```

lalu backend tetap mengirim seluruh data BK.

Yang benar:

```text
Backend authorization
        ↓
Only authorized data
        ↓
Frontend presentation
```

---

# 22. SSoT Boundary

Beranda tidak boleh menjadi sumber kebenaran untuk:

```text
Role
Permission
Capability
Assignment
Tenant
Data ownership
Authorization
```

SSoT domain tetap berada pada entitas dan service yang bertanggung jawab terhadapnya.

Beranda hanya menjadi:

> **consumer/presenter dari authorization context dan domain data.**

---

# 23. Database

Tidak diperlukan tabel khusus seperti:

```text
dashboard_by_role
dashboard_widgets_by_role
user_dashboard_role
```

hanya untuk menghasilkan adaptive Beranda.

Model domain tetap fokus pada:

```text
Account
User / Pegawai
Assignment / Penugasan
Role
Capability / Permission
Scope
Domain Data
```

Jika personalisasi layout pengguna belum menjadi requirement bisnis, jangan memasukkannya ke model domain.

---

# 24. Struktur Komponen Frontend

Hindari:

```text
<KamadDashboard />
<AdminDashboard />
<OperatorDashboard />
<GuruDashboard />
<BkDashboard />
```

Gunakan struktur fungsional:

```text
<HomePage>
    <HeaderContext />
    <UserOrientation />
    <MetricRegion />
    <PrimaryWorkArea />
    <SecondaryUtilities />
</HomePage>
```

Kemudian widget bersifat capability-aware:

```text
<MetricRegion>
    <EligibleMetrics />
</MetricRegion>

<PrimaryWorkArea>
    <EligibleWorkItems />
</PrimaryWorkArea>

<SecondaryUtilities>
    <EligibleActions />
</SecondaryUtilities>
```

---

# 25. Referensi Pola Industri

Pola desain ini sejalan dengan pendekatan yang ditemukan pada aplikasi enterprise seperti:

* Salesforce Lightning Experience
* Workday
* Jira / Atlassian
* SAP Fiori
* ServiceNow

Namun referensi tersebut digunakan sebagai **benchmark pola usability**, bukan sebagai instruksi untuk menyalin struktur atau implementasi produknya.

Prinsip yang diambil:

```text
Consistent shell
+
Context-aware content
+
Permission-aware actions
+
Adaptive information density
+
Unified user experience
```

---

# 26. Aturan UX yang Harus Dikunci

### LOCK

```text
1. Satu /beranda untuk seluruh user.
2. Tidak ada dashboard terpisah hanya berdasarkan role.
3. Visual shell universal.
4. Identity tetap konsisten.
5. Capability menentukan eligibility informasi/action.
6. Assignment memberikan konteks pekerjaan.
7. Scope membatasi data.
8. Backend merupakan authority authorization.
9. Frontend hanya melakukan presentation.
10. Multi-assignment dikonsolidasikan dalam satu Beranda.
11. Context filter hanya merupakan mekanisme UX.
12. Data sensitif tetap tunduk pada backend authorization.
```

---

# 27. Hal yang Tidak Dikunci sebagai SSoT

Jangan membakukan secara permanen:

```text
65:35 column ratio
4 metric cards
jumlah widget
warna badge
urutan setiap widget
ukuran card
breakpoint tertentu
```

Hal tersebut merupakan:

```text
UX / visual design decision
```

yang dapat divalidasi melalui usability testing.

Kontrak SSoT harus mengunci **perilaku dan prinsip**, bukan setiap angka visual.

---

# 28. Anti-Pattern yang Harus Dicegah

### Anti-pattern 1 — Role Dashboard

```text
Role → Dashboard berbeda
```

### Anti-pattern 2 — Boolean Role Explosion

```text
isGuru
isWali
isBK
isAdmin
isKamad
isTU
...
```

### Anti-pattern 3 — Frontend Authorization

```text
Frontend hide → dianggap security
```

### Anti-pattern 4 — Dashboard sebagai SSoT

```text
Dashboard → menentukan permission
```

### Anti-pattern 5 — Role Switching untuk pekerjaan biasa

```text
Guru Mode
BK Mode
Wali Mode
```

### Anti-pattern 6 — Widget Dumping

```text
Semua capability → semua widget
```

### Anti-pattern 7 — Empty Slot Decoration

```text
[Widget]
[Widget]
[Widget]
[Empty]
```

hanya demi mempertahankan jumlah card.

---

# 29. Definition of Done

Implementasi Beranda dianggap sesuai kontrak apabila:

```text
[ ] Semua user menggunakan /beranda.
[ ] Tidak terdapat dashboard terpisah berdasarkan role.
[ ] Layout hierarchy tetap konsisten.
[ ] Assignment tidak menyebabkan role switching.
[ ] Capability menentukan widget eligibility.
[ ] Scope menentukan data yang ditampilkan.
[ ] Backend tetap menjadi authority authorization.
[ ] Frontend tidak menggunakan role sebagai security boundary.
[ ] User multi-assignment dapat melihat pekerjaan relevan dalam satu Beranda.
[ ] Context filter tidak mengubah authorization.
[ ] Badge hanya digunakan ketika konteks diperlukan.
[ ] Data sensitif tidak bocor melalui widget.
[ ] Widget tidak menghasilkan area kosong yang mengganggu.
[ ] Layout responsif terhadap jumlah content.
[ ] Penambahan role baru tidak memerlukan dashboard baru.
[ ] Penambahan capability baru dapat dipetakan ke widget/action yang relevan.
```

---

# 30. Keputusan Arsitektur Final

Model Beranda SIM-Madrasah Terpadu ditetapkan sebagai:

```text
                         USER
                           │
                           ▼
                    ┌─────────────┐
                    │  IDENTITY   │
                    └──────┬──────┘
                           │
               ┌───────────┴───────────┐
               ▼                       ▼
          ASSIGNMENT              CAPABILITY
               │                       │
               └───────────┬───────────┘
                           ▼
                         SCOPE
                           │
                           ▼
                 RELEVANCE + PRIORITY
                           │
                           ▼
                     /BERANDA
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
            METRICS      WORK        ACTIONS
              │            │            │
              └────────────┼────────────┘
                           ▼
                   ADAPTIVE CONTENT
```

### Prinsip final

> **Beranda adalah satu pengalaman universal untuk seluruh pengguna, bukan satu kumpulan informasi universal.**

> **Identity menentukan siapa pengguna; assignment menjelaskan konteks penugasannya; capability menentukan kemampuan; scope menentukan batas data; relevance dan priority menentukan apa yang dipresentasikan terlebih dahulu.**

Dengan kontrak ini, **UI tidak perlu berubah ketika role bertambah**, selama role/assignment baru dapat dipetakan ke capability, scope, dan kebutuhan presentasi yang sudah tersedia. Jika benar-benar muncul kebutuhan informasi baru, yang ditambahkan adalah **capability/domain widget**, bukan otomatis membuat **dashboard baru**.
