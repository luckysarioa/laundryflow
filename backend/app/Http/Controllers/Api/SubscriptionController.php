<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Services\Midtrans\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function __construct(
        protected MidtransService $midtrans
    ) {}

    /**
     * GET /subscription — info subscription user saat ini.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $subscription = $user->subscription;

        return response()->json([
            'subscription' => $subscription ? [
                'id' => $subscription->id,
                'status' => $subscription->status,
                'plan' => $subscription->plan ? [
                    'id' => $subscription->plan->id,
                    'name' => $subscription->plan->name,
                    'label' => $subscription->plan->label,
                    'price_monthly' => $subscription->plan->price_monthly,
                    'price_yearly' => $subscription->plan->price_yearly,
                    'features' => $subscription->plan->features,
                ] : null,
                'trial_ends_at' => $subscription->trial_ends_at?->toIso8601String(),
                'current_period_end' => $subscription->current_period_end?->toIso8601String(),
                'days_until_expiry' => $subscription->daysUntilExpiry(),
                'orders_used' => $subscription->ordersUsedThisMonth(),
                'orders_limit' => $subscription->plan?->max_orders_per_month ?? 0,
            ] : null,
            'plans' => Plan::active()->orderBy('price_monthly')->get()->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'label' => $p->label,
                'price_monthly' => $p->price_monthly,
                'price_yearly' => $p->price_yearly,
                'max_users' => $p->max_users,
                'max_orders_per_month' => $p->max_orders_per_month,
                'max_outlets' => $p->max_outlets,
                'features' => $p->features,
                'trial_days' => $p->trial_days,
            ]),
        ]);
    }

    /**
     * POST /subscription/activate-trial — mulai trial 7 hari.
     */
    public function activateTrial(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->subscription) {
            return response()->json(['message' => 'Sudah memiliki subscription.'], 422);
        }

        $proPlan = Plan::where('name', 'pro')->firstOrFail();

        $subscription = Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $proPlan->id,
            'status' => 'trial',
            'trial_ends_at' => now()->addDays($proPlan->trial_days),
        ]);

        return response()->json([
            'message' => 'Trial 7 hari berhasil diaktifkan!',
            'subscription' => [
                'status' => $subscription->status,
                'trial_ends_at' => $subscription->trial_ends_at->toIso8601String(),
                'plan' => $proPlan->label,
            ],
        ]);
    }

    /**
     * POST /subscription/checkout — buat pembayaran baru.
     */
    public function checkout(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plan_id' => ['required', 'exists:plans,id'],
            'billing' => ['required', 'in:monthly,yearly'],
            'method' => ['required', 'in:qris,transfer,va,ewallet'],
        ]);

        $user = $request->user();
        $plan = Plan::findOrFail($data['plan_id']);

        // Hitung harga
        $amount = $data['billing'] === 'yearly' ? $plan->price_yearly : $plan->price_monthly;

        // Buat atau update subscription
        $subscription = $user->subscription;
        if (!$subscription) {
            $subscription = Subscription::create([
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'status' => 'trial',
                'trial_ends_at' => now()->addDays($plan->trial_days),
            ]);
        } else {
            $subscription->update(['plan_id' => $plan->id]);
        }

        // Buat payment record
        $payment = Payment::create([
            'subscription_id' => $subscription->id,
            'amount' => $amount,
            'method' => $data['method'],
            'status' => 'pending',
        ]);

        // Hit Midtrans
        $snapData = $this->midtrans->createPayment($subscription, $payment);

        $payment->update([
            'payment_url' => $snapData['redirect_url'],
        ]);

        return response()->json([
            'payment_id' => $payment->id,
            'snap_token' => $snapData['token'],
            'redirect_url' => $snapData['redirect_url'],
            'order_id' => $snapData['order_id'],
        ]);
    }

    /**
     * GET /subscription/payment/{id} — detail pembayaran.
     */
    public function paymentDetail(Payment $payment)
    {
        return response()->json([
            'id' => $payment->id,
            'amount' => $payment->amount,
            'method' => $payment->method,
            'status' => $payment->status,
            'gateway_ref' => $payment->gateway_ref,
            'payment_url' => $payment->payment_url,
            'paid_at' => $payment->paid_at?->toIso8601String(),
            'subscription' => [
                'status' => $payment->subscription->status,
                'plan' => $payment->subscription->plan->label,
            ],
        ]);
    }

    /**
     * POST /subscription/cancel — batalkan subscription.
     */
    public function cancel(Request $request): JsonResponse
    {
        $user = $request->user();
        $subscription = $user->subscription;

        if (!$subscription || !$subscription->isActive()) {
            return response()->json(['message' => 'Tidak ada subscription aktif.'], 422);
        }

        $subscription->cancel();

        return response()->json(['message' => 'Subscription dibatalkan.']);
    }

    /**
     * GET /subscription/usage — info pemakaian bulanan.
     */
    public function usage(Request $request): JsonResponse
    {
        $user = $request->user();
        $subscription = $user->subscription;

        $usedOrders = 0;
        $ordersLimit = 0;
        $canCreate = true;

        if ($subscription && $subscription->isActive()) {
            $usedOrders = $subscription->ordersUsedThisMonth();
            $ordersLimit = $subscription->plan?->max_orders_per_month ?? 0;
            $canCreate = $subscription->canCreateOrder();
        }

        return response()->json([
            'orders_used' => $usedOrders,
            'orders_limit' => $ordersLimit, // 0 = unlimited
            'can_create_order' => $canCreate,
        ]);
    }
}
