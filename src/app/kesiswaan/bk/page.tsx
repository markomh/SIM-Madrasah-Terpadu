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

export default function BimbinganKonselingPage() {
  const { currentUser, penugasanList, rombelList, ekstraList, jadwalList } = useAuth();
  
  const canAdd = (currentUser && isWaliKelas(currentUser.id_pegawai, rombelList)) || (currentUser && isOperatorKesiswaan(currentUser.id_pegawai, penugasanList));
  
  // Dummy data BK
  const allCatatan = [
    { id: "c1", nama_siswa: "Ahmad Hasan", tanggal: "2023-10-12", kasus: "Sering Terlambat", kategori: "Biasa", poin: -5 },
    { id: "c2", nama_siswa: "Citra Kirana", tanggal: "2023-10-14", kasus: "Konseling Keluarga", kategori: "Rahasia", poin: 0 },
    { id: "c3", nama_siswa: "Budi Santoso", tanggal: "2023-10-15", kasus: "Berkelahi", kategori: "Pelanggaran Berat", poin: -20 },
  ];

  // RBAC Rahasia: Admin Madrasah tidak boleh melihat data "Rahasia"
  const catatanBk = allCatatan.filter(c => {
    if (c.kategori === "Rahasia" && (currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList))) {
      return false;
    }
    return true;
  });

  return (
    <AppShell title="Bimbingan Konseling">
      <PageHeader
        title="Modul Bimbingan Konseling (BK)"
        description="Pencatatan pelanggaran, poin kedisiplinan, dan konseling siswa. Dilengkapi dengan proteksi data 'Rahasia'."
        action={
          canAdd ? (
            <PrimaryButton type="button">+ Tambah Catatan BK</PrimaryButton>
          ) : null
        }
      />

      <div className="space-y-4">
        {(currentUser && isAdminMadrasah(currentUser.id_pegawai, penugasanList)) && (
          <div className="p-3 bg-amber-50 border border-amber/30 rounded text-amber-800 text-sm font-semibold">
            Mode Admin Madrasah: Data dengan kategori "Rahasia" disembunyikan sesuai kebijakan akses.
          </div>
        )}

        <SurfaceCard>
          <div className="mb-4 flex flex-wrap gap-2">
            <input
              className={`${inputClass} max-w-xs`}
              placeholder="Cari nama siswa atau kasus..."
            />
            <select className={inputClass + " max-w-[160px]"}>
              <option value="all">Semua Kategori</option>
              <option value="Biasa">Biasa</option>
              <option value="Pelanggaran Berat">Pelanggaran Berat</option>
              <option value="Rahasia">Rahasia</option>
            </select>
          </div>

          <DataTable
            data={catatanBk}
            columns={[
              { key: "tanggal", header: "Tanggal", render: (c) => c.tanggal },
              { key: "siswa", header: "Nama Siswa", render: (c) => <span className="font-semibold">{c.nama_siswa}</span> },
              { key: "kasus", header: "Kasus/Catatan", render: (c) => c.kasus },
              { key: "kategori", header: "Kategori", render: (c) => (
                <span className={`px-2 py-1 text-xs rounded-full ${c.kategori === 'Rahasia' ? 'bg-danger-soft text-danger' : 'bg-surface text-ink border border-border'}`}>
                  {c.kategori}
                </span>
              ) },
              { key: "poin", header: "Poin", render: (c) => (
                <span className={c.poin < 0 ? "text-danger" : ""}>{c.poin}</span>
              ) },
              {
                key: "aksi",
                header: "Aksi",
                render: () => (
                  <button className="text-xs font-semibold text-primary">Detail</button>
                ),
              },
            ]}
          />
        </SurfaceCard>
      </div>
    </AppShell>
  );
}
