@extends('admin.layouts.app')

@section('title', 'Pool Disputes - KHAT Admin')

@section('content')
<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
    <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Pool Disputes</h1>
        <p class="text-sm text-gray-500">Manage and resolve payment disputes across contracts</p>
    </div>
    <div class="flex gap-2 mt-4 sm:mt-0">
        <a href="{{ route('admin.pool.dashboard') }}" class="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
            Back to Pool
        </a>
    </div>
</div>

<!-- Filters -->
<div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
    <form method="GET" action="{{ route('admin.pool.disputes') }}" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
            <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Status</label>
            <select name="status" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]/20">
                <option value="">All Statuses</option>
                <option value="open" {{ request('status') == 'open' ? 'selected' : '' }}>Open</option>
                <option value="under_review" {{ request('status') == 'under_review' ? 'selected' : '' }}>Under Review</option>
                <option value="resolved" {{ request('status') == 'resolved' ? 'selected' : '' }}>Resolved</option>
                <option value="dismissed" {{ request('status') == 'dismissed' ? 'selected' : '' }}>Dismissed</option>
            </select>
        </div>
        <div>
            <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Contract ID</label>
            <input type="number" name="contract_id" value="{{ request('contract_id') }}" placeholder="e.g. 42" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]/20">
        </div>
        <div>
            <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Search Reason</label>
            <input type="text" name="search" value="{{ request('search') }}" placeholder="Search reason..." class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]/20">
        </div>
        <div class="flex items-end gap-2">
            <button type="submit" class="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                <i data-lucide="search" class="w-4 h-4 inline mr-1"></i> Filter
            </button>
            <a href="{{ route('admin.pool.disputes') }}" class="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Clear</a>
        </div>
    </form>
</div>

<!-- Disputes List -->
<div class="space-y-4">
    @forelse($disputes as $dispute)
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" id="dispute-{{ $dispute->id }}">
        <div class="p-6">
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <!-- Dispute Info -->
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-3">
                        @php
                        $disputeStatusColors = [
                        'open' => 'bg-yellow-100 text-yellow-700',
                        'under_review' => 'bg-blue-100 text-blue-700',
                        'resolved' => 'bg-green-100 text-green-700',
                        'dismissed' => 'bg-gray-100 text-gray-700',
                        ];
                        $disputeStatusIcons = [
                        'open' => 'alert-circle',
                        'under_review' => 'search',
                        'resolved' => 'check-circle',
                        'dismissed' => 'x-circle',
                        ];
                        @endphp
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold {{ $disputeStatusColors[$dispute->status] ?? 'bg-gray-100 text-gray-700' }}">
                            <i data-lucide="{{ $disputeStatusIcons[$dispute->status] ?? 'circle' }}" class="w-3.5 h-3.5"></i>
                            {{ ucfirst(str_replace('_', ' ', $dispute->status)) }}
                        </span>
                        <span class="text-sm text-gray-500">Dispute #{{ $dispute->id }}</span>
                        <span class="text-sm text-gray-400">•</span>
                        <a href="{{ route('admin.pool.contract-detail', $dispute->contract_id) }}" class="text-sm text-[#E75234] hover:underline font-medium">
                            Contract #{{ $dispute->contract_id }}
                        </a>
                    </div>

                    <p class="text-gray-800 mb-3">{{ $dispute->reason }}</p>

                    <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div class="flex items-center gap-1.5">
                            <i data-lucide="user" class="w-4 h-4"></i>
                            <span>Raised by: <strong class="text-gray-700">{{ $dispute->raisedBy->name ?? 'N/A' }}</strong></span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <i data-lucide="clock" class="w-4 h-4"></i>
                            <span>{{ $dispute->created_at->format('M d, Y H:i') }} ({{ $dispute->created_at->diffForHumans() }})</span>
                        </div>
                        @if($dispute->resolvedBy)
                        <div class="flex items-center gap-1.5">
                            <i data-lucide="gavel" class="w-4 h-4"></i>
                            <span>Resolved by: <strong class="text-gray-700">{{ $dispute->resolvedBy->name ?? 'N/A' }}</strong></span>
                        </div>
                        @endif
                    </div>

                    @if($dispute->resolution_notes)
                    <div class="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p class="text-sm text-green-700"><strong>Resolution:</strong> {{ ucfirst(str_replace('_', ' ', $dispute->resolution_type)) }}</p>
                        <p class="text-sm text-green-600 mt-1">{{ $dispute->resolution_notes }}</p>
                        @if($dispute->resolved_amount)
                        <p class="text-sm font-bold text-green-800 mt-1">Amount: ₱{{ number_format($dispute->resolved_amount, 2) }}</p>
                        @endif
                    </div>
                    @endif
                </div>

                <!-- Resolution Actions -->
                @if(in_array($dispute->status, ['open', 'under_review']))
                <div class="lg:w-80 flex-shrink-0">
                    <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 class="font-semibold text-gray-800 text-sm mb-3">Resolve Dispute</h4>
                        <form method="POST" action="{{ route('admin.pool.disputes.resolve', $dispute->id) }}" id="resolve-form-{{ $dispute->id }}">
                            @csrf
                            @method('PUT')

                            <div class="mb-3">
                                <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Resolution Type</label>
                                <select name="resolution_type" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]/20" onchange="toggleAmountField({{ $dispute->id }}, this.value)" required>
                                    <option value="">Select...</option>
                                    <option value="refund_full">Full Refund (to raiser)</option>
                                    <option value="refund_partial">Partial Refund</option>
                                    <option value="release_funds">Release Funds (to other party)</option>
                                    <option value="forfeit">Forfeit (deduct from raiser)</option>
                                </select>
                            </div>

                            <div class="mb-3 hidden" id="amount-field-{{ $dispute->id }}">
                                <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Amount (₱)</label>
                                <input type="number" name="amount" step="0.01" min="0" placeholder="0.00" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]/20">
                            </div>

                            <div class="mb-3">
                                <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Resolution Notes</label>
                                <textarea name="resolution_notes" rows="2" placeholder="Describe the resolution..." class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]/20" required></textarea>
                            </div>

                            <button type="submit" class="w-full px-4 py-2.5 bg-[#E75234] text-white rounded-lg text-sm font-medium hover:bg-[#d14024] transition-colors" onclick="return confirm('Are you sure you want to resolve this dispute? This action will process financial transactions.');">
                                <i data-lucide="check-circle" class="w-4 h-4 inline mr-1"></i>
                                Resolve Dispute
                            </button>
                        </form>
                    </div>
                </div>
                @endif
            </div>
        </div>
    </div>
    @empty
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-12 text-gray-500">
        <i data-lucide="check-circle" class="w-12 h-12 text-green-300 mx-auto mb-3"></i>
        <p class="font-medium text-green-600">No Disputes Found</p>
        <p class="text-sm text-gray-400 mt-1">All clear! No disputes match your filters.</p>
    </div>
    @endforelse
</div>

<!-- Pagination -->
@if($disputes->hasPages())
<div class="mt-6">
    {{ $disputes->withQueryString()->links() }}
</div>
@endif

@push('scripts')
<script>
    function toggleAmountField(disputeId, value) {
        const amountField = document.getElementById('amount-field-' + disputeId);
        if (value === 'refund_partial') {
            amountField.classList.remove('hidden');
        } else {
            amountField.classList.add('hidden');
        }
    }
</script>
@endpush
@endsection