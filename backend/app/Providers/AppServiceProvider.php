<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Force HTTPS in production (DO App Platform terminates SSL at load balancer)
        if (app()->environment('production')) {
            URL::forceScheme('https');
        }

        // Rate limit admin login to 5 attempts per minute per IP
        RateLimiter::for('admin-login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        // Rate limit registration to 10 attempts per minute per IP
        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        // Rate limit forgot-password to 5 attempts per minute per IP
        RateLimiter::for('forgot-password', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        // Share admin notification badges with all admin views
        View::composer('admin.layouts.app', function ($view) {
            if (!Auth::check()) {
                $view->with('adminAlerts', collect());
                $view->with('adminAlertCount', 0);
                return;
            }

            $alerts = collect();

            try {
                // Pending verification requests
                $pendingVerifications = \App\Models\UserAuth::where('status', 'pending')->count();
                if ($pendingVerifications > 0) {
                    $alerts->push([
                        'icon' => 'file-check',
                        'color' => 'yellow',
                        'title' => "{$pendingVerifications} pending verification" . ($pendingVerifications > 1 ? 's' : ''),
                        'message' => 'User documents awaiting review',
                        'url' => route('admin.users.index', ['status' => 'pending']),
                        'count' => $pendingVerifications,
                        'priority' => 1,
                    ]);
                }

                // Pending vaccination shots
                $pendingShots = \App\Models\VaccinationShot::where('verification_status', 'pending')->count();
                if ($pendingShots > 0) {
                    $alerts->push([
                        'icon' => 'syringe',
                        'color' => 'orange',
                        'title' => "{$pendingShots} pending shot verification" . ($pendingShots > 1 ? 's' : ''),
                        'message' => 'Vaccination proofs awaiting review',
                        'url' => route('admin.vaccination-shots.pending'),
                        'count' => $pendingShots,
                        'priority' => 2,
                    ]);
                }

                // Pending safety reports
                $pendingReports = \App\Models\SafetyReport::where('status', \App\Models\SafetyReport::STATUS_PENDING)->count();
                if ($pendingReports > 0) {
                    $alerts->push([
                        'icon' => 'shield-alert',
                        'color' => 'red',
                        'title' => "{$pendingReports} pending safety report" . ($pendingReports > 1 ? 's' : ''),
                        'message' => 'Reports requiring admin review',
                        'url' => route('admin.reports'),
                        'count' => $pendingReports,
                        'priority' => 0,
                    ]);
                }

                // Pending match requests
                $pendingMatches = \App\Models\MatchRequest::where('status', 'pending')->count();
                if ($pendingMatches > 0) {
                    $alerts->push([
                        'icon' => 'heart-handshake',
                        'color' => 'pink',
                        'title' => "{$pendingMatches} pending match request" . ($pendingMatches > 1 ? 's' : ''),
                        'message' => 'Match requests awaiting response',
                        'url' => route('admin.matches'),
                        'count' => $pendingMatches,
                        'priority' => 3,
                    ]);
                }

                // New users in last 24h
                $newUsers24h = \App\Models\User::where('created_at', '>=', now()->subDay())->count();
                if ($newUsers24h > 0) {
                    $alerts->push([
                        'icon' => 'user-plus',
                        'color' => 'blue',
                        'title' => "{$newUsers24h} new user" . ($newUsers24h > 1 ? 's' : '') . " today",
                        'message' => 'Registered in the last 24 hours',
                        'url' => route('admin.users.index'),
                        'count' => $newUsers24h,
                        'priority' => 5,
                    ]);
                }

                $alerts = $alerts->sortBy('priority')->values();
            } catch (\Exception $e) {
                // Silently fail — don't break every page
            }

            $view->with('adminAlerts', $alerts);
            $view->with('adminAlertCount', $alerts->sum('count'));
        });
    }
}
