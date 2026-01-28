<?php

namespace App\Http\Middleware;

use App\Models\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckShooterRole
{
    /**
     * Handle an incoming request.
     * Verifies that the authenticated user has the Shooter role.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $shooterRole = Role::where('role_type', 'Shooter')->first();

        if (!$shooterRole) {
            return response()->json([
                'success' => false,
                'message' => 'Shooter role not configured in the system'
            ], 500);
        }

        $isShooter = $user->roles()->where('roles.role_id', $shooterRole->role_id)->exists();

        if (!$isShooter) {
            return response()->json([
                'success' => false,
                'message' => 'You must be a verified shooter to access this resource'
            ], 403);
        }

        return $next($request);
    }
}
