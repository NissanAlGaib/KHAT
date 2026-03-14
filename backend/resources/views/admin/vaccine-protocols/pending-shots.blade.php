@extends('admin.layouts.app')

@section('title', 'Shot Verification - KHAT Admin')

@section('content')
<!-- Flash Messages -->
@if(session('success'))
<div class="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in-up">
    <div class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
        <i data-lucide="check-circle" class="w-4.5 h-4.5 text-green-600"></i>
    </div>
    <p class="text-sm font-medium text-green-800 flex-1">{{ session('success') }}</p>
    <button onclick="this.parentElement.remove()" class="text-green-400 hover:text-green-600 transition-colors">
        <i data-lucide="x" class="w-4 h-4"></i>
    </button>
</div>
@endif

@if(session('error'))
<div class="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in-up">
    <div class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
        <i data-lucide="alert-circle" class="w-4.5 h-4.5 text-red-600"></i>
    </div>
    <p class="text-sm font-medium text-red-800 flex-1">{{ session('error') }}</p>
    <button onclick="this.parentElement.remove()" class="text-red-400 hover:text-red-600 transition-colors">
        <i data-lucide="x" class="w-4 h-4"></i>
    </button>
</div>
@endif

<!-- Header -->
<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
    <div>
        <h1 class="text-2xl font-bold text-gray-900">Shot Verification</h1>
        <p class="text-sm text-gray-500 mt-1">Review and verify vaccination proof submissions from pet owners</p>
    </div>
    <div class="flex items-center gap-3">
        @if($pendingShots->total() > 0)
        <div class="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <span class="flex h-2.5 w-2.5 relative">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span class="text-sm font-semibold text-amber-800">{{ $pendingShots->total() }} awaiting review</span>
        </div>
        @endif
    </div>
</div>

<!-- Filter Section -->
@include('admin.partials.filter-bar', [
'action' => route('admin.vaccination-shots.pending'),
'searchPlaceholder' => 'Pet name, owner name...',
'filters' => [
[
'name' => 'species',
'label' => 'Species',
'options' => [
['value' => 'dog', 'label' => 'Dog'],
['value' => 'cat', 'label' => 'Cat'],
],
],
],
'dateFilter' => false,
'exports' => false,
'perPage' => true,
'defaultPerPage' => 10,
'totalResults' => $pendingShots->total(),
])

