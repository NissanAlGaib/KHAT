<?php

namespace App\Traits;

use Illuminate\Http\Request;

trait FiltersByDate
{
    /**
     * Scope a query to filter by start and end dates.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param \Illuminate\Http\Request $request
     * @param string $column
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeFilterByDate($query, Request $request, $column = 'created_at')
    {
        if ($request->filled('start_date')) {
            $query->whereDate($column, '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate($column, '<=', $request->end_date);
        }

        return $query;
    }
}
