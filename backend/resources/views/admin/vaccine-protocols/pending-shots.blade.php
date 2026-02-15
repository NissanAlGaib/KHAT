@extends('admin.layouts.app')

@section('title', 'Shot Verification - KHAT Admin')

@section('content')
<!-- Flash Message -->
@if(session('success'))
<div class="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
    <i data-lucide="check-circle" class="w-5 h-5 text-green-600 flex-shrink-0"></i>
    <p class="text-sm font-medium text-green-800">{{ session('success') }}</p>
</div>
@endif

@if(session('error'))
<div class="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
    <i data-lucide="alert-circle" class="w-5 h-5 text-red-600 flex-shrink-0"></i>
    <p class="text-sm font-medium text-red-800">{{ session('error') }}</p>
</div>
@endif

<!-- Header -->
<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
    <div>
        <div class="flex items-center gap-3">
            <h1 class="text-3xl font-bold text-gray-900">Vaccination Shot Verification</h1>
            <span class="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-[#E75234] text-white">
                {{ $pendingShots->total() }}
            </span>
        </div>
        <p class="text-sm text-gray-500 mt-1">Review and verify vaccination proof submissions from pet owners</p>
    </div>
</div>

<!-- Filter Section -->
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
    <form action="{{ route('admin.vaccination-shots.pending') }}" method="GET">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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

            <!-- Search -->
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                <div class="relative">
                    <input type="text" name="search" value="{{ request('search') }}" placeholder="Pet name, owner name..." class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pl-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-400">
                        <i data-lucide="search" class="w-4 h-4"></i>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-end gap-3">
                <button type="submit" class="px-6 py-2.5 bg-[#E75234] text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-[#d14024] transition-all hover:shadow-md">
                    Filter
                </button>
                <a href="{{ route('admin.vaccination-shots.pending') }}" class="px-6 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all shadow-sm">
                    Reset
                </a>
            </div>
        </div>
    </form>
</div>

