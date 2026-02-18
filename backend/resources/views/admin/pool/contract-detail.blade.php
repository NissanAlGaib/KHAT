@extends('admin.layouts.app')

@section('title', 'Contract Pool Detail - KHAT Admin')

@section('content')
<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
    <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Contract #{{ $contract->id }} — Pool Detail</h1>
        <p class="text-sm text-gray-500">Financial overview for this breeding contract</p>
    </div>
    <div class="flex gap-2 mt-4 sm:mt-0">
        <a href="{{ route('admin.pool.dashboard') }}" class="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
            Back to Pool
        </a>
    </div>
</div>

<!-- Contract Info & Summary Cards -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
    <!-- Contract Info -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i data-lucide="file-text" class="w-5 h-5 text-gray-500"></i>
            Contract Info
        </h3>
        <dl class="space-y-3">
            <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Status</dt>
                <dd>
                    @php
                    $contractStatusColors = [
                    'accepted' => 'bg-green-100 text-green-700',
                    'pending' => 'bg-yellow-100 text-yellow-700',
                    'fulfilled' => 'bg-blue-100 text-blue-700',
                    'cancelled' => 'bg-red-100 text-red-700',
                    'rejected' => 'bg-gray-100 text-gray-700',
                    ];
                    @endphp
                    <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold {{ $contractStatusColors[$contract->status] ?? 'bg-gray-100 text-gray-700' }}">
                        {{ ucfirst($contract->status) }}
                    </span>
                </dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Breeding Status</dt>
                <dd class="text-sm font-medium text-gray-800">{{ ucfirst($contract->breeding_status ?? 'N/A') }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Collateral/Owner</dt>
                <dd class="text-sm font-bold text-gray-900">₱{{ number_format($contract->collateral_per_owner ?? 0, 2) }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Shooter Collateral</dt>
                <dd class="text-sm font-bold text-gray-900">₱{{ number_format($contract->shooter_collateral ?? 0, 2) }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Shooter Payment</dt>
                <dd class="text-sm font-bold text-gray-900">₱{{ number_format($contract->shooter_payment ?? 0, 2) }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Monetary Amount</dt>
                <dd class="text-sm font-bold text-gray-900">₱{{ number_format($contract->monetary_amount ?? 0, 2) }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Created</dt>
                <dd class="text-sm text-gray-600">{{ $contract->created_at->format('M d, Y') }}</dd>
            </div>
        </dl>
    </div>

    <!-- Pool Summary -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i data-lucide="wallet" class="w-5 h-5 text-gray-500"></i>
            Pool Summary
        </h3>
        <div class="space-y-4">
            <div class="p-4 bg-green-50 rounded-lg">
                <p class="text-sm text-green-700 font-medium">Total Deposited</p>
                <p class="text-2xl font-bold text-green-800">₱{{ number_format($summary['total_deposited'] ?? 0, 2) }}</p>
            </div>
            <div class="p-4 bg-blue-50 rounded-lg">
                <p class="text-sm text-blue-700 font-medium">Total Released</p>
                <p class="text-2xl font-bold text-blue-800">₱{{ number_format($summary['total_released'] ?? 0, 2) }}</p>
            </div>
            <div class="p-4 bg-orange-50 rounded-lg">
                <p class="text-sm text-orange-700 font-medium">Fees Collected</p>
                <p class="text-2xl font-bold text-orange-800">₱{{ number_format($summary['total_fees'] ?? 0, 2) }}</p>
            </div>
            <div class="p-4 {{ ($summary['net_balance'] ?? 0) > 0 ? 'bg-gray-900' : 'bg-gray-100' }} rounded-lg">
                <p class="text-sm {{ ($summary['net_balance'] ?? 0) > 0 ? 'text-gray-400' : 'text-gray-500' }} font-medium">Net Balance</p>
                <p class="text-2xl font-bold {{ ($summary['net_balance'] ?? 0) > 0 ? 'text-white' : 'text-gray-700' }}">₱{{ number_format($summary['net_balance'] ?? 0, 2) }}</p>
            </div>
        </div>
    </div>

    <!-- Active Dispute -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i data-lucide="alert-triangle" class="w-5 h-5 text-gray-500"></i>
            Dispute Status
        </h3>
        @if($contract->disputes && $contract->disputes->where('status', '!=', 'dismissed')->where('status', '!=', 'resolved')->count() > 0)
        @php $activeDispute = $contract->disputes->whereNotIn('status', ['dismissed', 'resolved'])->first(); @endphp
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
            <div class="flex items-center gap-2 mb-2">
                <i data-lucide="alert-circle" class="w-5 h-5 text-red-500"></i>
                <span class="text-sm font-bold text-red-700">Active Dispute</span>
            </div>
            <p class="text-sm text-red-600 mb-2">{{ Str::limit($activeDispute->reason, 150) }}</p>
            <div class="flex items-center gap-2 text-xs text-red-500">
                <span>Raised by: {{ $activeDispute->raisedBy->name ?? 'N/A' }}</span>
                <span>•</span>
                <span>{{ $activeDispute->created_at->diffForHumans() }}</span>
            </div>
        </div>
        <a href="{{ route('admin.pool.disputes') }}?contract_id={{ $contract->id }}" class="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E75234] rounded-lg text-sm font-medium text-white hover:bg-[#d14024] w-full justify-center transition-colors">
            <i data-lucide="gavel" class="w-4 h-4"></i>
            Resolve Dispute
        </a>
        @else
        <div class="text-center py-8 text-gray-400">
            <i data-lucide="check-circle" class="w-12 h-12 mx-auto mb-3 text-green-300"></i>
            <p class="font-medium text-green-600">No Active Disputes</p>
            <p class="text-sm text-gray-400 mt-1">All disputes are resolved or none filed</p>
        </div>
        @endif

        @if($contract->disputes && $contract->disputes->count() > 0)
        <div class="mt-4 pt-4 border-t border-gray-100">
            <p class="text-xs text-gray-500 uppercase font-semibold mb-2">Dispute History</p>
            @foreach($contract->disputes->sortByDesc('created_at')->take(3) as $dispute)
            <div class="flex items-center justify-between py-2">
                <span class="text-sm text-gray-600">{{ Str::limit($dispute->reason, 40) }}</span>
                @php
                $disputeStatusColors = [
                'open' => 'bg-yellow-100 text-yellow-700',
                'under_review' => 'bg-blue-100 text-blue-700',
                'resolved' => 'bg-green-100 text-green-700',
                'dismissed' => 'bg-gray-100 text-gray-700',
                ];
                @endphp
                <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold {{ $disputeStatusColors[$dispute->status] ?? 'bg-gray-100 text-gray-700' }}">
                    {{ ucfirst(str_replace('_', ' ', $dispute->status)) }}
                </span>
            </div>
            @endforeach
        </div>
        @endif
    </div>
</div>

<!-- Transaction History -->
<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <h3 class="font-semibold text-gray-800 mb-4">Transaction History</h3>

    @if($transactions->count() > 0)
    <div class="overflow-x-auto">
        <table class="w-full text-left">
            <thead>
                <tr class="bg-[#E75234] text-white">
                    <th class="px-4 py-3 text-sm font-semibold">ID</th>
                    <th class="px-4 py-3 text-sm font-semibold">Type</th>
                    <th class="px-4 py-3 text-sm font-semibold">User</th>
                    <th class="px-4 py-3 text-sm font-semibold">Amount</th>
                    <th class="px-4 py-3 text-sm font-semibold">Balance After</th>
                    <th class="px-4 py-3 text-sm font-semibold">Status</th>
                    <th class="px-4 py-3 text-sm font-semibold">Description</th>
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
                    <td class="px-4 py-3 text-sm text-gray-700">{{ $txn->user->name ?? 'N/A' }}</td>
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
                    <td class="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{{ $txn->description ?? '—' }}</td>
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
                            <form method="POST" action="{{ route('admin.pool.transactions.force-release', $txn->id) }}" class="inline" onsubmit="return confirm('Force release this transaction?');">
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
    @else
    <div class="text-center py-8 text-gray-500">
        <i data-lucide="inbox" class="w-12 h-12 text-gray-300 mx-auto mb-3"></i>
        <p>No pool transactions for this contract</p>
    </div>
    @endif
</div>
@endsection