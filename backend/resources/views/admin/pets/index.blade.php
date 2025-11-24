@extends('admin.layouts.app')

@section('title', 'Pet Management - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-6">Pet Management</h1>

<div class="inline-flex bg-gray-50 rounded-xl p-1 shadow-inner border border-gray-100 mb-6 overflow-x-auto">
    <a href="{{ route('admin.pets.index', ['status' => 'active']) }}"
        class="whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all {{ $status === 'active' ? 'bg-[#E75234] text-white shadow-md' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700' }}">
        Active
    </a>
    <a href="{{ route('admin.pets.index', ['status' => 'pending']) }}"
        class="whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all {{ $status === 'pending' ? 'bg-[#E75234] text-white shadow-md' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700' }}">
        Pending
    </a>
    <a href="{{ route('admin.pets.index', ['status' => 'rejected']) }}"
        class="whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all {{ $status === 'rejected' ? 'bg-[#E75234] text-white shadow-md' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700' }}">
        Rejected
    </a>
    <a href="{{ route('admin.pets.index', ['status' => 'disabled']) }}"
        class="whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all {{ $status === 'disabled' ? 'bg-[#E75234] text-white shadow-md' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700' }}">
        Disabled
    </a>
    <a href="{{ route('admin.pets.index', ['status' => 'cooldown']) }}"
        class="whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all {{ $status === 'cooldown' ? 'bg-[#E75234] text-white shadow-md' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700' }}">
        Cooldown
    </a>
    <a href="{{ route('admin.pets.index', ['status' => 'banned']) }}"
        class="whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all {{ $status === 'banned' ? 'bg-[#E75234] text-white shadow-md' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700' }}">
        Banned
    </a>
    <a href="{{ route('admin.pets.index', ['status' => 'all']) }}"
        class="whitespace-nowrap px-6 py-2 rounded-lg text-sm font-bold transition-all {{ $status === 'all' ? 'bg-[#E75234] text-white shadow-md' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700' }}">
        All Pets
    </a>
</div>

<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
    <form action="{{ route('admin.pets.index') }}" method="GET">
        <input type="hidden" name="status" value="{{ $status }}">

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div class="space-y-1.5">
                <label class="text-xs font-semibold text-gray-700">Pet Type</label>
                <div class="relative">
                    <select name="pet_type" class="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent">
                        <option value="">All Types</option>
                        <option value="dog">Dog</option>
                        <option value="cat">Cat</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </div>
                </div>
            </div>

            <div class="space-y-1.5">
                <label class="text-xs font-semibold text-gray-700">Gender</label>
                <div class="relative">
                    <select name="gender" class="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent">
                        <option value="">All Genders</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </div>
                </div>
            </div>

            <div class="space-y-1.5">
                <label class="text-xs font-semibold text-gray-700">Owner Status</label>
                <div class="relative">
                    <select name="owner_status" class="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent">
                        <option value="">All Statuses</option>
                        <option value="verified">Verified</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </div>
                </div>
            </div>

            <div class="space-y-1.5">
                <label class="text-xs font-semibold text-gray-700">Search by Name or ID</label>
                <div class="relative">
                    <input type="text" name="search" placeholder="Search pets" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pl-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent">
                    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-400">
                        <i data-lucide="search" class="w-4 h-4"></i>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex gap-3">
            <button type="submit" class="px-6 py-2.5 bg-[#E75234] text-white text-sm font-medium rounded-lg shadow-md hover:bg-[#d14024] transition">
                Apply Filters
            </button>
            <a href="{{ route('admin.pets.index', ['status' => $status]) }}" class="px-6 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition">
                Reset Filters
            </a>
        </div>
    </form>
</div>

<p class="text-sm text-gray-600 mb-4">
    Showing {{ $pets->firstItem() ?? 0 }} - {{ $pets->lastItem() ?? 0 }} of {{ $pets->total() }} entries
</p>

<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
    <div class="overflow-x-auto min-h-[400px]">
        <table class="w-full text-left border-collapse min-w-[900px]">
            <thead>
                <tr class="bg-[#E75234] text-white text-sm">
                    <th class="px-6 py-4 font-medium rounded-tl-xl">Pet ID</th>
                    <th class="px-6 py-4 font-medium">Pet Name</th>
                    <th class="px-6 py-4 font-medium">Type & Breed</th>
                    <th class="px-6 py-4 font-medium">Age</th>
                    <th class="px-6 py-4 font-medium">Gender</th>
                    <th class="px-6 py-4 font-medium">Owner</th>
                    <th class="px-6 py-4 font-medium text-center">Status</th>
                    <th class="px-6 py-4 font-medium text-center rounded-tr-xl">Actions</th>
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
                        {{ \Carbon\Carbon::parse($pet->birthdate)->diff(\Carbon\Carbon::now())->format('%y yr %m mos') }}
                        @else
                        N/A
                        @endif
                    </td>
                    <td class="px-6 py-4 capitalize">{{ $pet->sex ?? 'N/A' }}</td>
                    <td class="px-6 py-4">{{ $pet->owner->name ?? $pet->owner->email ?? 'Unknown' }}</td>
                    <td class="px-6 py-4 text-center">
                        <span class="px-3 py-1 rounded-full text-xs font-medium
                            @if($pet->status === 'active') bg-green-100 text-green-700
                            @elseif($pet->status === 'pending') bg-yellow-100 text-yellow-700
                            @elseif($pet->status === 'rejected') bg-red-100 text-red-700
                            @elseif($pet->status === 'disabled') bg-gray-100 text-gray-700
                            @elseif($pet->status === 'cooldown') bg-blue-100 text-blue-700
                            @elseif($pet->status === 'banned') bg-red-200 text-red-800
                            @else bg-gray-100 text-gray-500
                            @endif">
                            {{ ucfirst($pet->status ?? 'Unknown') }}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <div class="relative">
                            <button onclick="toggleDropdown(event, 'dropdown-{{ $pet->pet_id }}')" class="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors p-1 rounded-md">
                                <i data-lucide="more-horizontal" class="w-5 h-5"></i>
                            </button>
                            <div id="dropdown-{{ $pet->pet_id }}" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] z-50 border border-gray-100 overflow-hidden text-left">
                                <a href="#" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                    <i data-lucide="user" class="w-4 h-4 text-gray-500"></i>
                                    View Profile
                                </a>
                                <button class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                    <i data-lucide="pause-circle" class="w-4 h-4 text-gray-500"></i>
                                    Suspend
                                </button>
                                <div class="border-t border-gray-100 my-1"></div>
                                <button class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                                    <i data-lucide="triangle-alert" class="w-4 h-4"></i>
                                    Delete Pet
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="8" class="px-6 py-12 text-center text-gray-500">
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

@push('scripts')
<script>
    function toggleDropdown(event, dropdownId) {
        event.stopPropagation();
        const dropdown = document.getElementById(dropdownId);
        const allDropdowns = document.querySelectorAll('[id^="dropdown-"]');

        allDropdowns.forEach(d => {
            if (d.id !== dropdownId) {
                d.classList.add('hidden');
            }
        });

        dropdown.classList.toggle('hidden');
    }

    document.addEventListener('click', function() {
        const allDropdowns = document.querySelectorAll('[id^="dropdown-"]');
        allDropdowns.forEach(d => d.classList.add('hidden'));
    });

    document.addEventListener('DOMContentLoaded', function() {
        lucide.createIcons();
    });
</script>
@endpush
@endsection