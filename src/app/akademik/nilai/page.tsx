"use client";

import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isGuruBk, isWaliKelas, isPembinaEkstrakurikuler, isPengajar } from "@/lib/access";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { PageHeader, SurfaceCard, LoadingBlock, ErrorBlock, Field, inputClass, PrimaryButton } from "@/components/ui/primitives";
import { services } from "@/services";
import type { Rombel, Siswa, MataPelajaran, JadwalPelajaran, TahunAjaran } from "@/types";
import type { KomponenNilai, NilaiSiswa } from "@/types/nilai";

export default function NilaiPage() {
  const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth();
  
  if (!currentUser) return null;

  const bPengajar = isPengajar(currentUser.id_pegawai, jadwalList);
  const bWaliKelas = isWaliKelas(currentUser.id_pegawai, rombelList);
  const bAdmin = isAdminMadrasah(currentUser.id_pegawai, penugasanList);

  if (bPengajar || bAdmin) {
    return <GuruMapelNilai currentUser={currentUser} penugasanList={penugasanList} />;
  } else if (bWaliKelas) {
    return <WaliKelasNilai currentUser={currentUser} rombelList={rombelList} />;
  }

  return (
    <AppShell title="Nilai Harian">
      <PageHeader title="Penilaian" description="Modul penilaian siswa" />
      <ErrorBlock message="Halaman ini khusus untuk Guru Mapel, Wali Kelas, dan Admin Madrasah." />
    </AppShell>
  );
}

