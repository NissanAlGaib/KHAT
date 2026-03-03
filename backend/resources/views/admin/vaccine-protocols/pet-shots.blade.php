@extends('admin.layouts.app')

@section('title', 'Vaccination Shots - ' . $pet->name . ' - KHAT Admin')

@section('content')
<!-- Breadcrumb -->
<div class="flex items-center gap-2 text-sm text-gray-500 mb-4">
    <a href="{{ route('admin.pets.index') }}" class="hover:text-[#E75234] transition">
        <i data-lucide="arrow-left" class="w-4 h-4 inline"></i> Pet Management
    </a>
    <span>/</span>
    <a href="{{ route('admin.pets.details', $pet->pet_id) }}" class="hover:text-[#E75234] transition">{{ $pet->name }}</a>
    <span>/</span>
    <span class="text-gray-900 font-medium">Vaccination Shots</span>
</div>

<!-- Header -->
<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
    <div>
        <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {{ strtoupper(substr($pet->name, 0, 1)) }}
            </div>
            <div>
                <h1 class="text-2xl font-bold text-gray-900">{{ $pet->name }}'s Vaccination Shots</h1>
                <div class="flex items-center gap-2 mt-0.5">
                    @if($pet->species === 'dog')
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Dog</span>
                    @else
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Cat</span>
                    @endif
                    <span class="text-sm text-gray-500">{{ $pet->breed ?? 'Unknown breed' }}</span>
                    <span class="text-gray-300">·</span>
                    <span class="text-sm text-gray-500">Owner: {{ $pet->owner->name ?? $pet->owner->email ?? 'Unknown' }}</span>
                </div>
            </div>
        </div>
    </div>
    <a href="{{ route('admin.vaccination-shots.pending') }}" class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#E75234] bg-[#FFF5F2] rounded-lg hover:bg-orange-100 transition-colors border border-[#E75234]/10">
        <i data-lucide="clipboard-check" class="w-4 h-4"></i>
        Shot Verification Queue
    </a>
</div>

<!-- Stats Cards -->
<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <i data-lucide="syringe" class="w-5 h-5 text-blue-600"></i>
            </div>
            <div>
                <p class="text-2xl font-bold text-gray-900">{{ $totalShots }}</p>
                <p class="text-xs text-gray-500">Total Shots</p>
            </div>
        </div>
    </div>
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <i data-lucide="check-circle" class="w-5 h-5 text-green-600"></i>
            </div>
            <div>
                <p class="text-2xl font-bold text-green-600">{{ $approvedShots }}</p>
                <p class="text-xs text-gray-500">Approved</p>
            </div>
        </div>
    </div>
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <i data-lucide="clock" class="w-5 h-5 text-amber-600"></i>
            </div>
            <div>
                <p class="text-2xl font-bold text-amber-600">{{ $pendingShots }}</p>
                <p class="text-xs text-gray-500">Pending</p>
            </div>
        </div>
    </div>
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <i data-lucide="x-circle" class="w-5 h-5 text-red-600"></i>
            </div>
            <div>
                <p class="text-2xl font-bold text-red-600">{{ $rejectedShots }}</p>
                <p class="text-xs text-gray-500">Rejected</p>
            </div>
        </div>
    </div>
</div>

