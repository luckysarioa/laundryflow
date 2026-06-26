<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
     * Update tenant status (suspend, activate, cancel).
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

        return response()->json([
            'message' => 'Tenant status updated',
            'tenant' => $tenant->fresh()->load('subscription.plan'),
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

        $totalRevenue = Subscription::where('status', 'active')
            ->sum('amount');

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
