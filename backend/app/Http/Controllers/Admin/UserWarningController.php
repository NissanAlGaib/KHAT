<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\User;
use App\Models\UserWarning;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class UserWarningController extends Controller
{
    /**
     * Issue a warning to a user.
     */
    public function store(Request $request, User $user)
    {
        $request->validate([
            'type' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        // Create the warning
        $warning = UserWarning::create([
            'user_id' => $user->id,
            'admin_id' => Auth::id(),
            'type' => $request->type,
            'message' => $request->message,
        ]);

        // Increment user's warning count
        $user->incrementWarningCount();
        $user->refresh();

        $statusMessage = "Warning issued to {$user->name}. Current warning count: {$user->warning_count}.";

        // Check threshold for suspension/ban
        if ($user->warning_count >= 3 && $user->status !== 'banned') {
            $oldStatus = $user->status;
            $user->status = 'banned';
            $user->save();

            $statusMessage .= " User has been automatically banned due to reaching the warning threshold.";

            // Log automated ban
            AuditLog::log(
                'user.automated_ban',
                AuditLog::TYPE_UPDATE,
                "User {$user->name} was automatically banned after receiving warning #{$user->warning_count}",
                User::class,
                $user->id,
                ['status' => $oldStatus],
                ['status' => 'banned']
            );
        }

        // Log the warning action
        AuditLog::log(
            'user.warned',
            AuditLog::TYPE_CREATE,
            "Admin issued a '{$request->type}' warning to {$user->name}",
            UserWarning::class,
            $warning->id
        );

        return redirect()->back()->with('success', $statusMessage);
    }
}
