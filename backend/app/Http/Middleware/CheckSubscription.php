<?php

namespace App\Http\Middleware;

use App\Models\Plan;
use App\Models\Subscription;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscription
{
    /**
     * Handle incoming request.
     *
     * Cek apakah user memiliki subscription aktif dan belum melebihi limit.
     * Menambahkan header X-Subscription-Status untuk frontend.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        // Skip untuk kasir (kasir mengikuti subscription pemilik)
        if ($user->isKasir()) {
            $owner = $user->outlet?->user;
            if ($owner) {
                $user = $owner;
            } else {
                return $next($request);
            }
        }

        $subscription = $user->subscription;

        // Jika tidak ada subscription, cek apakah user baru (trial belum diaktifkan)
        if (!$subscription) {
            // Allow access tapi tandai perlu setup
            $request->attributes->set('subscription_status', 'none');
            $response = $next($request);
            $response->headers->set('X-Subscription-Status', 'none');
            return $response;
        }

        // Cek expired
        if ($subscription->isExpired()) {
            $request->attributes->set('subscription_status', 'expired');
            $request->attributes->set('subscription_blocked', true);
            $response = $next($request);
            $response->headers->set('X-Subscription-Status', 'expired');
            return $response;
        }

        // Cek past due (grace period)
        if ($subscription->isPastDue()) {
            // Beri akses tapi dengan warning
            $request->attributes->set('subscription_status', 'past_due');
            $request->attributes->set('subscription_warning', true);
        }

        // Cek trial expiry
        if ($subscription->isTrial() && $subscription->trial_ends_at && $subscription->trial_ends_at->isPast()) {
            $subscription->markExpired();
            $request->attributes->set('subscription_status', 'expired');
            $request->attributes->set('subscription_blocked', true);
        }

        // Cek order limit
        if (!$subscription->canCreateOrder()) {
            $request->attributes->set('order_limit_reached', true);
        }

        $status = $subscription->status;
        $request->attributes->set('subscription_status', $status);

        $response = $next($request);
        $response->headers->set('X-Subscription-Status', $status);
        $response->headers->set('X-Subscription-Plan', $subscription->plan?->name ?? '');

        return $response;
    }
}
