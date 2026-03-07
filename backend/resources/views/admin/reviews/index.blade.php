@extends('admin.layouts.app')

@section('title', 'Review Management - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-2">User Reviews</h1>
<p class="text-sm text-gray-500 mb-6">Monitor and manage user feedback from completed matches</p>

<!-- Summary Stats Cards -->
<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <i data-lucide="message-square" class="w-5 h-5 text-blue-600"></i>
            </div>
            <div>
                <p class="text-2xl font-bold text-gray-900">{{ number_format($totalReviews) }}</p>
                <p class="text-xs text-gray-500">Total Reviews</p>
            </div>
        </div>
        <div class="mt-2 text-xs font-medium {{ $reviewTrend >= 0 ? 'text-green-600' : 'text-red-600' }}">
            {{ $reviewTrend >= 0 ? '+' : '' }}{{ $reviewTrend }}% this month
        </div>
    </div>
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <i data-lucide="star" class="w-5 h-5 text-amber-600"></i>
            </div>
            <div>
                <p class="text-2xl font-bold text-amber-600">{{ $averageRating ? number_format($averageRating, 1) : '—' }}</p>
                <p class="text-xs text-gray-500">Average Rating</p>
            </div>
        </div>
        <div class="mt-2 flex text-amber-400">
            @for($i = 1; $i <= 5; $i++)
                @if(($averageRating ?? 0)>= $i)
                <i data-lucide="star" class="w-3 h-3 fill-current"></i>
                @elseif(($averageRating ?? 0) >= $i - 0.5)
                <i data-lucide="star-half" class="w-3 h-3 fill-current"></i>
                @else
                <i data-lucide="star" class="w-3 h-3 text-gray-200"></i>
                @endif
                @endfor
        </div>
    </div>
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <i data-lucide="thumbs-up" class="w-5 h-5 text-green-600"></i>
            </div>
            <div>
                <p class="text-2xl font-bold text-green-600">{{ number_format($positiveReviews) }}</p>
                <p class="text-xs text-gray-500">Positive (4-5★)</p>
            </div>
        </div>
        <div class="mt-2 text-xs text-gray-400">
            {{ $totalReviews > 0 ? round(($positiveReviews / $totalReviews) * 100) : 0 }}% of total
        </div>
    </div>
    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <i data-lucide="thumbs-down" class="w-5 h-5 text-red-600"></i>
            </div>
            <div>
                <p class="text-2xl font-bold text-red-600">{{ number_format($negativeReviews) }}</p>
                <p class="text-xs text-gray-500">Negative (1-2★)</p>
            </div>
        </div>
        <div class="mt-2 text-xs text-gray-400">
            {{ $totalReviews > 0 ? round(($negativeReviews / $totalReviews) * 100) : 0 }}% of total
        </div>
    </div>
</div>

<!-- Rating Distribution & Type Breakdown -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
    <!-- Rating Distribution -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 class="text-sm font-bold text-gray-900 mb-3">Rating Distribution</h3>
        <div class="space-y-2">
            @for($star = 5; $star >= 1; $star--)
            @php
            $count = $ratingDistribution[$star] ?? 0;
            $percentage = $totalReviews > 0 ? round(($count / $totalReviews) * 100) : 0;
            @endphp
            <div class="flex items-center gap-3">
                <span class="text-xs font-semibold text-gray-600 w-12">{{ $star }} star{{ $star > 1 ? 's' : '' }}</span>
                <div class="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full {{ $star >= 4 ? 'bg-green-400' : ($star === 3 ? 'bg-amber-400' : 'bg-red-400') }}" style="width: {{ $percentage }}%"></div>
                </div>
                <span class="text-xs font-medium text-gray-500 w-16 text-right">{{ $count }} ({{ $percentage }}%)</span>
            </div>
            @endfor
        </div>
    </div>

    <!-- Type Breakdown -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 class="text-sm font-bold text-gray-900 mb-3">Review Types</h3>
        <div class="grid grid-cols-2 gap-4">
            <div class="bg-orange-50 rounded-lg p-4 border border-orange-100 text-center">
                <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
                    <i data-lucide="dog" class="w-5 h-5 text-orange-600"></i>
                </div>
                <p class="text-2xl font-bold text-gray-900">{{ $breederReviews }}</p>
                <p class="text-xs text-gray-500 font-medium">Breeder Reviews</p>
            </div>
            <div class="bg-blue-50 rounded-lg p-4 border border-blue-100 text-center">
                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                    <i data-lucide="camera" class="w-5 h-5 text-blue-600"></i>
                </div>
                <p class="text-2xl font-bold text-gray-900">{{ $shooterReviews }}</p>
                <p class="text-xs text-gray-500 font-medium">Shooter Reviews</p>
            </div>
        </div>
        <div class="mt-4">
            <div class="flex h-3 rounded-full overflow-hidden bg-gray-100">
                @if($totalReviews > 0)
                <div class="bg-orange-400 rounded-l-full" style="width: {{ round(($breederReviews / $totalReviews) * 100) }}%"></div>
                <div class="bg-blue-400 rounded-r-full" style="width: {{ round(($shooterReviews / $totalReviews) * 100) }}%"></div>
                @endif
            </div>
            <div class="flex justify-between mt-1.5">
                <span class="text-[10px] text-orange-600 font-semibold">{{ $totalReviews > 0 ? round(($breederReviews / $totalReviews) * 100) : 0 }}% Breeder</span>
                <span class="text-[10px] text-blue-600 font-semibold">{{ $totalReviews > 0 ? round(($shooterReviews / $totalReviews) * 100) : 0 }}% Shooter</span>
            </div>
        </div>
    </div>
</div>

@include('admin.partials.filter-bar', [
'action' => route('admin.reviews.index'),
'searchPlaceholder' => 'Search by reviewer or subject name...',
'filters' => [
['name' => 'rating', 'label' => 'Rating', 'options' => [
['value' => '5', 'label' => '5 Stars'],
['value' => '4', 'label' => '4 Stars'],
['value' => '3', 'label' => '3 Stars'],
['value' => '2', 'label' => '2 Stars'],
['value' => '1', 'label' => '1 Star'],
]],
['name' => 'review_type', 'label' => 'Review Type', 'options' => [
['value' => 'breeder', 'label' => 'Breeder'],
['value' => 'shooter', 'label' => 'Shooter'],
]],
],
'dateFilter' => true,
'datePresets' => true,
'exports' => false,
'perPage' => true,
'defaultPerPage' => 15,
'totalResults' => $reviews->total(),
])

<!-- Reviews List -->
<div class="space-y-4">
    @forelse($reviews as $review)
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
        <div class="flex flex-col md:flex-row gap-6">
            <!-- User Info Column -->
            <div class="md:w-1/4 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-6">
                <!-- Reviewer -->
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {{ strtoupper(substr($review->reviewer->name ?? 'U', 0, 1)) }}
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 uppercase font-semibold">Reviewer</p>
                        <a href="{{ route('admin.users.show', $review->reviewer_id) }}" class="font-bold text-gray-900 hover:text-[#E75234] transition-colors">
                            {{ $review->reviewer->name }}
                        </a>
                    </div>
                </div>

                <div class="flex justify-center">
                    <i data-lucide="arrow-down" class="w-5 h-5 text-gray-300"></i>
                </div>

                <!-- Subject -->
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {{ strtoupper(substr($review->subject->name ?? 'U', 0, 1)) }}
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 uppercase font-semibold">Subject</p>
                        <a href="{{ route('admin.users.show', $review->subject_id) }}" class="font-bold text-gray-900 hover:text-[#E75234] transition-colors">
                            {{ $review->subject->name }}
                        </a>
                    </div>
                </div>

                <!-- Review Type Badge -->
                <div class="mt-1">
                    @if($review->review_type === 'shooter')
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-blue-100 text-blue-700 border border-blue-200">
                        <i data-lucide="camera" class="w-3 h-3"></i> Shooter Review
                    </span>
                    @else
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-orange-100 text-orange-700 border border-orange-200">
                        <i data-lucide="dog" class="w-3 h-3"></i> Breeder Review
                    </span>
                    @endif
                </div>
            </div>

            <!-- Content Column -->
            <div class="flex-1">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center gap-2">
                        <div class="flex text-amber-400">
                            @for($i = 1; $i <= 5; $i++)
                                @if($review->average_rating >= $i)
                                <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                                @elseif($review->average_rating >= $i - 0.5)
                                <i data-lucide="star-half" class="w-4 h-4 fill-current"></i>
                                @else
                                <i data-lucide="star" class="w-4 h-4 text-gray-200"></i>
                                @endif
                                @endfor
                        </div>
                        <span class="text-sm font-bold text-gray-700">{{ number_format($review->average_rating, 1) }}</span>
                    </div>
                    <span class="text-xs text-gray-400 font-medium">
                        {{ $review->created_at->format('M d, Y h:i A') }}
                    </span>
                </div>

                <!-- Category Ratings -->
                @if($review->ratings->count() > 0)
                <div class="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
                    @php
                    $categoryLabels = config("ratings.{$review->review_type}_categories", []);
                    @endphp
                    @foreach($review->ratings as $categoryRating)
                    <div class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <span class="text-[11px] text-gray-600 font-medium truncate mr-2">{{ $categoryLabels[$categoryRating->category] ?? ucwords(str_replace('_', ' ', $categoryRating->category)) }}</span>
                        <div class="flex items-center gap-1 flex-shrink-0">
                            <i data-lucide="star" class="w-3 h-3 text-amber-400 fill-current"></i>
                            <span class="text-xs font-bold text-gray-700">{{ number_format($categoryRating->rating, 1) }}</span>
                        </div>
                    </div>
                    @endforeach
                </div>
                @endif

                <div class="bg-gray-50 rounded-lg p-4 mb-4 relative">
                    <i data-lucide="quote" class="w-8 h-8 text-gray-200 absolute top-2 left-2 -z-0 opacity-50"></i>
                    <p class="text-gray-700 text-sm leading-relaxed relative z-10 italic">
                        "{{ $review->comment ?: 'No written comment provided.' }}"
                    </p>
                </div>

                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3 text-xs text-gray-500">
                        <span>Match ID: <span class="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">#{{ $review->match_id }}</span></span>
                        @if($review->contract_id)
                        <span>Contract: <span class="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">#{{ $review->contract_id }}</span></span>
                        @endif
                    </div>

                    <form action="{{ route('admin.reviews.destroy', $review->id) }}" method="POST" data-confirm="Are you sure you want to delete this review? This will update the user's average rating." data-confirm-title="Delete Review" data-confirm-icon="warning" data-confirm-btn="Yes, delete it">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 hover:border-red-200 transition-all shadow-sm">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Delete Review
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
    @empty
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <i data-lucide="star-off" class="w-8 h-8 text-gray-300"></i>
        </div>
        <h3 class="text-lg font-bold text-gray-900 mb-1">No Reviews Found</h3>
        <p class="text-gray-500 text-sm">No reviews match your current filters.</p>
        <a href="{{ route('admin.reviews.index') }}" class="inline-block mt-4 text-[#E75234] text-sm font-semibold hover:underline">Clear Filters</a>
    </div>
    @endforelse
</div>

<div class="mt-6">
    {{ $reviews->links() }}
</div>
@endsection