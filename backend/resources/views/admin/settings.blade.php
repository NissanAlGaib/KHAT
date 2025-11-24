@extends('admin.layouts.app')

@section('title', 'Settings - KHAT Admin')

@section('content')
<h1 class="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

<div class="space-y-6">
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <h4 class="font-medium text-gray-900">Email Notifications</h4>
                    <p class="text-sm text-gray-500">Receive email notifications for important updates</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" checked>
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#E75234]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E75234]"></div>
                </label>
            </div>

            <div class="flex items-center justify-between">
                <div>
                    <h4 class="font-medium text-gray-900">SMS Alerts</h4>
                    <p class="text-sm text-gray-500">Get SMS alerts for critical system events</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#E75234]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E75234]"></div>
                </label>
            </div>

            <div class="flex items-center justify-between">
                <div>
                    <h4 class="font-medium text-gray-900">Two-Factor Authentication</h4>
                    <p class="text-sm text-gray-500">Add an extra layer of security to your account</p>
                </div>
                <button class="px-4 py-2 bg-[#E75234] text-white rounded-lg text-sm font-medium hover:bg-[#d14024]">
                    Enable
                </button>
            </div>
        </div>
    </div>

    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Security</h3>
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Change Password</label>
                <button class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                    Update Password
                </button>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Session Timeout</label>
                <select class="w-full md:w-64 bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
                    <option>15 minutes</option>
                    <option>30 minutes</option>
                    <option selected>1 hour</option>
                    <option>4 hours</option>
                    <option>Never</option>
                </select>
            </div>
        </div>
    </div>
</div>
@endsection