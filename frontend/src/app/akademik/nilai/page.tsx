"use client";

/**
 * /akademik/nilai — Modul Nilai Harian & Activity-Based Gradebook
 *
 * Mengadopsi prinsip Context Inheritance (guru tidak memilih ulang rombel/mapel saat konteks terbawa dari jadwal),
 * Moodle/ManageBac activity-based assessment matrix, dan Open edX / Rapor Digital Madrasah (RDM) export engine.
 */

import {
  isAdminMadrasah,
  isKepalaMadrasah,
  isPengajarAktif,
  isWaliKelas,
} from "@/lib/access";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import {
  PageHeader,
  ErrorBlock,
} from "@/components/ui/primitives";
import { GradebookInputPanel } from "@/components/nilai/GradebookInputPanel";
import { RekapWaliKelasPanel } from "@/components/nilai/RekapWaliKelasPanel";

// ─────────────────────────────────────────────────────────────────────────────
// Komponen Utama Halaman Nilai
// ─────────────────────────────────────────────────────────────────────────────

function NilaiPageContent() {
  const { currentUser, penugasanList, rombelList, jadwalList } = useAuth();
  const searchParams = useSearchParams();

  if (!currentUser) return null;

  const bPengajar = isPengajarAktif(currentUser.id_pegawai, jadwalList);
  const bAdmin = isAdminMadrasah(currentUser.id_pegawai, penugasanList);
  const bWaliKelas = isWaliKelas(currentUser.id_pegawai, rombelList);
  const bKamad = isKepalaMadrasah(currentUser.id_pegawai, penugasanList);

  const showInput = bAdmin || bPengajar;
  const showRekap = bWaliKelas || bAdmin || bKamad;

  if (!showInput && !showRekap) {
    return (
      <AppShell title="Nilai Harian">
        <PageHeader title="Penilaian Siswa & Gradebook" description="Modul penilaian operasional harian." />
        <ErrorBlock message="Halaman ini khusus untuk Guru Mapel, Wali Kelas, Admin, dan Kepala Madrasah." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Gradebook & Penilaian Operasional">
      <PageHeader
        title="Gradebook & Penilaian Operasional"
        description="Pencatatan raw score berbasis aktivitas KBM (Tugas, UH, Praktik, UTS, UAS) dengan pewarisan konteks jadwal dan integrasi ekspor RDM/EMIS."
      />

      <div className="space-y-8">
        {/* Blok 1: Interactive Gradebook Matrix — untuk Guru Mapel / Admin */}
        {showInput && (
          <section>
            <div className="flex items-center gap-2 border-b border-border pb-2 mb-4">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink">
                Gradebook Pembelajaran (Activity-Based Assessment Matrix)
              </h2>
            </div>
            <GradebookInputPanel
              currentUser={currentUser}
              penugasanList={penugasanList}
              initialJadwalKey={searchParams.get("jadwalKey") ?? ""}
              initialRombel={searchParams.get("rombel") ?? ""}
              initialMapel={searchParams.get("mapel") ?? ""}
            />
          </section>
        )}

        {/* Blok 2: Rekap Monitoring Lintas-Mapel — untuk Wali Kelas & Pimpinan */}
        {showRekap && (
          <section>
            <div className="flex items-center gap-2 border-b border-border pb-2 mb-4">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink">
                Rekapitulasi Kelengkapan Nilai Rombel (Wali Kelas & Monitoring)
              </h2>
            </div>
            <RekapWaliKelasPanel currentUser={currentUser} />
          </section>
        )}
      </div>
    </AppShell>
  );
}

export default function NilaiPage() {
  return (
    <Suspense fallback={<div>Memuat Halaman Penilaian...</div>}>
      <NilaiPageContent />
    </Suspense>
  );
}

