@extends('admin.layouts.app')

@section('title', 'Testing Tools - KHAT Admin')

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

@if(session('error'))
<div class="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
    <span class="block sm:inline">{{ session('error') }}</span>
    <button type="button" class="absolute top-0 bottom-0 right-0 px-4 py-3" onclick="this.parentElement.style.display='none';">
        <i data-lucide="x" class="w-4 h-4"></i>
    </button>
</div>
@endif

<div class="mb-6">
    <div class="flex items-center gap-3 mb-2">
        <div class="p-2 bg-amber-100 rounded-lg">
            <i data-lucide="flask-conical" class="w-6 h-6 text-amber-600"></i>
        </div>
        <h1 class="text-3xl font-bold text-gray-900">Testing Tools</h1>
        <span class="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase">Dev / QA</span>
    </div>
    <p class="text-gray-500 text-sm">Time travel & reset tools for testing expiry flows, cooldowns, subscriptions, and match requests.</p>
</div>

<div class="grid grid-cols-1 xl:grid-cols-2 gap-6">

    {{-- ============================================================= --}}
    {{-- PET COOLDOWN MANAGEMENT --}}
    {{-- ============================================================= --}}
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center gap-3 mb-4">
            <div class="p-2 bg-blue-50 rounded-lg">
                <i data-lucide="timer" class="w-5 h-5 text-blue-600"></i>
            </div>
            <div>
                <h2 class="text-lg font-bold text-gray-900">Pet Cooldowns</h2>
                <p class="text-xs text-gray-500">Pets currently on breeding cooldown</p>
            </div>
        </div>

        @if($petsOnCooldown->isEmpty())
        <div class="text-center py-8 text-gray-400">
            <i data-lucide="check-circle" class="w-10 h-10 mx-auto mb-2 text-green-300"></i>
            <p class="text-sm">No pets currently on cooldown</p>
        </div>
        @else
        <div class="space-y-3 max-h-96 overflow-y-auto">
            @foreach($petsOnCooldown as $pet)
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                    <p class="font-semibold text-gray-900 text-sm">{{ $pet->name }}</p>
                    <p class="text-xs text-gray-500">
                        Owner: {{ $pet->owner->name ?? 'N/A' }} &middot;
                        Expires: <span class="text-blue-600 font-medium">{{ $pet->cooldown_until->format('M d, Y') }}</span>
                        ({{ $pet->cooldown_days_remaining }} days left)
                    </p>
                </div>
                <div class="flex gap-2">
                    <form action="{{ route('admin.testing-tools.fast-forward-cooldown', $pet->pet_id) }}" method="POST" class="flex gap-1">
                        @csrf
                        <input type="number" name="days" value="30" min="1" class="w-16 text-xs border border-gray-300 rounded px-2 py-1 text-center">
                        <button type="submit" class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded hover:bg-blue-200 transition" title="Fast-forward by days">
                            <i data-lucide="fast-forward" class="w-3 h-3 inline"></i> FF
                        </button>
                    </form>
                    <form action="{{ route('admin.testing-tools.clear-cooldown', $pet->pet_id) }}" method="POST" onsubmit="return confirm('Clear cooldown for {{ $pet->name }}?')">
                        @csrf
                        <button type="submit" class="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded hover:bg-red-200 transition" title="Clear cooldown immediately">
                            <i data-lucide="x-circle" class="w-3 h-3 inline"></i> Clear
                        </button>
                    </form>
                </div>
            </div>
            @endforeach
        </div>
        @endif
    </div>

    {{-- ============================================================= --}}
    {{-- MATCH REQUEST RESET --}}
    {{-- ============================================================= --}}
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center gap-3 mb-4">
            <div class="p-2 bg-pink-50 rounded-lg">
                <i data-lucide="heart-off" class="w-5 h-5 text-pink-600"></i>
            </div>
            <div>
                <h2 class="text-lg font-bold text-gray-900">Match Request Reset</h2>
                <p class="text-xs text-gray-500">Delete match requests between specific pet pairs</p>
            </div>
        </div>

        <form action="{{ route('admin.testing-tools.reset-match-requests') }}" method="POST" onsubmit="return confirm('Delete ALL match requests between these two pets?')" class="space-y-3">
            @csrf
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="text-xs font-medium text-gray-600 mb-1 block">Pet ID #1</label>
                    <input type="number" name="pet_id_1" required min="1" placeholder="e.g. 12" class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E75234]/20">
                </div>
                <div>
                    <label class="text-xs font-medium text-gray-600 mb-1 block">Pet ID #2</label>
                    <input type="number" name="pet_id_2" required min="1" placeholder="e.g. 34" class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E75234]/20">
                </div>
            </div>
            <button type="submit" class="w-full px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition">
                <i data-lucide="trash-2" class="w-4 h-4 inline mr-1"></i>
                Reset Match Requests Between Pair
            </button>
        </form>

        <hr class="my-4 border-gray-200">

        <h3 class="text-sm font-semibold text-gray-700 mb-3">Recent Match Requests</h3>
        @if($recentMatchRequests->isEmpty())
        <p class="text-sm text-gray-400 text-center py-4">No match requests found</p>
        @else
        <div class="space-y-2 max-h-64 overflow-y-auto">
            @foreach($recentMatchRequests as $mr)
            <div class="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                <div>
                    <span class="font-medium text-gray-800">{{ $mr->requesterPet->name ?? '#'.$mr->requester_pet_id }}</span>
                    <span class="text-gray-400 mx-1">&rarr;</span>
                    <span class="font-medium text-gray-800">{{ $mr->targetPet->name ?? '#'.$mr->target_pet_id }}</span>
                    <span class="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase
                            {{ $mr->status === 'pending' ? 'bg-yellow-100 text-yellow-700' : '' }}
                            {{ $mr->status === 'accepted' ? 'bg-green-100 text-green-700' : '' }}
                            {{ $mr->status === 'declined' ? 'bg-red-100 text-red-700' : '' }}
                            {{ $mr->status === 'completed' ? 'bg-blue-100 text-blue-700' : '' }}
                        ">{{ $mr->status }}</span>
                </div>
                <span class="text-gray-400">{{ $mr->created_at->format('M d') }}</span>
            </div>
            @endforeach
        </div>
        @endif
    </div>

    {{-- ============================================================= --}}
    {{-- BREEDING HISTORY RESET --}}
    {{-- ============================================================= --}}
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center gap-3 mb-4">
            <div class="p-2 bg-green-50 rounded-lg">
                <i data-lucide="rotate-ccw" class="w-5 h-5 text-green-600"></i>
            </div>
            <div>
                <h2 class="text-lg font-bold text-gray-900">Pet Full Reset</h2>
                <p class="text-xs text-gray-500">Reset a pet's cooldown, breeding history, and match requests</p>
            </div>
        </div>

        <form id="petResetForm" class="space-y-3">
            @csrf
            <div>
                <label class="text-xs font-medium text-gray-600 mb-1 block">Pet ID</label>
                <input type="number" id="resetPetId" required min="1" placeholder="Enter Pet ID" class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E75234]/20">
            </div>

            <div class="grid grid-cols-3 gap-2">
                <button type="button" onclick="submitPetAction('reset-breeding')" class="px-3 py-2 bg-green-100 text-green-700 text-xs font-medium rounded-lg hover:bg-green-200 transition text-center">
                    <i data-lucide="rotate-ccw" class="w-3 h-3 inline mr-1"></i>
                    Reset Breeding
                </button>
                <button type="button" onclick="submitPetAction('clear-cooldown')" class="px-3 py-2 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-200 transition text-center">
                    <i data-lucide="timer-off" class="w-3 h-3 inline mr-1"></i>
                    Clear Cooldown
                </button>
                <button type="button" onclick="submitPetAction('reset-match-requests')" class="px-3 py-2 bg-pink-100 text-pink-700 text-xs font-medium rounded-lg hover:bg-pink-200 transition text-center">
                    <i data-lucide="heart-off" class="w-3 h-3 inline mr-1"></i>
                    Reset Matches
                </button>
            </div>

            <button type="button" onclick="submitPetAction('reset-full')" class="w-full px-4 py-2.5 bg-[#E75234] text-white text-sm font-medium rounded-lg hover:bg-[#d14024] transition">
                <i data-lucide="refresh-cw" class="w-4 h-4 inline mr-1"></i>
                Full Reset (Cooldown + Breeding History)
            </button>
        </form>
    </div>

    {{-- ============================================================= --}}
    {{-- SUSPENSION FAST-FORWARD --}}
    {{-- ============================================================= --}}
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center gap-3 mb-4">
            <div class="p-2 bg-orange-50 rounded-lg">
                <i data-lucide="user-x" class="w-5 h-5 text-orange-600"></i>
            </div>
            <div>
                <h2 class="text-lg font-bold text-gray-900">User Suspensions</h2>
                <p class="text-xs text-gray-500">Fast-forward or lift user suspensions</p>
            </div>
        </div>

        @if($suspendedUsers->isEmpty())
        <div class="text-center py-8 text-gray-400">
            <i data-lucide="check-circle" class="w-10 h-10 mx-auto mb-2 text-green-300"></i>
            <p class="text-sm">No suspended users with pending end dates</p>
        </div>
        @else
        <div class="space-y-3 max-h-96 overflow-y-auto">
            @foreach($suspendedUsers as $u)
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                    <p class="font-semibold text-gray-900 text-sm">{{ $u->name }}</p>
                    <p class="text-xs text-gray-500">
                        Ends: <span class="text-orange-600 font-medium">{{ Carbon\Carbon::parse($u->suspension_end_date)->format('M d, Y') }}</span>
                        &middot; Reason: {{ $u->suspension_reason ?? 'N/A' }}
                    </p>
                </div>
                <form action="{{ route('admin.testing-tools.fast-forward-suspension', $u->id) }}" method="POST" class="flex gap-1">
                    @csrf
                    <input type="number" name="days" value="7" min="1" class="w-14 text-xs border border-gray-300 rounded px-2 py-1 text-center">
                    <button type="submit" class="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded hover:bg-orange-200 transition">
                        <i data-lucide="fast-forward" class="w-3 h-3 inline"></i> FF
                    </button>
                </form>
            </div>
            @endforeach
        </div>
        @endif
    </div>

    {{-- ============================================================= --}}
    {{-- PAYMENT EXPIRY --}}
    {{-- ============================================================= --}}
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 xl:col-span-2">
        <div class="flex items-center gap-3 mb-4">
            <div class="p-2 bg-purple-50 rounded-lg">
                <i data-lucide="credit-card" class="w-5 h-5 text-purple-600"></i>
            </div>
            <div>
                <h2 class="text-lg font-bold text-gray-900">Payment Expiry</h2>
                <p class="text-xs text-gray-500">Active payments with expiry dates</p>
            </div>
        </div>

        @if($expiringPayments->isEmpty())
        <div class="text-center py-8 text-gray-400">
            <i data-lucide="check-circle" class="w-10 h-10 mx-auto mb-2 text-green-300"></i>
            <p class="text-sm">No active payments with expiry dates</p>
        </div>
        @else
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr class="text-xs text-gray-500 uppercase border-b">
                        <th class="text-left py-2 px-3">ID</th>
                        <th class="text-left py-2 px-3">Type</th>
                        <th class="text-left py-2 px-3">Amount</th>
                        <th class="text-left py-2 px-3">Status</th>
                        <th class="text-left py-2 px-3">Expires</th>
                        <th class="text-right py-2 px-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($expiringPayments as $payment)
                    <tr class="border-b border-gray-50 hover:bg-gray-50">
                        <td class="py-2 px-3 font-mono text-xs">#{{ $payment->id }}</td>
                        <td class="py-2 px-3">{{ ucfirst(str_replace('_', ' ', $payment->payment_type)) }}</td>
                        <td class="py-2 px-3 font-medium">₱{{ number_format($payment->amount, 2) }}</td>
                        <td class="py-2 px-3">
                            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-700">{{ $payment->status }}</span>
                        </td>
                        <td class="py-2 px-3 text-xs">{{ Carbon\Carbon::parse($payment->expires_at)->format('M d, Y H:i') }}</td>
                        <td class="py-2 px-3 text-right">
                            <div class="flex justify-end gap-1">
                                <form action="{{ route('admin.testing-tools.fast-forward-payment', $payment->id) }}" method="POST" class="flex gap-1">
                                    @csrf
                                    <input type="number" name="days" value="7" min="1" class="w-14 text-xs border border-gray-300 rounded px-2 py-1 text-center">
                                    <button type="submit" class="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded hover:bg-purple-200 transition">FF</button>
                                </form>
                                <form action="{{ route('admin.testing-tools.expire-payment', $payment->id) }}" method="POST" onsubmit="return confirm('Expire this payment immediately?')">
                                    @csrf
                                    <button type="submit" class="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded hover:bg-red-200 transition">Expire</button>
                                </form>
                            </div>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @endif
    </div>
