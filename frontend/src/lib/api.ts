// ==========================================================
// Gateway data LaundryFlow.
//
// Ini adalah SATU-SATUNYA tempat komponen boleh mengambil/mengubah data.
// Berdasarkan NEXT_PUBLIC_USE_MOCK, request dialihkan ke:
//   - true  → mock handlers (lib/mock/handlers.ts)
//   - false → backend Laravel (NEXT_PUBLIC_API_URL, Sanctum token)
//
// Saat backend siap, cukup set NEXT_PUBLIC_USE_MOCK=false dan isi
// NEXT_PUBLIC_API_URL. Tidak ada komponen yang perlu diubah.
// ==========================================================

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
} from "./types";
import {
  mockActivateTrial,
  mockAdvanceOrder,
  mockCancelSubscription,
  mockCheckout,
  mockCreateCustomer,
  mockCreateExpense,
  mockCreateNotification,
  mockCreateOrder,
  mockCreateOutlet,
  mockCreateService,
  mockCreateUser,
  mockDeleteCustomer,
  mockDeleteExpense,
  mockDeleteNotification,
  mockDeleteOrder,
  mockDeleteOutlet,
  mockDeleteService,
  mockDeleteUser,
  mockGetActivityLogs,
  mockGetCustomers,
  mockGetDashboardStats,
  mockGetExpenses,
  mockGetNotifications,
  mockGetOrder,
  mockGetOrders,
  mockGetOutlets,
  mockGetPaymentDetail,
  mockGetRevenue,
  mockGetServices,
  mockGetSubscription,
  mockGetTransactions,
  mockGetUsage,
  mockGetUsers,
  mockLogin,
  mockMarkAllRead,
  mockMarkRead,
  mockSendWhatsApp,
  mockSetOrderStatus,
  mockUpdateCustomer,
  mockUpdateExpense,
  mockUpdateOrder,
  mockUpdateOutlet,
  mockUpdateProfile,
  mockUpdateService,
  mockUpdateUser,
  mockChangePassword,
  mockForgotPassword,
  mockGetCustomerOrders,
  mockGetOrderTracking,
} from "./mock/handlers";
import { AUTH_STORAGE_KEY } from "./constants";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false"; // default true
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Token Sanctum disimpan di localStorage saat login (lihat AuthContext).
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw).token ?? null) : null;
  } catch {
    return null;
  }
}

/** Wrapper fetch untuk backend Laravel: sisipkan header Auth + handle error. */
async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    let message = `Permintaan gagal (${res.status})`;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      /* abaikan body non-JSON */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// ----------------- AUTH -----------------

