<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\WhatsApp\WhatsAppMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;

class ReceiptController extends Controller
{
    /**
     * GET /orders/{order}/receipt — generate receipt PDF.
     */
    public function receipt(Order $order)
    {
        $order->load(['customer', 'service', 'transactions']);

        $trackingUrl = WhatsAppMessage::getTrackingUrl($order->id);
        $estimasi = $order->getEstimatedCompletion();

        $pdf = App::make('dompdf.wrapper');
        $pdf->loadView('receipts.order', [
            'order' => $order,
            'trackingUrl' => $trackingUrl,
            'estimasi' => $estimasi,
        ]);

        return $pdf->stream("struk-order-{$order->id}.pdf");
    }

    /**
     * GET /orders/{order}/receipt/download — download receipt PDF.
     */
    public function receiptDownload(Order $order)
    {
        $order->load(['customer', 'service', 'transactions']);

        $trackingUrl = WhatsAppMessage::getTrackingUrl($order->id);
        $estimasi = $order->getEstimatedCompletion();

        $pdf = App::make('dompdf.wrapper');
        $pdf->loadView('receipts.order', [
            'order' => $order,
            'trackingUrl' => $trackingUrl,
            'estimasi' => $estimasi,
        ]);

        return $pdf->download("struk-order-{$order->id}.pdf");
    }
}
