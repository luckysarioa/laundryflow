<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuperAdminActivityLogController extends Controller
{
    /**
     * List all activity logs across all tenants.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ActivityLog::with('user:id,nama,email,role');

        // Filter by type.
        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        // Filter by user_id.
        if ($userId = $request->input('user_id')) {
            $query->where('user_id', $userId);
        }

        // Search by user name or email.
        if ($search = $request->input('search')) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $logs = $query->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 50));

        return response()->json($logs);
    }
}
