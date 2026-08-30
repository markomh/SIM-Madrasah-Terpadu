import type { StatusAbsensi } from "@/types";

export type StatusKey = StatusAbsensi | "Belum";
export type StatusFilterKey = "Semua" | StatusKey;

export interface StatusConfigItem {
  label: string;
  letter: string;
  className: string;
  bgClass: string;
  iconClass: string;
}

export const STATUS_CONFIG: Record<StatusKey, StatusConfigItem> = {
  Hadir: {
    label: "Hadir",
    letter: "H",
    className: "text-primary",
    bgClass: "bg-primary-soft text-primary",
    iconClass: "text-primary",
  },
  Izin: {
    label: "Izin",
    letter: "I",
    className: "text-amber",
    bgClass: "bg-amber-soft text-amber",
    iconClass: "text-amber",
  },
  Sakit: {
    label: "Sakit",
    letter: "S",
    className: "text-amber",
    bgClass: "bg-amber-soft text-amber",
    iconClass: "text-amber",
  },
  Alpa: {
    label: "Alpa",
    letter: "A",
    className: "text-danger",
    bgClass: "bg-danger-soft text-danger",
    iconClass: "text-danger",
  },
  Belum: {
    label: "Belum",
    letter: "—",
    className: "text-muted",
    bgClass: "bg-paper text-muted",
    iconClass: "text-muted",
  },
};
