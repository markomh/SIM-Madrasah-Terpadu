"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader, ErrorBlock, Button } from "@/components/ui/primitives";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { isAdminMadrasah } from "@/lib/access";
import { ArrowLeft } from "lucide-react";
import RuangFasilitasTab from "./components/RuangFasilitasTab";
import KetersediaanGuruTab from "./components/KetersediaanGuruTab";

function MasterDataContent() {
  const [activeTab, setActiveTab] = useState<"ruang" | "ketersediaan">("ruang");
  const searchParams = useSearchParams();
  const rombelParam = searchParams?.get("rombel");

  const { currentUser, penugasanList } = useAuth();
  const canEdit = currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList);

  if (!canEdit) {
    return (
      <AppShell title="Data Acuan Penjadwalan">
        <ErrorBlock message="Halaman ini khusus untuk Admin Madrasah." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Data Acuan Penjadwalan">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/akademik/jadwal${rombelParam ? `?rombel=${rombelParam}` : ''}`}>
            <Button variant="secondary" iconLeft={<ArrowLeft size={16} />}>
              Kembali ke Jadwal
            </Button>
          </Link>
          <div className="flex-1">
            <PageHeader
              title="Pengaturan Penjadwalan (Ruang & Ketersediaan)"
              description="Kelola Ruang Fasilitas dan Matriks Ketersediaan Guru."
            />
          </div>
        </div>

      <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md text-sm">
        <strong>Info:</strong> Pembagian Tugas Mengajar (SK) telah dipindahkan ke halaman <a href="/penugasan?tab=mengajar" className="font-semibold underline text-blue-900">Pembagian Tugas & SK</a>.
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("ruang")}
            className={`${
              activeTab === "ruang"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
          >
            Ruang Fasilitas
          </button>
          <button
            onClick={() => setActiveTab("ketersediaan")}
            className={`${
              activeTab === "ketersediaan"
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium`}
          >
            Ketersediaan Guru
          </button>
        </nav>
      </div>

      <div className="mt-4">
        {activeTab === "ruang" && <RuangFasilitasTab />}
        {activeTab === "ketersediaan" && <KetersediaanGuruTab />}
      </div>
    </div>
    </AppShell>
  );
}

export default function MasterDataJadwalPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MasterDataContent />
    </Suspense>
  );
}
