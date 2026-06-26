import type {
  ActivityLog,
  AppNotification,
  AuthSession,
  CheckoutResponse,
  Customer,
  CustomerInput,
  CustomerUpdate,
  DashboardStats,
  Expense,
  Order,
  OrderInput,
  OrderStatus,
  Outlet,
  PaymentInfo,
  Plan,
  RevenuePoint,
  Service,
  ServiceInput,
  ServiceUpdate,
  Subscription,
  SubscriptionResponse,
  Transaction,
  UsageInfo,
  UserFull,
} from "../types";
import { ACTIVE_STATUSES, STATUS_FLOW } from "../constants";
import { formatTanggalPendek } from "../format";
import {
  customers,
  DEMO_PASSWORD,
  newCustomerId,
  newOrderId,
  newServiceId,
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
  return clone(services).filter((s) => s.is_active);
}

export async function mockCreateService(input: ServiceInput): Promise<Service> {
  await jitter();
  const service: Service = {
    id: newServiceId(),
    ...input,
    is_active: true,
  };
  services.push(service);
  return clone(service);
}

export async function mockUpdateService(id: number, input: ServiceUpdate): Promise<Service> {
  await jitter();
  const service = services.find((s) => s.id === id);
  if (!service) throw new Error("Layanan tidak ditemukan.");
  if (input.nama_layanan !== undefined) service.nama_layanan = input.nama_layanan;
  if (input.harga_per_kilo !== undefined) service.harga_per_kilo = input.harga_per_kilo;
  if (input.is_active !== undefined) service.is_active = input.is_active;
  return clone(service);
}

export async function mockDeleteService(id: number): Promise<{ success: boolean }> {
  await jitter();
  const idx = services.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error("Layanan tidak ditemukan.");
  // Cek apakah ada order aktif yang menggunakan layanan ini
  const hasActiveOrders = orders.some((o) => o.serviceId === id && o.status !== "diambil");
  if (hasActiveOrders) throw new Error("Layanan masih digunakan oleh order aktif.");
  services.splice(idx, 1);
  return { success: true };
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

export async function mockUpdateCustomer(id: number, input: CustomerUpdate): Promise<Customer> {
  await jitter();
  const customer = customers.find((c) => c.id === id);
  if (!customer) throw new Error("Pelanggan tidak ditemukan.");
  if (input.nama !== undefined) customer.nama = input.nama;
  if (input.no_hp !== undefined) customer.no_hp = input.no_hp;
  if (input.alamat !== undefined) customer.alamat = input.alamat;
  return clone(customer);
}

export async function mockDeleteCustomer(id: number): Promise<{ success: boolean }> {
  await jitter();
  const idx = customers.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("Pelanggan tidak ditemukan.");
  const hasActiveOrders = orders.some((o) => o.customerId === id && o.status !== "diambil");
  if (hasActiveOrders) throw new Error("Pelanggan masih memiliki order aktif.");
  customers.splice(idx, 1);
  return { success: true };
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
    tipe_pembayaran: input.tipe_pembayaran,
    tgl_masuk: new Date().toISOString(),
    tgl_selesai: null,
  };
  orders.push(order);
  return enrichOrder(clone(order));
}

export async function mockUpdateOrder(id: number, input: { serviceId?: number; total_berat?: number; catatan?: string | null; tipe_pembayaran?: string | null }): Promise<Order> {
  await jitter();
  const order = orders.find((o) => o.id === id);
  if (!order) throw new Error("Order tidak ditemukan.");
  if (input.serviceId !== undefined) order.serviceId = input.serviceId;
  if (input.total_berat !== undefined) order.total_berat = input.total_berat;
  if (input.catatan !== undefined) order.catatan = input.catatan ?? undefined;
  if (input.tipe_pembayaran !== undefined) order.tipe_pembayaran = input.tipe_pembayaran as any;
  // Recalculate price if service or weight changed
  if (input.serviceId !== undefined || input.total_berat !== undefined) {
    const svc = services.find((s) => s.id === order.serviceId);
    if (svc) order.total_harga = svc.harga_per_kilo * order.total_berat;
  }
  return enrichOrder(clone(order));
}

