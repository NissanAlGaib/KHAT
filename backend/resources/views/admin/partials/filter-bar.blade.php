{{--
    Unified Filter Bar Component
    
    Variables:
    - $action        (string)  Form action URL
    - $searchName    (string)  Search param name (default: 'search')
    - $searchPlaceholder (string) Placeholder text
    - $filters       (array)   Filter definitions: [ ['name'=>, 'label'=>, 'options'=> [['value'=>,'label'=>]], 'type'=>'select'|'text', 'placeholder'=>] ]
    - $dateFilter    (bool)    Show date range section
    - $datePresets   (bool)    Show quick date preset buttons (default: true when dateFilter)
    - $exports       (bool)    Show CSV/PDF export buttons
    - $perPage       (bool)    Show per-page selector
    - $defaultPerPage (int)    Default per-page value (default: 15)
    - $perPageOptions (array)  Per-page options (default: [10, 15, 25, 50])
    - $hiddenParams  (array)   Hidden form params to preserve (key => value)
    - $totalResults  (int)     Total result count for display
    - $sortable      (bool)    Whether sort controls are present (handled by table headers)
--}}

@php
// Defaults
$action = $action ?? url()->current();
$searchName = $searchName ?? 'search';
$searchPlaceholder = $searchPlaceholder ?? 'Search...';
$showSearch = $showSearch ?? true;
$filters = $filters ?? [];
$dateFilter = $dateFilter ?? false;
$datePresets = $datePresets ?? true;
$exports = $exports ?? false;
$perPage = $perPage ?? true;
$defaultPerPage = $defaultPerPage ?? 15;
$perPageOptions = $perPageOptions ?? [10, 15, 25, 50];
$hiddenParams = $hiddenParams ?? [];
$totalResults = $totalResults ?? null;

// Count active filters (excluding search, page, per_page, sort, export)
$activeFilterCount = 0;
$activeTags = [];

foreach ($filters as $f) {
if (!is_array($f)) {
continue;
}

$filterName = $f['name'] ?? null;
$filterLabel = $f['label'] ?? $filterName ?? 'Filter';
$rawOptions = $f['options'] ?? [];
$filterOptions = is_array($rawOptions) ? $rawOptions : (is_scalar($rawOptions) ? [(string)$rawOptions] : []);

if (!$filterName) {
continue;
}

$val = request($filterName);
if ($val !== null && $val !== '') {
$activeFilterCount++;
$displayValue = $val;

foreach ($filterOptions as $opt) {
$optValue = null;
$optLabel = null;

if (is_array($opt)) {
$optValue = $opt['value'] ?? null;
$optLabel = $opt['label'] ?? $optValue;
} elseif (is_scalar($opt)) {
$optValue = (string)$opt;
$optLabel = (string)$opt;
}

if ($optValue !== null && (string)$optValue === (string)$val) {
$displayValue = $optLabel;
break;
}
}

$activeTags[] = [
'label' => $filterLabel,
'displayValue' => $displayValue,
'name' => $filterName,
];
}
}

// Date filters
if (request('start_date')) {
$activeFilterCount++;
$activeTags[] = ['label' => 'From', 'displayValue' => \Carbon\Carbon::parse(request('start_date'))->format('M d, Y'), 'name' => 'start_date'];
}
if (request('end_date')) {
$activeFilterCount++;
$activeTags[] = ['label' => 'To', 'displayValue' => \Carbon\Carbon::parse(request('end_date'))->format('M d, Y'), 'name' => 'end_date'];
}

// Search
$hasSearch = $showSearch && request($searchName) ? true : false;
if ($hasSearch) $activeFilterCount++;

// Panel should be open if filters are active
$panelOpen = $activeFilterCount > ($hasSearch ? 1 : 0); // open if non-search filters active
@endphp

