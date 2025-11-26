<?php

namespace App\Console\Commands;

use App\Models\BreedingContract;
use Illuminate\Console\Command;

class SyncShooterToConversations extends Command
{
    protected $signature = 'shooter:sync-conversations';
    protected $description = 'Sync shooter_user_id from breeding contracts to conversations where both owners have accepted';

    public function handle()
    {
        $contracts = BreedingContract::where('shooter_status', 'accepted_by_owners')
            ->whereNotNull('shooter_user_id')
            ->with('conversation')
            ->get();

        $updated = 0;
        foreach ($contracts as $contract) {
            if ($contract->conversation && $contract->conversation->shooter_user_id !== $contract->shooter_user_id) {
                $contract->conversation->update(['shooter_user_id' => $contract->shooter_user_id]);
                $this->info("Updated conversation {$contract->conversation_id} with shooter {$contract->shooter_user_id}");
                $updated++;
            }
        }

        $this->info("Synced {$updated} conversations with shooter assignments.");
        return Command::SUCCESS;
    }
}
