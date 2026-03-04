@extends('admin.layouts.app')

@section('title', 'User Profile - KHAT Admin')

@section('content')
<!-- Success Message -->
@if(session('success'))
<div class="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative" role="alert">
    <span class="block sm:inline">{{ session('success') }}</span>
    <button type="button" class="absolute top-0 bottom-0 right-0 px-4 py-3" onclick="this.parentElement.style.display='none';">
        <i data-lucide="x" class="w-4 h-4"></i>
    </button>
</div>
@endif

<!-- Error Message -->
@if(session('error'))
<div class="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
    <span class="block sm:inline">{{ session('error') }}</span>
    <button type="button" class="absolute top-0 bottom-0 right-0 px-4 py-3" onclick="this.parentElement.style.display='none';">
        <i data-lucide="x" class="w-4 h-4"></i>
    </button>
</div>
@endif

<div class="mb-6">
    <div class="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <a href="{{ route('admin.users.index') }}" class="hover:text-[#E75234] transition">
            <i data-lucide="arrow-left" class="w-4 h-4 inline"></i> User Management
        </a>
        <span>/</span>
        <span>User Profile</span>
        <span>/</span>
        <span class="text-gray-900 font-medium">{{ $user->name }}</span>
    </div>

    <div class="flex justify-between items-start">
        <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-2xl shadow-md border-4 border-white">
                {{ strtoupper(substr($user->name ?? $user->email, 0, 1)) }}
            </div>
            <div>
                <h1 class="text-3xl font-bold text-gray-900">{{ $user->name }}</h1>
                <div class="flex items-center gap-2 mt-1">
                    <span class="text-gray-500 text-sm">{{ $user->email }}</span>
                    @if($user->status === 'suspended')
                    <span class="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 uppercase">Suspended</span>
                    @elseif($user->status === 'banned')
                    <span class="px-2 py-0.5 rounded text-xs font-bold bg-gray-800 text-white uppercase">Banned</span>
                    @else
                    <span class="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 uppercase">Active</span>
                    @endif
                </div>
            </div>
        </div>

        <div class="flex gap-3">
            <button onclick="openSubscriptionModal()" class="px-4 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition">
                <i data-lucide="credit-card" class="w-4 h-4 inline mr-1"></i>
                Grant Subscription
            </button>
            <button onclick="openStatusModal()" class="px-4 py-2 bg-orange-100 text-orange-700 text-sm font-medium rounded-lg hover:bg-orange-200 transition">
                <i data-lucide="shield-alert" class="w-4 h-4 inline mr-1"></i>
                Change Status
            </button>
            <button onclick="deleteUser({{ $user->id }})" class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition">
                <i data-lucide="trash-2" class="w-4 h-4 inline mr-1"></i>
                Delete User
            </button>
            @if($user->status === 'suspended' && $user->suspension_end_date)
            {{-- Testing: Fast-forward suspension --}}
            <form action="{{ route('admin.testing-tools.fast-forward-suspension', $user->id) }}" method="POST" class="flex items-center gap-1">
                @csrf
                <input type="number" name="days" value="7" min="1" class="w-14 text-xs border border-gray-300 rounded-lg px-2 py-2 text-center">
                <button type="submit" class="px-3 py-2 bg-amber-100 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-200 transition flex items-center gap-1" title="Fast-forward suspension end date">
                    <i data-lucide="fast-forward" class="w-4 h-4"></i>
                    FF Suspension
                </button>
            </form>
            @endif
        </div>
    </div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
    <!-- Left Column: User Info & Verification -->
    <div class="lg:col-span-1 space-y-6">
        <!-- User Information -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-bold text-gray-900 mb-4">User Information</h2>

            <div class="space-y-4">
                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Full Name</p>
                    <p class="text-sm font-semibold text-gray-900">{{ $user->firstName }} {{ $user->lastName }}</p>
                </div>

                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Subscription Tier</p>
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold text-gray-900 capitalize">{{ $user->subscription_tier ?? 'Free' }}</span>
                        @if($user->subscription_tier === 'premium')
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase">Premium</span>
                        @elseif($user->subscription_tier === 'basic')
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">Basic</span>
                        @else
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 uppercase">Free</span>
                        @endif
                    </div>
                </div>

                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Contact Number</p>
                    <p class="text-sm font-semibold text-gray-900">{{ $user->contact_number ?? 'N/A' }}</p>
                </div>

                <div>
                    <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Address</p>
                    <p class="text-sm font-semibold text-gray-900">
                        @if($user->address)
                        {{ is_array($user->address) ? implode(', ', array_filter($user->address)) : $user->address }}
                        @else
                        N/A
                        @endif
                    </p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Gender</p>
                        <p class="text-sm font-semibold text-gray-900 capitalize">{{ $user->sex ?? 'N/A' }}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Birthdate</p>
                        <p class="text-sm font-semibold text-gray-900">{{ $user->birthdate ? \Carbon\Carbon::parse($user->birthdate)->format('M d, Y') : 'N/A' }}</p>
                    </div>
                </div>

                <div class="border-t border-gray-100 pt-4">
                    <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Joined</p>
                    <p class="text-sm font-semibold text-gray-900">{{ $user->created_at->format('F d, Y') }}</p>
                </div>

                @if(in_array($user->status, ['suspended', 'banned']))
                <div class="border-t border-gray-100 pt-4 bg-red-50 -mx-6 px-6 pb-4 mb-[-1.5rem] rounded-b-xl border-b border-red-100">
                    <div class="flex items-center gap-2 mb-3">
                        <i data-lucide="alert-circle" class="w-4 h-4 text-red-600"></i>
                        <p class="text-xs text-red-700 uppercase tracking-wide font-bold">Suspension Details</p>
                    </div>
                    <div class="space-y-3">
                        <div>
                            <p class="text-xs text-red-500 font-medium uppercase">Reason</p>
                            <p class="text-sm text-gray-900">{{ $user->suspension_reason ?? 'No reason provided' }}</p>
                        </div>
                        <div>
                            <p class="text-xs text-red-500 font-medium uppercase">Duration</p>
                            <p class="text-sm text-gray-900 font-medium">
                                @if($user->suspension_end_date)
                                Until {{ $user->suspension_end_date->format('M d, Y H:i') }}
                                <span class="text-xs text-red-600 font-normal">({{ $user->suspension_end_date->diffForHumans() }})</span>
                                @else
                                Indefinite
                                @endif
                            </p>
                        </div>
                    </div>
                </div>
                @endif
            </div>
        </div>

        <!-- Verification Status -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-bold text-gray-900 mb-4">Verification Documents</h2>

            @forelse($user->userAuth as $auth)
            <div class="mb-4 last:mb-0 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-sm font-bold text-gray-900 capitalize">{{ str_replace('_', ' ', $auth->auth_type) }}</span>
                    @if($auth->status === 'approved')
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase">Verified</span>
                    @elseif($auth->status === 'pending')
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 uppercase">Pending</span>
                    @else
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase">Rejected</span>
                    @endif
                </div>

                @if($auth->document_path)
                <button onclick="viewDocument('{{ Storage::disk('do_spaces')->url($auth->document_path) }}', '{{ $auth->auth_type }}')" class="text-xs text-[#E75234] hover:underline flex items-center gap-1 focus:outline-none">
                    <i data-lucide="file-text" class="w-3 h-3"></i> View Document
                </button>
                @endif

                @if($auth->status === 'pending')
                <div class="mt-3 flex gap-2">
                    <button onclick="verifyDocument({{ $auth->auth_id }}, 'approved')" class="flex-1 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition">Approve</button>
                    <button onclick="verifyDocument({{ $auth->auth_id }}, 'rejected')" class="flex-1 py-1.5 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition">Reject</button>
                </div>
                @endif
            </div>
            @empty
            <p class="text-sm text-gray-500 italic">No verification documents submitted.</p>
            @endforelse
        </div>
    </div>

    <!-- Right Column: Pets & Activity -->
    <div class="lg:col-span-2 space-y-6">
        <!-- Stats Row -->
        <div class="grid grid-cols-3 gap-4">
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p class="text-xs text-gray-500 uppercase font-bold mb-1">Total Pets</p>
                <p class="text-2xl font-bold text-gray-900">{{ $user->pets_count }}</p>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p class="text-xs text-gray-500 uppercase font-bold mb-1">Reports Against</p>
                <p class="text-2xl font-bold text-red-600">{{ $user->reports_against_count }}</p>
            </div>
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p class="text-xs text-gray-500 uppercase font-bold mb-1">Warnings</p>
                <p class="text-2xl font-bold text-orange-600">{{ $user->warning_count }}</p>
            </div>
        </div>

        <!-- Reviews Summary -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 class="text-lg font-bold text-gray-900">Reviews Summary</h2>
                <a href="{{ route('admin.reviews.index', ['search' => $user->name]) }}" class="text-xs text-[#E75234] font-semibold hover:underline">View All Reviews</a>
            </div>
            <div class="p-6">
                @if($reviewStats['total'] > 0)
                <!-- Review Stats Row -->
                <div class="grid grid-cols-4 gap-3 mb-5">
                    <div class="text-center p-3 bg-gray-50 rounded-lg">
                        <p class="text-2xl font-bold text-gray-900">{{ $reviewStats['total'] }}</p>
                        <p class="text-[10px] text-gray-500 uppercase font-bold">Total</p>
                    </div>
                    <div class="text-center p-3 bg-amber-50 rounded-lg">
                        <div class="flex items-center justify-center gap-1">
                            <i data-lucide="star" class="w-4 h-4 text-amber-400 fill-current"></i>
                            <p class="text-2xl font-bold text-amber-600">{{ number_format($reviewStats['average'], 1) }}</p>
                        </div>
                        <p class="text-[10px] text-gray-500 uppercase font-bold">Average</p>
                    </div>
                    <div class="text-center p-3 bg-green-50 rounded-lg">
                        <p class="text-2xl font-bold text-green-600">{{ $reviewStats['positive'] }}</p>
                        <p class="text-[10px] text-gray-500 uppercase font-bold">Positive</p>
                    </div>
                    <div class="text-center p-3 bg-red-50 rounded-lg">
                        <p class="text-2xl font-bold text-red-600">{{ $reviewStats['negative'] }}</p>
                        <p class="text-[10px] text-gray-500 uppercase font-bold">Negative</p>
                    </div>
                </div>

                <!-- Rating Distribution -->
                <div class="mb-5">
                    <p class="text-xs font-semibold text-gray-600 mb-2">Rating Distribution</p>
                    @for($star = 5; $star >= 1; $star--)
                    @php
                    $count = $reviewDistribution[$star] ?? 0;
                    $pct = $reviewStats['total'] > 0 ? round(($count / $reviewStats['total']) * 100) : 0;
                    @endphp
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-[10px] font-semibold text-gray-500 w-8">{{ $star }}★</span>
                        <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div class="h-full rounded-full {{ $star >= 4 ? 'bg-green-400' : ($star === 3 ? 'bg-amber-400' : 'bg-red-400') }}" style="width: {{ $pct }}%"></div>
                        </div>
                        <span class="text-[10px] text-gray-400 w-6 text-right">{{ $count }}</span>
                    </div>
                    @endfor
                </div>

                <!-- Recent Reviews -->
                <p class="text-xs font-semibold text-gray-600 mb-2">Recent Reviews</p>
                <div class="space-y-3">
                    @foreach($recentReviews as $review)
                    <div class="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div class="flex justify-between items-start mb-1.5">
                            <div class="flex items-center gap-2">
                                <div class="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-[10px]">
                                    {{ strtoupper(substr($review->reviewer->name ?? 'U', 0, 1)) }}
                                </div>
                                <span class="text-xs font-bold text-gray-800">{{ $review->reviewer->name }}</span>
                                @if($review->review_type === 'shooter')
                                <span class="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded uppercase">Shooter</span>
                                @else
                                <span class="text-[9px] font-bold px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded uppercase">Breeder</span>
                                @endif
                            </div>
                            <div class="flex items-center gap-1">
                                <div class="flex text-amber-400">
                                    @for($i = 1; $i <= 5; $i++)
                                        @if($review->average_rating >= $i)
                                        <i data-lucide="star" class="w-3 h-3 fill-current"></i>
                                        @elseif($review->average_rating >= $i - 0.5)
                                        <i data-lucide="star-half" class="w-3 h-3 fill-current"></i>
                                        @else
                                        <i data-lucide="star" class="w-3 h-3 text-gray-200"></i>
                                        @endif
                                        @endfor
                                </div>
                                <span class="text-xs font-bold text-gray-600">{{ number_format($review->average_rating, 1) }}</span>
                            </div>
                        </div>
                        @if($review->comment)
                        <p class="text-xs text-gray-600 italic leading-relaxed">"{{ Str::limit($review->comment, 120) }}"</p>
                        @endif
                        <p class="text-[10px] text-gray-400 mt-1">{{ $review->created_at->format('M d, Y') }}</p>
                    </div>
                    @endforeach
                </div>
                @else
                <div class="text-center py-6">
                    <div class="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-2">
                        <i data-lucide="star-off" class="w-6 h-6 text-gray-300"></i>
                    </div>
                    <p class="text-sm text-gray-400">No reviews received yet.</p>
                </div>
                @endif
            </div>
        </div>

        <!-- Pets List -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 class="text-lg font-bold text-gray-900">Owned Pets</h2>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-gray-50 text-gray-500 text-xs uppercase">
                        <tr>
                            <th class="px-6 py-3 font-semibold">Pet</th>
                            <th class="px-6 py-3 font-semibold">Breed</th>
                            <th class="px-6 py-3 font-semibold">Status</th>
                            <th class="px-6 py-3 font-semibold text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        @forelse($user->pets as $pet)
                        <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden">
                                        @if($pet->primary_photo_url)
                                        <img src="{{ $pet->primary_photo_url }}" class="w-full h-full object-cover">
                                        @else
                                        <div class="w-full h-full flex items-center justify-center text-gray-400">
                                            <i data-lucide="paw-print" class="w-5 h-5"></i>
                                        </div>
                                        @endif
                                    </div>
                                    <div>
                                        <p class="text-sm font-bold text-gray-900">{{ $pet->name }}</p>
                                        <p class="text-xs text-gray-500">{{ $pet->species }}</p>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-600">{{ $pet->breed }}</td>
                            <td class="px-6 py-4">
                                <span class="px-2 py-1 rounded-full text-xs font-bold 
                                    {{ $pet->status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600' }}">
                                    {{ ucfirst($pet->status) }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <a href="{{ route('admin.pets.details', $pet->pet_id) }}" class="text-[#E75234] hover:text-[#d14024] text-sm font-medium">View</a>
                            </td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="4" class="px-6 py-8 text-center text-gray-500 italic">No pets registered.</td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Warnings History -->
        @if($user->warnings->isNotEmpty())
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 class="text-lg font-bold text-gray-900 mb-4">Warnings History</h2>
            <div class="space-y-4">
                @foreach($user->warnings as $warning)
                <div class="bg-red-50 border border-red-100 rounded-lg p-4">
                    <div class="flex justify-between items-start">
                        <div>
                            <span class="px-2 py-0.5 bg-red-200 text-red-800 text-[10px] font-bold uppercase rounded mb-2 inline-block">{{ $warning->type }}</span>
                            <p class="text-sm text-gray-800">{{ $warning->message }}</p>
                        </div>
                        <span class="text-xs text-gray-500">{{ $warning->created_at->format('M d, Y') }}</span>
                    </div>
                    <p class="text-xs text-gray-500 mt-2">Issued by: {{ $warning->admin->name ?? 'System' }}</p>
                </div>
                @endforeach
            </div>
        </div>
        @endif
    </div>
</div>

<!-- Subscription Modal -->
<div id="subscriptionModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Grant Subscription</h3>
        <form action="{{ route('admin.users.subscription', $user->id) }}" method="POST">
            @csrf
            <div class="mb-4">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Select Subscription Tier</label>
                <select name="tier_slug" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
                    @foreach($subscriptionTiers as $tier)
                    <option value="{{ $tier->slug }}" {{ $user->subscription_tier === $tier->slug ? 'selected' : '' }}>
                        {{ $tier->name }} (₱{{ number_format($tier->price, 2) }})
                    </option>
                    @endforeach
                </select>
                <p class="mt-2 text-xs text-gray-500 italic">This will immediately update the user's subscription tier.</p>
            </div>

            <div class="flex gap-3 mt-6">
                <button type="submit" class="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">Update Subscription</button>
                <button type="button" onclick="closeSubscriptionModal()" class="flex-1 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition">Cancel</button>
            </div>
        </form>
    </div>
</div>

<!-- Status Change Modal -->
<div id="statusModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-4">Change User Status</h3>

        <!-- Error message area -->
        @if(session('error'))
        <div class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {{ session('error') }}
        </div>
        @endif

        <form id="statusForm" action="{{ route('admin.users.status', $user->id) }}" method="POST" onsubmit="return validateStatusForm()">
            @csrf
            <div class="mb-4">
                <label class="block text-sm font-semibold text-gray-700 mb-2">New Status</label>
                <select name="status" id="statusSelect" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]" onchange="toggleStatusFields()">
                    <option value="active" {{ $user->status === 'active' ? 'selected' : '' }}>Active</option>
                    <option value="suspended" {{ $user->status === 'suspended' ? 'selected' : '' }}>Suspended (Temporary)</option>
                    <option value="banned" {{ $user->status === 'banned' ? 'selected' : '' }}>Banned (Permanent)</option>
                </select>
                <p id="statusHint" class="mt-1.5 text-xs text-gray-500 italic"></p>
            </div>

            <div id="reasonField" class="space-y-4 {{ in_array($user->status, ['suspended', 'banned']) ? '' : 'hidden' }}">
                <!-- Duration (only for Suspended) -->
                <div id="durationField">
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Suspension Duration</label>
                    <select name="suspension_duration" id="suspensionDurationSelect" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]" onchange="toggleCustomDateField()">
                        <option value="1_day">24 Hours</option>
                        <option value="3_days">3 Days</option>
                        <option value="7_days" selected>7 Days</option>
                        <option value="30_days">30 Days</option>
                        <option value="90_days">90 Days</option>
                        <option value="custom">Custom Date</option>
                        <option value="indefinite">Indefinite (Until manually lifted)</option>
                    </select>
                </div>

                <!-- Custom Date Picker (shown when 'custom' duration is selected) -->
                <div id="customDateField" class="hidden">
                    <label class="block text-sm font-semibold text-gray-700 mb-1.5">Suspension End Date</label>
                    <input type="date" name="custom_end_date" id="customEndDate" min="{{ now()->addDay()->format('Y-m-d') }}" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
                    <p class="mt-1 text-xs text-gray-500">Suspension will be automatically lifted on this date.</p>
                </div>

                <!-- Reason -->
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">
                        Reason <span class="text-red-500">*</span>
                    </label>
                    <textarea name="suspension_reason" id="suspensionReason" rows="3" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]" placeholder="Please provide a reason...">{{ $user->suspension_reason }}</textarea>
                    <p id="reasonError" class="mt-1 text-xs text-red-600 hidden">Reason is required.</p>
                </div>
            </div>

            <div class="flex gap-3 mt-6">
                <button type="submit" class="flex-1 px-4 py-2.5 bg-[#E75234] text-white text-sm font-medium rounded-lg hover:bg-[#d14024] transition">Update Status</button>
                <button type="button" onclick="closeStatusModal()" class="flex-1 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition">Cancel</button>
            </div>
        </form>
    </div>
</div>

<!-- Delete Form -->
<form id="deleteUserForm" action="{{ route('admin.users.delete', $user->id) }}" method="POST" class="hidden">
    @csrf
    @method('DELETE')
</form>

@push('scripts')
<script>
    function openSubscriptionModal() {
        document.getElementById('subscriptionModal').classList.remove('hidden');
    }

    function closeSubscriptionModal() {
        document.getElementById('subscriptionModal').classList.add('hidden');
    }

    function openStatusModal() {
        document.getElementById('statusModal').classList.remove('hidden');
        toggleStatusFields();
    }

    function closeStatusModal() {
        document.getElementById('statusModal').classList.add('hidden');
    }

    function toggleStatusFields() {
        const status = document.getElementById('statusSelect').value;
        const reasonField = document.getElementById('reasonField');
        const durationField = document.getElementById('durationField');
        const statusHint = document.getElementById('statusHint');
        const reasonError = document.getElementById('reasonError');

        // Hide reason error when toggling
        reasonError.classList.add('hidden');

        if (status === 'suspended') {
            reasonField.classList.remove('hidden');
            durationField.classList.remove('hidden');
            statusHint.textContent = 'Suspended: Temporary restriction. User can be reactivated after the duration expires.';
        } else if (status === 'banned') {
            reasonField.classList.remove('hidden');
            durationField.classList.add('hidden');
            statusHint.textContent = 'Banned: Permanent restriction. User cannot access the system unless manually lifted by an admin.';
        } else {
            reasonField.classList.add('hidden');
            statusHint.textContent = '';
        }
    }

    function toggleCustomDateField() {
        const duration = document.getElementById('suspensionDurationSelect').value;
        const customDateField = document.getElementById('customDateField');
        if (duration === 'custom') {
            customDateField.classList.remove('hidden');
        } else {
            customDateField.classList.add('hidden');
        }
    }

    function validateStatusForm() {
        const status = document.getElementById('statusSelect').value;
        const reason = document.getElementById('suspensionReason').value.trim();
        const reasonError = document.getElementById('reasonError');

        if ((status === 'suspended' || status === 'banned') && reason === '') {
            reasonError.classList.remove('hidden');
            document.getElementById('suspensionReason').focus();
            document.getElementById('suspensionReason').classList.add('border-red-500');
            return false;
        }

        // Validate custom date if selected
        if (status === 'suspended') {
            const duration = document.getElementById('suspensionDurationSelect').value;
            if (duration === 'custom') {
                const customDate = document.getElementById('customEndDate').value;
                if (!customDate) {
                    Swal.fire({
                        title: 'Date Required',
                        text: 'Please select a suspension end date.',
                        icon: 'warning',
                        confirmButtonColor: '#E75234'
                    });
                    return false;
                }
            }
        }

        reasonError.classList.add('hidden');
        document.getElementById('suspensionReason').classList.remove('border-red-500');
        return true;
    }

    function deleteUser(id) {
        Swal.fire({
            title: 'Delete User?',
            text: "This action cannot be undone. All data associated with this user will be permanently removed.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, delete user'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`/admin/users/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-TOKEN': '{{ csrf_token() }}',
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            Swal.fire({
                                title: 'Deleted!',
                                text: data.message || 'User account deleted successfully.',
                                icon: 'success',
                                confirmButtonColor: '#E75234',
                                timer: 2000,
                                timerProgressBar: true
                            }).then(() => {
                                window.location.href = '{{ route("admin.users.index") }}';
                            });
                        } else {
                            Swal.fire('Error', data.message || 'Failed to delete user.', 'error');
                        }
                    })
                    .catch(error => {
                        Swal.fire('Error', 'An unexpected error occurred while deleting the user.', 'error');
                    });
            }
        });
    }

    async function verifyDocument(authId, status) {
        // ... (Reuse verify logic from index or implement simpler form submission)
        // For simplicity, using fetch here
        try {
            const response = await fetch(`/admin/users/verification/${authId}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': '{{ csrf_token() }}'
                },
                body: JSON.stringify({
                    status
                })
            });
            const data = await response.json();
            if (data.success) {
                location.reload();
            }
        } catch (e) {
            PawAlert('Error updating status');
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        lucide.createIcons();
    });
</script>
@endpush
@endsection