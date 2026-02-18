@extends('admin.layouts.app')

@section('title', 'Money Pool - KHAT Admin')

@section('content')
<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
    <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Money Pool</h1>
        <p class="text-sm text-gray-500">Monitor pool balances, transactions, and financial activity across all contracts</p>
    </div>
    <div class="flex gap-2 mt-4 sm:mt-0">
        <a href="{{ route('admin.pool.transactions') }}" class="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <i data-lucide="list" class="w-4 h-4"></i>
            All Transactions
        </a>
        <a href="{{ route('admin.pool.disputes') }}" class="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <i data-lucide="alert-triangle" class="w-4 h-4"></i>
            Disputes
            @if($openDisputesCount > 0)
            <span class="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{{ $openDisputesCount }}</span>
            @endif
        </a>
        <div class="relative" x-data="{ open: false }">
            <a href="{{ route('admin.pool.export', ['format' => 'csv']) }}" class="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E75234] rounded-lg text-sm font-medium text-white hover:bg-[#d14024] transition-colors">
                <i data-lucide="download" class="w-4 h-4"></i>
                Export CSV
            </a>
        </div>
    </div>
</div>

<!-- Stats Cards -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-all">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Total Pool Balance</span>
            <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <i data-lucide="wallet" class="w-5 h-5 text-green-600"></i>
            </div>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">₱{{ number_format($stats['total_balance'] ?? 0, 2) }}</p>
        <span class="text-sm text-gray-500">Currently held in pool</span>
    </div>

    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-all">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Total Deposited</span>
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <i data-lucide="arrow-down-circle" class="w-5 h-5 text-blue-600"></i>
            </div>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">₱{{ number_format($stats['total_deposited'] ?? 0, 2) }}</p>
        <span class="text-sm text-gray-500">{{ $stats['total_transactions'] ?? 0 }} total transactions</span>
    </div>

    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-all">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Total Released</span>
            <div class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <i data-lucide="arrow-up-circle" class="w-5 h-5 text-orange-600"></i>
            </div>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">₱{{ number_format($stats['total_released'] ?? 0, 2) }}</p>
        <span class="text-sm text-gray-500">Refunded to users</span>
    </div>

    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-all">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Frozen Funds</span>
            <div class="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <i data-lucide="lock" class="w-5 h-5 text-red-600"></i>
            </div>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">₱{{ number_format($stats['total_frozen'] ?? 0, 2) }}</p>
        <span class="text-sm {{ $openDisputesCount > 0 ? 'text-red-500 font-medium' : 'text-gray-500' }}">
            {{ $openDisputesCount }} open dispute{{ $openDisputesCount !== 1 ? 's' : '' }}
        </span>
    </div>
</div>

<!-- Charts Row -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <!-- Revenue by Type (Pie) -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 class="font-semibold text-gray-800 mb-4">Pool Deposits by Type</h3>
        <div class="h-64">
            <canvas id="revenueByTypeChart"></canvas>
        </div>
        <div class="mt-4 grid grid-cols-2 gap-3">
            @foreach($revenueByType as $item)
            <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full" style="background-color: {{ $item['color'] ?? '#9CA3AF' }}"></div>
                <span class="text-sm text-gray-600">{{ $item['label'] }}</span>
                <span class="text-sm font-bold ml-auto">₱{{ number_format($item['amount'], 2) }}</span>
            </div>
            @endforeach
        </div>
    </div>

    <!-- Monthly Flow (Line) -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 class="font-semibold text-gray-800 mb-4">Monthly Pool Flow (6 Months)</h3>
        <div class="h-64">
            <canvas id="monthlyFlowChart"></canvas>
        </div>
    </div>
</div>

<!-- Recent Transactions -->
<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-gray-800">Recent Transactions</h3>
        <a href="{{ route('admin.pool.transactions') }}" class="text-sm text-[#E75234] hover:underline font-medium">View All →</a>
    </div>

    @if(count($recentTransactions) > 0)
    <div class="overflow-x-auto">
        <table class="w-full text-left">
            <thead>
                <tr class="bg-[#E75234] text-white">
                    <th class="px-4 py-3 text-sm font-semibold">ID</th>
                    <th class="px-4 py-3 text-sm font-semibold">Type</th>
                    <th class="px-4 py-3 text-sm font-semibold">User</th>
                    <th class="px-4 py-3 text-sm font-semibold">Contract</th>
                    <th class="px-4 py-3 text-sm font-semibold">Amount</th>
                    <th class="px-4 py-3 text-sm font-semibold">Status</th>
                    <th class="px-4 py-3 text-sm font-semibold">Date</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                @foreach($recentTransactions as $txn)
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
                    <td class="px-4 py-3 text-sm">
                        @if($txn->contract_id)
                        <a href="{{ route('admin.pool.contract-detail', $txn->contract_id) }}" class="text-[#E75234] hover:underline font-medium">#{{ $txn->contract_id }}</a>
                        @else
                        <span class="text-gray-400">—</span>
                        @endif
                    </td>
                    <td class="px-4 py-3 text-sm font-semibold {{ in_array($txn->type, ['deposit', 'hold']) ? 'text-green-600' : 'text-red-600' }}">
                        {{ in_array($txn->type, ['deposit', 'hold']) ? '+' : '-' }}₱{{ number_format($txn->amount, 2) }}
                    </td>
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
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @else
    <div class="text-center py-8 text-gray-500">
        <i data-lucide="inbox" class="w-12 h-12 text-gray-300 mx-auto mb-3"></i>
        <p>No pool transactions yet</p>
    </div>
    @endif
</div>

@push('scripts')
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    // Revenue by Type Pie Chart
    const revenueCtx = document.getElementById('revenueByTypeChart');
    if (revenueCtx) {
        new Chart(revenueCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: {
                    !!json_encode(collect($revenueByType) - > pluck('label')) !!
                },
                datasets: [{
                    data: {
                        !!json_encode(collect($revenueByType) - > pluck('amount')) !!
                    },
                    backgroundColor: {
                        !!json_encode(collect($revenueByType) - > pluck('color')) !!
                    },
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                cutout: '70%'
            }
        });
    }

    // Monthly Flow Line Chart
    const flowCtx = document.getElementById('monthlyFlowChart');
    if (flowCtx) {
        new Chart(flowCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: {
                    !!json_encode(collect($monthlyFlow) - > pluck('month')) !!
                },
                datasets: [{
                        label: 'Deposits',
                        data: {
                            !!json_encode(collect($monthlyFlow) - > pluck('deposits')) !!
                        },
                        borderColor: '#22C55E',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Releases',
                        data: {
                            !!json_encode(collect($monthlyFlow) - > pluck('releases')) !!
                        },
                        borderColor: '#E75234',
                        backgroundColor: 'rgba(231, 82, 52, 0.1)',
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₱' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
</script>
@endpush
@endsection