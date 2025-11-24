@extends('admin.layouts.app')

@section('title', 'Notifications - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-6">Notifications</h1>

<div class="bg-white rounded-xl shadow-sm border border-gray-100">
    <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">Recent Notifications</h3>
            <button class="text-sm text-[#E75234] font-medium hover:text-[#d14024]">Mark all as read</button>
        </div>
    </div>

    <div class="divide-y divide-gray-100">
        <div class="p-6 hover:bg-gray-50 cursor-pointer">
            <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <i data-lucide="user-plus" class="w-5 h-5 text-blue-600"></i>
                </div>
                <div class="flex-1">
                    <h4 class="font-medium text-gray-900">New user registered</h4>
                    <p class="text-sm text-gray-500 mt-1">John Doe just created an account</p>
                    <p class="text-xs text-gray-400 mt-2">2 minutes ago</p>
                </div>
                <div class="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2"></div>
            </div>
        </div>

        <div class="p-6 hover:bg-gray-50 cursor-pointer">
            <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <i data-lucide="check-circle" class="w-5 h-5 text-green-600"></i>
                </div>
                <div class="flex-1">
                    <h4 class="font-medium text-gray-900">Verification approved</h4>
                    <p class="text-sm text-gray-500 mt-1">Pet verification for "Bella" has been approved</p>
                    <p class="text-xs text-gray-400 mt-2">1 hour ago</p>
                </div>
            </div>
        </div>

        <div class="p-6 hover:bg-gray-50 cursor-pointer">
            <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <i data-lucide="alert-circle" class="w-5 h-5 text-yellow-600"></i>
                </div>
                <div class="flex-1">
                    <h4 class="font-medium text-gray-900">Pending review</h4>
                    <p class="text-sm text-gray-500 mt-1">3 new documents waiting for review</p>
                    <p class="text-xs text-gray-400 mt-2">3 hours ago</p>
                </div>
            </div>
        </div>
    </div>

    <div class="p-6 text-center border-t border-gray-100">
        <button class="text-sm text-gray-600 hover:text-gray-900 font-medium">Load more notifications</button>
    </div>
</div>
@endsection