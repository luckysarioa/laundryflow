<?php

namespace Database\Seeders;

use App\Models\Invoice;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Seed data demo untuk halaman /superadmin/invoices (sebelumnya 100% mock).
 *
 * Self-contained: menjamin ada minimal 3 tenant (pemilik) + subscription aktif,
 * lalu generate invoice contoh per periode (campuran paid/pending/overdue).
 * Idempoten via firstOrCreate berdasarkan invoice_number.
 */
class InvoiceSeeder extends Seeder
{
    public function run(): void
    {
        $plan = Plan::where('name', 'pro')->first();
        if (!$plan) {
            return; // PlanSeeder belum jalan — skip aman.
        }

        // Pastikan ada minimal 3 tenant demo.
        $tenants = $this->ensureDemoTenants($plan);

        // Generate invoice untuk 3 periode terakhir tiap tenant.
        $periods = [
            Carbon::now()->subMonths(2)->format('Y-m'),
            Carbon::now()->subMonth()->format('Y-m'),
            Carbon::now()->format('Y-m'),
        ];

        foreach ($tenants as $tenant) {
            $subscription = $tenant->subscription;
            foreach ($periods as $i => $period) {
                $number = $this->invoiceNumber($period, $tenant->id);
                if (Invoice::where('invoice_number', $number)->exists()) {
                    continue;
                }

                $status = $this->pickStatus($i);
                Invoice::create([
                    'tenant_id' => $tenant->id,
                    'subscription_id' => $subscription?->id,
                    'invoice_number' => $number,
                    'amount' => $plan->price_monthly,
                    'plan_name' => $plan->label,
                    'billing_period' => $period,
                    'status' => $status,
                    'due_date' => Carbon::createFromFormat('Y-m', $period)->endOfMonth()->toDateString(),
                    'paid_at' => $status === 'paid' ? Carbon::now()->subDays(rand(1, 20)) : null,
                ]);
            }
        }
    }

    private function ensureDemoTenants(Plan $plan): array
    {
        $specs = [
            ['nama' => 'Budi Santoso', 'email' => 'pemilik@laundryflow.id'],
            ['nama' => 'Andi Wijaya', 'email' => 'andi@laundryflow.id'],
            ['nama' => 'Citra Lestari', 'email' => 'citra@laundryflow.id'],
        ];

        $tenants = [];
        foreach ($specs as $spec) {
            $tenant = User::updateOrCreate(
                ['email' => $spec['email']],
                [
                    'nama' => $spec['nama'],
                    'password' => 'laundry123', // rely on User::casts password=hashed
                    'role' => 'pemilik',
                ],
            );

            // Pastikan punya subscription aktif (dengan amount untuk fix revenue bug).
            if (!$tenant->subscription) {
                Subscription::create([
                    'user_id' => $tenant->id,
                    'plan_id' => $plan->id,
                    'amount' => $plan->price_monthly,
                    'status' => 'active',
                    'current_period_start' => now(),
                    'current_period_end' => now()->addDays(30),
                ]);
                $tenant->load('subscription');
            }

            $tenants[] = $tenant;
        }

        return $tenants;
    }

    private function invoiceNumber(string $period, int $tenantId): string
    {
        return 'INV-' . str_replace('-', '', $period) . '-' . str_pad((string) $tenantId, 3, '0', STR_PAD_LEFT);
    }

    private function pickStatus(int $periodIndex): string
    {
        // Periode terlama -> paid, tengah -> paid/overdue, terbaru -> pending.
        return match ($periodIndex) {
            0 => 'paid',
            1 => rand(0, 1) ? 'paid' : 'overdue',
            default => 'pending',
        };
    }
}
