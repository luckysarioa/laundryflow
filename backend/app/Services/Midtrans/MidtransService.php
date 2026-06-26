<?php

namespace App\Services\Midtrans;

use App\Models\Payment;
use App\Models\Subscription;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class MidtransService
{
    protected string $serverKey;
    protected string $clientKey;
    protected string $apiUrl;
    protected bool $isProduction;

    public function __construct()
    {
        $this->serverKey = config('midtrans.server_key');
        $this->clientKey = config('midtrans.client_key');
        $this->apiUrl = config('midtrans.api_url');
        $this->isProduction = config('midtrans.is_production');
    }

    /**
     * Buat Snap Payment URL untuk subscription.
     */
    public function createPayment(Subscription $subscription, Payment $payment): array
    {
        $orderId = 'LF-' . $subscription->id . '-' . Str::random(8);
        $payment->update(['gateway_ref' => $orderId]);

        $payload = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $payment->amount,
            ],
            'customer_details' => [
                'first_name' => $subscription->user->nama,
                'email' => $subscription->user->email,
            ],
            'item_details' => [[
                'id' => 'plan-' . $subscription->plan->name,
                'price' => $payment->amount,
                'quantity' => 1,
                'name' => 'Langganan ' . $subscription->plan->label,
            ]],
            'callbacks' => [
                'finish' => config('app.url') . '/subscription/finish',
            ],
            'expiry' => [
                'start_time' => now()->format('Y-m-d H:i:s O'),
                'duration' => 24,
                'unit' => 'hours',
            ],
        ];

        $response = Http::withBasicAuth($this->serverKey, '')
            ->post($this->apiUrl . '/v2/snap/transaction', $payload);

        if ($response->successful()) {
            return [
                'token' => $response->json('token'),
                'redirect_url' => $response->json('redirect_url'),
                'order_id' => $orderId,
            ];
        }

        throw new \Exception('Gagal membuat pembayaran: ' . $response->body());
    }

    /**
     * Cek status transaksi ke Midtrans.
     */
    public function getTransactionStatus(string $orderId): array
    {
        $response = Http::withBasicAuth($this->serverKey, '')
            ->get($this->apiUrl . '/v2/' . $orderId . '/status');

        if ($response->successful()) {
            return $response->json();
        }

        throw new \Exception('Gagal cek status: ' . $response->body());
    }

    /**
     * Verifikasi notifikasi webhook dari Midtrans.
     */
    public function verifyNotification(array $payload): bool
    {
        $signature = hash('sha512', $payload['order_id'] . $payload['status_code'] . $payload['gross_amount'] . config('midtrans.notification_secret'));
        return $signature === $payload['signature_key'];
    }

    /**
     * Handle status callback dari Midtrans.
     */
    public function handleCallback(array $payload): Payment
    {
        $orderId = $payload['order_id'];
        $payment = Payment::where('gateway_ref', $orderId)->firstOrFail();

        if ($payload['transaction_status'] === 'capture' || $payload['transaction_status'] === 'settlement') {
            $payment->markSuccess($payload);
            // Aktifkan subscription
            $payment->subscription->activate(30);
        } elseif ($payload['transaction_status'] === 'deny' || $payload['transaction_status'] === 'cancel' || $payload['transaction_status'] === 'expire') {
            $payment->markFailed($payload);
        }

        return $payment;
    }

    /**
     * Get client key untuk frontend Snap.
     */
    public function getClientKey(): string
    {
        return $this->clientKey;
    }

    /**
     * Get Snap URL untuk frontend.
     */
    public function getSnapUrl(): string
    {
        return config('midtrans.snap_url');
    }
}
