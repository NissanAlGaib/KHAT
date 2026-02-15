@extends('admin.layouts.app')

@section('title', 'Vaccine Protocols - KHAT Admin')

@section('content')
<!-- Flash Message -->
@if(session('success'))
<div class="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
    <i data-lucide="check-circle" class="w-5 h-5 text-green-600 flex-shrink-0"></i>
    <p class="text-sm font-medium text-green-800">{{ session('success') }}</p>
</div>
@endif

<!-- Header -->
<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
    <div>
        <h1 class="text-3xl font-bold text-gray-900">Vaccine Protocols</h1>
        <p class="text-sm text-gray-500 mt-1">Configure and manage vaccination schedules for pets</p>
    </div>
    <button onclick="openCreateModal()" class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E75234] text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-[#d14024] transition-all hover:shadow-md">
        <i data-lucide="plus" class="w-4 h-4"></i>
        Create Protocol
    </button>
</div>

<!-- Stats Cards -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <i data-lucide="list" class="w-5 h-5 text-gray-600"></i>
            </div>
            <div>
                <p class="text-2xl font-bold text-gray-900">{{ $totalProtocols }}</p>
                <p class="text-xs font-medium text-gray-500">Total Protocols</p>
            </div>
        </div>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <i data-lucide="check-circle" class="w-5 h-5 text-green-600"></i>
            </div>
            <div>
                <p class="text-2xl font-bold text-gray-900">{{ $activeProtocols }}</p>
                <p class="text-xs font-medium text-gray-500">Active Protocols</p>
            </div>
        </div>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <i data-lucide="dog" class="w-5 h-5 text-amber-600"></i>
            </div>
            <div>
                <p class="text-2xl font-bold text-gray-900">{{ $dogProtocols }}</p>
                <p class="text-xs font-medium text-gray-500">Dog-Specific</p>
            </div>
        </div>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <i data-lucide="cat" class="w-5 h-5 text-purple-600"></i>
            </div>
            <div>
                <p class="text-2xl font-bold text-gray-900">{{ $catProtocols }}</p>
                <p class="text-xs font-medium text-gray-500">Cat-Specific</p>
            </div>
        </div>
    </div>
</div>

<!-- Filter Section -->
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
    <form action="{{ route('admin.vaccine-protocols.index') }}" method="GET">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <!-- Species Filter -->
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Species</label>
                <div class="relative">
                    <select name="species" class="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                        <option value="">All Species</option>
                        <option value="dog" {{ request('species') == 'dog' ? 'selected' : '' }}>Dog</option>
                        <option value="cat" {{ request('species') == 'cat' ? 'selected' : '' }}>Cat</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </div>
                </div>
            </div>

            <!-- Status Filter -->
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <div class="relative">
                    <select name="status" class="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                        <option value="">All Statuses</option>
                        <option value="required" {{ request('status') == 'required' ? 'selected' : '' }}>Required</option>
                        <option value="optional" {{ request('status') == 'optional' ? 'selected' : '' }}>Optional</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </div>
                </div>
            </div>

            <!-- Active Filter -->
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Active</label>
                <div class="relative">
                    <select name="active" class="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                        <option value="">All</option>
                        <option value="1" {{ request('active') === '1' ? 'selected' : '' }}>Active</option>
                        <option value="0" {{ request('active') === '0' ? 'selected' : '' }}>Inactive</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </div>
                </div>
            </div>

            <!-- Search -->
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                <div class="relative">
                    <input type="text" name="search" value="{{ request('search') }}" placeholder="Search protocols..." class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pl-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-400">
                        <i data-lucide="search" class="w-4 h-4"></i>
                    </div>
        </div>
    </div>
</div>

<!-- Edit Protocol Modal -->
<div id="editProtocolModal" class="fixed inset-0 z-50 hidden">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" onclick="closeEditModal()"></div>
    <div class="fixed inset-0 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
            <!-- Modal Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <div>
                    <h2 class="text-xl font-bold text-gray-900">Edit Vaccine Protocol</h2>
                    <p class="text-sm text-gray-500 mt-0.5">Update protocol details and dosing schedule</p>
                </div>
                <button type="button" onclick="closeEditModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>

            <!-- Modal Body (scrollable) -->
            <div class="overflow-y-auto flex-1 px-6 py-5">
                <form id="editProtocolForm" onsubmit="event.preventDefault();">
                    @method('PUT')
                    <input type="hidden" name="id" id="edit_protocol_id">
                    
                    <!-- Validation Errors Container -->
                    <div id="editFormErrors" class="hidden mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div class="flex items-center gap-2 mb-2">
                            <i data-lucide="alert-circle" class="w-4 h-4 text-red-600 flex-shrink-0"></i>
                            <p class="text-sm font-medium text-red-800">Please fix the following errors:</p>
                        </div>
                        <ul id="editFormErrorList" class="list-disc list-inside text-sm text-red-700 space-y-1"></ul>
                    </div>

                    <!-- Name -->
                    <div class="mb-5">
                        <label for="edit_name" class="block text-sm font-semibold text-gray-700 mb-2">Protocol Name <span class="text-red-500">*</span></label>
                        <input type="text" name="name" id="edit_name" required placeholder="e.g., Rabies, DHPP, FVRCP" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                    </div>

                    <!-- Species & Required Row -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                        <div>
                            <label for="edit_species" class="block text-sm font-semibold text-gray-700 mb-2">Species <span class="text-red-500">*</span></label>
                            <div class="relative">
                                <select name="species" id="edit_species" required class="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                                    <option value="">Select species</option>
                                    <option value="dog">Dog</option>
                                    <option value="cat">Cat</option>
                                    <option value="all">All Species</option>
                                </select>
                                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                    <i data-lucide="chevron-down" class="w-4 h-4"></i>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-end">
                            <label class="flex items-center gap-3 cursor-pointer pb-2.5">
                                <input type="hidden" name="is_required" value="0">
                                <input type="checkbox" name="is_required" id="edit_is_required" value="1" class="w-5 h-5 rounded border-gray-300 text-[#E75234] focus:ring-[#E75234] transition">
                                <div>
                                    <span class="block text-sm font-semibold text-gray-700">Required Vaccine</span>
                                    <span class="block text-xs text-gray-500">Required for breeding eligibility</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Description -->
                    <div class="mb-5">
                        <label for="edit_description" class="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                        <textarea name="description" id="edit_description" rows="2" placeholder="Brief description of this vaccine protocol..." class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition resize-none"></textarea>
                    </div>

                    <!-- Protocol Type -->
                    <div class="mb-5">
                        <label class="block text-sm font-semibold text-gray-700 mb-3">Protocol Type <span class="text-red-500">*</span></label>
                        <div class="space-y-2">
                            <label class="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-[#E75234] hover:bg-[#FDF4F2] transition-colors">
                                <input type="radio" name="protocol_type" id="edit_type_series" value="series_only" onchange="updateEditFieldVisibility()" class="mt-0.5 w-4 h-4 text-[#E75234] focus:ring-[#E75234] border-gray-300">
                                <div>
                                    <span class="block text-sm font-medium text-gray-900">Fixed Series</span>
                                    <span class="block text-xs text-gray-500 mt-0.5">A set number of doses with intervals (e.g., DHPP puppy series)</span>
                                </div>
                            </label>
                            <label class="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-[#E75234] hover:bg-[#FDF4F2] transition-colors">
                                <input type="radio" name="protocol_type" id="edit_type_booster" value="series_with_booster" onchange="updateEditFieldVisibility()" class="mt-0.5 w-4 h-4 text-[#E75234] focus:ring-[#E75234] border-gray-300">
                                <div>
                                    <span class="block text-sm font-medium text-gray-900">Series + Booster</span>
                                    <span class="block text-xs text-gray-500 mt-0.5">Initial series followed by recurring boosters (e.g., Rabies)</span>
                                </div>
                            </label>
                            <label class="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-[#E75234] hover:bg-[#FDF4F2] transition-colors">
                                <input type="radio" name="protocol_type" id="edit_type_recurring" value="recurring" onchange="updateEditFieldVisibility()" class="mt-0.5 w-4 h-4 text-[#E75234] focus:ring-[#E75234] border-gray-300">
                                <div>
                                    <span class="block text-sm font-medium text-gray-900">Recurring Only</span>
                                    <span class="block text-xs text-gray-500 mt-0.5">Regular recurring shots with no initial series (e.g., annual heartworm)</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Series Fields -->
                    <div id="edit-series-fields" class="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <i data-lucide="list-ordered" class="w-4 h-4 text-[#E75234]"></i>
                            Series Configuration
                        </h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label for="edit_series_doses" class="block text-sm font-medium text-gray-700 mb-2">Number of Doses</label>
                                <input type="number" name="series_doses" id="edit_series_doses" min="1" max="10" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                            </div>
                            <div>
                                <label for="edit_series_interval_days" class="block text-sm font-medium text-gray-700 mb-2">Interval Between Doses (days)</label>
                                <input type="number" name="series_interval_days" id="edit_series_interval_days" min="1" placeholder="e.g., 21" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                            </div>
                        </div>
                    </div>

                    <!-- Booster Fields -->
                    <div id="edit-booster-fields" class="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200 hidden">
                        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <i data-lucide="repeat" class="w-4 h-4 text-[#E75234]"></i>
                            Booster Configuration
                        </h3>
                        <div>
                            <label for="edit_booster_interval_days" class="block text-sm font-medium text-gray-700 mb-2">Booster Interval (days)</label>
                            <input type="number" name="booster_interval_days" id="edit_booster_interval_days" min="1" placeholder="e.g., 365 for annual" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                        </div>
                    </div>

                    <!-- Sort Order -->
                    <div>
                        <label for="edit_sort_order" class="block text-sm font-semibold text-gray-700 mb-2">Sort Order</label>
                        <input type="number" name="sort_order" id="edit_sort_order" min="0" class="w-full sm:w-32 bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                        <p class="mt-1.5 text-xs text-gray-500">Lower numbers appear first</p>
                    </div>
                </form>
            </div>

            <!-- Modal Footer -->
            <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <button type="button" onclick="closeEditModal()" class="px-5 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all">
                    Cancel
                </button>
                <button type="button" onclick="submitEditForm()" id="editSubmitBtn" class="px-6 py-2.5 bg-gradient-to-r from-[#E75234] to-[#d14024] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all inline-flex items-center gap-2">
                    <i data-lucide="save" class="w-4 h-4"></i>
                    Update Protocol
                </button>
            </div>
        </div>
    </div>
</div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
            <button type="submit" class="px-6 py-2.5 bg-[#E75234] text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-[#d14024] transition-all hover:shadow-md">
                Apply Filters
            </button>
            <a href="{{ route('admin.vaccine-protocols.index') }}" class="px-6 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all shadow-sm">
                Reset Filters
            </a>
        </div>
    </form>
</div>

<!-- Results Count -->
<p class="text-sm text-gray-600 mb-4 font-medium">
    Showing {{ $protocols->firstItem() ?? 0 }} - {{ $protocols->lastItem() ?? 0 }} of {{ number_format($protocols->total()) }} entries
</p>

<!-- Protocols Table -->
<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[1000px]">
            <thead>
                <tr class="bg-[#E75234] text-white text-sm">
                    <th class="px-6 py-4 font-semibold">Name</th>
                    <th class="px-6 py-4 font-semibold">Species</th>
                    <th class="px-6 py-4 font-semibold">Type</th>
                    <th class="px-6 py-4 font-semibold">Required</th>
                    <th class="px-6 py-4 font-semibold">Series Doses</th>
                    <th class="px-6 py-4 font-semibold">Booster Interval</th>
                    <th class="px-6 py-4 font-semibold text-center">Status</th>
                    <th class="px-6 py-4 font-semibold">Created</th>
                    <th class="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 text-sm">
                @forelse($protocols as $protocol)
                @php
                    $protocolType = 'recurring';
                    if ($protocol->series_doses > 0 && $protocol->booster_interval_days > 0) {
                        $protocolType = 'series_with_booster';
                    } elseif ($protocol->series_doses > 0) {
                        $protocolType = 'series_only';
                    }
                @endphp
                <tr class="hover:bg-orange-50/50 transition-colors">
                    <td class="px-6 py-4 font-medium text-gray-900">{{ $protocol->name }}</td>
                    <td class="px-6 py-4">
                        @if($protocol->species === 'dog')
                            <span class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">Dog</span>
                        @elseif($protocol->species === 'cat')
                            <span class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-800">Cat</span>
                        @else
                            <span class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">All</span>
                        @endif
                    </td>
                    <td class="px-6 py-4">
                        @if($protocol->series_doses > 0 && $protocol->booster_interval_days > 0)
                            <span class="text-gray-700">Series + Booster</span>
                        @elseif($protocol->series_doses > 0)
                            <span class="text-gray-700">Fixed Series</span>
                        @else
                            <span class="text-gray-700">Recurring</span>
                        @endif
                    </td>
                    <td class="px-6 py-4">
                        @if($protocol->is_required)
                            <span class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800">Yes</span>
                        @else
                            <span class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">No</span>
                        @endif
                    </td>
                    <td class="px-6 py-4 text-gray-700">
                        {{ $protocol->series_doses > 0 ? $protocol->series_doses . ' doses' : '—' }}
                        @if($protocol->series_interval_days > 0)
                            <span class="text-gray-400 text-xs">(every {{ $protocol->series_interval_days }}d)</span>
                        @endif
                    </td>
                    <td class="px-6 py-4 text-gray-700">
                        {{ $protocol->booster_interval_days > 0 ? $protocol->booster_interval_days . ' days' : '—' }}
                    </td>
                    <td class="px-6 py-4 text-center">
                        @if($protocol->is_active)
                            <span class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">Active</span>
                        @else
                            <span class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">Inactive</span>
                        @endif
                    </td>
                    <td class="px-6 py-4" title="{{ $protocol->created_at->format('M d, Y h:i A') }} ({{ $protocol->created_at->diffForHumans() }})">
                        <div class="flex flex-col">
                            <span class="text-sm font-medium text-gray-900">{{ $protocol->created_at->format('M d, Y') }}</span>
                            <span class="text-xs text-gray-500">{{ $protocol->created_at->format('h:i A') }}</span>
                            @if($protocol->updated_at && $protocol->created_at && $protocol->updated_at->gt($protocol->created_at))
                                <span class="text-[10px] text-gray-400 mt-1 italic" title="Updated {{ $protocol->updated_at->format('M d, Y h:i A') }}">
                                    Updated {{ $protocol->updated_at->diffForHumans() }}
                                    @if($protocol->updater)
                                        by {{ $protocol->updater->name }}
                                    @endif
                                </span>
                            @endif
                        </div>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <div class="flex items-center justify-center gap-2">
                            <button onclick="openEditModal(this)"
                                data-id="{{ $protocol->id }}"
                                data-name="{{ $protocol->name }}"
                                data-species="{{ $protocol->species }}"
                                data-required="{{ $protocol->is_required }}"
                                data-description="{{ $protocol->description }}"
                                data-series-doses="{{ $protocol->series_doses }}"
                                data-series-interval="{{ $protocol->series_interval_days }}"
                                data-booster-interval="{{ $protocol->booster_interval_days }}"
                                data-sort-order="{{ $protocol->sort_order }}"
                                data-protocol-type="{{ $protocolType }}"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                                Edit
                            </button>
                            <form action="{{ route('admin.vaccine-protocols.toggle', $protocol->id) }}" method="POST" class="inline">
                                @csrf
                                @method('PATCH')
                                @if($protocol->is_active)
                                    <button type="submit" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                                        <i data-lucide="x-circle" class="w-3.5 h-3.5"></i>
                                        Deactivate
                                    </button>
                                @else
                                    <button type="submit" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                                        <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                                        Activate
                                    </button>
                                @endif
                            </form>
                        </div>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="8" class="px-6 py-16 text-center">
                        <div class="flex flex-col items-center gap-3 text-gray-400">
                            <i data-lucide="syringe" class="w-16 h-16 text-gray-300"></i>
                            <p class="text-base font-medium text-gray-500">No protocols found</p>
                            <p class="text-sm text-gray-400">Try adjusting your filters or create a new protocol</p>
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
    {{ $protocols->links() }}
</div>

<!-- Create Protocol Modal -->
<div id="createProtocolModal" class="fixed inset-0 z-50 hidden">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" onclick="closeCreateModal()"></div>
    <div class="fixed inset-0 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
            <!-- Modal Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <div>
                    <h2 class="text-xl font-bold text-gray-900">Create Vaccine Protocol</h2>
                    <p class="text-sm text-gray-500 mt-0.5">Define a new vaccination protocol with dosing schedule</p>
                </div>
                <button type="button" onclick="closeCreateModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>

            <!-- Modal Body (scrollable) -->
            <div class="overflow-y-auto flex-1 px-6 py-5">
                <form id="createProtocolForm" onsubmit="event.preventDefault();">
                    <!-- Validation Errors Container -->
                    <div id="createFormErrors" class="hidden mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div class="flex items-center gap-2 mb-2">
                            <i data-lucide="alert-circle" class="w-4 h-4 text-red-600 flex-shrink-0"></i>
                            <p class="text-sm font-medium text-red-800">Please fix the following errors:</p>
                        </div>
                        <ul id="createFormErrorList" class="list-disc list-inside text-sm text-red-700 space-y-1"></ul>
                    </div>

                    <!-- Name -->
                    <div class="mb-5">
                        <label for="create_name" class="block text-sm font-semibold text-gray-700 mb-2">Protocol Name <span class="text-red-500">*</span></label>
                        <input type="text" name="name" id="create_name" required placeholder="e.g., Rabies, DHPP, FVRCP" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                    </div>

                    <!-- Species & Required Row -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                        <div>
                            <label for="create_species" class="block text-sm font-semibold text-gray-700 mb-2">Species <span class="text-red-500">*</span></label>
                            <div class="relative">
                                <select name="species" id="create_species" required class="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                                    <option value="">Select species</option>
                                    <option value="dog">Dog</option>
                                    <option value="cat">Cat</option>
                                    <option value="all">All Species</option>
                                </select>
                                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                                    <i data-lucide="chevron-down" class="w-4 h-4"></i>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-end">
                            <label class="flex items-center gap-3 cursor-pointer pb-2.5">
                                <input type="hidden" name="is_required" value="0">
                                <input type="checkbox" name="is_required" value="1" class="w-5 h-5 rounded border-gray-300 text-[#E75234] focus:ring-[#E75234] transition">
                                <div>
                                    <span class="block text-sm font-semibold text-gray-700">Required Vaccine</span>
                                    <span class="block text-xs text-gray-500">Required for breeding eligibility</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Description -->
                    <div class="mb-5">
                        <label for="create_description" class="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                        <textarea name="description" id="create_description" rows="2" placeholder="Brief description of this vaccine protocol..." class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition resize-none"></textarea>
                    </div>

                    <!-- Protocol Type -->
                    <div class="mb-5">
                        <label class="block text-sm font-semibold text-gray-700 mb-3">Protocol Type <span class="text-red-500">*</span></label>
                        <div class="space-y-2">
                            <label class="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-[#E75234] hover:bg-[#FDF4F2] transition-colors">
                                <input type="radio" name="protocol_type" value="series_only" checked class="mt-0.5 w-4 h-4 text-[#E75234] focus:ring-[#E75234] border-gray-300">
                                <div>
                                    <span class="block text-sm font-medium text-gray-900">Fixed Series</span>
                                    <span class="block text-xs text-gray-500 mt-0.5">A set number of doses with intervals (e.g., DHPP puppy series)</span>
                                </div>
                            </label>
                            <label class="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-[#E75234] hover:bg-[#FDF4F2] transition-colors">
                                <input type="radio" name="protocol_type" value="series_with_booster" class="mt-0.5 w-4 h-4 text-[#E75234] focus:ring-[#E75234] border-gray-300">
                                <div>
                                    <span class="block text-sm font-medium text-gray-900">Series + Booster</span>
                                    <span class="block text-xs text-gray-500 mt-0.5">Initial series followed by recurring boosters (e.g., Rabies)</span>
                                </div>
                            </label>
                            <label class="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-[#E75234] hover:bg-[#FDF4F2] transition-colors">
                                <input type="radio" name="protocol_type" value="recurring" class="mt-0.5 w-4 h-4 text-[#E75234] focus:ring-[#E75234] border-gray-300">
                                <div>
                                    <span class="block text-sm font-medium text-gray-900">Recurring Only</span>
                                    <span class="block text-xs text-gray-500 mt-0.5">Regular recurring shots with no initial series (e.g., annual heartworm)</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Series Fields -->
                    <div id="create-series-fields" class="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <i data-lucide="list-ordered" class="w-4 h-4 text-[#E75234]"></i>
                            Series Configuration
                        </h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label for="create_series_doses" class="block text-sm font-medium text-gray-700 mb-2">Number of Doses</label>
                                <input type="number" name="series_doses" id="create_series_doses" value="1" min="1" max="10" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                            </div>
                            <div>
                                <label for="create_series_interval_days" class="block text-sm font-medium text-gray-700 mb-2">Interval Between Doses (days)</label>
                                <input type="number" name="series_interval_days" id="create_series_interval_days" min="1" placeholder="e.g., 21" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                            </div>
                        </div>
                    </div>

                    <!-- Booster Fields -->
                    <div id="create-booster-fields" class="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200 hidden">
                        <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <i data-lucide="repeat" class="w-4 h-4 text-[#E75234]"></i>
                            Booster Configuration
                        </h3>
                        <div>
                            <label for="create_booster_interval_days" class="block text-sm font-medium text-gray-700 mb-2">Booster Interval (days)</label>
                            <input type="number" name="booster_interval_days" id="create_booster_interval_days" min="1" placeholder="e.g., 365 for annual" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                        </div>
                    </div>

                    <!-- Sort Order -->
                    <div>
                        <label for="create_sort_order" class="block text-sm font-semibold text-gray-700 mb-2">Sort Order</label>
                        <input type="number" name="sort_order" id="create_sort_order" value="0" min="0" class="w-full sm:w-32 bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                        <p class="mt-1.5 text-xs text-gray-500">Lower numbers appear first</p>
                    </div>
                </form>
            </div>

            <!-- Modal Footer -->
            <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <button type="button" onclick="closeCreateModal()" class="px-5 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all">
                    Cancel
                </button>
                <button type="button" onclick="submitCreateForm()" id="createSubmitBtn" class="px-6 py-2.5 bg-gradient-to-r from-[#E75234] to-[#d14024] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all inline-flex items-center gap-2">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    Create Protocol
                </button>
            </div>
        </div>
    </div>
</div>

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        lucide.createIcons();

        // Protocol type radio change → toggle series/booster fields
        const createRadios = document.querySelectorAll('#createProtocolForm input[name="protocol_type"]');
        createRadios.forEach(function(radio) {
            radio.addEventListener('change', updateCreateFieldVisibility);
        });
        updateCreateFieldVisibility();
    });

    function updateCreateFieldVisibility() {
        const selected = document.querySelector('#createProtocolForm input[name="protocol_type"]:checked');
        if (!selected) return;

        const seriesFields = document.getElementById('create-series-fields');
        const boosterFields = document.getElementById('create-booster-fields');
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

    function openCreateModal() {
        const modal = document.getElementById('createProtocolModal');
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Reset form
        document.getElementById('createProtocolForm').reset();
        document.getElementById('create_sort_order').value = '0';
        document.getElementById('create_series_doses').value = '1';

        // Reset radio to series_only and update visibility
        const seriesOnlyRadio = document.querySelector('#createProtocolForm input[name="protocol_type"][value="series_only"]');
        if (seriesOnlyRadio) seriesOnlyRadio.checked = true;
        updateCreateFieldVisibility();

        // Hide errors
        document.getElementById('createFormErrors').classList.add('hidden');

        // Re-init icons for modal
        setTimeout(function() { lucide.createIcons(); }, 50);
    }

    function closeCreateModal() {
        const modal = document.getElementById('createProtocolModal');
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    function submitCreateForm() {
        const form = document.getElementById('createProtocolForm');
        const formData = new FormData(form);
        const submitBtn = document.getElementById('createSubmitBtn');
        const errorsContainer = document.getElementById('createFormErrors');
        const errorList = document.getElementById('createFormErrorList');

        // Disable button + show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<svg class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Creating...';

        // Handle checkbox: if unchecked, ensure is_required=0 is sent
        if (!form.querySelector('input[name="is_required"][type="checkbox"]').checked) {
            formData.set('is_required', '0');
        }

        fetch("{{ route('admin.vaccine-protocols.store') }}", {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        })
        .then(function(response) {
            if (response.ok) {
                return response.json().then(function(data) {
                    closeCreateModal();
                    // Show SweetAlert success, then reload
                    if (typeof Swal !== 'undefined') {
                        Swal.fire({
                            icon: 'success',
                            title: 'Protocol Created',
                            text: data.message || 'Protocol created successfully.',
                            timer: 1500,
                            showConfirmButton: false
                        }).then(function() {
                            window.location.reload();
                        });
                    } else {
                        window.location.reload();
                    }
                });
            } else if (response.status === 422) {
                return response.json().then(function(data) {
                    // Show validation errors
                    errorList.innerHTML = '';
                    errorsContainer.classList.remove('hidden');
                    const errors = data.errors || {};
                    Object.keys(errors).forEach(function(field) {
                        errors[field].forEach(function(msg) {
                            const li = document.createElement('li');
                            li.textContent = msg;
                            errorList.appendChild(li);
                        });
                    });
                    // Scroll to errors
                    errorsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                });
            } else {
                throw new Error('Server error');
            }
        })
        .catch(function(error) {
            console.error('Error:', error);
            if (typeof Swal !== 'undefined') {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Something went wrong. Please try again.' });
            } else {
                alert('Something went wrong. Please try again.');
            }
        })
        .finally(function() {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i data-lucide="plus" class="w-4 h-4"></i> Create Protocol';
            lucide.createIcons();
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('createProtocolModal');
            if (!modal.classList.contains('hidden')) {
                closeCreateModal();
            }
        }
    });
    // --- Edit Protocol Logic ---

    // Protocol type radio change → toggle series/booster fields (Edit)
    const editRadios = document.querySelectorAll('#editProtocolForm input[name="protocol_type"]');
    editRadios.forEach(function(radio) {
        radio.addEventListener('change', updateEditFieldVisibility);
    });

    function updateEditFieldVisibility() {
        const selected = document.querySelector('#editProtocolForm input[name="protocol_type"]:checked');
        if (!selected) return;

        const seriesFields = document.getElementById('edit-series-fields');
        const boosterFields = document.getElementById('edit-booster-fields');
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

    function openEditModal(btn) {
        const modal = document.getElementById('editProtocolModal');
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Get data from attributes
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        const species = btn.getAttribute('data-species');
        const isRequired = btn.getAttribute('data-required') == '1';
        const description = btn.getAttribute('data-description');
        const seriesDoses = parseInt(btn.getAttribute('data-series-doses') || 0);
        const seriesInterval = btn.getAttribute('data-series-interval');
        const boosterInterval = parseInt(btn.getAttribute('data-booster-interval') || 0);
        const sortOrder = btn.getAttribute('data-sort-order');
        const type = btn.getAttribute('data-protocol-type');

        // Populate fields
        document.getElementById('edit_protocol_id').value = id;
        document.getElementById('edit_name').value = name;
        document.getElementById('edit_species').value = species;
        document.getElementById('edit_is_required').checked = isRequired;
        document.getElementById('edit_description').value = description || '';
        document.getElementById('edit_series_doses').value = seriesDoses > 0 ? seriesDoses : 1;
        document.getElementById('edit_series_interval_days').value = seriesInterval > 0 ? seriesInterval : '';
        document.getElementById('edit_booster_interval_days').value = boosterInterval > 0 ? boosterInterval : '';
        document.getElementById('edit_sort_order').value = sortOrder;

        // Set radio (Robust ID-based selection with fallback)
        console.log('Edit Type:', type);
        if (type === 'series_only') {
            document.getElementById('edit_type_series').checked = true;
        } else if (type === 'series_with_booster') {
            document.getElementById('edit_type_booster').checked = true;
        } else {
            // Default/Fallback
            document.getElementById('edit_type_recurring').checked = true;
        }
        
        updateEditFieldVisibility();

        // Hide errors
        document.getElementById('editFormErrors').classList.add('hidden');

        // Re-init icons
        setTimeout(function() { lucide.createIcons(); }, 50);
    }

    function closeEditModal() {
        const modal = document.getElementById('editProtocolModal');
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    function submitEditForm() {
        const form = document.getElementById('editProtocolForm');
        const formData = new FormData(form);
        const id = document.getElementById('edit_protocol_id').value;
        const submitBtn = document.getElementById('editSubmitBtn');
        const errorsContainer = document.getElementById('editFormErrors');
        const errorList = document.getElementById('editFormErrorList');

        // Disable button + show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<svg class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Updating...';

        // Handle checkbox
        if (!form.querySelector('input[name="is_required"][type="checkbox"]').checked) {
            formData.set('is_required', '0');
        }

        // Construct URL: replace ID placeholder or append
        const url = "{{ route('admin.vaccine-protocols.update', ':id') }}".replace(':id', id);

        fetch(url, {
            method: 'POST', // Laravel handles PUT via _method
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        })
        .then(function(response) {
            if (response.ok || response.status === 200) {
                // Check if the response is JSON
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return response.json().then(function(data) {
                        closeEditModal();
                        if (typeof Swal !== 'undefined') {
                            Swal.fire({
                                icon: 'success',
                                title: 'Protocol Updated',
                                text: data.message || 'Protocol updated successfully.',
                                timer: 1500,
                                showConfirmButton: false
                            }).then(function() {
                                window.location.reload();
                            });
                        } else {
                            window.location.reload();
                        }
                    });
                } else {
                    // Fallback for non-JSON success (e.g. redirect)
                    window.location.reload();
                }
            } else if (response.status === 422) {
                return response.json().then(function(data) {
                    // Show validation errors
                    errorList.innerHTML = '';
                    errorsContainer.classList.remove('hidden');
                    const errors = data.errors || {};
                    Object.keys(errors).forEach(function(field) {
                        errors[field].forEach(function(msg) {
                            const li = document.createElement('li');
                            li.textContent = msg;
                            errorList.appendChild(li);
                        });
                    });
                    // Scroll to errors
                    errorsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                });
            } else {
                throw new Error('Server error');
            }
        })
        .catch(function(error) {
            console.error('Error:', error);
            if (typeof Swal !== 'undefined') {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Something went wrong. Please try again.' });
            } else {
                alert('Something went wrong. Please try again.');
            }
        })
        .finally(function() {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i data-lucide="save" class="w-4 h-4"></i> Update Protocol';
            lucide.createIcons();
        });
    }

    // Close modal on Escape key (Edit)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('editProtocolModal');
            if (!modal.classList.contains('hidden')) {
                closeEditModal();
            }
        }
    });
</script>
@endpush
@endsection
