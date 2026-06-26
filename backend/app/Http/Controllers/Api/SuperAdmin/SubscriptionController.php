<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    /**
     * Display all subscription plans.
     */
    public function plans(): JsonResponse
    {
        $plans = Plan::withCount('subscriptions')->get();
        return response()->json($plans);
    }

    /**
     * Create a new plan.
     */
    public function storePlan(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'label' => 'required|string|max:255',
            'price_monthly' => 'required|numeric|min:0',
            'price_yearly' => 'required|numeric|min:0',
            'max_users' => 'required|integer|min:-1',
            'max_orders_per_month' => 'required|integer|min:-1',
            'max_outlets' => 'required|integer|min:-1',
            'features' => 'required|array',
            'trial_days' => 'required|integer|min:0',
        ]);

        $plan = Plan::create($validated);

        return response()->json($plan, 201);
    }

    /**
     * Update a plan.
     */
    public function updatePlan(Request $request, Plan $plan): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'label' => 'sometimes|string|max:255',
            'price_monthly' => 'sometimes|numeric|min:0',
            'price_yearly' => 'sometimes|numeric|min:0',
            'max_users' => 'sometimes|integer|min:-1',
            'max_orders_per_month' => 'sometimes|integer|min:-1',
            'max_outlets' => 'sometimes|integer|min:-1',
            'features' => 'sometimes|array',
            'trial_days' => 'sometimes|integer|min:0',
        ]);

        $plan->update($validated);

        return response()->json($plan->fresh());
    }

    /**
     * Delete a plan.
     */
    public function destroyPlan(Plan $plan): JsonResponse
    {
        // Check if plan has active subscribers
        $activeSubscribers = Subscription::where('plan_id', $plan->id)
            ->whereIn('status', ['active', 'trial'])
            ->count();

        if ($activeSubscribers > 0) {
            return response()->json([
                'message' => 'Cannot delete plan with active subscribers',
            ], 400);
        }

        $plan->delete();

        return response()->json(['message' => 'Plan deleted']);
    }

    /**
     * Display all subscriptions.
     */
    public function subscriptions(Request $request): JsonResponse
    {
        $query = Subscription::with('user', 'plan');

        // Filter by status
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $subscriptions = $query->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json($subscriptions);
    }

    /**
     * Get subscription statistics.
     */
    public function stats(): JsonResponse
    {
        $totalSubscriptions = Subscription::count();
        $activeSubscriptions = Subscription::where('status', 'active')->count();
        $trialSubscriptions = Subscription::where('status', 'trial')->count();
        $cancelledSubscriptions = Subscription::where('status', 'cancelled')->count();

        $totalRevenue = Subscription::where('status', 'active')
            ->sum('amount');

        $monthlyRevenue = Subscription::where('status', 'active')
            ->where('current_period_end', '>=', now())
            ->sum('amount');

        $byPlan = Plan::withCount(['subscriptions' => function ($q) {
            $q->where('status', 'active');
        }])->get();

        return response()->json([
            'total_subscriptions' => $totalSubscriptions,
            'active_subscriptions' => $activeSubscriptions,
            'trial_subscriptions' => $trialSubscriptions,
            'cancelled_subscriptions' => $cancelledSubscriptions,
            'total_revenue' => $totalRevenue,
            'monthly_revenue' => $monthlyRevenue,
            'by_plan' => $byPlan,
        ]);
    }
}
