@extends('admin.layouts.app')

@section('title', 'Profile Settings - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-6">Profile Settings</h1>

<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-1">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div class="text-center">
                <div class="w-24 h-24 rounded-full bg-[#F6CFBF] flex items-center justify-center text-[#E75234] font-bold text-3xl mx-auto mb-4">
                    {{ strtoupper(substr(Auth::user()->name ?? Auth::user()->email, 0, 2)) }}
                </div>
                <h3 class="text-lg font-semibold text-gray-900">{{ Auth::user()->name ?? 'Admin User' }}</h3>
                <p class="text-sm text-gray-500">{{ Auth::user()->email }}</p>
                <button class="mt-4 px-4 py-2 bg-[#E75234] text-white rounded-lg text-sm font-medium hover:bg-[#d14024]">
                    Change Avatar
                </button>
            </div>
        </div>
    </div>

    <div class="lg:col-span-2">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <form class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input type="text" value="{{ Auth::user()->firstName ?? '' }}" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E75234]">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input type="text" value="{{ Auth::user()->lastName ?? '' }}" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E75234]">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value="{{ Auth::user()->email }}" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E75234]">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input type="text" value="{{ Auth::user()->contact_number ?? '' }}" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E75234]">
                </div>
                <button type="submit" class="px-6 py-2.5 bg-[#E75234] text-white rounded-lg font-medium hover:bg-[#d14024]">
                    Save Changes
                </button>
            </form>
        </div>
    </div>
</div>
@endsection