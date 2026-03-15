@extends('admin.layouts.app')

@section('title', 'Subscription Tiers - KHAT Admin')

@section('content')
<!-- Flash Messages -->
@if(session('success'))
<div class="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
    <i data-lucide="check-circle" class="w-5 h-5 text-green-600 flex-shrink-0"></i>
    <p class="text-sm font-medium text-green-800">{{ session('success') }}</p>
</div>
@endif

@if($errors->any())
<div class="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
    <div class="flex items-center gap-3 mb-2">
        <i data-lucide="alert-circle" class="w-5 h-5 text-red-600 flex-shrink-0"></i>
        <p class="text-sm font-semibold text-red-800">Please fix the following errors:</p>
    </div>
    <ul class="list-disc list-inside text-sm text-red-700 ml-8 space-y-1">
        @foreach($errors->all() as $error)
        <li>{{ $error }}</li>
        @endforeach
    </ul>
</div>
@endif

<!-- Header -->
<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
    <div>
        <h1 class="text-3xl font-bold text-gray-900">Subscription Tiers</h1>
        <p class="text-sm text-gray-500 mt-1">Manage subscription plans, pricing, and feature limits</p>
    </div>
    <div class="flex gap-2">
        <button onclick="openCreateModal()" class="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#E75234] to-[#d14024] text-white text-sm font-semibold rounded-lg hover:shadow-md transition-all shadow-sm">
            <i data-lucide="plus" class="w-4 h-4"></i>
            New Tier
        </button>
    </div>
</div>

@include('admin.partials.filter-bar', [
    'action' => route('admin.subscription-tiers.index'),
    'searchPlaceholder' => 'Search by name or slug...',
    'filters' => [
        [
            'name' => 'status',
            'label' => 'Status',
            'placeholder' => 'All Statuses',
            'options' => [
                ['value' => 'active', 'label' => 'Active'],
                ['value' => 'inactive', 'label' => 'Inactive'],
            ],
        ],
    ],
    'exports' => [
        ['label' => 'CSV', 'icon' => 'file-spreadsheet', 'params' => ['export' => 'csv'], 'color' => 'green'],
        ['label' => 'PDF', 'icon' => 'file-text', 'params' => ['export' => 'pdf'], 'color' => 'red'],
    ],
    'perPage' => false,
    'totalResults' => $tiers->count(),
])

