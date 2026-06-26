<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'free',
                'label' => 'Free',
                'price_monthly' => 0,
                'price_yearly' => 0,
                'max_users' => 1,
                'max_orders_per_month' => 100,
                'max_outlets' => 1,
                'features' => ['pdf' => false, 'wa' => false, 'backup' => false, 'kanban' => true],
                'trial_days' => 0,
                'is_active' => true,
            ],
            [
                'name' => 'pro',
                'label' => 'Pro',
                'price_monthly' => 99000,
                'price_yearly' => 990000,
                'max_users' => 3,
                'max_orders_per_month' => 0, // unlimited
                'max_outlets' => 3,
                'features' => ['pdf' => true, 'wa' => true, 'backup' => true, 'kanban' => true],
                'trial_days' => 7,
                'is_active' => true,
            ],
            [
                'name' => 'enterprise',
                'label' => 'Enterprise',
                'price_monthly' => 299000,
                'price_yearly' => 2990000,
                'max_users' => 0, // unlimited
                'max_orders_per_month' => 0, // unlimited
                'max_outlets' => 0, // unlimited
                'features' => ['pdf' => true, 'wa' => true, 'backup' => true, 'kanban' => true, 'multi_outlet' => true],
                'trial_days' => 14,
                'is_active' => true,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(['name' => $plan['name']], $plan);
        }
    }
}
