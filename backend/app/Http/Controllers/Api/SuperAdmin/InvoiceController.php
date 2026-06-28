<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    /**
     * Daftar invoice dengan filter & pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Invoice::with('tenant:id,nama,email');

        // Search (nomor invoice atau nama tenant).
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('tenant', function ($q2) use ($search) {
                      $q2->where('nama', 'like', "%{$search}%");
                  });
            });
        }

        // Filter status.
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $invoices = $query->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15));

        return response()->json($invoices);
    }

    /**
     * Tandai invoice sebagai lunas.
     */
    public function markPaid(Request $request, Invoice $invoice): JsonResponse
    {
        if ($invoice->status === 'cancelled') {
            return response()->json(['message' => 'Invoice dibatalkan tidak bisa ditandai lunas'], 400);
        }

        $invoice->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        return response()->json([
            'message' => 'Invoice ditandai lunas',
            'invoice' => $invoice->fresh(),
        ]);
    }
}
