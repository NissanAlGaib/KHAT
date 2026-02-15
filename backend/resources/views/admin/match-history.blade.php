@extends('admin.layouts.app')

@section('title', 'Match History - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-2">Match History</h1>
<p class="text-sm text-gray-500 mb-6">Track all breeding match requests, approvals, and contract status</p>

<!-- Stats Cards -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-all">
        <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <i data-lucide="heart-handshake" class="w-5 h-5 text-blue-600"></i>
            </div>
            <span class="text-sm font-semibold text-gray-500">Total Matches</span>
        </div>
        <p class="text-2xl font-bold text-gray-900">{{ number_format($totalMatches) }}</p>
    </div>
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-all">
        <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <i data-lucide="clock" class="w-5 h-5 text-yellow-600"></i>
            </div>
            <span class="text-sm font-semibold text-gray-500">Pending</span>
        </div>
        <p class="text-2xl font-bold text-yellow-600">{{ number_format($pendingMatches) }}</p>
    </div>
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-all">
        <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <i data-lucide="check-circle" class="w-5 h-5 text-green-600"></i>
            </div>
            <span class="text-sm font-semibold text-gray-500">Accepted</span>
        </div>
        <p class="text-2xl font-bold text-green-600">{{ number_format($acceptedMatches) }}</p>
    </div>
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-all">
        <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                <i data-lucide="flag" class="w-5 h-5 text-sky-600"></i>
            </div>
            <span class="text-sm font-semibold text-gray-500">Completed</span>
        </div>
        <p class="text-2xl font-bold text-blue-600">{{ number_format($completedMatches) }}</p>
    </div>
</div>

<!-- Filters -->
<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
    <form action="{{ route('admin.matches') }}" method="GET">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div class="relative">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                <div class="relative">
                    <input type="text" name="search" value="{{ request('search') }}" placeholder="Search by pet or owner name..." class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pl-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
                    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-400">
                        <i data-lucide="search" class="w-4 h-4"></i>
                    </div>
                </div>
            </div>
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select name="status" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
                    <option value="">All Statuses</option>
                    <option value="pending" {{ request('status') == 'pending' ? 'selected' : '' }}>Pending</option>
                    <option value="accepted" {{ request('status') == 'accepted' ? 'selected' : '' }}>Accepted</option>
                    <option value="declined" {{ request('status') == 'declined' ? 'selected' : '' }}>Declined</option>
                    <option value="completed" {{ request('status') == 'completed' ? 'selected' : '' }}>Completed</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Date Range Preset</label>
                <select name="date_range" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
                    <option value="">All Time</option>
                    <option value="7" {{ request('date_range') == '7' ? 'selected' : '' }}>Last 7 Days</option>
                    <option value="30" {{ request('date_range') == '30' ? 'selected' : '' }}>Last 30 Days</option>
                    <option value="90" {{ request('date_range') == '90' ? 'selected' : '' }}>Last 90 Days</option>
                </select>
            </div>
        </div>
        <div class="flex gap-2">
            <button type="submit" class="px-6 py-2.5 bg-[#E75234] text-white rounded-lg text-sm font-semibold hover:bg-[#d14024] transition-all shadow-sm">
                Apply Filters
            </button>
            <a href="{{ route('admin.matches') }}" class="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all shadow-sm">
                Reset
            </a>
        </div>
    </form>
</div>

@include('admin.partials.date-filter')

<!-- Match List -->
<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    @if($matches->count() > 0)
    <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[900px]">
            <thead>
                <tr class="bg-[#E75234] text-white text-sm">
                    <th class="px-6 py-4 font-semibold">Match ID</th>
                    <th class="px-6 py-4 font-semibold">Requester Pet</th>
                    <th class="px-6 py-4 font-semibold">Target Pet</th>
                    <th class="px-6 py-4 font-semibold">Status</th>
                    <th class="px-6 py-4 font-semibold">Contract</th>
                    <th class="px-6 py-4 font-semibold">Requested</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 text-sm">
                @foreach($matches as $match)
                <tr class="hover:bg-orange-50/50 transition-colors">
                    <td class="px-6 py-4 font-mono text-xs text-gray-600">
                        MTH-{{ str_pad($match->id, 5, '0', STR_PAD_LEFT) }}
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            @if($match->requesterPet->photos->first())
                            <img src="{{ Storage::disk('do_spaces')->url($match->requesterPet->photos->first()->photo_url) }}" 
                                 class="w-10 h-10 rounded-full object-cover" alt="">
                            @else
                            <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <i data-lucide="paw-print" class="w-5 h-5 text-orange-500"></i>
                            </div>
                            @endif
                            <div>
                                <p class="font-medium text-gray-900">{{ $match->requesterPet->name }}</p>
                                <p class="text-xs text-gray-500">{{ $match->requesterPet->owner->name ?? 'Unknown' }}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            @if($match->targetPet->photos->first())
                            <img src="{{ Storage::disk('do_spaces')->url($match->targetPet->photos->first()->photo_url) }}" 
                                 class="w-10 h-10 rounded-full object-cover" alt="">
                            @else
                            <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <i data-lucide="paw-print" class="w-5 h-5 text-orange-500"></i>
                            </div>
                            @endif
                            <div>
                                <p class="font-medium text-gray-900">{{ $match->targetPet->name }}</p>
                                <p class="text-xs text-gray-500">{{ $match->targetPet->owner->name ?? 'Unknown' }}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        @php
                            $statusColors = [
                                'pending' => 'bg-yellow-100 text-yellow-700',
                                'accepted' => 'bg-green-100 text-green-700',
                                'declined' => 'bg-red-100 text-red-700',
                                'completed' => 'bg-blue-100 text-blue-700',
                            ];
                            $statusColor = $statusColors[$match->status] ?? 'bg-gray-100 text-gray-700';
                        @endphp
                        <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold {{ $statusColor }}">
                            {{ ucfirst($match->status) }}
                        </span>
                    </td>
                    <td class="px-6 py-4">
                        @if($match->conversation && $match->conversation->breedingContract)
                            @php
                                $contractStatus = $match->conversation->breedingContract->status;
                                $contractColors = [
                                    'draft' => 'bg-gray-100 text-gray-700',
                                    'pending_review' => 'bg-yellow-100 text-yellow-700',
                                    'accepted' => 'bg-green-100 text-green-700',
                                    'rejected' => 'bg-red-100 text-red-700',
                                ];
                                $contractColor = $contractColors[$contractStatus] ?? 'bg-gray-100 text-gray-700';
                            @endphp
                            <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold {{ $contractColor }}">
                                {{ ucfirst(str_replace('_', ' ', $contractStatus)) }}
                            </span>
                        @else
                            <span class="text-gray-400 text-xs">No contract</span>
                        @endif
                    </td>
                    <td class="px-6 py-4" title="{{ $match->created_at->format('M d, Y h:i A') }} ({{ $match->created_at->diffForHumans() }})">
                        <div class="flex flex-col">
                            <span class="text-sm font-medium text-gray-900">{{ $match->created_at->format('M d, Y') }}</span>
                            <span class="text-xs text-gray-500">{{ $match->created_at->format('h:i A') }}</span>
                        </div>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    
    <!-- Pagination -->
    <div class="px-6 py-4 border-t border-gray-100">
        {{ $matches->links() }}
    </div>
    @else
    <div class="p-12 text-center text-gray-500">
        <i data-lucide="history" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
        <p class="text-lg font-medium">No matches found</p>
        <p class="text-sm mt-2">Try adjusting your filters or check back later</p>
    </div>
    @endif
</div>
@endsection