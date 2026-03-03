@extends('admin.layouts.app')

@section('title', 'Admin Profile - KHAT Admin')

@section('content')
<!-- Flash Messages -->
@if(session('success'))
<div class="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3">
    <i data-lucide="check-circle" class="w-5 h-5"></i>
    <span class="text-sm font-medium">{{ session('success') }}</span>
</div>
@endif
@if(session('error'))
<div class="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
    <i data-lucide="alert-circle" class="w-5 h-5"></i>
    <span class="text-sm font-medium">{{ session('error') }}</span>
</div>
@endif

<!-- Breadcrumb -->
<div class="mb-6">
    <div class="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <a href="{{ route('admin.admins.index') }}" class="hover:text-[#E75234] transition">
            <i data-lucide="arrow-left" class="w-4 h-4 inline"></i> Admin Management
        </a>
        <span>/</span>
        <span>Admin Profile</span>
        <span>/</span>
        <span class="text-gray-900 font-medium">{{ $admin->name }}</span>
    </div>

    <!-- Header -->
    <div class="flex justify-between items-start">
        <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-md border-4 border-white">
                {{ strtoupper(substr($admin->name ?? $admin->email, 0, 1)) }}
            </div>
            <div>
                <h1 class="text-3xl font-bold text-gray-900">{{ $admin->name }}</h1>
                <div class="flex items-center gap-2 mt-1">
                    <span class="text-gray-500 text-sm">{{ $admin->email }}</span>
                    @foreach($admin->roles as $role)
                    <span class="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700 uppercase">{{ $role->role_type }}</span>
                    @endforeach
                    @if($admin->id === Auth::id())
                    <span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">You</span>
                    @endif
                </div>
            </div>
        </div>

        @if($admin->id !== Auth::id())
        <button onclick="confirmRevoke({{ $admin->id }}, '{{ addslashes($admin->name ?? $admin->email) }}')" class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition flex items-center gap-2">
            <i data-lucide="shield-off" class="w-4 h-4"></i>
            Revoke Admin Access
        </button>
        @endif
    </div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
    <!-- Left Column: Admin Information -->
    <div class="lg:col-span-1 space-y-6">
        <!-- Admin Information Card -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i data-lucide="shield-check" class="w-5 h-5 text-purple-600"></i>
                Admin Information
            </h2>

            <div class="space-y-4">
                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Full Name</p>
                    <p class="text-sm font-semibold text-gray-900">{{ $admin->name ?? 'N/A' }}</p>
                </div>

                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Email</p>
                    <p class="text-sm font-semibold text-gray-900">{{ $admin->email }}</p>
                </div>

                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Roles</p>
                    <div class="flex flex-wrap gap-1 mt-1">
                        @foreach($admin->roles as $role)
                        <span class="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-100 text-purple-700 capitalize">{{ $role->role_type }}</span>
                        @endforeach
                    </div>
                </div>

                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Account Created</p>
                    <p class="text-sm font-semibold text-gray-900">{{ $admin->created_at->format('M d, Y') }}</p>
                    <p class="text-xs text-gray-500">{{ $admin->created_at->diffForHumans() }}</p>
                </div>

                @if($promotionLog)
                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Promoted to Admin</p>
                    <p class="text-sm font-semibold text-gray-900">{{ $promotionLog->created_at->format('M d, Y h:i A') }}</p>
                    @if($promotionLog->user)
                    <p class="text-xs text-gray-500">by {{ $promotionLog->user->name }}</p>
                    @endif
                </div>
                @endif

                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Last Updated</p>
                    <p class="text-sm font-semibold text-gray-900">{{ $admin->updated_at->format('M d, Y h:i A') }}</p>
                    <p class="text-xs text-gray-500">{{ $admin->updated_at->diffForHumans() }}</p>
                </div>
            </div>
        </div>

        <!-- Quick Stats -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i data-lucide="bar-chart-3" class="w-5 h-5 text-blue-600"></i>
                Activity Summary
            </h2>

            <div class="grid grid-cols-2 gap-4">
                <div class="bg-blue-50 rounded-lg p-3 text-center">
                    <p class="text-2xl font-bold text-blue-700">{{ $recentActivity->count() }}</p>
                    <p class="text-xs text-blue-600 font-medium">Recent Actions</p>
                </div>
                <div class="bg-green-50 rounded-lg p-3 text-center">
                    <p class="text-2xl font-bold text-green-700">{{ $recentActivity->where('action_type', 'create')->count() }}</p>
                    <p class="text-xs text-green-600 font-medium">Creates</p>
                </div>
                <div class="bg-orange-50 rounded-lg p-3 text-center">
                    <p class="text-2xl font-bold text-orange-700">{{ $recentActivity->where('action_type', 'update')->count() }}</p>
                    <p class="text-xs text-orange-600 font-medium">Updates</p>
                </div>
                <div class="bg-red-50 rounded-lg p-3 text-center">
                    <p class="text-2xl font-bold text-red-700">{{ $recentActivity->where('action_type', 'delete')->count() }}</p>
                    <p class="text-xs text-red-600 font-medium">Deletes</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Right Column: Recent Activity Log -->
    <div class="lg:col-span-2">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100">
                <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <i data-lucide="activity" class="w-5 h-5 text-orange-600"></i>
                    Recent Admin Activity
                </h2>
                <p class="text-sm text-gray-500 mt-0.5">Last 20 actions performed by this admin</p>
            </div>

            @if($recentActivity->count() > 0)
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                            <th class="px-6 py-3 font-semibold">Action</th>
                            <th class="px-6 py-3 font-semibold">Type</th>
                            <th class="px-6 py-3 font-semibold">Description</th>
                            <th class="px-6 py-3 font-semibold">Date</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 text-sm">
                        @foreach($recentActivity as $log)
                        <tr class="hover:bg-gray-50/50 transition-colors">
                            <td class="px-6 py-3">
                                <span class="font-medium text-gray-900">{{ $log->action }}</span>
                            </td>
                            <td class="px-6 py-3">
                                @php
                                $typeColors = [
                                    'create' => 'bg-green-100 text-green-700',
                                    'update' => 'bg-blue-100 text-blue-700',
                                    'delete' => 'bg-red-100 text-red-700',
                                    'login' => 'bg-purple-100 text-purple-700',
                                    'logout' => 'bg-gray-100 text-gray-700',
                                    'verify' => 'bg-emerald-100 text-emerald-700',
                                    'reject' => 'bg-orange-100 text-orange-700',
                                ];
                                @endphp
                                <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold {{ $typeColors[$log->action_type] ?? 'bg-gray-100 text-gray-700' }}">
                                    {{ ucfirst($log->action_type) }}
                                </span>
                            </td>
                            <td class="px-6 py-3 text-gray-600 max-w-xs truncate" title="{{ $log->description }}">
                                {{ $log->description ?? '—' }}
                            </td>
                            <td class="px-6 py-3 text-gray-500 whitespace-nowrap" title="{{ $log->created_at->format('M d, Y h:i:s A') }}">
                                {{ $log->created_at->format('M d, Y') }}
                                <br><span class="text-xs text-gray-400">{{ $log->created_at->format('h:i A') }}</span>
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            @else
            <div class="text-center py-12">
                <div class="flex flex-col items-center gap-3 text-gray-400">
                    <i data-lucide="clipboard-list" class="w-16 h-16 text-gray-300"></i>
                    <p class="text-base font-medium text-gray-500">No activity recorded yet</p>
                    <p class="text-sm text-gray-400">Actions performed by this admin will appear here</p>
                </div>
            </div>
            @endif
        </div>
    </div>
</div>

<!-- Revoke Confirmation Form (hidden) -->
<form id="revokeForm" method="POST" class="hidden">
    @csrf
    @method('DELETE')
</form>

@push('scripts')
<script>
    function confirmRevoke(userId, name) {
        Swal.fire({
            title: 'Revoke Admin Access?',
            text: `Are you sure you want to remove administrative privileges from ${name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Revoke',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                const form = document.getElementById('revokeForm');
                form.action = `/admin/admins/${userId}/revoke`;
                form.submit();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        lucide.createIcons();
    });
</script>
@endpush
@endsection