<!-- Vaccination Cards Overview -->
@if($cards->count() > 0)
<div class="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
    <div class="px-6 py-4 border-b border-gray-100">
        <h2 class="text-base font-bold text-gray-900">Vaccination Cards Overview</h2>
    </div>
    <div class="p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            @foreach($cards as $card)
            @php
            $completedCount = $card->shots->where('verification_status', 'approved')->count();
            $pendingCount = $card->shots->where('verification_status', 'pending')->count();
            $totalRequired = $card->protocol->series_doses ?? 0;
            $progress = $totalRequired > 0 ? min(100, round(($completedCount / $totalRequired) * 100)) : ($completedCount > 0 ? 100 : 0);
            $statusColor = $card->status === 'completed' ? 'green' : ($card->status === 'in_progress' ? 'blue' : ($card->status === 'overdue' ? 'red' : 'gray'));
            @endphp
            <div class="border border-gray-200 rounded-lg p-4 hover:border-[#E75234]/30 hover:shadow-sm transition-all">
                <div class="flex items-start justify-between mb-2">
                    <div>
                        <h3 class="text-sm font-semibold text-gray-900">{{ $card->protocol->name ?? $card->vaccine_name ?? 'Unknown' }}</h3>
                        <p class="text-xs text-gray-500 mt-0.5">{{ $card->protocol->description ?? '' }}</p>
                    </div>
                    @php
                    $badgeColors = [
                    'green' => 'bg-green-100 text-green-700',
                    'blue' => 'bg-blue-100 text-blue-700',
                    'red' => 'bg-red-100 text-red-700',
                    'gray' => 'bg-gray-100 text-gray-700',
                    ];
                    @endphp
                    <span class="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold {{ $badgeColors[$statusColor] ?? 'bg-gray-100 text-gray-700' }}">
                        {{ str_replace('_', ' ', ucfirst($card->status)) }}
                    </span>
                </div>
                <div class="mt-3">
                    <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>{{ $completedCount }} approved{{ $totalRequired > 0 ? " / {$totalRequired} required" : '' }}</span>
                        @if($pendingCount > 0)
                        <span class="text-amber-600 font-medium">{{ $pendingCount }} pending</span>
                        @endif
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-1.5">
                        <div class="h-1.5 rounded-full {{ $statusColor === 'green' ? 'bg-green-500' : ($statusColor === 'blue' ? 'bg-blue-500' : ($statusColor === 'red' ? 'bg-red-500' : 'bg-gray-400')) }}" style="width: {{ $progress }}%"></div>
                    </div>
                </div>
                <p class="text-[10px] text-gray-400 mt-2">{{ $card->shots->count() }} total shot{{ $card->shots->count() !== 1 ? 's' : '' }} uploaded</p>
            </div>
            @endforeach
        </div>
    </div>
</div>
@endif

<!-- Filter Bar -->
@include('admin.partials.filter-bar', [
'action' => route('admin.vaccination-shots.pet', $pet->pet_id),
'searchPlaceholder' => 'Search...',
'showSearch' => false,
'filters' => [
[
'name' => 'status',
'label' => 'Verification Status',
'options' => [
['value' => 'pending', 'label' => 'Pending'],
['value' => 'approved', 'label' => 'Approved'],
['value' => 'rejected', 'label' => 'Rejected'],
['value' => 'historical', 'label' => 'Historical'],
],
],
],
'dateFilter' => false,
'exports' => false,
'perPage' => true,
'defaultPerPage' => 15,
'totalResults' => $shots->total(),
])

