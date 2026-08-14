export type MasterProvinsi = { 
  id_provinsi: string; 
  kode_provinsi: string; 
  nama_provinsi: string;
};

export type MasterKabupaten = { 
  id_kabupaten: string; 
  id_provinsi: string; 
  kode_kabupaten: string; 
  nama_kabupaten: string;
};

export type MasterKecamatan = { 
  id_kecamatan: string; 
  id_kabupaten: string; 
  kode_kecamatan: string; 
  nama_kecamatan: string;
};

export type MasterDesa = { 
  id_desa: string; 
  id_kecamatan: string; 
  kode_desa: string; 
  nama_desa: string;
};