<!-- Tiers Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
    @forelse($tiers as $tier)
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow {{ !$tier->is_active ? 'opacity-60' : '' }}">
        <!-- Card Header -->
        <div class="px-6 pt-6 pb-4">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <h3 class="text-lg font-bold text-gray-900">{{ $tier->name }}</h3>
                    <p class="text-xs text-gray-400 font-mono">{{ $tier->slug }}</p>
                </div>
                @if($tier->is_active)
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                    <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Active
                </span>
                @else
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                    <span class="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                    Inactive
                </span>
                @endif
            </div>
            <div class="flex items-baseline gap-1 mb-1">
                <span class="text-3xl font-extrabold text-gray-900">₱{{ number_format($tier->price, 2) }}</span>
                <span class="text-sm text-gray-400">/ {{ $tier->duration_days }} days</span>
            </div>
        </div>

        <!-- Feature Limits -->
        <div class="px-6 pb-4 space-y-3">
            <div class="flex items-center justify-between py-2 border-t border-gray-100">
                <div class="flex items-center gap-2 text-sm text-gray-600">
                    <i data-lucide="heart" class="w-4 h-4 text-[#E75234]"></i>
                    Max Pets
                </div>
                <span class="text-sm font-semibold text-gray-900">
                    {{ $tier->max_pets === null ? '∞ Unlimited' : $tier->max_pets }}
                </span>
            </div>
            <div class="flex items-center justify-between py-2 border-t border-gray-100">
                <div class="flex items-center gap-2 text-sm text-gray-600">
                    <i data-lucide="git-merge" class="w-4 h-4 text-[#E75234]"></i>
                    Matches / Month
                </div>
                <span class="text-sm font-semibold text-gray-900">
                    {{ $tier->max_matches === null ? '∞ Unlimited' : $tier->max_matches }}
                </span>
            </div>
            <div class="flex items-center justify-between py-2 border-t border-gray-100">
                <div class="flex items-center gap-2 text-sm text-gray-600">
                    <i data-lucide="sparkles" class="w-4 h-4 text-[#E75234]"></i>
                    AI / Day
                </div>
                <span class="text-sm font-semibold text-gray-900">
                    {{ $tier->max_ai_generations === null ? '∞ Unlimited' : $tier->max_ai_generations }}
                </span>
            </div>
        </div>

        <!-- Card Actions -->
        @php
            $tierData = json_encode([
                'name' => $tier->name,
                'slug' => $tier->slug,
                'price' => $tier->price,
                'duration_days' => $tier->duration_days,
                'is_active' => $tier->is_active,
                'max_pets' => $tier->max_pets,
                'max_matches' => $tier->max_matches,
                'max_ai_generations' => $tier->max_ai_generations,
            ]);
        @endphp
        <div class="flex items-center border-t border-gray-100 divide-x divide-gray-100">
            <button onclick='openEditModal({{ $tier->id }}, {!! $tierData !!})'
                class="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-[#E75234] transition-colors">
                <i data-lucide="pencil" class="w-4 h-4"></i>
                Edit
            </button>
            <button onclick="toggleTierStatus({{ $tier->id }}, {{ $tier->is_active ? 'true' : 'false' }}, '{{ $tier->name }}')"
                class="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium {{ $tier->is_active ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50' }} transition-colors">
                <i data-lucide="{{ $tier->is_active ? 'pause-circle' : 'play-circle' }}" class="w-4 h-4"></i>
                {{ $tier->is_active ? 'Disable' : 'Enable' }}
            </button>
            <form id="delete-tier-{{ $tier->id }}" action="{{ route('admin.subscription-tiers.destroy', $tier->id) }}" method="POST" class="flex-1">
                @csrf
                @method('DELETE')
                <button type="button" onclick="deleteTier({{ $tier->id }}, '{{ $tier->name }}')"
                    class="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                    Delete
                </button>
            </form>
        </div>
    </div>
    @empty
    <div class="col-span-full">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
            <i data-lucide="credit-card" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
            <p class="text-base font-medium text-gray-500 mb-2">No subscription tiers found</p>
            <p class="text-sm text-gray-400 mb-6">Create your first tier to get started</p>
            <button onclick="openCreateModal()" class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#E75234] to-[#d14024] text-white text-sm font-semibold rounded-lg hover:shadow-md transition-all">
                <i data-lucide="plus" class="w-4 h-4"></i>
                Create Tier
            </button>
        </div>
    </div>
    @endforelse
</div>

<!-- Hidden forms for toggle status -->
@foreach($tiers as $tier)
<form id="toggle-tier-{{ $tier->id }}" action="{{ route('admin.subscription-tiers.update', $tier->id) }}" method="POST" class="hidden">
    @csrf
    @method('PUT')
    <input type="hidden" name="name" value="{{ $tier->name }}">
    <input type="hidden" name="price" value="{{ $tier->price }}">
    <input type="hidden" name="duration_days" value="{{ $tier->duration_days }}">
    <input type="hidden" name="max_pets" value="{{ $tier->max_pets }}">
    <input type="hidden" name="max_matches" value="{{ $tier->max_matches }}">
    <input type="hidden" name="max_ai_generations" value="{{ $tier->max_ai_generations }}">
    <input type="hidden" name="is_active" value="{{ $tier->is_active ? '0' : '1' }}">
</form>
@endforeach

