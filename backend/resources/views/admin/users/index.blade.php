@extends('admin.layouts.app')

@section('title', 'User Management - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-6">User Management</h1>

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
                        @if($user->userAuth->first()?->status === 'approved')
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
                        <span class="text-gray-700">Valid</span>
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
                    <td class="px-6 py-4 text-center">
                        <div class="relative inline-block">
                            <button onclick="toggleDropdown(event, 'dropdown-{{ $user->id }}')" class="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors p-1.5 rounded-lg hover:bg-gray-100">
                                <i data-lucide="more-horizontal" class="w-5 h-5"></i>
                            </button>
                            <div id="dropdown-{{ $user->id }}" class="hidden absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg z-50 border border-gray-200 overflow-hidden">
                                <button type="button" onclick="openUserModal({{ $user->id }})" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                    <i data-lucide="eye" class="w-4 h-4 text-gray-500"></i>
                                    View Details
                                </button>
                                <a href="#" class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                    <i data-lucide="pause-circle" class="w-4 h-4 text-gray-500"></i>
                                    Suspend Account
                                </a>
                                <div class="border-t border-gray-100"></div>
                                <button type="button" onclick="deleteUser({{ $user->id }})" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    Delete Account
                                </button>
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
<div id="userModal" class="hidden fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50">
    <div class="flex items-center justify-center min-h-screen px-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <!-- Modal Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 class="text-xl font-bold text-gray-900">User Verification Details: <span id="modalUserName"></span></h2>
                <button onclick="closeUserModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>

            <!-- Modal Tabs -->
            <div class="flex border-b border-gray-200 px-6 bg-gray-50">
                <button onclick="switchTab('documents')" id="tab-documents" class="px-6 py-3 text-sm font-semibold border-b-2 border-[#E75234] text-[#E75234] transition-colors">
                    Documents
                </button>
                <button onclick="switchTab('submission')" id="tab-submission" class="px-6 py-3 text-sm font-semibold border-b-2 border-transparent text-gray-600 hover:text-gray-900 transition-colors">
                    Submission History
                </button>
                <button onclick="switchTab('expiry')" id="tab-expiry" class="px-6 py-3 text-sm font-semibold border-b-2 border-transparent text-gray-600 hover:text-gray-900 transition-colors">
                    Expiry Tracker
                </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <!-- Documents Tab -->
                <div id="content-documents">
                    <div id="documentsContainer" class="space-y-4">
                        <!-- Documents will be loaded here -->
                    </div>
                </div>

                <!-- Submission History Tab -->
                <div id="content-submission" class="hidden">
                    <div id="submissionHistory">
                        <!-- Submission history will be loaded here -->
                    </div>
                </div>

                <!-- Expiry Tracker Tab -->
                <div id="content-expiry" class="hidden">
                    <div id="expiryTracker">
                        <!-- Document validity overview will be loaded here -->
                    </div>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button onclick="closeUserModal()" class="px-6 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all">
                    Close
                </button>
            </div>
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
    let currentTab = 'documents';

    function toggleDropdown(event, dropdownId) {
        event.stopPropagation();
        const dropdown = document.getElementById(dropdownId);
        const allDropdowns = document.querySelectorAll('[id^="dropdown-"]');

        allDropdowns.forEach(d => {
            if (d.id !== dropdownId) {
                d.classList.add('hidden');
            }
        });

        dropdown.classList.toggle('hidden');
    }

    document.addEventListener('click', function() {
        const allDropdowns = document.querySelectorAll('[id^="dropdown-"]');
        allDropdowns.forEach(d => d.classList.add('hidden'));
    });

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

    function switchTab(tabName) {
        // Update tab buttons
        ['documents', 'submission', 'expiry'].forEach(tab => {
            const button = document.getElementById(`tab-${tab}`);
            const content = document.getElementById(`content-${tab}`);

            if (tab === tabName) {
                button.classList.add('border-[#E75234]', 'text-[#E75234]');
                button.classList.remove('border-transparent', 'text-gray-600');
                content.classList.remove('hidden');
            } else {
                button.classList.remove('border-[#E75234]', 'text-[#E75234]');
                button.classList.add('border-transparent', 'text-gray-600');
                content.classList.add('hidden');
            }
        });
        currentTab = tabName;
    }

    function loadDocuments(documents) {
        const container = document.getElementById('documentsContainer');

        if (!documents || documents.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i data-lucide="file-x" class="w-12 h-12 mx-auto mb-2 text-gray-300"></i>
                    <p>No documents uploaded</p>
                </div>
            `;
            return;
        }

        container.innerHTML = documents.map(doc => {
            const statusColor = doc.status === 'approved' ? 'green' : (doc.status === 'rejected' ? 'red' : 'yellow');
            const statusIcon = doc.status === 'approved' ? 'check-circle' : (doc.status === 'rejected' ? 'x-circle' : 'clock');

            return `
                <div class="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                <i data-lucide="file-text" class="w-5 h-5 text-orange-600"></i>
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-900 capitalize">${doc.auth_type.replace(/_/g, ' ')}</h4>
                                <p class="text-xs text-gray-500">Submitted: ${doc.date_submitted}</p>
                            </div>
                        </div>
                        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-${statusColor}-100 text-${statusColor}-700 text-xs font-semibold">
                            <i data-lucide="${statusIcon}" class="w-3.5 h-3.5"></i>
                            ${doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                    </div>
                    
                    ${doc.document_path ? `
                        <div class="mb-4">
                            <button onclick="viewDocument('${doc.document_path}')" class="w-full py-2 px-4 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                <i data-lucide="eye" class="w-4 h-4"></i>
                                View Document
                            </button>
                        </div>
                    ` : '<p class="text-sm text-gray-500 mb-4">No document file attached</p>'}
                    
                    ${doc.status === 'pending' ? `
                        <div class="flex gap-2">
                            <button onclick="updateVerification(${doc.auth_id}, 'approved')" class="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                                <i data-lucide="check" class="w-4 h-4"></i>
                                Approve
                            </button>
                            <button onclick="updateVerification(${doc.auth_id}, 'rejected')" class="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                                <i data-lucide="x" class="w-4 h-4"></i>
                                Reject
                            </button>
                        </div>
                    ` : `
                        <div class="text-xs text-gray-500">
                            Last updated: ${doc.updated_at}
                        </div>
                    `}
                </div>
            `;
        }).join('');
    }

    function loadSubmissionHistory(documents) {
        const container = document.getElementById('submissionHistory');

        if (!documents || documents.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No submission history</p>';
            return;
        }

        const sortedDocs = [...documents].sort((a, b) => new Date(b.date_created) - new Date(a.date_created));

        container.innerHTML = `
            <div class="space-y-3">
                ${sortedDocs.map(doc => {
                    const statusColor = doc.status === 'approved' ? 'green' : (doc.status === 'rejected' ? 'red' : 'yellow');
                    const statusText = doc.status === 'approved' ? 'Document Approved' : (doc.status === 'rejected' ? 'Document Rejected' : 'Awaiting Verification');
                    
                    return `
                        <div class="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                            <div class="w-10 h-10 rounded-full bg-${statusColor}-100 flex items-center justify-center flex-shrink-0">
                                <i data-lucide="${doc.status === 'approved' ? 'check' : (doc.status === 'rejected' ? 'x' : 'clock')}" class="w-5 h-5 text-${statusColor}-600"></i>
                            </div>
                            <div class="flex-1">
                                <p class="font-medium text-gray-900">${statusText}</p>
                                <p class="text-sm text-gray-600 capitalize">${doc.auth_type.replace(/_/g, ' ')}</p>
                                <p class="text-xs text-gray-500 mt-1">${doc.date_created}</p>
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
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No documents to track</p>';
            return;
        }

        container.innerHTML = `
            <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr class="text-left text-sm font-semibold text-gray-700">
                            <th class="px-4 py-3">Document</th>
                            <th class="px-4 py-3">Submitted</th>
                            <th class="px-4 py-3">Expiry Date</th>
                            <th class="px-4 py-3">Days Remaining</th>
                            <th class="px-4 py-3">Status</th>
                            <th class="px-4 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        ${documents.map(doc => {
                            const daysRemaining = Math.floor(doc.days_remaining);
                            const expiryDate = doc.expiry_date || 'Not set';
                            
                            let statusBadge, statusText, daysText;
                            
                            if (doc.days_remaining === null) {
                                statusBadge = 'bg-gray-100 text-gray-700';
                                statusText = 'No Expiry';
                                daysText = '—';
                            } else if (daysRemaining < 0) {
                                statusBadge = 'bg-red-100 text-red-700';
                                statusText = 'Expired';
                                daysText = `${Math.abs(daysRemaining)} days ago`;
                            } else if (daysRemaining === 0) {
                                statusBadge = 'bg-red-100 text-red-700';
                                statusText = 'Expires Today';
                                daysText = 'Today';
                            } else if (daysRemaining <= 30) {
                                statusBadge = 'bg-orange-100 text-orange-700';
                                statusText = 'Expiring Soon';
                                daysText = `${daysRemaining} days`;
                            } else {
                                statusBadge = 'bg-green-100 text-green-700';
                                statusText = 'Active';
                                daysText = `${daysRemaining} days`;
                            }
                            
                            return `
                                <tr class="text-sm">
                                    <td class="px-4 py-3 capitalize">${doc.auth_type.replace(/_/g, ' ')}</td>
                                    <td class="px-4 py-3">${doc.date_submitted}</td>
                                    <td class="px-4 py-3">${expiryDate}</td>
                                    <td class="px-4 py-3">${daysText}</td>
                                    <td class="px-4 py-3">
                                        <span class="px-2 py-1 rounded-md text-xs font-semibold ${statusBadge}">
                                            ${statusText}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <button class="text-orange-600 hover:text-orange-700 text-xs font-medium">
                                            Request Update
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function viewDocument(url) {
        window.open(url, '_blank');
    }

    async function updateVerification(authId, status) {
        const result = await Swal.fire({
            title: 'Update Verification?',
            text: `Are you sure you want to set this document to ${status}?`,
            icon: status === 'approve' ? 'question' : 'warning',
            showCancelButton: true,
            confirmButtonColor: status === 'approve' ? '#10B981' : '#EF4444',
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