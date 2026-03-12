<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // First, ensure the admin role exists
        $adminRole = DB::table('roles')->where('role_type', 'admin')->first();

        if (!$adminRole) {
            $roleId = DB::table('roles')->insertGetId([
                'role_type' => 'admin',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $roleId = $adminRole->role_id;
        }

        // Create admin user
        $adminEmail = env('ADMIN_EMAIL', 'admin@pawlink.com');
        $adminPassword = env('ADMIN_PASSWORD', Str::random(32));
        $existingUser = DB::table('users')->where('email', $adminEmail)->first();

        if (!$existingUser) {
            $userId = DB::table('users')->insertGetId([
                'name' => 'Admin User',
                'email' => $adminEmail,
                'password' => Hash::make($adminPassword),
                'firstName' => 'Admin',
                'lastName' => 'User',
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Assign admin role to user
            DB::table('user_roles')->insert([
                'user_id' => $userId,
                'role_id' => $roleId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $this->command->info('Admin user created successfully!');
            $this->command->info('Email: ' . $adminEmail);
            if (!env('ADMIN_PASSWORD')) {
                $this->command->warn('No ADMIN_PASSWORD set in .env — generated random password: ' . $adminPassword);
                $this->command->warn('Set ADMIN_PASSWORD in your .env file and re-run the seeder.');
            }
        } else {
            // Only update password if ADMIN_PASSWORD is explicitly set in env
            if (env('ADMIN_PASSWORD')) {
                DB::table('users')
                    ->where('email', $adminEmail)
                    ->update([
                        'password' => Hash::make($adminPassword),
                        'updated_at' => now(),
                    ]);
            }

            // Ensure user has admin role
            $userRoleExists = DB::table('user_roles')
                ->where('user_id', $existingUser->id)
                ->where('role_id', $roleId)
                ->exists();

            if (!$userRoleExists) {
                DB::table('user_roles')->insert([
                    'user_id' => $existingUser->id,
                    'role_id' => $roleId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $this->command->info('Admin user updated successfully!');
        }
    }
}
