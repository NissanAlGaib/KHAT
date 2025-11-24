@extends('admin.layouts.app')

@section('title', 'Audit Logs - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-6">Audit Logs</h1>

<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
            <option>All Actions</option>
            <option>User Created</option>
            <option>User Updated</option>
            <option>User Deleted</option>
            <option>Pet Created</option>
            <option>Pet Updated</option>
            <option>Login</option>
            <option>Logout</option>
        </select>
        <select class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
            <option>All Users</option>
            <option>Admins Only</option>
        </select>
        <input type="date" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
        <input type="date" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
    </div>
</div>

<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <h3 class="font-semibold text-gray-800 mb-4">Activity Log</h3>
    <div class="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <span class="text-gray-400">Audit log system will track all admin actions here</span>
    </div>
</div>
@endsection