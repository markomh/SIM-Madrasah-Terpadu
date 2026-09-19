import { useState } from "react";
import Link from "next/link";
import { Drawer } from "@/components/ui/drawer";
import { Modal } from "@/components/ui/modal";
import { Button, Field, PrimaryButton, SecondaryButton, inputClass } from "@/components/ui/primitives";
import { SearchInput } from "@/components/ui/search-input";
import { Check, Send, AlertTriangle, Sparkles, UserCheck, Calendar, Clock, BookOpen, Trophy, ArrowRight } from "lucide-react";
import { useToast } from "@/components/toast-context";
import { RekapSesiPagiWidget } from "./RekapSesiPagiWidget";
import type { JadwalPelajaran, Ekstrakurikuler, Rombel } from "@/types";

export interface DashboardDrawersProps {
  activeDrawer: "presensi" | "bk" | "approval" | "izin" | "rekap-pagi" | "ai-risiko" | "jadwal-hari-ini" | null;
  onClose: () => void;
  pendingItems?: any[];
  rekapPagi?: any;
  risiko?: any[];
  jadwalList?: JadwalPelajaran[];
  ekstraList?: Ekstrakurikuler[];
  rombelList?: Rombel[];
  currentUserId?: string;
  onOpenPresensi?: () => void;
}

