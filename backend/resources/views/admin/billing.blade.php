@extends('admin.layouts.app')

@section('title', 'Subscription & Billing - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-6">Subscription & Billing</h1>

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Free Tier Users</span>
            <i data-lucide="users" class="w-5 h-5 text-gray-400"></i>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">1,245</p>
        <span class="text-sm text-gray-500">37% of total users</span>
    </div>

    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Standard Subscribers</span>
            <i data-lucide="star" class="w-5 h-5 text-gray-400"></i>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">1,435</p>
        <span class="text-sm text-green-500 font-medium">+15.1% this month</span>
    </div>

    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
        <div class="flex justify-between items-start mb-2">
            <span class="text-sm font-semibold text-gray-500">Premium Subscribers</span>
            <i data-lucide="crown" class="w-5 h-5 text-gray-400"></i>
        </div>
        <p class="text-3xl font-bold text-gray-900 mb-1">642</p>
        <span class="text-sm text-green-500 font-medium">+22.3% this month</span>
    </div>
</div>

<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <h3 class="font-semibold text-gray-800 mb-4">Recent Transactions</h3>
    <div class="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <span class="text-gray-400">Billing transaction data will be displayed here</span>
    </div>
</div>
@endsection