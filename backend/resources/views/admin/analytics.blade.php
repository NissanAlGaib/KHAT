@extends('admin.layouts.app')

@section('title', 'Analytics - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-6">Analytics</h1>

<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Total Revenue</span>
            <i data-lucide="dollar-sign" class="w-5 h-5 text-gray-400"></i>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">$45,231</p>
        <span class="text-sm text-green-500 font-medium">+20.1% from last month</span>
    </div>

    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Active Users</span>
            <i data-lucide="users" class="w-5 h-5 text-gray-400"></i>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">2,420</p>
        <span class="text-sm text-green-500 font-medium">+8.2% from last month</span>
    </div>

    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Matches Made</span>
            <i data-lucide="heart" class="w-5 h-5 text-gray-400"></i>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">1,536</p>
        <span class="text-sm text-red-500 font-medium">-3.2% from last week</span>
    </div>

    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Conversion Rate</span>
            <i data-lucide="trending-up" class="w-5 h-5 text-gray-400"></i>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">23.5%</p>
        <span class="text-sm text-green-500 font-medium">+5.4% from last month</span>
    </div>
</div>

<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <h3 class="font-semibold text-gray-800 mb-4">Detailed Analytics</h3>
    <div class="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <span class="text-gray-400">Analytics charts will be displayed here</span>
    </div>
</div>
@endsection