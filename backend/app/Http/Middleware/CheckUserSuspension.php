<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckUserSuspension
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated
        /** @var \App\Models\User|null $user */
        $user = Auth::user();

        if ($user) {
            // Check if user is suspended/banned
            if (in_array($user->status, ['suspended', 'banned'])) {
                
                // Check if suspension has expired
                if ($user->suspension_end_date && now()->greaterThan($user->suspension_end_date)) {
                    // Lift suspension automatically
                    $user->status = 'active';
                    $user->suspension_reason = null;
                    $user->suspended_at = null;
                    $user->suspension_end_date = null;
                    $user->save();
                    
                    // Allow request to proceed
                    return $next($request);
                }

                // Format end date for message
                $endDate = $user->suspension_end_date 
                    ? $user->suspension_end_date->format('M d, Y h:i A') 
                    : 'Indefinitely';

                $message = $user->status === 'banned'
                    ? "Your account has been permanently banned. Reason: {$user->suspension_reason}"
                    : "Your account is suspended until {$endDate}. Reason: {$user->suspension_reason}";

                // Logout user based on guard
                if (Auth::guard('web')->check()) {
                    Auth::guard('web')->logout();
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();
                    
                    return redirect()->route('admin.login')->with('error', $message);
                }

                if (Auth::guard('sanctum')->check()) {
                     // Revoke token
                     if (method_exists($user, 'currentAccessToken')) {
                         /** @var \Laravel\Sanctum\PersonalAccessToken|null $token */
                         $token = $user->currentAccessToken();
                         if ($token) {
                             $token->delete();
                         }
                     }
                     return response()->json(['message' => $message], 403);
                }
            }
        }

        return $next($request);
    }
}
