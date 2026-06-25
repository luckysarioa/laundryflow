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
} from "./types";
import {
  mockAdvanceOrder,
  mockCreateCustomer,
  mockCreateOrder,
  mockGetCustomers,
  mockGetDashboardStats,
  mockGetOrder,
  mockGetOrders,
  mockGetRevenue,
  mockGetServices,
  mockGetTransactions,
  mockLogin,
  mockSendWhatsApp,
  mockSetOrderStatus,
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

  async updateOrder(id: number, input: { serviceId?: number; total_berat?: number; catatan?: string | null }): Promise<Order> {
    if (USE_MOCK) {
      // Mock update - in real app this would call backend
      const order = await mockGetOrder(id);
      return { ...order, ...input, catatan: input.catatan ?? order.catatan };
    }
    return http<Order>(`/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
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
};