function GuruMapelNilai({ currentUser, penugasanList }: { currentUser: any, penugasanList: any[] }) {
  const [jadwal, setJadwal] = useState<JadwalPelajaran[]>([]);
  const [rombelMap, setRombelMap] = useState<Record<string, Rombel>>({});
  const [mapelMap, setMapelMap] = useState<Record<string, MataPelajaran>>({});
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran | null>(null);
  
  const [selectedJadwalId, setSelectedJadwalId] = useState("");
  const [komponen, setKomponen] = useState<KomponenNilai[]>([]);
  const [siswa, setSiswa] = useState<(Siswa & { id_anggota: string })[]>([]);
  const [nilai, setNilai] = useState<NilaiSiswa[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load jadwal for current user
  useEffect(() => {
    let cancelled = false;
    if (!currentUser) return;
    
    setLoading(true);
    const filter = isAdminMadrasah(currentUser.id_pegawai, penugasanList) ? {} : { id_pegawai: currentUser.id_pegawai };
    
    Promise.all([
      services.jadwal.getAll(filter),
      services.referensi.getRombel(),
      services.referensi.getMapel(),
      services.referensi.getTahunAjaran(),
    ]).then(([jdw, rmb, mpl, thn]) => {
      if (cancelled) return;
      setJadwal(jdw);
      
      const rMap: Record<string, Rombel> = {};
      rmb.forEach(r => rMap[r.id_rombel] = r);
      setRombelMap(rMap);
      
      const mMap: Record<string, MataPelajaran> = {};
      mpl.forEach(m => mMap[m.id_mapel] = m);
      setMapelMap(mMap);
      
      const aktif = thn.find(t => t.status_aktif);
      setTahunAjaran(aktif || null);
      
      if (jdw.length > 0) setSelectedJadwalId(jdw[0].id_jadwal);
    }).catch(e => {
      if (!cancelled) setError(e.message);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    
    return () => { cancelled = true; };
  }, [currentUser]);

  // Load data for selected jadwal
  useEffect(() => {
    if (!selectedJadwalId || !tahunAjaran) return;
    const j = jadwal.find(x => x.id_jadwal === selectedJadwalId);
    if (!j) return;
    
    let cancelled = false;
    setLoading(true);
    
    Promise.all([
      services.nilai.getKomponen(j.id_mapel),
      services.keanggotaan.getAnggotaAktif({ id_rombel: j.id_rombel }),
      services.siswa.getAll(),
      services.nilai.getNilai({ id_rombel: j.id_rombel, semester: tahunAjaran.semester, id_mapel: j.id_mapel })
    ]).then(([komp, anggota, allSiswa, nil]) => {
      if (cancelled) return;
      setKomponen(komp);
      
      const sMap: Record<string, Siswa> = {};
      allSiswa.forEach((s: Siswa) => sMap[s.id_siswa] = s);
      
      const activeAnggota = anggota.filter((a: any) => a.status_keanggotaan === "Aktif" && sMap[a.id_siswa]);
      const siswaList = activeAnggota.map((a: any) => ({ ...sMap[a.id_siswa], id_anggota: a.id_anggota }));
      
      setSiswa(siswaList);
      setNilai(nil);
    }).catch(e => {
      if (!cancelled) setError(e.message);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    
    return () => { cancelled = true; };
  }, [selectedJadwalId, jadwal, tahunAjaran]);

  const handleNilaiChange = (id_siswa: string, id_komponen: string, val: string) => {
    let num = parseInt(val, 10);
    if (isNaN(num)) num = 0;
    
    const existIdx = nilai.findIndex(n => n.id_siswa === id_siswa && n.id_komponen === id_komponen);
    if (existIdx >= 0) {
      const newNilai = [...nilai];
      newNilai[existIdx] = { ...newNilai[existIdx], nilai: num };
      setNilai(newNilai);
    } else {
      if (!tahunAjaran || !currentUser) return;
      const j = jadwal.find(x => x.id_jadwal === selectedJadwalId);
      if (!j) return;
      
      const newNilaiObj: NilaiSiswa = {
        id_nilai: "temp_" + Math.random(),
        id_siswa,
        id_komponen,
        id_rombel: j.id_rombel,
        id_tahun: tahunAjaran.id_tahun,
        semester: tahunAjaran.semester,
        nilai: num,
        id_pegawai_penilai: j.id_pegawai, // Set penilai to scheduled guru instead of currentUser strictly for Admin
        tanggal_input: new Date().toISOString()
      };
      // But if currentUser is Guru Mapel, they should be the one in schedule anyway, if it's admin it should simulate the actual guru. Let's use currentUser to test validation if they are not scheduled.
      newNilaiObj.id_pegawai_penilai = currentUser.id_pegawai;
      setNilai([...nilai, newNilaiObj]);
    }
  };

  const saveNilai = async () => {
    setSaving(true);
    setError(null);
    try {
      const j = jadwal.find(x => x.id_jadwal === selectedJadwalId);
      if (!j || !tahunAjaran) throw new Error("Jadwal atau tahun ajaran tidak valid");
      
      for (const n of nilai) {
        await services.nilai.inputNilai({
          id_siswa: n.id_siswa,
          id_komponen: n.id_komponen,
          id_rombel: n.id_rombel,
          id_tahun: n.id_tahun,
          semester: n.semester,
          nilai: n.nilai,
          id_pegawai_penilai: currentUser.id_pegawai
        });
      }
      alert("Berhasil menyimpan nilai");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const uniqueJadwal = Array.from(new Set(jadwal.map(j => `${j.id_rombel}_${j.id_mapel}`)))
    .map(key => jadwal.find(j => `${j.id_rombel}_${j.id_mapel}` === key))
    .filter(Boolean) as JadwalPelajaran[];

  return (
    <AppShell title="Nilai Harian">
      <PageHeader title="Input Nilai Harian" description="Pilih rombel dan mapel yang Anda ajar untuk mengisi nilai komponen siswa." />
      {error ? <div className="mb-4"><ErrorBlock message={error} /></div> : null}
      
      <SurfaceCard className="mb-6">
        <div className="md:w-1/2">
          <Field label="Pilih Kelas & Mapel (Sesuai Jadwal Anda)">
            <select 
              className={inputClass} 
              value={selectedJadwalId}
              onChange={e => setSelectedJadwalId(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Pilih --</option>
              {uniqueJadwal.map(j => (
                <option key={j.id_jadwal} value={j.id_jadwal}>
                  {rombelMap[j.id_rombel]?.nama_rombel} - {mapelMap[j.id_mapel]?.nama_mapel}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </SurfaceCard>
      
      {loading ? <LoadingBlock /> : (
        selectedJadwalId && komponen.length > 0 ? (
          <SurfaceCard>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="p-3 font-medium">Siswa</th>
                    {komponen.map(k => (
                      <th key={k.id_komponen} className="p-3 font-medium text-center">
                        {k.nama_komponen} <br/>
                        <span className="text-xs font-normal">({k.bobot}%)</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {siswa.map(s => (
                    <tr key={s.id_siswa}>
                      <td className="p-3">
                        <div className="font-semibold text-ink">{s.nama_lengkap}</div>
                        <div className="text-xs text-muted">NISN: {s.nisn}</div>
                      </td>
                      {komponen.map(k => {
                        const n = nilai.find(x => x.id_siswa === s.id_siswa && x.id_komponen === k.id_komponen);
                        return (
                          <td key={k.id_komponen} className="p-3 text-center">
                            <input 
                              type="number" 
                              min="0" max="100" 
                              className={`${inputClass} w-20 text-center mx-auto tabular`}
                              value={n?.nilai ?? ""}
                              onChange={(e) => handleNilaiChange(s.id_siswa, k.id_komponen, e.target.value)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {siswa.length === 0 && (
                    <tr><td colSpan={komponen.length + 1} className="p-4 text-center text-muted">Tidak ada siswa aktif di rombel ini.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex justify-end">
              <PrimaryButton onClick={saveNilai} disabled={saving || siswa.length === 0}>
                {saving ? "Menyimpan..." : "Simpan Nilai"}
              </PrimaryButton>
            </div>
          </SurfaceCard>
        ) : (
          <SurfaceCard>
            <p className="text-muted text-center py-8">
              {!selectedJadwalId ? "Pilih kelas & mapel terlebih dahulu." : "Tidak ada komponen nilai untuk mapel ini."}
            </p>
          </SurfaceCard>
        )
      )}
    </AppShell>
  );
}

function WaliKelasNilai({ currentUser, rombelList }: { currentUser: any, rombelList: any[] }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran | null>(null);
  
  const [siswaMap, setSiswaMap] = useState<Record<string, (Siswa & { id_anggota: string })[]>>({});
  const [nilaiMap, setNilaiMap] = useState<Record<string, NilaiSiswa[]>>({});
  const [komponenMap, setKomponenMap] = useState<Record<string, KomponenNilai[]>>({});
  const [jadwalMap, setJadwalMap] = useState<Record<string, JadwalPelajaran[]>>({});
  const [mapelGlobalMap, setMapelGlobalMap] = useState<Record<string, MataPelajaran>>({});

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    
    setLoading(true);
    services.referensi.getRombel().then(r => {
      const myRombels = r.filter(x => x.id_wali_kelas === currentUser.id_pegawai);
      if (cancelled) return;
      setRombels(myRombels);
    }).catch(e => { if (!cancelled) setError(e.message); });
    
    services.referensi.getTahunAjaran().then(thn => {
      if (cancelled) return;
      const aktif = thn.find(t => t.status_aktif);
      setTahunAjaran(aktif || null);
    }).catch(() => {});
    
    return () => { cancelled = true; };
  }, [currentUser]);

  useEffect(() => {
    if (rombels.length === 0 || !tahunAjaran) {
      if (rombels.length === 0 && !loading) setLoading(false);
      return;
    }
    
    let cancelled = false;
    setLoading(true);
    
    const loadAll = async () => {
      try {
        const mpl = await services.referensi.getMapel();
        const allSiswa = await services.siswa.getAll();
        
        const mGlobalMap: Record<string, MataPelajaran> = {};
        mpl.forEach((m: MataPelajaran) => mGlobalMap[m.id_mapel] = m);
        
        const sMap: Record<string, Siswa> = {};
        allSiswa.forEach((s: Siswa) => sMap[s.id_siswa] = s);

        const newSiswaMap: Record<string, (Siswa & { id_anggota: string })[]> = {};
        const newNilaiMap: Record<string, NilaiSiswa[]> = {};
        const newJadwalMap: Record<string, JadwalPelajaran[]> = {};
        const newKomponenMap: Record<string, KomponenNilai[]> = {};

        for (const r of rombels) {
          const [anggota, nil, jdw] = await Promise.all([
            services.keanggotaan.getAnggotaAktif({ id_rombel: r.id_rombel }),
            services.nilai.getNilai({ id_rombel: r.id_rombel, semester: tahunAjaran.semester }),
            services.jadwal.getAll({ id_rombel: r.id_rombel })
          ]);
          
          const activeAnggota = anggota.filter((a: any) => a.status_keanggotaan === "Aktif" && sMap[a.id_siswa]);
          newSiswaMap[r.id_rombel] = activeAnggota.map((a: any) => ({ ...sMap[a.id_siswa], id_anggota: a.id_anggota }));
          newNilaiMap[r.id_rombel] = nil;
          newJadwalMap[r.id_rombel] = jdw;

          const uniqueMapelIds = Array.from(new Set(jdw.map((j: JadwalPelajaran) => j.id_mapel)));
          let allKomp: KomponenNilai[] = [];
          for (const mapelId of uniqueMapelIds) {
            try {
              const k = await services.nilai.getKomponen(mapelId as string);
              allKomp = [...allKomp, ...k];
            } catch (e) {}
          }
          newKomponenMap[r.id_rombel] = allKomp;
        }

        if (cancelled) return;
        setMapelGlobalMap(mGlobalMap);
        setSiswaMap(newSiswaMap);
        setNilaiMap(newNilaiMap);
        setJadwalMap(newJadwalMap);
        setKomponenMap(newKomponenMap);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAll();
    
    return () => { cancelled = true; };
  }, [rombels, tahunAjaran]);

  return (
    <AppShell title="Nilai Harian">
      <PageHeader title="Rekap Nilai Rombel (Read-Only)" description={`Pantau kelengkapan nilai seluruh mapel di rombel Anda.`} />
      {error && <ErrorBlock message={error} />}
      {loading ? <LoadingBlock /> : (
        <div className="space-y-6">
          {rombels.length > 0 ? (
            rombels.map((rombel) => {
              const rSiswa = siswaMap[rombel.id_rombel] || [];
              const rJadwal = jadwalMap[rombel.id_rombel] || [];
              const rKomponen = komponenMap[rombel.id_rombel] || [];
              const rNilai = nilaiMap[rombel.id_rombel] || [];
              const uniqueMapelIds = Array.from(new Set(rJadwal.map(j => j.id_mapel)));

              return (
                <SurfaceCard key={rombel.id_rombel} title={`Rekap Rombel Saya: ${rombel.nama_rombel}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-border text-muted">
                          <th className="p-3 font-medium">Siswa</th>
                          {uniqueMapelIds.map(mapelId => {
                            const m = mapelGlobalMap[mapelId];
                            return (
                              <th key={mapelId} className="p-3 font-medium text-center border-l border-border/30">
                                {m?.kode_mapel || mapelId}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {rSiswa.map(s => (
                          <tr key={s.id_siswa}>
                            <td className="p-3">
                              <div className="font-semibold text-ink">{s.nama_lengkap}</div>
                            </td>
                            {uniqueMapelIds.map(mapelId => {
                              const k = rKomponen.filter(x => x.id_mapel === mapelId);
                              const nilCount = rNilai.filter(n => n.id_siswa === s.id_siswa && k.some(x => x.id_komponen === n.id_komponen)).length;
                              const total = k.length;
                              const done = nilCount === total && total > 0;
                              return (
                                <td key={mapelId} className="p-3 text-center border-l border-border/30 text-xs">
                                  {total === 0 ? <span className="text-muted">Tidak ada</span> : done ? <span className="text-primary font-medium">Lengkap</span> : <span className="text-amber font-medium">{nilCount}/{total}</span>}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SurfaceCard>
              );
            })
          ) : (
            <SurfaceCard>
              <p className="py-8 text-center text-muted">Anda tidak terdaftar sebagai wali kelas untuk rombel manapun saat ini.</p>
            </SurfaceCard>
          )}
        </div>
      )}
    </AppShell>
  );
}
