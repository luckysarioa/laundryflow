<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ExpenseController extends Controller
{
    /**
     * GET /expenses — daftar pengeluaran.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Expense::with('user')->latest('tanggal');

        if ($dari = $request->query('dari')) {
            $query->where('tanggal', '>=', $dari);
        }
        if ($sampai = $request->query('sampai')) {
            $query->where('tanggal', '<=', $sampai);
        }
        if ($kategori = $request->query('kategori')) {
            $query->where('kategori', $kategori);
        }

        return \App\Http\Resources\ExpenseResource::collection($query->get());
    }

    /**
     * POST /expenses — tambah pengeluaran.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'kategori' => ['required', 'string', 'max:50'],
            'deskripsi' => ['required', 'string', 'max:255'],
            'nominal' => ['required', 'integer', 'min:1'],
            'tanggal' => ['required', 'date'],
        ]);

        $expense = Expense::create([
            'user_id' => $request->user()->id,
            'kategori' => $data['kategori'],
            'deskripsi' => $data['deskripsi'],
            'nominal' => $data['nominal'],
            'tanggal' => $data['tanggal'],
        ]);

        ActivityLog::log('expense.create', $expense, $data);

        return new \App\Http\Resources\ExpenseResource($expense);
    }

    /**
     * DELETE /expenses/{expense} — hapus pengeluaran.
     */
    public function destroy(Expense $expense)
    {
        ActivityLog::log('expense.delete', $expense, ['deskripsi' => $expense->deskripsi, 'nominal' => $expense->nominal]);
        $expense->delete();

        return response()->json(['success' => true]);
    }
}
