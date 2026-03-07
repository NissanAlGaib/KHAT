@extends('admin.layouts.app')

@section('title', 'Audit Logs - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-2">Audit Logs</h1>
<p class="text-sm text-gray-500 mb-6">Track all admin actions and system events</p>

@include('admin.partials.filter-bar', [
'action' => route('admin.audit-logs'),
'searchPlaceholder' => 'Search by user name or description...',
'searchName' => 'search',
'filters' => [
['name' => 'action_type', 'label' => 'Action Type', 'options' => [
['value' => 'login', 'label' => 'Login'],
['value' => 'logout', 'label' => 'Logout'],
['value' => 'create', 'label' => 'Create'],
['value' => 'update', 'label' => 'Update'],
['value' => 'delete', 'label' => 'Delete'],
['value' => 'verify', 'label' => 'Verify'],
['value' => 'reject', 'label' => 'Reject'],
]],
['name' => 'user_type', 'label' => 'User Type', 'options' => [
['value' => 'admins', 'label' => 'Admins Only'],
]],
],
'dateFilter' => true,
'datePresets' => true,
'exports' => true,
'perPage' => true,
'defaultPerPage' => 20,
'totalResults' => $logs->total(),
])

<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="p-6 border-b border-gray-100">
        <h3 class="font-semibold text-gray-800">Activity Log</h3>
    </div>

    @if($logs->count() > 0)
    <div class="overflow-x-auto">
        <table class="w-full text-left">
            <thead>
                <tr class="bg-[#E75234] text-white">
                    <th class="px-6 py-3 text-sm font-semibold text-white">Timestamp</th>
                    <th class="px-6 py-3 text-sm font-semibold text-white">User</th>
                    <th class="px-6 py-3 text-sm font-semibold text-white">Action</th>
                    <th class="px-6 py-3 text-sm font-semibold text-white">Description</th>
                    <th class="px-6 py-3 text-sm font-semibold text-white">IP Address</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                @foreach($logs as $log)
                <tr class="hover:bg-orange-50/50">
                    <td class="px-6 py-4 text-sm text-gray-600">
                        {{ $log->created_at->format('M d, Y H:i:s') }}
                    </td>
                    <td class="px-6 py-4">
                        @if($log->user)
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
                                {{ strtoupper(substr($log->user->name, 0, 1)) }}
                            </div>
                            <span class="text-sm font-medium text-gray-900">{{ $log->user->name }}</span>
                        </div>
                        @else
                        <span class="text-sm text-gray-400">System</span>
                        @endif
                    </td>
                    <td class="px-6 py-4">
                        @php
                        $actionColors = [
                        'login' => 'bg-blue-100 text-blue-700',
                        'logout' => 'bg-gray-100 text-gray-700',
                        'create' => 'bg-green-100 text-green-700',
                        'update' => 'bg-yellow-100 text-yellow-700',
                        'delete' => 'bg-red-100 text-red-700',
                        'verify' => 'bg-emerald-100 text-emerald-700',
                        'reject' => 'bg-rose-100 text-rose-700',
                        ];
                        $actionColor = $actionColors[$log->action_type] ?? 'bg-gray-100 text-gray-700';
                        @endphp
                        <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold {{ $actionColor }}">
                            {{ ucfirst($log->action_type) }}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600">
                        {{ $log->description ?? $log->action }}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500">
                        {{ $log->ip_address ?? 'N/A' }}
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="p-4 border-t border-gray-100">
        {{ $logs->links() }}
    </div>
    @else
    <div class="p-12 text-center">
        <i data-lucide="file-text" class="w-12 h-12 text-gray-300 mx-auto mb-4"></i>
        <p class="text-gray-500">No audit logs found</p>
        <p class="text-sm text-gray-400 mt-1">Admin actions will be recorded here</p>
    </div>
    @endif
</div>
@endsection