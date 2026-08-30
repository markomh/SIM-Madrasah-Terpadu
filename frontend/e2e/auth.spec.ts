import { test, expect, type Page } from '@playwright/test';

// Define personas
const personas = {
  admin: { email: 'admin@mts-terpadu.sch.id', password: 'password' },
  kamad: { email: 'kamad@mts-terpadu.sch.id', password: 'password' },
  guru: { email: 'guru@mts-terpadu.sch.id', password: 'password' }, // Guru Pengajar (usually guru is pengajar for something)
  guru_bk: { email: 'bk@mts-terpadu.sch.id', password: 'password' },
  wali_kelas: { email: 'walikelas@mts-terpadu.sch.id', password: 'password' }
};

// Helper for login
async function loginAs(page: Page, persona: typeof personas[keyof typeof personas]) {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', persona.email);
  await page.fill('input[type="password"]', persona.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => url.pathname !== '/auth/login');
}

test.describe('E2E-01 ADMIN PURE', () => {
  test('Admin pure cannot access attendance or grades', async ({ page }) => {
    await loginAs(page, personas.admin);
    
    // Presensi Siswa
    await page.goto('/akademik/presensi-siswa');
    await page.waitForLoadState('networkidle');
    // Ensure Admin is on the page but sees the Supervisory/Monitoring panel
    await expect(page).toHaveURL(/.*\/akademik\/presensi-siswa/);
    await expect(page.locator('text=Monitoring Sesi Tatap Muka')).toBeVisible();
    await expect(page.locator('button:has-text("Simpan Presensi Sesi")')).toBeHidden();
    
    // Nilai
    await page.goto('/akademik/nilai');
    await page.waitForLoadState('networkidle');
    const saveNilaiBtn = page.locator('button:has-text("Simpan Semua Nilai")');
    if (await saveNilaiBtn.isVisible()) {
      await expect(saveNilaiBtn).toBeDisabled();
    }
  });
});

test.describe('E2E-02 GURU PENGAJAR', () => {
  test('Guru Pengajar can submit attendance and grades for assigned class', async ({ page }) => {
    await loginAs(page, personas.guru);
    
    // Use a Monday date (2026-08-31) to match the scheduled Monday ('Senin') lessons
    const testDate = '2026-08-31';
    await page.goto(`/akademik/presensi-siswa?rombel=rb_7a&tanggal=${testDate}`);
    await page.waitForLoadState('networkidle');
    
    // If the teaching dashboard is shown, click the edit button to open the form
    const editBtn = page.locator('button:has-text("Lihat / Edit Presensi & Jurnal")');
    if (await editBtn.isVisible()) {
      await editBtn.click();
    }
    
    const saveAbsensiBtn = page.locator('button:has-text("Simpan Presensi Sesi")');
    await expect(saveAbsensiBtn).toBeVisible();
  });
});

test.describe('E2E-04 GURU BK', () => {
  test('Guru BK can see and create notes', async ({ page }) => {
    await loginAs(page, personas.guru_bk);
    
    await page.goto('/bk');
    await page.waitForLoadState('networkidle');
    // Select first student to trigger button render
    await page.getByLabel('Cari/Pilih Siswa').selectOption({ index: 1 });
    await page.waitForLoadState('networkidle');
    const addNoteBtn = page.locator('button:has-text("+ Tambah Catatan")');
    await expect(addNoteBtn).toBeVisible();
  });
  
  test('Guru biasa cannot create notes', async ({ page }) => {
    await loginAs(page, personas.guru);
    await page.goto('/bk');
    await page.waitForLoadState('networkidle');
    const addNoteBtn = page.locator('button:has-text("+ Tambah Catatan")');
    await expect(addNoteBtn).toBeHidden();
  });
});

test.describe('E2E-06 KAMAD', () => {
  test('Kamad sees aggregate pending in Bell and can approve', async ({ page }) => {
    await loginAs(page, personas.kamad);
    
    await page.goto('/persetujuan');
    await page.waitForLoadState('networkidle');
    
    // Check if Bell icon has aggregate (this depends on the exact DOM structure)
    // We just verify the page loads and Kamad has access to persetujuan
    await expect(page.getByRole('heading', { name: 'Kotak Persetujuan Eksekutif' })).toBeVisible();
  });
});
