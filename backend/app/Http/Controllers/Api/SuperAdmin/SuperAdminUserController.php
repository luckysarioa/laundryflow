<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class SuperAdminUserController extends Controller
{
    /**
     * List all superadmin users.
     */
    public function index(): JsonResponse
    {
        $users = User::where('role', 'superadmin')
            ->select('id', 'nama', 'email', 'role', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($users);
    }

    /**
     * Create a new superadmin user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'nama' => $validated['nama'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'superadmin',
        ]);

        return response()->json([
            'message' => 'Superadmin created successfully.',
            'user' => $user->only('id', 'nama', 'email', 'role', 'created_at'),
        ], 201);
    }

    /**
     * Update a superadmin user.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        if ($user->role !== 'superadmin') {
            return response()->json(['message' => 'User not found'], 404);
        }

        $validated = $request->validate([
            'nama' => 'sometimes|string|max:255',
            'email' => "sometimes|email|unique:users,email,{$user->id}",
            'password' => 'sometimes|string|min:6|confirmed',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'message' => 'Superadmin updated successfully.',
            'user' => $user->only('id', 'nama', 'email', 'role', 'created_at'),
        ]);
    }

    /**
     * Delete a superadmin user.
     */
    public function destroy(User $user): JsonResponse
    {
        if ($user->role !== 'superadmin') {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Prevent deleting yourself.
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Cannot delete your own account.'], 400);
        }

        // Prevent deleting the last superadmin.
        $count = User::where('role', 'superadmin')->count();
        if ($count <= 1) {
            return response()->json(['message' => 'Cannot delete the last superadmin account.'], 400);
        }

        $user->delete();

        return response()->json(['message' => 'Superadmin deleted successfully.']);
    }
}
