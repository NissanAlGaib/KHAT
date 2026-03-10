@extends('admin.exports.layout')

@section('title', 'User Report')

@section('content')
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Status</th>
                <th>Verification</th>
                <th>Tier</th>
                <th>Joined</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $user)
                <tr>
                    <td>{{ $user->id }}</td>
                    <td>{{ $user->name }}</td>
                    <td>{{ $user->email }}</td>
                    <td>
                        @foreach($user->roles as $role)
                            {{ ucfirst($role->role_type) }} 
                        @endforeach
                    </td>
                    <td>{{ ucfirst($user->status ?? 'active') }}</td>
                    <td>
                        @php
                            $auth = $user->userAuth->first();
                            $status = $auth ? $auth->status : 'missing';
                        @endphp
                        {{ ucfirst($status) }}
                    </td>
                    <td>{{ ucfirst($user->subscription_tier ?? 'free') }}</td>
                    <td>{{ $user->created_at->format('Y-m-d') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection
