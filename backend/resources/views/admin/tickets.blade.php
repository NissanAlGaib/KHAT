@extends('admin.layouts.app')

@section('title', 'Support Tickets - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-6">Support Tickets</h1>

<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
    <div class="text-center max-w-md mx-auto">
        <div class="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-6">
            <i data-lucide="ticket" class="w-10 h-10 text-[#E75234]"></i>
        </div>
        <h3 class="text-xl font-bold text-gray-900 mb-2">Coming Soon</h3>
        <p class="text-gray-500 mb-6">The support ticket system is currently under development. Once live, you'll be able to manage user reports, feature requests, and support inquiries from this page.</p>
        <div class="flex justify-center gap-4 text-sm">
            <div class="px-4 py-2 bg-gray-50 rounded-lg">
                <p class="text-gray-400 font-medium">Planned Features</p>
            </div>
        </div>
        <ul class="mt-4 text-sm text-gray-500 space-y-2 text-left max-w-xs mx-auto">
            <li class="flex items-center gap-2">
                <i data-lucide="check" class="w-4 h-4 text-gray-300"></i>
                User issue tracking & assignment
            </li>
            <li class="flex items-center gap-2">
                <i data-lucide="check" class="w-4 h-4 text-gray-300"></i>
                Priority-based ticket queue
            </li>
            <li class="flex items-center gap-2">
                <i data-lucide="check" class="w-4 h-4 text-gray-300"></i>
                Response time analytics
            </li>
            <li class="flex items-center gap-2">
                <i data-lucide="check" class="w-4 h-4 text-gray-300"></i>
                In-app user communication
            </li>
        </ul>
    </div>
</div>
@endsection