export const api = {
  async login(email: string, password: string): Promise<AuthSession> {
    if (USE_MOCK) return mockLogin(email, password);
    return http<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  // ----------------- SERVICES -----------------

  async getServices(): Promise<Service[]> {
    if (USE_MOCK) return mockGetServices();
    return http<Service[]>("/services");
  },

  async createService(input: ServiceInput): Promise<Service> {
    if (USE_MOCK) return mockCreateService(input);
    return http<Service>("/services", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateService(id: number, input: ServiceUpdate): Promise<Service> {
    if (USE_MOCK) return mockUpdateService(id, input);
    return http<Service>(`/services/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async deleteService(id: number): Promise<{ success: boolean }> {
    if (USE_MOCK) return mockDeleteService(id);
    return http<{ success: boolean }>(`/services/${id}`, { method: "DELETE" });
  },

  // ----------------- CUSTOMERS -----------------

  async getCustomers(): Promise<Customer[]> {
    if (USE_MOCK) return mockGetCustomers();
    return http<Customer[]>("/customers");
  },

  async createCustomer(input: CustomerInput): Promise<Customer> {
    if (USE_MOCK) return mockCreateCustomer(input);
    return http<Customer>("/customers", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateCustomer(id: number, input: CustomerUpdate): Promise<Customer> {
    if (USE_MOCK) return mockUpdateCustomer(id, input);
    return http<Customer>(`/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async deleteCustomer(id: number): Promise<{ success: boolean }> {
    if (USE_MOCK) return mockDeleteCustomer(id);
    return http<{ success: boolean }>(`/customers/${id}`, { method: "DELETE" });
  },

  // ----------------- ORDERS -----------------

  async getOrders(filters?: { status?: OrderStatus; q?: string }): Promise<Order[]> {
    if (USE_MOCK) return mockGetOrders(filters);
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.q) params.set("q", filters.q);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return http<Order[]>(`/orders${qs}`);
  },

  async getOrder(id: number): Promise<Order> {
    if (USE_MOCK) return mockGetOrder(id);
    return http<Order>(`/orders/${id}`);
  },

  async createOrder(input: OrderInput): Promise<Order> {
    if (USE_MOCK) return mockCreateOrder(input);
    return http<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async advanceOrder(id: number): Promise<Order> {
    if (USE_MOCK) return mockAdvanceOrder(id);
    return http<Order>(`/orders/${id}/advance`, { method: "PATCH" });
  },

  async setOrderStatus(id: number, status: OrderStatus): Promise<Order> {
    if (USE_MOCK) return mockSetOrderStatus(id, status);
    return http<Order>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async updateOrder(id: number, input: { serviceId?: number; total_berat?: number; catatan?: string | null; tipe_pembayaran?: string | null }): Promise<Order> {
    if (USE_MOCK) return mockUpdateOrder(id, input);
    return http<Order>(`/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async deleteOrder(id: number): Promise<{ success: boolean }> {
    if (USE_MOCK) return mockDeleteOrder(id);
    return http<{ success: boolean }>(`/orders/${id}`, { method: "DELETE" });
  },

  async uploadOrderFoto(id: number, foto: File): Promise<Order> {
    if (USE_MOCK) {
      // Mock upload - in real app this would call backend
      const order = await mockGetOrder(id);
      return { ...order, foto: URL.createObjectURL(foto) };
    }
    const formData = new FormData();
    formData.append("foto", foto);
    const token = getToken();
    const res = await fetch(`${API_URL}/orders/${id}/foto`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      let message = `Upload gagal (${res.status})`;
      try {
        const body = await res.json();
        message = body.message ?? message;
      } catch { /* ignore */ }
      throw new Error(message);
    }
    return res.json() as Promise<Order>;
  },

  async deleteOrderFoto(id: number): Promise<Order> {
    if (USE_MOCK) {
      const order = await mockGetOrder(id);
      return { ...order, foto: undefined };
    }
    return http<Order>(`/orders/${id}/foto`, { method: "DELETE" });
  },

  // ----------------- DASHBOARD -----------------

  async getDashboardStats(): Promise<DashboardStats> {
    if (USE_MOCK) return mockGetDashboardStats();
    return http<DashboardStats>("/dashboard/stats");
  },

  // ----------------- REPORTS -----------------

  async getRevenue(dari: string, sampai: string): Promise<RevenuePoint[]> {
    if (USE_MOCK) return mockGetRevenue(dari, sampai);
    return http<RevenuePoint[]>(
      `/reports/revenue?dari=${dari}&sampai=${sampai}`,
    );
  },

  async downloadRevenuePdf(dari: string, sampai: string): Promise<void> {
    if (USE_MOCK) {
      // Mock download - create a simple text file
      const content = `Laporan Pendapatan\nDari: ${dari}\nSampai: ${sampai}\n\nIni adalah mock PDF. Dalam versi produksi, ini akan mengunduh file PDF.`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-pendapatan-${dari}-sampai-${sampai}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
    const token = getToken();
    const res = await fetch(`${API_URL}/reports/revenue/pdf?dari=${dari}&sampai=${sampai}`, {
      headers: {
        Accept: "application/pdf",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      throw new Error(`Download gagal (${res.status})`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-pendapatan-${dari}-sampai-${sampai}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  async downloadOrdersPdf(filters?: { dari?: string; sampai?: string; status?: string }): Promise<void> {
    if (USE_MOCK) {
      const content = `Laporan Order\nFilter: ${JSON.stringify(filters)}\n\nIni adalah mock PDF. Dalam versi produksi, ini akan mengunduh file PDF.`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-order-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
    const params = new URLSearchParams();
    if (filters?.dari) params.set("dari", filters.dari);
    if (filters?.sampai) params.set("sampai", filters.sampai);
    if (filters?.status) params.set("status", filters.status);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const token = getToken();
    const res = await fetch(`${API_URL}/reports/orders/pdf${qs}`, {
      headers: {
        Accept: "application/pdf",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      throw new Error(`Download gagal (${res.status})`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-order-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // ----------------- TRANSACTIONS -----------------

  async getTransactions(): Promise<Transaction[]> {
    if (USE_MOCK) return mockGetTransactions();
    return http<Transaction[]>("/transactions");
  },

  // ----------------- WHATSAPP -----------------

  async sendWhatsApp(orderId: number): Promise<{ success: boolean }> {
    if (USE_MOCK) return mockSendWhatsApp(orderId);
    return http<{ success: boolean }>(`/orders/${orderId}/notify`, {
      method: "POST",
    });
  },

  // ----------------- SUBSCRIPTION -----------------

  async getSubscription(): Promise<SubscriptionResponse> {
    if (USE_MOCK) return mockGetSubscription();
    return http<SubscriptionResponse>("/subscription");
  },

  async activateTrial(): Promise<{ message: string; subscription: { status: string; trial_ends_at: string; plan: string } }> {
    if (USE_MOCK) return mockActivateTrial();
    return http("/subscription/activate-trial", { method: "POST" });
  },

  async checkoutSubscription(input: { plan_id: number; billing: "monthly" | "yearly"; method: string }): Promise<CheckoutResponse> {
    if (USE_MOCK) return mockCheckout(input);
    return http<CheckoutResponse>("/subscription/checkout", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async getPaymentDetail(id: number): Promise<PaymentInfo> {
    if (USE_MOCK) return mockGetPaymentDetail(id);
    return http<PaymentInfo>(`/subscription/payment/${id}`);
  },

  async cancelSubscription(): Promise<{ message: string }> {
    if (USE_MOCK) return mockCancelSubscription();
    return http("/subscription/cancel", { method: "POST" });
  },

  async getUsage(): Promise<UsageInfo> {
    if (USE_MOCK) return mockGetUsage();
    return http<UsageInfo>("/subscription/usage");
  },

  // ----------------- PROFILE -----------------

  async getProfile(): Promise<UserFull> {
    if (USE_MOCK) return { id: 1, nama: "Budi Santoso", email: "pemilik@laundryflow.id", role: "pemilik", outlet_id: null, email_verified_at: null, created_at: new Date().toISOString() };
    return http<UserFull>("/profile");
  },

  async updateProfile(input: { nama?: string; email?: string }): Promise<UserFull> {
    if (USE_MOCK) return mockUpdateProfile(input);
    return http<UserFull>("/profile", { method: "PATCH", body: JSON.stringify(input) });
  },

  async changePassword(input: { current_password: string; password: string; password_confirmation: string }): Promise<{ message: string }> {
    if (USE_MOCK) return mockChangePassword(input);
    return http("/profile/password", { method: "POST", body: JSON.stringify(input) });
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    if (USE_MOCK) return mockForgotPassword(email);
    return http("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
  },

  // ----------------- USERS -----------------

  async getUsers(): Promise<UserFull[]> {
    if (USE_MOCK) return mockGetUsers();
    return http<UserFull[]>("/users");
  },

  async createUser(input: { nama: string; email: string; password: string; role: string }): Promise<UserFull> {
    if (USE_MOCK) return mockCreateUser(input);
    return http<UserFull>("/users", { method: "POST", body: JSON.stringify(input) });
  },

  async updateUser(id: number, input: { nama?: string; email?: string; role?: string; outlet_id?: number | null }): Promise<UserFull> {
    if (USE_MOCK) return mockUpdateUser(id, input);
    return http<UserFull>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(input) });
  },

  async deleteUser(id: number): Promise<{ success: boolean }> {
    if (USE_MOCK) return mockDeleteUser(id);
    return http(`/users/${id}`, { method: "DELETE" });
  },

  // ----------------- OUTLETS -----------------

  async getOutlets(): Promise<Outlet[]> {
    if (USE_MOCK) return mockGetOutlets();
    return http<Outlet[]>("/outlets");
  },

  async createOutlet(input: { name: string; address?: string; phone?: string }): Promise<Outlet> {
    if (USE_MOCK) return mockCreateOutlet(input);
    return http<Outlet>("/outlets", { method: "POST", body: JSON.stringify(input) });
  },

  async updateOutlet(id: number, input: { name?: string; address?: string; phone?: string; is_active?: boolean }): Promise<Outlet> {
    if (USE_MOCK) return mockUpdateOutlet(id, input);
    return http<Outlet>(`/outlets/${id}`, { method: "PATCH", body: JSON.stringify(input) });
  },

  async deleteOutlet(id: number): Promise<{ success: boolean }> {
    if (USE_MOCK) return mockDeleteOutlet(id);
    return http(`/outlets/${id}`, { method: "DELETE" });
  },

  // ----------------- EXPENSES -----------------

  async getExpenses(filters?: { dari?: string; sampai?: string; kategori?: string }): Promise<Expense[]> {
    if (USE_MOCK) return mockGetExpenses(filters);
    const params = new URLSearchParams();
    if (filters?.dari) params.set("dari", filters.dari);
    if (filters?.sampai) params.set("sampai", filters.sampai);
    if (filters?.kategori) params.set("kategori", filters.kategori);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return http<Expense[]>(`/expenses${qs}`);
  },

  async createExpense(input: { kategori: string; deskripsi: string; nominal: number; tanggal: string }): Promise<Expense> {
    if (USE_MOCK) return mockCreateExpense(input);
    return http<Expense>("/expenses", { method: "POST", body: JSON.stringify(input) });
  },

  async updateExpense(id: number, input: Partial<{ kategori: string; deskripsi: string; nominal: number; tanggal: string }>): Promise<Expense> {
    if (USE_MOCK) return mockUpdateExpense(id, input);
    return http<Expense>(`/expenses/${id}`, { method: "PATCH", body: JSON.stringify(input) });
  },

  async deleteExpense(id: number): Promise<{ success: boolean }> {
    if (USE_MOCK) return mockDeleteExpense(id);
    return http(`/expenses/${id}`, { method: "DELETE" });
  },

  // ----------------- NOTIFICATIONS -----------------

  async getNotifications(): Promise<{ notifications: AppNotification[]; unread_count: number }> {
    if (USE_MOCK) return mockGetNotifications();
    return http("/notifications");
  },

  async markNotificationRead(id: number): Promise<{ success: boolean }> {
    if (USE_MOCK) return mockMarkRead(id);
    return http(`/notifications/${id}/read`, { method: "POST" });
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    if (USE_MOCK) return mockMarkAllRead();
    return http("/notifications/read-all", { method: "POST" });
  },

  async deleteNotification(id: number): Promise<{ success: boolean }> {
    if (USE_MOCK) return mockDeleteNotification(id);
    return http(`/notifications/${id}`, { method: "DELETE" });
  },

  // ----------------- ACTIVITY LOGS -----------------

  async getActivityLogs(filters?: { type?: string; user_id?: number }): Promise<ActivityLog[]> {
    if (USE_MOCK) return mockGetActivityLogs(filters);
    const params = new URLSearchParams();
    if (filters?.type) params.set("type", filters.type);
    if (filters?.user_id) params.set("user_id", String(filters.user_id));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return http<ActivityLog[]>(`/activity-logs${qs}`);
  },

  // ----------------- CUSTOMER ORDERS -----------------

  async getCustomerOrders(customerId: number): Promise<Order[]> {
    if (USE_MOCK) return mockGetCustomerOrders(customerId);
    return http<Order[]>(`/customers/${customerId}/orders`);
  },

  // ----------------- ORDER TRACKING (PUBLIC) -----------------

  async getOrderTracking(orderId: number): Promise<any> {
    if (USE_MOCK) return mockGetOrderTracking(orderId);
    return http(`/tracking/${orderId}`);
  },

  // ----------------- RECEIPT -----------------

  async downloadReceipt(orderId: number): Promise<void> {
    if (USE_MOCK) {
      const content = `Struk Order #${orderId}\n\nIni adalah mock receipt. Dalam versi produksi, ini akan mengunduh file PDF.`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `struk-order-${orderId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
    const token = getToken();
    const res = await fetch(`${API_URL}/orders/${orderId}/receipt/download`, {
      headers: { Accept: "application/pdf", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!res.ok) throw new Error(`Download gagal (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `struk-order-${orderId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // ----------------- SETTINGS -----------------

  async getSettings(): Promise<Record<string, Record<string, string | null>>> {
    if (USE_MOCK) {
      return {
        business: { business_name: "LaundryFlow", business_address: "", business_phone: "", business_email: "", business_logo: null },
        finance: { currency: "IDR", tax_rate: "0", tax_enabled: "false" },
        notification: { whatsapp_enabled: "true", auto_whatsapp: "true" },
        receipt: { receipt_footer: "Terima kasih atas kunjungan Anda" },
        system: { timezone: "Asia/Jakarta", date_format: "d/m/Y", language: "id" },
      };
    }
    return http("/settings");
  },

  async updateSettings(data: Record<string, string>): Promise<{ message: string }> {
    if (USE_MOCK) return { message: "Pengaturan berhasil disimpan." };
    return http("/settings", { method: "PATCH", body: JSON.stringify(data) });
  },

  // ----------------- PLANS -----------------

  async getPlans(): Promise<Plan[]> {
    if (USE_MOCK) {
      return [
        { id: 1, name: "free", label: "Free", price_monthly: 0, price_yearly: 0, max_users: 1, max_orders_per_month: 100, max_outlets: 1, features: { pdf: false, wa: false, backup: false, kanban: true }, trial_days: 0 },
        { id: 2, name: "pro", label: "Pro", price_monthly: 99000, price_yearly: 990000, max_users: 3, max_orders_per_month: 0, max_outlets: 3, features: { pdf: true, wa: true, backup: true, kanban: true }, trial_days: 7 },
        { id: 3, name: "enterprise", label: "Enterprise", price_monthly: 299000, price_yearly: 2990000, max_users: 0, max_orders_per_month: 0, max_outlets: 0, features: { pdf: true, wa: true, backup: true, kanban: true, multi_outlet: true }, trial_days: 14 },
      ];
    }
    return http<Plan[]>("/plans");
  },

  async createPlan(input: any): Promise<Plan> {
    if (USE_MOCK) return { id: Date.now(), ...input };
    return http<Plan>("/plans", { method: "POST", body: JSON.stringify(input) });
  },

  async updatePlan(id: number, input: any): Promise<Plan> {
    if (USE_MOCK) return { id, ...input };
    return http<Plan>(`/plans/${id}`, { method: "PATCH", body: JSON.stringify(input) });
  },

  async deletePlan(id: number): Promise<{ message: string }> {
    if (USE_MOCK) return { message: "Plan berhasil dihapus." };
    return http(`/plans/${id}`, { method: "DELETE" });
  },

  // ----------------- PROFIT/LOSS -----------------

  async getProfitLoss(dari: string, sampai: string): Promise<any> {
    if (USE_MOCK) {
      // Mock data
      return {
        summary: { total_revenue: 5000000, total_expenses: 1500000, profit: 3500000, margin: 70 },
        daily: [
          { tanggal: dari, label: "1 Jun", revenue: 500000, expenses: 150000, profit: 350000 },
        ],
        expenses_by_category: { Sabun: 800000, Listrik: 500000, Lainnya: 200000 },
      };
    }
    return http(`/reports/profit-loss?dari=${dari}&sampai=${sampai}`);
  },

  getProfitLossPdfUrl(dari: string, sampai: string): string {
    if (USE_MOCK) return "#";
    const token = getToken();
    return `${API_URL}/reports/profit-loss/pdf?dari=${dari}&sampai=${sampai}${token ? `&token=${token}` : ""}`;
  },

  getExpensesCsvUrl(dari: string, sampai: string): string {
    if (USE_MOCK) return "#";
    const token = getToken();
    return `${API_URL}/reports/expenses/csv?dari=${dari}&sampai=${sampai}${token ? `&token=${token}` : ""}`;
  },

  // ----------------- BACKUPS -----------------

  async getBackups(): Promise<any[]> {
    if (USE_MOCK) return [];
    return http("/backups");
  },

  async createBackup(): Promise<any> {
    if (USE_MOCK) return { backup: { name: "backup-mock.sql", size: 1024, date: new Date().toISOString() } };
    return http("/backups", { method: "POST" });
  },

  async downloadBackup(filename: string): Promise<Blob> {
    if (USE_MOCK) return new Blob(["mock backup"], { type: "text/plain" });
    const token = getToken();
    const res = await fetch(`${API_URL}/backups/${filename}/download`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!res.ok) throw new Error(`Download gagal (${res.status})`);
    return res.blob();
  },

  async deleteBackup(filename: string): Promise<{ message: string }> {
    if (USE_MOCK) return { message: "Backup berhasil dihapus." };
    return http(`/backups/${filename}`, { method: "DELETE" });
  },

  // ----------------- SUPER ADMIN -----------------

  async getSuperAdminStats(): Promise<any> {
    if (USE_MOCK) {
      return {
        total_tenants: 12,
        active_tenants: 10,
        trial_tenants: 2,
        suspended_tenants: 0,
        total_revenue: 12500000,
        monthly_revenue: 2500000,
      };
    }
    return http("/superadmin/stats");
  },

  async getTenants(params?: { search?: string; status?: string; page?: number }): Promise<any> {
    if (USE_MOCK) {
      return {
        data: [
          { id: 1, name: "Laundry Bersih", email: "budi@laundrybersih.com", role: "pemilik", subscription: { status: "active", plan: { label: "Pro" } }, orders_count: 1250 },
          { id: 2, name: "Cuci Bersih", email: "andi@cucibersih.com", role: "pemilik", subscription: { status: "active", plan: { label: "Enterprise" } }, orders_count: 3200 },
        ],
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 2,
      };
    }
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.page) searchParams.set("page", String(params.page));
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return http(`/superadmin/tenants${qs}`);
  },

  async getTenant(id: number): Promise<any> {
    if (USE_MOCK) {
      return { id, name: "Laundry Bersih", email: "budi@laundrybersih.com", role: "pemilik" };
    }
    return http(`/superadmin/tenants/${id}`);
  },

  async updateTenantStatus(id: number, status: string): Promise<any> {
    if (USE_MOCK) return { message: "Status updated" };
    return http(`/superadmin/tenants/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async getSuperAdminPlans(): Promise<any[]> {
    if (USE_MOCK) {
      return [
        { id: 1, name: "free", label: "Free", price_monthly: 0, price_yearly: 0, max_users: 1, max_orders_per_month: 100, max_outlets: 1, features: { pdf: false, wa: false, backup: false, kanban: true }, trial_days: 0, subscribers_count: 4 },
        { id: 2, name: "pro", label: "Pro", price_monthly: 99000, price_yearly: 990000, max_users: 3, max_orders_per_month: 0, max_outlets: 3, features: { pdf: true, wa: true, backup: true, kanban: true }, trial_days: 7, subscribers_count: 6 },
        { id: 3, name: "enterprise", label: "Enterprise", price_monthly: 299000, price_yearly: 2990000, max_users: 0, max_orders_per_month: 0, max_outlets: 0, features: { pdf: true, wa: true, backup: true, kanban: true, multi_outlet: true }, trial_days: 14, subscribers_count: 2 },
      ];
    }
    return http("/superadmin/plans");
  },

  async createSuperAdminPlan(input: any): Promise<any> {
    if (USE_MOCK) return { id: Date.now(), ...input };
    return http("/superadmin/plans", { method: "POST", body: JSON.stringify(input) });
  },

  async updateSuperAdminPlan(id: number, input: any): Promise<any> {
    if (USE_MOCK) return { id, ...input };
    return http(`/superadmin/plans/${id}`, { method: "PATCH", body: JSON.stringify(input) });
  },

  async deleteSuperAdminPlan(id: number): Promise<any> {
    if (USE_MOCK) return { message: "Plan deleted" };
    return http(`/superadmin/plans/${id}`, { method: "DELETE" });
  },

  async getSuperAdminSubscriptions(params?: { status?: string; page?: number }): Promise<any> {
    if (USE_MOCK) {
      return {
        data: [
          { id: 1, user: { name: "Budi Santoso" }, plan: { label: "Pro" }, status: "active", amount: 99000 },
        ],
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 1,
      };
    }
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.page) searchParams.set("page", String(params.page));
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return http(`/superadmin/subscriptions${qs}`);
  },

  async getSuperAdminRevenue(): Promise<any> {
    if (USE_MOCK) {
      return { total: 12500000, monthly: 2500000, yearly: 30000000 };
    }
    return http("/superadmin/revenue");
  },

  async getSuperAdminRevenueTrend(months?: number): Promise<any[]> {
    if (USE_MOCK) {
      return [
        { month: "2024-01", revenue: 1800000 },
        { month: "2024-02", revenue: 2100000 },
        { month: "2024-03", revenue: 2500000 },
      ];
    }
    const qs = months ? `?months=${months}` : "";
    return http(`/superadmin/revenue/trend${qs}`);
  },

  async getSuperAdminRevenueByPlan(): Promise<any[]> {
    if (USE_MOCK) {
      return [
        { id: 1, label: "Free", subscribers_count: 4, revenue: 0 },
        { id: 2, label: "Pro", subscribers_count: 6, revenue: 1980000 },
        { id: 3, label: "Enterprise", subscribers_count: 2, revenue: 598000 },
      ];
    }
    return http("/superadmin/revenue/by-plan");
  },
};
