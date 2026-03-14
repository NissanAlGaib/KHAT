@extends('admin.layouts.app')

@section('title', 'Pool Transactions - KHAT Admin')

@section('content')
<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
    <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Pool Transactions</h1>
        <p class="text-sm text-gray-500">View and manage all money pool transactions</p>
    </div>
    <div class="flex gap-2 mt-4 sm:mt-0">
        <a href="{{ route('admin.pool.dashboard') }}" class="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
            Back to Pool
        </a>
        <a href="{{ route('admin.pool.export', ['format' => 'csv'] + request()->query()) }}" class="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 rounded-lg text-sm font-medium text-white hover:bg-green-700 transition-colors">
            <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
            CSV
        </a>
        <a href="{{ route('admin.pool.export', ['format' => 'pdf'] + request()->query()) }}" class="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E75234] rounded-lg text-sm font-medium text-white hover:bg-[#d14024] transition-colors">
            <i data-lucide="file-text" class="w-4 h-4"></i>
            PDF
        </a>
    </div>
</div>

<!-- Filters -->
@include('admin.partials.filter-bar', [
'action' => route('admin.pool.transactions'),
'searchPlaceholder' => 'Search user, ID, contract...',
'filters' => [
[
'name' => 'type',
'label' => 'Type',
'options' => [
['value' => 'deposit', 'label' => 'Deposit'],
['value' => 'hold', 'label' => 'Hold'],
['value' => 'release', 'label' => 'Release'],
['value' => 'refund', 'label' => 'Refund'],
['value' => 'fee_deduction', 'label' => 'Fee Deduction'],
['value' => 'cancellation_penalty', 'label' => 'Cancellation Penalty'],
],
],
[
'name' => 'status',
'label' => 'Status',
'options' => [
['value' => 'completed', 'label' => 'Completed'],
['value' => 'pending', 'label' => 'Pending'],
['value' => 'frozen', 'label' => 'Frozen'],
['value' => 'cancelled', 'label' => 'Cancelled'],
],
],
],
'dateFilter' => true,
'datePresets' => true,
'exports' => false,
'perPage' => true,
'defaultPerPage' => 25,
'totalResults' => $transactions->total(),
])

<!-- Transactions Table -->
<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    @if($transactions->count() > 0)
    <div class="overflow-x-auto">
        <table class="w-full text-left">
            <thead>
                <tr class="bg-[#E75234] text-white">
                    <th class="px-4 py-3 text-sm font-semibold">ID</th>
                    <th class="px-4 py-3 text-sm font-semibold">Type</th>
                    <th class="px-4 py-3 text-sm font-semibold">User</th>
                    <th class="px-4 py-3 text-sm font-semibold">Contract</th>
                    <th class="px-4 py-3 text-sm font-semibold">Payment</th>
                    <th class="px-4 py-3 text-sm font-semibold">Amount</th>
                    <th class="px-4 py-3 text-sm font-semibold">Balance After</th>
                    <th class="px-4 py-3 text-sm font-semibold">Status</th>
                    <th class="px-4 py-3 text-sm font-semibold">Date</th>
                    <th class="px-4 py-3 text-sm font-semibold">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                @foreach($transactions as $txn)
                <tr class="hover:bg-orange-50/50">
                    <td class="px-4 py-3 text-sm font-mono text-gray-600">#{{ $txn->id }}</td>
                    <td class="px-4 py-3">
                        @php
                        $typeColors = [
                        'deposit' => 'bg-green-100 text-green-700',
                        'hold' => 'bg-yellow-100 text-yellow-700',
                        'release' => 'bg-blue-100 text-blue-700',
                        'refund' => 'bg-purple-100 text-purple-700',
                        'fee_deduction' => 'bg-red-100 text-red-700',
                        'cancellation_penalty' => 'bg-red-100 text-red-700',
                        ];
                        @endphp
                        <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold {{ $typeColors[$txn->type] ?? 'bg-gray-100 text-gray-700' }}">
                            {{ $txn->type_label }}
                        </span>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                            <div class="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                                {{ strtoupper(substr($txn->user->name ?? '?', 0, 1)) }}
                            </div>
                            <span class="text-sm text-gray-700">{{ $txn->user->name ?? 'N/A' }}</span>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-sm">
                        @if($txn->contract_id)
                        <a href="{{ route('admin.pool.contract-detail', $txn->contract_id) }}" class="text-[#E75234] hover:underline font-medium">#{{ $txn->contract_id }}</a>
                        @else
                        <span class="text-gray-400">—</span>
                        @endif
                    </td>
                    <td class="px-4 py-3 text-sm font-mono text-gray-500">#{{ $txn->payment_id }}</td>
                    <td class="px-4 py-3 text-sm font-semibold {{ $txn->isCredit() ? 'text-green-600' : 'text-red-600' }}">
                        {{ $txn->isCredit() ? '+' : '-' }}₱{{ number_format($txn->amount, 2) }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600">₱{{ number_format($txn->balance_after, 2) }}</td>
                    <td class="px-4 py-3">
                        @php
                        $statusColors = [
                        'completed' => 'bg-green-100 text-green-700',
                        'pending' => 'bg-yellow-100 text-yellow-700',
                        'frozen' => 'bg-blue-100 text-blue-700',
                        'cancelled' => 'bg-gray-100 text-gray-700',
                        ];
                        @endphp
                        <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold {{ $statusColors[$txn->status] ?? 'bg-gray-100 text-gray-700' }}">
                            {{ $txn->status_label }}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500">{{ $txn->created_at->format('M d, Y H:i') }}</td>
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-1">
                            @if($txn->status === 'completed' && $txn->isCredit())
                            <form method="POST" action="{{ route('admin.pool.transactions.freeze', $txn->id) }}" class="inline" data-confirm="Freeze this transaction?" data-confirm-title="Freeze Transaction" data-confirm-icon="question" data-confirm-btn="Yes, freeze it">
                                @csrf
                                <button type="submit" class="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Freeze">
                                    <i data-lucide="lock" class="w-4 h-4"></i>
                                </button>
                            </form>
                            @endif
                            @if($txn->status === 'frozen')
                            <form method="POST" action="{{ route('admin.pool.transactions.unfreeze', $txn->id) }}" class="inline" data-confirm="Unfreeze this transaction?" data-confirm-title="Unfreeze Transaction" data-confirm-icon="question" data-confirm-btn="Yes, unfreeze it">
                                @csrf
                                <button type="submit" class="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors" title="Unfreeze">
                                    <i data-lucide="unlock" class="w-4 h-4"></i>
                                </button>
                            </form>
                            @endif
                            @if($txn->status === 'pending')
                            <form method="POST" action="{{ route('admin.pool.transactions.force-release', $txn->id) }}" class="inline" data-confirm="Force release this transaction? This will trigger a PayMongo refund." data-confirm-title="Force Release" data-confirm-icon="warning" data-confirm-btn="Yes, force release">
                                @csrf
                                <button type="submit" class="p-1.5 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors" title="Force Release">
                                    <i data-lucide="send" class="w-4 h-4"></i>
                                </button>
                            </form>
                            @endif
                        </div>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <!-- Pagination -->
    <div class="px-4 py-3 border-t border-gray-100">
        {{ $transactions->withQueryString()->links() }}
    </div>
    @else
    <div class="text-center py-12 text-gray-500">
        <i data-lucide="inbox" class="w-12 h-12 text-gray-300 mx-auto mb-3"></i>
        <p class="font-medium">No transactions found</p>
        <p class="text-sm mt-1">Try adjusting your filters</p>
    </div>
    @endif
</div>
@endsection