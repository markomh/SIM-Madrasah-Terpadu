import type { 
  ParameterEkuivalensiJTM, 
  KuotaJTMKurikulum, 
  PlottingBKTIK, 
  RekapBebanKerjaGuru,
  StatusSK,
  PeriodePembagianTugas 
} from "@/types/penugasan";
import { apiClient } from "./api-client";

export const penugasanDomainApi = {
  getParameterEkuivalensi: async (id_tahun: string): Promise<ParameterEkuivalensiJTM[]> => {
    return apiClient.get<ParameterEkuivalensiJTM[]>(`/penugasan/parameter?id_tahun=${id_tahun}`);
  },
  
  getKuotaKurikulum: async (): Promise<KuotaJTMKurikulum[]> => {
    return apiClient.get<KuotaJTMKurikulum[]>("/penugasan/kuota-kurikulum");
  },
  
  getPlottingBK: async (id_tahun?: string): Promise<PlottingBKTIK[]> => {
    return apiClient.get<PlottingBKTIK[]>(`/penugasan/plotting-bk${id_tahun ? `?id_tahun=${id_tahun}` : ''}`);
  },

  createPlottingBK: async (data: { id_pegawai: string; id_rombel: string; id_tahun: string }): Promise<PlottingBKTIK> => {
    return apiClient.post<PlottingBKTIK>("/penugasan/plotting-bk", data);
  },

  deletePlottingBK: async (id_plotting: string): Promise<boolean> => {
    return apiClient.delete<boolean>(`/penugasan/plotting-bk/${id_plotting}`);
  },
  
  getPeriodePembagianTugas: async (id_tahun: string): Promise<PeriodePembagianTugas | null> => {
    return apiClient.get<PeriodePembagianTugas | null>(`/penugasan/periode?id_tahun=${id_tahun}`);
  },
  
  updateStatusSK: async (id_tahun: string, status: StatusSK): Promise<PeriodePembagianTugas> => {
    return apiClient.put<PeriodePembagianTugas>(`/penugasan/periode/${id_tahun}/status`, { status });
  },
  
  hitungRekapBebanKerja: async (id_tahun: string): Promise<RekapBebanKerjaGuru[]> => {
    return apiClient.get<RekapBebanKerjaGuru[]>(`/penugasan/rekap-beban?id_tahun=${id_tahun}`);
  }
};
