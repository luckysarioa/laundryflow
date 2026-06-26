<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Midtrans\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function __construct(
        protected MidtransService $midtrans
    ) {}

    /**
     * POST /webhooks/midtrans — handle notifikasi dari Midtrans.
     * Tidak butuh auth (Midtrans mengirim notification langsung).
     */
    public function midtrans(Request $request): JsonResponse
    {
        $payload = $request->all();

        Log::info('Midtrans notification received', [
            'order_id' => $payload['order_id'] ?? null,
            'status' => $payload['transaction_status'] ?? null,
        ]);

        // Verifikasi signature
        if (!$this->midtrans->verifyNotification($payload)) {
            Log::warning('Midtrans signature verification failed', $payload);
            return response()->json(['message' => 'Invalid signature'], 401);
        }

        try {
            $payment = $this->midtrans->handleCallback($payload);

            Log::info('Midtrans payment processed', [
                'payment_id' => $payment->id,
                'status' => $payment->status,
                'subscription_status' => $payment->subscription->status,
            ]);

            return response()->json(['status' => 'ok']);
        } catch (\Exception $e) {
            Log::error('Midtrans callback error', [
                'message' => $e->getMessage(),
                'payload' => $payload,
            ]);

            return response()->json(['message' => 'Error processing notification'], 500);
        }
    }
}