export async function mockDeleteOrder(id: number): Promise<{ success: boolean }> {
  await jitter();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) throw new Error("Order tidak ditemukan.");
  const order = orders[idx];
  if (order.status !== "antrian" && order.status !== "cuci") {
    throw new Error("Order hanya bisa dihapus saat status Antrian atau Cuci.");
  }
  orders.splice(idx, 1);
  return { success: true };
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

// ----------------- SUBSCRIPTION -----------------

// Mock plans data
const mockPlans: Plan[] = [
  {
    id: 1, name: "free", label: "Free", price_monthly: 0, price_yearly: 0,
    max_users: 1, max_orders_per_month: 100, max_outlets: 1,
    features: { pdf: false, wa: false, backup: false, kanban: true }, trial_days: 0,
  },
  {
    id: 2, name: "pro", label: "Pro", price_monthly: 99000, price_yearly: 990000,
    max_users: 3, max_orders_per_month: 0, max_outlets: 3,
    features: { pdf: true, wa: true, backup: true, kanban: true }, trial_days: 7,
  },
  {
    id: 3, name: "enterprise", label: "Enterprise", price_monthly: 299000, price_yearly: 2990000,
    max_users: 0, max_orders_per_month: 0, max_outlets: 0,
    features: { pdf: true, wa: true, backup: true, kanban: true, multi_outlet: true }, trial_days: 14,
  },
];

// Mock subscription state (persists in memory)
let mockSubscription: Subscription | null = null;
let mockPaymentIdCounter = 1;

export async function mockGetSubscription(): Promise<SubscriptionResponse> {
  await jitter();
  return { subscription: clone(mockSubscription), plans: clone(mockPlans) };
}

export async function mockActivateTrial(): Promise<{ message: string; subscription: { status: string; trial_ends_at: string; plan: string } }> {
  await jitter();
  if (mockSubscription) throw new Error("Sudah memiliki subscription.");

  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 7);

  mockSubscription = {
    id: 1,
    status: "trial",
    plan: mockPlans.find((p) => p.name === "pro")!,
    trial_ends_at: trialEnds.toISOString(),
    current_period_end: null,
    days_until_expiry: 7,
    orders_used: 0,
    orders_limit: 0,
  };

  return {
    message: "Trial 7 hari berhasil diaktifkan!",
    subscription: { status: "trial", trial_ends_at: trialEnds.toISOString(), plan: "Pro" },
  };
}

export async function mockCheckout(input: { plan_id: number; billing: "monthly" | "yearly"; method: string }): Promise<CheckoutResponse> {
  await jitter();
  const plan = mockPlans.find((p) => p.id === input.plan_id);
  if (!plan) throw new Error("Plan tidak ditemukan.");

  const amount = input.billing === "yearly" ? plan.price_yearly : plan.price_monthly;

  mockSubscription = {
    id: 1,
    status: "active",
    plan,
    trial_ends_at: null,
    current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    days_until_expiry: 30,
    orders_used: 0,
    orders_limit: plan.max_orders_per_month,
  };

  return {
    payment_id: mockPaymentIdCounter++,
    snap_token: "mock-snap-token-" + Math.random().toString(36).slice(2),
    redirect_url: "#mock-payment",
    order_id: "LF-MOCK-" + Math.random().toString(36).slice(2, 10),
  };
}

export async function mockGetPaymentDetail(id: number): Promise<PaymentInfo> {
  await jitter();
  return {
    id,
    amount: 99000,
    method: "qris",
    status: "success",
    gateway_ref: "LF-MOCK-12345",
    payment_url: null,
    paid_at: new Date().toISOString(),
    subscription: { status: "active", plan: "Pro" },
  };
}

export async function mockCancelSubscription(): Promise<{ message: string }> {
  await jitter();
  if (mockSubscription) {
    mockSubscription.status = "cancelled";
  }
  return { message: "Subscription dibatalkan." };
}

export async function mockGetUsage(): Promise<UsageInfo> {
  await jitter();
  const activeOrders = orders.filter((o) => o.status !== "diambil").length;
  return {
    orders_used: activeOrders,
    orders_limit: mockSubscription?.orders_limit ?? 100,
    can_create_order: true,
  };
}

// ----------------- USERS -----------------

