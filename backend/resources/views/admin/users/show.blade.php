@extends('admin.layouts.app')

@section('title', 'User Profile - KHAT Admin')

@section('content')
<!-- Success Message -->
@if(session('success'))
<div class="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative" role="alert">
    <span class="block sm:inline">{{ session('success') }}</span>
    <button type="button" class="absolute top-0 bottom-0 right-0 px-4 py-3" onclick="this.parentElement.style.display='none';">
        <i data-lucide="x" class="w-4 h-4"></i>
    </button>
</div>
@endif

<div class="mb-6">
    <div class="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <a href="{{ route('admin.users.index') }}" class="hover:text-[#E75234] transition">
            <i data-lucide="arrow-left" class="w-4 h-4 inline"></i> User Management
        </a>
        <span>/</span>
        <span>User Profile</span>
        <span>/</span>
        <span class="text-gray-900 font-medium">{{ $user->name }}</span>
    </div>

    <div class="flex justify-between items-start">
        <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-2xl shadow-md border-4 border-white">
                {{ strtoupper(substr($user->name ?? $user->email, 0, 1)) }}
            </div>
            <div>
                <h1 class="text-3xl font-bold text-gray-900">{{ $user->name }}</h1>
                <div class="flex items-center gap-2 mt-1">
                    <span class="text-gray-500 text-sm">{{ $user->email }}</span>
                    @if($user->status === 'suspended')
                        <span class="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 uppercase">Suspended</span>
                    @elseif($user->status === 'banned')
                        <span class="px-2 py-0.5 rounded text-xs font-bold bg-gray-800 text-white uppercase">Banned</span>
                    @else
                        <span class="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 uppercase">Active</span>
                    @endif
                </div>
            </div>
        </div>
        
        <div class="flex gap-3">
            <button onclick="openStatusModal()" class="px-4 py-2 bg-orange-100 text-orange-700 text-sm font-medium rounded-lg hover:bg-orange-200 transition">
                <i data-lucide="shield-alert" class="w-4 h-4 inline mr-1"></i>
                Change Status
            </button>
            <button onclick="deleteUser({{ $user->id }})" class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition">
                <i data-lucide="trash-2" class="w-4 h-4 inline mr-1"></i>
                Delete User
            </button>
        </div>
    </div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
    <!-- Left Column: User Info & Verification -->
    <div class="lg:col-span-1 space-y-6">
        <!-- User Information -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-bold text-gray-900 mb-4">User Information</h2>
            
            <div class="space-y-4">
                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Full Name</p>
                    <p class="text-sm font-semibold text-gray-900">{{ $user->firstName }} {{ $user->lastName }}</p>
                </div>
                
                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Contact Number</p>
                    <p class="text-sm font-semibold text-gray-900">{{ $user->contact_number ?? 'N/A' }}</p>
                </div>
                
                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Address</p>
                    <p class="text-sm font-semibold text-gray-900">
                        @if($user->address)
                            {{ is_array($user->address) ? implode(', ', array_filter($user->address)) : $user->address }}
                        @else
                            N/A
                        @endif
                    </p>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Gender</p>
                        <p class="text-sm font-semibold text-gray-900 capitalize">{{ $user->sex ?? 'N/A' }}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Birthdate</p>
                        <p class="text-sm font-semibold text-gray-900">{{ $user->birthdate ? \Carbon\Carbon::parse($user->birthdate)->format('M d, Y') : 'N/A' }}</p>
                    </div>
                </div>

                <div class="border-t border-gray-100 pt-4">
                    <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Joined</p>
                    <p class="text-sm font-semibold text-gray-900">{{ $user->created_at->format('F d, Y') }}</p>
                </div>
            </div>
        </div>

        <!-- Verification Status -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-bold text-gray-900 mb-4">Verification Documents</h2>
            
            @forelse($user->userAuth as $auth)
                <div class="mb-4 last:mb-0 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-sm font-bold text-gray-900 capitalize">{{ str_replace('_', ' ', $auth->auth_type) }}</span>
                        @if($auth->status === 'approved')
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase">Verified</span>
                        @elseif($auth->status === 'pending')
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 uppercase">Pending</span>
                        @else
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase">Rejected</span>
                        @endif
                    </div>
                    
                    @if($auth->document_path)
                        <button onclick="viewDocument('{{ Storage::disk('do_spaces')->url($auth->document_path) }}', '{{ $auth->auth_type }}')" class="text-xs text-[#E75234] hover:underline flex items-center gap-1 focus:outline-none">
                            <i data-lucide="file-text" class="w-3 h-3"></i> View Document
                        </button>
                    @endif
                    
                    @if($auth->status === 'pending')
                    <div class="mt-3 flex gap-2">
                        <button onclick="verifyDocument({{ $auth->auth_id }}, 'approved')" class="flex-1 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition">Approve</button>
                        <button onclick="verifyDocument({{ $auth->auth_id }}, 'rejected')" class="flex-1 py-1.5 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition">Reject</button>
                    </div>
                    @endif
                </div>
            @empty
                <p class="text-sm text-gray-500 italic">No verification documents submitted.</p>
            @endforelse
        </div>
    </div>

    <!-- Right Column: Pets & Activity -->
    <div class="lg:col-span-2 space-y-6">
        <!-- Stats Row -->
        <div class="grid grid-cols-3 gap-4">
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p class="text-xs text-gray-500 uppercase font-bold mb-1">Total Pets</p>
                <p class="text-2xl font-bold text-gray-900">{{ $user->pets_count }}</p>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p class="text-xs text-gray-500 uppercase font-bold mb-1">Reports Against</p>
                <p class="text-2xl font-bold text-red-600">{{ $user->reports_against_count }}</p>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p class="text-xs text-gray-500 uppercase font-bold mb-1">Warnings</p>
                <p class="text-2xl font-bold text-orange-600">{{ $user->warning_count }}</p>
            </div>
        </div>

        <!-- Pets List -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 class="text-lg font-bold text-gray-900">Owned Pets</h2>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
                        <tr>
                            <th class="px-6 py-3 font-semibold">Pet</th>
                            <th class="px-6 py-3 font-semibold">Breed</th>
                            <th class="px-6 py-3 font-semibold">Status</th>
                            <th class="px-6 py-3 font-semibold text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        @forelse($user->pets as $pet)
                        <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden">
                                        @if($pet->primary_photo_url)
                                            <img src="{{ $pet->primary_photo_url }}" class="w-full h-full object-cover">
                                        @else
                                            <div class="w-full h-full flex items-center justify-center text-gray-400">
                                                <i data-lucide="paw-print" class="w-5 h-5"></i>
                                            </div>
                                        @endif
                                    </div>
                                    <div>
                                        <p class="text-sm font-bold text-gray-900">{{ $pet->name }}</p>
                                        <p class="text-xs text-gray-500">{{ $pet->species }}</p>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-600">{{ $pet->breed }}</td>
                            <td class="px-6 py-4">
                                <span class="px-2 py-1 rounded-full text-xs font-bold 
                                    {{ $pet->status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600' }}">
                                    {{ ucfirst($pet->status) }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <a href="{{ route('admin.pets.details', $pet->pet_id) }}" class="text-[#E75234] hover:text-[#d14024] text-sm font-medium">View</a>
                            </td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="4" class="px-6 py-8 text-center text-gray-500 italic">No pets registered.</td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Warnings History -->
        @if($user->warnings->isNotEmpty())
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-bold text-gray-900 mb-4">Warnings History</h2>
            <div class="space-y-4">
                @foreach($user->warnings as $warning)
                <div class="bg-red-50 border border-red-100 rounded-lg p-4">
                    <div class="flex justify-between items-start">
                        <div>
                            <span class="px-2 py-0.5 bg-red-200 text-red-800 text-[10px] font-bold uppercase rounded mb-2 inline-block">{{ $warning->type }}</span>
                            <p class="text-sm text-gray-800">{{ $warning->message }}</p>
                        </div>
                        <span class="text-xs text-gray-500">{{ $warning->created_at->format('M d, Y') }}</span>
                    </div>
                    <p class="text-xs text-gray-500 mt-2">Issued by: {{ $warning->admin->name ?? 'System' }}</p>
                </div>
                @endforeach
            </div>
        </div>
        @endif
    </div>
</div>

<!-- Status Change Modal -->
<div id="statusModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Change User Status</h3>
        <form action="{{ route('admin.users.status', $user->id) }}" method="POST">
            @csrf
            <div class="mb-4">
                <label class="block text-sm font-semibold text-gray-700 mb-2">New Status</label>
                <select name="status" id="statusSelect" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]" onchange="toggleReasonField()">
                    <option value="active" {{ $user->status === 'active' ? 'selected' : '' }}>Active</option>
                    <option value="suspended" {{ $user->status === 'suspended' ? 'selected' : '' }}>Suspended</option>
                    <option value="banned" {{ $user->status === 'banned' ? 'selected' : '' }}>Banned</option>
                </select>
            </div>
            
            <div id="reasonField" class="space-y-4 {{ in_array($user->status, ['suspended', 'banned']) ? '' : 'hidden' }}">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Suspension Duration</label>
                    <select name="suspension_duration" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
                        <option value="indefinite">Indefinite (Until manually lifted)</option>
                        <option value="1_day">24 Hours</option>
                        <option value="3_days">3 Days</option>
                        <option value="7_days">7 Days</option>
                        <option value="30_days">30 Days</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                    <textarea name="suspension_reason" rows="3" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]" placeholder="Please provide a reason...">{{ $user->suspension_reason }}</textarea>
                </div>
            </div>

            <div class="flex gap-3 mt-6">
                <button type="submit" class="flex-1 px-4 py-2.5 bg-[#E75234] text-white text-sm font-medium rounded-lg hover:bg-[#d14024] transition">Update Status</button>
                <button type="button" onclick="closeStatusModal()" class="flex-1 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition">Cancel</button>
            </div>
        </form>
    </div>
</div>

<!-- Delete Form -->
<form id="deleteUserForm" action="{{ route('admin.users.delete', $user->id) }}" method="POST" class="hidden">
    @csrf
    @method('DELETE')
</form>

@push('scripts')
<script>
    function openStatusModal() {
        document.getElementById('statusModal').classList.remove('hidden');
    }

    function closeStatusModal() {
        document.getElementById('statusModal').classList.add('hidden');
    }

    function toggleReasonField() {
        const status = document.getElementById('statusSelect').value;
        const reasonField = document.getElementById('reasonField');
        if (status === 'suspended' || status === 'banned') {
            reasonField.classList.remove('hidden');
        } else {
            reasonField.classList.add('hidden');
        }
    }

    function deleteUser(id) {
        Swal.fire({
            title: 'Delete User?',
            text: "This action cannot be undone. All data associated with this user will be permanently removed.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, delete user'
        }).then((result) => {
            if (result.isConfirmed) {
                document.getElementById('deleteUserForm').submit();
            }
        });
    }

    async function verifyDocument(authId, status) {
        // ... (Reuse verify logic from index or implement simpler form submission)
        // For simplicity, using fetch here
        try {
            const response = await fetch(`/admin/users/verification/${authId}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': '{{ csrf_token() }}'
                },
                body: JSON.stringify({ status })
            });
            const data = await response.json();
            if (data.success) {
                location.reload();
            }
        } catch (e) {
            alert('Error updating status');
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        lucide.createIcons();
    });
</script>
@endpush
@endsection
