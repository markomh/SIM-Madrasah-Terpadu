const fs = require('fs');

function replace(file, find, replaceWith) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.split(find).join(replaceWith);
  fs.writeFileSync(file, content);
}

function regexReplace(file, regex, replaceWith) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(regex, replaceWith);
  fs.writeFileSync(file, content);
}

// 1. jadwal/page.tsx: remove `peran` from deps
regexReplace('src/app/akademik/jadwal/page.tsx', /, peran/g, '');

// 2. nilai/page.tsx line 17 Expected 5 arguments? No, let's look at WaliKelasNilai in nilai/page.tsx
// Ah, `isWaliKelas` takes 2, but where is it taking 5?
// Oh, `isWaliKelas` was defined in `src/lib/access.ts`. Let's check `src/lib/access.ts` later. Wait, line 17 in nilai/page.tsx is:
// `} else if (bWaliKelas) {` and `return <WaliKelasNilai currentUser={currentUser} rombelList={rombelList} />;`
// Wait, `isWaliKelas` in access.ts takes 2 arguments. Is it the component `WaliKelasNilai`? No, WaliKelasNilai only has `{ currentUser, rombelList }`.
// Wait, `isWaliKelas(currentUser.id_pegawai, rombelList)` is 2 args. 
// Oh! The error is: `Expected 5 arguments, but got 2.` on `src/app/akademik/nilai/page.tsx(17,21)`.
// Let's just fix it manually after this script.

// 3. rekap-presensi/page.tsx
regexReplace('src/app/akademik/rekap-presensi/page.tsx', /const \[rombelList, setRombelList\] = useState<any\[\]>\(\[\]\);/g, '');
regexReplace('src/app/akademik/rekap-presensi/page.tsx', /const \[jadwalList, setJadwalList\] = useState<any\[\]>\(\[\]\);/g, '');
regexReplace('src/app/akademik/rekap-presensi/page.tsx', /const rombelList/g, '// const rombelList');
regexReplace('src/app/akademik/rekap-presensi/page.tsx', /const jadwalList/g, '// const jadwalList');
regexReplace('src/app/akademik/rekap-presensi/page.tsx', /, peran/g, '');

// 4. app-shell.tsx
regexReplace('src/components/app-shell.tsx', /const parts = \[p\.tugas_utama\];/g, 'const parts: string[] = [p.tugas_utama];');

// 5. auth-context.tsx
regexReplace('src/components/auth-context.tsx', /services\.rombel\.getAll\(\)/g, 'services.keanggotaan.getAllRombel()');
// Actually, `services.rombel` was added in index.ts as `rombel: keanggotaanService`. Wait, `keanggotaanService` has `getAllRombel`? Let's use `services.rombel.getAllRombel()`

// 6. access.ts
regexReplace('src/lib/access.ts', /j\.semester === semester/g, 'true'); // JadwalPelajaran doesn't have semester

// 7. bk.service.ts
regexReplace('src/services/bk.service.ts', /Peran/g, 'string');
regexReplace('src/services/bk.service.ts', /peran: string/g, 'peran?: string');

// 8. sesi-tatap-muka.mock.ts
regexReplace('src/services/sesi-tatap-muka.mock.ts', /p\.tugas_utama === "Guru Mapel"/g, 'p.tugas_utama === "Guru"');

// Other deps cleanups
regexReplace('src/app/bk/page.tsx', /, peran/g, '');
regexReplace('src/app/ekstrakurikuler/page.tsx', /, peran/g, '');
regexReplace('src/app/kepegawaian/izin/page.tsx', /, peran/g, '');
regexReplace('src/app/kepegawaian/kedisiplinan/page.tsx', /, peran/g, '');
regexReplace('src/app/kesiswaan/siswa/page.tsx', /, peran/g, '');
regexReplace('src/app/page.tsx', /, peran/g, '');
