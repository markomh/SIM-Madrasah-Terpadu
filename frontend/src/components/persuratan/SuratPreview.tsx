"use client";

/**
 * SuratPreview — Render surat seperti dokumen A4 resmi.
 *
 * Aturan rendering penandatangan (sesuai task_01.md Langkah 3):
 * - Status "Draft" / "Menunggu Tanda Tangan" → resolusi dinamis dari penugasan aktif Kamad.
 * - Status "Ditandatangani" → WAJIB baca dari meta_penandatangan (snapshot immutable).
 *   JANGAN panggil ulang data live pegawai untuk arsip yang sudah ditandatangani.
 */

import type { Surat } from "@/types";
import type { ProfilMadrasah } from "@/types/lembaga";
import { School } from "lucide-react";

/**
 * Langkah 6: Inject global @media print rules.
 * Disembunyikan: sidebar, header app, semua elemen di luar area preview A4.
 * Hanya kanvas dokumen A4 yang masuk ke mode cetak browser.
 */

function PrintStyles() {
  return (
    <style>{`
      @media print {
        @page {
          size: A4 portrait;
          margin: 15mm 20mm 15mm 25mm; /* Margin resmi cetak A4 (Atas Kanan Bawah Kiri) */
        }

        /* Sembunyikan elemen non-cetak seperti toolbar modal */
        .print\:hidden {
          display: none !important;
        }

        /* 1. Reset modal container ke static flow untuk cetak */
        #modal-preview-surat {
          position: static !important;
          width: 100% !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          filter: none !important;
          display: block !important;
          overflow: visible !important;
        }

        /* 2. Reset inner wrapper */
        #surat-preview-wrapper {
          position: static !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          background: transparent !important;
          border: none !important;
        }

        /* 3. Reset dokumen A4 agar tidak memaksa minHeight/padding di mode cetak */
        [id^="surat-preview-"] {
          width: 100% !important;
          max-width: 100% !important;
          min-height: 0 !important;
          height: auto !important;
          padding: 0 !important;
          margin: 0 !important;
          box-shadow: none !important;
          border: none !important;
          background: transparent !important;
        }
      }
    `}</style>
  );
}


type Props = {
  surat: Surat;
  profil: ProfilMadrasah;
  /** Nama & NIP Kamad aktif — dipakai hanya untuk Draft/Menunggu, tidak untuk Arsip TTD */
  kamadAktif?: { nama: string; nip: string | null } | null;
};

