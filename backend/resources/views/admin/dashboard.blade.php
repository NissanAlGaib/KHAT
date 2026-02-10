@extends('admin.layouts.app')

@section('title', 'Dashboard - KHAT Admin')

@section('content')
<!-- Dashboard Overview -->
<h1 class="text-3xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>

<!-- Stats Cards (Row 1) -->
<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
    <!-- Card 1: Total Users -->
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Total Users</span>
            <i data-lucide="users" class="w-5 h-5 text-gray-400"></i>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">{{ number_format($totalUsers) }}</p>
        <span class="text-sm {{ $usersGrowth >= 0 ? 'text-green-500' : 'text-red-500' }} font-medium">
            {{ $usersGrowth >= 0 ? '+' : '' }}{{ $usersGrowth }}% vs. last month
        </span>
    </div>
    <!-- Card 2: Verified Breeders -->
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Verified Breeders</span>
            <i data-lucide="check-circle" class="w-5 h-5 text-gray-400"></i>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">{{ number_format($verifiedBreeders) }}</p>
        <span class="text-sm {{ $breedersGrowth >= 0 ? 'text-green-500' : 'text-red-500' }} font-medium">
            {{ $breedersGrowth >= 0 ? '+' : '' }}{{ $breedersGrowth }}% vs. last month
        </span>
    </div>
    <!-- Card 3: Verified Shooters -->
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Verified Shooters</span>
            <i data-lucide="shield-check" class="w-5 h-5 text-gray-400"></i>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">{{ number_format($verifiedShooters) }}</p>
        <span class="text-sm {{ $shootersGrowth >= 0 ? 'text-green-500' : 'text-red-500' }} font-medium">
            {{ $shootersGrowth >= 0 ? '+' : '' }}{{ $shootersGrowth }}% vs. last week
        </span>
    </div>
    <!-- Card 4: Active Pets -->
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Active Pets</span>
            <i data-lucide="paw-print" class="w-5 h-5 text-gray-400"></i>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">{{ number_format($activePets) }}</p>
        <span class="text-sm {{ $activePetsGrowth >= 0 ? 'text-green-500' : 'text-red-500' }} font-medium">
            {{ $activePetsGrowth >= 0 ? '+' : '' }}{{ $activePetsGrowth }}% vs. last week
        </span>
    </div>
</div>

<!-- Stats Cards (Row 2) -->
<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
    <!-- Card 5: Disabled Pets -->
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Disabled Pets</span>
            <i data-lucide="shield-off" class="w-5 h-5 text-gray-400"></i>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">{{ number_format($disabledPets) }}</p>
        <span class="text-sm {{ $disabledPetsGrowth >= 0 ? 'text-green-500' : 'text-red-500' }} font-medium">
            {{ $disabledPetsGrowth >= 0 ? '+' : '' }}{{ $disabledPetsGrowth }}% vs. last week
        </span>
    </div>
    <!-- Card 6: Cooldown Pets -->
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Cooldown Pets</span>
            <i data-lucide="clock" class="w-5 h-5 text-gray-400"></i>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">{{ number_format($cooldownPets) }}</p>
        <span class="text-sm {{ $cooldownPetsGrowth >= 0 ? 'text-green-500' : 'text-red-500' }} font-medium">
            {{ $cooldownPetsGrowth >= 0 ? '+' : '' }}{{ $cooldownPetsGrowth }}% vs. last month
        </span>
    </div>
    <!-- Card 7: Standard Subscribers -->
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Standard Subscribers</span>
            <i data-lucide="user" class="w-5 h-5 text-gray-400"></i>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">{{ number_format($standardSubscribers) }}</p>
        <span class="text-sm {{ $standardGrowth >= 0 ? 'text-green-500' : 'text-red-500' }} font-medium">
            {{ $standardGrowth >= 0 ? '+' : '' }}{{ $standardGrowth }}% vs. last month
        </span>
    </div>
    <!-- Card 8: Premium Subscribers -->
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Premium Subscribers</span>
            <i data-lucide="crown" class="w-5 h-5 text-gray-400"></i>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">{{ number_format($premiumSubscribers) }}</p>
        <span class="text-sm {{ $premiumGrowth >= 0 ? 'text-green-500' : 'text-red-500' }} font-medium">
            {{ $premiumGrowth >= 0 ? '+' : '' }}{{ $premiumGrowth }}% vs. last month
        </span>
    </div>
</div>

<!-- Platform Analytics -->
<h1 class="text-3xl font-bold text-gray-900 mb-6">Platform Analytics</h1>

<!-- Charts (Grid) -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Main Chart -->
    <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-50">
        <h3 class="font-semibold text-gray-800 mb-4">Monthly New Users</h3>
        <div class="h-80">
            <canvas id="monthlyUsersChart"></canvas>
        </div>
    </div>

    <!-- Side Charts (Stacked) -->
    <div class="lg:col-span-1 flex flex-col gap-6">
        <!-- Bar Chart -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-50">
            <h3 class="font-semibold text-gray-800 mb-4">Breeding Matches Trend</h3>
            <div class="h-40">
                <canvas id="matchesTrendChart"></canvas>
            </div>
        </div>

        <!-- Doughnut Chart -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-50">
            <h3 class="font-semibold text-gray-800 mb-4">Users by Subscription Tier</h3>
            <div class="h-40">
                <canvas id="subscriptionChart"></canvas>
            </div>
        </div>
    </div>
</div>
@endsection

@push('styles')
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
@endpush

@push('scripts')
<script>
    // Chart Data from Backend
    const monthlyUsersData = @json($monthlyUsers);
    const matchesTrendData = @json($matchesTrend);
    const freeUsers = {{ $totalUsers - $standardSubscribers - $premiumSubscribers }};
    const standardUsers = {{ $standardSubscribers }};
    const premiumUsers = {{ $premiumSubscribers }};

    // Monthly Users Chart
    const monthlyUsersCtx = document.getElementById('monthlyUsersChart');
    if (monthlyUsersCtx) {
        new Chart(monthlyUsersCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: monthlyUsersData.map(item => item.month),
                datasets: [{
                    label: 'New Users',
                    data: monthlyUsersData.map(item => item.count),
                    borderColor: '#E75234',
                    backgroundColor: 'rgba(231, 82, 52, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // Matches Trend Chart
    const matchesTrendCtx = document.getElementById('matchesTrendChart');
    if (matchesTrendCtx) {
        new Chart(matchesTrendCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: matchesTrendData.map(item => item.month),
                datasets: [{
                    label: 'Matches',
                    data: matchesTrendData.map(item => item.count),
                    backgroundColor: '#E75234',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // Subscription Distribution Chart
    const subscriptionCtx = document.getElementById('subscriptionChart');
    if (subscriptionCtx) {
        new Chart(subscriptionCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Free', 'Standard', 'Premium'],
                datasets: [{
                    data: [freeUsers, standardUsers, premiumUsers],
                    backgroundColor: ['#9CA3AF', '#E75234', '#F59E0B'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12 } }
                }
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        lucide.createIcons();
    });
</script>
@endpush