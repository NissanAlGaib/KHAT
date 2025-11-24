<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\UserAuth;
use App\Models\User;
use Carbon\Carbon;

class UserAuthSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get users with shooter role
        $shooterUsers = User::whereHas('roles', function ($q) {
            $q->where('role_type', 'shooter');
        })->get();

        foreach ($shooterUsers as $user) {
            // Check if they already have a shooter certificate
            $hasShooterCert = UserAuth::where('user_id', $user->id)
                ->where('auth_type', 'shooter_certificate')
                ->exists();

            if (!$hasShooterCert) {
                // Create shooter certificate record
                UserAuth::create([
                    'user_id' => $user->id,
                    'auth_type' => 'shooter_certificate',
                    'document_path' => 'verification/shooter/' . $user->id . '/sample_shooter_cert.jpg',
                    'status' => 'pending',
                    'expiry_date' => Carbon::now()->addYears(2)->format('Y-m-d'), // Expires in 2 years
                    'date_created' => Carbon::now(),
                ]);

                echo "Added shooter certificate for user {$user->name} (ID: {$user->id})\n";
            }
        }

        // Update expiry dates for existing documents (set to 1 year from now)
        UserAuth::whereNull('expiry_date')->update([
            'expiry_date' => Carbon::now()->addYear()->format('Y-m-d')
        ]);

        echo "Updated expiry dates for existing documents\n";
    }
}
