"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useTahunAjaran } from "@/components/app-providers";
import { ErrorBlock, PageHeader } from "@/components/ui/primitives";
import { isAdminMadrasah, isKepalaMadrasah } from "@/lib/access";
import { services } from "@/services";
import type { PeriodePembagianTugas, RekapBebanKerjaGuru, PlottingBKTIK } from "@/types/penugasan";
import type { Pegawai, Rombel, MataPelajaran } from "@/types";
import TugasMengajarTab from "./components/TugasMengajarTab";
import PlottingBKTab from "./components/PlottingBKTab";
import PlottingEkskulTab from "./components/PlottingEkskulTab";
import TugasLainTab from "./components/TugasLainTab";
import RekapValidasiSKTab from "./components/RekapValidasiSKTab";
import CetakSKModal from "./components/CetakSKModal";

export default function PenugasanPage() {
  const { currentUser, penugasanList } = useAuth();
  const { selected: tahunAktif } = useTahunAjaran();
  const [activeTab, setActiveTab] = useState<"mengajar" | "tugas-tambahan" | "rekap-sk">("mengajar");

  const [periode, setPeriode] = useState<PeriodePembagianTugas | null>(null);
  const [rekap, setRekap] = useState<RekapBebanKerjaGuru[]>([]);
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [rombelList, setRombelList] = useState<Rombel[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [plottingBkList, setPlottingBkList] = useState<PlottingBKTIK[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCetakModalOpen, setIsCetakModalOpen] = useState(false);

  const canEdit = currentUser ? !!isAdminMadrasah(currentUser.id_pegawai, penugasanList) : false;
  const canApprove = currentUser ? !!isKepalaMadrasah(currentUser.id_pegawai, penugasanList) : false;

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!tahunAktif) return;
      setLoading(true);
      try {
        const [per, rkp, pList, rList, mList, bkList] = await Promise.all([
          services.penugasanDomain.getPeriodePembagianTugas(tahunAktif.id_tahun),
          services.penugasanDomain.hitungRekapBebanKerja(tahunAktif.id_tahun),
          services.pegawai.getAll(),
          services.referensi.getRombel({}),
          services.referensi.getMapel(),
          services.penugasanDomain.getPlottingBK(tahunAktif.id_tahun),
        ]);
        if (!ignore) {
          setPeriode(per);
          setRekap(rkp);
          setPegawaiList(pList);
          setRombelList(rList);
          setMapelList(mList);
          setPlottingBkList(bkList || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [tahunAktif, activeTab]);

  const handleChangeStatus = async (newStatus: "VALIDASI" | "SIAP_DISAHKAN" | "DISAHKAN") => {
    if (!tahunAktif) return;
    try {
      const updated = await services.penugasanDomain.updateStatusSK(tahunAktif.id_tahun, newStatus);
      setPeriode(updated);
    } catch (e) {
      alert("Gagal memperbarui status SK");
    }
  };

  if (!canEdit && !canApprove) {
    return (
      <AppShell title="Penugasan & SK Beban Kerja">
        <ErrorBlock message="Halaman khusus Admin dan Kepala Madrasah." />
      </AppShell>
    );
  }

  const isDraft = periode?.status_sk === "DRAFT";

  return (
    <AppShell title="Penugasan & SK Beban Kerja">
      <div className="space-y-6 pb-20">
        {/* HEADER TITLE & STATUS */}
        <PageHeader
          title="Penugasan & SK Beban Kerja"
          description={`Tahun Ajaran: ${tahunAktif?.nama_tahun || "2026/2027 Ganjil"}`}
          action={
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Status Dokumen:</span>
              <span className="px-3 py-1 bg-primary-100 text-primary-800 border border-primary-300 font-extrabold text-xs rounded-md shadow-2xs">
                {periode?.status_sk || "DRAFT"}
              </span>
            </div>
          }
        />

        {/* 3 MAIN NAVIGATION TABS */}
        <div className="border-b border-gray-200 bg-white px-2 rounded-t-xl">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {[
              { key: "mengajar", label: "PLOTTING MENGAJAR" },
              { key: "tugas-tambahan", label: "TUGAS TAMBAHAN & BK" },
              { key: "rekap-sk", label: "REKAP & VALIDASI SK" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`${
                  activeTab === tab.key
                    ? "border-primary-600 text-primary-700 font-extrabold"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 font-semibold"
                } whitespace-nowrap border-b-2 py-3.5 px-2 text-xs uppercase tracking-wider transition-colors`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* TAB CONTENTS */}
        <div className="min-h-[400px]">
          {activeTab === "mengajar" && <TugasMengajarTab />}

          {activeTab === "tugas-tambahan" && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                <h3 className="text-base font-bold text-gray-900 mb-4">1. Plotting Bimbingan Konseling (BK)</h3>
                {tahunAktif && <PlottingBKTab tahunAktif={tahunAktif} canEdit={!!(canEdit && isDraft)} />}
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                <h3 className="text-base font-bold text-gray-900 mb-4">2. Plotting Pembina Ekstrakurikuler</h3>
                <PlottingEkskulTab canEdit={!!(canEdit && isDraft)} />
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                <h3 className="text-base font-bold text-gray-900 mb-4">3. Tugas Tambahan Jabatan</h3>
                <TugasLainTab canEdit={!!(canEdit && isDraft)} />
              </div>
            </div>
          )}

          {activeTab === "rekap-sk" && tahunAktif && (
            <RekapValidasiSKTab
              tahunAktif={tahunAktif}
              periode={periode}
              rekap={rekap}
              pegawaiList={pegawaiList}
              rombelList={rombelList}
              mapelList={mapelList}
              plottingBkList={plottingBkList}
              canEdit={canEdit}
              canApprove={canApprove}
              onStatusChange={handleChangeStatus}
              onOpenCetakModal={() => setIsCetakModalOpen(true)}
            />
          )}
        </div>
      </div>

      <CetakSKModal
        open={isCetakModalOpen}
        onClose={() => setIsCetakModalOpen(false)}
        periode={periode}
        rekap={rekap}
        tahunNama={tahunAktif?.nama_tahun || ""}
      />
    </AppShell>
  );
}