<!-- Pending Shots -->
@if($pendingShots->count() > 0)
<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <!-- Table Header (Desktop) -->
    <div class="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <div class="col-span-3">Pet & Owner</div>
        <div class="col-span-3">Vaccine Details</div>
        <div class="col-span-2">Date & Proof</div>
        <div class="col-span-2">Clinic Info</div>
        <div class="col-span-2 text-right">Actions</div>
    </div>

    <div class="divide-y divide-gray-100">
        @foreach($pendingShots as $shot)
        <div class="group hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-transparent transition-all duration-200">
            <!-- Desktop Layout -->
            <div class="hidden lg:grid lg:grid-cols-12 gap-4 items-center px-6 py-4">
                <!-- Pet & Owner -->
                <div class="col-span-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                            {{ strtoupper(substr($shot->card->pet->name ?? 'P', 0, 1)) }}
                        </div>
                        <div class="min-w-0">
                            <a href="{{ route('admin.vaccination-shots.pet', $shot->card->pet->pet_id ?? 0) }}" class="font-semibold text-gray-900 hover:text-[#E75234] transition-colors truncate block">
                                {{ $shot->card->pet->name ?? 'Unknown Pet' }}
                            </a>
                            <div class="flex items-center gap-1.5 mt-0.5">
                                @if(($shot->card->pet->species ?? '') === 'dog')
                                <span class="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700">DOG</span>
                                @elseif(($shot->card->pet->species ?? '') === 'cat')
                                <span class="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700">CAT</span>
                                @endif
                                <span class="text-xs text-gray-400 truncate">{{ $shot->card->pet->breed ?? '' }}</span>
                            </div>
                            <p class="text-[11px] text-gray-400 mt-0.5 truncate">
                                <i data-lucide="user" class="w-3 h-3 inline-block mr-0.5 -mt-0.5"></i>
                                {{ $shot->card->pet->owner->name ?? $shot->card->pet->owner->email ?? 'Unknown' }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Vaccine Details -->
                <div class="col-span-3">
                    <p class="font-semibold text-gray-900 text-sm">{{ $shot->card->protocol->name ?? 'Unknown Protocol' }}</p>
                    <div class="mt-1">
                        @if($shot->card->protocol && $shot->card->protocol->series_doses > 0)
                        @if($shot->is_booster)
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <i data-lucide="repeat" class="w-3 h-3"></i>
                            Annual Booster
                        </span>
                        @else
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FFF5F2] text-[#E75234] border border-[#E75234]/10">
                            <i data-lucide="list-ordered" class="w-3 h-3"></i>
                            Dose {{ $shot->shot_number }} of {{ $shot->card->protocol->series_doses }}
                        </span>
                        @endif
                        @else
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <i data-lucide="repeat" class="w-3 h-3"></i>
                            Recurring
                        </span>
                        @endif
                    </div>
                </div>

                <!-- Date & Proof -->
                <div class="col-span-2">
                    <p class="text-sm text-gray-700">
                        {{ $shot->date_administered ? \Carbon\Carbon::parse($shot->date_administered)->format('M d, Y') : 'Not specified' }}
                    </p>
                    @if($shot->expiration_date)
                    <p class="text-[11px] text-gray-400 mt-0.5">
                        Exp: {{ \Carbon\Carbon::parse($shot->expiration_date)->format('M d, Y') }}
                    </p>
                    @endif
                    <p class="text-[11px] text-gray-400 mt-1">
                        Submitted {{ $shot->created_at ? $shot->created_at->diffForHumans() : '' }}
                    </p>

                    @if($shot->vaccination_record)
                    <button type="button" onclick="viewDocument('{{ Storage::disk('do_spaces')->url($shot->vaccination_record) }}', 'Proof for {{ addslashes($shot->card->pet->name ?? 'Pet') }}')" class="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-[#E75234] bg-[#FDF4F2] rounded-md hover:bg-orange-100 transition-colors border border-[#E75234]/10">
                        <i data-lucide="file-text" class="w-3 h-3"></i>
                        View Proof
                    </button>
                    @else
                    <p class="mt-2 text-[11px] text-gray-300 italic">No proof attached</p>
                    @endif
                </div>

                <!-- Clinic Info -->
                <div class="col-span-2">
                    @if($shot->clinic_name)
                    <p class="text-sm text-gray-700">{{ $shot->clinic_name }}</p>
                    @endif
                    @if($shot->veterinarian_name)
                    <p class="text-xs text-gray-400">Dr. {{ $shot->veterinarian_name }}</p>
                    @endif
                    @if(!$shot->clinic_name && !$shot->veterinarian_name)
                    <span class="text-xs text-gray-300 italic">Not provided</span>
                    @endif
                </div>

                <!-- Actions -->
                <div class="col-span-2 flex items-center justify-end gap-2">
                    <form action="{{ route('admin.vaccination-shots.approve', $shot->shot_id) }}" method="POST" class="inline" data-confirm="Approve this vaccination shot for {{ $shot->card->pet->name ?? 'this pet' }}?" data-confirm-title="Approve Shot" data-confirm-icon="question" data-confirm-btn="Yes, approve">
                        @csrf
                        <button type="submit" class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 active:bg-green-800 transition-all shadow-sm hover:shadow">
                            <i data-lucide="check" class="w-3.5 h-3.5"></i>
                            Approve
                        </button>
                    </form>
                    <button type="button" onclick="rejectShot({{ $shot->shot_id }}, '{{ addslashes($shot->card->pet->name ?? 'this pet') }}')" class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:text-red-700 active:bg-red-200 transition-all">
                        <i data-lucide="x" class="w-3.5 h-3.5"></i>
                        Reject
                    </button>
                </div>
            </div>

            <!-- Mobile / Tablet Layout -->
            <div class="lg:hidden p-4 space-y-4">
                <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                        {{ strtoupper(substr($shot->card->pet->name ?? 'P', 0, 1)) }}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                            <a href="{{ route('admin.vaccination-shots.pet', $shot->card->pet->pet_id ?? 0) }}" class="font-semibold text-gray-900 hover:text-[#E75234] transition-colors">
                                {{ $shot->card->pet->name ?? 'Unknown Pet' }}
                            </a>
                            @if(($shot->card->pet->species ?? '') === 'dog')
                            <span class="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700">DOG</span>
                            @elseif(($shot->card->pet->species ?? '') === 'cat')
                            <span class="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700">CAT</span>
                            @endif
                        </div>
                        <p class="text-xs text-gray-400">{{ $shot->card->pet->breed ?? '' }} · {{ $shot->card->pet->owner->name ?? 'Unknown owner' }}</p>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Vaccine</p>
                        <p class="font-semibold text-gray-900">{{ $shot->card->protocol->name ?? 'Unknown' }}</p>
                        <div class="mt-1">
                            @if($shot->is_booster)
                            <span class="text-[11px] font-medium text-blue-700">Annual Booster</span>
                            @elseif($shot->card->protocol && $shot->card->protocol->series_doses > 0)
                            <span class="text-[11px] font-medium text-[#E75234]">Dose {{ $shot->shot_number }} / {{ $shot->card->protocol->series_doses }}</span>
                            @endif
                        </div>
                    </div>
                    <div>
                        <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Date</p>
                        <p class="text-gray-700">{{ $shot->date_administered ? \Carbon\Carbon::parse($shot->date_administered)->format('M d, Y') : 'N/A' }}</p>
                        <p class="text-[11px] text-gray-400 mt-0.5">{{ $shot->created_at ? $shot->created_at->diffForHumans() : '' }}</p>
                    </div>
                </div>

                @if($shot->clinic_name || $shot->veterinarian_name)
                <div class="text-sm">
                    <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Clinic</p>
                    <p class="text-gray-700">{{ $shot->clinic_name ?? '' }} {{ $shot->veterinarian_name ? '· Dr. ' . $shot->veterinarian_name : '' }}</p>
                </div>
                @endif

                <div class="flex items-center gap-2 pt-2 border-t border-gray-100">
                    @if($shot->vaccination_record)
                    <button type="button" onclick="viewDocument('{{ Storage::disk('do_spaces')->url($shot->vaccination_record) }}', 'Proof for {{ addslashes($shot->card->pet->name ?? 'Pet') }}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#E75234] bg-[#FDF4F2] rounded-lg hover:bg-orange-100 transition-colors flex-shrink-0">
                        <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                        Proof
                    </button>
                    @endif
                    <div class="flex-1"></div>
                    <form action="{{ route('admin.vaccination-shots.approve', $shot->shot_id) }}" method="POST" class="inline">
                        @csrf
                        <button type="submit" class="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm">
                            <i data-lucide="check" class="w-3.5 h-3.5"></i>
                            Approve
                        </button>
                    </form>
                    <button type="button" onclick="rejectShot({{ $shot->shot_id }}, '{{ addslashes($shot->card->pet->name ?? 'this pet') }}')" class="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                        <i data-lucide="x" class="w-3.5 h-3.5"></i>
                        Reject
                    </button>
                </div>
            </div>
        </div>
        @endforeach
    </div>
</div>

<!-- Pagination -->
<div class="mt-6">
    {{ $pendingShots->links() }}
</div>
@else
<!-- Empty State -->
<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="py-16 px-8">
        <div class="flex flex-col items-center gap-4 text-center max-w-sm mx-auto">
            <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center">
                <i data-lucide="check-circle" class="w-10 h-10 text-green-500"></i>
            </div>
            <div>
                <h2 class="text-xl font-bold text-gray-900">All caught up!</h2>
                <p class="text-sm text-gray-500 mt-2 leading-relaxed">There are no pending vaccination shots to verify at the moment. New submissions will appear here automatically.</p>
            </div>
            <a href="{{ route('admin.pets.index') }}" class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#E75234] hover:bg-[#FFF5F2] rounded-lg transition-colors mt-2">
                <i data-lucide="arrow-left" class="w-4 h-4"></i>
                Back to Pet Management
            </a>
        </div>
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