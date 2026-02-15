@extends('admin.layouts.app')

@section('title', 'Review Management - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-2">User Reviews</h1>
<p class="text-sm text-gray-500 mb-6">Monitor and manage user feedback from completed matches</p>

<!-- Filter Section -->
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
    <form action="{{ route('admin.reviews.index') }}" method="GET">
        <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <i data-lucide="filter" class="w-4 h-4 text-[#E75234]"></i>Filters
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <!-- Rating Filter -->
            <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                <div class="relative">
                    <select name="rating" class="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                        <option value="">All Ratings</option>
                        <option value="5" {{ request('rating') == '5' ? 'selected' : '' }}>5 Stars</option>
                        <option value="4" {{ request('rating') == '4' ? 'selected' : '' }}>4 Stars</option>
                        <option value="3" {{ request('rating') == '3' ? 'selected' : '' }}>3 Stars</option>
                        <option value="2" {{ request('rating') == '2' ? 'selected' : '' }}>2 Stars</option>
                        <option value="1" {{ request('rating') == '1' ? 'selected' : '' }}>1 Star</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </div>
                </div>
            </div>

            <!-- Search Input -->
            <div class="md:col-span-2">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Search Users</label>
                <div class="relative">
                    <input type="text" name="search" value="{{ request('search') }}" placeholder="Search by reviewer or subject name" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pl-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
                    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-400">
                        <i data-lucide="search" class="w-4 h-4"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Date Filters -->
        @include('admin.partials.date-filter')

        <!-- Action Buttons -->
        <div class="flex gap-3 mt-4">
            <button type="submit" class="px-6 py-2.5 bg-[#E75234] text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-[#d14024] transition-all hover:shadow-md">
                Apply Filters
            </button>
            <a href="{{ route('admin.reviews.index') }}" class="px-6 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all shadow-sm">
                Reset Filters
            </a>
        </div>
    </form>
</div>

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
            </div>

            <!-- Content Column -->
            <div class="flex-1">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex items-center gap-2">
                        <div class="flex text-amber-400">
                            @for($i = 1; $i <= 5; $i++)
                                <i data-lucide="star" class="w-4 h-4 {{ $i <= $review->rating ? 'fill-current' : 'text-gray-200' }}"></i>
                            @endfor
                        </div>
                        <span class="text-sm font-bold text-gray-700">{{ $review->rating }}.0</span>
                    </div>
                    <span class="text-xs text-gray-400 font-medium">
                        {{ $review->created_at->format('M d, Y h:i A') }}
                    </span>
                </div>

                <div class="bg-gray-50 rounded-lg p-4 mb-4 relative">
                    <i data-lucide="quote" class="w-8 h-8 text-gray-200 absolute top-2 left-2 -z-0 opacity-50"></i>
                    <p class="text-gray-700 text-sm leading-relaxed relative z-10 italic">
                        "{{ $review->comment ?: 'No written comment provided.' }}"
                    </p>
                </div>

                <div class="flex justify-between items-center">
                    <div class="text-xs text-gray-500">
                        Match ID: <span class="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">#{{ $review->match_id }}</span>
                    </div>
                    
                    <form action="{{ route('admin.reviews.destroy', $review->id) }}" method="POST" onsubmit="return confirm('Are you sure you want to delete this review? This will update the user\'s average rating.');">
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
