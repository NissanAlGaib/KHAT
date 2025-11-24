@extends('admin.layouts.app')

@section('title', 'Support Tickets - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-6">Support Tickets</h1>

<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
        <span class="text-sm font-semibold text-gray-500">Open Tickets</span>
        <p class="text-2xl font-bold text-gray-900 mt-2">24</p>
    </div>
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
        <span class="text-sm font-semibold text-gray-500">In Progress</span>
        <p class="text-2xl font-bold text-gray-900 mt-2">12</p>
    </div>
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
        <span class="text-sm font-semibold text-gray-500">Resolved Today</span>
        <p class="text-2xl font-bold text-gray-900 mt-2">8</p>
    </div>
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
        <span class="text-sm font-semibold text-gray-500">Avg Response Time</span>
        <p class="text-2xl font-bold text-gray-900 mt-2">2.4h</p>
    </div>
</div>

<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <h3 class="font-semibold text-gray-800 mb-4">Ticket List</h3>
    <div class="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <span class="text-gray-400">Support ticket system integration pending</span>
    </div>
</div>
@endsection