export function DashboardDrawers({
  activeDrawer,
  onClose,
  pendingItems = [],
  rekapPagi,
  risiko = [],
  jadwalList = [],
  ekstraList = [],
  rombelList = [],
  currentUserId,
  onOpenPresensi,
}: DashboardDrawersProps) {
  const { toast } = useToast();

  // BK Form State
  const [bkSearch, setBkSearch] = useState("");
  const [bkKategori, setBkKategori] = useState("Bimbingan Pribadi");
  const [bkUrgensi, setBkUrgensi] = useState("Sedang");
  const [bkCatatan, setBkCatatan] = useState("");

  // Presensi State
  const [presensiMapel, setPresensiMapel] = useState("Matematika - Class 9-A");
  const [presensiCatatan, setPresensiCatatan] = useState("Pembahasan Bab 3 Bangun Ruang.");

  // Approval State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute today's schedule for teacher & pembina
  const dayNamesIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const todayDayName = dayNamesIndo[new Date().getDay()];

  const myJadwal = jadwalList.filter(
    (j) => j.id_pegawai === currentUserId || (j.id_pengajar_tambahan && j.id_pengajar_tambahan.includes(currentUserId ?? ""))
  );
  const todayJadwal = myJadwal.filter((j) => j.hari === todayDayName);
  const displayJadwalHariIni = todayJadwal.length > 0 ? todayJadwal : myJadwal.slice(0, 3);

  const myEkstra = ekstraList.filter((e) => e.id_pembina === currentUserId);

  const handleSaveBk = (e: React.FormEvent) => {
    e.preventDefault();
    toast("Catatan Bimbingan BK berhasil disimpan!", "success");
    onClose();
  };

  const handleSavePresensi = (e: React.FormEvent) => {
    e.preventDefault();
    toast("Presensi & Jurnal KBM berhasil diperbarui!", "success");
    onClose();
  };

  const handleBatchApprove = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast("Semua pengajuan pending telah berhasil disetujui!", "success");
      onClose();
    }, 600);
  };

  return (
    <>
      {/* 1. Frictionless Drawer: Quick Presensi & Jurnal KBM */}
      <Drawer
        isOpen={activeDrawer === "presensi"}
        onClose={onClose}
        title="⚡ Isi Presensi & Jurnal KBM (Cepat)"
      >
        <form onSubmit={handleSavePresensi} className="space-y-4">
          <Field label="Sesi & Class Mengajar">
            <select
              value={presensiMapel}
              onChange={(e) => setPresensiMapel(e.target.value)}
              className={inputClass}
            >
              <option value="Matematika - Class 9-A">Jam Ke-3 (09:00) — Matematika IX-A</option>
              <option value="Matematika - Class 9-B">Jam Ke-5 (10:30) — Matematika IX-B</option>
            </select>
          </Field>

          <Field label="Ringkasan Jurnal Materi KBM">
            <textarea
              rows={3}
              value={presensiCatatan}
              onChange={(e) => setPresensiCatatan(e.target.value)}
              className={inputClass}
              placeholder="Tuliskan pokok bahasan materi KBM sesi ini..."
              required
            />
          </Field>

          <div className="rounded-lg bg-surface p-4 border border-border space-y-3">
            <span className="text-xs font-bold text-ink uppercase tracking-wider block">Ringkasan Kehadiran Sesi:</span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-primary-soft text-primary rounded font-bold">30 Hadir</div>
              <div className="p-2 bg-amber-soft text-amber rounded font-bold">1 Izin</div>
              <div className="p-2 bg-danger-soft text-danger rounded font-bold">1 Alpa</div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-border">
            <SecondaryButton type="button" onClick={onClose}>Batal</SecondaryButton>
            <PrimaryButton type="submit">
              <UserCheck size={16} className="mr-1.5" /> Simpan Presensi Sesi
            </PrimaryButton>
          </div>
        </form>
      </Drawer>

      {/* 2. Frictionless Drawer: Quick Catatan BK */}
      <Drawer
        isOpen={activeDrawer === "bk"}
        onClose={onClose}
        title="📘 Tambah Catatan Konseling & Layanan BK"
      >
        <form onSubmit={handleSaveBk} className="space-y-4">
          <Field label="Cari Siswa Konseli">
            <SearchInput
              value={bkSearch}
              onChange={setBkSearch}
              placeholder="Ketik Nama atau NISN Siswa..."
            />
          </Field>

          <Field label="Kategori Layanan BK">
            <select
              value={bkKategori}
              onChange={(e) => setBkKategori(e.target.value)}
              className={inputClass}
            >
              <option value="Bimbingan Pribadi">Bimbingan Pribadi</option>
              <option value="Bimbingan Sosial">Bimbingan Sosial & Kedisiplinan</option>
              <option value="Bimbingan Belajar">Bimbingan Belajar & Nilai</option>
              <option value="Bimbingan Karir">Bimbingan Karir & Lanjutan</option>
            </select>
          </Field>

          <Field label="Tingkat Urgensi">
            <select
              value={bkUrgensi}
              onChange={(e) => setBkUrgensi(e.target.value)}
              className={inputClass}
            >
              <option value="Rendah">🟢 Rendah (Konseling Rutin)</option>
              <option value="Sedang">🟡 Sedang (Perlu Perhatian)</option>
              <option value="Tinggi">🔴 Tinggi (Perlu Tindak Lanjut Wali/Ortu)</option>
            </select>
          </Field>

          <Field label="Uraian Catatan BK & Hasil Konseling">
            <textarea
              rows={4}
              value={bkCatatan}
              onChange={(e) => setBkCatatan(e.target.value)}
              className={inputClass}
              placeholder="Uraikan hasil bimbingan atau kasus kedisiplinan siswa..."
              required
            />
          </Field>

          <div className="pt-4 flex justify-end gap-2 border-t border-border">
            <SecondaryButton type="button" onClick={onClose}>Batal</SecondaryButton>
            <PrimaryButton type="submit">
              <Send size={16} className="mr-1.5" /> Simpan Catatan BK
            </PrimaryButton>
          </div>
        </form>
      </Drawer>

      {/* 3. Frictionless Modal: Quick Approval (Kepala Madrasah / Admin) */}
      <Modal
        isOpen={activeDrawer === "approval"}
        onClose={onClose}
        title="✍️ Pengesahan & TTD Digital Dokumen"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted">
            Tinjau dan sahkan antrean pengajuan persetujuan (Surat Dinas / Mutasi / Pindah Rombel):
          </p>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {pendingItems.length > 0 ? (
              pendingItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-paper rounded border border-border flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-ink block uppercase tracking-wider">{item.jenis}</span>
                    <span className="text-muted">Perihal / ID: {item.data?.id_mutasi || item.data?.id_surat || "Persetujuan"}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-soft text-amber font-bold">Pending TTD</span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-muted">
                Tidak ada antrean pending saat ini.
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-border">
            <SecondaryButton type="button" onClick={onClose}>Batal</SecondaryButton>
            <PrimaryButton onClick={handleBatchApprove} disabled={isSubmitting || pendingItems.length === 0}>
              <Check size={16} className="mr-1.5" /> {isSubmitting ? "Memproses..." : "Setujui Semua (Batch)"}
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      {/* 4. Frictionless Drawer: Detail Rekap Pagi (Progressive Disclosure) */}
      <Drawer
        isOpen={activeDrawer === "rekap-pagi"}
        onClose={onClose}
        title="📊 Detail Rekapitulasi Sesi Pagi Hari Ini"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted">
            Tinjauan mendalam kehadiran guru untuk setiap sesi mengajar pagi ini.
          </p>
          <div className="mt-4">
            <RekapSesiPagiWidget rekapPagi={rekapPagi} />
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t border-border mt-4">
            <PrimaryButton type="button" onClick={onClose}>Tutup</PrimaryButton>
          </div>
        </div>
      </Drawer>

      {/* 5. Frictionless Drawer: AI Risk / Siswa Pantauan */}
      <Drawer
        isOpen={activeDrawer === "ai-risiko"}
        onClose={onClose}
        title="🤖 Detail Siswa Pantauan AI (Risiko Tinggi)"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted leading-relaxed">
            Berikut adalah daftar siswa yang terindikasi memiliki masalah kedisiplinan atau memerlukan perhatian khusus berdasarkan algoritma AI.
          </p>

          <div className="space-y-2 mt-4">
            {risiko.length > 0 ? (
              risiko.map((s) => (
                <div key={s.id_siswa} className="rounded-lg p-3 bg-paper border border-border/70 flex flex-col gap-1.5">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-ink">{s.nama_lengkap}</p>
                    <span className="px-2 py-0.5 rounded-full bg-ai-soft text-ai text-[10px] font-bold">
                      Skor Risiko: {s.skor_risiko_ai}
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    Siswa ini menunjukkan pola indisipliner yang memerlukan intervensi preventif.
                  </p>
                </div>
              ))
            ) : (
              <div className="p-6 text-center border border-dashed border-border rounded-lg bg-surface">
                <span className="text-2xl mb-2 block">✨</span>
                <p className="text-sm font-bold text-ink">Semua Siswa Terpantau Baik</p>
                <p className="text-xs text-muted mt-1">Tidak ada anomali kedisiplinan yang terdeteksi AI pada rombel binaan Anda saat ini.</p>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-border mt-4">
            <PrimaryButton type="button" onClick={onClose}>Mengerti, Tutup</PrimaryButton>
          </div>
        </div>
      </Drawer>

      {/* 6. Frictionless Drawer: Detail Jadwal & Pembinaan Hari Ini */}
      <Drawer
        isOpen={activeDrawer === "jadwal-hari-ini"}
        onClose={onClose}
        title="🗓️ Ringkasan Jadwal & Pembinaan Hari Ini"
      >
        <div className="space-y-5">
          {/* P1 FOCUS ZONE: Sesi Aktif Saat Ini */}
          {displayJadwalHariIni.length > 0 && (
            <div className="rounded-xl bg-primary-soft/40 border border-primary/30 p-4 space-y-3 shadow-2xs">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={14} /> Sesi Aktif / Terdekat Hari Ini
                </span>
                <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-extrabold">
                  {todayDayName}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-ink">
                  {rombelList.find((r) => r.id_rombel === displayJadwalHariIni[0].id_rombel)?.nama_rombel ? `Kelas ${rombelList.find((r) => r.id_rombel === displayJadwalHariIni[0].id_rombel)?.nama_rombel}` : "Sesi Mengajar Tatap Muka"}
                </p>
                <p className="text-xs text-muted font-medium">
                  Jam {displayJadwalHariIni[0].jam_mulai} – {displayJadwalHariIni[0].jam_selesai} • Semester {displayJadwalHariIni[0].semester}
                </p>
              </div>
              {onOpenPresensi && (
                <Button
                  onClick={() => {
                    onClose();
                    onOpenPresensi();
                  }}
                  variant="primary"
                  size="sm"
                  className="w-full justify-center font-bold"
                >
                  <UserCheck size={14} className="mr-1.5" /> Isi Presensi Sesi Ini Sekarang
                </Button>
              )}
            </div>
          )}

          {/* P2 CONTEXT ZONE: Daftar Semua Sesi Harian */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted block">
              Daftar Sesi Mengajar ({displayJadwalHariIni.length} Sesi)
            </span>
            {displayJadwalHariIni.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {displayJadwalHariIni.map((j, idx) => {
                  const rombelObj = rombelList.find((r) => r.id_rombel === j.id_rombel);
                  return (
                    <div
                      key={j.id_jadwal || idx}
                      className="p-3 rounded-lg bg-surface border border-border/80 flex items-center justify-between text-xs hover:border-primary/40 transition-all"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ink">
                            {rombelObj ? `Kelas ${rombelObj.nama_rombel}` : `Rombel ${j.id_rombel}`}
                          </span>
                          <span className="text-[10px] text-muted font-mono bg-paper px-1.5 py-0.5 rounded">
                            {j.jam_mulai}–{j.jam_selesai}
                          </span>
                        </div>
                        <p className="text-muted text-[11px]">Sesi Mengajar Tatap Muka ({j.hari})</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-soft text-primary">
                        Terjadwal
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center border border-dashed border-border rounded-lg text-xs text-muted">
                Tidak ada sesi mengajar tatap muka terjadwal pada hari ini.
              </div>
            )}
          </div>

          {/* P3 EKSTRAKURIKULER ZONE */}
          {myEkstra.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/60">
              <span className="text-xs font-bold uppercase tracking-wider text-muted block flex items-center gap-1.5">
                <Trophy size={14} className="text-amber" /> Ekstrakurikuler Binaan ({myEkstra.length})
              </span>
              <div className="space-y-2">
                {myEkstra.map((e) => (
                  <div
                    key={e.id_ekstra}
                    className="p-3 rounded-lg bg-paper border border-border flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-ink">{e.nama_ekstra}</p>
                      <p className="text-[11px] text-muted">Pembina Ekstrakurikuler Aktif</p>
                    </div>
                    <Link
                      href="/akademik/ekstrakurikuler"
                      onClick={onClose}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <span>Kelola</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-2 border-t border-border">
            <SecondaryButton type="button" onClick={onClose}>Tutup</SecondaryButton>
          </div>
        </div>
      </Drawer>
    </>
  );
}

