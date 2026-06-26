<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * GET /activity-logs — daftar aktivitas (audit log).
     */
    public function index(Request $request)
    {
        $query = ActivityLog::with('user')->latest();

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }

        $logs = $query->limit(100)->get();

        return response()->json($logs);
    }
}