const mockUsers: UserFull[] = [
  { id: 1, nama: "Budi Santoso", email: "pemilik@laundryflow.id", role: "pemilik", outlet_id: null, email_verified_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: 2, nama: "Siti Aminah", email: "kasir@laundryflow.id", role: "kasir", outlet_id: null, email_verified_at: null, created_at: new Date().toISOString() },
];

export async function mockGetUsers(): Promise<UserFull[]> {
  await jitter();
  return clone(mockUsers);
}

export async function mockCreateUser(input: any): Promise<UserFull> {
  await jitter();
  const user: UserFull = { id: mockUsers.length + 1, ...input, outlet_id: null, email_verified_at: null, created_at: new Date().toISOString() };
  mockUsers.push(user);
  return clone(user);
}

export async function mockUpdateUser(id: number, input: any): Promise<UserFull> {
  await jitter();
  const user = mockUsers.find((u) => u.id === id);
  if (!user) throw new Error("User tidak ditemukan.");
  Object.assign(user, input);
  return clone(user);
}

export async function mockDeleteUser(id: number): Promise<{ success: boolean }> {
  await jitter();
  const idx = mockUsers.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error("User tidak ditemukan.");
  mockUsers.splice(idx, 1);
  return { success: true };
}

export async function mockUpdateProfile(input: any): Promise<UserFull> {
  await jitter();
  const user = mockUsers[0];
  Object.assign(user, input);
  return clone(user);
}

export async function mockChangePassword(input: any): Promise<{ message: string }> {
  await jitter();
  return { message: "Password berhasil diubah." };
}

export async function mockForgotPassword(email: string): Promise<{ message: string }> {
  await jitter();
  return { message: "Link reset password telah dikirim ke email." };
}

// ----------------- OUTLETS -----------------

const mockOutlets: Outlet[] = [
  { id: 1, name: "LaundryFlow Pusat", address: "Jl. Utama No. 1", phone: "021-123456", is_active: true },
];

export async function mockGetOutlets(): Promise<Outlet[]> {
  await jitter();
  return clone(mockOutlets);
}

export async function mockCreateOutlet(input: any): Promise<Outlet> {
  await jitter();
  const outlet: Outlet = { id: mockOutlets.length + 1, ...input, is_active: true };
  mockOutlets.push(outlet);
  return clone(outlet);
}

export async function mockUpdateOutlet(id: number, input: any): Promise<Outlet> {
  await jitter();
  const outlet = mockOutlets.find((o) => o.id === id);
  if (!outlet) throw new Error("Outlet tidak ditemukan.");
  Object.assign(outlet, input);
  return clone(outlet);
}

export async function mockDeleteOutlet(id: number): Promise<{ success: boolean }> {
  await jitter();
  const idx = mockOutlets.findIndex((o) => o.id === id);
  if (idx === -1) throw new Error("Outlet tidak ditemukan.");
  mockOutlets.splice(idx, 1);
  return { success: true };
}

// ----------------- EXPENSES -----------------

const mockExpenses: Expense[] = [
  { id: 1, kategori: "Sabun", deskripsi: "Deterjen pewangi 5kg", nominal: 150000, tanggal: new Date().toISOString().slice(0, 10), created_at: new Date().toISOString() },
  { id: 2, kategori: "Listrik", deskripsi: "Tagihan listrik bulanan", nominal: 500000, tanggal: new Date().toISOString().slice(0, 10), created_at: new Date().toISOString() },
];

export async function mockGetExpenses(filters?: any): Promise<Expense[]> {
  await jitter();
  let result = [...mockExpenses];
  if (filters?.kategori) result = result.filter((e) => e.kategori === filters.kategori);
  return clone(result.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()));
}

export async function mockCreateExpense(input: any): Promise<Expense> {
  await jitter();
  const expense: Expense = { id: mockExpenses.length + 1, ...input, created_at: new Date().toISOString() };
  mockExpenses.push(expense);
  return clone(expense);
}

export async function mockUpdateExpense(id: number, input: any): Promise<Expense> {
  await jitter();
  const expense = mockExpenses.find((e) => e.id === id);
  if (!expense) throw new Error("Pengeluaran tidak ditemukan.");
  Object.assign(expense, input);
  return clone(expense);
}