<!-- Create Tier Modal -->
<div id="createTierModal" class="fixed inset-0 z-50 hidden">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" onclick="closeCreateModal()"></div>
    <div class="fixed inset-0 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <div>
                    <h2 class="text-xl font-bold text-gray-900">Create Subscription Tier</h2>
                    <p class="text-sm text-gray-500 mt-0.5">Set up a new subscription plan</p>
                </div>
                <button type="button" onclick="closeCreateModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>

            <!-- Body -->
            <div class="overflow-y-auto flex-1 px-6 py-5">
                <form id="createTierForm" method="POST" action="{{ route('admin.subscription-tiers.store') }}">
                    @csrf

                    <div class="grid grid-cols-2 gap-4 mb-5">
                        <div>
                            <label for="create_name" class="block text-sm font-semibold text-gray-700 mb-2">Tier Name <span class="text-red-500">*</span></label>
                            <input type="text" name="name" id="create_name" required placeholder="e.g. Basic" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                        </div>
                        <div>
                            <label for="create_slug" class="block text-sm font-semibold text-gray-700 mb-2">Slug <span class="text-red-500">*</span></label>
                            <input type="text" name="slug" id="create_slug" required placeholder="e.g. basic" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition font-mono">
                            <p class="mt-1 text-xs text-gray-400">Lowercase, no spaces (e.g. basic, premium)</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-5">
                        <div>
                            <label for="create_price" class="block text-sm font-semibold text-gray-700 mb-2">Price (₱) <span class="text-red-500">*</span></label>
                            <div class="relative">
                                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">₱</span>
                                <input type="number" step="0.01" name="price" id="create_price" required min="0" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 pl-8 pr-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                            </div>
                        </div>
                        <div>
                            <label for="create_duration" class="block text-sm font-semibold text-gray-700 mb-2">Duration (Days) <span class="text-red-500">*</span></label>
                            <input type="number" name="duration_days" id="create_duration" required min="1" value="30" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                        </div>
                    </div>

                    <div class="border-t border-gray-200 pt-5 mb-5">
                        <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <i data-lucide="sliders" class="w-4 h-4 text-[#E75234]"></i>
                            Feature Limits
                        </h4>
                        <p class="text-xs text-gray-400 mb-4">Leave blank for unlimited</p>

                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label for="create_max_pets" class="block text-xs font-medium text-gray-600 mb-1.5">Max Pets</label>
                                <input type="number" name="max_pets" id="create_max_pets" min="1" placeholder="∞" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition text-center">
                            </div>
                            <div>
                                <label for="create_max_matches" class="block text-xs font-medium text-gray-600 mb-1.5">Matches/Mo</label>
                                <input type="number" name="max_matches" id="create_max_matches" min="1" placeholder="∞" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition text-center">
                            </div>
                            <div>
                                <label for="create_max_ai" class="block text-xs font-medium text-gray-600 mb-1.5">AI/Day</label>
                                <input type="number" name="max_ai_generations" id="create_max_ai" min="1" placeholder="∞" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition text-center">
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <button type="button" onclick="closeCreateModal()" class="px-5 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all">
                    Cancel
                </button>
                <button type="button" onclick="document.getElementById('createTierForm').submit()" class="px-6 py-2.5 bg-gradient-to-r from-[#E75234] to-[#d14024] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all inline-flex items-center gap-2">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    Create Tier
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Edit Tier Modal -->
<div id="editTierModal" class="fixed inset-0 z-50 hidden">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" onclick="closeEditModal()"></div>
    <div class="fixed inset-0 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <div>
                    <h2 class="text-xl font-bold text-gray-900">Edit Subscription Tier</h2>
                    <p class="text-sm text-gray-500 mt-0.5" id="editModalSubtitle">Update plan limits and pricing</p>
                </div>
                <button type="button" onclick="closeEditModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>

            <!-- Body -->
            <div class="overflow-y-auto flex-1 px-6 py-5">
                <form id="editTierForm" method="POST">
                    @csrf
                    @method('PUT')

                    <!-- Name -->
                    <div class="mb-5">
                        <label for="edit_name" class="block text-sm font-semibold text-gray-700 mb-2">Tier Name <span class="text-red-500">*</span></label>
                        <input type="text" name="name" id="edit_name" required class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-5">
                        <div>
                            <label for="edit_price" class="block text-sm font-semibold text-gray-700 mb-2">Price (₱) <span class="text-red-500">*</span></label>
                            <div class="relative">
                                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">₱</span>
                                <input type="number" step="0.01" name="price" id="edit_price" required class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 pl-8 pr-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                            </div>
                        </div>
                        <div>
                            <label for="edit_duration" class="block text-sm font-semibold text-gray-700 mb-2">Duration (Days) <span class="text-red-500">*</span></label>
                            <input type="number" name="duration_days" id="edit_duration" required min="1" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                        </div>
                    </div>

                    <div class="border-t border-gray-200 pt-5 mb-5">
                        <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <i data-lucide="sliders" class="w-4 h-4 text-[#E75234]"></i>
                            Feature Limits
                        </h4>
                        <p class="text-xs text-gray-400 mb-4">Leave blank for unlimited</p>

                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label for="edit_max_pets" class="block text-xs font-medium text-gray-600 mb-1.5">Max Pets</label>
                                <input type="number" name="max_pets" id="edit_max_pets" min="1" placeholder="∞" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition text-center">
                            </div>
                            <div>
                                <label for="edit_max_matches" class="block text-xs font-medium text-gray-600 mb-1.5">Matches/Mo</label>
                                <input type="number" name="max_matches" id="edit_max_matches" min="1" placeholder="∞" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition text-center">
                            </div>
                            <div>
                                <label for="edit_max_ai" class="block text-xs font-medium text-gray-600 mb-1.5">AI/Day</label>
                                <input type="number" name="max_ai_generations" id="edit_max_ai" min="1" placeholder="∞" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition text-center">
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <button type="button" onclick="closeEditModal()" class="px-5 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all">
                    Cancel
                </button>
                <button type="button" onclick="document.getElementById('editTierForm').submit()" class="px-6 py-2.5 bg-gradient-to-r from-[#E75234] to-[#d14024] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all inline-flex items-center gap-2">
                    <i data-lucide="save" class="w-4 h-4"></i>
                    Save Changes
                </button>
            </div>
        </div>
    </div>