<!-- Shots Table -->
<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    @if($shots->count() > 0)
    <div class="overflow-x-auto">
        <table class="w-full text-sm">
            <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                    <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vaccine</th>
                    <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dose</th>
                    <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Administered</th>
                    <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Clinic / Vet</th>
                    <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Proof</th>
                    <th class="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                @foreach($shots as $shot)
                @php
                $verStatusColors = [
                'approved' => 'bg-green-100 text-green-700 ring-green-600/20',
                'pending' => 'bg-amber-100 text-amber-700 ring-amber-600/20',
                'rejected' => 'bg-red-100 text-red-700 ring-red-600/20',
                'historical' => 'bg-gray-100 text-gray-600 ring-gray-500/20',
                ];
                $verClass = $verStatusColors[$shot->verification_status] ?? 'bg-gray-100 text-gray-600 ring-gray-500/20';
                $rowBorderColor = match($shot->verification_status) {
                'approved' => 'border-l-green-400',
                'pending' => 'border-l-amber-400',
                'rejected' => 'border-l-red-400',
                default => 'border-l-gray-300',
                };
                @endphp
                <tr class="hover:bg-gray-50 border-l-4 {{ $rowBorderColor }} transition-colors">
                    <td class="px-5 py-3.5">
                        <p class="font-semibold text-gray-900">{{ $shot->card->protocol->name ?? 'Unknown' }}</p>
                        @if($shot->card->protocol && $shot->card->protocol->category)
                        <p class="text-xs text-gray-400">{{ $shot->card->protocol->category->name }}</p>
                        @endif
                    </td>
                    <td class="px-5 py-3.5">
                        @if($shot->is_booster)
                        <span class="inline-flex items-center gap-1 text-xs font-medium text-blue-700">
                            <i data-lucide="repeat" class="w-3 h-3"></i> Booster
                        </span>
                        @else
                        <span class="text-sm text-gray-700">
                            Dose {{ $shot->shot_number }}
                            @if($shot->card->protocol && $shot->card->protocol->series_doses > 0)
                            <span class="text-gray-400">/ {{ $shot->card->protocol->series_doses }}</span>
                            @endif
                        </span>
                        @endif
                    </td>
                    <td class="px-5 py-3.5 text-gray-600">
                        {{ $shot->date_administered ? \Carbon\Carbon::parse($shot->date_administered)->format('M d, Y') : '—' }}
                        @if($shot->expiration_date)
                        <p class="text-xs text-gray-400 mt-0.5">Exp: {{ \Carbon\Carbon::parse($shot->expiration_date)->format('M d, Y') }}</p>
                        @endif
                    </td>
                    <td class="px-5 py-3.5">
                        @if($shot->clinic_name || $shot->veterinarian_name)
                        <p class="text-gray-700">{{ $shot->clinic_name ?? '—' }}</p>
                        @if($shot->veterinarian_name)
                        <p class="text-xs text-gray-400">Dr. {{ $shot->veterinarian_name }}</p>
                        @endif
                        @else
                        <span class="text-gray-300">—</span>
                        @endif
                    </td>
                    <td class="px-5 py-3.5">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset {{ $verClass }}">
                            {{ ucfirst($shot->verification_status) }}
                        </span>
                        @if($shot->verification_status === 'rejected' && $shot->rejection_reason)
                        <p class="text-xs text-red-500 mt-1 max-w-[180px] truncate" title="{{ $shot->rejection_reason }}">{{ $shot->rejection_reason }}</p>
                        @endif
                    </td>
                    <td class="px-5 py-3.5">
                        @if($shot->vaccination_record)
                        <button type="button" onclick="viewDocument('{{ Storage::disk('do_spaces')->url($shot->vaccination_record) }}', 'Proof — Dose {{ $shot->shot_number }}')" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#E75234] bg-[#FDF4F2] rounded-lg hover:bg-orange-100 transition-colors">
                            <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                            View
                        </button>
                        @else
                        <span class="text-xs text-gray-300 italic">No proof</span>
                        @endif
                    </td>
                    <td class="px-5 py-3.5">
                        @if($shot->verification_status === 'pending')
                        <div class="flex items-center gap-1.5">
                            <form action="{{ route('admin.vaccination-shots.approve', $shot->shot_id) }}" method="POST" class="inline">
                                @csrf
                                <button type="submit" class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors" title="Approve">
                                    <i data-lucide="check" class="w-3 h-3"></i>
                                </button>
                            </form>
                            <button type="button" onclick="rejectShot({{ $shot->shot_id }}, '{{ addslashes($pet->name) }}')" class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors" title="Reject">
                                <i data-lucide="x" class="w-3 h-3"></i>
                            </button>
                        </div>
                        @else
                        <span class="text-xs text-gray-300">—</span>
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <!-- Pagination -->
    <div class="px-5 py-3 border-t border-gray-100">
        {{ $shots->links() }}
    </div>
    @else
    <div class="p-12 text-center">
        <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <i data-lucide="syringe" class="w-8 h-8 text-gray-300"></i>
        </div>
        <h3 class="text-base font-semibold text-gray-600">No vaccination shots found</h3>
        <p class="text-sm text-gray-400 mt-1">This pet hasn't uploaded any vaccination records yet.</p>
    </div>
    @endif
</div>

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