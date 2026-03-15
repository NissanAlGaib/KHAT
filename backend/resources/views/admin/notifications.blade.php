@extends('admin.layouts.app')

@section('title', 'Notifications - KHAT Admin')

@section('content')
<h1 class="text-2xl font-bold text-gray-900 mb-2">Notifications</h1>
<p class="text-sm text-gray-500 mb-6">Stay updated on user registrations, verifications, vaccination submissions, and platform activity</p>

<!-- Action-Required Summary -->
@if(($adminAlerts ?? collect())->count() > 0)
<div class="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
    <div class="flex items-center gap-2 mb-3">
        <div class="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
            <i data-lucide="alert-triangle" class="w-4 h-4 text-amber-600"></i>
        </div>
        <h3 class="text-sm font-bold text-amber-900">Action Required</h3>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        @foreach($adminAlerts as $alert)
        @php
        $alertBg = [
        'red' => 'bg-white border-red-200 hover:border-red-300',
        'yellow' => 'bg-white border-yellow-200 hover:border-yellow-300',
        'orange' => 'bg-white border-orange-200 hover:border-orange-300',
        'blue' => 'bg-white border-blue-200 hover:border-blue-300',
        'pink' => 'bg-white border-pink-200 hover:border-pink-300',
        'green' => 'bg-white border-green-200 hover:border-green-300',
        ];
        $alertIcon = [
        'red' => 'bg-red-100 text-red-600',
        'yellow' => 'bg-yellow-100 text-yellow-600',
        'orange' => 'bg-orange-100 text-orange-600',
        'blue' => 'bg-blue-100 text-blue-600',
        'pink' => 'bg-pink-100 text-pink-600',
        'green' => 'bg-green-100 text-green-600',
        ];
        @endphp
        <a href="{{ $alert['url'] }}" class="flex items-center gap-3 px-4 py-3 rounded-lg border {{ $alertBg[$alert['color']] ?? 'bg-white border-gray-200' }} transition-all hover:shadow-sm group">
            <div class="w-9 h-9 rounded-lg {{ $alertIcon[$alert['color']] ?? 'bg-gray-100 text-gray-600' }} flex items-center justify-center flex-shrink-0">
                <i data-lucide="{{ $alert['icon'] }}" class="w-4.5 h-4.5"></i>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-900 group-hover:text-[#E75234] transition-colors">{{ $alert['title'] }}</p>
                <p class="text-xs text-gray-500 truncate">{{ $alert['message'] }}</p>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-gray-300 group-hover:text-[#E75234] flex-shrink-0 transition-colors"></i>
        </a>
        @endforeach
    </div>
</div>
@endif

@include('admin.partials.filter-bar', [
'action' => route('admin.notifications'),
'showSearch' => false,
'filters' => [
[
'name' => 'type',
'label' => 'Type',
'placeholder' => 'All Types',
'options' => [
['value' => 'user_registered', 'label' => 'User Registered'],
['value' => 'verification_pending', 'label' => 'Verification Pending'],
['value' => 'vaccination_pending', 'label' => 'Vaccination Pending'],
['value' => 'match_request', 'label' => 'Match Request'],
['value' => 'payment_received', 'label' => 'Payment Received'],
['value' => 'safety_report', 'label' => 'Safety Report'],
],
],
],
'dateFilter' => true,
'perPage' => false,
'totalResults' => $notifications->count(),
])

<div class="bg-white rounded-xl shadow-sm border border-gray-100">
    <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">
                Recent Notifications
                @if($unreadCount > 0)
                <span class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {{ $unreadCount }} new
                </span>
                @endif
            </h3>
        </div>
    </div>

    @if($notifications->count() > 0)
    <div class="divide-y divide-gray-100">
        @foreach($notifications as $notification)
        <a href="{{ $notification['url'] ?? '#' }}" class="block p-6 hover:bg-gray-50 transition-colors group">
            <div class="flex items-start gap-4">
                @php
                $colorClasses = [
                'blue' => 'bg-blue-100 text-blue-600',
                'green' => 'bg-green-100 text-green-600',
                'yellow' => 'bg-yellow-100 text-yellow-600',
                'pink' => 'bg-pink-100 text-pink-600',
                'red' => 'bg-red-100 text-red-600',
                ];
                $colorClass = $colorClasses[$notification['color']] ?? 'bg-gray-100 text-gray-600';
                @endphp
                <div class="w-10 h-10 rounded-full {{ $colorClass }} flex items-center justify-center flex-shrink-0">
                    <i data-lucide="{{ $notification['icon'] }}" class="w-5 h-5"></i>
                </div>
                <div class="flex-1">
                    <h4 class="font-medium text-gray-900 group-hover:text-[#E75234] transition-colors">{{ $notification['title'] }}</h4>
                    <p class="text-sm text-gray-500 mt-1">{{ $notification['message'] }}</p>
                    <p class="text-xs text-gray-400 mt-2">{{ $notification['created_at']->diffForHumans() }}</p>
                </div>
                @if($notification['is_unread'])
                <div class="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2"></div>
                @endif
                <i data-lucide="chevron-right" class="w-4 h-4 text-gray-300 group-hover:text-[#E75234] flex-shrink-0 transition-colors mt-1"></i>
            </div>
        </a>
        @endforeach
    </div>
    @else
    <div class="p-12 text-center">
        <i data-lucide="bell-off" class="w-12 h-12 text-gray-300 mx-auto mb-4"></i>
        <p class="text-gray-500">No notifications</p>
        <p class="text-sm text-gray-400 mt-1">System notifications will appear here</p>
    </div>
    @endif
</div>
@endsection