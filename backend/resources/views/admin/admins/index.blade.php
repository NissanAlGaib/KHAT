@extends('admin.layouts.app')

@section('title', 'Admin Management - KHAT Admin')

@section('content')
<div class="flex justify-between items-center mb-6">
    <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Admin Management</h1>
        <p class="text-sm text-gray-500">Manage administrative accounts and access levels</p>
    </div>
    <button onclick="openAddAdminModal()" class="inline-flex items-center gap-2 px-6 py-2.5 bg-[#E75234] text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-[#d14024] transition-all hover:shadow-md">
        <i data-lucide="user-plus" class="w-4 h-4"></i>
        Add New Admin
    </button>
</div>

@if(session('success'))
<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
    <i data-lucide="check-circle" class="w-5 h-5"></i>
    <span class="text-sm font-medium">{{ session('success') }}</span>
</div>
@endif

@if(session('error'))
<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
    <i data-lucide="alert-circle" class="w-5 h-5"></i>
    <span class="text-sm font-medium">{{ session('error') }}</span>
</div>
@endif

<!-- Admins Table -->
<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="bg-[#E75234] text-white text-sm">
                    <th class="px-6 py-4 font-semibold">Name</th>
                    <th class="px-6 py-4 font-semibold">Email</th>
                    <th class="px-6 py-4 font-semibold">Roles</th>
                    <th class="px-6 py-4 font-semibold">Date Added</th>
                    <th class="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 text-sm">
                @forelse($admins as $admin)
                <tr class="hover:bg-orange-50/50 transition-colors">
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {{ strtoupper(substr($admin->name ?? $admin->email, 0, 1)) }}
                            </div>
                            <span class="font-medium text-gray-900">{{ $admin->name ?? 'N/A' }}</span>
                            @if($admin->id === Auth::id())
                            <span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">You</span>
                            @endif
                        </div>
                    </td>
                    <td class="px-6 py-4 text-gray-600">{{ $admin->email }}</td>
                    <td class="px-6 py-4">
                        @foreach($admin->roles as $role)
                        <span class="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-100 text-orange-700 capitalize mr-1 mb-1">{{ $role->role_type }}</span>
                        @endforeach
                    </td>
                    <td class="px-6 py-4" title="{{ $admin->created_at->format('M d, Y h:i A') }} ({{ $admin->created_at->diffForHumans() }})">
                        <div class="flex flex-col">
                            <span class="text-sm font-medium text-gray-900">{{ $admin->created_at->format('M d, Y') }}</span>
                            <span class="text-xs text-gray-500">{{ $admin->created_at->format('h:i A') }}</span>
                            @if($admin->updated_at && $admin->created_at && $admin->updated_at->gt($admin->created_at))
                                <span class="text-[10px] text-gray-400 mt-1 italic" title="Updated {{ $admin->updated_at->format('M d, Y h:i A') }}">
                                    Updated {{ $admin->updated_at->diffForHumans() }}
                                    @if($admin->updater)
                                        by {{ $admin->updater->name }}
                                    @endif
                                </span>
                            @endif
                        </div>
                    </td>
                    <td class="px-6 py-4 text-center">
                        @if($admin->id !== Auth::id())
                        <button onclick="confirmRevoke({{ $admin->id }}, '{{ $admin->name ?? $admin->email }}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors">
                            <i data-lucide="shield-off" class="w-3.5 h-3.5"></i>
                            Revoke Access
                        </button>
                        @else
                        <span class="text-gray-400 text-xs italic">Current User</span>
                        @endif
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="5" class="px-6 py-16 text-center">
                        <div class="flex flex-col items-center gap-3 text-gray-400">
                            <i data-lucide="shield-check" class="w-16 h-16 text-gray-300"></i>
                            <p class="text-base font-medium text-gray-500">No admin users found</p>
                        </div>
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<!-- Pagination -->
<div class="mt-6">
    {{ $admins->links() }}
</div>

<!-- Add Admin Modal -->
<div id="addAdminModal" class="hidden fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm">
    <div class="flex items-center justify-center min-h-screen px-4 py-8">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div class="flex items-center justify-between px-8 py-5 border-b border-gray-100">
                <h2 class="text-lg font-bold text-gray-900">Add New Admin</h2>
                <button onclick="closeAddAdminModal()" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>

            <form action="{{ route('admin.admins.store') }}" method="POST" class="p-8">
                @csrf
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                        <input type="email" name="email" required placeholder="admin@example.com" class="w-full bg-gray-50 border border-gray-300 text-gray-900 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                        <p class="text-[11px] text-gray-500 mt-1">If user exists, they will be promoted. If not, a new account will be created.</p>
                    </div>

                    <div id="new-user-fields">
                        <div class="mb-4">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                            <input type="text" name="name" placeholder="John Doe" class="w-full bg-gray-50 border border-gray-300 text-gray-900 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                            <input type="password" name="password" placeholder="••••••••" class="w-full bg-gray-50 border border-gray-300 text-gray-900 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                        </div>
                    </div>
                </div>

                <div class="flex gap-3 mt-8">
                    <button type="button" onclick="closeAddAdminModal()" class="flex-1 px-6 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all">
                        Cancel
                    </button>
                    <button type="submit" class="flex-1 px-6 py-2.5 bg-[#E75234] text-white text-sm font-semibold rounded-lg hover:bg-[#d14024] transition-all shadow-sm">
                        Add Admin
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Revoke Confirmation Modal -->
<form id="revokeForm" method="POST" class="hidden">
    @csrf
    @method('DELETE')
</form>

@push('scripts')
<script>
    function openAddAdminModal() {
        document.getElementById('addAdminModal').classList.remove('hidden');
        lucide.createIcons();
    }

    function closeAddAdminModal() {
        document.getElementById('addAdminModal').classList.add('hidden');
    }

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

    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAddAdminModal();
        }
    });
</script>
@endpush
@endsection
