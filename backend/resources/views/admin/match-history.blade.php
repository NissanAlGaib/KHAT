@extends('admin.layouts.app')

@section('title', 'Match History - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-6">Match History</h1>

<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="relative">
            <input type="text" placeholder="Search matches..." class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pl-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
            <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-400">
                <i data-lucide="search" class="w-4 h-4"></i>
            </div>
        </div>
        <select class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
            <option>All Statuses</option>
            <option>Pending</option>
            <option>Accepted</option>
            <option>Rejected</option>
            <option>Completed</option>
        </select>
        <select class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
            <option>Last 90 Days</option>
            <option>All Time</option>
        </select>
    </div>
</div>

<div class="bg-white rounded-xl shadow-sm border border-gray-100">
    <div class="p-6 text-center text-gray-500">
        <i data-lucide="history" class="w-12 h-12 text-gray-300 mx-auto mb-3"></i>
        <p>Match history data will be displayed here</p>
        <p class="text-sm mt-2">Connect to your backend match service to view detailed match records</p>
    </div>
</div>
@endsection