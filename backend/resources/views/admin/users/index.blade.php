@extends('admin.layouts.app')

@section('title', 'User Management - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
<p class="text-sm text-gray-500 mb-6">Manage user accounts, verification status, and subscriptions</p>

<!-- Tabs -->
<div class="inline-flex bg-white rounded-xl p-1 shadow-sm border border-gray-200 mb-6 overflow-x-auto">
    <a href="{{ route('admin.users.index', ['status' => 'verified']) }}"
        class="whitespace-nowrap px-6 py-2.5 rounded-lg text-sm font-semibold transition-all {{ $status === 'verified' ? 'bg-[#E75234] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50' }}">
        Verified Users
    </a>
    <a href="{{ route('admin.users.index', ['status' => 'pending']) }}"
        class="whitespace-nowrap px-6 py-2.5 rounded-lg text-sm font-semibold transition-all {{ $status === 'pending' ? 'bg-[#E75234] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50' }}">
        Pending Verification
    </a>
    <a href="{{ route('admin.users.index', ['status' => 'rejected']) }}"
        class="whitespace-nowrap px-6 py-2.5 rounded-lg text-sm font-semibold transition-all {{ $status === 'rejected' ? 'bg-[#E75234] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50' }}">
        Rejected
    </a>
    <a href="{{ route('admin.users.index', ['status' => 'all']) }}"
        class="whitespace-nowrap px-6 py-2.5 rounded-lg text-sm font-semibold transition-all {{ $status === 'all' ? 'bg-[#E75234] text-white shadow-md' : 'text-gray-600 hover:bg-gray-50' }}">
        All Users
    </a>
</div>

<!-- Filter Section -->
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
    <form action="{{ route('admin.users.index') }}" method="GET">
        <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><i data-lucide="filter" class="w-4 h-4 text-[#E75234]"></i>Filters</h3>
        <input type="hidden" name="status" value="{{ $status }}">

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <!-- User Type Filter -->
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">User Type</label>
                <div class="relative">
                    <select name="user_type" class="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                        <option value="">All Types</option>
                        <option value="breeder" {{ request('user_type') == 'breeder' ? 'selected' : '' }}>Breeder</option>
                        <option value="shooter" {{ request('user_type') == 'shooter' ? 'selected' : '' }}>Shooter</option>
                        <option value="admin" {{ request('user_type') == 'admin' ? 'selected' : '' }}>Admin</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </div>
                </div>
            </div>

            <!-- Document Status Filter -->
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Document Status</label>
                <div class="relative">
                    <select name="doc_status" class="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                        <option value="">All Statuses</option>
                        <option value="valid" {{ request('doc_status') == 'valid' ? 'selected' : '' }}>Valid</option>
                        <option value="expired" {{ request('doc_status') == 'expired' ? 'selected' : '' }}>Expired</option>
                        <option value="missing" {{ request('doc_status') == 'missing' ? 'selected' : '' }}>Missing</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </div>
                </div>
            </div>

            <!-- Subscription Tier Filter -->
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Subscription Tier</label>
                <div class="relative">
                    <select name="subscription" class="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                        <option value="">All Tiers</option>
                        <option value="free" {{ request('subscription') == 'free' ? 'selected' : '' }}>Free</option>
                        <option value="standard" {{ request('subscription') == 'standard' ? 'selected' : '' }}>Standard</option>
                        <option value="premium" {{ request('subscription') == 'premium' ? 'selected' : '' }}>Premium</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </div>
                </div>
            </div>

            <!-- Search Input -->
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Search by Name or ID</label>
                <div class="relative">
                    <input type="text" name="search" value="{{ request('search') }}" placeholder="Search users" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pl-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-400">
                        <i data-lucide="search" class="w-4 h-4"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
            <button type="submit" class="px-6 py-2.5 bg-[#E75234] text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-[#d14024] transition-all hover:shadow-md">
                Apply Filters
            </button>
            <a href="{{ route('admin.users.index', ['status' => $status]) }}" class="px-6 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all shadow-sm">
                Reset Filters
            </a>
        </div>
    </form>
</div>

@include('admin.partials.date-filter')

<!-- Suspend User Modal -->
<div id="suspendModal" class="hidden fixed inset-0 z-[60] overflow-y-auto bg-gray-900/60 backdrop-blur-sm">
    <div class="flex items-center justify-center min-h-screen px-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <i data-lucide="pause-circle" class="w-5 h-5 text-orange-600"></i>
                </div>
                <div>
                    <h3 class="text-lg font-bold text-gray-900">Suspend User</h3>
                    <p class="text-sm text-gray-500" id="suspendUserName">User Name</p>
                </div>
            </div>
            
            <form id="suspendForm" method="POST">
                @csrf
                <input type="hidden" name="status" value="suspended">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Suspension Duration</label>
                        <select name="suspension_duration" class="w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none">
                            <option value="indefinite">Indefinite (Until manually lifted)</option>
                            <option value="1_day">24 Hours</option>
                            <option value="3_days">3 Days</option>
                            <option value="7_days">7 Days</option>
                            <option value="30_days">30 Days</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Reason for Suspension</label>
                        <textarea name="suspension_reason" required rows="4" class="w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" placeholder="Explain why this user is being suspended..."></textarea>
                    </div>
                </div>

                <div class="mt-6 flex gap-3">
                    <button type="button" onclick="closeSuspendModal()" class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-all">
                        Cancel
                    </button>
                    <button type="submit" class="flex-1 px-4 py-2.5 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-all shadow-sm">
                        Suspend User
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Results Count -->
<p class="text-sm text-gray-600 mb-4 font-medium">
    Showing {{ $users->firstItem() ?? 0 }} - {{ $users->lastItem() ?? 0 }} of {{ number_format($users->total()) }} entries
</p>

<!-- Users Table -->
<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[1100px]">
            <thead>
                <tr class="bg-[#E75234] text-white text-sm">
                    <th class="px-6 py-4 font-semibold">User ID</th>
                    <th class="px-6 py-4 font-semibold">Name</th>
                    <th class="px-6 py-4 font-semibold">User Type</th>
                    <th class="px-6 py-4 font-semibold">Account Status</th>
                    <th class="px-6 py-4 font-semibold">Document Status</th>
                    <th class="px-6 py-4 font-semibold">Subscription Tier</th>
                    <th class="px-6 py-4 font-semibold">Joined</th>
                    <th class="px-6 py-4 font-semibold text-center">Reports</th>
                    <th class="px-6 py-4 font-semibold text-center">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 text-sm">
                @forelse($users as $user)
                <tr class="hover:bg-orange-50/50 transition-colors">
                    <td class="px-6 py-4 font-mono text-xs text-gray-600">USR-{{ str_pad($user->id, 5, '0', STR_PAD_LEFT) }}</td>
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                {{ strtoupper(substr($user->name ?? $user->email, 0, 1)) }}
                            </div>
                            <span class="font-medium text-gray-900">{{ $user->name ?? $user->email }}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        @if($user->roles->isNotEmpty())
                        @foreach($user->roles as $role)
                        <span class="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-100 text-orange-700 capitalize mr-1 mb-1">{{ $role->role_type }}</span>
                        @endforeach
                        @else
                        <span class="text-gray-500 text-xs">—</span>
                        @endif
                    </td>
                    <td class="px-6 py-4">
                        @if($user->status === 'suspended')
                        <div class="flex flex-col items-start gap-1">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200">
                                <i data-lucide="pause-circle" class="w-3.5 h-3.5"></i>
                                Suspended
                            </span>
                            @if($user->suspension_end_date)
                            <span class="text-[10px] text-orange-600 font-medium pl-1">
                                Until {{ $user->suspension_end_date->format('M d, Y') }}
                            </span>
                            @else
                            <span class="text-[10px] text-orange-600 font-medium pl-1">Indefinite</span>
                            @endif
                        </div>
                        @elseif($user->status === 'banned')
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 text-red-700 text-xs font-bold border border-red-200">
                            <i data-lucide="ban" class="w-3.5 h-3.5"></i>
                            Banned
                        </span>
                        @elseif($user->userAuth->first()?->status === 'approved')
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-100 text-green-700 text-xs font-semibold">
                            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                            Verified
                        </span>
                        @elseif($user->userAuth->first()?->status === 'rejected')
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-100 text-red-700 text-xs font-semibold">
                            <i data-lucide="x-circle" class="w-3.5 h-3.5"></i>
                            Rejected
                        </span>
                        @else
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yellow-100 text-yellow-700 text-xs font-semibold">
                            <i data-lucide="clock" class="w-3.5 h-3.5"></i>
                            Pending
                        </span>
                        @endif
                    </td>
                    <td class="px-6 py-4">
                        @php
                        $userAuthRecords = $user->userAuth;
                        $hasDocuments = $userAuthRecords->isNotEmpty();
                        $hasExpiry = false;
                        $isExpired = false;

                        if ($hasDocuments) {
                            foreach ($userAuthRecords as $auth) {
                                if ($auth->expiry_date) {
                                    $hasExpiry = true;
                                    if (\Carbon\Carbon::parse($auth->expiry_date)->isPast()) {
                                        $isExpired = true;
                                        break;
                                    }
                                }
                            }
                        }
                        @endphp

                        @if(!$hasDocuments)
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold">
                            <i data-lucide="file-x" class="w-3.5 h-3.5"></i>
                            Missing
                        </span>
                        @elseif($isExpired)
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-100 text-red-700 text-xs font-semibold">
                            <i data-lucide="alert-circle" class="w-3.5 h-3.5"></i>
                            Expired
                        </span>
                        @else
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-100 text-green-700 text-xs font-semibold">
                            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                            Valid
                        </span>
                        @endif
                    </td>
                    <td class="px-6 py-4">
                        @php
                        $tier = $user->subscription_tier ?? 'free';
                        $tierColors = [
                        'free' => 'bg-pink-100 text-pink-700',
                        'standard' => 'bg-purple-100 text-purple-700',
                        'premium' => 'bg-orange-100 text-orange-700'
                        ];
                        @endphp
                        <span class="inline-block px-3 py-1.5 rounded-lg text-xs font-semibold {{ $tierColors[$tier] }}">
                            {{ ucfirst($tier) }}
                        </span>
                    </td>
                    <td class="px-6 py-4" title="{{ $user->created_at->format('M d, Y h:i A') }} ({{ $user->created_at->diffForHumans() }})">
                        <div class="flex flex-col">
                            <span class="text-sm font-medium text-gray-900">{{ $user->created_at->format('M d, Y') }}</span>
                            <span class="text-xs text-gray-500">{{ $user->created_at->format('h:i A') }}</span>
                            @if($user->updated_at && $user->created_at && $user->updated_at->gt($user->created_at))
                                <span class="text-[10px] text-gray-400 mt-1 italic" title="Updated {{ $user->updated_at->format('M d, Y h:i A') }}">
                                    Updated {{ $user->updated_at->diffForHumans() }}
                                    @if($user->updater)
                                        by {{ $user->updater->name }}
                                    @endif
                                </span>
                            @endif
                        </div>
                    </td>
                    <td class="px-6 py-4 text-center">
                        @if($user->reports_against_count > 0)
                        <a href="{{ route('admin.reports', ['search' => $user->name]) }}" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors" title="View reports against this user">
                            <i data-lucide="shield-alert" class="w-3.5 h-3.5"></i>
                            {{ $user->reports_against_count }}
                        </a>
                        @else
                        <span class="text-gray-400 text-xs">—</span>
                        @endif
                    </td>
                    <td class="px-6 py-4 text-center">
                        <div class="relative inline-block">
                            <button onclick="toggleDropdown(event, 'dropdown-{{ $user->id }}')" class="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors p-1.5 rounded-lg hover:bg-gray-100">
                                <i data-lucide="more-horizontal" class="w-5 h-5"></i>
                            </button>
                            <div id="dropdown-{{ $user->id }}" class="hidden fixed w-52 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" style="z-index: 9999;">
                                <a href="{{ route('admin.users.show', $user->id) }}" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                    <i data-lucide="eye" class="w-4 h-4 text-gray-500"></i>
                                    View Details
                                </a>
                                <button onclick="openSuspendModal({{ $user->id }}, '{{ $user->name ?? $user->email }}')" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left">
                                    <i data-lucide="pause-circle" class="w-4 h-4 text-gray-500"></i>
                                    Suspend Account
                                </button>
                                <div class="border-t border-gray-100"></div>
                                <button type="button" onclick="deleteUser({{ $user->id }})" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="8" class="px-6 py-16 text-center">
                        <div class="flex flex-col items-center gap-3 text-gray-400">
                            <i data-lucide="users" class="w-16 h-16 text-gray-300"></i>
                            <p class="text-base font-medium text-gray-500">No users found</p>
                            <p class="text-sm text-gray-400">Try adjusting your filters</p>
                        </div>
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

<!-- Pagination -->
<div class="mt-6">
    {{ $users->links() }}
</div>

<!-- User Verification Modal -->
<div id="userModal" class="hidden fixed inset-0 z-50 overflow-y-auto bg-gray-900/60 backdrop-blur-sm">
    <div class="flex items-start justify-center min-h-screen px-4 py-8">
        <div class="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-auto">
            <!-- Modal Header -->
            <div class="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-gray-100">
                <div class="flex items-center justify-between px-8 py-5">
                    <div>
                        <h2 class="text-lg font-bold text-gray-900">Verification Review</h2>
                        <p class="text-sm text-gray-500 mt-0.5">User: <span id="modalUserName" class="font-medium text-gray-700"></span></p>
                    </div>
                    <button onclick="closeUserModal()" class="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>

            <!-- Modal Body - Single Scrollable View -->
            <div class="px-8 py-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-8">

                <!-- Section: Warnings & Safety -->
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                <i data-lucide="alert-triangle" class="w-4 h-4 text-red-600"></i>
                            </div>
                            <h3 class="text-base font-bold text-gray-900">Safety & Warnings</h3>
                            <span id="warningCountBadge" class="text-xs font-medium text-white bg-red-500 px-2 py-0.5 rounded-full"></span>
                        </div>
                        <button onclick="openWarnModal()" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-lg hover:bg-orange-200 transition-colors">
                            <i data-lucide="megaphone" class="w-3.5 h-3.5"></i>
                            Warn User
                        </button>
                    </div>
                    <div id="warningsContainer" class="space-y-3">
                        <!-- Warnings loaded via JS -->
                    </div>
                </div>

                <!-- Divider -->
                <div class="border-t border-gray-100"></div>

                <!-- Section: Documents -->
                <div>
                    <div class="flex items-center gap-2 mb-4">
                        <div class="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                            <i data-lucide="file-text" class="w-4 h-4 text-orange-600"></i>
                        </div>
                        <h3 class="text-base font-bold text-gray-900">Submitted Documents</h3>
                        <span id="docCount" class="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full"></span>
                    </div>
                    <div id="documentsContainer" class="space-y-4 image-gallery">
                        <!-- Documents loaded via JS -->
                    </div>
                </div>

                <!-- Divider -->
                <div class="border-t border-gray-100"></div>

                <!-- Section: Expiry Tracker -->
                <div>
                    <div class="flex items-center gap-2 mb-4">
                        <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <i data-lucide="calendar-clock" class="w-4 h-4 text-blue-600"></i>
                        </div>
                        <h3 class="text-base font-bold text-gray-900">Expiry Tracker</h3>
                    </div>
                    <div id="expiryTracker">
                        <!-- Expiry tracker loaded via JS -->
                    </div>
                </div>

                <!-- Divider -->
                <div class="border-t border-gray-100"></div>

                <!-- Section: Submission History -->
                <div>
                    <div class="flex items-center gap-2 mb-4">
                        <div class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                            <i data-lucide="history" class="w-4 h-4 text-purple-600"></i>
                        </div>
                        <h3 class="text-base font-bold text-gray-900">Submission History</h3>
                    </div>
                    <div id="submissionHistory">
                        <!-- Submission history loaded via JS -->
                    </div>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="sticky bottom-0 bg-white rounded-b-2xl px-8 py-4 border-t border-gray-100 flex justify-end">
                <button onclick="closeUserModal()" class="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-all">
                    Close
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Warn User Modal -->
<div id="warnModal" class="hidden fixed inset-0 z-[60] overflow-y-auto bg-gray-900/60 backdrop-blur-sm">
    <div class="flex items-center justify-center min-h-screen px-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <i data-lucide="megaphone" class="w-5 h-5 text-orange-600"></i>
                </div>
                <h3 class="text-lg font-bold text-gray-900">Issue Official Warning</h3>
            </div>
            
            <form id="warnForm" onsubmit="submitWarning(event)">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Violation Type</label>
                        <select name="type" required class="w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none">
                            <option value="Harassment">Harassment</option>
                            <option value="Spam">Spam</option>
                            <option value="Fraud">Fraud / Scam</option>
                            <option value="Terms Violation">Terms of Service Violation</option>
                            <option value="Inappropriate Content">Inappropriate Content</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Detailed Message</label>
                        <textarea name="message" required rows="4" class="w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" placeholder="Explain the reason for this warning..."></textarea>
                    </div>
                </div>

                <div class="mt-6 flex gap-3">
                    <button type="button" onclick="closeWarnModal()" class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-all">
                        Cancel
                    </button>
                    <button type="submit" class="flex-1 px-4 py-2.5 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition-all shadow-sm">
                        Issue Warning
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Delete Confirmation Modal -->
<div id="deleteModal" class="hidden fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50">
    <div class="flex items-center justify-center min-h-screen px-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Delete User Record?</h3>
            <p class="text-sm text-gray-600 mb-4">Are you sure you want to delete this user?<br>This action cannot be undone.</p>

            <div id="deleteUserInfo" class="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
                <!-- User info will be populated here -->
            </div>

            <p class="text-xs text-gray-500 mb-6">Once deleted, this record will be permanently removed from the user list and audit logs will record this action.</p>

            <div class="flex gap-3 justify-end">
                <button onclick="closeDeleteModal()" class="px-6 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all">
                    Cancel
                </button>
                <button onclick="confirmDelete()" class="px-6 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-all">
                    Confirm
                </button>
            </div>
        </div>
    </div>
</div>

@push('scripts')
<script>
    let currentUserId = null;

    function closeAllDropdowns() {
        document.querySelectorAll('[id^="dropdown-"]').forEach(d => d.classList.add('hidden'));
    }

    function toggleDropdown(event, dropdownId) {
        event.stopPropagation();
        const dropdown = document.getElementById(dropdownId);
        const button = event.currentTarget;
        const wasHidden = dropdown.classList.contains('hidden');

        closeAllDropdowns();

        if (wasHidden) {
            const rect = button.getBoundingClientRect();
            const dropdownWidth = 208; // w-52 = 13rem = 208px
            const dropdownHeight = dropdown.scrollHeight || 160;

            let top = rect.bottom + 4;
            let left = rect.right - dropdownWidth;

            // Prevent going off-screen bottom
            if (top + dropdownHeight > window.innerHeight) {
                top = rect.top - dropdownHeight - 4;
            }
            // Prevent going off-screen left
            if (left < 8) {
                left = 8;
            }

            dropdown.style.top = top + 'px';
            dropdown.style.left = left + 'px';
            dropdown.classList.remove('hidden');
        }
    }

    document.addEventListener('click', closeAllDropdowns);
    window.addEventListener('scroll', closeAllDropdowns, true);
    window.addEventListener('resize', closeAllDropdowns);

    // Open user verification modal
    async function openUserModal(userId) {
        currentUserId = userId;
        const modal = document.getElementById('userModal');
        modal.classList.remove('hidden');

        try {
            const response = await fetch(`/admin/users/${userId}/details`);
            const data = await response.json();

            if (data.success) {
                document.getElementById('modalUserName').textContent = data.user.name || data.user.email;
                loadWarnings(data.user.warnings, data.user.warning_count);
                loadDocuments(data.user.documents);
                loadSubmissionHistory(data.user.documents);
                loadExpiryTracker(data.user.documents);

                // Reinitialize Lucide icons
                setTimeout(() => lucide.createIcons(), 100);
            }
        } catch (error) {
            console.error('Error loading user details:', error);
            Swal.fire({
                title: 'Error',
                text: 'Failed to load user details',
                icon: 'error',
                confirmButtonColor: '#E75234'
            });
        }
    }

    function closeUserModal() {
        document.getElementById('userModal').classList.add('hidden');
        currentUserId = null;
    }

    function loadWarnings(warnings, count) {
        const container = document.getElementById('warningsContainer');
        const badge = document.getElementById('warningCountBadge');
        
        badge.textContent = count || '0';
        
        if (!warnings || warnings.length === 0) {
            container.innerHTML = `
                <div class="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p class="text-sm text-gray-400">No warnings issued to this user.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = warnings.map(w => `
            <div class="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold uppercase rounded border border-red-100">${w.type}</span>
                        <span class="text-[11px] text-gray-400">${w.created_at}</span>
                    </div>
                    ${w.acknowledged_at ? `
                        <span class="inline-flex items-center gap-1 text-[10px] font-bold text-green-600">
                            <i data-lucide="check-circle-2" class="w-3 h-3"></i> Acknowledged
                        </span>
                    ` : `
                        <span class="inline-flex items-center gap-1 text-[10px] font-bold text-orange-500">
                            <i data-lucide="clock" class="w-3 h-3"></i> Unread
                        </span>
                    `}
                </div>
                <p class="text-sm text-gray-700 leading-relaxed mb-2">${w.message}</p>
                <div class="flex items-center gap-1.5 pt-2 border-t border-gray-50">
                    <div class="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500">
                        ${w.admin_name.charAt(0)}
                    </div>
                    <span class="text-[11px] text-gray-500">Issued by <span class="font-semibold">${w.admin_name}</span></span>
                </div>
            </div>
        `).join('');
    }

    function openWarnModal() {
        document.getElementById('warnModal').classList.remove('hidden');
    }

    function closeWarnModal() {
        document.getElementById('warnModal').classList.add('hidden');
        document.getElementById('warnForm').reset();
    }

    // Suspend Modal Functions
    function openSuspendModal(userId, userName) {
        const modal = document.getElementById('suspendModal');
        const nameEl = document.getElementById('suspendUserName');
        const form = document.getElementById('suspendForm');
        
        nameEl.textContent = userName;
        form.action = `/admin/users/${userId}/status`;
        
        modal.classList.remove('hidden');
    }

    function closeSuspendModal() {
        document.getElementById('suspendModal').classList.add('hidden');
        document.getElementById('suspendForm').reset();
    }

    async function submitWarning(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        try {
            const response = await fetch(`/admin/users/${currentUserId}/warn`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(Object.fromEntries(formData))
            });

            if (response.ok) {
                Swal.fire({
                    title: 'Warning Issued',
                    text: 'The user has been officially warned.',
                    icon: 'success',
                    confirmButtonColor: '#E75234'
                }).then(() => {
                    closeWarnModal();
                    openUserModal(currentUserId); // Refresh data
                });
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Failed to issue warning');
            }
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error.message,
                icon: 'error',
                confirmButtonColor: '#E75234'
            });
        }
    }

    function loadDocuments(documents) {
        const container = document.getElementById('documentsContainer');
        const countBadge = document.getElementById('docCount');

        if (!documents || documents.length === 0) {
            container.innerHTML = `
                <div class="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <i data-lucide="file-x" class="w-10 h-10 mx-auto mb-3 text-gray-300"></i>
                    <p class="text-sm font-medium text-gray-500">No documents uploaded yet</p>
                    <p class="text-xs text-gray-400 mt-1">This user hasn't submitted any verification documents</p>
                </div>
            `;
            countBadge.textContent = '0';
            return;
        }

        countBadge.textContent = documents.length;

        container.innerHTML = documents.map(doc => {
            const statusMap = {
                approved: { color: 'green', icon: 'check-circle', label: 'Approved' },
                rejected: { color: 'red', icon: 'x-circle', label: 'Rejected' },
                pending: { color: 'yellow', icon: 'clock', label: 'Pending' }
            };
            const s = statusMap[doc.status] || statusMap.pending;

            const isImage = doc.document_path && /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(doc.document_path);

            // Document thumbnail
            let thumbnailHtml = '';
            if (doc.document_path && isImage) {
                thumbnailHtml = `
                    <div class="w-28 h-28 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all group" onclick="viewDocument('${doc.document_path}', '${doc.auth_type.replace(/_/g, ' ')}')">
                        <img src="${doc.document_path}" alt="Document" class="w-full h-full object-cover group-hover:scale-105 transition-transform" onerror="this.parentElement.innerHTML='<div class=\\'flex items-center justify-center w-full h-full text-gray-400\\'><i data-lucide=\\'image-off\\' class=\\'w-6 h-6\\'></i></div>'">
                    </div>
                `;
            } else if (doc.document_path) {
                thumbnailHtml = `
                    <div class="w-28 h-28 rounded-lg bg-gray-50 flex-shrink-0 cursor-pointer border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all flex flex-col items-center justify-center gap-2" onclick="viewDocument('${doc.document_path}', '${doc.auth_type.replace(/_/g, ' ')}')">
                        <i data-lucide="file-text" class="w-8 h-8 text-orange-400"></i>
                        <span class="text-[10px] font-medium text-gray-500 uppercase">View File</span>
                    </div>
                `;
            }

            // Details grid
            const fields = [
                { label: 'Name on Doc', value: doc.document_name },
                { label: 'Doc Number', value: doc.document_number },
                { label: 'Authority', value: doc.issuing_authority },
                { label: 'Issued', value: doc.issue_date },
                { label: 'Expires', value: doc.expiry_date }
            ].filter(f => f.value);

            let detailsGrid = '';
            if (fields.length > 0) {
                detailsGrid = `
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 mt-3 pt-3 border-t border-gray-100">
                        ${fields.map(f => `
                            <div>
                                <p class="text-[11px] font-medium text-gray-400 uppercase tracking-wide">${f.label}</p>
                                <p class="text-sm text-gray-800 font-medium">${f.value}</p>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            // Rejection banner
            let rejectionHtml = '';
            if (doc.status === 'rejected' && doc.rejection_reason) {
                rejectionHtml = `
                    <div class="mt-3 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5 flex items-start gap-2">
                        <i data-lucide="alert-circle" class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"></i>
                        <div>
                            <p class="text-xs font-semibold text-red-600">Rejection Reason</p>
                            <p class="text-sm text-red-700 mt-0.5">${doc.rejection_reason}</p>
                        </div>
                    </div>
                `;
            }

            // Action buttons
            let actionHtml = '';
            if (doc.status === 'pending') {
                actionHtml = `
                    <div class="flex gap-2 mt-4">
                        <button onclick="updateVerification(${doc.auth_id}, 'approved')" class="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-4 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">
                            <i data-lucide="check" class="w-4 h-4"></i> Approve
                        </button>
                        <button onclick="updateVerification(${doc.auth_id}, 'rejected')" class="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-4 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
                            <i data-lucide="x" class="w-4 h-4"></i> Reject
                        </button>
                    </div>
                `;
            }

            return `
                <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                    <div class="flex gap-5">
                        ${thumbnailHtml}
                        <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between gap-3">
                                <div>
                                    <h4 class="font-semibold text-gray-900 capitalize text-[15px]">${doc.auth_type.replace(/_/g, ' ')}</h4>
                                    <p class="text-xs text-gray-400 mt-0.5">Submitted ${doc.date_submitted}</p>
                                </div>
                                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-${s.color}-50 text-${s.color}-700 text-xs font-semibold flex-shrink-0 border border-${s.color}-100">
                                    <i data-lucide="${s.icon}" class="w-3.5 h-3.5"></i>
                                    ${s.label}
                                </span>
                            </div>
                            ${detailsGrid}
                            ${rejectionHtml}
                            ${actionHtml}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function loadSubmissionHistory(documents) {
        const container = document.getElementById('submissionHistory');

        if (!documents || documents.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center py-6 text-sm">No submission history available</p>';
            return;
        }

        const sortedDocs = [...documents].sort((a, b) => new Date(b.date_created) - new Date(a.date_created));

        container.innerHTML = `
            <div class="relative pl-6 border-l-2 border-gray-200 space-y-5">
                ${sortedDocs.map((doc, idx) => {
                    const statusMap = {
                        approved: { color: 'green', icon: 'check', label: 'Approved' },
                        rejected: { color: 'red', icon: 'x', label: 'Rejected' },
                        pending: { color: 'yellow', icon: 'clock', label: 'Awaiting Review' }
                    };
                    const s = statusMap[doc.status] || statusMap.pending;

                    return `
                        <div class="relative">
                            <div class="absolute -left-[calc(0.75rem+1.5px)] top-1 w-5 h-5 rounded-full bg-${s.color}-100 border-2 border-${s.color}-400 flex items-center justify-center">
                                <i data-lucide="${s.icon}" class="w-2.5 h-2.5 text-${s.color}-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-semibold text-gray-900">${s.label}</p>
                                <p class="text-xs text-gray-600 capitalize">${doc.auth_type.replace(/_/g, ' ')}</p>
                                <p class="text-[11px] text-gray-400 mt-0.5">${doc.date_created}</p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function loadExpiryTracker(documents) {
        const container = document.getElementById('expiryTracker');

        if (!documents || documents.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center py-6 text-sm">No documents to track</p>';
            return;
        }

        container.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                ${documents.map(doc => {
                    const daysRemaining = Math.floor(doc.days_remaining);
                    const expiryDate = doc.expiry_date || null;
                    
                    let statusBadge, statusText, statusIcon, progressColor;
                    
                    if (doc.days_remaining === null) {
                        statusBadge = 'bg-gray-50 border-gray-200 text-gray-600';
                        statusText = 'No Expiry';
                        statusIcon = 'infinity';
                        progressColor = 'bg-gray-300';
                    } else if (daysRemaining < 0) {
                        statusBadge = 'bg-red-50 border-red-200 text-red-700';
                        statusText = `Expired ${Math.abs(daysRemaining)}d ago`;
                        statusIcon = 'alert-triangle';
                        progressColor = 'bg-red-500';
                    } else if (daysRemaining === 0) {
                        statusBadge = 'bg-red-50 border-red-200 text-red-700';
                        statusText = 'Expires Today';
                        statusIcon = 'alert-triangle';
                        progressColor = 'bg-red-500';
                    } else if (daysRemaining <= 30) {
                        statusBadge = 'bg-orange-50 border-orange-200 text-orange-700';
                        statusText = `${daysRemaining}d remaining`;
                        statusIcon = 'clock';
                        progressColor = 'bg-orange-500';
                    } else {
                        statusBadge = 'bg-green-50 border-green-200 text-green-700';
                        statusText = `${daysRemaining}d remaining`;
                        statusIcon = 'shield-check';
                        progressColor = 'bg-green-500';
                    }
                    
                    return `
                        <div class="rounded-xl border ${statusBadge} p-4">
                            <div class="flex items-start justify-between mb-2">
                                <div>
                                    <p class="text-sm font-semibold capitalize text-gray-900">${doc.auth_type.replace(/_/g, ' ')}</p>
                                    ${doc.document_name ? `<p class="text-xs text-gray-500 mt-0.5">${doc.document_name}</p>` : ''}
                                </div>
                                <i data-lucide="${statusIcon}" class="w-5 h-5 flex-shrink-0"></i>
                            </div>
                            ${expiryDate ? `<p class="text-xs text-gray-500 mb-2">Expires: ${expiryDate}</p>` : ''}
                            <div class="flex items-center gap-2">
                                <div class="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                                    <div class="h-full ${progressColor} rounded-full" style="width: ${doc.days_remaining === null ? 100 : Math.max(0, Math.min(100, (daysRemaining / 365) * 100))}%"></div>
                                </div>
                                <span class="text-xs font-semibold whitespace-nowrap">${statusText}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // Close doc preview on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (!document.getElementById('userModal').classList.contains('hidden')) {
                closeUserModal();
            }
        }
    });

    async function updateVerification(authId, status) {
        const result = await Swal.fire({
            title: 'Update Verification?',
            text: `Are you sure you want to set this document to ${status}?`,
            icon: status === 'approved' ? 'question' : 'warning',
            showCancelButton: true,
            confirmButtonColor: status === 'approved' ? '#10B981' : '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: `Yes, ${status}`,
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            const response = await fetch(`/admin/users/verification/${authId}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({
                    status
                })
            });

            const data = await response.json();

            if (data.success) {
                Swal.fire({
                    title: 'Success!',
                    text: 'Verification status updated successfully',
                    icon: 'success',
                    confirmButtonColor: '#E75234'
                }).then(() => {
                    closeUserModal();
                    window.location.reload();
                });
            } else {
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to update verification status',
                    icon: 'error',
                    confirmButtonColor: '#E75234'
                });
            }
        } catch (error) {
            console.error('Error updating verification:', error);
            Swal.fire({
                title: 'Error',
                text: 'An error occurred',
                icon: 'error',
                confirmButtonColor: '#E75234'
            });
        }
    }

    // Delete user functions
    function deleteUser(userId) {
        currentUserId = userId;
        const modal = document.getElementById('deleteModal');
        modal.classList.remove('hidden');

        // Get user info from the table
        const userRow = document.querySelector(`button[onclick="deleteUser(${userId})"]`).closest('tr');
        const userName = userRow.querySelector('td:nth-child(2) span').textContent;
        const userEmail = userRow.querySelector('td:nth-child(1)').textContent;

        document.getElementById('deleteUserInfo').innerHTML = `
            <p class="font-medium text-gray-900">User: ${userName}</p>
            <p class="text-gray-600">User ID: ${userEmail}</p>
        `;

        setTimeout(() => lucide.createIcons(), 100);
    }

    function closeDeleteModal() {
        document.getElementById('deleteModal').classList.add('hidden');
        currentUserId = null;
    }

    async function confirmDelete() {
        if (!currentUserId) return;

        try {
            const response = await fetch(`/admin/users/${currentUserId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                }
            });

            const data = await response.json();

            if (data.success) {
                Swal.fire({
                    title: 'Deleted!',
                    text: 'User deleted successfully',
                    icon: 'success',
                    confirmButtonColor: '#E75234'
                }).then(() => {
                    closeDeleteModal();
                    window.location.reload();
                });
            } else {
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to delete user',
                    icon: 'error',
                    confirmButtonColor: '#E75234'
                });
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            Swal.fire({
                title: 'Error',
                text: 'An error occurred',
                icon: 'error',
                confirmButtonColor: '#E75234'
            });
        }
    }

    // Reinitialize icons after page load
    document.addEventListener('DOMContentLoaded', function() {
        lucide.createIcons();
    });
</script>
@endpush
@endsection