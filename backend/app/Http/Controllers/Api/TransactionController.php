<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TransactionController extends Controller
{
    /**
     * GET /transactions — daftar transaksi (terbaru lebih dulu).
     * Mengembalikan BARE ARRAY (bukan pagination) sesuai kontrak frontend.
     */
    public function index(): AnonymousResourceCollection
    {
        $transactions = Transaction::latest('created_at')->get();

        return TransactionResource::collection($transactions);
    }
}
