@extends('admin.layouts.app')

@section('title', 'Pet Profile - KHAT Admin')

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

<!-- Error Message -->
@if(session('error'))
<div class="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
    <span class="block sm:inline">{{ session('error') }}</span>
    <button type="button" class="absolute top-0 bottom-0 right-0 px-4 py-3" onclick="this.parentElement.style.display='none';">
        <i data-lucide="x" class="w-4 h-4"></i>
    </button>
</div>
@endif

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
            <button onclick="openDocumentTrackerModal()" class="px-4 py-2 bg-[#E75234] text-white text-sm font-medium rounded-lg hover:bg-[#d14024] transition">
                <i data-lucide="file-text" class="w-4 h-4 inline mr-1"></i>
                Document Tracker
            </button>
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

<!-- Document Tracker Modal -->
<div id="documentTrackerModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 class="text-xl font-bold text-gray-900">User Verification Details: <span>{{ $pet->owner->name ?? 'Unknown' }}</span></h2>
            <button onclick="closeDocumentTrackerModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>
        </div>

        <!-- Modal Content -->
        <div class="flex-1 overflow-y-auto">
            <!-- Tabs -->
            <div class="border-b border-gray-200 bg-white sticky top-0 z-10">
                <div class="flex">
                    <button onclick="switchDocTab('documents')" id="tab-documents" class="px-6 py-3 text-sm font-semibold text-white bg-[#E75234] border-b-2 border-[#E75234] transition-colors">
                        Documents
                    </button>
                    <button onclick="switchDocTab('submission-history')" id="tab-submission-history" class="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent transition-colors">
                        Submission History
                    </button>
                    <button onclick="switchDocTab('expiry-tracker')" id="tab-expiry-tracker" class="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent transition-colors">
                        Expiry Tracker
                    </button>
                </div>
            </div>

            <!-- Tab Content -->
            <div class="p-6">
                <!-- Documents Tab -->
                <div id="content-documents" class="tab-content">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Uploaded Documents</h3>

                    <div class="space-y-4">
                        @php
                        $allVaccinations = $pet->vaccinations;
                        $rabiesVaccination = $allVaccinations->where('vaccine_name', 'Rabies')->first();
                        $dhppVaccination = $allVaccinations->where('vaccine_name', 'DHPP')->first();
                        $additionalVaccinations = $allVaccinations->whereNotIn('vaccine_name', ['Rabies', 'DHPP']);
                        $healthRecord = $pet->healthRecords->first();
                        @endphp

                        <!-- Rabies Vaccination -->
                        @if($rabiesVaccination)
                        <div class="bg-white border border-gray-200 rounded-lg p-4">
                            <div class="flex items-start justify-between">
                                <div class="flex items-start gap-3">
                                    <div class="p-2 bg-green-100 rounded-lg">
                                        <i data-lucide="syringe" class="w-5 h-5 text-green-600"></i>
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2 mb-1">
                                            <h4 class="font-semibold text-gray-900">Rabies Vaccination</h4>
                                            @php
                                            $daysRemaining = \Carbon\Carbon::now()->diffInDays(\Carbon\Carbon::parse($rabiesVaccination->expiration_date), false);
                                            @endphp
                                            <span class="px-2 py-0.5 {{ $daysRemaining > 30 ? 'bg-green-100 text-green-700' : ($daysRemaining > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700') }} text-xs font-medium rounded-full">
                                                {{ $daysRemaining > 0 ? 'Active' : 'Expired' }}
                                            </span>
                                        </div>
                                        <p class="text-sm text-gray-600 mb-2">Document Details:</p>
                                        <div class="text-xs text-gray-500 space-y-1">
                                            <p><span class="font-medium">Clinic:</span> {{ $rabiesVaccination->clinic_name }}</p>
                                            <p><span class="font-medium">Veterinarian:</span> {{ $rabiesVaccination->veterinarian_name }}</p>
                                            <p><span class="font-medium">Given Date:</span> {{ \Carbon\Carbon::parse($rabiesVaccination->given_date)->format('d M Y') }}</p>
                                            <p><span class="font-medium">Expiry:</span> {{ \Carbon\Carbon::parse($rabiesVaccination->expiration_date)->format('d M Y') }}</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <button onclick="viewDocument('{{ asset('storage/' . $rabiesVaccination->vaccination_record) }}')" class="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition">
                                        View
                                    </button>
                                    @if($rabiesVaccination->status === 'pending')
                                    <button onclick="approveDocument('vaccination', {{ $rabiesVaccination->vaccination_id }}, 'Rabies Vaccination')" class="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition">
                                        Accept
                                    </button>
                                    <button onclick="rejectDocument('vaccination', {{ $rabiesVaccination->vaccination_id }}, 'Rabies Vaccination')" class="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition">
                                        Reject
                                    </button>
                                    @elseif($rabiesVaccination->status === 'approved')
                                    <span class="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                                        ✓ Approved
                                    </span>
                                    @elseif($rabiesVaccination->status === 'rejected')
                                    <span class="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                        ✗ Rejected
                                    </span>
                                    @endif
                                </div>
                            </div>
                        </div>
                        @endif

                        <!-- DHPP Vaccination -->
                        @if($dhppVaccination)
                        <div class="bg-white border border-gray-200 rounded-lg p-4">
                            <div class="flex items-start justify-between">
                                <div class="flex items-start gap-3">
                                    <div class="p-2 bg-green-100 rounded-lg">
                                        <i data-lucide="syringe" class="w-5 h-5 text-green-600"></i>
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2 mb-1">
                                            <h4 class="font-semibold text-gray-900">DHPP Vaccination</h4>
                                            @php
                                            $daysRemaining = \Carbon\Carbon::now()->diffInDays(\Carbon\Carbon::parse($dhppVaccination->expiration_date), false);
                                            @endphp
                                            <span class="px-2 py-0.5 {{ $daysRemaining > 30 ? 'bg-green-100 text-green-700' : ($daysRemaining > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700') }} text-xs font-medium rounded-full">
                                                {{ $daysRemaining > 0 ? 'Active' : 'Expired' }}
                                            </span>
                                        </div>
                                        <p class="text-sm text-gray-600 mb-2">Document Details:</p>
                                        <div class="text-xs text-gray-500 space-y-1">
                                            <p><span class="font-medium">Clinic:</span> {{ $dhppVaccination->clinic_name }}</p>
                                            <p><span class="font-medium">Veterinarian:</span> {{ $dhppVaccination->veterinarian_name }}</p>
                                            <p><span class="font-medium">Given Date:</span> {{ \Carbon\Carbon::parse($dhppVaccination->given_date)->format('d M Y') }}</p>
                                            <p><span class="font-medium">Expiry:</span> {{ \Carbon\Carbon::parse($dhppVaccination->expiration_date)->format('d M Y') }}</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <button onclick="viewDocument('{{ asset('storage/' . $dhppVaccination->vaccination_record) }}')" class="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition">
                                        View
                                    </button>
                                    @if($dhppVaccination->status === 'pending')
                                    <button onclick="approveDocument('vaccination', {{ $dhppVaccination->vaccination_id }}, 'DHPP Vaccination')" class="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition">
                                        Accept
                                    </button>
                                    <button onclick="rejectDocument('vaccination', {{ $dhppVaccination->vaccination_id }}, 'DHPP Vaccination')" class="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition">
                                        Reject
                                    </button>
                                    @elseif($dhppVaccination->status === 'approved')
                                    <span class="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                                        ✓ Approved
                                    </span>
                                    @elseif($dhppVaccination->status === 'rejected')
                                    <span class="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                        ✗ Rejected
                                    </span>
                                    @endif
                                </div>
                            </div>
                        </div>
                        @endif

                        <!-- Additional Vaccinations -->
                        @foreach($additionalVaccinations as $vaccination)
                        <div class="bg-white border border-gray-200 rounded-lg p-4">
                            <div class="flex items-start justify-between">
                                <div class="flex items-start gap-3">
                                    <div class="p-2 bg-blue-100 rounded-lg">
                                        <i data-lucide="syringe" class="w-5 h-5 text-blue-600"></i>
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2 mb-1">
                                            <h4 class="font-semibold text-gray-900">{{ $vaccination->vaccine_name }} Vaccination</h4>
                                            @php
                                            $daysRemaining = \Carbon\Carbon::now()->diffInDays(\Carbon\Carbon::parse($vaccination->expiration_date), false);
                                            @endphp
                                            <span class="px-2 py-0.5 {{ $daysRemaining > 30 ? 'bg-green-100 text-green-700' : ($daysRemaining > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700') }} text-xs font-medium rounded-full">
                                                {{ $daysRemaining > 0 ? 'Active' : 'Expired' }}
                                            </span>
                                        </div>
                                        <p class="text-sm text-gray-600 mb-2">Document Details:</p>
                                        <div class="text-xs text-gray-500 space-y-1">
                                            <p><span class="font-medium">Clinic:</span> {{ $vaccination->clinic_name }}</p>
                                            <p><span class="font-medium">Veterinarian:</span> {{ $vaccination->veterinarian_name }}</p>
                                            <p><span class="font-medium">Given Date:</span> {{ \Carbon\Carbon::parse($vaccination->given_date)->format('d M Y') }}</p>
                                            <p><span class="font-medium">Expiry:</span> {{ \Carbon\Carbon::parse($vaccination->expiration_date)->format('d M Y') }}</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <button onclick="viewDocument('{{ asset('storage/' . $vaccination->vaccination_record) }}')" class="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition">
                                        View
                                    </button>
                                    @if($vaccination->status === 'pending')
                                    <button onclick="approveDocument('vaccination', {{ $vaccination->vaccination_id }}, '{{ $vaccination->vaccine_name }} Vaccination')" class="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition">
                                        Accept
                                    </button>
                                    <button onclick="rejectDocument('vaccination', {{ $vaccination->vaccination_id }}, '{{ $vaccination->vaccine_name }} Vaccination')" class="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition">
                                        Reject
                                    </button>
                                    @elseif($vaccination->status === 'approved')
                                    <span class="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                                        ✓ Approved
                                    </span>
                                    @elseif($vaccination->status === 'rejected')
                                    <span class="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                        ✗ Rejected
                                    </span>
                                    @endif
                                </div>
                            </div>
                        </div>
                        @endforeach

                        <!-- Health Certificate -->
                        @if($healthRecord)
                        <div class="bg-white border border-gray-200 rounded-lg p-4">
                            <div class="flex items-start justify-between">
                                <div class="flex items-start gap-3">
                                    <div class="p-2 bg-green-100 rounded-lg">
                                        <i data-lucide="file-heart" class="w-5 h-5 text-green-600"></i>
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2 mb-1">
                                            <h4 class="font-semibold text-gray-900">Health Certificate</h4>
                                            @php
                                            $daysRemaining = \Carbon\Carbon::now()->diffInDays(\Carbon\Carbon::parse($healthRecord->expiration_date), false);
                                            @endphp
                                            <span class="px-2 py-0.5 {{ $daysRemaining > 30 ? 'bg-green-100 text-green-700' : ($daysRemaining > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700') }} text-xs font-medium rounded-full">
                                                {{ $daysRemaining > 0 ? 'Active' : 'Expired' }}
                                            </span>
                                        </div>
                                        <p class="text-sm text-gray-600 mb-2">Document Details:</p>
                                        <div class="text-xs text-gray-500 space-y-1">
                                            <p><span class="font-medium">Clinic:</span> {{ $healthRecord->clinic_name }}</p>
                                            <p><span class="font-medium">Veterinarian:</span> {{ $healthRecord->veterinarian_name }}</p>
                                            <p><span class="font-medium">Given Date:</span> {{ \Carbon\Carbon::parse($healthRecord->given_date)->format('d M Y') }}</p>
                                            <p><span class="font-medium">Expiry:</span> {{ \Carbon\Carbon::parse($healthRecord->expiration_date)->format('d M Y') }}</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <button onclick="viewDocument('{{ asset('storage/' . $healthRecord->record_path) }}')" class="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition">
                                        View
                                    </button>
                                    @if($healthRecord->status === 'pending')
                                    <button onclick="approveDocument('health', {{ $healthRecord->health_record_id }}, 'Health Certificate')" class="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition">
                                        Accept
                                    </button>
                                    <button onclick="rejectDocument('health', {{ $healthRecord->health_record_id }}, 'Health Certificate')" class="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition">
                                        Reject
                                    </button>
                                    @elseif($healthRecord->status === 'approved')
                                    <span class="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                                        ✓ Approved
                                    </span>
                                    @elseif($healthRecord->status === 'rejected')
                                    <span class="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                        ✗ Rejected
                                    </span>
                                    @endif
                                </div>
                            </div>
                        </div>
                        @endif
                    </div>
                </div>

                <!-- Submission History Tab -->
                <div id="content-submission-history" class="tab-content hidden">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Verification Activities</h3>

                    <div class="space-y-3">
                        @php
                        $activities = collect();

                        // Collect all vaccination activities
                        foreach($allVaccinations as $vaccination) {
                        if ($vaccination->status === 'approved') {
                        $activities->push([
                        'date' => $vaccination->updated_at,
                        'type' => 'approved',
                        'message' => $vaccination->vaccine_name . ' Vaccination approved'
                        ]);
                        } elseif ($vaccination->status === 'rejected') {
                        $activities->push([
                        'date' => $vaccination->updated_at,
                        'type' => 'rejected',
                        'message' => $vaccination->vaccine_name . ' Vaccination rejected' . ($vaccination->rejection_reason ? ': ' . $vaccination->rejection_reason : '')
                        ]);
                        } elseif ($vaccination->status === 'pending') {
                        $activities->push([
                        'date' => $vaccination->created_at,
                        'type' => 'pending',
                        'message' => $vaccination->vaccine_name . ' Vaccination awaiting review'
                        ]);
                        }
                        }

                        // Collect health record activities
                        if ($healthRecord) {
                        if ($healthRecord->status === 'approved') {
                        $activities->push([
                        'date' => $healthRecord->updated_at,
                        'type' => 'approved',
                        'message' => 'Health Certificate approved'
                        ]);
                        } elseif ($healthRecord->status === 'rejected') {
                        $activities->push([
                        'date' => $healthRecord->updated_at,
                        'type' => 'rejected',
                        'message' => 'Health Certificate rejected' . ($healthRecord->rejection_reason ? ': ' . $healthRecord->rejection_reason : '')
                        ]);
                        } elseif ($healthRecord->status === 'pending') {
                        $activities->push([
                        'date' => $healthRecord->created_at,
                        'type' => 'pending',
                        'message' => 'Health Certificate awaiting review'
                        ]);
                        }
                        }

                        // Sort activities by date (newest first)
                        $activities = $activities->sortByDesc('date');
                        @endphp

                        @forelse($activities as $activity)
                        <div class="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                            <div class="p-2 {{ $activity['type'] === 'approved' ? 'bg-green-100' : ($activity['type'] === 'rejected' ? 'bg-red-100' : 'bg-yellow-100') }} rounded-full">
                                <i data-lucide="{{ $activity['type'] === 'approved' ? 'check-circle' : ($activity['type'] === 'rejected' ? 'x-circle' : 'clock') }}" class="w-4 h-4 {{ $activity['type'] === 'approved' ? 'text-green-600' : ($activity['type'] === 'rejected' ? 'text-red-600' : 'text-yellow-600') }}"></i>
                            </div>
                            <div class="flex-1">
                                <div class="flex items-center justify-between mb-1">
                                    <p class="text-sm font-semibold text-gray-900">{{ \Carbon\Carbon::parse($activity['date'])->format('d M') }}</p>
                                    <p class="text-xs text-gray-500">{{ $activity['type'] === 'approved' ? 'Document Approved' : ($activity['type'] === 'rejected' ? 'Document Rejected' : 'Awaiting Verification') }}</p>
                                </div>
                                <p class="text-xs text-gray-600">{{ $activity['message'] }}</p>
                            </div>
                        </div>
                        @empty
                        <div class="text-center py-8 text-gray-500">
                            <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                            <p class="text-sm">No verification activities yet</p>
                        </div>
                        @endforelse
                    </div>
                </div>

                <!-- Expiry Tracker Tab -->
                <div id="content-expiry-tracker" class="tab-content hidden">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">Document Validity Overview</h3>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-[#E75234] text-white text-xs">
                                    <th class="px-4 py-3 font-semibold rounded-tl-lg">Document</th>
                                    <th class="px-4 py-3 font-semibold">Expiry Date</th>
                                    <th class="px-4 py-3 font-semibold">Days Remaining</th>
                                    <th class="px-4 py-3 font-semibold">Status</th>
                                    <th class="px-4 py-3 font-semibold rounded-tr-lg">Action</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 text-xs">
                                @if($rabiesVaccination)
                                @php
                                $expiryDate = \Carbon\Carbon::parse($rabiesVaccination->expiration_date);
                                $daysRemaining = \Carbon\Carbon::now()->diffInDays($expiryDate, false);
                                @endphp
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-3 font-medium">Rabies Vaccination</td>
                                    <td class="px-4 py-3">{{ $expiryDate->format('d M Y') }}</td>
                                    <td class="px-4 py-3">{{ $daysRemaining > 0 ? $daysRemaining . ' days' : 'Expired' }}</td>
                                    <td class="px-4 py-3">
                                        <span class="px-2 py-1 {{ $daysRemaining > 30 ? 'bg-green-100 text-green-700' : ($daysRemaining > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700') }} text-xs font-medium rounded-full">
                                            {{ $daysRemaining > 0 ? 'Active' : 'Expired' }}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <button onclick="requestUpdate('Rabies')" class="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition">
                                            Request Update
                                        </button>
                                    </td>
                                </tr>
                                @endif

                                @if($dhppVaccination)
                                @php
                                $expiryDate = \Carbon\Carbon::parse($dhppVaccination->expiration_date);
                                $daysRemaining = \Carbon\Carbon::now()->diffInDays($expiryDate, false);
                                @endphp
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-3 font-medium">DHPP Vaccination</td>
                                    <td class="px-4 py-3">{{ $expiryDate->format('d M Y') }}</td>
                                    <td class="px-4 py-3">{{ $daysRemaining > 0 ? $daysRemaining . ' days' : 'Expired' }}</td>
                                    <td class="px-4 py-3">
                                        <span class="px-2 py-1 {{ $daysRemaining > 30 ? 'bg-green-100 text-green-700' : ($daysRemaining > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700') }} text-xs font-medium rounded-full">
                                            {{ $daysRemaining > 0 ? 'Active' : 'Expired' }}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <button onclick="requestUpdate('DHPP')" class="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition">
                                            Request Update
                                        </button>
                                    </td>
                                </tr>
                                @endif

                                @foreach($additionalVaccinations as $vaccination)
                                @php
                                $expiryDate = \Carbon\Carbon::parse($vaccination->expiration_date);
                                $daysRemaining = \Carbon\Carbon::now()->diffInDays($expiryDate, false);
                                @endphp
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-3 font-medium">{{ $vaccination->vaccine_name }} Vaccination</td>
                                    <td class="px-4 py-3">{{ $expiryDate->format('d M Y') }}</td>
                                    <td class="px-4 py-3">{{ $daysRemaining > 0 ? $daysRemaining . ' days' : 'Expired' }}</td>
                                    <td class="px-4 py-3">
                                        <span class="px-2 py-1 {{ $daysRemaining > 30 ? 'bg-green-100 text-green-700' : ($daysRemaining > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700') }} text-xs font-medium rounded-full">
                                            {{ $daysRemaining > 0 ? 'Active' : 'Expired' }}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <button onclick="requestUpdate('{{ $vaccination->vaccine_name }}')" class="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition">
                                            Request Update
                                        </button>
                                    </td>
                                </tr>
                                @endforeach

                                @if($healthRecord)
                                @php
                                $expiryDate = \Carbon\Carbon::parse($healthRecord->expiration_date);
                                $daysRemaining = \Carbon\Carbon::now()->diffInDays($expiryDate, false);
                                @endphp
                                <tr class="hover:bg-gray-50">
                                    <td class="px-4 py-3 font-medium">Health Certificate</td>
                                    <td class="px-4 py-3">{{ $expiryDate->format('d M Y') }}</td>
                                    <td class="px-4 py-3">{{ $daysRemaining > 0 ? $daysRemaining . ' days' : 'Expired' }}</td>
                                    <td class="px-4 py-3">
                                        <span class="px-2 py-1 {{ $daysRemaining > 30 ? 'bg-green-100 text-green-700' : ($daysRemaining > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700') }} text-xs font-medium rounded-full">
                                            {{ $daysRemaining > 0 ? 'Active' : 'Expired' }}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <button onclick="requestUpdate('Health Certificate')" class="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-50 transition">
                                            Request Update
                                        </button>
                                    </td>
                                </tr>
                                @endif
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
            <button onclick="closeDocumentTrackerModal()" class="px-6 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition">
                Close
            </button>
        </div>
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

