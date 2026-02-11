@extends('admin.layouts.app')

@section('title', 'Reports - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-2">Safety Reports</h1>
<p class="text-sm text-gray-500 mb-6">Manage user reports and safety concerns</p>

<!-- Stats Cards -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
    <!-- Total -->
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-all">
        <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <i data-lucide="flag" class="w-5 h-5 text-blue-600"></i>
            </div>
            <span class="text-sm font-semibold text-gray-500">Total Reports</span>
        </div>
        <p class="text-2xl font-bold text-gray-900">{{ number_format($totalReports) }}</p>
    </div>
    <!-- Pending -->
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-all">
        <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <i data-lucide="clock" class="w-5 h-5 text-yellow-600"></i>
            </div>
            <span class="text-sm font-semibold text-gray-500">Pending</span>
        </div>
        <p class="text-2xl font-bold text-yellow-600">{{ number_format($pendingReports) }}</p>
    </div>
    <!-- Resolved -->
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-all">
        <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <i data-lucide="check-circle" class="w-5 h-5 text-green-600"></i>
            </div>
            <span class="text-sm font-semibold text-gray-500">Resolved</span>
        </div>
        <p class="text-2xl font-bold text-green-600">{{ number_format($resolvedReports) }}</p>
    </div>
    <!-- Dismissed -->
    <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50 hover:shadow-md transition-all">
        <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <i data-lucide="x-circle" class="w-5 h-5 text-gray-600"></i>
            </div>
            <span class="text-sm font-semibold text-gray-500">Dismissed</span>
        </div>
        <p class="text-2xl font-bold text-gray-600">{{ number_format($dismissedReports) }}</p>
    </div>
</div>

<!-- Tabs -->
<div class="flex border-b border-gray-200 mb-6">
    <a href="{{ route('admin.reports') }}" class="px-6 py-3 text-sm font-semibold border-b-2 border-[#E75234] text-[#E75234] transition-colors">
        Reports
    </a>
    <a href="{{ route('admin.blocks') }}" class="px-6 py-3 text-sm font-semibold border-b-2 border-transparent text-gray-600 hover:text-gray-900 transition-colors">
        Blocks
    </a>
</div>

<!-- Filters -->
<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
    <form action="{{ route('admin.reports') }}" method="GET">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div class="relative">
                <input type="text" name="search" value="{{ request('search') }}" placeholder="Search by reporter or reported user..." class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pl-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-400">
                    <i data-lucide="search" class="w-4 h-4"></i>
                </div>
            </div>
            <select name="status" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
                <option value="">All Statuses</option>
                <option value="pending" {{ request('status') == 'pending' ? 'selected' : '' }}>Pending</option>
                <option value="reviewed" {{ request('status') == 'reviewed' ? 'selected' : '' }}>Reviewed</option>
                <option value="resolved" {{ request('status') == 'resolved' ? 'selected' : '' }}>Resolved</option>
                <option value="dismissed" {{ request('status') == 'dismissed' ? 'selected' : '' }}>Dismissed</option>
            </select>
            <select name="reason" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
                <option value="">All Reasons</option>
                @foreach(config('safety.report_reasons') as $value => $label)
                <option value="{{ $value }}" {{ request('reason') == $value ? 'selected' : '' }}>{{ $label }}</option>
                @endforeach
            </select>
            <select name="date_range" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
                <option value="">All Time</option>
                <option value="7" {{ request('date_range') == '7' ? 'selected' : '' }}>Last 7 Days</option>
                <option value="30" {{ request('date_range') == '30' ? 'selected' : '' }}>Last 30 Days</option>
                <option value="90" {{ request('date_range') == '90' ? 'selected' : '' }}>Last 90 Days</option>
            </select>
        </div>
        <div class="flex gap-2">
            <button type="submit" class="px-4 py-2.5 bg-[#E75234] text-white rounded-lg text-sm font-semibold hover:bg-[#d14024]">
                Apply
            </button>
            <a href="{{ route('admin.reports') }}" class="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200">
                Reset
            </a>
        </div>
    </form>
</div>

<!-- Reports Table -->
<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    @if($reports->count() > 0)
    <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[900px]">
            <thead>
                <tr class="bg-[#E75234] text-white text-sm">
                    <th class="px-6 py-4 font-semibold">ID</th>
                    <th class="px-6 py-4 font-semibold">Reporter</th>
                    <th class="px-6 py-4 font-semibold">Reported User</th>
                    <th class="px-6 py-4 font-semibold">Reason</th>
                    <th class="px-6 py-4 font-semibold">Status</th>
                    <th class="px-6 py-4 font-semibold">Date</th>
                    <th class="px-6 py-4 font-semibold">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 text-sm">
                @foreach($reports as $report)
                <tr class="hover:bg-orange-50/50 transition-colors">
                    <td class="px-6 py-4 font-mono text-xs text-gray-600">
                        RPT-{{ str_pad($report->id, 5, '0', STR_PAD_LEFT) }}
                    </td>
                    <td class="px-6 py-4">
                        <div>
                            <p class="font-medium text-gray-900">{{ $report->reporter->name ?? 'Unknown' }}</p>
                            <p class="text-xs text-gray-500">{{ $report->reporter->email ?? '' }}</p>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <div>
                            <p class="font-medium text-gray-900">{{ $report->reported->name ?? 'Unknown' }}</p>
                            <p class="text-xs text-gray-500">{{ $report->reported->email ?? '' }}</p>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
                            {{ config('safety.report_reasons.' . $report->reason, ucfirst($report->reason)) }}
                        </span>
                    </td>
                    <td class="px-6 py-4">
                        @php
                            $statusColors = [
                                'pending' => 'bg-yellow-100 text-yellow-700',
                                'reviewed' => 'bg-blue-100 text-blue-700',
                                'resolved' => 'bg-green-100 text-green-700',
                                'dismissed' => 'bg-gray-100 text-gray-700',
                            ];
                        @endphp
                        <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold {{ $statusColors[$report->status] ?? 'bg-gray-100 text-gray-700' }}">
                            {{ ucfirst($report->status) }}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-gray-500">
                        {{ $report->created_at->format('M d, Y') }}
                    </td>
                    <td class="px-6 py-4">
                        <button onclick="openReportModal({{ $report->id }})" class="text-[#E75234] hover:text-[#d14024] font-semibold text-sm">
                            Review
                        </button>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    
    <!-- Pagination -->
    <div class="px-6 py-4 border-t border-gray-100">
        {{ $reports->links() }}
    </div>
    @else
    <div class="p-12 text-center text-gray-500">
        <i data-lucide="flag" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
        <p class="text-lg font-medium">No reports found</p>
        <p class="text-sm mt-2">Try adjusting your filters</p>
    </div>
    @endif
</div>

<!-- Review Modal -->
<div id="reportModal" class="hidden fixed inset-0 z-50 bg-gray-900/50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 py-8">
        <div class="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-auto">
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 class="text-lg font-bold text-gray-900" id="modalTitle">Review Report</h3>
                <button onclick="closeReportModal()" class="text-gray-400 hover:text-gray-600">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>
            
            <div class="p-6" id="modalContent">
                <!-- Content loaded via JS -->
                <div class="flex justify-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E75234]"></div>
                </div>
            </div>
        </div>
    </div>
</div>

@push('scripts')
<script>
    let currentReportId = null;
    const reasonLabelsConfig = @json(config('safety.report_reasons'));

    function openReportModal(id) {
        currentReportId = id;
        const modal = document.getElementById('reportModal');
        const content = document.getElementById('modalContent');
        const title = document.getElementById('modalTitle');
        
        title.textContent = `Review Report #RPT-${String(id).padStart(5, '0')}`;
        modal.classList.remove('hidden');
        
        // Fetch details
        fetch(`/admin/reports/${id}/details`)
            .then(response => response.json())
            .then(data => {
                if(data.success) {
                    renderModalContent(data.report, data.repeat_offender);
                } else {
                    content.innerHTML = '<p class="text-red-500 text-center">Failed to load report details.</p>';
                }
            })
            .catch(err => {
                console.error(err);
                content.innerHTML = '<p class="text-red-500 text-center">Error loading details.</p>';
            });
    }

    function closeReportModal() {
        document.getElementById('reportModal').classList.add('hidden');
        currentReportId = null;
    }

    function renderModalContent(report, stats) {
        const content = document.getElementById('modalContent');
        
        // Helper for initials
        const getInitials = (name) => name ? name.substring(0, 2).toUpperCase() : '??';
        
        let repeatOffenderHtml = '';
        if (stats.total_reports > 1) {
            let otherReportsHtml = '';
            if (stats.other_reports && stats.other_reports.length > 0) {
                otherReportsHtml = stats.other_reports.map(r => `
                    <li>${r.reason} - ${r.status} (${new Date(r.created_at).toLocaleDateString()})</li>
                `).join('');
            }
            repeatOffenderHtml = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div class="flex items-center gap-2 mb-2">
                        <i data-lucide="alert-triangle" class="w-5 h-5 text-red-600"></i>
                        <h4 class="font-bold text-red-700">Repeat Offender Warning</h4>
                    </div>
                    <p class="text-sm text-red-600 mb-2">
                        This user has been reported <strong>${stats.total_reports} times</strong> by <strong>${stats.distinct_reporters} different users</strong>.
                        ${stats.blocked_by_count > 0 ? `Blocked by <strong>${stats.blocked_by_count} users</strong>.` : ''}
                    </p>
                    ${otherReportsHtml ? `
                    <div class="text-xs text-red-500">
                        Previous reports:
                        <ul class="list-disc list-inside mt-1">
                            ${otherReportsHtml}
                        </ul>
                    </div>
                    ` : ''}
                </div>
            `;
        }

        const reasonLabels = reasonLabelsConfig;

        content.innerHTML = `
            <div class="grid grid-cols-2 gap-6 mb-6">
                <!-- Reporter -->
                <div class="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p class="text-xs font-semibold text-gray-500 uppercase mb-3">Reporter</p>
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                            ${getInitials(report.reporter.name)}
                        </div>
                        <div>
                            <p class="font-medium text-gray-900">${report.reporter.name}</p>
                            <p class="text-xs text-gray-500">${report.reporter.email}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Reported User -->
                <div class="bg-red-50/50 p-4 rounded-lg border border-red-100">
                    <div class="flex justify-between items-start mb-3">
                        <p class="text-xs font-semibold text-red-500 uppercase">Reported User</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-sm">
                            ${getInitials(report.reported.name)}
                        </div>
                        <div>
                            <p class="font-medium text-gray-900">${report.reported.name}</p>
                            <p class="text-xs text-gray-500">${report.reported.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            ${repeatOffenderHtml}

            <div class="mb-6">
                <h4 class="text-sm font-semibold text-gray-900 mb-2">Report Details</h4>
                <div class="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-200 text-gray-700">
                            ${reasonLabels[report.reason] || report.reason}
                        </span>
                        <span class="text-xs text-gray-400">
                            Submitted ${report.created_at}
                        </span>
                    </div>
                    <p class="text-sm text-gray-700 whitespace-pre-wrap">${report.description || 'No description provided.'}</p>
                </div>
            </div>

            <form id="reviewForm" onsubmit="submitReview(event)">
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                        <select name="status" class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-[#E75234] focus:border-[#E75234]">
                            <option value="reviewed" ${report.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
                            <option value="resolved" ${report.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                            <option value="dismissed" ${report.status === 'dismissed' ? 'selected' : ''}>Dismissed</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Resolution Action</label>
                        <select name="resolution_action" class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-[#E75234] focus:border-[#E75234]">
                            <option value="none" ${report.resolution_action === 'none' ? 'selected' : ''}>No Action</option>
                            <option value="warning" ${report.resolution_action === 'warning' ? 'selected' : ''}>Warning</option>
                            <option value="ban" ${report.resolution_action === 'ban' ? 'selected' : ''}>Ban User</option>
                        </select>
                        <p class="text-xs text-red-500 mt-1">Warning: "Ban User" will disable the reported user's account.</p>
                    </div>
                </div>
                
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                    <textarea name="admin_notes" rows="3" class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-[#E75234] focus:border-[#E75234]" placeholder="Internal notes about this review...">${report.admin_notes || ''}</textarea>
                </div>

                <div class="flex justify-end gap-3">
                    <button type="button" onclick="closeReportModal()" class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="submit" class="px-4 py-2 bg-[#E75234] text-white rounded-lg text-sm font-medium hover:bg-[#d14024]">
                        Save Review
                    </button>
                </div>
            </form>
        `;
        
        lucide.createIcons();
    }

    function submitReview(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        fetch(`/admin/reports/${currentReportId}/review`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                'Accept': 'application/json'
            },
            body: JSON.stringify(Object.fromEntries(formData))
        })
        .then(response => response.json())
        .then(data => {
            if(data.success) {
                closeReportModal();
                Swal.fire({
                    icon: 'success',
                    title: 'Report Updated',
                    text: 'The report has been successfully reviewed.',
                    confirmButtonColor: '#E75234'
                }).then(() => window.location.reload());
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.message || 'Failed to update report',
                    confirmButtonColor: '#E75234'
                });
            }
        })
        .catch(err => {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An unexpected error occurred',
                confirmButtonColor: '#E75234'
            });
        });
    }
</script>
@endpush
@endsection