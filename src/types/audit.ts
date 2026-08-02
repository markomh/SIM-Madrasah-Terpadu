export type AuditLog = {
  id_log: string;
  id_user: string;
  nama_tabel: string;
  id_record: string;
  aksi: "Create" | "Update" | "Delete" | "Approve" | "Reject";
  timestamp: string;
};
