@extends('admin.layouts.app')

@section('title', 'Analytics - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
<p class="text-sm text-gray-500 mb-6">Revenue insights, user engagement, and platform performance metrics</p>

<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-all">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Total Revenue</span>
            <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><i data-lucide="dollar-sign" class="w-5 h-5 text-green-600"></i></div>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">₱{{ number_format($totalRevenue) }}</p>
        <span class="text-sm {{ $revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500' }} font-medium">
            {{ $revenueGrowth >= 0 ? '+' : '' }}{{ $revenueGrowth }}% from last month
        </span>
    </div>

    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-all">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Active Users</span>
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><i data-lucide="users" class="w-5 h-5 text-blue-600"></i></div>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">{{ number_format($activeUsers) }}</p>
        <span class="text-sm {{ $activeUsersGrowth >= 0 ? 'text-green-500' : 'text-red-500' }} font-medium">
            {{ $activeUsersGrowth >= 0 ? '+' : '' }}{{ $activeUsersGrowth }}% from last month
        </span>
    </div>

    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-all">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Matches Made</span>
            <div class="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center"><i data-lucide="heart" class="w-5 h-5 text-pink-600"></i></div>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">{{ number_format($matchesMade) }}</p>
        <span class="text-sm {{ $matchesGrowth >= 0 ? 'text-green-500' : 'text-red-500' }} font-medium">
            {{ $matchesGrowth >= 0 ? '+' : '' }}{{ $matchesGrowth }}% from last week
        </span>
    </div>

    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-all">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Conversion Rate</span>
            <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><i data-lucide="trending-up" class="w-5 h-5 text-purple-600"></i></div>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">{{ $conversionRate }}%</p>
        <span class="text-sm {{ $conversionGrowth >= 0 ? 'text-green-500' : 'text-red-500' }} font-medium">
            {{ $conversionGrowth >= 0 ? '+' : '' }}{{ $conversionGrowth }}% from last month
        </span>
    </div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <!-- User Growth Chart -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 class="font-semibold text-gray-800 mb-4">User Growth</h3>
        <div class="h-72">
            <canvas id="userGrowthChart"></canvas>
        </div>
    </div>

    <!-- Match Performance Chart -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 class="font-semibold text-gray-800 mb-4">Match Performance</h3>
        <div class="h-72">
            <canvas id="matchPerformanceChart"></canvas>
        </div>
    </div>
</div>

<!-- Summary Stats -->
<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <h3 class="font-semibold text-gray-800 mb-4">Monthly Summary</h3>
    <div class="overflow-x-auto">
        @php
            // Create a lookup array for O(1) access
            $monthlyUserLookup = $monthlyData->keyBy('month');
        @endphp
        <table class="w-full text-left">
            <thead>
                <tr class="bg-[#E75234] text-white rounded-t-lg">
                    <th class="px-4 py-3 text-sm font-semibold text-white">Month</th>
                    <th class="px-4 py-3 text-sm font-semibold text-white">New Users</th>
                    <th class="px-4 py-3 text-sm font-semibold text-white">Total Matches</th>
                    <th class="px-4 py-3 text-sm font-semibold text-white">Accepted</th>
                    <th class="px-4 py-3 text-sm font-semibold text-white">Success Rate</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                @foreach($monthlyMatches as $data)
                <tr class="hover:bg-orange-50/50">
                    <td class="px-4 py-3 text-sm text-gray-900">{{ $data->month }}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">
                        {{ $monthlyUserLookup->get($data->month)->users ?? 0 }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ $data->matches }}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ $data->accepted }}</td>
                    <td class="px-4 py-3 text-sm">
                        @php
                            $rate = $data->matches > 0 ? round(($data->accepted / $data->matches) * 100, 1) : 0;
                        @endphp
                        <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold {{ $rate >= 50 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700' }}">
                            {{ $rate }}%
                        </span>
                    </td>
                </tr>
                @endforeach
                @if($monthlyMatches->isEmpty())
                <tr>
                    <td colspan="5" class="px-4 py-8 text-center text-gray-500">No data available</td>
                </tr>
                @endif
            </tbody>
        </table>
    </div>
</div>

@push('scripts')
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    // User Growth Chart
    const monthlyData = @json($monthlyData);
    const userGrowthCtx = document.getElementById('userGrowthChart');
    if (userGrowthCtx) {
        new Chart(userGrowthCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: monthlyData.map(item => item.month),
                datasets: [{
                    label: 'New Users',
                    data: monthlyData.map(item => item.users),
                    borderColor: '#E75234',
                    backgroundColor: 'rgba(231, 82, 52, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    // Match Performance Chart
    const monthlyMatches = @json($monthlyMatches);
    const matchPerformanceCtx = document.getElementById('matchPerformanceChart');
    if (matchPerformanceCtx) {
        new Chart(matchPerformanceCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: monthlyMatches.map(item => item.month),
                datasets: [
                    {
                        label: 'Total Matches',
                        data: monthlyMatches.map(item => item.matches),
                        backgroundColor: 'rgba(231, 82, 52, 0.3)',
                        borderColor: '#E75234',
                        borderWidth: 1
                    },
                    {
                        label: 'Accepted',
                        data: monthlyMatches.map(item => item.accepted),
                        backgroundColor: '#16A34A',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
</script>
@endpush
@endsection