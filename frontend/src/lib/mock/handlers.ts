import type {
  AuthSession,
  Customer,
  CustomerInput,
  DashboardStats,
  Order,
  OrderInput,
  OrderStatus,
  RevenuePoint,
  Service,
  Transaction,
} from "../types";
import { ACTIVE_STATUSES, STATUS_FLOW } from "../constants";
import { formatTanggalPendek } from "../format";
import {
  customers,
  DEMO_PASSWORD,
  newCustomerId,
  newOrderId,
  newTransactionId,
  orders,
  services,
  statusIndex,
  transactions,
  users,
} from "./db";

// ==========================================================
// Mock API handlers.
// Tiap fungsi mensimulasikan panggilan jaringan: mengembalikan Promise
// dengan delay kecil agar UI terasa realistis (loading state, dll).
//
// Bentuk input/output sengaja dibuat sama dengan kontrak API Laravel
// (lihat /backend/README.md) agar lib/api.ts cukup menukar implementasi.
// ==========================================================

const STATUS_FLOW_LENGTH = STATUS_FLOW.length;

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

// Small jitter agar tiap request terasa natural.
const jitter = () => delay(120 + Math.random() * 280);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/** Enrich order dengan customer & service agar front-end tinggal pakai. */
function enrichOrder(order: Order): Order {
  return {
    ...order,
    customer: customers.find((c) => c.id === order.customerId),
    service: services.find((s) => s.id === order.serviceId),
  };
}

// ----------------- AUTH -----------------

export async function mockLogin(email: string, password: string): Promise<AuthSession> {
  await jitter();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user || password !== DEMO_PASSWORD) {
    throw new Error("Email atau kata sandi salah.");
  }
  return {
    token: "mock-token-" + Math.random().toString(36).slice(2),
    user: clone(user),
  };
}

// ----------------- SERVICES -----------------

export async function mockGetServices(): Promise<Service[]> {
  await jitter();
  return clone(services);
}

// ----------------- CUSTOMERS -----------------

export async function mockGetCustomers(): Promise<Customer[]> {
  await jitter();
  return clone(customers).sort((a, b) => b.id - a.id);
}

export async function mockCreateCustomer(input: CustomerInput): Promise<Customer> {
  await jitter();
  const customer: Customer = {
    id: newCustomerId(),
    ...input,
    createdAt: new Date().toISOString(),
  };
  customers.push(customer);
  return clone(customer);
}

// ----------------- ORDERS -----------------

export async function mockGetOrders(filters?: {
  status?: OrderStatus;
  q?: string;
}): Promise<Order[]> {
  await jitter();
  let result = [...orders];
  if (filters?.status) {
    result = result.filter((o) => o.status === filters.status);
  }
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    result = result.filter((o) => {
      const cust = customers.find((c) => c.id === o.customerId);
      return (
        cust?.nama.toLowerCase().includes(q) ||
        String(o.id).includes(q) ||
        cust?.no_hp.includes(q)
      );
    });
  }
  return result
    .sort((a, b) => +new Date(b.tgl_masuk) - +new Date(a.tgl_masuk))
    .map(enrichOrder);
}

export async function mockGetOrder(id: number): Promise<Order> {
  await jitter();
  const order = orders.find((o) => o.id === id);
  if (!order) throw new Error("Order tidak ditemukan.");
  return enrichOrder(clone(order));
}

export async function mockCreateOrder(input: OrderInput): Promise<Order> {
  await jitter();
  const service = services.find((s) => s.id === input.serviceId);
  if (!service) throw new Error("Layanan tidak valid.");
  if (input.total_berat <= 0) throw new Error("Berat harus lebih dari 0.");

  const order: Order = {
    id: newOrderId(),
    customerId: input.customerId,
    serviceId: input.serviceId,
    total_berat: input.total_berat,
    total_harga: service.harga_per_kilo * input.total_berat,
    status: "antrian",
    catatan: input.catatan,
    tgl_masuk: new Date().toISOString(),
    tgl_selesai: null,
  };
  orders.push(order);
  return enrichOrder(clone(order));
}

