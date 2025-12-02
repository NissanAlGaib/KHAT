@extends('admin.layouts.app')

@section('title', 'Notifications - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-6">Notifications</h1>

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
        <div class="p-6 hover:bg-gray-50 cursor-pointer">
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
                    <h4 class="font-medium text-gray-900">{{ $notification['title'] }}</h4>
                    <p class="text-sm text-gray-500 mt-1">{{ $notification['message'] }}</p>
                    <p class="text-xs text-gray-400 mt-2">{{ $notification['created_at']->diffForHumans() }}</p>
                </div>
                @if($notification['is_unread'])
                <div class="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2"></div>
                @endif
            </div>
        </div>
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