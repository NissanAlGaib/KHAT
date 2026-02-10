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
    <a href="{{ route('admin.vaccine-protocols.create') }}" class="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E75234] text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-[#d14024] transition-all hover:shadow-md">
        <i data-lucide="plus" class="w-4 h-4"></i>
        Create Protocol
    </a>
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
                    <th class="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 text-sm">
                @forelse($protocols as $protocol)
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
                    <td class="px-6 py-4 text-center">
                        <div class="flex items-center justify-center gap-2">
                            <a href="{{ route('admin.vaccine-protocols.edit', $protocol->id) }}" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                                Edit
                            </a>
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

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        lucide.createIcons();
    });
</script>
@endpush
@endsection