/** Advance status ke tahap berikutnya (Antrian→Cuci→...→Diambil). */
export async function mockAdvanceOrder(id: number): Promise<Order> {
  await jitter();
  const order = orders.find((o) => o.id === id);
  if (!order) throw new Error("Order tidak ditemukan.");

  const idx = statusIndex(order.status);
  if (idx >= STATUS_FLOW_LENGTH - 1) {
    throw new Error("Order sudah berada di status akhir (Diambil).");
  }
  const next = STATUS_FLOW[idx + 1];
  order.status = next;
  if (next === "diambil") {
    order.tgl_selesai = new Date().toISOString();
    // Catat transaksi saat diambil (lunas).
    transactions.push({
      id: newTransactionId(),
      orderId: order.id,
      nominal: order.total_harga,
      tipe_pembayaran: "tunai",
      created_at: new Date().toISOString(),
    });
  }
  return enrichOrder(clone(order));
}

/** Set status secara langsung (mis. dari kanban board). */
export async function mockSetOrderStatus(id: number, status: OrderStatus): Promise<Order> {
  await jitter();
  const order = orders.find((o) => o.id === id);
  if (!order) throw new Error("Order tidak ditemukan.");
  order.status = status;
  if (status === "diambil" && !order.tgl_selesai) {
    order.tgl_selesai = new Date().toISOString();
  }
  return enrichOrder(clone(order));
}

// ----------------- DASHBOARD -----------------

export async function mockGetDashboardStats(): Promise<DashboardStats> {
  await jitter();
  const todayStr = new Date().toDateString();

  const todayOrders = orders.filter((o) => new Date(o.tgl_masuk).toDateString() === todayStr);
  const omzetHariIni = todayOrders.reduce((sum, o) => sum + o.total_harga, 0);
  const cucianDiproses = orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
  const siapDiambil = orders.filter((o) => o.status === "siap").length;

  return {
    omzetHariIni,
    jumlahOrderHariIni: todayOrders.length,
    cucianDiproses,
    siapDiambil,
    totalCustomer: customers.length,
  };
}

// ----------------- REPORTS -----------------

export async function mockGetRevenue(dari: string, sampai: string): Promise<RevenuePoint[]> {
  await jitter();
  const start = new Date(dari);
  const end = new Date(sampai);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  // Bangun bucket per hari dalam rentang.
  const buckets = new Map<string, { omzet: number; jumlahOrder: number }>();
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    buckets.set(key, { omzet: 0, jumlahOrder: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  // Omzet = nominal order berstatus lunas (siap/diambil) yang masuk rentang.
  for (const order of orders) {
    const t = new Date(order.tgl_masuk);
    if (t < start || t > end) continue;
    if (order.status !== "siap" && order.status !== "diambil") continue;
    const key = t.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.omzet += order.total_harga;
      bucket.jumlahOrder += 1;
    }
  }

  return Array.from(buckets.entries()).map(([tanggal, val]) => ({
    tanggal,
    label: formatTanggalPendek(tanggal),
    omzet: val.omzet,
    jumlahOrder: val.jumlahOrder,
  }));
}

// ----------------- TRANSACTIONS -----------------

export async function mockGetTransactions(): Promise<Transaction[]> {
  await jitter();
  return clone(transactions).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
}

// ----------------- WHATSAPP -----------------

/**
 * Mock pengiriman WhatsApp. Pada backend asli, ini dipicu via Queue job
 * (lihat PRD poin 4 — Queue System). Di sini hanya mensimulasikan sukses
 * dan mengembalikan flag; URL compose di-construct di front-end (WhatsAppButton).
 */
export async function mockSendWhatsApp(orderId: number): Promise<{ success: boolean }> {
  await delay(400);
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new Error("Order tidak ditemukan.");
  return { success: true };
}
