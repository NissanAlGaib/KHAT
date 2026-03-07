@extends('admin.exports.layout')
@section('title', 'Match History')
@section('content')
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Requester</th>
                <th>Target</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $match)
                <tr>
                    <td>{{ $match->created_at->format('Y-m-d') }}</td>
                    <td>{{ $match->requesterPet->name ?? 'Unknown' }} ({{ $match->requesterPet->owner->name ?? 'Unknown' }})</td>
                    <td>{{ $match->targetPet->name ?? 'Unknown' }} ({{ $match->targetPet->owner->name ?? 'Unknown' }})</td>
                    <td>{{ ucfirst($match->status) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection
