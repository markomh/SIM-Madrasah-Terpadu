const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const targetFiles = [];
walkDir(path.join(__dirname, 'src/app'), (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    targetFiles.push(filePath);
  }
});

for (const file of targetFiles) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('peran')) {
    // Add access imports if it uses useAuth
    if (content.includes('useAuth') && !content.includes('lib/access')) {
      content = 'import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isGuruBk, isWaliKelas, isPembinaEkstrakurikuler, isPengajar } from "@/lib/access";\n' + content;
    }
    
    // Destructure new auth context
    content = content.replace(/const \{ peran(,\s*currentUser)? \} = useAuth\(\);/g, 'const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth();');
    content = content.replace(/const \{ currentUser(,\s*peran)? \} = useAuth\(\);/g, 'const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth();');
    content = content.replace(/const \{ peran \} = useAuth\(\);/g, 'const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth();');
    
    // Replace condition checks
    content = content.replace(/peran === "Admin Madrasah"/g, '(currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList))');
    content = content.replace(/peran !== "Admin Madrasah"/g, '!(currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList))');
    
    content = content.replace(/peran === "Kepala Madrasah"/g, '(currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList))');
    content = content.replace(/peran !== "Kepala Madrasah"/g, '!(currentUser && isKepalaMadrasah(currentUser.id_pegawai, penugasanList))');
    
    content = content.replace(/peran === "Operator Kesiswaan"/g, '(currentUser && isOperatorKesiswaan(currentUser.id_pegawai, penugasanList))');
    content = content.replace(/peran !== "Operator Kesiswaan"/g, '!(currentUser && isOperatorKesiswaan(currentUser.id_pegawai, penugasanList))');
    
    content = content.replace(/peran === "Guru BK"/g, '(currentUser && isGuruBk(currentUser.id_pegawai, penugasanList))');
    content = content.replace(/peran !== "Guru BK"/g, '!(currentUser && isGuruBk(currentUser.id_pegawai, penugasanList))');
    
    content = content.replace(/peran === "Wali Kelas"/g, '(currentUser && isWaliKelas(currentUser.id_pegawai, rombelList))');
    content = content.replace(/peran !== "Wali Kelas"/g, '!(currentUser && isWaliKelas(currentUser.id_pegawai, rombelList))');
    
    content = content.replace(/peran === "Pembina Ekstrakurikuler"/g, '(currentUser && isPembinaEkstrakurikuler(currentUser.id_pegawai, ekstraList))');
    content = content.replace(/peran !== "Pembina Ekstrakurikuler"/g, '!(currentUser && isPembinaEkstrakurikuler(currentUser.id_pegawai, ekstraList))');
    
    content = content.replace(/peran === "Guru Mapel"/g, '(currentUser?.tugas_utama === "Guru")');
    content = content.replace(/peran !== "Guru Mapel"/g, '(currentUser?.tugas_utama !== "Guru")');
    
    content = content.replace(/peran === "Orang Tua Wali"/g, '(currentUser?.tugas_utama === "Tendik")'); // Orang Tua mapping workaround for now
    content = content.replace(/peran !== "Orang Tua Wali"/g, '(currentUser?.tugas_utama !== "Tendik")');
    
    content = content.replace(/currentUser\.peran/g, 'currentUser?.tugas_utama');
    content = content.replace(/p\.peran/g, 'p.tugas_utama');

    fs.writeFileSync(file, content);
  }
}
console.log('Refactor complete');
