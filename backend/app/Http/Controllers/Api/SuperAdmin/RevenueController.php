<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RevenueController extends Controller
{
    /**
     * Get revenue summary.
     */
    public function index(Request $request): JsonResponse
    {
        $totalRevenue = Subscription::where('status', 'active')
            ->sum('amount');

        $monthlyRevenue = Subscription::where('status', 'active')
            ->where('current_period_end', '>=', now())
            ->sum('amount');

        $yearlyRevenue = Subscription::where('status', 'active')
            ->where('current_period_end', '>=', now()->subYear())
            ->sum('amount');

        return response()->json([
            'total' => $totalRevenue,
            'monthly' => $monthlyRevenue,
            'yearly' => $yearlyRevenue,
        ]);
    }

    /**
     * Get monthly revenue trend.
     */
    public function trend(Request $request): JsonResponse
    {
        $months = $request->input('months', 12);

        $trend = Subscription::where('status', 'active')
            ->select(
                DB::raw("DATE_FORMAT(current_period_end, '%Y-%m') as month"),
                DB::raw('SUM(amount) as revenue')
            )
            ->where('current_period_end', '>=', now()->subMonths($months))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json($trend);
    }

    /**
     * Get revenue by plan.
     */
    public function byPlan(): JsonResponse
    {
        $byPlan = Plan::select('plans.*')
            ->selectSub(function ($query) {
                $query->from('subscriptions')
                    ->where('status', 'active')
                    ->whereColumn('subscriptions.plan_id', 'plans.id')
                    ->selectRaw('COUNT(*)');
            }, 'subscribers_count')
            ->selectSub(function ($query) {
                $query->from('subscriptions')
                    ->where('status', 'active')
                    ->whereColumn('subscriptions.plan_id', 'plans.id')
                    ->selectRaw('COALESCE(SUM(amount), 0)');
            }, 'revenue')
            ->get();

        return response()->json($byPlan);
    }

    /**
     * Get detailed revenue report.
     */
    public function report(Request $request): JsonResponse
    {
        $dari = $request->input('dari', now()->startOfMonth()->format('Y-m-d'));
        $sampai = $request->input('sampai', now()->format('Y-m-d'));

        $daily = Subscription::where('status', 'active')
            ->whereBetween('current_period_end', [$dari, $sampai])
            ->select(
                DB::raw('DATE(current_period_end) as date'),
                DB::raw('SUM(amount) as revenue'),
                DB::raw('COUNT(*) as subscriptions')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $summary = [
            'total_revenue' => $daily->sum('revenue'),
            'total_subscriptions' => $daily->sum('subscriptions'),
            'avg_daily_revenue' => $daily->avg('revenue'),
        ];

        return response()->json([
            'summary' => $summary,
            'daily' => $daily,
        ]);
    }
}