<!-- Document Approval Form -->
<form id="approveDocumentForm" method="POST" style="display: none;">
    @csrf
    <input type="hidden" name="status" value="approved">
</form>

<!-- Document Rejection Form -->
<form id="rejectDocumentForm" method="POST" style="display: none;">
    @csrf
    <input type="hidden" name="status" value="rejected">
</form>

@push('scripts')
<script>
    function openDocumentTrackerModal() {
        document.getElementById('documentTrackerModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeDocumentTrackerModal() {
        document.getElementById('documentTrackerModal').classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    function switchDocTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        // Reset all tabs
        document.querySelectorAll('[id^="tab-"]').forEach(tab => {
            tab.classList.remove('text-white', 'bg-[#E75234]', 'border-[#E75234]');
            tab.classList.add('text-gray-600', 'border-transparent');
        });

        // Show selected tab content
        document.getElementById('content-' + tabName).classList.remove('hidden');

        // Highlight selected tab
        const selectedTab = document.getElementById('tab-' + tabName);
        selectedTab.classList.remove('text-gray-600', 'border-transparent');
        selectedTab.classList.add('text-white', 'bg-[#E75234]', 'border-[#E75234]');
    }

    function viewDocument(url) {
        window.open(url, '_blank');
    }

    function requestUpdate(documentType) {
        Swal.fire({
            title: 'Send Update Request?',
            text: `Send a request to the user to update their ${documentType} document?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#E75234',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, send request',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                // TODO: Implement request update functionality
                Swal.fire({
                    title: 'Success!',
                    text: 'Request sent successfully!',
                    icon: 'success',
                    confirmButtonColor: '#E75234'
                });
            }
        });
    }

    function approveDocument(type, id, name) {
        Swal.fire({
            title: 'Approve Document?',
            text: `Are you sure you want to approve the ${name}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10B981',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, approve',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                const form = document.getElementById('approveDocumentForm');
                if (type === 'vaccination') {
                    form.action = `/admin/pets/vaccinations/${id}/status`;
                } else if (type === 'health') {
                    form.action = `/admin/pets/health-records/${id}/status`;
                }
                form.submit();
            }
        });
    }

    function rejectDocument(type, id, name) {
        Swal.fire({
            title: 'Reject Document',
            text: `Please provide a reason for rejecting the ${name}:`,
            input: 'textarea',
            inputPlaceholder: 'Enter rejection reason...',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Reject',
            cancelButtonText: 'Cancel',
            inputValidator: (value) => {
                if (!value || !value.trim()) {
                    return 'Rejection reason is required!';
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const reason = result.value;
                const form = document.getElementById('rejectDocumentForm');
                if (type === 'vaccination') {
                    form.action = `/admin/pets/vaccinations/${id}/status`;
                } else if (type === 'health') {
                    form.action = `/admin/pets/health-records/${id}/status`;
                }

                // Add rejection reason
                let reasonInput = form.querySelector('input[name="rejection_reason"]');
                if (!reasonInput) {
                    reasonInput = document.createElement('input');
                    reasonInput.type = 'hidden';
                    reasonInput.name = 'rejection_reason';
                    form.appendChild(reasonInput);
                }
                reasonInput.value = reason;

                form.submit();
            }
        });
    }

    function openStatusModal() {
        document.getElementById('statusModal').classList.remove('hidden');
    }

    function closeStatusModal() {
        document.getElementById('statusModal').classList.add('hidden');
    }

    function confirmDeletePet() {
        Swal.fire({
            title: 'Delete Pet?',
            html: `Are you sure you want to delete <strong>{{ $pet->name }}</strong>?<br><small class="text-gray-600">This action cannot be undone and will permanently remove all associated data.</small>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                document.getElementById('deletePetForm').submit();
            }
        });
    }

    // Close modals when clicking outside
    document.getElementById('documentTrackerModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeDocumentTrackerModal();
        }
    });

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