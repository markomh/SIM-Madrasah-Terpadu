import * as mock from "./penugasan-jabatan.mock";

export const penugasanJabatanService = {
  getAll: mock.getAllPenugasan,
  getByPegawai: mock.getPenugasanByPegawai,
  create: mock.createPenugasan,
  akhiri: mock.akhiriPenugasan,
};