</div>

@endsection

@push('scripts')
<script>
    document.addEventListener('DOMContentLoaded', function() {
        lucide.createIcons();
    });

    // Auto-generate slug from name in create modal
    document.getElementById('create_name').addEventListener('input', function() {
        const slug = this.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        document.getElementById('create_slug').value = slug;
    });

    // ── Create Modal ──────────────────────────
    function openCreateModal() {
        document.getElementById('createTierModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        document.getElementById('createTierForm').reset();
        document.getElementById('create_duration').value = 30;
        setTimeout(() => {
            lucide.createIcons();
            document.getElementById('create_name').focus();
        }, 100);
    }

    function closeCreateModal() {
        document.getElementById('createTierModal').classList.add('hidden');
        document.body.style.overflow = '';
    }

    // ── Edit Modal ────────────────────────────
    function openEditModal(id, data) {
        const modal = document.getElementById('editTierModal');
        const form = document.getElementById('editTierForm');

        document.getElementById('editModalSubtitle').textContent = 'Update limits for ' + data.name;
        form.action = '/admin/subscription-tiers/' + id;

        document.getElementById('edit_name').value = data.name;
        document.getElementById('edit_price').value = data.price;
        document.getElementById('edit_duration').value = data.duration_days;
        document.getElementById('edit_max_pets').value = data.max_pets || '';
        document.getElementById('edit_max_matches').value = data.max_matches || '';
        document.getElementById('edit_max_ai').value = data.max_ai_generations || '';

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        setTimeout(() => lucide.createIcons(), 100);
    }

    function closeEditModal() {
        document.getElementById('editTierModal').classList.add('hidden');
        document.body.style.overflow = '';
    }

    // ── Toggle Active Status ──────────────────
    function toggleTierStatus(tierId, isCurrentlyActive, tierName) {
        const action = isCurrentlyActive ? 'disable' : 'enable';
        PawConfirm(
            (isCurrentlyActive ? 'Disable' : 'Enable') + ' Tier?',
            'Are you sure you want to ' + action + ' the "' + tierName + '" tier?',
            isCurrentlyActive ? 'warning' : 'question',
            'Yes, ' + action + ' it'
        ).then(result => {
            if (result.isConfirmed) {
                document.getElementById('toggle-tier-' + tierId).submit();
            }
        });
    }

    // ── Delete Tier ───────────────────────────
    function deleteTier(tierId, tierName) {
        PawConfirm(
            'Delete Tier?',
            'Permanently delete the "' + tierName + '" tier? This cannot be undone.',
            'warning',
            'Yes, delete it'
        ).then(result => {
            if (result.isConfirmed) {
                document.getElementById('delete-tier-' + tierId).submit();
            }
        });
    }

    // Close modals on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCreateModal();
            closeEditModal();
        }
    });
</script>
@endpush