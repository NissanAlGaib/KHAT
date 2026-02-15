<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Exceptions\HttpResponseException;
use App\Models\User;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        if (! Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        if ($user->status === 'suspended') {
            // Check if suspension has expired
            if ($user->suspension_end_date && now()->greaterThan($user->suspension_end_date)) {
                // Auto-reactivate
                $user->status = 'active';
                $user->suspension_reason = null;
                $user->suspended_at = null;
                $user->suspension_end_date = null;
                $user->save();
            } else {
                Auth::logout();
                throw new HttpResponseException(response()->json([
                    'message' => 'Account Suspended',
                    'error' => 'account_suspended',
                    'reason' => $user->suspension_reason,
                    'suspended_at' => $user->suspended_at,
                    'end_date' => $user->suspension_end_date,
                    'support_email' => 'support@pawlink.ph'
                ], 403));
            }
        }

        if ($user->status === 'banned') {
            Auth::logout();
            throw new HttpResponseException(response()->json([
                'message' => 'Account Banned',
                'error' => 'account_banned',
                'reason' => $user->suspension_reason,
                'suspended_at' => $user->suspended_at,
                'support_email' => 'support@pawlink.ph'
            ], 403));
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->input('email')).'|'.$this->ip());
    }
}
