"use client";

import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isGuruBk, isWaliKelas, isPembinaEkstrakurikuler, isPengajarAktif } from "@/lib/access";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useDataVersion } from "@/components/app-providers";
import {
  ErrorBlock,
  PageHeader,
  PrimaryButton,
  SurfaceCard,
  Field,
  inputClass,
  StatusBadge,
  LoadingBlock,
} from "@/components/ui/primitives";
import { services } from "@/services";
import type { Rombel, SesiTatapMuka, AnggotaRombel, Siswa, JadwalPelajaran, AbsensiSiswa, MataPelajaran } from "@/types";

function ActiveTeachingDashboard({ 
  sesi, 
  jadwal, 
  mapel, 
  onEdit 
}: { 
  sesi: SesiTatapMuka; 
  jadwal: JadwalPelajaran; 
  mapel?: MataPelajaran;
  onEdit: () => void;
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Parse time
  const [startHour, startMin] = jadwal.jam_mulai.split(":").map(Number);
  const [endHour, endMin] = jadwal.jam_selesai.split(":").map(Number);
  
  const startTime = new Date(sesi.tanggal);
  startTime.setHours(startHour, startMin, 0, 0);
  
  const endTime = new Date(sesi.tanggal);
  endTime.setHours(endHour, endMin, 0, 0);

  const totalMs = endTime.getTime() - startTime.getTime();
  const elapsedMs = now.getTime() - startTime.getTime();
  const remainingMs = endTime.getTime() - now.getTime();

  const isFuture = now < startTime;
  const isFinished = now > endTime;

  let progress = 0;
  if (isFinished) progress = 100;
  else if (!isFuture) progress = (elapsedMs / totalMs) * 100;

  // Formatting remaining time
  const remainingMins = Math.max(0, Math.floor(remainingMs / 60000));
  const remainingSecs = Math.max(0, Math.floor((remainingMs % 60000) / 1000));

  let statusText = "";
  let barColor = "bg-primary";
  let pulse = false;

  if (isFuture) {
    statusText = "Sesi Belum Dimulai";
    barColor = "bg-muted";
  } else if (isFinished) {
    statusText = "Sesi Selesai - Waktunya Pergantian Jam";
    barColor = "bg-muted/80";
  } else {
    statusText = `${remainingMins} Menit ${remainingSecs} Detik Tersisa`;
    if (remainingMins < 5) {
      barColor = "bg-amber";
      pulse = true;
    }
  }

  return (
    <SurfaceCard className="flex flex-col items-center text-center space-y-6 p-6">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-ink">Mode Sesi Mengajar Aktif</h3>
        <p className="text-sm text-muted">
          {jadwal.jam_mulai} - {jadwal.jam_selesai} • <span className="font-semibold text-primary">{mapel?.nama_mapel ?? "Mata Pelajaran"}</span>
        </p>
      </div>

      <div className="w-full max-w-md space-y-2">
        <div className="flex justify-between text-sm font-medium">
          <span className="text-muted">{jadwal.jam_mulai}</span>
          <span className={`font-bold ${pulse ? 'text-amber animate-pulse' : 'text-ink'}`}>
            {statusText}
          </span>
          <span className="text-muted">{jadwal.jam_selesai}</span>
        </div>
        <div className="h-4 w-full bg-paper rounded-full overflow-hidden border border-border/50">
          <div 
            className={`h-full transition-all duration-1000 ease-linear ${barColor}`} 
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} 
          />
        </div>
      </div>

      <div className="pt-4 flex gap-4 text-sm w-full max-w-md justify-center">
        <div className="px-4 py-2 bg-paper rounded border border-border flex-1 text-center">
          <p className="text-muted text-xs">Waktu Input Presensi</p>
          <p className="font-semibold text-ink">{sesi.waktu_input ? new Date(sesi.waktu_input).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
        </div>
        <div className="px-4 py-2 bg-paper rounded border border-border flex-1 text-center">
          <p className="text-muted text-xs">Status Kehadiran Anda</p>
          <p className="font-semibold text-primary">{sesi.status_kehadiran_guru}</p>
        </div>
      </div>

      <div className="pt-2">
        <PrimaryButton type="button" onClick={onEdit}>
          Edit Presensi / Jurnal Sesi
        </PrimaryButton>
      </div>
    </SurfaceCard>
  );
}

function PresensiSiswaContent() {
  const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth();
  const { version, bump } = useDataVersion();
  const searchParams = useSearchParams();

  const initRombel = searchParams.get("rombel") ?? "";
  const initTanggal = searchParams.get("tanggal") ?? new Date().toISOString().slice(0, 10);
  const initSesi = searchParams.get("sesi") ?? "";

  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [jadwals, setJadwals] = useState<JadwalPelajaran[]>([]);
  const [mapels, setMapels] = useState<MataPelajaran[]>([]);
  
  const [selectedRombel, setSelectedRombel] = useState(initRombel);
  const [tanggal, setTanggal] = useState(initTanggal);
  const [sessions, setSessions] = useState<SesiTatapMuka[]>([]);
  const [selectedSesi, setSelectedSesi] = useState<SesiTatapMuka | null>(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const [students, setStudents] = useState<{ id_siswa: string; nama: string; nisn: string; status: AbsensiSiswa["status"]; catatan: string }[]>([]);
  const [materiJurnal, setMateriJurnal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(true);

  const isPengajar = currentUser ? isPengajarAktif(currentUser.id_pegawai, jadwalList) : false;
  const isWK = currentUser ? isWaliKelas(currentUser.id_pegawai, rombelList) : false;
  const canAccess = isPengajar || isWK;

  useEffect(() => {
    if (!currentUser) return;
    Promise.all([
      services.referensi.getRombel(),
      services.jadwal.getAll(),
      services.referensi.getMapel()
    ]).then(([allRombel, allJadwal, allMapel]) => {
      const myJadwalRombelIds = new Set(allJadwal.filter(j => j.id_pegawai === currentUser.id_pegawai).map(j => j.id_rombel));
      const allowed = allRombel.filter(r => r.id_wali_kelas === currentUser.id_pegawai || myJadwalRombelIds.has(r.id_rombel));
      setRombels(allowed);
      setJadwals(allJadwal);
      setMapels(allMapel);
    });
  }, [currentUser]);

  useEffect(() => {
    if (selectedRombel && tanggal) {
      setLoading(true);
      setError(null);
      services.sesiTatapMuka.getByRombelTanggal(selectedRombel, tanggal)
        .then(res => {
          setSessions(res);
          if (initSesi && !hasAutoSelected) {
             const s = res.find(x => x.id_sesi === initSesi);
             if (s) {
               setSelectedSesi(s);
               setIsEditing(s.status_kehadiran_guru === "Tidak Terlaksana");
             } else {
               setSelectedSesi(null);
             }
             setHasAutoSelected(true);
          } else {
             setSelectedSesi(null);
          }
          setStudents([]);
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setSessions([]);
      setSelectedSesi(null);
    }
  }, [selectedRombel, tanggal, version, initSesi, hasAutoSelected]);

  useEffect(() => {
    if (selectedSesi) {
      setMateriJurnal(selectedSesi.jurnal_materi ?? "");
      
      // Load siswa for this rombel
      Promise.all([
        services.keanggotaan.getAnggotaAktif({ id_rombel: selectedRombel }),
        services.siswa.getAll()
      ]).then(([anggota, allSiswa]) => {
        const activeIds = anggota.map((a: AnggotaRombel) => a.id_siswa);
        const rombelSiswa = allSiswa.filter((s: Siswa) => activeIds.includes(s.id_siswa));
        
        // Mock does not expose getAbsensiPerSesi directly yet, so we assume "Hadir"
        // as a smart default.
        setStudents(rombelSiswa.map((s: Siswa) => ({
          id_siswa: s.id_siswa,
          nama: s.nama_lengkap,
          nisn: s.nisn,
          status: "Hadir", // Smart default
          catatan: ""
        })));
      });
    } else {
      setStudents([]);
      setMateriJurnal("");
    }
  }, [selectedSesi, selectedRombel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSesi || !currentUser) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const absensiInput = students.map(s => ({
        id_siswa: s.id_siswa,
        id_rombel: selectedRombel,
        status: s.status,
        catatan: s.catatan || null
      }));
      
      const updatedSesi = await services.sesiTatapMuka.catatPresensi(
        selectedSesi.id_sesi,
        currentUser.id_pegawai,
        absensiInput,
        materiJurnal || null
      );
      
      setSuccess(`Berhasil dicatat! Status kehadiran Anda: ${updatedSesi.status_kehadiran_guru}`);
      setIsEditing(false);
      setSelectedSesi(updatedSesi);
      
      // Update sesi di list
      setSessions(prev => prev.map(s => s.id_sesi === updatedSesi.id_sesi ? updatedSesi : s));
      
      bump();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSesi = (s: SesiTatapMuka) => {
    setSelectedSesi(s);
    setIsEditing(s.status_kehadiran_guru === "Tidak Terlaksana");
    setSuccess(null);
    setError(null);
  };

  const toggleStudentStatus = (idx: number) => {
    const s = students[idx];
    let nextStatus: AbsensiSiswa["status"] = "Hadir";
    if (s.status === "Hadir") nextStatus = "Sakit";
    else if (s.status === "Sakit") nextStatus = "Izin";
    else if (s.status === "Izin") nextStatus = "Alpa";
    
    const newStudents = [...students];
    newStudents[idx].status = nextStatus;
    setStudents(newStudents);
  };

  const promptCatatan = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const s = students[idx];
    const cat = prompt(`Catatan khusus untuk ${s.nama}:`, s.catatan);
    if (cat !== null) {
      const newStudents = [...students];
      newStudents[idx].catatan = cat;
      setStudents(newStudents);
    }
  };

  if (!canAccess) {
    return (
      <AppShell title="Presensi Siswa (Sesi)">
        <ErrorBlock message="Halaman ini khusus untuk Wali Kelas dan Guru Mapel." />
      </AppShell>
    );
  }

  const selectedJadwal = jadwals.find(j => j.id_jadwal === selectedSesi?.id_jadwal);
  const selectedMapel = mapels.find(m => m.id_mapel === selectedJadwal?.id_mapel);

  return (
    <AppShell title="Presensi Siswa per Sesi">
      <PageHeader
        title="Input Presensi Sesi Tatap Muka"
        description="Pilih rombel dan tanggal, lalu klik kartu siswa untuk mengubah absensi secara instan."
      />

      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* Kolom Kiri: Pilih Sesi (Sticky) */}
        <SurfaceCard className="md:col-span-4 sticky top-6" title="Pilih Sesi">
          <div className="space-y-4">
            <Field label="Tanggal">
              <input type="date" className={inputClass} value={tanggal} onChange={e => setTanggal(e.target.value)} />
            </Field>
            <Field label="Rombel">
              <select className={inputClass} value={selectedRombel} onChange={e => setSelectedRombel(e.target.value)}>
                <option value="">— Pilih Rombel —</option>
                {rombels.map(r => (
                  <option key={r.id_rombel} value={r.id_rombel}>{r.nama_rombel}</option>
                ))}
              </select>
            </Field>
            
            {sessions.length > 0 && (
              <div className="pt-2">
                <p className="text-sm font-medium mb-2">Sesi Tersedia:</p>
                <div className="space-y-2">
                  {sessions.map(s => {
                    const j = jadwals.find(x => x.id_jadwal === s.id_jadwal);
                    const m = mapels.find(x => x.id_mapel === j?.id_mapel);
                    const isSelected = selectedSesi?.id_sesi === s.id_sesi;
                    return (
                      <button
                        key={s.id_sesi}
                        type="button"
                        onClick={() => handleSelectSesi(s)}
                        className={`w-full text-left p-3 rounded border text-sm transition-all shadow-sm ${isSelected ? 'border-primary bg-primary-soft scale-[1.02]' : 'border-border bg-surface hover:bg-paper hover:scale-[1.01]'}`}
                      >
                        <div className="font-bold text-ink">
                          {j ? `${j.jam_mulai} - ${j.jam_selesai}` : 'Jadwal ?'}
                        </div>
                        <div className="text-sm text-primary font-medium mt-1">
                           {m ? `${m.nama_mapel}` : ''}
                        </div>
                        <div className="text-xs text-muted mt-3 flex justify-between items-center border-t border-border/50 pt-2">
                          <span>{s.status_kehadiran_guru !== 'Tidak Terlaksana' ? 'Sudah Diinput' : 'Belum Diinput'}</span>
                          {s.status_kehadiran_guru !== 'Tidak Terlaksana' && <StatusBadge status={s.status_kehadiran_guru} />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            
            {loading && <div className="pt-2"><LoadingBlock label="Memuat sesi..." /></div>}
            
            {selectedRombel && tanggal && sessions.length === 0 && !loading && (
              <p className="text-sm text-muted bg-paper p-3 rounded border border-dashed border-border text-center">Tidak ada jadwal untuk rombel ini di hari terpilih.</p>
            )}
          </div>
        </SurfaceCard>

        {/* Kolom Kanan: Form / Dashboard */}
        <div className="md:col-span-8 space-y-6">
          {!selectedSesi ? (
            <SurfaceCard>
              <div className="p-8 text-center text-muted border border-dashed border-border rounded-lg">
                <p>Silakan pilih sesi di samping kiri untuk memulai.</p>
              </div>
            </SurfaceCard>
          ) : (
            <>
              {/* Dashboard Sesi Aktif */}
              {!isEditing && selectedJadwal && (
                <ActiveTeachingDashboard 
                  sesi={selectedSesi} 
                  jadwal={selectedJadwal} 
                  mapel={selectedMapel}
                  onEdit={() => setIsEditing(true)}
                />
              )}

              {/* Form Presensi */}
              {(isEditing || selectedSesi.status_kehadiran_guru === "Tidak Terlaksana") && (
                <SurfaceCard title={`Presensi: ${selectedMapel?.nama_mapel ?? "Mapel"} (${selectedJadwal?.jam_mulai})`}>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <ErrorBlock message={error} />}
                    {success && (
                      <div className="p-3 bg-primary-soft border border-primary/30 rounded text-primary text-sm font-semibold">
                        {success}
                      </div>
                    )}
                    
                    <div className="bg-paper p-3 rounded border border-border flex flex-wrap items-center justify-between text-sm gap-2">
                      <span className="font-semibold text-muted">Ketuk kartu untuk mengganti status kehadiran</span>
                      <div className="flex gap-3 text-xs font-bold">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Hadir</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Sakit</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Izin</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>Alpa</span>
                      </div>
                    </div>

                    {/* Grid Layout Siswa */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {students.map((s, idx) => {
                        let bgColor = "bg-emerald-50 border-emerald-200 text-emerald-900";
                        let dotColor = "bg-emerald-500";
                        
                        if (s.status === "Sakit") {
                          bgColor = "bg-blue-50 border-blue-200 text-blue-900";
                          dotColor = "bg-blue-500";
                        } else if (s.status === "Izin") {
                          bgColor = "bg-amber-50 border-amber-200 text-amber-900";
                          dotColor = "bg-amber-500";
                        } else if (s.status === "Alpa") {
                          bgColor = "bg-red-50 border-red-200 text-red-900";
                          dotColor = "bg-red-500";
                        }

                        return (
                          <div 
                            key={s.id_siswa} 
                            onClick={() => toggleStudentStatus(idx)}
                            className={`relative cursor-pointer rounded-lg border p-3 flex flex-col items-center justify-center text-center transition-all hover:shadow-md hover:scale-[1.02] active:scale-95 select-none h-24 ${bgColor}`}
                          >
                            <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${dotColor}`} />
                            <p className="font-bold text-sm leading-tight line-clamp-2">{s.nama}</p>
                            <p className="text-xs opacity-70 mt-1">{s.nisn}</p>
                            
                            {/* Tombol catatan khusus */}
                            <button 
                              type="button"
                              onClick={(e) => promptCatatan(idx, e)}
                              className="absolute bottom-1 right-1 p-1 text-[10px] opacity-50 hover:opacity-100 font-bold"
                              title="Tambah Catatan"
                            >
                              {s.catatan ? "📝" : "..."}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                    
                    <Field label="Jurnal / Materi Pembelajaran Hari Ini (Opsional)">
                      <textarea
                        className={`${inputClass} min-h-[80px] py-2`}
                        placeholder="Deskripsikan secara singkat materi atau aktivitas yang diajarkan pada sesi ini..."
                        value={materiJurnal}
                        onChange={(e) => setMateriJurnal(e.target.value)}
                      />
                    </Field>
                    
                    <div className="flex justify-end pt-4 border-t border-border">
                      <PrimaryButton type="submit" disabled={loading || students.length === 0}>
                        {loading ? "Menyimpan..." : "Simpan Presensi"}
                      </PrimaryButton>
                    </div>
                  </form>
                </SurfaceCard>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default function PresensiSiswaPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PresensiSiswaContent />
    </Suspense>
  );
}
