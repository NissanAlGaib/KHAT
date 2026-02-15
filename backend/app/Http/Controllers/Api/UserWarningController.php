<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\UserWarning;
use Illuminate\Support\Facades\Auth;

class UserWarningController extends Controller
{
    /**
     * Acknowledge a specific warning.
     */
    public function acknowledge(Request $request, $id)
    {
        $userId = Auth::id();
        $warning = UserWarning::where('user_id', $userId)->findOrFail($id);

        if ($warning->acknowledged_at) {
            return response()->json(['message' => 'Warning already acknowledged.'], 200);
        }

        $warning->acknowledged_at = now();
        $warning->save();
        
        return response()->json([
            'success' => true,
            'message' => 'Warning acknowledged successfully.',
            'warning' => $warning
        ]);
    }
}
