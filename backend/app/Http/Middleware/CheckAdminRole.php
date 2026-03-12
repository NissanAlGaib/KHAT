<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAdminRole
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || !$request->user()->roles()->where('role_type', 'admin')->exists()) {
            abort(403, 'Unauthorized. Admin access required.');
        }

        return $next($request);
    }
}
