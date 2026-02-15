@extends('admin.exports.layout')
@section('title', 'Vaccine Protocols')
@section('content')
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Species</th>
                <th>Type</th>
                <th>Required</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $protocol)
                <tr>
                    <td>{{ $protocol->name }}</td>
                    <td>{{ ucfirst($protocol->species) }}</td>
                    <td>{{ str_replace('_', ' ', $protocol->protocol_type) }}</td>
                    <td>{{ $protocol->is_required ? 'Yes' : 'No' }}</td>
                    <td>{{ $protocol->is_active ? 'Active' : 'Inactive' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection
