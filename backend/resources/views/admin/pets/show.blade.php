@extends('admin.layouts.app')

@section('title', 'Pet Profile - KHAT Admin')

@section('content')
<div class="mb-6">
    <div class="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <a href="{{ route('admin.pets.index') }}" class="hover:text-[#E75234] transition">
            <i data-lucide="arrow-left" class="w-4 h-4 inline"></i> Pet Management
        </a>
        <span>/</span>
        <span>Pet Profile</span>
        <span>/</span>
        <span class="text-gray-900 font-medium">{{ $pet->name }}</span>
    </div>

    <div class="flex justify-between items-start">
        <h1 class="text-3xl font-bold text-gray-900">Pet Profile: {{ $pet->name }}</h1>
        <div class="flex gap-3">
            <button onclick="openStatusModal()" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                <i data-lucide="settings" class="w-4 h-4 inline mr-1"></i>
                Change Status
            </button>
            <button onclick="confirmDeletePet()" class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition">
                <i data-lucide="trash-2" class="w-4 h-4 inline mr-1"></i>
                Delete Pet
            </button>
        </div>
    </div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <!-- Pet Info Overview -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Pet Info Overview</h2>

        <div class="grid grid-cols-2 gap-6">
            <!-- Pet ID -->
            <div class="flex items-start gap-3">
                <div class="p-2 bg-gray-100 rounded-lg">
                    <i data-lucide="hash" class="w-5 h-5 text-gray-600"></i>
                </div>
                <div>
                    <p class="text-xs text-gray-500 mb-1">Pet ID</p>
                    <p class="text-sm font-semibold text-gray-900">PET-{{ str_pad($pet->pet_id, 5, '0', STR_PAD_LEFT) }}</p>
                </div>
            </div>

            <!-- Name -->
            <div class="flex items-start gap-3">
                <div class="p-2 bg-gray-100 rounded-lg">
                    <i data-lucide="tag" class="w-5 h-5 text-gray-600"></i>
                </div>
                <div>
                    <p class="text-xs text-gray-500 mb-1">Name</p>
                    <p class="text-sm font-semibold text-gray-900">{{ $pet->name }}</p>
                </div>
            </div>

            <!-- Type -->
            <div class="flex items-start gap-3">
                <div class="p-2 bg-gray-100 rounded-lg">
                    <i data-lucide="paw-print" class="w-5 h-5 text-gray-600"></i>
                </div>
                <div>
                    <p class="text-xs text-gray-500 mb-1">Type</p>
                    <p class="text-sm font-semibold text-gray-900 capitalize">{{ $pet->species }}</p>
                </div>
            </div>

            <!-- Breed -->
            <div class="flex items-start gap-3">
                <div class="p-2 bg-gray-100 rounded-lg">
                    <i data-lucide="bone" class="w-5 h-5 text-gray-600"></i>
                </div>
                <div>
                    <p class="text-xs text-gray-500 mb-1">Breed</p>
                    <p class="text-sm font-semibold text-gray-900">{{ $pet->breed }}</p>
                </div>
            </div>

            <!-- Sex -->
            <div class="flex items-start gap-3">
                <div class="p-2 bg-gray-100 rounded-lg">
                    <i data-lucide="info" class="w-5 h-5 text-gray-600"></i>
                </div>
                <div>
                    <p class="text-xs text-gray-500 mb-1">Sex</p>
                    <p class="text-sm font-semibold text-gray-900 capitalize">{{ $pet->sex }}</p>
                </div>
            </div>

            <!-- Owner -->
            <div class="flex items-start gap-3">
                <div class="p-2 bg-gray-100 rounded-lg">
                    <i data-lucide="user" class="w-5 h-5 text-gray-600"></i>
                </div>
                <div>
                    <p class="text-xs text-gray-500 mb-1">Owner</p>
                    <p class="text-sm font-semibold text-gray-900">{{ $pet->owner->name ?? 'Unknown' }}</p>
                </div>
            </div>

            <!-- Age -->
            <div class="flex items-start gap-3">
                <div class="p-2 bg-gray-100 rounded-lg">
                    <i data-lucide="calendar" class="w-5 h-5 text-gray-600"></i>
                </div>
                <div>
                    <p class="text-xs text-gray-500 mb-1">Age</p>
                    <p class="text-sm font-semibold text-gray-900">
                        @if($pet->birthdate)
                        @php
                        $diff = \Carbon\Carbon::parse($pet->birthdate)->diff(\Carbon\Carbon::now());
                        $years = $diff->y;
                        $months = $diff->m;
                        @endphp
                        {{ $years }} years, {{ $months }} months
                        @else
                        N/A
                        @endif
                    </p>
                </div>
            </div>

            <!-- Date Registered -->
            <div class="flex items-start gap-3">
                <div class="p-2 bg-gray-100 rounded-lg">
                    <i data-lucide="calendar-check" class="w-5 h-5 text-gray-600"></i>
                </div>
                <div>
                    <p class="text-xs text-gray-500 mb-1">Date Registered</p>
                    <p class="text-sm font-semibold text-gray-900">{{ $pet->created_at->format('Y-m-d') }}</p>
                </div>
            </div>

            <!-- Status -->
            <div class="flex items-start gap-3">
                <div class="p-2 bg-gray-100 rounded-lg">
                    <i data-lucide="activity" class="w-5 h-5 text-gray-600"></i>
                </div>
                <div>
                    <p class="text-xs text-gray-500 mb-1">Status</p>
                    <span class="inline-block px-3 py-1 rounded-full text-xs font-medium
                        @if($pet->status === 'active') bg-green-100 text-green-700
                        @elseif($pet->status === 'disabled') bg-gray-100 text-gray-700
                        @elseif($pet->status === 'cooldown') bg-blue-100 text-blue-700
                        @elseif($pet->status === 'banned') bg-red-200 text-red-800
                        @else bg-gray-100 text-gray-500
                        @endif">
                        {{ ucfirst($pet->status ?? 'Unknown') }}
                    </span>
                </div>
            </div>

            <!-- Verification Status -->
            <div class="flex items-start gap-3">
                <div class="p-2 bg-gray-100 rounded-lg">
                    <i data-lucide="shield-check" class="w-5 h-5 text-gray-600"></i>
                </div>
                <div>
                    <p class="text-xs text-gray-500 mb-1">Verification Status</p>
                    @php
                    $userAuthRecord = $pet->owner->userAuth->first();
                    $verificationStatus = $userAuthRecord->status ?? 'unknown';
                    @endphp
                    <span class="inline-block px-3 py-1 rounded-full text-xs font-medium
                        @if($verificationStatus === 'approved') bg-green-100 text-green-700
                        @elseif($verificationStatus === 'pending') bg-yellow-100 text-yellow-700
                        @elseif($verificationStatus === 'rejected') bg-red-100 text-red-700
                        @else bg-gray-100 text-gray-500
                        @endif">
                        @if($verificationStatus === 'approved')
                        Verified
                        @else
                        {{ ucfirst($verificationStatus) }}
                        @endif
                    </span>
                </div>
            </div>
        </div>
    </div>

    <!-- Litter & Offspring Stats -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Litter & Offspring Stats</h2>

        <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="text-center p-4 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500 mb-2">Litter Count</p>
                <p class="text-3xl font-bold text-gray-900">{{ $pet->sex === 'male' ? $pet->littersAsSire->count() : $pet->littersAsDam->count() }}</p>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500 mb-2">Total Offspring Sired</p>
                <p class="text-3xl font-bold text-gray-900">
                    @php
                    $totalOffspring = 0;
                    if ($pet->sex === 'male') {
                    foreach ($pet->littersAsSire as $litter) {
                    $totalOffspring += $litter->offspring->count();
                    }
                    } else {
                    foreach ($pet->littersAsDam as $litter) {
                    $totalOffspring += $litter->offspring->count();
                    }
                    }
                    @endphp
                    {{ $totalOffspring }}
                </p>
            </div>
            <div class="text-center p-4 bg-gray-50 rounded-lg">
                <p class="text-xs text-gray-500 mb-2">Last Litter Size</p>
                <p class="text-3xl font-bold text-gray-900">
                    @php
                    $lastLitter = $pet->sex === 'male' ? $pet->littersAsSire->last() : $pet->littersAsDam->last();
                    @endphp
                    {{ $lastLitter ? $lastLitter->offspring->count() : 0 }}
                </p>
            </div>
        </div>

        <!-- Offspring Breed Sired Chart -->
        <div>
            <p class="text-sm font-semibold text-gray-700 mb-3">Offspring Breed Sired</p>
            <div class="space-y-3">
                @php
                $breedCounts = [];
                $litters = $pet->sex === 'male' ? $pet->littersAsSire : $pet->littersAsDam;
                foreach ($litters as $litter) {
                foreach ($litter->offspring as $offspring) {
                if ($offspring->pet) {
                $breed = $offspring->pet->breed ?? 'Unknown';
                if (!isset($breedCounts[$breed])) {
                $breedCounts[$breed] = 0;
                }
                $breedCounts[$breed]++;
                }
                }
                }
                $maxCount = max(array_merge($breedCounts, [1]));
                @endphp

                @forelse($breedCounts as $breed => $count)
                <div>
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-xs text-gray-600">Litter {{ $loop->iteration }}</span>
                        <span class="text-xs font-semibold text-gray-900">{{ $count }}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-8">
                        <div class="bg-[#E75234] h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                            style="width: {{ ($count / $maxCount) * 100 }}%">
                            {{ $count > 0 ? $count : '' }}
                        </div>
                    </div>
                </div>
                @empty
                <p class="text-sm text-gray-500 text-center py-4">No offspring data available</p>
                @endforelse
            </div>
        </div>
    </div>
</div>

<!-- Match History -->
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <h2 class="text-xl font-bold text-gray-900 mb-6">Match History</h2>

    <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
            <thead>
                <tr class="bg-[#E75234] text-white text-sm">
                    <th class="px-6 py-3 font-medium rounded-tl-lg">Match ID</th>
                    <th class="px-6 py-3 font-medium">Partner</th>
                    <th class="px-6 py-3 font-medium">Status</th>
                    <th class="px-6 py-3 font-medium">Date</th>
                    <th class="px-6 py-3 font-medium">Offspring Count</th>
                    <th class="px-6 py-3 font-medium rounded-tr-lg">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 text-sm text-gray-700">
                @forelse($litters as $litter)
                @php
                // Get partner based on pet's sex
                $partner = $pet->sex === 'male' ? $litter->dam : $litter->sire;
                $offspringCount = $litter->offspring->count();

                // Determine status based on litter data
                if ($litter->status === 'active' && $offspringCount > 0) {
                $status = 'Successful';
                $statusClass = 'bg-green-100 text-green-700';
                } elseif ($litter->status === 'active' && $offspringCount === 0) {
                $status = 'Ongoing';
                $statusClass = 'bg-blue-100 text-blue-700';
                } else {
                $status = ucfirst($litter->status);
                $statusClass = 'bg-gray-100 text-gray-500';
                }
                @endphp
                <tr class="hover:bg-orange-50 transition-colors {{ $loop->even ? 'bg-gray-50/30' : '' }}">
                    <td class="px-6 py-4 font-mono text-xs text-gray-500">MTC-{{ str_pad($litter->litter_id, 5, '0', STR_PAD_LEFT) }}</td>
                    <td class="px-6 py-4">
                        <span class="font-medium">{{ $partner->name ?? 'Unknown' }}</span>
                        <span class="text-gray-500 text-xs">(ID: PET-{{ str_pad($partner->pet_id ?? 0, 5, '0', STR_PAD_LEFT) }})</span>
                    </td>
                    <td class="px-6 py-4">
                        <span class="px-3 py-1 rounded-full text-xs font-medium {{ $statusClass }}">
                            {{ $status }}
                        </span>
                    </td>
                    <td class="px-6 py-4">{{ $litter->birth_date ? $litter->birth_date->format('m/d/Y') : 'N/A' }}</td>
                    <td class="px-6 py-4 text-center">{{ $offspringCount > 0 ? $offspringCount : 'N/A' }}</td>
                    <td class="px-6 py-4">
                        <a href="{{ route('admin.litters.details', $litter->litter_id) }}" class="px-4 py-2 bg-[#E75234] text-white text-xs font-medium rounded-lg hover:bg-[#d14024] transition inline-block">
                            View Details
                        </a>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                        <div class="flex flex-col items-center gap-3">
                            <i data-lucide="heart" class="w-12 h-12 text-gray-300"></i>
                            <p>No match history found</p>
                        </div>
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<!-- Status Change Modal -->
<div id="statusModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Change Pet Status</h3>
        <form action="{{ route('admin.pets.status.update', $pet->pet_id) }}" method="POST">
            @csrf
            <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Select New Status</label>
                <select name="status" class="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent">
                    <option value="active" {{ $pet->status === 'active' ? 'selected' : '' }}>Active</option>
                    <option value="disabled" {{ $pet->status === 'disabled' ? 'selected' : '' }}>Disabled</option>
                    <option value="cooldown" {{ $pet->status === 'cooldown' ? 'selected' : '' }}>Cooldown</option>
                    <option value="banned" {{ $pet->status === 'banned' ? 'selected' : '' }}>Banned</option>
                </select>
            </div>
            <div class="flex gap-3">
                <button type="submit" class="flex-1 px-4 py-2.5 bg-[#E75234] text-white text-sm font-medium rounded-lg hover:bg-[#d14024] transition">
                    Update Status
                </button>
                <button type="button" onclick="closeStatusModal()" class="flex-1 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition">
                    Cancel
                </button>
            </div>
        </form>
    </div>
</div>

<!-- Delete Confirmation Form -->
<form id="deletePetForm" action="{{ route('admin.pets.delete', $pet->pet_id) }}" method="POST" style="display: none;">
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

    function confirmDeletePet() {
        if (confirm('Are you sure you want to delete {{ $pet->name }}? This action cannot be undone and will permanently remove all associated data.')) {
            document.getElementById('deletePetForm').submit();
        }
    }

    // Close modal when clicking outside
    document.getElementById('statusModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeStatusModal();
        }
    });

    document.addEventListener('DOMContentLoaded', function() {
        lucide.createIcons();
    });
</script>
@endpush
@endsection