/** Format tanggal ISO ke titi mangsa Indonesia, mis: "5 Agustus 2026" */
function formatTitiMangsa(isoDate: string): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function SuratPreview({ surat, profil, kamadAktif }: Props) {
  const isSigned = surat.status === "Diterbitkan";

  // Resolusi penandatangan sesuai aturan kekekalan arsip:
  const penandatangan = isSigned
    ? {
      nama: surat.meta_penandatangan?.nama ?? "—",
      nip: surat.meta_penandatangan?.nip ?? profil.nip_kepala_madrasah ?? null,
      jabatan: surat.meta_penandatangan?.jabatan ?? "Kepala Madrasah",
      tanggal: surat.meta_penandatangan?.tanggal_ttd ?? surat.tanggal_surat,
    }
    : {
      nama: kamadAktif?.nama ?? profil.nama_kepala_madrasah ?? "(Menunggu Kepala Madrasah)",
      nip: kamadAktif?.nip ?? profil.nip_kepala_madrasah ?? null,
      jabatan: "Kepala Madrasah",
      tanggal: surat.tanggal_surat,
    };

  return (
    <>
      <PrintStyles />
      <div id="surat-preview-wrapper">
        <div
          id={`surat-preview-${surat.id_surat}`}
          className="mx-auto bg-white text-black shadow-md print:shadow-none"
          style={{ 
            fontFamily: "'Times New Roman', Times, serif", 
            width: "210mm",
            minHeight: "297mm", 
            padding: "2cm 1.5cm 2cm 2.5cm",
            boxSizing: "border-box" 
          }}
        >
          {/* ═══════════════════════════════════ KOP SURAT ═══════════════════════════════════ */}
          <header className="mb-2 flex items-start gap-4 border-b-[3px] border-black pb-3">
            {/* Logo */}
            <div className="shrink-0">
              {profil.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profil.logo_url}
                  alt={`Logo ${profil.nama_madrasah}`}
                  width={80}
                  height={80}
                  className="h-20 w-20 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div className={`flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ${profil.logo_url ? "hidden" : ""}`}>
                <School size={40} className="text-primary" />
              </div>
            </div>

            {/* Identitas instansi (tengah, rata tengah) */}
            <div className="flex-1 text-center">
              <p className="text-[18px] font-normal uppercase tracking-wide">KEMENTERIAN AGAMA REPUBLIK INDONESIA</p>
              <p className="text-[18px] font-normal uppercase tracking-wide">KANTOR KEMENTERIAN AGAMA KABUPATEN/KOTA {profil.kabupaten_kota}</p>
              <p className="mt-1 text-[22px] font-bold uppercase tracking-widest">{profil.nama_madrasah}</p>
              <p className="mt-1 text-[14px]">
                NSM: {profil.nsm} &nbsp;|&nbsp; NPSN: {profil.npsn}
              </p>
              <p className="text-[14px]">{profil.alamat}</p>
              <p className="text-[14px]">
                {profil.telepon ? `Telp. ${profil.telepon}` : ""}
                {profil.telepon && profil.email ? " | " : ""}
                {profil.email ?? ""}
              </p>
            </div>
          </header>

          {/* ═══════════════════════════════════ JUDUL & NOMOR ═══════════════════════════════════ */}
          <section className="my-4 print:my-2 text-center">
            <p className="text-[16px] font-bold uppercase underline tracking-wider">{surat.perihal}</p>
            <p className="mt-1 text-[16px]">Nomor: {surat.nomor_surat}</p>
          </section>

          {/* ═══════════════════════════════════ ISI SURAT ═══════════════════════════════════ */}
          <section className="text-[16px] leading-[1.5] text-justify">
            <div 
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: surat.isi_surat }}
            />
            {surat.hasil_ai && (
              <p className="mt-4 text-[11px] italic text-gray-500 print:hidden">
                ⚠ Draf ini dibuat secara otomatis oleh AI. Harap periksa dan verifikasi sebelum ditandatangani.
              </p>
            )}
          </section>

          {/* ═══════════════════════════════════ BLOK TANDA TANGAN ═══════════════════════════════════ */}
          <footer className="mt-6 print:mt-4 flex flex-col items-end text-[16px]">
            {/* Titi Mangsa */}
            <div className="w-[300px]">
              <p>
                {profil.kabupaten_kota}, {formatTitiMangsa(penandatangan.tanggal)}
              </p>
              <p className="mt-1">{penandatangan.jabatan},</p>


            {/* Ruang tanda tangan / QR Code dummy */}
            <div className="my-2 print:my-1 flex h-20 w-20 items-center justify-center rounded-[4px] border-2 border-dashed border-primary/50">
              {isSigned ? (
                // QR Code dummy berwarna primary — Langkah 3
                <div className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-sm bg-primary/10">
                  <div className="grid grid-cols-3 gap-0.5">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <span
                        key={i}
                        className="h-3.5 w-3.5 rounded-[2px]"
                        style={{ backgroundColor: (i % 2 === 0 || i === 4) ? "var(--color-primary)" : "transparent" }}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-[7px] font-bold text-primary">e-SIGN</p>
                </div>
              ) : (
                <p className="text-[9px] text-center text-gray-400 leading-tight px-1 print:hidden">
                  {surat.status === "Menunggu Tanda Tangan" ? "Menunggu TTD" : "Belum diajukan"}
                </p>
              )}
            </div>

              {/* Nama & NIP — immutable dari snapshot jika sudah TTD */}
              <p className="font-bold underline">{penandatangan.nama}</p>
              <p>NIP. {penandatangan.nip ?? "-"}</p>
              {isSigned && (
                <p className="mt-1 text-[10px] text-primary print:hidden">
                  ✓ Ditandatangani secara digital pada {formatTitiMangsa(penandatangan.tanggal)}
                </p>
              )}
            </div>
          </footer>

        </div>
      </div>
    </>
  );
}
