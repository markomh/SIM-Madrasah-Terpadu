"use client";

import { isAdminMadrasah, isKepalaMadrasah, isOperatorKesiswaan, isGuruBk, isWaliKelas, isPembinaEkstrakurikuler, isPengajar } from "@/lib/access";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import {
  ErrorBlock,
  PageHeader,
  PrimaryButton,
  SurfaceCard,
  StatusBadge,
  inputClass,
} from "@/components/ui/primitives";
import { DataTable } from "@/components/ui/data-table";

export default function EkstrakurikulerPage() {
  const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth();
  
  const canEdit = (currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList)) || (currentUser && isOperatorKesiswaan(currentUser.id_pegawai, penugasanList));
  
  // Dummy data
  const dataEkstra = [
    { id: "e1", nama: "Pramuka", pembina: "Budi Santoso", jumlah_anggota: 45, status: "Aktif" },
    { id: "e2", nama: "PMR (Palang Merah Remaja)", pembina: "Siti Aminah", jumlah_anggota: 32, status: "Aktif" },
    { id: "e3", nama: "Paskibra", pembina: "Andi Saputra", jumlah_anggota: 25, status: "Aktif" },
  ];

  return (
    <AppShell title="Modul Ekstrakurikuler">
      <PageHeader
        title="Modul Ekstrakurikuler"
        description="Kelola keanggotaan dan absensi kegiatan ekstrakurikuler."
        action={
          canEdit ? (
            <PrimaryButton type="button">+ Tambah Ekstrakurikuler</PrimaryButton>
          ) : null
        }
      />

      <div className="space-y-4">
        <SurfaceCard>
          <div className="mb-4 flex flex-wrap gap-2">
            <input
              className={`${inputClass} max-w-xs`}
              placeholder="Cari ekstrakurikuler..."
            />
            <select className={inputClass + " max-w-[160px]"}>
              <option value="all">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>

          <DataTable
            data={dataEkstra}
            columns={[
              { key: "nama", header: "Nama Ekstrakurikuler", render: (e) => <span className="font-semibold">{e.nama}</span> },
              { key: "pembina", header: "Pembina", render: (e) => e.pembina },
              { key: "jumlah", header: "Anggota", render: (e) => `${e.jumlah_anggota} Siswa` },
              { key: "status", header: "Status", render: (e) => <StatusBadge status={e.status} /> },
              {
                key: "aksi",
                header: "Aksi",
                render: () => (
                  <div className="flex gap-2">
                    <button className="text-xs font-semibold text-primary">Anggota & Absensi</button>
                    {canEdit && <button className="text-xs font-semibold text-ink">Edit</button>}
                  </div>
                ),
              },
            ]}
          />
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
