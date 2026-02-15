@extends('admin.layouts.app')

@section('title', 'Subscription Tiers - KHAT Admin')

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
        <h1 class="text-3xl font-bold text-gray-900">Subscription Tiers</h1>
        <p class="text-sm text-gray-500 mt-1">Manage subscription plans and feature limits</p>
    </div>
</div>

<!-- Tiers Table -->
<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[1000px]">
            <thead>
                <tr class="bg-[#E75234] text-white text-sm">
                    <th class="px-6 py-4 font-semibold">Name</th>
                    <th class="px-6 py-4 font-semibold">Price</th>
                    <th class="px-6 py-4 font-semibold">Max Pets</th>
                    <th class="px-6 py-4 font-semibold">Max Matches</th>
                    <th class="px-6 py-4 font-semibold">AI Limit</th>
                    <th class="px-6 py-4 font-semibold text-center">Status</th>
                    <th class="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 text-sm">
                @forelse($tiers as $tier)
                <tr class="hover:bg-orange-50/50 transition-colors">
                    <td class="px-6 py-4 font-medium text-gray-900">{{ $tier->name }}</td>
                    <td class="px-6 py-4 text-gray-700">
                        {{ number_format($tier->price, 2) }}
                    </td>
                    <td class="px-6 py-4 text-gray-700">
                        {{ $tier->max_pets === null ? 'Unlimited' : $tier->max_pets }}
                    </td>
                    <td class="px-6 py-4 text-gray-700">
                        {{ $tier->max_matches === null ? 'Unlimited' : $tier->max_matches }}
                    </td>
                    <td class="px-6 py-4 text-gray-700">
                        {{ $tier->max_ai_generations === null ? 'Unlimited' : $tier->max_ai_generations }}
                    </td>
                    <td class="px-6 py-4 text-center">
                        @if($tier->is_active)
                            <span class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">Active</span>
                        @else
                            <span class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">Inactive</span>
                        @endif
                    </td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="openEditModal(this)"
                            data-id="{{ $tier->id }}"
                            data-name="{{ $tier->name }}"
                            data-price="{{ $tier->price }}"
                            data-max-pets="{{ $tier->max_pets }}"
                            data-max-matches="{{ $tier->max_matches }}"
                            data-max-ai="{{ $tier->max_ai_generations }}"
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                            Edit
                        </button>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="7" class="px-6 py-16 text-center">
                        <div class="flex flex-col items-center gap-3 text-gray-400">
                            <i data-lucide="credit-card" class="w-16 h-16 text-gray-300"></i>
                            <p class="text-base font-medium text-gray-500">No subscription tiers found</p>
                        </div>
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<!-- Edit Tier Modal -->
<div id="editTierModal" class="fixed inset-0 z-50 hidden">
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" onclick="closeEditModal()"></div>
    <div class="fixed inset-0 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
            <!-- Modal Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <div>
                    <h2 class="text-xl font-bold text-gray-900">Edit Subscription Tier</h2>
                    <p class="text-sm text-gray-500 mt-0.5" id="editModalSubtitle">Update plan limits and pricing</p>
                </div>
                <button type="button" onclick="closeEditModal()" class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>

            <!-- Modal Body -->
            <div class="overflow-y-auto flex-1 px-6 py-5">
                <form id="editTierForm" method="POST">
                    @csrf
                    @method('PUT')
                    
                    <!-- Price -->
                    <div class="mb-5">
                        <label for="edit_price" class="block text-sm font-semibold text-gray-700 mb-2">Price</label>
                        <div class="relative">
                            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                            <input type="number" step="0.01" name="price" id="edit_price" required class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 pl-8 pr-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                        </div>
                    </div>

                    <!-- Max Pets -->
                    <div class="mb-5">
                        <label for="edit_max_pets" class="block text-sm font-semibold text-gray-700 mb-2">Max Pets</label>
                        <input type="number" name="max_pets" id="edit_max_pets" placeholder="Leave empty for Unlimited" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                        <p class="mt-1 text-xs text-gray-500">Leave blank for unlimited pets</p>
                    </div>

                    <!-- Max Matches -->
                    <div class="mb-5">
                        <label for="edit_max_matches" class="block text-sm font-semibold text-gray-700 mb-2">Max Matches</label>
                        <input type="number" name="max_matches" id="edit_max_matches" placeholder="Leave empty for Unlimited" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                        <p class="mt-1 text-xs text-gray-500">Leave blank for unlimited matches</p>
                    </div>

                    <!-- Max AI Generations -->
                    <div class="mb-5">
                        <label for="edit_max_ai_generations" class="block text-sm font-semibold text-gray-700 mb-2">Max AI Generations</label>
                        <input type="number" name="max_ai_generations" id="edit_max_ai_generations" placeholder="Leave empty for Unlimited" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                        <p class="mt-1 text-xs text-gray-500">Leave blank for unlimited AI generations</p>
                    </div>
                </form>
            </div>

            <!-- Modal Footer -->
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

    function openEditModal(btn) {
        const modal = document.getElementById('editTierModal');
        const form = document.getElementById('editTierForm');
        
        // Get data
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        const price = btn.getAttribute('data-price');
        const maxPets = btn.getAttribute('data-max-pets');
        const maxMatches = btn.getAttribute('data-max-matches');
        const maxAi = btn.getAttribute('data-max-ai');

        // Update UI
        document.getElementById('editModalSubtitle').textContent = `Update limits for ${name}`;
        
        // Set form action
        form.action = `/admin/subscription-tiers/${id}`;

        // Set values
        document.getElementById('edit_price').value = price;
        document.getElementById('edit_max_pets').value = maxPets === '' ? '' : maxPets;
        document.getElementById('edit_max_matches').value = maxMatches === '' ? '' : maxMatches;
        document.getElementById('edit_max_ai_generations').value = maxAi === '' ? '' : maxAi;

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeEditModal() {
        const modal = document.getElementById('editTierModal');
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // Close on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeEditModal();
    });
</script>
@endpush
