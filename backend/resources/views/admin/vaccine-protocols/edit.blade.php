{{-- 
@extends('admin.layouts.app')

@section('title', 'Edit Vaccine Protocol - KHAT Admin')

@section('content')
<!-- Header -->
<div class="flex items-center gap-4 mb-6">
    <a href="{{ route('admin.vaccine-protocols.index') }}" class="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors">
        <i data-lucide="arrow-left" class="w-5 h-5 text-gray-600"></i>
    </a>
    <div>
        <h1 class="text-3xl font-bold text-gray-900">Edit Vaccine Protocol</h1>
        <p class="text-sm text-gray-500 mt-1">Update protocol details and dosing schedule</p>
    </div>
</div>

<!-- Flash Message -->
@if(session('success'))
<div class="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 max-w-3xl">
    <i data-lucide="check-circle" class="w-5 h-5 text-green-600 flex-shrink-0"></i>
    <p class="text-sm font-medium text-green-800">{{ session('success') }}</p>
</div>
@endif

<!-- Form -->
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:p-8 max-w-3xl">
    <form action="{{ route('admin.vaccine-protocols.update', $protocol->id) }}" method="POST">
        @csrf
        @method('PUT')

        <!-- Name -->
        <div class="mb-6">
            <label for="name" class="block text-sm font-semibold text-gray-700 mb-2">Protocol Name <span class="text-red-500">*</span></label>
            <input type="text" name="name" id="name" value="{{ old('name', $protocol->name) }}" required placeholder="e.g., Rabies, DHPP, FVRCP" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
            @error('name')
                <p class="mt-1.5 text-xs text-red-600">{{ $message }}</p>
            @enderror
        </div>

        <!-- Species -->
        <div class="mb-6">
            <label for="species" class="block text-sm font-semibold text-gray-700 mb-2">Species <span class="text-red-500">*</span></label>
            <div class="relative">
                <select name="species" id="species" required class="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                    <option value="">Select species</option>
                    <option value="dog" {{ old('species', $protocol->species) == 'dog' ? 'selected' : '' }}>Dog</option>
                    <option value="cat" {{ old('species', $protocol->species) == 'cat' ? 'selected' : '' }}>Cat</option>
                    <option value="all" {{ old('species', $protocol->species) == 'all' ? 'selected' : '' }}>All Species</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <i data-lucide="chevron-down" class="w-4 h-4"></i>
                </div>
            </div>
            @error('species')
                <p class="mt-1.5 text-xs text-red-600">{{ $message }}</p>
            @enderror
        </div>

        <!-- Required -->
        <div class="mb-6">
            <label class="flex items-center gap-3 cursor-pointer">
                <input type="hidden" name="is_required" value="0">
                <input type="checkbox" name="is_required" value="1" {{ old('is_required', $protocol->is_required) ? 'checked' : '' }} class="w-5 h-5 rounded border-gray-300 text-[#E75234] focus:ring-[#E75234] transition">
                <span class="text-sm font-semibold text-gray-700">Required Vaccine</span>
            </label>
            <p class="mt-1 text-xs text-gray-500 ml-8">Mark this vaccine as required for breeding eligibility</p>
            @error('is_required')
                <p class="mt-1.5 text-xs text-red-600">{{ $message }}</p>
            @enderror
        </div>

        <!-- Description -->
        <div class="mb-6">
            <label for="description" class="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea name="description" id="description" rows="3" placeholder="Brief description of this vaccine protocol..." class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition resize-none">{{ old('description', $protocol->description) }}</textarea>
            @error('description')
                <p class="mt-1.5 text-xs text-red-600">{{ $message }}</p>
            @enderror
        </div>

        <!-- Protocol Type -->
        @php
            if ($protocol->series_doses > 0 && $protocol->booster_interval_days > 0) {
                $currentType = 'series_with_booster';
            } elseif ($protocol->series_doses > 0) {
                $currentType = 'series_only';
            } else {
                $currentType = 'recurring';
            }
        @endphp
        <div class="mb-6">
            <label class="block text-sm font-semibold text-gray-700 mb-3">Protocol Type <span class="text-red-500">*</span></label>
            <div class="space-y-3">
                <label class="flex items-start gap-3 p-4 rounded-lg border border-gray-200 cursor-pointer hover:border-[#E75234] hover:bg-[#FDF4F2] transition-colors protocol-type-label">
                    <input type="radio" name="protocol_type" value="series_only" {{ old('protocol_type', $currentType) == 'series_only' ? 'checked' : '' }} class="mt-0.5 w-4 h-4 text-[#E75234] focus:ring-[#E75234] border-gray-300">
                    <div>
                        <span class="block text-sm font-medium text-gray-900">Fixed Series</span>
                        <span class="block text-xs text-gray-500 mt-0.5">A set number of doses with intervals (e.g., DHPP puppy series)</span>
                    </div>
                </label>
                <label class="flex items-start gap-3 p-4 rounded-lg border border-gray-200 cursor-pointer hover:border-[#E75234] hover:bg-[#FDF4F2] transition-colors protocol-type-label">
                    <input type="radio" name="protocol_type" value="series_with_booster" {{ old('protocol_type', $currentType) == 'series_with_booster' ? 'checked' : '' }} class="mt-0.5 w-4 h-4 text-[#E75234] focus:ring-[#E75234] border-gray-300">
                    <div>
                        <span class="block text-sm font-medium text-gray-900">Series + Booster</span>
                        <span class="block text-xs text-gray-500 mt-0.5">Initial series followed by recurring boosters (e.g., Rabies)</span>
                    </div>
                </label>
                <label class="flex items-start gap-3 p-4 rounded-lg border border-gray-200 cursor-pointer hover:border-[#E75234] hover:bg-[#FDF4F2] transition-colors protocol-type-label">
                    <input type="radio" name="protocol_type" value="recurring" {{ old('protocol_type', $currentType) == 'recurring' ? 'checked' : '' }} class="mt-0.5 w-4 h-4 text-[#E75234] focus:ring-[#E75234] border-gray-300">
                    <div>
                        <span class="block text-sm font-medium text-gray-900">Recurring Only</span>
                        <span class="block text-xs text-gray-500 mt-0.5">Regular recurring shots with no initial series (e.g., annual heartworm)</span>
                    </div>
                </label>
            </div>
            @error('protocol_type')
                <p class="mt-1.5 text-xs text-red-600">{{ $message }}</p>
            @enderror
        </div>

        <!-- Series Fields -->
        <div id="series-fields" class="mb-6 p-5 bg-gray-50 rounded-lg border border-gray-200">
            <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <i data-lucide="list-ordered" class="w-4 h-4 text-[#E75234]"></i>
                Series Configuration
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label for="series_doses" class="block text-sm font-medium text-gray-700 mb-2">Number of Doses</label>
                    <input type="number" name="series_doses" id="series_doses" value="{{ old('series_doses', $protocol->series_doses) }}" min="1" max="10" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                    @error('series_doses')
                        <p class="mt-1.5 text-xs text-red-600">{{ $message }}</p>
                    @enderror
                </div>
                <div>
                    <label for="series_interval_days" class="block text-sm font-medium text-gray-700 mb-2">Interval Between Doses (days)</label>
                    <input type="number" name="series_interval_days" id="series_interval_days" value="{{ old('series_interval_days', $protocol->series_interval_days) }}" min="1" placeholder="e.g., 21" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                    @error('series_interval_days')
                        <p class="mt-1.5 text-xs text-red-600">{{ $message }}</p>
                    @enderror
                </div>
            </div>
        </div>

        <!-- Booster Fields -->
        <div id="booster-fields" class="mb-6 p-5 bg-gray-50 rounded-lg border border-gray-200 hidden">
            <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <i data-lucide="repeat" class="w-4 h-4 text-[#E75234]"></i>
                Booster Configuration
            </h3>
            <div>
                <label for="booster_interval_days" class="block text-sm font-medium text-gray-700 mb-2">Booster Interval (days)</label>
                <input type="number" name="booster_interval_days" id="booster_interval_days" value="{{ old('booster_interval_days', $protocol->booster_interval_days) }}" min="1" placeholder="e.g., 365 for annual" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                @error('booster_interval_days')
                    <p class="mt-1.5 text-xs text-red-600">{{ $message }}</p>
                @enderror
            </div>
        </div>

        <!-- Sort Order -->
        <div class="mb-8">
            <label for="sort_order" class="block text-sm font-semibold text-gray-700 mb-2">Sort Order</label>
            <input type="number" name="sort_order" id="sort_order" value="{{ old('sort_order', $protocol->sort_order) }}" min="0" class="w-full sm:w-32 bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
            <p class="mt-1.5 text-xs text-gray-500">Lower numbers appear first</p>
            @error('sort_order')
                <p class="mt-1.5 text-xs text-red-600">{{ $message }}</p>
            @enderror
        </div>

        <!-- Submit -->
        <div class="flex items-center gap-3 pt-6 border-t border-gray-200">
            <button type="submit" class="px-8 py-3 bg-gradient-to-r from-[#E75234] to-[#d14024] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all">
                Update Protocol
            </button>
            <a href="{{ route('admin.vaccine-protocols.index') }}" class="px-6 py-3 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all">
                Cancel
            </a>
        </div>
    </form>
</div>

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        const radios = document.querySelectorAll('input[name="protocol_type"]');
        const seriesFields = document.getElementById('series-fields');
        const boosterFields = document.getElementById('booster-fields');

        function updateFieldVisibility() {
            const selected = document.querySelector('input[name="protocol_type"]:checked');
            if (!selected) return;

            const value = selected.value;

            if (value === 'series_only') {
                seriesFields.classList.remove('hidden');
                boosterFields.classList.add('hidden');
            } else if (value === 'series_with_booster') {
                seriesFields.classList.remove('hidden');
                boosterFields.classList.remove('hidden');
            } else if (value === 'recurring') {
                seriesFields.classList.add('hidden');
                boosterFields.classList.remove('hidden');
            }
        }

        radios.forEach(function(radio) {
            radio.addEventListener('change', updateFieldVisibility);
        });

        // Initialize on page load
        updateFieldVisibility();

        lucide.createIcons();
    });
</script>
@endpush
@endsection
--}}
