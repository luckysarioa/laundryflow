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
  is_active: boolean;
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
  tipe_pembayaran?: TipePembayaran;
  foto?: string; // path foto bukti cucian
  tgl_masuk: string; // ISO date
  tgl_selesai: string | null; // ISO date, terisi saat status = diambil
  transactions?: Transaction[];
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
  tipe_pembayaran?: TipePembayaran;
}

export interface CustomerInput {
  nama: string;
  no_hp: string;
  alamat: string;
}

export interface CustomerUpdate {
  nama?: string;
  no_hp?: string;
  alamat?: string;
}

export interface ServiceInput {
  nama_layanan: string;
  harga_per_kilo: number;
}

export interface ServiceUpdate {
  nama_layanan?: string;
  harga_per_kilo?: number;
  is_active?: boolean;
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

// ----- Subscription types -----

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'expired' | 'cancelled' | 'none';

export interface Plan {
  id: number;
  name: string;
  label: string;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_orders_per_month: number;
  max_outlets: number;
  features: Record<string, boolean>;
  trial_days: number;
}

export interface Subscription {
  id: number;
  status: SubscriptionStatus;
  plan: Plan | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  days_until_expiry: number | null;
  orders_used: number;
  orders_limit: number;
}

export interface SubscriptionResponse {
  subscription: Subscription | null;
  plans: Plan[];
}

export interface PaymentInfo {
  id: number;
  amount: number;
  method: string;
  status: string;
  gateway_ref: string | null;
  payment_url: string | null;
  paid_at: string | null;
  subscription: {
    status: string;
    plan: string;
  };
}

export interface CheckoutResponse {
  payment_id: number;
  snap_token: string;
  redirect_url: string;
  order_id: string;
}

export interface UsageInfo {
  orders_used: number;
  orders_limit: number;
  can_create_order: boolean;
}

// ----- Expense types -----

export interface Expense {
  id: number;
  kategori: string;
  deskripsi: string;
  nominal: number;
  tanggal: string;
  created_at: string;
}

// ----- Outlet types -----

export interface Outlet {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
}

// ----- User types (extended) -----

export interface UserFull {
  id: number;
  nama: string;
  email: string;
  role: Role;
  outlet_id: number | null;
  outlet?: Outlet;
  email_verified_at: string | null;
  created_at: string;
}

// ----- Notification types -----

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// ----- Activity Log types -----

export interface ActivityLog {
  id: number;
  user?: UserFull;
  type: string;
  subject_type: string | null;
  subject_id: number | null;
  properties: Record<string, any> | null;
  created_at: string;
}
