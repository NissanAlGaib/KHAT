<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class RegisteredUserController extends Controller
{
    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:' . User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'firstName' => ['required', 'string', 'max:255'],
            'lastName' => ['required', 'string', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:255'],
            'birthdate' => ['required', 'date'],
            'sex' => ['required', 'string', 'max:255'],
            'address' => ['required', 'array'],
            'address.street' => ['required', 'string', 'max:255'],
            'address.barangay' => ['required', 'string', 'max:120'],
            'address.city' => ['required', 'string', 'max:120'],
            'address.province' => ['required', 'string', 'max:120'],
            'address.postal_code' => ['required', 'string', 'max:20'],
            'roles' => ['required', 'array'],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->string('password')),
            'firstName' => $request->firstName,
            'lastName' => $request->lastName,
            'contact_number' => $request->contact_number,
            'birthdate' => $request->birthdate,
            'sex' => $request->sex,
            'address' => $request->address,
        ]);

        $user->refresh();

        if (!empty($validated['roles'])) {
            $roleIds = Role::whereIn('role_type', $validated['roles'])->pluck('role_id');
            $user->roles()->sync($roleIds);
        } else {
            $defaultRole = Role::where('role_type', 'breeder')->first();
            if ($defaultRole) {
                $user->roles()->attach($defaultRole->role_id);
            }
        }

        event(new Registered($user));

        Auth::login($user);

        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user->load('roles')
        ], 201);
    }
}
