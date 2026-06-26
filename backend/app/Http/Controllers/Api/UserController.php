<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    /**
     * GET /users — daftar semua user (pemilik only).
     */
    public function index()
    {
        $users = User::with('outlet')->latest()->get();
        return UserResource::collection($users);
    }

    /**
     * POST /users — tambah user baru (kasir).
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nama' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', 'in:pemilik,kasir'],
            'outlet_id' => ['nullable', 'exists:outlets,id'],
        ]);

        $user = User::create([
            'nama' => $data['nama'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
            'outlet_id' => $data['outlet_id'] ?? null,
        ]);

        ActivityLog::log('user.create', $user, ['nama' => $user->nama, 'role' => $user->role]);

        return new UserResource($user);
    }

    /**
     * PATCH /users/{user} — edit user.
     */
    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'nama' => ['sometimes', 'string', 'max:120'],
            'email' => ['sometimes', 'email', 'unique:users,email,' . $user->id],
            'role' => ['sometimes', 'in:pemilik,kasir'],
            'outlet_id' => ['nullable', 'exists:outlets,id'],
        ]);

        $user->update($data);

        return new UserResource($user);
    }

    /**
     * DELETE /users/{user} — hapus user.
     */
    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Tidak bisa menghapus akun sendiri.'], 422);
        }

        $user->delete();

        return response()->json(['success' => true]);
    }

    /**
     * GET /profile — data profile user saat ini.
     */
    public function profile(Request $request)
    {
        return new UserResource($request->user());
    }

    /**
     * PATCH /profile — update profile (nama, email).
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'nama' => ['sometimes', 'string', 'max:120'],
            'email' => ['sometimes', 'email', 'unique:users,email,' . $user->id],
        ]);

        $user->update($data);

        return new UserResource($user);
    }

    /**
     * POST /profile/password — ganti password.
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $request->user()->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json(['message' => 'Password berhasil diubah.']);
    }

    /**
     * POST /auth/forgot-password — kirim email reset password.
     */
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);

        $user = User::where('email', $request->email)->first();

        if ($user) {
            // Generate token
            $token = \Illuminate\Support\Str::random(60);
            \DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                [
                    'token' => Hash::make($token),
                    'created_at' => now(),
                ]
            );

            // TODO: Send email with $token link
            // For now, return token in response (dev mode)
            return response()->json([
                'message' => 'Link reset password telah dikirim ke email.',
                'token' => $token, // Remove in production
            ]);
        }

        return response()->json(['message' => 'Link reset password telah dikirim ke email.']);
    }

    /**
     * POST /auth/reset-password — reset password dengan token.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $reset = \DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$reset || !Hash::check($request->token, $reset->token)) {
            return response()->json(['message' => 'Token tidak valid.'], 422);
        }

        $user = User::where('email', $request->email)->first();
        $user->update(['password' => Hash::make($request->password)]);

        \DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Password berhasil direset.']);
    }

    /**
     * POST /auth/verify-email — verifikasi email user.
     */
    public function verifyEmail(Request $request)
    {
        $user = $request->user();

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email sudah terverifikasi.']);
        }

        // Generate verification token
        $token = \Illuminate\Support\Str::random(60);

        // TODO: Send verification email
        return response()->json([
            'message' => 'Link verifikasi telah dikirim ke email.',
            'token' => $token, // Remove in production
        ]);
    }

    /**
     * POST /auth/verify-email-confirm — konfirmasi verifikasi email.
     */
    public function verifyEmailConfirm(Request $request)
    {
        $request->validate(['token' => ['required']]);

        // In production, validate token against database
        $request->user()->update(['email_verified_at' => now()]);

        return response()->json(['message' => 'Email berhasil diverifikasi.']);
    }
}
