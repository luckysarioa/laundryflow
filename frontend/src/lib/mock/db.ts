import type { Customer, Order, Service, Transaction, User, OrderStatus } from "../types";
import { STATUS_FLOW } from "../constants";

// ==========================================================
// Database mock in-memory.
// Data di-seed sekali saat modul dimuat. Perubahan (create/update)
// akan bertahan selama sesi browser (sampai hard refresh).
// ==========================================================

// ----- Helper: buat tanggal mundur dari hari ini -----
function daysAgo(days: number, hour = 9, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// ----- Users (akun demo) -----
export const users: User[] = [
  { id: 1, nama: "Budi Santoso", email: "pemilik@laundryflow.id", role: "pemilik" },
  { id: 2, nama: "Siti Aminah", email: "kasir@laundryflow.id", role: "kasir" },
];
// Password demo tidak disimpan sebagai data — divalidasi di handlers.ts.
export const DEMO_PASSWORD = "laundry123";

// ----- Services -----
export const services: Service[] = [
  { id: 1, nama_layanan: "Cuci Kering", harga_per_kilo: 7000, is_active: true },
  { id: 2, nama_layanan: "Cuci Setrika", harga_per_kilo: 9000, is_active: true },
  { id: 3, nama_layanan: "Setrika Saja", harga_per_kilo: 5000, is_active: true },
  { id: 4, nama_layanan: "Express 6 Jam", harga_per_kilo: 15000, is_active: true },
];

// ----- Customers -----
export const customers: Customer[] = [
  { id: 1, nama: "Andi Wijaya", no_hp: "081234567890", alamat: "Jl. Melati No. 12, Kebon Jeruk", createdAt: daysAgo(45) },
  { id: 2, nama: "Dewi Lestari", no_hp: "082198765432", alamat: "Jl. Anggrek No. 8, Tanah Kusir", createdAt: daysAgo(40) },
  { id: 3, nama: "Rudi Hartono", no_hp: "085711122233", alamat: "Jl. Kenanga No. 21, Cipete", createdAt: daysAgo(38) },
  { id: 4, nama: "Maya Sari", no_hp: "081399988877", alamat: "Jl. Flamboyan No. 5, Permata Hijau", createdAt: daysAgo(30) },
  { id: 5, nama: "Joko Susilo", no_hp: "087812345678", alamat: "Jl. Cempaka No. 17, Kebayoran", createdAt: daysAgo(28) },
  { id: 6, nama: "Rina Marlina", no_hp: "082233445566", alamat: "Jl. Dahlia No. 3, Pondok Indah", createdAt: daysAgo(20) },
  { id: 7, nama: "Agus Setiawan", no_hp: "081567891011", alamat: "Jl. Teratai No. 9, Bintaro", createdAt: daysAgo(15) },
  { id: 8, nama: "Putri Nabila", no_hp: "083812345670", alamat: "Jl. Bougenville No. 14, Pasar Minggu", createdAt: daysAgo(10) },
];

// ----- Orders -----
// Distribusi: lintas status & 30 hari terakhir agar dashboard & laporan "hidup".
function harga(serviceId: number, berat: number): number {
  const svc = services.find((s) => s.id === serviceId)!;
  return svc.harga_per_kilo * berat;
}

type Seed = [number, number, number, number, OrderStatus, string?]; // [customer, service, berat, hariLalu, status, catatan?]

const orderSeeds: Seed[] = [
  // Hari ini (0)
  [1, 2, 3.5, 0, "antrian"],
  [2, 4, 2, 0, "cuci", "Prioritas, jemput sore"],
  [3, 1, 4.2, 0, "siap"],
  // Kemarin (1)
  [4, 2, 1.8, 1, "setrika"],
  [5, 3, 6, 1, "siap"],
  [6, 4, 2.5, 1, "diambil"],
  // 2-3 hari lalu
  [7, 2, 5, 2, "diambil"],
  [8, 1, 3, 2, "siap"],
  [1, 2, 2.2, 3, "diambil"],
  [2, 4, 1.5, 3, "diambil"],
  // 4-7 hari lalu
  [3, 2, 4.8, 4, "diambil"],
  [4, 3, 3.3, 5, "diambil"],
  [5, 1, 7, 6, "diambil"],
  [6, 2, 2.7, 7, "diambil"],
  // 10-28 hari lalu (riwayat untuk laporan)
  [7, 2, 3.9, 10, "diambil"],
  [8, 4, 2, 12, "diambil"],
  [1, 1, 5.5, 15, "diambil"],
  [2, 2, 4, 18, "diambil"],
  [3, 3, 6.5, 22, "diambil"],
  [4, 2, 3, 25, "diambil"],
  [5, 4, 2.8, 28, "diambil"],
];

export const orders: Order[] = orderSeeds.map((s, i) => {
  const [customerId, serviceId, berat, hariLalu, status, catatan] = s;
  const isDiambil = status === "diambil";
  return {
    id: i + 1,
    customerId,
    serviceId,
    total_berat: berat,
    total_harga: harga(serviceId, berat),
    status,
    catatan,
    tgl_masuk: daysAgo(hariLalu, 9 + (i % 6)),
    tgl_selesai: isDiambil ? daysAgo(Math.max(0, hariLalu - 1), 16) : null,
  };
});

// ----- Transactions -----
// Setiap order yang berstatus 'siap' atau 'diambil' dianggap sudah lunas (DP/lunas).
export const transactions: Transaction[] = orders
  .filter((o) => o.status === "siap" || o.status === "diambil")
  .map((o, i) => ({
    id: i + 1,
    orderId: o.id,
    nominal: o.total_harga,
    tipe_pembayaran: (["tunai", "qris", "transfer"] as const)[i % 3],
    created_at: o.tgl_masuk,
  }));

// ----- Auto-increment counter -----
let nextOrderId = orders.length + 1;
let nextCustomerId = customers.length + 1;
let nextServiceId = services.length + 1;
let nextTransactionId = transactions.length + 1;

export function newOrderId() {
  return nextOrderId++;
}
export function newCustomerId() {
  return nextCustomerId++;
}
export function newServiceId() {
  return nextServiceId++;
}
export function newTransactionId() {
  return nextTransactionId++;
}

/** Helper: dapatkan index status dalam flow (untuk advance). */
export function statusIndex(status: OrderStatus): number {
  return STATUS_FLOW.indexOf(status);
}
