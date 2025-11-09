<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = ['Shooter', 'Breeder', 'Admin', 'Moderator'];

        foreach ($roles as $type) {
            Role::firstOrCreate(['role_type' => $type]);
        }
    }
}
