@extends('admin.exports.layout')
@section('title', 'Safety Reports')
@section('content')
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Reporter</th>
                <th>Reported User</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $report)
                <tr>
                    <td>{{ $report->id }}</td>
                    <td>{{ $report->reporter->name ?? 'Unknown' }}</td>
                    <td>{{ $report->reported->name ?? 'Unknown' }}</td>
                    <td>{{ $report->reason }}</td>
                    <td>{{ ucfirst($report->status) }}</td>
                    <td>{{ $report->created_at->format('Y-m-d H:i') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection
