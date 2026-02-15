@extends('admin.exports.layout')
@section('title', 'Subscription Tiers')
@section('content')
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Price</th>
                <th>Duration (Days)</th>
                <th>Active</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $tier)
                <tr>
                    <td>{{ $tier->name }}</td>
                    <td>{{ $tier->slug }}</td>
                    <td>{{ number_format($tier->price, 2) }}</td>
                    <td>{{ $tier->duration_days }}</td>
                    <td>{{ $tier->is_active ? 'Yes' : 'No' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection
