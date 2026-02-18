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
        <a href="{{ route('admin.pool.export', ['format' => 'csv'] + request()->query()) }}" class="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E75234] rounded-lg text-sm font-medium text-white hover:bg-[#d14024] transition-colors">
            <i data-lucide="download" class="w-4 h-4"></i>
            Export
        </a>
    </div>
</div>

<!-- Filters -->
<div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
    <form method="GET" action="{{ route('admin.pool.transactions') }}" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
            <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Type</label>
            <select name="type" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]/20">
                <option value="">All Types</option>
                <option value="deposit" {{ request('type') == 'deposit' ? 'selected' : '' }}>Deposit</option>
                <option value="hold" {{ request('type') == 'hold' ? 'selected' : '' }}>Hold</option>
                <option value="release" {{ request('type') == 'release' ? 'selected' : '' }}>Release</option>
                <option value="refund" {{ request('type') == 'refund' ? 'selected' : '' }}>Refund</option>
                <option value="fee_deduction" {{ request('type') == 'fee_deduction' ? 'selected' : '' }}>Fee Deduction</option>
                <option value="cancellation_penalty" {{ request('type') == 'cancellation_penalty' ? 'selected' : '' }}>Cancellation Penalty</option>
            </select>
        </div>
        <div>
            <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">Status</label>
            <select name="status" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]/20">
                <option value="">All Statuses</option>
                <option value="completed" {{ request('status') == 'completed' ? 'selected' : '' }}>Completed</option>
                <option value="pending" {{ request('status') == 'pending' ? 'selected' : '' }}>Pending</option>
                <option value="frozen" {{ request('status') == 'frozen' ? 'selected' : '' }}>Frozen</option>
                <option value="cancelled" {{ request('status') == 'cancelled' ? 'selected' : '' }}>Cancelled</option>
            </select>
        </div>
        <div>
            <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">From Date</label>
            <input type="date" name="date_from" value="{{ request('date_from') }}" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]/20">
        </div>
        <div>
            <label class="text-xs font-semibold text-gray-500 uppercase mb-1 block">To Date</label>
            <input type="date" name="date_to" value="{{ request('date_to') }}" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]/20">
        </div>
        <div class="flex items-end gap-2">
            <button type="submit" class="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                <i data-lucide="search" class="w-4 h-4 inline mr-1"></i> Filter
            </button>
            <a href="{{ route('admin.pool.transactions') }}" class="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Clear</a>
        </div>
    </form>
</div>

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
                            <form method="POST" action="{{ route('admin.pool.transactions.freeze', $txn->id) }}" class="inline" onsubmit="return confirm('Freeze this transaction?');">
                                @csrf
                                <button type="submit" class="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors" title="Freeze">
                                    <i data-lucide="lock" class="w-4 h-4"></i>
                                </button>
                            </form>
                            @endif
                            @if($txn->status === 'frozen')
                            <form method="POST" action="{{ route('admin.pool.transactions.unfreeze', $txn->id) }}" class="inline" onsubmit="return confirm('Unfreeze this transaction?');">
                                @csrf
                                <button type="submit" class="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors" title="Unfreeze">
                                    <i data-lucide="unlock" class="w-4 h-4"></i>
                                </button>
                            </form>
                            @endif
                            @if($txn->status === 'pending')
                            <form method="POST" action="{{ route('admin.pool.transactions.force-release', $txn->id) }}" class="inline" onsubmit="return confirm('Force release this transaction? This will trigger a PayMongo refund.');">
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