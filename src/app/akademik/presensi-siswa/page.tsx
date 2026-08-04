"use client";

import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isGuruBk, isWaliKelas, isPembinaEkstrakurikuler, isPengajar } from "@/lib/access";
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
import { DataTable } from "@/components/ui/data-table";
import { services } from "@/services";
import type { Rombel, SesiTatapMuka, AnggotaRombel, Siswa, JadwalPelajaran, AbsensiSiswa } from "@/types";

function PresensiSiswaContent() {
  const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth();
  const { version, bump } = useDataVersion();
  const searchParams = useSearchParams();

  const initRombel = searchParams.get("rombel") ?? "";
  const initTanggal = searchParams.get("tanggal") ?? new Date().toISOString().slice(0, 10);
  const initSesi = searchParams.get("sesi") ?? "";

  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [jadwals, setJadwals] = useState<JadwalPelajaran[]>([]);
  
  const [selectedRombel, setSelectedRombel] = useState(initRombel);
  const [tanggal, setTanggal] = useState(initTanggal);
  const [sessions, setSessions] = useState<SesiTatapMuka[]>([]);
  const [selectedSesi, setSelectedSesi] = useState<SesiTatapMuka | null>(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const [students, setStudents] = useState<{ id_siswa: string; nama: string; status: AbsensiSiswa["status"]; catatan: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    Promise.all([
      services.referensi.getRombel(),
      services.jadwal.getAll()
    ]).then(([allRombel, allJadwal]) => {
      const myJadwalRombelIds = new Set(allJadwal.filter(j => j.id_pegawai === currentUser.id_pegawai).map(j => j.id_rombel));
      const allowed = allRombel.filter(r => r.id_wali_kelas === currentUser.id_pegawai || myJadwalRombelIds.has(r.id_rombel));
      setRombels(allowed);
      setJadwals(allJadwal);
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
             if (s) setSelectedSesi(s);
             else setSelectedSesi(null);
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
      // Load siswa for this rombel
      Promise.all([
        services.keanggotaan.getAnggotaAktif({ id_rombel: selectedRombel }),
        services.siswa.getAll()
      ]).then(([anggota, allSiswa]) => {
        const activeIds = anggota.map((a: AnggotaRombel) => a.id_siswa);
        const rombelSiswa = allSiswa.filter((s: Siswa) => activeIds.includes(s.id_siswa));
        
        setStudents(rombelSiswa.map((s: Siswa) => ({
          id_siswa: s.id_siswa,
          nama: s.nama_lengkap,
          status: "Hadir",
          catatan: ""
        })));
      });
    } else {
      setStudents([]);
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
        absensiInput
      );
      
      setSuccess(`Berhasil dicatat! Status kehadiran Anda: ${updatedSesi.status_kehadiran_guru}`);
      bump();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!(currentUser && isWaliKelas(currentUser.id_pegawai, rombelList)) && (currentUser?.tugas_utama !== "Guru")) {
    return (
      <AppShell title="Presensi Siswa (Sesi)">
        <ErrorBlock message="Halaman ini khusus untuk Wali Kelas dan Guru Mapel." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Presensi Siswa per Sesi">
      <PageHeader
        title="Input Presensi Sesi Tatap Muka"
        description="Pilih rombel dan tanggal, lalu pilih sesi untuk memasukkan daftar hadir siswa."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SurfaceCard className="md:col-span-1" title="Pilih Sesi">
          <div className="space-y-4">
            <Field label="Tanggal">
              <input type="date" className={inputClass} value={tanggal} onChange={e => setTanggal(e.target.value)} />
            </Field>
            <Field label="Rombel">
              <select className={inputClass} value={selectedRombel} onChange={e => setSelectedRombel(e.target.value)}>
                <option value="">-- Pilih Rombel --</option>
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
                    const isSelected = selectedSesi?.id_sesi === s.id_sesi;
                    return (
                      <button
                        key={s.id_sesi}
                        type="button"
                        onClick={() => setSelectedSesi(s)}
                        className={`w-full text-left p-2 rounded border text-sm ${isSelected ? 'border-primary bg-primary-soft' : 'border-border hover:bg-paper'}`}
                      >
                        <div className="font-semibold">{j ? `${j.jam_mulai} - ${j.jam_selesai}` : 'Jadwal ?'}</div>
                        <div className="text-xs text-muted mt-1 flex justify-between items-center">
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
              <p className="text-sm text-muted">Tidak ada jadwal untuk rombel ini di hari terpilih.</p>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard className="md:col-span-2" title="Form Presensi">
          {!selectedSesi ? (
            <p className="text-sm text-muted">Pilih sesi tatap muka terlebih dahulu.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <ErrorBlock message={error} />}
              {success && (
                <div className="p-3 bg-primary-soft border border-primary/30 rounded text-primary text-sm font-semibold">
                  {success}
                </div>
              )}
              
              <div className="overflow-x-auto border border-border rounded">
                <table className="w-full text-sm text-left">
                  <thead className="bg-paper text-muted uppercase text-xs">
                    <tr>
                      <th className="p-3">Nama Siswa</th>
                      <th className="p-3">Kehadiran</th>
                      <th className="p-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {students.map((s, idx) => (
                      <tr key={s.id_siswa} className="bg-surface hover:bg-paper/50">
                        <td className="p-3 font-medium">{s.nama}</td>
                        <td className="p-3">
                          <select
                            className={inputClass}
                            value={s.status}
                            onChange={(e) => {
                              const newStudents = [...students];
                              newStudents[idx].status = e.target.value as AbsensiSiswa["status"];
                              setStudents(newStudents);
                            }}
                          >
                            <option value="Hadir">Hadir</option>
                            <option value="Sakit">Sakit</option>
                            <option value="Izin">Izin</option>
                            <option value="Alpa">Alpa</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            className={inputClass}
                            placeholder="Opsional"
                            value={s.catatan}
                            onChange={(e) => {
                              const newStudents = [...students];
                              newStudents[idx].catatan = e.target.value;
                              setStudents(newStudents);
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end">
                <PrimaryButton type="submit" disabled={loading || students.length === 0}>
                  {loading ? "Menyimpan..." : "Simpan Presensi Sesi"}
                </PrimaryButton>
              </div>
            </form>
          )}
        </SurfaceCard>
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
