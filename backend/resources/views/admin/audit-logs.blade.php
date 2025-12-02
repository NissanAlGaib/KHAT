@extends('admin.layouts.app')

@section('title', 'Audit Logs - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-6">Audit Logs</h1>

<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
    <form method="GET" action="{{ route('admin.audit-logs') }}" class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select name="action_type" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
            <option value="">All Actions</option>
            <option value="login" {{ request('action_type') == 'login' ? 'selected' : '' }}>Login</option>
            <option value="logout" {{ request('action_type') == 'logout' ? 'selected' : '' }}>Logout</option>
            <option value="create" {{ request('action_type') == 'create' ? 'selected' : '' }}>Create</option>
            <option value="update" {{ request('action_type') == 'update' ? 'selected' : '' }}>Update</option>
            <option value="delete" {{ request('action_type') == 'delete' ? 'selected' : '' }}>Delete</option>
            <option value="verify" {{ request('action_type') == 'verify' ? 'selected' : '' }}>Verify</option>
            <option value="reject" {{ request('action_type') == 'reject' ? 'selected' : '' }}>Reject</option>
        </select>
        <select name="user_type" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
            <option value="">All Users</option>
            <option value="admins" {{ request('user_type') == 'admins' ? 'selected' : '' }}>Admins Only</option>
        </select>
        <input type="date" name="date_from" value="{{ request('date_from') }}" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]" placeholder="From date">
        <div class="flex gap-2">
            <input type="date" name="date_to" value="{{ request('date_to') }}" class="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]" placeholder="To date">
            <button type="submit" class="px-4 py-2.5 bg-[#E75234] text-white rounded-lg text-sm font-medium hover:bg-[#d14024] transition-colors">
                <i data-lucide="search" class="w-4 h-4"></i>
            </button>
        </div>
    </form>
</div>

<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="p-6 border-b border-gray-100">
        <h3 class="font-semibold text-gray-800">Activity Log</h3>
    </div>
    
    @if($logs->count() > 0)
    <div class="overflow-x-auto">
        <table class="w-full text-left">
            <thead>
                <tr class="border-b border-gray-200 bg-gray-50">
                    <th class="px-6 py-3 text-sm font-semibold text-gray-600">Timestamp</th>
                    <th class="px-6 py-3 text-sm font-semibold text-gray-600">User</th>
                    <th class="px-6 py-3 text-sm font-semibold text-gray-600">Action</th>
                    <th class="px-6 py-3 text-sm font-semibold text-gray-600">Description</th>
                    <th class="px-6 py-3 text-sm font-semibold text-gray-600">IP Address</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                @foreach($logs as $log)
                <tr class="hover:bg-gray-50">
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