@extends('admin.layouts.app')

@section('title', 'Offspring from Match - KHAT Admin')

@section('content')
<div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex justify-between items-start mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Offspring from Match MTC-{{ str_pad($litter->litter_id, 5, '0', STR_PAD_LEFT) }}</h1>
        <button onclick="window.history.back()" class="px-4 py-2 text-gray-600 hover:text-gray-900 transition">
            <i data-lucide="x" class="w-5 h-5"></i>
        </button>
    </div>

    <!-- Parent & Match Information -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 class="text-lg font-bold text-gray-900 mb-4">Parent & Match Information</h2>

        <div class="bg-orange-50 rounded-lg p-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Parent A (Sire) -->
                <div>
                    <div class="flex items-start gap-3 mb-3">
                        <div class="p-2 bg-white rounded-lg">
                            <i data-lucide="dog" class="w-5 h-5 text-[#E75234]"></i>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600 mb-1">Parent A Name</p>
                            <a href="{{ route('admin.pets.details', $litter->sire->pet_id) }}" class="text-sm font-semibold text-[#E75234] hover:underline">
                                {{ $litter->sire->name }} (PET-{{ str_pad($litter->sire->pet_id, 5, '0', STR_PAD_LEFT) }})
                            </a>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <div class="p-2 bg-white rounded-lg">
                            <i data-lucide="bone" class="w-5 h-5 text-[#E75234]"></i>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600 mb-1">Parent A Type & Breed</p>
                            <p class="text-sm font-semibold text-gray-900">{{ ucfirst($litter->sire->species) }}, {{ $litter->sire->breed }}</p>
                        </div>
                    </div>
                </div>

                <!-- Parent B (Dam) -->
                <div>
                    <div class="flex items-start gap-3 mb-3">
                        <div class="p-2 bg-white rounded-lg">
                            <i data-lucide="dog" class="w-5 h-5 text-[#E75234]"></i>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600 mb-1">Parent B Name</p>
                            <a href="{{ route('admin.pets.details', $litter->dam->pet_id) }}" class="text-sm font-semibold text-[#E75234] hover:underline">
                                {{ $litter->dam->name }} (PET-{{ str_pad($litter->dam->pet_id, 5, '0', STR_PAD_LEFT) }})
                            </a>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <div class="p-2 bg-white rounded-lg">
                            <i data-lucide="bone" class="w-5 h-5 text-[#E75234]"></i>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600 mb-1">Parent B Type & Breed</p>
                            <p class="text-sm font-semibold text-gray-900">{{ ucfirst($litter->dam->species) }}, {{ $litter->dam->breed }}</p>
                        </div>
                    </div>
                </div>

                <!-- Match Info -->
                <div>
                    <div class="flex items-start gap-3 mb-3">
                        <div class="p-2 bg-white rounded-lg">
                            <i data-lucide="calendar" class="w-5 h-5 text-[#E75234]"></i>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600 mb-1">Match Date</p>
                            <p class="text-sm font-semibold text-gray-900">{{ $litter->birth_date->format('Y-m-d') }}</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-3">
                        <div class="p-2 bg-white rounded-lg">
                            <i data-lucide="heart" class="w-5 h-5 text-[#E75234]"></i>
                        </div>
                        <div>
                            <p class="text-xs text-gray-600 mb-1">Match Status</p>
                            @php
                            $offspringCount = $litter->offspring->count();
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
                            <span class="inline-block px-3 py-1 rounded-full text-xs font-medium {{ $statusClass }}">
                                {{ $status }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Offspring List -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 class="text-lg font-bold text-gray-900 mb-4">Offspring List</h2>

        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-[#E75234] text-white text-sm">
                        <th class="px-6 py-3 font-medium rounded-tl-lg">Offspring ID</th>
                        <th class="px-6 py-3 font-medium">Name</th>
                        <th class="px-6 py-3 font-medium">Sex</th>
                        <th class="px-6 py-3 font-medium">Status</th>
                        <th class="px-6 py-3 font-medium rounded-tr-lg">Birthdate</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 text-sm text-gray-700">
                    @forelse($litter->offspring as $offspring)
                    <tr class="hover:bg-orange-50 transition-colors {{ $loop->even ? 'bg-gray-50/30' : '' }}">
                        <td class="px-6 py-4 font-mono text-xs text-gray-500">OFF-{{ str_pad($offspring->offspring_id, 3, '0', STR_PAD_LEFT) }}</td>
                        <td class="px-6 py-4 font-medium text-gray-900">{{ $offspring->name ?? 'Unnamed' }}</td>
                        <td class="px-6 py-4 capitalize">{{ $offspring->sex }}</td>
                        <td class="px-6 py-4">
                            <span class="px-3 py-1 rounded-full text-xs font-medium
                                @if($offspring->status === 'alive') bg-green-100 text-green-700
                                @elseif($offspring->status === 'died') bg-red-100 text-red-700
                                @elseif($offspring->status === 'adopted') bg-blue-100 text-blue-700
                                @else bg-gray-100 text-gray-500
                                @endif">
                                {{ ucfirst($offspring->status) }}
                            </span>
                        </td>
                        <td class="px-6 py-4">{{ $litter->birth_date->format('Y-m-d') }}</td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                            <div class="flex flex-col items-center gap-3">
                                <i data-lucide="baby" class="w-12 h-12 text-gray-300"></i>
                                <p>No offspring recorded yet</p>
                            </div>
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    <!-- Close Button -->
    <div class="mt-6 flex justify-end">
        <button onclick="window.history.back()" class="px-6 py-2.5 bg-[#E75234] text-white text-sm font-medium rounded-lg hover:bg-[#d14024] transition">
            Close
        </button>
    </div>
</div>

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        lucide.createIcons();
    });
</script>
@endpush
@endsection