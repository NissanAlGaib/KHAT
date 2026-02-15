@extends('admin.exports.layout')
@section('title', 'Pet List')
@section('content')
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Breed</th>
                <th>Owner</th>
                <th>Sex</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $pet)
                <tr>
                    <td>{{ $pet->pet_id }}</td>
                    <td>{{ $pet->name }}</td>
                    <td>{{ $pet->species }}</td>
                    <td>{{ $pet->breed }}</td>
                    <td>{{ $pet->owner->name ?? 'Unknown' }}</td>
                    <td>{{ ucfirst($pet->sex) }}</td>
                    <td>{{ ucfirst($pet->status) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection
