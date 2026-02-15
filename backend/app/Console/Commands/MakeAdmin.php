<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Role;
use App\Models\AuditLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class MakeAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'make:admin {email} {--name=} {--password=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create or promote a user to admin status';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $name = $this->option('name');
        $password = $this->option('password');

        $user = User::where('email', $email)->first();

        if ($user) {
            $this->info("User with email {$email} already exists. Promoting to admin...");
        } else {
            if (!$name) {
                $name = $this->ask('Enter name for the new admin');
            }
            if (!$password) {
                $password = $this->secret('Enter password for the new admin');
            }

            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
            ]);

            $this->info("Created new user: {$name} ({$email})");
        }

        // Ensure 'admin' role exists
        $adminRole = Role::firstOrCreate(['role_type' => 'admin']);

        // Assign role if not already assigned
        if (!$user->roles()->where('roles.role_id', $adminRole->role_id)->exists()) {
            $user->roles()->attach($adminRole->role_id);
            $this->info("Assigned 'admin' role to {$user->email}");
        } else {
            $this->warn("User {$user->email} already has 'admin' role.");
        }

        // Log the action
        AuditLog::create([
            'user_id' => null, // CLI action
            'action' => 'admin.create_cli',
            'action_type' => AuditLog::TYPE_CREATE,
            'model_type' => User::class,
            'model_id' => $user->id,
            'description' => "Admin created/promoted via CLI: {$user->email}",
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Artisan CLI',
        ]);

        $this->info("Admin setup complete.");
        return Command::SUCCESS;
    }
}
