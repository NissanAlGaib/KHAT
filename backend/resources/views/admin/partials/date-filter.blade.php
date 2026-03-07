<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
    <form action="{{ url()->current() }}" method="GET" class="flex flex-col md:flex-row items-end gap-4">
        @foreach(request()->except(['start_date', 'end_date', 'page']) as $key => $value)
            @if(is_array($value))
                @foreach($value as $v)
                    <input type="hidden" name="{{ $key }}[]" value="{{ $v }}">
                @endforeach
            @else
                <input type="hidden" name="{{ $key }}" value="{{ $value }}">
            @endif
        @endforeach

        <div class="flex-1 w-full">
            <label for="start_date" class="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
            <input type="date" name="start_date" id="start_date" value="{{ request('start_date') }}" 
                class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
        </div>

        <div class="flex-1 w-full">
            <label for="end_date" class="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
            <input type="date" name="end_date" id="end_date" value="{{ request('end_date') }}" 
                class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition">
        </div>

        <div class="flex gap-2 w-full md:w-auto">
            <button type="submit" class="flex-1 md:flex-none px-6 py-2.5 bg-[#E75234] text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-[#d14024] transition-all hover:shadow-md">
                Filter
            </button>
            <a href="{{ url()->current() }}" class="flex-1 md:flex-none px-6 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-all shadow-sm text-center">
                Reset
            </a>
        </div>
    </form>
</div>
