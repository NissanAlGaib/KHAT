@extends('admin.exports.layout')
@section('title', 'Audit Logs')
@section('content')
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>User</th>
                <th>Action</th>
                <th>Description</th>
                <th>Target</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $log)
                <tr>
                    <td>{{ $log->created_at->format('Y-m-d H:i:s') }}</td>
                    <td>{{ $log->user->name ?? 'System' }}</td>
                    <td>{{ $log->action }}</td>
                    <td>{{ $log->description }}</td>
                    <td>{{ class_basename($log->target_type) }} #{{ $log->target_id }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection
