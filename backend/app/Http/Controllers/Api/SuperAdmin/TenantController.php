<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class TenantController extends Controller
{
    /**
     * Display a listing of all tenants (pemilik users).
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::where('role', 'pemilik')
            ->with('subscription.plan')
            ->withCount('orders');

        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($status = $request->input('status')) {
            $query->whereHas('subscription', function ($q) use ($status) {
                $q->where('status', $status);
            });
        }

        $tenants = $query->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json($tenants);
    }

    /**
     * Display the specified tenant.
     */
    public function show(User $tenant): JsonResponse
    {
        if ($tenant->role !== 'pemilik') {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        $tenant->load('subscription.plan', 'outlet');
        $tenant->loadCount('orders', 'expenses');

        return response()->json($tenant);
    }

    /**
     * Buat tenant baru (User pemilik + Outlet + Subscription) dalam satu transaksi.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'phone' => 'nullable|string|max:20',
            'plan_id' => 'required|exists:plans,id',
            'status' => 'sometimes|in:trial,active',
        ]);

        $plan = Plan::findOrFail($validated['plan_id']);
        $status = $validated['status'] ?? 'trial';

        $tenant = DB::transaction(function () use ($validated, $plan, $status) {
            // User pemilik — password assign plain, rely on User::casts['password']='hashed'.
            $tenant = User::create([
                'nama' => $validated['nama'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => 'pemilik',
            ]);

            // Outlet default (telepon tenant disimpan di outlet — users tak punya kolom phone).
            $tenant->outlet()->create([
                'name' => $validated['nama'] . ' — Outlet Utama',
                'phone' => $validated['phone'] ?? null,
                'is_active' => true,
            ]);

            // Subscription awal.
            $trialDays = $plan->trial_days ?? 0;
            $tenant->subscription()->create([
                'plan_id' => $plan->id,
                'amount' => $plan->price_monthly,
                'status' => $status,
                'trial_ends_at' => $status === 'trial' ? now()->addDays($trialDays) : null,
                'current_period_start' => now(),
                'current_period_end' => now()->addDays(max($status === 'trial' ? $trialDays : 30, 1)),
            ]);

            $tenant->load('subscription.plan', 'outlet');
            return $tenant;
        });

        return response()->json([
            'message' => 'Tenant created',
            'tenant' => $tenant,
        ], 201);
    }

    /**
     * Update profil tenant (bukan password — ada endpoint terpisah).
     */
    public function update(Request $request, User $tenant): JsonResponse
    {
        if ($tenant->role !== 'pemilik') {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        $validated = $request->validate([
            'nama' => 'sometimes|string|max:255',
            'email' => "sometimes|email|unique:users,email,{$tenant->id}",
            'phone' => 'nullable|string|max:20',
            'plan_id' => 'sometimes|exists:plans,id',
        ]);

        DB::transaction(function () use ($validated, $tenant) {
            $tenant->update([
                'nama' => $validated['nama'] ?? $tenant->nama,
                'email' => $validated['email'] ?? $tenant->email,
            ]);

            if (array_key_exists('phone', $validated) && $tenant->outlet) {
                $tenant->outlet->update(['phone' => $validated['phone']]);
            }

            if (!empty($validated['plan_id']) && $tenant->subscription) {
                $plan = Plan::find($validated['plan_id']);
                $tenant->subscription->update([
                    'plan_id' => $plan->id,
                    'amount' => $plan->price_monthly,
                ]);
            }
        });

        return response()->json([
            'message' => 'Tenant updated',
            'tenant' => $tenant->fresh()->load('subscription.plan', 'outlet'),
        ]);
    }

    /**
     * Hapus tenant beserta data terkait (FK cascadeOnDelete).
     */
    public function destroy(User $tenant): JsonResponse
    {
        if ($tenant->role !== 'pemilik') {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        // Revoke token sebelum hapus (table personal_access_tokens ikut cascade,
        // tapi revoke eksplisit lebih aman dan jelas).
        $tenant->tokens()->delete();
        $tenant->delete();

        return response()->json(['message' => 'Tenant deleted']);
    }

    /**
     * Update tenant status (activate, suspend, cancel).
     */
    public function updateStatus(Request $request, User $tenant): JsonResponse
    {
        if ($tenant->role !== 'pemilik') {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        $validated = $request->validate([
            'status' => 'required|in:active,suspended,cancelled',
        ]);

        $subscription = $tenant->subscription;
        if (!$subscription) {
            return response()->json(['message' => 'Tenant has no subscription'], 400);
        }

        $subscription->update(['status' => $validated['status']]);
        // Saat suspend, cabut akses aktif semua sesi tenant.
        if ($validated['status'] === 'suspended') {
            $tenant->tokens()->delete();
        }

        return response()->json([
            'message' => 'Tenant status updated',
            'tenant' => $tenant->fresh()->load('subscription.plan'),
        ]);
    }

    /**
     * Reset password tenant (admin-initiated). Revoke semua sesi lama.
     */
    public function resetPassword(Request $request, User $tenant): JsonResponse
    {
        if ($tenant->role !== 'pemilik') {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        $validated = $request->validate([
            'password' => 'required|string|min:6|confirmed',
        ]);

        // Assign plain — rely on User::casts['password']='hashed'.
        $tenant->update(['password' => $validated['password']]);
        $tenant->tokens()->delete();

        return response()->json(['message' => 'Password tenant berhasil direset']);
    }

    /**
     * Impersonate: mint token Sanctum untuk tenant (8 jam), kembalikan ke superadmin.
     */
    public function impersonate(Request $request, User $tenant): JsonResponse
    {
        if ($tenant->role !== 'pemilik') {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        $token = $tenant->createToken('superadmin-impersonation', ['*'], now()->addHours(8))->plainTextToken;

        ActivityLog::log(
            type: 'tenant.impersonate',
            subject: $tenant,
            user: $request->user(),
            properties: ['tenant_id' => $tenant->id, 'tenant_email' => $tenant->email],
        );

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $tenant->id,
                'nama' => $tenant->nama,
                'email' => $tenant->email,
                'role' => $tenant->role,
            ],
        ]);
    }

    /**
     * Perpanjang periode langganan tenant sebanyak N hari.
     */
    public function extendSubscription(Request $request, User $tenant): JsonResponse
    {
        if ($tenant->role !== 'pemilik') {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        $validated = $request->validate([
            'days' => 'required|integer|min:1|max:365',
        ]);

        $subscription = $tenant->subscription;
        if (!$subscription) {
            return response()->json(['message' => 'Tenant has no subscription'], 400);
        }

        $subscription->extend($validated['days']);

        return response()->json([
            'message' => 'Langganan diperpanjang',
            'subscription' => $subscription->fresh()->load('plan'),
        ]);
    }

    /**
     * Generate tagihan untuk semua subscription aktif/trial bulan ini (manual, anti-duplikat).
     */
    public function generateInvoices(): JsonResponse
    {
        $period = Carbon::now()->format('Y-m');
        $generated = [];

        $subscriptions = Subscription::with('user', 'plan')
            ->whereIn('status', ['active', 'trial'])
            ->whereDoesntHave('invoices', function ($q) use ($period) {
                $q->where('billing_period', $period);
            })
            ->get();

        foreach ($subscriptions as $subscription) {
            $tenant = $subscription->user;
            if (!$tenant || $tenant->role !== 'pemilik') {
                continue;
            }

            $amount = $subscription->amount ?: ($subscription->plan?->price_monthly ?? 0);
            $generated[] = Invoice::create([
                'tenant_id' => $tenant->id,
                'subscription_id' => $subscription->id,
                'invoice_number' => 'INV-' . str_replace('-', '', $period) . '-' . str_pad((string) $tenant->id, 3, '0', STR_PAD_LEFT),
                'amount' => $amount,
                'plan_name' => $subscription->plan?->label ?? '-',
                'billing_period' => $period,
                'status' => $amount > 0 ? 'pending' : 'paid',
                'due_date' => now()->addDays(7)->toDateString(),
                'paid_at' => $amount > 0 ? null : now(),
            ]);
        }

        return response()->json([
            'message' => count($generated) . ' tagihan dibuat',
            'generated' => count($generated),
            'invoices' => $generated,
        ]);
    }

    /**
     * Get tenant statistics.
     */
    public function stats(): JsonResponse
    {
        $totalTenants = User::where('role', 'pemilik')->count();
        $activeTenants = User::where('role', 'pemilik')
            ->whereHas('subscription', function ($q) {
                $q->where('status', 'active');
            })
            ->count();

        $trialTenants = User::where('role', 'pemilik')
            ->whereHas('subscription', function ($q) {
                $q->where('status', 'trial');
            })
            ->count();

        $suspendedTenants = User::where('role', 'pemilik')
            ->whereHas('subscription', function ($q) {
                $q->where('status', 'suspended');
            })
            ->count();

        $totalRevenue = Subscription::where('status', 'active')->sum('amount');
        $monthlyRevenue = Subscription::where('status', 'active')
            ->where('current_period_end', '>=', now())
            ->sum('amount');

        return response()->json([
            'total_tenants' => $totalTenants,
            'active_tenants' => $activeTenants,
            'trial_tenants' => $trialTenants,
            'suspended_tenants' => $suspendedTenants,
            'total_revenue' => $totalRevenue,
            'monthly_revenue' => $monthlyRevenue,
        ]);
    }
}
