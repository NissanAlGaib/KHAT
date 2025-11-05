<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
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
    public function store(Request $request): Response
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:' . User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:255'],
            'birthdate' => ['required', 'date'],
            'sex' => ['required', 'string', 'max:255'],
            'address' => ['required', 'array'],
                'address.street' => ['required', 'string', 'max:255'],
                'address.barangay' => ['required', 'string', 'max:120'],
                'address.city' => ['required', 'string', 'max:120'],
                'address.province' => ['required', 'string', 'max:120'],
                'address.postal_code' => ['required', 'string', 'max:20'],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->string('password')),
            'first_name'=> $request->first_name,
            'last_name'=> $request->last_name,
            'contact_number'=> $request->contact_number,
            'birthdate'=> $request->birthdate,
            'sex'=> $request->sex,
            'address'=> $request->address,
        ]);

        event(new Registered($user));

        Auth::login($user);

        return response()->noContent();
    }
}
