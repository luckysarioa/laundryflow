<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    /**
     * GET /settings — Get all settings grouped.
     */
    public function index()
    {
        return response()->json(Setting::allGrouped());
    }

    /**
     * GET /settings/{group} — Get settings for a group.
     */
    public function show(string $group)
    {
        return response()->json(Setting::getGroup($group));
    }

    /**
     * PATCH /settings — Update multiple settings.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'business_name' => 'sometimes|string|max:255',
            'business_address' => 'sometimes|string|max:500',
            'business_phone' => 'sometimes|string|max:50',
            'business_email' => 'sometimes|email|max:255',
            'business_logo' => 'sometimes|nullable|string',
            'currency' => 'sometimes|string|max:10',
            'tax_rate' => 'sometimes|numeric|min:0|max:100',
            'tax_enabled' => 'sometimes|boolean',
            'receipt_footer' => 'sometimes|string|max:500',
            'whatsapp_enabled' => 'sometimes|boolean',
            'auto_whatsapp' => 'sometimes|boolean',
            'timezone' => 'sometimes|string|max:50',
            'date_format' => 'sometimes|string|max:20',
            'language' => 'sometimes|string|max:5',
        ]);

        Setting::updateMany($validated);

        return response()->json(['message' => 'Pengaturan berhasil disimpan.']);
    }

    /**
     * POST /settings/logo — Upload business logo.
     */
    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|max:2048',
        ]);

        $path = $request->file('logo')->store('logos', 'public');
        Setting::set('business_logo', $path);

        return response()->json([
            'message' => 'Logo berhasil diupload.',
            'path' => $path,
            'url' => Storage::disk('public')->url($path),
        ]);
    }

    /**
     * DELETE /settings/logo — Remove business logo.
     */
    public function deleteLogo()
    {
        $logo = Setting::get('business_logo');
        if ($logo) {
            Storage::disk('public')->delete($logo);
            Setting::set('business_logo', null);
        }

        return response()->json(['message' => 'Logo berhasil dihapus.']);
    }
}