<div class="filter-bar bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
    <form action="{{ $action }}" method="GET" id="filterForm">
        {{-- Hidden Params --}}
        @foreach($hiddenParams as $key => $value)
        <input type="hidden" name="{{ $key }}" value="{{ $value }}">
        @endforeach

        {{-- ═══════════════ HEADER ROW ═══════════════ --}}
        <div class="px-4 sm:px-5 py-3.5 flex items-center gap-2.5 flex-wrap">
            {{-- Search Input --}}
            @if($showSearch)
            <div class="relative flex-1 min-w-[180px]">
                <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"></i>
                <input type="text"
                    name="{{ $searchName }}"
                    value="{{ request($searchName) }}"
                    placeholder="{{ $searchPlaceholder }}"
                    class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E75234]/20 focus:border-[#E75234]/30 focus:bg-white transition-all">
            </div>
            @endif

            {{-- Filters Toggle --}}
            @if(count($filters) > 0 || $dateFilter)
            <button type="button"
                onclick="PawFilter.toggle()"
                id="filterToggleBtn"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border
                        {{ $panelOpen 
                            ? 'bg-[#FFF5F2] border-[#E75234]/20 text-[#E75234]' 
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300' }}">
                <i data-lucide="sliders-horizontal" class="w-4 h-4"></i>
                <span>Filters</span>
                @if($activeFilterCount > ($hasSearch ? 1 : 0))
                <span class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-[#E75234] rounded-full leading-none">
                    {{ $activeFilterCount - ($hasSearch ? 1 : 0) }}
                </span>
                @endif
            </button>
            @endif

            {{-- Per-page Selector --}}
            @if($perPage)
            <div class="relative">
                <select name="per_page"
                    onchange="this.form.submit()"
                    class="appearance-none bg-gray-50 border border-gray-200 text-gray-600 text-sm font-medium pl-3 pr-8 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E75234]/20 focus:border-[#E75234]/30 transition-all cursor-pointer">
                    @foreach($perPageOptions as $opt)
                    <option value="{{ $opt }}" {{ (int)request('per_page', $defaultPerPage) === $opt ? 'selected' : '' }}>
                        {{ $opt }}/pg
                    </option>
                    @endforeach
                </select>
                <i data-lucide="chevron-down" class="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"></i>
            </div>
            @endif

            {{-- Export Buttons --}}
            @if($exports)
            <div class="flex items-center gap-1.5 ml-auto sm:ml-0">
                <a href="{{ request()->fullUrlWithQuery(['export' => 'csv']) }}"
                    class="inline-flex items-center gap-1.5 px-3 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-all"
                    title="Export CSV">
                    <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5"></i>
                    <span class="hidden sm:inline">CSV</span>
                </a>
                <a href="{{ request()->fullUrlWithQuery(['export' => 'pdf']) }}"
                    class="inline-flex items-center gap-1.5 px-3 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-all"
                    title="Export PDF">
                    <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                    <span class="hidden sm:inline">PDF</span>
                </a>
            </div>
            @endif
        </div>

        {{-- ═══════════════ ACTIVE FILTER TAGS ═══════════════ --}}
        @if(count($activeTags) > 0)
        <div class="px-4 sm:px-5 pb-3 flex flex-wrap gap-2 items-center">
            @foreach($activeTags as $tag)
            @php
            $removeParams = request()->except([$tag['name'], 'page']);
            $removeUrl = $action . ($removeParams ? '?' . http_build_query($removeParams) : '');
            @endphp
            <span class="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-[#FFF5F2] text-[#E75234] rounded-full text-xs font-medium border border-[#E75234]/10">
                <span class="text-[#E75234]/60 font-normal">{{ $tag['label'] }}:</span>
                {{ $tag['displayValue'] }}
                <a href="{{ $removeUrl }}"
                    class="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#E75234]/10 text-[#E75234]/50 hover:text-[#E75234] transition-colors ml-0.5">
                    <i data-lucide="x" class="w-3 h-3"></i>
                </a>
            </span>
            @endforeach
            <a href="{{ $action . (count($hiddenParams) ? '?' . http_build_query($hiddenParams) : '') }}"
                class="text-xs text-gray-400 hover:text-[#E75234] font-medium ml-1 transition-colors">
                Clear all
            </a>
        </div>
        @endif

        {{-- ═══════════════ COLLAPSIBLE FILTER PANEL ═══════════════ --}}
        <div id="filterPanel"
            class="border-t border-gray-100 transition-all duration-300 ease-in-out overflow-hidden"
            style="{{ $panelOpen ? '' : 'max-height: 0; opacity: 0;' }}">
            <div class="p-4 sm:p-5 space-y-5">

                {{-- Filter Dropdowns Grid --}}
                @if(count($filters) > 0)
                <div>
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Filter by</span>
                        <div class="flex-1 h-px bg-gray-100"></div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-{{ min(count($filters), 4) }} gap-3">
                        @foreach($filters as $filter)
                        @php
                        $filterData = is_array($filter) ? $filter : [];
                        $filterName = $filterData['name'] ?? null;
                        $filterLabel = $filterData['label'] ?? $filterName ?? 'Filter';
                        $filterType = $filterData['type'] ?? 'select';
                        $rawOptions = $filterData['options'] ?? [];
                        $filterOptions = is_array($rawOptions) ? $rawOptions : (is_scalar($rawOptions) ? [(string)$rawOptions] : []);
                        @endphp
                        @continue(!$filterName)
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 mb-1.5">
                                {{ $filterLabel }}
                            </label>
                            @if($filterType === 'select')
                            <div class="relative">
                                <select name="{{ $filterName }}"
                                    @if(isset($filterData['id'])) id="{{ $filterData['id'] }}" @endif
                                    @if(isset($filterData['onchange'])) onchange="{{ $filterData['onchange'] }}" @endif
                                    class="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-3 pr-9 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]/20 focus:border-[#E75234]/30 transition-all">
                                    <option value="">{{ $filterData['placeholder'] ?? 'All' }}</option>
                                    @foreach($filterOptions as $opt)
                                    @php
                                    $optValue = null;
                                    $optLabel = null;

                                    if (is_array($opt)) {
                                    $optValue = $opt['value'] ?? null;
                                    $optLabel = $opt['label'] ?? $optValue;
                                    } elseif (is_scalar($opt)) {
                                    $optValue = (string)$opt;
                                    $optLabel = (string)$opt;
                                    }
                                    @endphp
                                    @if($optValue !== null && $optValue !== '')
                                    <option value="{{ $optValue }}" {{ request($filterName) == $optValue ? 'selected' : '' }}>
                                        {{ $optLabel }}
                                    </option>
                                    @endif
                                    @endforeach
                                </select>
                                <i data-lucide="chevron-down" class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"></i>
                            </div>
                            @elseif($filterType === 'text')
                            <input type="text"
                                name="{{ $filterName }}"
                                value="{{ request($filterName) }}"
                                placeholder="{{ $filterData['placeholder'] ?? '' }}"
                                class="w-full bg-white border border-gray-200 text-gray-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]/20 focus:border-[#E75234]/30 transition-all">
                            @endif
                        </div>
                        @endforeach
                    </div>
                </div>
                @endif

                {{-- Date Range Section --}}
                @if($dateFilter)
                <div>
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Date Range</span>
                        <div class="flex-1 h-px bg-gray-100"></div>
                    </div>

                    {{-- Presets --}}
                    @if($datePresets)
                    <div class="flex flex-wrap items-center gap-2 mb-3">
                        @php
                        $startDate = request('start_date', '');
                        $endDate = request('end_date', '');
                        $today = now()->format('Y-m-d');
                        $activePreset = '';
                        if ($startDate === $today && ($endDate === $today || !$endDate)) $activePreset = 'today';
                        elseif ($startDate === now()->subDays(7)->format('Y-m-d')) $activePreset = '7';
                        elseif ($startDate === now()->subDays(30)->format('Y-m-d')) $activePreset = '30';
                        elseif ($startDate === now()->subDays(90)->format('Y-m-d')) $activePreset = '90';
                        @endphp
                        @foreach([
                        ['value' => 'today', 'label' => 'Today', 'icon' => 'calendar-check'],
                        ['value' => '7', 'label' => '7 days', 'icon' => 'calendar-days'],
                        ['value' => '30', 'label' => '30 days', 'icon' => 'calendar'],
                        ['value' => '90', 'label' => '90 days', 'icon' => 'calendar-range'],
                        ] as $preset)
                        <button type="button"
                            onclick="PawFilter.setDatePreset('{{ $preset['value'] }}')"
                            data-preset="{{ $preset['value'] }}"
                            class="paw-date-preset inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                                        {{ $activePreset === $preset['value'] 
                                            ? 'bg-[#E75234] text-white border-[#E75234] shadow-sm' 
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-[#E75234]/30 hover:text-[#E75234] hover:bg-[#FFF5F2]' }}">
                            <i data-lucide="{{ $preset['icon'] }}" class="w-3 h-3"></i>
                            {{ $preset['label'] }}
                        </button>
                        @endforeach

                        <div class="w-px h-5 bg-gray-200 mx-1"></div>
                        <span class="text-xs text-gray-400">or custom range:</span>
                    </div>
                    @endif

                    <div class="flex items-center gap-3 max-w-lg">
                        <div class="flex-1">
                            <input type="date" name="start_date" id="filterStartDate"
                                value="{{ request('start_date') }}"
                                onchange="PawFilter.clearPresets()"
                                class="w-full bg-white border border-gray-200 text-gray-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]/20 focus:border-[#E75234]/30 transition-all">
                        </div>
                        <div class="flex items-center gap-2 text-gray-300">
                            <div class="w-3 h-px bg-gray-300"></div>
                            <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                            <div class="w-3 h-px bg-gray-300"></div>
                        </div>
                        <div class="flex-1">
                            <input type="date" name="end_date" id="filterEndDate"
                                value="{{ request('end_date') }}"
                                onchange="PawFilter.clearPresets()"
                                class="w-full bg-white border border-gray-200 text-gray-700 py-2.5 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]/20 focus:border-[#E75234]/30 transition-all">
                        </div>
                    </div>
                </div>
                @endif

                {{-- Action Row --}}
                <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                    @if($totalResults !== null)
                    <span class="text-xs text-gray-400 font-medium">
                        <i data-lucide="database" class="w-3 h-3 inline -mt-0.5"></i>
                        {{ number_format($totalResults) }} results
                    </span>
                    @else
                    <span></span>
                    @endif
                    <div class="flex gap-2.5">
                        <a href="{{ $action . (count($hiddenParams) ? '?' . http_build_query($hiddenParams) : '') }}"
                            class="px-5 py-2 bg-white text-gray-600 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all">
                            Reset
                        </a>
                        <button type="submit"
                            class="px-5 py-2 bg-[#E75234] text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-[#d14024] transition-all hover:shadow-md active:scale-[0.98]">
                            <i data-lucide="check" class="w-4 h-4 inline -mt-0.5 mr-1"></i>
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </form>
</div>