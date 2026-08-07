"use client";

import { useEffect, useState } from "react";
import { FileText, CheckCircle } from "lucide-react";
import type { ProfilMadrasah, RiwayatMutasi, Surat, Pegawai } from "@/types";
import { services } from "@/services";
import { SuratPreview } from "./SuratPreview";
import { Button, Modal } from "@/components/ui/primitives";

type Props = {
  mutasi: RiwayatMutasi;
  profil: ProfilMadrasah;
  currentUser: Pegawai;
  onClose: () => void;
  onSuccess: (surat: Surat) => void;
};

export function MutasiApprovalDrawer({ mutasi, profil, currentUser, onClose, onSuccess }: Props) {
  const [draftSkp, setDraftSkp] = useState<Surat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [siswaInfo, setSiswaInfo] = useState<{ nama: string; nisn: string; kelas: string } | null>(null);

  useEffect(() => {
    async function fetchPreview() {
      try {
        setLoading(true);
        // Load student data for summary
        const allSiswa = await services.siswa.getAll({});
        const siswa = allSiswa.find(s => s.id_siswa === mutasi.id_siswa);
        const allAnggota = await services.keanggotaan.getAnggotaAktif();
        const aktif = allAnggota.find(a => a.id_siswa === mutasi.id_siswa);
        const allRombel = await services.referensi.getRombel({});
        const rombel = allRombel.find(r => r.id_rombel === aktif?.id_rombel);

        setSiswaInfo({
          nama: siswa?.nama_lengkap ?? "Tidak diketahui",
          nisn: siswa?.nisn ?? "-",
          kelas: rombel?.nama_rombel ?? "-",
        });

        // Load document preview
        const surat = await services.persetujuan.previewMutasiSkp(mutasi.id_mutasi);
        setDraftSkp(surat);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat pratinjau SKP");
      } finally {
        setLoading(false);
      }
    }
    fetchPreview();
  }, [mutasi.id_mutasi]);

  const handleApproveAndSign = async () => {
    try {
      setSubmitting(true);
      const result = await services.persetujuan.approveAndSignMutasiSkp(mutasi.id_mutasi, currentUser.id_pegawai);
      onSuccess(result.surat);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyetujui mutasi");
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="xl"
      title={
        <span className="flex items-center gap-2">
          <FileText className="text-primary" size={20} />
          <span>Tinjau & Sahkan Mutasi Keluar</span>
        </span>
      }
      description="Persetujuan ini akan otomatis mengubah status siswa dan menerbitkan Surat Keterangan Pindah (SKP) dengan tanda tangan elektronik Anda."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={handleApproveAndSign}
            loading={submitting}
            disabled={loading || Boolean(error)}
            iconLeft={<CheckCircle size={16} />}
          >
            Setujui & Tanda Tangani (e-Sign)
          </Button>
        </>
      }
    >
      <div className="flex h-[60vh] gap-4">
        {/* Sisi Kiri: Metadata Mutasi */}
        <div className="w-1/3 overflow-y-auto border-r border-border bg-paper p-4 rounded-[4px]">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">Ringkasan Mutasi</h3>
          
          <div className="space-y-3 text-sm">
            <div className="rounded-[4px] border border-border bg-surface p-3">
              <p className="text-xs font-semibold text-primary">Identitas Siswa</p>
              <p className="mt-1 text-base font-bold text-ink">{siswaInfo?.nama ?? "Memuat..."}</p>
              <div className="mt-1 flex gap-4 text-xs text-muted">
                <p>NISN: {siswaInfo?.nisn}</p>
                <p>Kelas: {siswaInfo?.kelas}</p>
              </div>
            </div>

            <div className="rounded-[4px] border border-border bg-surface p-3">
              <p className="text-xs font-semibold text-primary">Detail Kepindahan</p>
              <div className="mt-2 space-y-2 text-xs">
                <div>
                  <p className="text-muted">Alasan Pindah</p>
                  <p className="font-medium text-ink">{mutasi.alasan ?? "Tidak dicantumkan"}</p>
                </div>
                <div>
                  <p className="text-muted">Sekolah Tujuan</p>
                  <p className="font-medium text-ink">{mutasi.sekolah_tujuan ?? "Tidak dicantumkan"}</p>
                </div>
                <div>
                  <p className="text-muted">Tanggal Pengajuan</p>
                  <p className="font-medium text-ink">{new Date(mutasi.tanggal_mutasi).toLocaleDateString("id-ID")}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[4px] border border-amber-soft bg-amber-soft/50 p-3">
              <p className="text-xs font-semibold text-amber flex items-center gap-1">
                Info Penting
              </p>
              <p className="mt-1 text-xs text-amber leading-relaxed">
                Menyetujui mutasi ini bersifat mengikat. E-Signature Anda akan dibubuhkan pada dokumen SKP secara permanen.
              </p>
            </div>
          </div>
        </div>

        {/* Sisi Kanan: Live Document Preview */}
        <div className="flex-1 overflow-y-auto bg-paper p-4 flex flex-col items-center justify-center rounded-[4px]">
          {loading ? (
            <p className="text-sm font-medium text-muted">Membuat pratinjau SKP...</p>
          ) : error ? (
            <p className="text-sm font-bold text-danger">{error}</p>
          ) : draftSkp ? (
            <div className="scale-95 origin-top transition-transform">
              <SuratPreview 
                surat={draftSkp} 
                profil={profil} 
                kamadAktif={{ nama: currentUser.nama_lengkap_gelar, nip: currentUser.nip }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
