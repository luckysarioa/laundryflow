"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Customer, Service } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { OrderForm } from "@/components/OrderForm";
import { FullPageSpinner } from "@/components/ui/Spinner";

// ==========================================================
// Halaman: Buat Order Baru.
// Memuat daftar services & customers, lalu merender OrderForm.
// ==========================================================

export default function NewOrderPage() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [customers, setCustomers] = useState<Customer[] | null>(null);

  useEffect(() => {
    (async () => {
      const [s, c] = await Promise.all([api.getServices(), api.getCustomers()]);
      setServices(s);
      setCustomers(c);
    })();
  }, []);

  return (
    <>
      <AppHeader title="Buat Order Baru" subtitle="Cuci masuk → status Antrian" back />
      {services && customers ? (
        <OrderForm services={services} customers={customers} />
      ) : (
        <FullPageSpinner />
      )}
    </>
  );
}
