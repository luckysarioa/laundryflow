<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    /**
     * GET /plans — List all plans.
     */
    public function index()
    {
        $plans = Plan::orderBy('price_monthly')->get();
        return response()->json($plans);
    }

    /**
     * GET /plans/{plan} — Get plan detail.
     */
    public function show(Plan $plan)
    {
        return response()->json($plan);
    }

    /**
     * POST /plans — Create new plan (pemilik only).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50|unique:plans,name',
            'label' => 'required|string|max:100',
            'price_monthly' => 'required|integer|min:0',
            'price_yearly' => 'required|integer|min:0',
            'max_users' => 'required|integer|min:0',
            'max_orders_per_month' => 'required|integer|min:0',
            'max_outlets' => 'required|integer|min:0',
            'features' => 'required|array',
            'trial_days' => 'required|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $plan = Plan::create($validated);

        return response()->json($plan, 201);
    }

    /**
     * PATCH /plans/{plan} — Update plan.
     */
    public function update(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            'label' => 'sometimes|string|max:100',
            'price_monthly' => 'sometimes|integer|min:0',
            'price_yearly' => 'sometimes|integer|min:0',
            'max_users' => 'sometimes|integer|min:0',
            'max_orders_per_month' => 'sometimes|integer|min:0',
            'max_outlets' => 'sometimes|integer|min:0',
            'features' => 'sometimes|array',
            'trial_days' => 'sometimes|integer|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $plan->update($validated);

        return response()->json($plan);
    }

    /**
     * DELETE /plans/{plan} — Delete plan.
     */
    public function destroy(Plan $plan)
    {
        // Check if plan has active subscriptions
        if ($plan->subscriptions()->where('status', 'active')->exists()) {
            return response()->json([
                'message' => 'Plan masih memiliki subscriber aktif. Tidak bisa dihapus.',
            ], 422);
        }

        $plan->delete();

        return response()->json(['message' => 'Plan berhasil dihapus.']);
    }
}