</div>

{{-- ============================================================= --}}
{{-- API REFERENCE --}}
{{-- ============================================================= --}}
<div class="mt-6 bg-gray-900 rounded-xl p-6 text-white">
    <div class="flex items-center gap-3 mb-4">
        <i data-lucide="terminal" class="w-5 h-5 text-green-400"></i>
        <h2 class="text-lg font-bold">API Endpoints Reference</h2>
    </div>
    <p class="text-xs text-gray-400 mb-4">All endpoints require Sanctum auth with admin role. Base: <code class="bg-gray-800 px-1 rounded">/api/admin/testing-tools</code></p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
        <div class="bg-gray-800 rounded-lg p-3">
            <span class="text-green-400">POST</span> <span class="text-gray-300">/pets/{id}/clear-cooldown</span>
            <p class="text-gray-500 mt-1 font-sans">Clear pet cooldown immediately</p>
        </div>
        <div class="bg-gray-800 rounded-lg p-3">
            <span class="text-green-400">POST</span> <span class="text-gray-300">/pets/{id}/fast-forward-cooldown</span>
            <p class="text-gray-500 mt-1 font-sans">Body: <code>{"days": 30}</code></p>
        </div>
        <div class="bg-gray-800 rounded-lg p-3">
            <span class="text-green-400">POST</span> <span class="text-gray-300">/pets/{id}/reset-breeding</span>
            <p class="text-gray-500 mt-1 font-sans">Reset has_been_bred & breeding_count</p>
        </div>
        <div class="bg-gray-800 rounded-lg p-3">
            <span class="text-green-400">POST</span> <span class="text-gray-300">/pets/{id}/reset-full</span>
            <p class="text-gray-500 mt-1 font-sans">Full reset: cooldown + breeding history</p>
        </div>
        <div class="bg-gray-800 rounded-lg p-3">
            <span class="text-green-400">POST</span> <span class="text-gray-300">/pets/{id}/reset-match-requests</span>
            <p class="text-gray-500 mt-1 font-sans">Delete all match requests for a pet</p>
        </div>
        <div class="bg-gray-800 rounded-lg p-3">
            <span class="text-green-400">POST</span> <span class="text-gray-300">/match-requests/reset</span>
            <p class="text-gray-500 mt-1 font-sans">Body: <code>{"pet_id_1": 12, "pet_id_2": 34}</code></p>
        </div>
        <div class="bg-gray-800 rounded-lg p-3">
            <span class="text-green-400">POST</span> <span class="text-gray-300">/users/{id}/fast-forward-suspension</span>
            <p class="text-gray-500 mt-1 font-sans">Body: <code>{"days": 7}</code></p>
        </div>
        <div class="bg-gray-800 rounded-lg p-3">
            <span class="text-green-400">POST</span> <span class="text-gray-300">/payments/{id}/expire</span>
            <p class="text-gray-500 mt-1 font-sans">Expire a payment immediately</p>
        </div>
    </div>
