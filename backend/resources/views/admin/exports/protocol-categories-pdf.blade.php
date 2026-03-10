@extends('admin.exports.layout')
@section('title', 'Protocol Categories')
@section('content')
    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $cat)
                <tr>
                    <td>{{ $cat->name }}</td>
                    <td>{{ $cat->slug }}</td>
                    <td>{{ $cat->description }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection
