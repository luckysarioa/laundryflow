<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemSettingsController extends Controller
{
    /**
     * Platform settings keys and their defaults.
     */
    private const PLATFORM_DEFAULTS = [
        'platform_name' => 'LaundryFlow',
        'platform_email' => 'admin@laundryflow.id',
        'support_email' => 'support@laundryflow.id',
        'maintenance_mode' => 'false',
        'registration_enabled' => 'true',
        'default_trial_days' => '7',
        'max_free_users' => '1',
        'max_free_orders' => '100',
    ];

    /**
     * Get all platform settings.
     */
    public function index(): JsonResponse
    {
        $settings = [];
        foreach (self::PLATFORM_DEFAULTS as $key => $default) {
            $value = Setting::get($key, $default);
            $settings[$key] = $value;
        }

        // Cast booleans and integers for frontend.
        $settings['maintenance_mode'] = $settings['maintenance_mode'] === 'true';
        $settings['registration_enabled'] = $settings['registration_enabled'] === 'true';
        $settings['default_trial_days'] = (int) $settings['default_trial_days'];
        $settings['max_free_users'] = (int) $settings['max_free_users'];
        $settings['max_free_orders'] = (int) $settings['max_free_orders'];

        return response()->json($settings);
    }

    /**
     * Update platform settings.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'platform_name' => 'sometimes|string|max:255',
            'platform_email' => 'sometimes|email|max:255',
            'support_email' => 'sometimes|email|max:255',
            'maintenance_mode' => 'sometimes|boolean',
            'registration_enabled' => 'sometimes|boolean',
            'default_trial_days' => 'sometimes|integer|min:0',
            'max_free_users' => 'sometimes|integer|min:0',
            'max_free_orders' => 'sometimes|integer|min:0',
        ]);

        foreach ($validated as $key => $value) {
            if (is_bool($value)) {
                $value = $value ? 'true' : 'false';
            }
            Setting::set($key, $value);
        }

        return response()->json(['message' => 'Settings updated successfully.']);
    }
}