</div>

<script>
    function submitPetAction(action) {
        const petId = document.getElementById('resetPetId').value;
        if (!petId) {
            alert('Please enter a Pet ID');
            return;
        }

        const actionLabels = {
            'reset-breeding': 'Reset breeding history',
            'clear-cooldown': 'Clear cooldown',
            'reset-match-requests': 'Delete all match requests',
            'reset-full': 'Full reset (cooldown + breeding history)',
        };

        if (!confirm(`${actionLabels[action]} for Pet #${petId}?`)) return;

        const routeMap = {
            'reset-breeding': '{{ url("admin/testing-tools/pets") }}/' + petId + '/reset-breeding',
            'clear-cooldown': '{{ url("admin/testing-tools/pets") }}/' + petId + '/clear-cooldown',
            'reset-match-requests': '{{ url("admin/testing-tools/pets") }}/' + petId + '/reset-match-requests',
            'reset-full': '{{ url("admin/testing-tools/pets") }}/' + petId + '/reset-full',
        };

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = routeMap[action];

        const csrf = document.createElement('input');
        csrf.type = 'hidden';
        csrf.name = '_token';
        csrf.value = '{{ csrf_token() }}';
        form.appendChild(csrf);

        document.body.appendChild(form);
        form.submit();
    }
</script>
@endsection