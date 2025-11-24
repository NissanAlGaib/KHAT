<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

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
        $adminEmail = 'admin@khat.com';
        $existingUser = DB::table('users')->where('email', $adminEmail)->first();

        if (!$existingUser) {
            $userId = DB::table('users')->insertGetId([
                'name' => 'Admin User',
                'email' => $adminEmail,
                'password' => Hash::make('Admin123!'),
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
            $this->command->info('Email: admin@khat.com');
            $this->command->info('Password: Admin123!');
        } else {
            // Update existing user password
            DB::table('users')
                ->where('email', $adminEmail)
                ->update([
                    'password' => Hash::make('Admin123!'),
                    'updated_at' => now(),
                ]);

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
            $this->command->info('Email: admin@khat.com');
            $this->command->info('Password: Admin123!');
        }
    }
}
