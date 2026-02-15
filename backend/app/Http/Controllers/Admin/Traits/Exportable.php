<?php

namespace App\Http\Controllers\Admin\Traits;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Response;

trait Exportable
{
    /**
     * Export query results to CSV or PDF.
     *
     * @param Builder|Collection $queryOrCollection The query builder or collection
     * @param string $format 'csv' or 'pdf'
     * @param string $filename Base filename (without extension)
     * @param string $view PDF view name
     * @param array $viewData Additional data for the PDF view
     * @param array $csvColumns Array of column headers and row callbacks: ['Header' => function($row) { return $val; }]
     * @return \Illuminate\Http\Response|\Symfony\Component\HttpFoundation\StreamedResponse
     */
    protected function export($queryOrCollection, string $format, string $filename, string $view, array $viewData = [], array $csvColumns = [])
    {
        // Resolve data
        $data = $queryOrCollection instanceof Builder ? $queryOrCollection->get() : $queryOrCollection;
        $timestamp = now()->format('Y-m-d_H-i');
        $fullFilename = "{$filename}_{$timestamp}";

        if ($format === 'pdf') {
            // Increase memory limit for PDF generation
            ini_set('memory_limit', '512M');
            ini_set('max_execution_time', '300');

            $pdf = Pdf::loadView($view, array_merge(['data' => $data], $viewData));
            $pdf->setPaper('a4', 'landscape');
            return $pdf->download("{$fullFilename}.pdf");
        }

        if ($format === 'csv') {
            $headers = [
                "Content-type" => "text/csv",
                "Content-Disposition" => "attachment; filename={$fullFilename}.csv",
                "Pragma" => "no-cache",
                "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
                "Expires" => "0"
            ];

            $callback = function() use ($data, $csvColumns) {
                $file = fopen('php://output', 'w');
                
                // Write Header
                fputcsv($file, array_keys($csvColumns));

                // Write Rows
                foreach ($data as $row) {
                    $rowData = [];
                    foreach ($csvColumns as $colCallback) {
                        // Handle potential closure or direct value
                        $value = is_callable($colCallback) ? $colCallback($row) : $row->{$colCallback};
                        // Sanitize for CSV (prevent formula injection)
                        if (is_string($value) && preg_match('/^[=\+\-@]/', $value)) {
                            $value = "'" . $value;
                        }
                        $rowData[] = $value;
                    }
                    fputcsv($file, $rowData);
                }
                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        }

        abort(400, 'Invalid export format');
    }
}
