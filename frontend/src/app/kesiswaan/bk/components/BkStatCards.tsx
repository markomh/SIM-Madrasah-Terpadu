"use client";

import { Users, AlertTriangle, MessageSquare, FileWarning } from "lucide-react";

interface BkStatCardsProps {
  totalKonseli: number;
  totalRombel: number;
  totalKritis: number;
  totalSesiBulanIni: number;
  totalSpDiterbitkan: number;
}

export function BkStatCards({
  totalKonseli,
  totalRombel,
  totalKritis,
  totalSesiBulanIni,
  totalSpDiterbitkan,
}: BkStatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* CARD 1: Total Siswa Konseli */}
      <div className="bg-white p-4.5 rounded-xl border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Total Siswa Konseli
          </span>
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
            <Users className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-2xl font-bold text-gray-900">{totalKonseli} Siswa</p>
          <p className="text-xs text-blue-700 font-medium mt-0.5">
            {totalRombel} Rombongan Belajar Binaan
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
      </div>

      {/* CARD 2: Peringatan Kritis */}
      <div className="bg-white p-4.5 rounded-xl border border-rose-200 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
            Peringatan Kritis
          </span>
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600 group-hover:scale-105 transition-transform animate-pulse">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-2xl font-bold text-rose-700">{totalKritis} Siswa</p>
          <p className="text-xs text-rose-600 font-medium mt-0.5">
            Akumulasi &gt; 75 Poin Pelanggaran
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-rose-500" />
      </div>

      {/* CARD 3: Sesi Konseling Bulan Ini */}
      <div className="bg-white p-4.5 rounded-xl border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Sesi Konseling Bulan Ini
          </span>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
            <MessageSquare className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-2xl font-bold text-gray-900">{totalSesiBulanIni} Sesi</p>
          <p className="text-xs text-emerald-700 font-medium mt-0.5">
            Layanan Aktif &amp; Terjadwal
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
      </div>

      {/* CARD 4: SP / Surat Panggilan */}
      <div className="bg-white p-4.5 rounded-xl border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            SP / Surat Panggilan
          </span>
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform">
            <FileWarning className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-2.5">
          <p className="text-2xl font-bold text-gray-900">{totalSpDiterbitkan} SP</p>
          <p className="text-xs text-amber-700 font-medium mt-0.5">
            Telah Diterbitkan Semester Ini
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
      </div>
    </div>
  );
}
