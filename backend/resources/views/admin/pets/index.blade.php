@extends('admin.layouts.app')

@section('title', 'Pet Management - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-2">Pet Management</h1>
<p class="text-sm text-gray-500 mb-6">View and manage all registered pets, their verification and activity status</p>

<!-- Search and Filters Section -->
<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
    <form action="{{ route('admin.pets.index') }}" method="GET">
        <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><i data-lucide="filter" class="w-4 h-4 text-[#E75234]"></i>Search & Filters</h3>
        <!-- Search by Name or ID -->
        <div class="mb-6">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Search by Name or ID</label>
            <div class="relative">
                <input
                    type="text"
                    name="search"
                    value="{{ request('search') }}"
                    placeholder="Enter Pet Name, Owner Name, or Microchip ID"
                    class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pl-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-400">
                    <i data-lucide="search" class="w-4 h-4"></i>
                </div>
            </div>
        </div>

        <!-- Filter Row -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <!-- Pet Type/Species -->
            <div class="space-y-1.5">
                <label class="text-xs font-semibold text-gray-700">Pet Type/Species</label>
                <div class="relative">
                    <select name="pet_type" class="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent">
                        <option value="">All Types</option>
                        <option value="dog" {{ request('pet_type') == 'dog' ? 'selected' : '' }}>Dog</option>
                        <option value="cat" {{ request('pet_type') == 'cat' ? 'selected' : '' }}>Cat</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </div>
                </div>
            </div>

            <!-- Breed -->
            <div class="space-y-1.5">
                <label class="text-xs font-semibold text-gray-700">Breed</label>
                <div class="relative">
                    <select name="breed" class="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent">
                        <option value="">All Breeds</option>
                        <option value="Beagle" {{ request('breed') == 'Beagle' ? 'selected' : '' }}>Beagle</option>
                        <option value="Retriever" {{ request('breed') == 'Retriever' ? 'selected' : '' }}>Retriever</option>
                        <option value="Labrador Retriever" {{ request('breed') == 'Labrador Retriever' ? 'selected' : '' }}>Labrador Retriever</option>
                        <option value="Shih Tzu" {{ request('breed') == 'Shih Tzu' ? 'selected' : '' }}>Shih Tzu</option>
                        <option value="Bengal Cat" {{ request('breed') == 'Bengal Cat' ? 'selected' : '' }}>Bengal Cat</option>
                        <option value="Persian" {{ request('breed') == 'Persian' ? 'selected' : '' }}>Persian</option>
                        <option value="Sphynx" {{ request('breed') == 'Sphynx' ? 'selected' : '' }}>Sphynx</option>
                        <option value="Belgian Malinois" {{ request('breed') == 'Belgian Malinois' ? 'selected' : '' }}>Belgian Malinois</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </div>
                </div>
            </div>

            <!-- Sex -->
            <div class="space-y-1.5">
                <label class="text-xs font-semibold text-gray-700">Sex</label>
                <div class="relative">
                    <select name="sex" class="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent">
                        <option value="">All</option>
                        <option value="male" {{ request('sex') == 'male' ? 'selected' : '' }}>Male</option>
                        <option value="female" {{ request('sex') == 'female' ? 'selected' : '' }}>Female</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </div>
                </div>
            </div>

            <!-- Owner Verification -->
            <div class="space-y-1.5">
                <label class="text-xs font-semibold text-gray-700">Owner Verification</label>
                <div class="relative">
                    <select name="verification_status" class="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent">
                        <option value="">All Statuses</option>
                        <option value="approved" {{ request('verification_status') == 'approved' ? 'selected' : '' }}>Verified</option>
                        <option value="pending" {{ request('verification_status') == 'pending' ? 'selected' : '' }}>Pending</option>
                        <option value="rejected" {{ request('verification_status') == 'rejected' ? 'selected' : '' }}>Rejected</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </div>
                </div>
            </div>

            <!-- Activity Status -->
            <div class="space-y-1.5">
                <label class="text-xs font-semibold text-gray-700">Status</label>
                <div class="relative">
                    <select name="activity_status" class="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent">
                        <option value="">All Statuses</option>
                        <option value="active" {{ request('activity_status') == 'active' ? 'selected' : '' }}>Active</option>
                        <option value="disabled" {{ request('activity_status') == 'disabled' ? 'selected' : '' }}>Disabled</option>
                        <option value="cooldown" {{ request('activity_status') == 'cooldown' ? 'selected' : '' }}>Cooldown</option>
                        <option value="banned" {{ request('activity_status') == 'banned' ? 'selected' : '' }}>Banned</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
            <button type="submit" class="px-6 py-2.5 bg-[#E75234] text-white text-sm font-medium rounded-lg shadow-md hover:bg-[#d14024] transition">
                Apply Filters
            </button>
            <a href="{{ route('admin.pets.index') }}" class="px-6 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition">
                Reset Filters
            </a>
        </div>
    </form>
</div>

@include('admin.partials.date-filter')

<!-- Suspend Pet Modal -->
<div id="suspendModal" class="hidden fixed inset-0 z-[60] overflow-y-auto bg-gray-900/60 backdrop-blur-sm">
    <div class="flex items-center justify-center min-h-screen px-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <i data-lucide="pause-circle" class="w-5 h-5 text-orange-600"></i>
                </div>
                <div>
                    <h3 class="text-lg font-bold text-gray-900">Suspend Pet</h3>
                    <p class="text-sm text-gray-500" id="suspendPetName">Pet Name</p>
                </div>
            </div>
            
            <form id="suspendForm" method="POST">
                @csrf
                <input type="hidden" name="status" value="disabled">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Suspension Duration</label>
                        <select name="suspension_duration" class="w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none">
                            <option value="indefinite">Indefinite (Until manually lifted)</option>
                            <option value="1_day">24 Hours</option>
                            <option value="3_days">3 Days</option>
                            <option value="7_days">7 Days</option>
                            <option value="30_days">30 Days</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Reason for Suspension</label>
                        <textarea name="suspension_reason" required rows="4" class="w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent" placeholder="Explain why this pet is being suspended..."></textarea>
                    </div>
                </div>

                <div class="mt-6 flex gap-3">
                    <button type="button" onclick="closeSuspendModal()" class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-all">
                        Cancel
                    </button>
                    <button type="submit" class="flex-1 px-4 py-2.5 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-all shadow-sm">
                        Suspend Pet
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Showing entries info -->
<p class="text-sm text-gray-600 mb-4">
    Showing {{ $pets->firstItem() ?? 0 }} - {{ $pets->lastItem() ?? 0 }} of {{ $pets->total() }} entries
</p>

<!-- Pets Table -->
<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
    <div class="overflow-x-auto min-h-[400px]">
        <table class="w-full text-left border-collapse min-w-[1200px]">
            <thead>
                <tr class="bg-[#E75234] text-white text-sm">
                    <th class="px-6 py-4 font-semibold rounded-tl-xl">Pet ID</th>
                    <th class="px-6 py-4 font-semibold">Pet Name</th>
                    <th class="px-6 py-4 font-semibold">Species & Breed</th>
                    <th class="px-6 py-4 font-semibold">Age</th>
                    <th class="px-6 py-4 font-semibold">Sex</th>
                    <th class="px-6 py-4 font-semibold">Owner</th>
                    <th class="px-6 py-4 font-semibold">Registered</th>
                    <th class="px-6 py-4 font-semibold text-center">Status</th>
                    <th class="px-6 py-4 font-semibold text-center rounded-tr-xl">Actions</th>
                </tr>
            </thead>

            <tbody class="divide-y divide-gray-100 text-sm text-gray-700">
                @forelse($pets as $pet)
                <tr class="hover:bg-orange-50 transition-colors {{ $loop->even ? 'bg-gray-50/30' : '' }}">
                    <td class="px-6 py-4 font-mono text-xs text-gray-500">PET-{{ str_pad($pet->pet_id, 5, '0', STR_PAD_LEFT) }}</td>
                    <td class="px-6 py-4 font-medium text-gray-900">{{ $pet->name ?? 'Unnamed' }}</td>
                    <td class="px-6 py-4">{{ ucfirst($pet->species ?? 'N/A') }}, {{ $pet->breed ?? 'Unknown' }}</td>
                    <td class="px-6 py-4">
                        @if($pet->birthdate)
                        @php
                        $diff = \Carbon\Carbon::parse($pet->birthdate)->diff(\Carbon\Carbon::now());
                        $years = $diff->y;
                        $months = $diff->m;
                        @endphp
                        @if($years > 0)
                        {{ $years }} yr {{ $months }} mos
                        @else
                        {{ $months }} mos
                        @endif
                        @else
                        N/A
                        @endif
                    </td>
                    <td class="px-6 py-4 capitalize">{{ $pet->sex ?? 'N/A' }}</td>
                    <td class="px-6 py-4">
                        <div class="flex flex-col">
                            <span class="font-medium text-gray-900">{{ $pet->owner->name ?? $pet->owner->email ?? 'Unknown' }}</span>
                            @php
                            $userAuthRecord = $pet->owner->userAuth->first();
                            $verificationStatus = $userAuthRecord->status ?? 'unknown';
                            @endphp
                            
                            @if($verificationStatus === 'approved')
                                <span class="inline-flex items-center gap-1 text-xs text-green-600 mt-0.5">
                                    <i data-lucide="badge-check" class="w-3 h-3"></i> Verified Owner
                                </span>
                            @elseif($verificationStatus === 'pending')
                                <span class="inline-flex items-center gap-1 text-xs text-yellow-600 mt-0.5">
                                    <i data-lucide="clock" class="w-3 h-3"></i> Verification Pending
                                </span>
                            @endif
                        </div>
                    </td>
                    <td class="px-6 py-4" title="{{ $pet->created_at->format('M d, Y h:i A') }} ({{ $pet->created_at->diffForHumans() }})">
                        <div class="flex flex-col">
                            <span class="text-sm font-medium text-gray-900">{{ $pet->created_at->format('M d, Y') }}</span>
                            <span class="text-xs text-gray-500">{{ $pet->created_at->format('h:i A') }}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <span class="px-3 py-1 rounded-full text-xs font-medium
                            @if($pet->status === 'active') bg-green-100 text-green-700
                            @elseif($pet->status === 'disabled') bg-gray-100 text-gray-700
                            @elseif($pet->status === 'cooldown') bg-blue-100 text-blue-700
                            @elseif($pet->status === 'banned') bg-red-200 text-red-800
                            @else bg-gray-100 text-gray-500
                            @endif">
                            {{ ucfirst(str_replace('_', ' ', $pet->status ?? 'Unknown')) }}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <div class="relative inline-block">
                            <button onclick="toggleDropdown(event, 'dropdown-{{ $pet->pet_id }}')" class="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors p-1 rounded-md">
                                <i data-lucide="more-horizontal" class="w-5 h-5"></i>
                            </button>
                            <div id="dropdown-{{ $pet->pet_id }}" class="hidden fixed w-48 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden text-left" style="z-index: 9999;">
                                <a href="{{ route('admin.pets.details', $pet->pet_id) }}" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                    <i data-lucide="user" class="w-4 h-4 text-gray-500"></i>
                                    View Profile
                                </a>
                                <button onclick="openSuspendModal({{ $pet->pet_id }}, '{{ $pet->name }}')" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left">
                                    <i data-lucide="pause-circle" class="w-4 h-4 text-gray-500"></i>
                                    Suspend
                                </button>
                                <div class="border-t border-gray-100 my-1"></div>
                                <button onclick="confirmDelete('{{ $pet->name }}', {{ $pet->pet_id }})" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                                    <i data-lucide="triangle-alert" class="w-4 h-4"></i>
                                    Delete Pet
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="9" class="px-6 py-12 text-center text-gray-500">
                        <div class="flex flex-col items-center gap-3">
                            <i data-lucide="paw-print" class="w-12 h-12 text-gray-300"></i>
                            <p>No pets found</p>
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
    {{ $pets->links() }}
</div>

<!-- Hidden Forms for Pet Actions -->
<form id="pet-status-form" method="POST" class="hidden">
    @csrf
    <input type="hidden" name="status" value="">
</form>
<form id="pet-delete-form" method="POST" class="hidden">
    @csrf
    @method('DELETE')
</form>

@push('scripts')
<script>
    function closeAllDropdowns() {
        document.querySelectorAll('[id^="dropdown-"]').forEach(d => d.classList.add('hidden'));
    }

    function toggleDropdown(event, dropdownId) {
        event.stopPropagation();
        const dropdown = document.getElementById(dropdownId);
        const button = event.currentTarget;
        const wasHidden = dropdown.classList.contains('hidden');

        closeAllDropdowns();

        if (wasHidden) {
            const rect = button.getBoundingClientRect();
            const dropdownWidth = 192; // w-48 = 12rem = 192px
            const dropdownHeight = dropdown.scrollHeight || 160;

            let top = rect.bottom + 4;
            let left = rect.right - dropdownWidth;

            if (top + dropdownHeight > window.innerHeight) {
                top = rect.top - dropdownHeight - 4;
            }
            if (left < 8) {
                left = 8;
            }

            dropdown.style.top = top + 'px';
            dropdown.style.left = left + 'px';
            dropdown.classList.remove('hidden');
        }
    }

    function openSuspendModal(petId, petName) {
        const modal = document.getElementById('suspendModal');
        const nameEl = document.getElementById('suspendPetName');
        const form = document.getElementById('suspendForm');
        
        nameEl.textContent = petName;
        form.action = `/admin/pets/${petId}/status`;
        
        modal.classList.remove('hidden');
    }

    function closeSuspendModal() {
        document.getElementById('suspendModal').classList.add('hidden');
        document.getElementById('suspendForm').reset();
    }

    function confirmDelete(petName, petId) {
        Swal.fire({
            title: 'Delete Pet?',
            html: `Are you sure you want to delete <strong>${petName}</strong>?<br><small class="text-gray-600">This action cannot be undone.</small>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                const form = document.getElementById('pet-delete-form');
                form.action = `/admin/pets/${petId}`;
                form.submit();
            }
        });
    }

    document.addEventListener('click', closeAllDropdowns);
    window.addEventListener('scroll', closeAllDropdowns, true);
    window.addEventListener('resize', closeAllDropdowns);

    document.addEventListener('DOMContentLoaded', function() {
        lucide.createIcons();
    });
</script>
@endpush
@endsection