export async function mockDeleteExpense(id: number): Promise<{ success: boolean }> {
  await jitter();
  const idx = mockExpenses.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error("Pengeluaran tidak ditemukan.");
  mockExpenses.splice(idx, 1);
  return { success: true };
}

// ----------------- NOTIFICATIONS -----------------

const mockNotifications: AppNotification[] = [
  { id: 1, title: "Selamat Datang", message: "Selamat datang di LaundryFlow!", type: "info", link: null, is_read: false, created_at: new Date().toISOString() },
];

export async function mockGetNotifications(): Promise<{ notifications: AppNotification[]; unread_count: number }> {
  await jitter();
  const sorted = clone(mockNotifications).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return { notifications: sorted, unread_count: sorted.filter((n) => !n.is_read).length };
}

export async function mockMarkRead(id: number): Promise<{ success: boolean }> {
  await jitter();
  const n = mockNotifications.find((n) => n.id === id);
  if (n) n.is_read = true;
  return { success: true };
}

export async function mockMarkAllRead(): Promise<{ success: boolean }> {
  await jitter();
  mockNotifications.forEach((n) => (n.is_read = true));
  return { success: true };
}

export async function mockDeleteNotification(id: number): Promise<{ success: boolean }> {
  await jitter();
  const idx = mockNotifications.findIndex((n) => n.id === id);
  if (idx !== -1) mockNotifications.splice(idx, 1);
  return { success: true };
}

export async function mockCreateNotification(input: any): Promise<AppNotification> {
  await jitter();
  const n: AppNotification = { id: mockNotifications.length + 1, ...input, is_read: false, created_at: new Date().toISOString() };
  mockNotifications.push(n);
  return clone(n);
}

// ----------------- ACTIVITY LOGS -----------------

const mockLogs: ActivityLog[] = [];

export async function mockGetActivityLogs(filters?: any): Promise<ActivityLog[]> {
  await jitter();
  let result = [...mockLogs];
  if (filters?.type) result = result.filter((l) => l.type === filters.type);
  return clone(result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
}

// ----------------- CUSTOMER ORDERS -----------------

export async function mockGetCustomerOrders(customerId: number): Promise<Order[]> {
  await jitter();
  return orders
    .filter((o) => o.customerId === customerId)
    .sort((a, b) => +new Date(b.tgl_masuk) - +new Date(a.tgl_masuk))
    .map(enrichOrder);
}

// ----------------- ORDER TRACKING -----------------

/** Hitung estimasi selesai berdasarkan layanan dan berat (menit). */
function getEstimatedMinutes(serviceName: string | undefined, berat: number): number {
  const waktuPerKg = serviceName === "Setrika Saja" ? 20 : serviceName === "Express 6 Jam" ? 10 : 30;
  return Math.ceil(berat * waktuPerKg) + 30; // +30 menit buffer
}

/** Format menit ke teks yang mudah dibaca. */
function formatEstimate(minutes: number): string {
  const jam = Math.floor(minutes / 60);
  const menit = minutes % 60;
  if (jam > 0 && menit > 0) return `${jam} jam ${menit} menit`;
  if (jam > 0) return `${jam} jam`;
  return `${menit} menit`;
}

export async function mockGetOrderTracking(orderId: number): Promise<any> {
  await jitter();
  const order = orders.find((o) => o.id === orderId);
  if (!order) throw new Error("Order tidak ditemukan.");
  const enriched = enrichOrder(order);

  // Hitung estimasi selesai
  let estimasi_selesai: string | null = null;
  if (enriched.status !== "diambil") {
    const menit = getEstimatedMinutes(enriched.service?.nama_layanan, enriched.total_berat);
    estimasi_selesai = formatEstimate(menit);
  }

  return {
    id: enriched.id,
    status: enriched.status,
    service: enriched.service?.nama_layanan,
    total_berat: enriched.total_berat,
    total_harga: enriched.total_harga,
    catatan: enriched.catatan,
    tgl_masuk: enriched.tgl_masuk,
    tgl_selesai: enriched.tgl_selesai,
    foto: enriched.foto,
    estimasi_selesai,
  };
}
