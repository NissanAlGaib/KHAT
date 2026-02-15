@extends('admin.exports.layout')
@section('title', 'Blocked Users')
@section('content')
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Blocker</th>
                <th>Blocked User</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $block)
                <tr>
                    <td>{{ $block->created_at->format('Y-m-d') }}</td>
                    <td>{{ $block->blocker->name ?? 'Unknown' }}</td>
                    <td>{{ $block->blocked->name ?? 'Unknown' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection
