@extends('admin.layouts.app')

@section('title', 'User Blocks - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-2">User Blocks</h1>
<p class="text-sm text-gray-500 mb-6">Monitor and manage user block actions</p>

<!-- Tabs -->
<div class="flex border-b border-gray-200 mb-6">
    <a href="{{ route('admin.reports') }}" class="px-6 py-3 text-sm font-semibold border-b-2 border-transparent text-gray-600 hover:text-gray-900 transition-colors">
        Reports
    </a>
    <a href="{{ route('admin.blocks') }}" class="px-6 py-3 text-sm font-semibold border-b-2 border-[#E75234] text-[#E75234] transition-colors">
        Blocks
    </a>
</div>

<!-- Search -->
<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
    <form action="{{ route('admin.blocks') }}" method="GET" class="flex gap-4">
        <div class="relative flex-1">
            <input type="text" name="search" value="{{ request('search') }}" placeholder="Search by user name..." class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pl-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-400">
                <i data-lucide="search" class="w-4 h-4"></i>
            </div>
        </div>
        <button type="submit" class="px-6 py-2.5 bg-[#E75234] text-white rounded-lg text-sm font-semibold hover:bg-[#d14024]">
            Search
        </button>
    </form>
</div>

<!-- Most Blocked Users -->
@if($mostBlocked->count() > 0)
<h3 class="text-sm font-semibold text-gray-700 mb-4">Most Blocked Users</h3>
<div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
    @foreach($mostBlocked as $entry)
    <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
        <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-lg mb-3">
            {{ strtoupper(substr($entry->blocked->name ?? '?', 0, 2)) }}
        </div>
        <p class="font-semibold text-gray-900 text-sm truncate w-full">{{ $entry->blocked->name ?? 'Unknown' }}</p>
        <p class="text-xs text-gray-500 truncate w-full mb-2">{{ $entry->blocked->email ?? '' }}</p>
        <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-red-50 text-red-600">
            {{ $entry->block_count }} Blocks
        </span>
    </div>
    @endforeach
</div>
@endif

<!-- Blocks Table -->
<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    @if($blocks->count() > 0)
    <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[800px]">
            <thead>
                <tr class="bg-[#E75234] text-white text-sm">
                    <th class="px-6 py-4 font-semibold">Blocker</th>
                    <th class="px-6 py-4 font-semibold">Blocked User</th>
                    <th class="px-6 py-4 font-semibold">Blocked On</th>
                    <th class="px-6 py-4 font-semibold">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 text-sm">
                @foreach($blocks as $block)
                <tr class="hover:bg-orange-50/50 transition-colors">
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold">
                                {{ substr($block->blocker->name ?? '?', 0, 2) }}
                            </div>
                            <div>
                                <p class="font-medium text-gray-900">{{ $block->blocker->name ?? 'Unknown' }}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 text-xs font-bold">
                                {{ substr($block->blocked->name ?? '?', 0, 2) }}
                            </div>
                            <div>
                                <p class="font-medium text-gray-900">{{ $block->blocked->name ?? 'Unknown' }}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4" title="{{ $block->created_at->format('M d, Y h:i A') }} ({{ $block->created_at->diffForHumans() }})">
                        <div class="flex flex-col">
                            <span class="text-sm font-medium text-gray-900">{{ $block->created_at->format('M d, Y') }}</span>
                            <span class="text-xs text-gray-500">{{ $block->created_at->format('h:i A') }}</span>
                            @if($block->updated_at && $block->created_at && $block->updated_at->gt($block->created_at))
                                <span class="text-[10px] text-gray-400 mt-1 italic" title="Updated {{ $block->updated_at->format('M d, Y h:i A') }}">
                                    Updated {{ $block->updated_at->diffForHumans() }}
                                    @if($block->updater)
                                        by {{ $block->updater->name }}
                                    @endif
                                </span>
                            @endif
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <button onclick="forceUnblock({{ $block->id }})" class="text-red-600 hover:text-red-800 font-semibold text-xs border border-red-200 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                            Remove Block
                        </button>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    
    <!-- Pagination -->
    <div class="px-6 py-4 border-t border-gray-100">
        {{ $blocks->links() }}
    </div>
    @else
    <div class="p-12 text-center text-gray-500">
        <i data-lucide="shield-check" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
        <p class="text-lg font-medium">No active blocks found</p>
    </div>
    @endif
</div>

@push('scripts')
<script>
    function forceUnblock(id) {
        Swal.fire({
            title: 'Remove Block?',
            text: "Are you sure you want to force remove this block?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#E75234',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, remove it'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`/admin/blocks/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                        'Accept': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if(data.success) {
                        Swal.fire(
                            'Removed!',
                            'The block has been removed.',
                            'success'
                        ).then(() => window.location.reload());
                    } else {
                        Swal.fire(
                            'Error!',
                            'Failed to remove block.',
                            'error'
                        );
                    }
                })
                .catch(err => {
                    console.error(err);
                    Swal.fire(
                        'Error!',
                        'An unexpected error occurred.',
                        'error'
                    );
                });
            }
        })
    }
</script>
@endpush
@endsection