<!-- Pending Shots -->
@if($pendingShots->count() > 0)
    <div class="space-y-4">
        @foreach($pendingShots as $shot)
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-amber-400 overflow-hidden">
            <div class="p-6">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Pet Info -->
                    <div>
                        <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pet Information</h3>
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {{ strtoupper(substr($shot->card->pet->name ?? 'P', 0, 1)) }}
                            </div>
                            <div>
                                <p class="font-semibold text-gray-900">{{ $shot->card->pet->name ?? 'Unknown Pet' }}</p>
                                <div class="flex items-center gap-2 mt-1">
                                    @if(($shot->card->pet->species ?? '') === 'dog')
                                        <span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">Dog</span>
                                    @elseif(($shot->card->pet->species ?? '') === 'cat')
                                        <span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800">Cat</span>
                                    @endif
                                    <span class="text-xs text-gray-500">{{ $shot->card->pet->breed ?? 'Unknown breed' }}</span>
                                </div>
                                <p class="text-xs text-gray-500 mt-1">
                                    <i data-lucide="user" class="w-3 h-3 inline-block mr-1"></i>
                                    Owner: {{ $shot->card->pet->owner->name ?? $shot->card->pet->owner->email ?? 'Unknown' }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Vaccine Info -->
                    <div>
                        <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Vaccine Details</h3>
                        <p class="font-semibold text-gray-900">{{ $shot->card->protocol->name ?? 'Unknown Protocol' }}</p>
                        <p class="text-sm text-gray-600 mt-1">
                            @if($shot->card->protocol && $shot->card->protocol->series_doses > 0)
                                @if($shot->is_booster)
                                    <span class="inline-flex items-center gap-1 text-blue-700">
                                        <i data-lucide="repeat" class="w-3.5 h-3.5"></i>
                                        Annual Booster
                                    </span>
                                @else
                                    <span class="inline-flex items-center gap-1 text-[#E75234]">
                                        <i data-lucide="list-ordered" class="w-3.5 h-3.5"></i>
                                        Dose {{ $shot->shot_number }} of {{ $shot->card->protocol->series_doses }}
                                    </span>
                                @endif
                            @else
                                <span class="inline-flex items-center gap-1 text-blue-700">
                                    <i data-lucide="repeat" class="w-3.5 h-3.5"></i>
                                    Recurring Shot
                                </span>
                            @endif
                        </p>
                        <div class="mt-2 space-y-1">
                            @if($shot->clinic_name)
                                <p class="text-xs text-gray-500"><span class="font-medium text-gray-600">Clinic:</span> {{ $shot->clinic_name }}</p>
                            @endif
                            @if($shot->veterinarian_name)
                                <p class="text-xs text-gray-500"><span class="font-medium text-gray-600">Vet:</span> {{ $shot->veterinarian_name }}</p>
                            @endif
                        </div>
                    </div>

                    <!-- Dates & Proof -->
                    <div>
                        <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Upload Details</h3>
                        <div class="space-y-1.5">
                            <p class="text-xs text-gray-500">
                                <span class="font-medium text-gray-600">Date Administered:</span>
                                {{ $shot->date_administered ? \Carbon\Carbon::parse($shot->date_administered)->format('M d, Y') : 'Not specified' }}
                            </p>
                            @if($shot->expiration_date)
                            <p class="text-xs text-gray-500">
                                <span class="font-medium text-gray-600">Expiration:</span>
                                {{ \Carbon\Carbon::parse($shot->expiration_date)->format('M d, Y') }}
                            </p>
                            @endif
                            <p class="text-xs text-gray-500">
                                <span class="font-medium text-gray-600">Uploaded:</span>
                                {{ $shot->created_at ? $shot->created_at->format('M d, Y g:i A') : 'Unknown' }}
                            </p>
                        </div>

                        @if($shot->vaccination_record)
                        <button type="button" onclick="viewDocument('{{ Storage::disk('do_spaces')->url($shot->vaccination_record) }}', 'Proof for {{ addslashes($shot->card->pet->name ?? 'Pet') }}')" class="mt-3 inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#E75234] bg-[#FDF4F2] rounded-lg hover:bg-orange-100 transition-colors">
                            <i data-lucide="file-text" class="w-4 h-4"></i>
                            View Proof Document
                        </button>
                        @else
                        <p class="mt-3 text-xs text-gray-400 italic">No proof document attached</p>
                        @endif
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
                    <form action="{{ route('admin.vaccination-shots.approve', $shot->shot_id) }}" method="POST" class="inline">
                        @csrf
                        <button type="submit" class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm">
                            <i data-lucide="check" class="w-4 h-4"></i>
                            Approve
                        </button>
                    </form>
                    <button type="button" onclick="rejectShot({{ $shot->shot_id }}, '{{ addslashes($shot->card->pet->name ?? 'this pet') }}')" class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                        <i data-lucide="x" class="w-4 h-4"></i>
                        Reject
                    </button>
                </div>
            </div>
        </div>
        @endforeach
    </div>

    <!-- Pagination -->
    <div class="mt-6">
        {{ $pendingShots->links() }}
    </div>
@else
    <!-- Empty State -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-16">
        <div class="flex flex-col items-center gap-4 text-center">
            <div class="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <i data-lucide="check-circle" class="w-10 h-10 text-green-500"></i>
            </div>
            <h2 class="text-xl font-bold text-gray-900">All caught up!</h2>
            <p class="text-sm text-gray-500 max-w-md">There are no pending vaccination shots to verify at the moment. New submissions will appear here automatically.</p>
        </div>
    </div>
@endif

@push('scripts')
<script>
    function rejectShot(shotId, petName) {
        Swal.fire({
            title: 'Reject Vaccination Shot?',
            html: `
                <p class="text-sm text-gray-600 mb-4">You are rejecting a vaccination shot for <strong>${petName}</strong>.</p>
                <div class="text-left">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Rejection Reason <span class="text-red-500">*</span></label>
                    <textarea id="rejection-reason" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" placeholder="Please provide a reason for rejection..."></textarea>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Reject Shot',
            cancelButtonText: 'Cancel',
            preConfirm: function() {
                var reason = document.getElementById('rejection-reason').value.trim();
                if (!reason) {
                    Swal.showValidationMessage('Please provide a rejection reason');
                    return false;
                }
                return reason;
            }
        }).then(function(result) {
            if (result.isConfirmed) {
                var form = document.createElement('form');
                form.method = 'POST';
                form.action = '/admin/vaccination-shots/' + shotId + '/reject';

                var csrf = document.createElement('input');
                csrf.type = 'hidden';
                csrf.name = '_token';
                csrf.value = document.querySelector('meta[name="csrf-token"]').content;
                form.appendChild(csrf);

                var reasonInput = document.createElement('input');
                reasonInput.type = 'hidden';
                reasonInput.name = 'rejection_reason';
                reasonInput.value = result.value;
                form.appendChild(reasonInput);

                document.body.appendChild(form);
                form.submit();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        lucide.createIcons();
    });
</script>
@endpush
@endsection
