@extends('admin.layouts.app')

@section('title', 'Subscription & Billing - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-2">Subscription & Billing</h1>
<p class="text-sm text-gray-500 mb-6">Monitor subscription plans, revenue estimates, and billing activity</p>

<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-all">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Free Tier Users</span>
            <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><i data-lucide="users" class="w-5 h-5 text-gray-600"></i></div>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">{{ number_format($freeUsers) }}</p>
        <span class="text-sm text-gray-500">{{ $freePercentage }}% of total users</span>
    </div>

    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-all">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Free Tier Match Payments</span>
            <div class="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center"><i data-lucide="heart" class="w-5 h-5 text-pink-600"></i></div>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">{{ number_format($matchRequestPayments) }}</p>
        <span class="text-sm {{ $matchRequestGrowth >= 0 ? 'text-green-500' : 'text-red-500' }} font-medium">
            {{ $matchRequestGrowth >= 0 ? '+' : '' }}{{ $matchRequestGrowth }}% this month
        </span>
    </div>

    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-all">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Standard Subscribers</span>
            <div class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"><i data-lucide="star" class="w-5 h-5 text-orange-600"></i></div>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">{{ number_format($standardUsers) }}</p>
        <span class="text-sm {{ $standardGrowth >= 0 ? 'text-green-500' : 'text-red-500' }} font-medium">
            {{ $standardGrowth >= 0 ? '+' : '' }}{{ $standardGrowth }}% this month
        </span>
    </div>

    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-all">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Premium Subscribers</span>
            <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><i data-lucide="crown" class="w-5 h-5 text-amber-600"></i></div>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">{{ number_format($premiumUsers) }}</p>
        <span class="text-sm {{ $premiumGrowth >= 0 ? 'text-green-500' : 'text-red-500' }} font-medium">
            {{ $premiumGrowth >= 0 ? '+' : '' }}{{ $premiumGrowth }}% this month
        </span>
    </div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <!-- Subscription Distribution -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 class="font-semibold text-gray-800 mb-4">Subscription Distribution</h3>
        <div class="h-64">
            <canvas id="subscriptionDistChart"></canvas>
        </div>
        <div class="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
                <div class="w-3 h-3 rounded-full bg-gray-400 mx-auto mb-1"></div>
                <p class="text-sm text-gray-600">Free</p>
                <p class="font-bold">{{ $freePercentage }}%</p>
            </div>
            <div>
                <div class="w-3 h-3 rounded-full bg-[#E75234] mx-auto mb-1"></div>
                <p class="text-sm text-gray-600">Standard</p>
                <p class="font-bold">{{ $standardPercentage }}%</p>
            </div>
            <div>
                <div class="w-3 h-3 rounded-full bg-[#F59E0B] mx-auto mb-1"></div>
                <p class="text-sm text-gray-600">Premium</p>
                <p class="font-bold">{{ $premiumPercentage }}%</p>
            </div>
        </div>
    </div>

    <!-- Revenue Estimate -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 class="font-semibold text-gray-800 mb-4">Monthly Revenue Estimate</h3>
        <div class="space-y-4">
            <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                    <p class="text-sm text-gray-500">Free Tier Match Payments (₱{{ $matchRequestFee }}/match)</p>
                    <p class="text-lg font-bold">{{ number_format($matchRequestPayments) }} payments</p>
                </div>
                <p class="text-xl font-bold text-gray-900">₱{{ number_format($matchRequestRevenue) }}</p>
            </div>
            <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                    <p class="text-sm text-gray-500">Standard (₱{{ $standardPrice }}/mo)</p>
                    <p class="text-lg font-bold">{{ number_format($standardUsers) }} users</p>
                </div>
                <p class="text-xl font-bold text-gray-900">₱{{ number_format($standardUsers * $standardPrice) }}</p>
            </div>
            <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                    <p class="text-sm text-gray-500">Premium (₱{{ $premiumPrice }}/mo)</p>
                    <p class="text-lg font-bold">{{ number_format($premiumUsers) }} users</p>
                </div>
                <p class="text-xl font-bold text-gray-900">₱{{ number_format($premiumUsers * $premiumPrice) }}</p>
            </div>
            <div class="flex justify-between items-center p-4 bg-[#E75234] rounded-lg text-white">
                <p class="text-lg font-semibold">Total Monthly Revenue</p>
                <p class="text-2xl font-bold">₱{{ number_format($matchRequestRevenue + ($standardUsers * $standardPrice) + ($premiumUsers * $premiumPrice)) }}</p>
            </div>
        </div>
    </div>
</div>

<!-- Recent Subscriptions -->
<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <h3 class="font-semibold text-gray-800 mb-4">Recent Subscription Activity</h3>
    @if($recentSubscriptions->count() > 0)
    <div class="overflow-x-auto">
        <table class="w-full text-left">
            <thead>
                <tr class="bg-[#E75234] text-white rounded-t-lg">
                    <th class="px-4 py-3 text-sm font-semibold text-white">User</th>
                    <th class="px-4 py-3 text-sm font-semibold text-white">Email</th>
                    <th class="px-4 py-3 text-sm font-semibold text-white">Plan</th>
                    <th class="px-4 py-3 text-sm font-semibold text-white">Updated</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                @foreach($recentSubscriptions as $subscription)
                <tr class="hover:bg-orange-50/50">
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                                {{ strtoupper(substr($subscription->name ?? $subscription->email, 0, 1)) }}
                            </div>
                            <span class="font-medium text-gray-900">{{ $subscription->name }}</span>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ $subscription->email }}</td>
                    <td class="px-4 py-3">
                        @php
                            $tierColors = [
                                'standard' => 'bg-orange-100 text-orange-700',
                                'premium' => 'bg-yellow-100 text-yellow-700',
                            ];
                            $tierColor = $tierColors[$subscription->subscription_tier] ?? 'bg-gray-100 text-gray-700';
                        @endphp
                        <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold {{ $tierColor }}">
                            {{ ucfirst($subscription->subscription_tier) }}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500">
                        {{ $subscription->updated_at->diffForHumans() }}
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @else
    <div class="text-center py-8 text-gray-500">
        <i data-lucide="credit-card" class="w-12 h-12 text-gray-300 mx-auto mb-3"></i>
        <p>No subscription activity yet</p>
    </div>
    @endif
</div>

@push('scripts')
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    // Subscription Distribution Chart
    const subscriptionDistCtx = document.getElementById('subscriptionDistChart');
    if (subscriptionDistCtx) {
        new Chart(subscriptionDistCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Free', 'Standard', 'Premium'],
                datasets: [{
                    data: [{{ $freeUsers }}, {{ $standardUsers }}, {{ $premiumUsers }}],
                    backgroundColor: ['#9CA3AF', '#E75234', '#F59E0B'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                cutout: '70%'
            }
        });
    }
</script>
@endpush
@endsection