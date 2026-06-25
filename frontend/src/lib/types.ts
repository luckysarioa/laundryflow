// ==========================================================
// Tipe data inti LaundryFlow.
// Bentuk ini mencerminkan struktur tabel backend Laravel (lihat /backend/README.md),
// sehingga ketika mock diganti dengan API sungguhan, tidak ada perubahan tipe.
// ==========================================================

export type Role = "pemilik" | "kasir";

/** Tabel: users */
export interface User {
  id: number;
  nama: string;
  email: string;
  role: Role;
}

/** Versi login juga mengembalikan token Sanctum. */
export interface AuthSession {
  token: string;
  user: User;
}

/** Tabel: customers */
export interface Customer {
  id: number;
  nama: string;
  no_hp: string;
  alamat: string;
  createdAt: string; // ISO date
}

/** Tabel: services */
export interface Service {
  id: number;
  nama_layanan: string;
  harga_per_kilo: number;
}

/** Alur status cucian — urutan ini WAJIB (lihat constants.ts STATUS_FLOW). */
export type OrderStatus = "antrian" | "cuci" | "setrika" | "siap" | "diambil";

/** Tabel: orders */
export interface Order {
  id: number;
  customerId: number;
  customer?: Customer; // di-join saat dibaca
  serviceId: number;
  service?: Service;
  total_berat: number; // kilogram
  total_harga: number; // dihitung: berat * harga_per_kilo
  status: OrderStatus;
  catatan?: string;
  tgl_masuk: string; // ISO date
  tgl_selesai: string | null; // ISO date, terisi saat status = diambil
}

/** Tabel: transactions */
export type TipePembayaran = "tunai" | "qris" | "transfer";

export interface Transaction {
  id: number;
  orderId: number;
  nominal: number;
  tipe_pembayaran: TipePembayaran;
  created_at: string; // ISO date
}

// ----- Tipe input untuk create/update -----

export interface OrderInput {
  customerId: number;
  serviceId: number;
  total_berat: number;
  catatan?: string;
}

export interface CustomerInput {
  nama: string;
  no_hp: string;
  alamat: string;
}

// ----- Tipe hasil agregasi (dashboard & laporan) -----

export interface DashboardStats {
  omzetHariIni: number;
  jumlahOrderHariIni: number;
  cucianDiproses: number; // semua status kecuali 'diambil'
  siapDiambil: number; // status = 'siap'
  totalCustomer: number;
}

export interface RevenuePoint {
  tanggal: string; // "YYYY-MM-DD"
  label: string; // label untuk chart, mis. "12 Jun"
  omzet: number;
  jumlahOrder: number;
}
