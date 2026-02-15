<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'KHAT Admin')</title>

    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.11.6/viewer.min.css">

    <style>
        body { font-family: 'Inter', sans-serif; }
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }

        ::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
        }

        ::-webkit-scrollbar-track {
            background: #f9fafb;
        }

        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }

        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }

        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.3s ease-out; }
    </style>
    @stack('styles')
</head>

<body class="bg-gray-50 font-sans">

    <!-- Sidebar (Desktop) -->
    <aside id="sidebar" class="hidden lg:flex w-64 h-screen bg-gray-900 shadow-sm flex-col fixed top-0 left-0 z-20">
        <div class="p-6 flex items-center justify-center bg-gradient-to-r from-[#E75234] to-[#d14024]">
            <h1 class="text-xl font-bold text-white">KHAT Admin</h1>
        </div>

        @php
            $petGroupActive = request()->routeIs('admin.pets.*') || request()->routeIs('admin.vaccine-protocols.*') || request()->routeIs('admin.vaccination-shots.*') || request()->routeIs('admin.protocol-categories.*');
            $businessGroupActive = request()->routeIs('admin.analytics') || request()->routeIs('admin.billing') || request()->routeIs('admin.subscription-tiers.*');
            $systemGroupActive = request()->routeIs('admin.reports') || request()->routeIs('admin.blocks') || request()->routeIs('admin.audit-logs');
        @endphp

        <nav class="flex-grow p-4 overflow-y-auto">
            <h3 class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">Overview</h3>
            <ul class="space-y-1">
                <li>
                    <a href="{{ route('admin.dashboard') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.dashboard') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <i data-lucide="layout-dashboard" class="w-5 h-5 {{ request()->routeIs('admin.dashboard') ? 'text-white' : 'text-gray-500' }}"></i>
                        <span>Dashboard</span>
                    </a>
                </li>
            </ul>

            <h3 class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2 px-3">Management</h3>
            <ul class="space-y-1">
                <li>
                    <a href="{{ route('admin.users.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.users.*') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <i data-lucide="users" class="w-5 h-5 {{ request()->routeIs('admin.users.*') ? 'text-white' : 'text-gray-500' }}"></i>
                        <span>User Management</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.admins.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.admins.*') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <i data-lucide="shield-check" class="w-5 h-5 {{ request()->routeIs('admin.admins.*') ? 'text-white' : 'text-gray-500' }}"></i>
                        <span>Admin Management</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.reviews.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.reviews.*') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <i data-lucide="star" class="w-5 h-5 {{ request()->routeIs('admin.reviews.*') ? 'text-white' : 'text-gray-500' }}"></i>
                        <span>Reviews</span>
                    </a>
                </li>

                {{-- Pet Management collapsible group --}}
                <li>
                    <button onclick="toggleSidebarGroup('pet-group')" class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg {{ $petGroupActive ? 'bg-white/10 text-white font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <span class="flex items-center gap-3">
                            <i data-lucide="paw-print" class="w-5 h-5 {{ $petGroupActive ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Pet Management</span>
                        </span>
                        <i data-lucide="chevron-down" class="w-4 h-4 sidebar-chevron transition-transform duration-200 {{ $petGroupActive ? 'rotate-180' : '' }}" id="pet-group-chevron"></i>
                    </button>
                    <ul id="pet-group" class="mt-1 ml-5 space-y-1 border-l border-gray-700 pl-3 overflow-hidden transition-all duration-200 {{ $petGroupActive ? '' : 'hidden' }}">
                        <li>
                            <a href="{{ route('admin.pets.index') }}" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm {{ request()->routeIs('admin.pets.*') ? 'text-white font-semibold border-l-[3px] border-[#E75234] bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5 font-medium' }}">
                                <i data-lucide="list" class="w-4 h-4 {{ request()->routeIs('admin.pets.*') ? 'text-white' : 'text-gray-500' }}"></i>
                                <span>All Pets</span>
                            </a>
                        </li>
                        <li>
                            <a href="{{ route('admin.vaccine-protocols.index') }}" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm {{ request()->routeIs('admin.vaccine-protocols.*') ? 'text-white font-semibold border-l-[3px] border-[#E75234] bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5 font-medium' }}">
                                <i data-lucide="syringe" class="w-4 h-4 {{ request()->routeIs('admin.vaccine-protocols.*') ? 'text-white' : 'text-gray-500' }}"></i>
                                <span>Vaccine Protocols</span>
                            </a>
                        </li>
                        <li>
                            <a href="{{ route('admin.protocol-categories.index') }}" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm {{ request()->routeIs('admin.protocol-categories.*') ? 'text-white font-semibold border-l-[3px] border-[#E75234] bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5 font-medium' }}">
                                <i data-lucide="folder-open" class="w-4 h-4 {{ request()->routeIs('admin.protocol-categories.*') ? 'text-white' : 'text-gray-500' }}"></i>
                                <span>Protocol Categories</span>
                            </a>
                        </li>
                        <li>
                            <a href="{{ route('admin.vaccination-shots.pending') }}" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm {{ request()->routeIs('admin.vaccination-shots.*') ? 'text-white font-semibold border-l-[3px] border-[#E75234] bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5 font-medium' }}">
                                <i data-lucide="clipboard-check" class="w-4 h-4 {{ request()->routeIs('admin.vaccination-shots.*') ? 'text-white' : 'text-gray-500' }}"></i>
                                <span>Shot Verification</span>
                            </a>
                        </li>
                    </ul>
                </li>

                <li>
                    <a href="{{ route('admin.matches') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.matches') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <i data-lucide="heart-handshake" class="w-5 h-5 {{ request()->routeIs('admin.matches') ? 'text-white' : 'text-gray-500' }}"></i>
                        <span>Match History</span>
                    </a>
                </li>
            </ul>

            <h3 class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2 px-3">Business</h3>
            <ul class="space-y-1">
                <li>
                    <a href="{{ route('admin.analytics') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.analytics') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <i data-lucide="bar-chart-2" class="w-5 h-5 {{ request()->routeIs('admin.analytics') ? 'text-white' : 'text-gray-500' }}"></i>
                        <span>Analytics</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.subscription-tiers.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.subscription-tiers.*') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <i data-lucide="layers" class="w-5 h-5 {{ request()->routeIs('admin.subscription-tiers.*') ? 'text-white' : 'text-gray-500' }}"></i>
                        <span>Subscription Tiers</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.billing') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.billing') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <i data-lucide="credit-card" class="w-5 h-5 {{ request()->routeIs('admin.billing') ? 'text-white' : 'text-gray-500' }}"></i>
                        <span>Subscription & Billing</span>
                    </a>
                </li>
            </ul>

            <h3 class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2 px-3">System</h3>
            <ul class="space-y-1">
                <li>
                    <a href="{{ route('admin.reports') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.reports') || request()->routeIs('admin.blocks') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <i data-lucide="shield-alert" class="w-5 h-5 {{ request()->routeIs('admin.reports') || request()->routeIs('admin.blocks') ? 'text-white' : 'text-gray-500' }}"></i>
                        <span>Reports</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.audit-logs') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.audit-logs') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <i data-lucide="book-lock" class="w-5 h-5 {{ request()->routeIs('admin.audit-logs') ? 'text-white' : 'text-gray-500' }}"></i>
                        <span>Audit Logs</span>
                    </a>
                </li>
            </ul>

            <h3 class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2 px-3">Personal</h3>
            <ul class="space-y-1">
                <li>
                    <a href="{{ route('admin.profile') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.profile') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <i data-lucide="user-circle" class="w-5 h-5 {{ request()->routeIs('admin.profile') ? 'text-white' : 'text-gray-500' }}"></i>
                        <span>Profile Settings</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.notifications') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.notifications') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <i data-lucide="bell" class="w-5 h-5 {{ request()->routeIs('admin.notifications') ? 'text-white' : 'text-gray-500' }}"></i>
                        <span>Notifications</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.settings') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.settings') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <i data-lucide="settings" class="w-5 h-5 {{ request()->routeIs('admin.settings') ? 'text-white' : 'text-gray-500' }}"></i>
                        <span>Settings</span>
                    </a>
                </li>
            </ul>
        </nav>

        <!-- User Profile -->
        <div class="p-4 border-t border-gray-800 bg-gray-900">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-[#F6CFBF] flex items-center justify-center text-[#E75234] font-bold">
                    {{ strtoupper(substr(Auth::user()->name ?? Auth::user()->email, 0, 2)) }}
                </div>
                <div>
                    <p class="text-sm font-semibold text-gray-200">{{ Auth::user()->name ?? 'Admin' }}</p>
                    <p class="text-xs text-gray-500">{{ Auth::user()->email }}</p>
                </div>
            </div>
        </div>
    </aside>

    <div class="lg:ml-64">
        <header class="flex justify-between items-center sticky top-0 z-10 bg-white shadow-sm border-b border-gray-100 px-6 lg:px-8 py-4">
            <button id="mobile-menu-btn" class="lg:hidden text-gray-600">
                <i data-lucide="menu" class="w-6 h-6"></i>
            </button>

            <div class="hidden lg:block"></div>

            <div class="flex items-center gap-4">
                <div class="relative hidden sm:block">
                    <i data-lucide="search" class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
                    <input type="search" placeholder="Search..." class="pl-10 pr-4 py-2.5 w-full max-w-xs md:max-w-sm lg:w-72 bg-gray-50 border-0 rounded-full text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#E75234]/20 transition-all">
                </div>

                <button class="relative text-gray-500 hover:text-gray-700">
                    <i data-lucide="bell" class="w-6 h-6"></i>
                    <span class="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-red-500"></span>
                </button>

                <div class="w-9 h-9 rounded-full bg-[#F6CFBF] flex items-center justify-center text-[#E75234] font-bold text-sm">
                    {{ strtoupper(substr(Auth::user()->name ?? Auth::user()->email, 0, 2)) }}
                </div>

                <form action="{{ route('admin.logout') }}" method="POST" class="inline">
                    @csrf
                    <button type="submit" class="text-sm text-[#E75234] hover:text-[#c03e25] font-semibold">
                        Logout
                    </button>
                </form>
            </div>
        </header>

        <main class="p-6 lg:p-10 animate-fade-in-up">
            @yield('content')
        </main>
    </div>

    <!-- Mobile Menu Overlay -->
    <div id="mobile-menu" class="hidden fixed inset-0 z-30 bg-gray-900/50 lg:hidden">
        <aside class="w-64 h-screen bg-gray-900 shadow-sm flex flex-col">
            <div class="p-6 flex items-center justify-between bg-gradient-to-r from-[#E75234] to-[#d14024]">
                <h1 class="text-xl font-bold text-white">KHAT Admin</h1>
                <button id="close-menu-btn" class="text-white/80 hover:text-white">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>

            <nav class="flex-grow p-4 overflow-y-auto">
                <h3 class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">Overview</h3>
                <ul class="space-y-1">
                    <li>
                        <a href="{{ route('admin.dashboard') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.dashboard') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                            <i data-lucide="layout-dashboard" class="w-5 h-5 {{ request()->routeIs('admin.dashboard') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Dashboard</span>
                        </a>
                    </li>
                </ul>

                <h3 class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2 px-3">Management</h3>
                <ul class="space-y-1">
                    <li>
                        <a href="{{ route('admin.users.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.users.*') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                            <i data-lucide="users" class="w-5 h-5 {{ request()->routeIs('admin.users.*') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>User Management</span>
                        </a>
                    </li>

                    {{-- Pet Management collapsible group (mobile) --}}
                    <li>
                        <button onclick="toggleSidebarGroup('mobile-pet-group')" class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg {{ $petGroupActive ? 'bg-white/10 text-white font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                            <span class="flex items-center gap-3">
                                <i data-lucide="paw-print" class="w-5 h-5 {{ $petGroupActive ? 'text-white' : 'text-gray-500' }}"></i>
                                <span>Pet Management</span>
                            </span>
                            <i data-lucide="chevron-down" class="w-4 h-4 sidebar-chevron transition-transform duration-200 {{ $petGroupActive ? 'rotate-180' : '' }}" id="mobile-pet-group-chevron"></i>
                        </button>
                        <ul id="mobile-pet-group" class="mt-1 ml-5 space-y-1 border-l border-gray-700 pl-3 overflow-hidden transition-all duration-200 {{ $petGroupActive ? '' : 'hidden' }}">
                            <li>
                                <a href="{{ route('admin.pets.index') }}" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm {{ request()->routeIs('admin.pets.*') ? 'text-white font-semibold border-l-[3px] border-[#E75234] bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5 font-medium' }}">
                                    <i data-lucide="list" class="w-4 h-4 {{ request()->routeIs('admin.pets.*') ? 'text-white' : 'text-gray-500' }}"></i>
                                    <span>All Pets</span>
                                </a>
                            </li>
                            <li>
                                <a href="{{ route('admin.vaccine-protocols.index') }}" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm {{ request()->routeIs('admin.vaccine-protocols.*') ? 'text-white font-semibold border-l-[3px] border-[#E75234] bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5 font-medium' }}">
                                    <i data-lucide="syringe" class="w-4 h-4 {{ request()->routeIs('admin.vaccine-protocols.*') ? 'text-white' : 'text-gray-500' }}"></i>
                                    <span>Vaccine Protocols</span>
                                </a>
                            </li>
                            <li>
                                <a href="{{ route('admin.protocol-categories.index') }}" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm {{ request()->routeIs('admin.protocol-categories.*') ? 'text-white font-semibold border-l-[3px] border-[#E75234] bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5 font-medium' }}">
                                    <i data-lucide="folder-open" class="w-4 h-4 {{ request()->routeIs('admin.protocol-categories.*') ? 'text-white' : 'text-gray-500' }}"></i>
                                    <span>Protocol Categories</span>
                                </a>
                            </li>
                            <li>
                                <a href="{{ route('admin.vaccination-shots.pending') }}" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm {{ request()->routeIs('admin.vaccination-shots.*') ? 'text-white font-semibold border-l-[3px] border-[#E75234] bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5 font-medium' }}">
                                    <i data-lucide="clipboard-check" class="w-4 h-4 {{ request()->routeIs('admin.vaccination-shots.*') ? 'text-white' : 'text-gray-500' }}"></i>
                                    <span>Shot Verification</span>
                                </a>
                            </li>
                        </ul>
                    </li>

                    <li>
                        <a href="{{ route('admin.matches') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.matches') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                            <i data-lucide="heart-handshake" class="w-5 h-5 {{ request()->routeIs('admin.matches') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Match History</span>
                        </a>
                    </li>
                </ul>

                <h3 class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2 px-3">Business</h3>
                <ul class="space-y-1">
                    <li>
                        <a href="{{ route('admin.analytics') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.analytics') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                            <i data-lucide="bar-chart-2" class="w-5 h-5 {{ request()->routeIs('admin.analytics') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Analytics</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.subscription-tiers.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.subscription-tiers.*') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                            <i data-lucide="layers" class="w-5 h-5 {{ request()->routeIs('admin.subscription-tiers.*') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Subscription Tiers</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.billing') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.billing') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                            <i data-lucide="credit-card" class="w-5 h-5 {{ request()->routeIs('admin.billing') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Subscription & Billing</span>
                        </a>
                    </li>
                </ul>

                <h3 class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2 px-3">System</h3>
                <ul class="space-y-1">
                    <li>
                        <a href="{{ route('admin.reports') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.reports') || request()->routeIs('admin.blocks') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                            <i data-lucide="shield-alert" class="w-5 h-5 {{ request()->routeIs('admin.reports') || request()->routeIs('admin.blocks') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Reports</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.audit-logs') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.audit-logs') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                            <i data-lucide="book-lock" class="w-5 h-5 {{ request()->routeIs('admin.audit-logs') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Audit Logs</span>
                        </a>
                    </li>
                </ul>

                <h3 class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2 px-3">Personal</h3>
                <ul class="space-y-1">
                    <li>
                        <a href="{{ route('admin.profile') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.profile') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                            <i data-lucide="user-circle" class="w-5 h-5 {{ request()->routeIs('admin.profile') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Profile Settings</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.notifications') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.notifications') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                            <i data-lucide="bell" class="w-5 h-5 {{ request()->routeIs('admin.notifications') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Notifications</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.settings') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.settings') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                            <i data-lucide="settings" class="w-5 h-5 {{ request()->routeIs('admin.settings') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Settings</span>
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>
    </div>

    <!-- Generic Document Viewer Modal -->
    <div id="globalDocumentModal" class="hidden fixed inset-0 z-[100] bg-black bg-opacity-75 flex items-center justify-center p-4">
        <div class="relative w-full max-w-5xl h-[85vh] bg-white rounded-lg shadow-2xl flex flex-col">
            <div class="flex justify-between items-center px-4 py-3 border-b bg-gray-50 rounded-t-lg">
                <h3 class="font-semibold text-gray-800" id="globalDocumentTitle">Document Viewer</h3>
                <button onclick="closeGlobalDocumentModal()" class="text-gray-500 hover:text-gray-700 focus:outline-none">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>
            <div id="globalDocumentContent" class="flex-1 bg-gray-100 p-1 overflow-hidden relative">
                <!-- Content injected via JS -->
            </div>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/viewerjs/1.11.6/viewer.min.js"></script>
    <script>
        lucide.createIcons();

        function toggleSidebarGroup(groupId) {
            const group = document.getElementById(groupId);
            const chevron = document.getElementById(groupId + '-chevron');
            if (group) {
                group.classList.toggle('hidden');
                if (chevron) {
                    chevron.classList.toggle('rotate-180');
                }
                lucide.createIcons();
            }
        }

        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const closeMenuBtn = document.getElementById('close-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');

        if (mobileMenuBtn && mobileMenu && closeMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.remove('hidden');
                lucide.createIcons();
            });

            closeMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        }

        // Initialize Viewer.js
        document.addEventListener('DOMContentLoaded', function() {
            const galleries = document.querySelectorAll('.image-gallery');
            galleries.forEach(gallery => {
                new Viewer(gallery, {
                    url: 'data-src', // Use data-src if available, otherwise src
                    toolbar: {
                        zoomIn: 1,
                        zoomOut: 1,
                        oneToOne: 1,
                        reset: 1,
                        prev: 1,
                        play: {
                            show: 1,
                            size: 'large',
                        },
                        next: 1,
                        rotateLeft: 1,
                        rotateRight: 1,
                        flipHorizontal: 1,
                        flipVertical: 1,
                    },
                });
            });
        });

        function viewDocument(url, title = 'Document Preview') {
            if (!url || url === '#') return;

            const ext = url.split('.').pop().toLowerCase().split('?')[0];
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
            const isPdf = ext === 'pdf';

            if (isImage) {
                const img = document.createElement('img');
                img.src = url;
                img.alt = title;
                const viewer = new Viewer(img, {
                    hidden: function() {
                        viewer.destroy();
                    },
                    title: title,
                    toolbar: {
                        zoomIn: 1,
                        zoomOut: 1,
                        oneToOne: 1,
                        reset: 1,
                        prev: 0,
                        play: 0,
                        next: 0,
                        rotateLeft: 1,
                        rotateRight: 1,
                        flipHorizontal: 1,
                        flipVertical: 1,
                    },
                });
                viewer.show();
            } else if (isPdf) {
                const modal = document.getElementById('globalDocumentModal');
                const content = document.getElementById('globalDocumentContent');
                const titleEl = document.getElementById('globalDocumentTitle');
                
                titleEl.textContent = title;
                content.innerHTML = `<iframe src="${url}" class="w-full h-full border-0 rounded bg-white"></iframe>`;
                
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            } else {
                window.open(url, '_blank');
            }
        }

        function closeGlobalDocumentModal() {
            const modal = document.getElementById('globalDocumentModal');
            if (modal) {
                modal.classList.add('hidden');
                document.body.style.overflow = 'auto';
                document.getElementById('globalDocumentContent').innerHTML = '';
            }
        }

        // Close on click outside
        document.getElementById('globalDocumentModal')?.addEventListener('click', function(e) {
            if (e.target === this) {
                closeGlobalDocumentModal();
            }
        });
    </script>
    @stack('scripts')
</body>

</html>