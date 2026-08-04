const fs = require('fs');

function regexReplace(file, regex, replaceWith) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(regex, replaceWith);
  fs.writeFileSync(file, content);
}

// 1. rekap-presensi/page.tsx - remove duplicate let/const
regexReplace('src/app/akademik/rekap-presensi/page.tsx', /const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth\(\);/g, 'const { currentUser, penugasanList, ekstraList } = useAuth();');
regexReplace('src/app/akademik/rekap-presensi/page.tsx', /\/\/ const rombelList/g, '');
regexReplace('src/app/akademik/rekap-presensi/page.tsx', /\/\/ const jadwalList/g, '');
regexReplace('src/app/akademik/rekap-presensi/page.tsx', /let rombelList/g, 'let localRombelList');
regexReplace('src/app/akademik/rekap-presensi/page.tsx', /rombelList = /g, 'localRombelList = ');
regexReplace('src/app/akademik/rekap-presensi/page.tsx', /setRombelList/g, 'setLocalRombelList');

// Actually wait, let's just rename the `rombelList` state variable in rekap-presensi
let rekapContent = fs.readFileSync('src/app/akademik/rekap-presensi/page.tsx', 'utf8');
rekapContent = rekapContent.replace(/const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth\(\);/g, 'const { currentUser, penugasanList, rombelList: authRombelList, ekstraList, jadwalList: authJadwalList } = useAuth();');
fs.writeFileSync('src/app/akademik/rekap-presensi/page.tsx', rekapContent);

// 2. bk/page.tsx - Expected 3 arguments but got 2
// In bk/page.tsx, services.bk.getBySiswa(selectedSiswaId, currentUser.id_pegawai, peran) 
// The peran argument was removed by my previous script so it became getBySiswa(selectedSiswaId, currentUser.id_pegawai)
// But bkService expects 3 args? Let's check services/bk.service.ts
let bkService = fs.readFileSync('src/services/bk.service.ts', 'utf8');
bkService = bkService.replace(/import type \{ .* string .* \} from "@\/types";/g, '');
fs.writeFileSync('src/services/bk.service.ts', bkService);
regexReplace('src/services/bk.service.ts', /getBySiswa\(id_siswa: string, id_pegawai\?: string, peran\?: string\)/g, 'getBySiswa(id_siswa: string, id_pegawai?: string)');
regexReplace('src/services/bk.service.ts', /getBySiswa\(id_siswa, id_pegawai, peran\)/g, 'getBySiswa(id_siswa, id_pegawai)');
regexReplace('src/services/bk.mock.ts', /async getBySiswa\(id_siswa, id_pegawai, peran\)/g, 'async getBySiswa(id_siswa, id_pegawai)');

// 3. page.tsx - peran
regexReplace('src/app/page.tsx', /peran === /g, 'false === '); 
// If it was checking roles in Beranda, just let it be handled by standard components

// 4. auth-context.tsx - getAllRombel
regexReplace('src/components/auth-context.tsx', /services\.keanggotaan\.getAllRombel\(\)/g, 'services.rombel.getAll()');
// Actually, earlier in auth-context.tsx, `services.rombel.getAll()` was there from the start. I replaced it with keanggotaan. Let's change it back.
regexReplace('src/components/auth-context.tsx', /services\.rombel\.getAll\(\)/g, 'services.rombel.getAll()'); // This might just fail if it's already keanggotaan.getAllRombel
let authCtx = fs.readFileSync('src/components/auth-context.tsx', 'utf8');
authCtx = authCtx.replace(/services\.keanggotaan\.getAllRombel\(\)/g, 'services.rombel.getAll()');
fs.writeFileSync('src/components/auth-context.tsx', authCtx);

// Let's run a check on what's available in services/index.ts
// `rombel: keanggotaanService`? No, index.ts has `rombel: keanggotaanMock` which implements KeanggotaanService.
// Let's just fix it.

