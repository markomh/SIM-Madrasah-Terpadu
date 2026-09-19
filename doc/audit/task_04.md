ROLE
Senior Frontend Architect, Design System Architect, dan UI Platform Engineer.

OBJECTIVE

Lakukan audit menyeluruh terhadap seluruh frontend untuk memastikan seluruh UI dibangun menggunakan Design System yang lengkap, reusable, dan bebas dari business logic.

Jangan langsung membuat komponen baru.

Ikuti tahapan audit berikut.

==================================================
PHASE 1 — INVENTORY
==================================================

Scan seluruh codebase.

Identifikasi seluruh komponen yang ada.

Kelompokkan menjadi:

1. UI Primitive
2. Composite UI
3. Business Component
4. Page Component
5. Layout Component

Tampilkan hasil seperti:

UI Primitive
- Button
- Card
- Input
- Badge
...

Composite
- SearchBar
- FilterPanel
- DataTable
...

Business
- StudentCard
- TeacherCard
- AttendanceCard
...

Page
- Dashboard
- StudentPage
...

==================================================
PHASE 2 — DUPLICATE DETECTION
==================================================

Cari primitive yang sebenarnya sama tetapi dibuat berkali-kali.

Contoh

PrimaryButton
SecondaryButton
DangerButton

padahal cukup

<Button variant="primary" />

atau

StudentBadge
TeacherBadge
StatusBadge

padahal cukup

<Badge />

Laporkan seluruh duplicate.

==================================================
PHASE 3 — MISSING PRIMITIVE
==================================================

Cari primitive yang belum ada.

Misalnya

□ Avatar

□ EmptyState

□ ErrorState

□ LoadingState

□ Skeleton

□ Tooltip

□ Popover

□ Drawer

□ Accordion

□ Timeline

□ Statistic

□ DescriptionList

□ DatePicker

□ TimePicker

□ NumberInput

□ CurrencyInput

□ OTPInput

□ PasswordInput

□ ConfirmDialog

□ SearchInput

□ CommandPalette

□ Pagination

□ Breadcrumb

□ Tabs

□ Stepper

□ Progress

□ Spinner

□ Toast

□ Alert

□ Divider

□ ScrollArea

□ ResizablePanel

□ SplitPane

□ TreeView

□ ContextMenu

□ Dropdown

□ FloatingActionButton

□ KeyboardShortcut

Tambahkan apabila ada primitive lain yang umum dipakai pada enterprise dashboard.

==================================================
PHASE 4 — USAGE ANALYSIS
==================================================

Untuk setiap primitive tampilkan

Nama

Jumlah penggunaan

File penggunaan

Masih dipakai?

Sudah obsolete?

Masih duplicate?

==================================================
PHASE 5 — DESIGN SYSTEM COMPLIANCE
==================================================

Pastikan seluruh primitive

✓ Stateless

✓ Reusable

✓ Tidak mengenal domain bisnis

✓ Tidak memiliki logic siswa

✓ Tidak memiliki logic guru

✓ Tidak memiliki logic madrasah

✓ Tidak memiliki logic akademik

✓ Tidak memiliki logic keuangan

✓ Tidak melakukan fetch data

✓ Tidak membaca database

✓ Tidak membaca context bisnis

==================================================
PHASE 6 — API CONSISTENCY
==================================================

Pastikan seluruh primitive memiliki API yang konsisten.

Contoh

<Button

variant

size

color

loading

disabled

iconLeft

iconRight

fullWidth

/>

Input

value

onChange

placeholder

error

helperText

disabled

required

startIcon

endIcon

==================================================
PHASE 7 — TOKEN COMPLIANCE
==================================================

Pastikan seluruh primitive menggunakan token Design System.

Dilarang

hardcoded color

hardcoded spacing

hardcoded radius

hardcoded font

hardcoded shadow

Gunakan token global.

==================================================
PHASE 8 — GENERATION PLAN
==================================================

JANGAN membuat kode terlebih dahulu.

Buat roadmap:

Primitive yang sudah lengkap

Primitive yang perlu refactor

Primitive yang perlu digabung

Primitive yang perlu dibuat baru

Urutkan berdasarkan prioritas.

==================================================
OUTPUT
==================================================

1. Primitive Inventory

2. Missing Primitive

3. Duplicate Primitive

4. Obsolete Primitive

5. API Inconsistency

6. Design System Violation

7. Priority Roadmap

8. Dependency Map

9. Estimasi pekerjaan

Jangan menulis kode sebelum audit selesai.

---

ROLE
Senior Frontend Architect & Design System QA Auditor.

TASK

Audit seluruh codebase frontend untuk memastikan UI menggunakan Design System yang konsisten.

## Langkah Audit

1. Inventaris seluruh komponen.
Kelompokkan menjadi:
- UI Primitive
- Composite Component
- Business Component
- Layout
- Page

2. Identifikasi:
- Primitive yang sudah ada
- Primitive yang hilang
- Primitive yang duplikat
- Primitive yang tidak digunakan
- Primitive yang mengandung business logic (tidak boleh)

3. Pastikan seluruh UI Primitive:
- Reusable
- Stateless
- Tidak mengenal domain bisnis
- Menggunakan Design Token
- Memiliki API yang konsisten

4. Telusuri seluruh halaman dan catat komponen yang masih:
- Menggunakan HTML/Tailwind langsung
- Belum memakai Primitive
- Membuat UI ad-hoc
- Melanggar Design System

## Output

### UI Primitive
- Sudah ada
- Belum ada

### Composite Component

### Business Component

### Design System Violation

### Prioritas Refactor
- Critical
- High
- Medium
- Low

Jangan membuat kode.
Fokus hanya pada audit dan roadmap refactor.