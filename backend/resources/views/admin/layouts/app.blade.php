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
        body {
            font-family: 'Inter', sans-serif;
        }

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
            from {
                opacity: 0;
            }

            to {
                opacity: 1;
            }
        }

        .animate-fade-in-up {
            animation: fadeInUp 0.3s ease-out;
        }

        /* ═══ Collapsible Icon-Rail Sidebar ═══ */
        #sidebar {
            width: 4.5rem;
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        #sidebar.sidebar-expanded {
            width: 16rem;
        }

        #sidebar.sidebar-expanded:not(.sidebar-pinned) {
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.18);
        }

        #sidebar .sidebar-label {
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.12s ease, visibility 0.12s ease;
            white-space: nowrap;
            overflow: hidden;
        }

        #sidebar.sidebar-expanded .sidebar-label {
            opacity: 1;
            visibility: visible;
            transition: opacity 0.22s ease 0.08s, visibility 0.22s ease 0.08s;
        }

        .sidebar-section-text {
            opacity: 0;
            max-height: 0;
            overflow: hidden;
            margin: 0 !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            transition: opacity 0.15s ease, max-height 0.2s ease, margin 0.2s ease;
        }

        #sidebar.sidebar-expanded .sidebar-section-text {
            opacity: 1;
            max-height: 2rem;
            margin-top: 1rem !important;
            margin-bottom: 0.25rem !important;
        }

        .sidebar-section-line {
            height: 1px;
            margin: 0.5rem 0.75rem;
            background: rgba(255, 255, 255, 0.06);
            transition: opacity 0.2s ease, height 0.2s ease, margin 0.2s ease;
        }

        #sidebar.sidebar-expanded .sidebar-section-line {
            opacity: 0;
            height: 0;
            margin: 0;
        }

        .sidebar-sub-items {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        #sidebar.sidebar-expanded .sidebar-sub-items.sub-open {
            max-height: 500px;
        }

        @media (min-width: 1024px) {
            #main-content {
                margin-left: 4.5rem;
                transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            #main-content.content-expanded {
                margin-left: 16rem;
            }
        }

        /* Sidebar tooltip for collapsed state */
        .sidebar-tooltip {
            position: fixed;
            left: 5rem;
            background: #1f2937;
            color: #fff;
            padding: 0.375rem 0.75rem;
            border-radius: 0.5rem;
            font-size: 0.75rem;
            font-weight: 500;
            white-space: nowrap;
            z-index: 100;
            pointer-events: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            opacity: 0;
            transition: opacity 0.15s ease;
        }

        .sidebar-tooltip.show {
            opacity: 1;
        }
    </style>
    @stack('styles')
</head>

<body class="bg-gray-50 font-sans">

    <!-- Sidebar (Desktop) — Collapsible Icon Rail -->
    <aside id="sidebar" class="hidden lg:flex h-screen bg-gray-900 shadow-xl flex-col fixed top-0 left-0 z-20 overflow-hidden"
        onmouseenter="sidebarMouseEnter()" onmouseleave="sidebarMouseLeave()">

        @php
        $petGroupActive = request()->routeIs('admin.pets.*') || request()->routeIs('admin.vaccine-protocols.*') || request()->routeIs('admin.vaccination-shots.*') || request()->routeIs('admin.protocol-categories.*');
        $businessGroupActive = request()->routeIs('admin.analytics') || request()->routeIs('admin.billing') || request()->routeIs('admin.subscription-tiers.*');
        $poolGroupActive = request()->routeIs('admin.pool.*');
        $systemGroupActive = request()->routeIs('admin.reports') || request()->routeIs('admin.blocks') || request()->routeIs('admin.audit-logs') || request()->routeIs('admin.testing-tools');
        @endphp

        <!-- Logo Header -->
        <div class="h-14 flex items-center bg-gradient-to-r from-[#E75234] to-[#d14024] flex-shrink-0">
            <div class="w-[72px] flex items-center justify-center flex-shrink-0">
                <svg class="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z" opacity="0" /><text x="5" y="18" font-size="16" font-weight="800" fill="white" font-family="Inter,sans-serif">K</text>
                </svg>
            </div>
            <div class="sidebar-label flex items-center gap-2 pr-3 flex-1 min-w-0">
                <h1 class="text-lg font-bold text-white truncate">KHAT Admin</h1>
                <button onclick="toggleSidebarPin(event)" id="sidebar-pin-btn" class="ml-auto w-7 h-7 rounded-md flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors flex-shrink-0" title="Pin sidebar">
                    <i data-lucide="pin" class="w-3.5 h-3.5" id="pin-icon"></i>
                </button>
            </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-grow overflow-y-auto overflow-x-hidden py-2">

            {{-- ── Overview ── --}}
            <div class="sidebar-section-text text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-5">Overview</div>
            <div class="sidebar-section-line"></div>

            <a href="{{ route('admin.dashboard') }}" class="flex items-center gap-3 h-10 mx-2 px-3 rounded-lg transition-colors {{ request()->routeIs('admin.dashboard') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/5' }}" title="Dashboard">
                <i data-lucide="layout-dashboard" class="w-5 h-5 flex-shrink-0 {{ request()->routeIs('admin.dashboard') ? 'text-white' : 'text-gray-500' }}"></i>
                <span class="sidebar-label text-sm">Dashboard</span>
            </a>

            {{-- ── Management ── --}}
            <div class="sidebar-section-text text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-5">Management</div>
            <div class="sidebar-section-line"></div>

            <a href="{{ route('admin.users.index') }}" class="flex items-center gap-3 h-10 mx-2 px-3 rounded-lg transition-colors {{ request()->routeIs('admin.users.*') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/5' }}" title="User Management">
                <i data-lucide="users" class="w-5 h-5 flex-shrink-0 {{ request()->routeIs('admin.users.*') ? 'text-white' : 'text-gray-500' }}"></i>
                <span class="sidebar-label text-sm">User Management</span>
            </a>

            <a href="{{ route('admin.admins.index') }}" class="flex items-center gap-3 h-10 mx-2 px-3 rounded-lg transition-colors {{ request()->routeIs('admin.admins.*') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/5' }}" title="Admin Management">
                <i data-lucide="shield-check" class="w-5 h-5 flex-shrink-0 {{ request()->routeIs('admin.admins.*') ? 'text-white' : 'text-gray-500' }}"></i>
                <span class="sidebar-label text-sm">Admin Management</span>
            </a>

            <a href="{{ route('admin.reviews.index') }}" class="flex items-center gap-3 h-10 mx-2 px-3 rounded-lg transition-colors {{ request()->routeIs('admin.reviews.*') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/5' }}" title="Reviews">
                <i data-lucide="star" class="w-5 h-5 flex-shrink-0 {{ request()->routeIs('admin.reviews.*') ? 'text-white' : 'text-gray-500' }}"></i>
                <span class="sidebar-label text-sm">Reviews</span>
            </a>

            {{-- Pet Management collapsible group --}}
            <div class="mx-2">
                <button onclick="toggleSidebarGroup('pet-group')" class="flex items-center gap-3 h-10 w-full px-3 rounded-lg transition-colors {{ $petGroupActive ? 'bg-white/10 text-white font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/5' }}" title="Pet Management">
                    <i data-lucide="paw-print" class="w-5 h-5 flex-shrink-0 {{ $petGroupActive ? 'text-white' : 'text-gray-500' }}"></i>
                    <span class="sidebar-label text-sm flex-1 text-left">Pet Management</span>
                    <span class="sidebar-label"><i data-lucide="chevron-down" class="w-3.5 h-3.5 transition-transform duration-200 {{ $petGroupActive ? 'rotate-180' : '' }}" id="pet-group-chevron"></i></span>
                </button>
                <div id="pet-group" class="sidebar-sub-items {{ $petGroupActive ? 'sub-open' : '' }}">
                    <div class="ml-4 mt-0.5 space-y-0.5 border-l border-gray-700 pl-3 py-1">
                        <a href="{{ route('admin.pets.index') }}" class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors {{ request()->routeIs('admin.pets.*') ? 'text-white font-semibold bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5' }}">
                            <i data-lucide="list" class="w-3.5 h-3.5 flex-shrink-0 {{ request()->routeIs('admin.pets.*') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>All Pets</span>
                        </a>
                        <a href="{{ route('admin.vaccine-protocols.index') }}" class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors {{ request()->routeIs('admin.vaccine-protocols.*') ? 'text-white font-semibold bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5' }}">
                            <i data-lucide="syringe" class="w-3.5 h-3.5 flex-shrink-0 {{ request()->routeIs('admin.vaccine-protocols.*') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Vaccine Protocols</span>
                        </a>
                        <a href="{{ route('admin.protocol-categories.index') }}" class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors {{ request()->routeIs('admin.protocol-categories.*') ? 'text-white font-semibold bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5' }}">
                            <i data-lucide="folder-open" class="w-3.5 h-3.5 flex-shrink-0 {{ request()->routeIs('admin.protocol-categories.*') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Protocol Categories</span>
                        </a>
                        <a href="{{ route('admin.vaccination-shots.pending') }}" class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors {{ request()->routeIs('admin.vaccination-shots.*') ? 'text-white font-semibold bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5' }}">
                            <i data-lucide="clipboard-check" class="w-3.5 h-3.5 flex-shrink-0 {{ request()->routeIs('admin.vaccination-shots.*') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Shot Verification</span>
                        </a>
                    </div>
                </div>
            </div>

            <a href="{{ route('admin.matches') }}" class="flex items-center gap-3 h-10 mx-2 px-3 rounded-lg transition-colors {{ request()->routeIs('admin.matches') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/5' }}" title="Match History">
                <i data-lucide="heart-handshake" class="w-5 h-5 flex-shrink-0 {{ request()->routeIs('admin.matches') ? 'text-white' : 'text-gray-500' }}"></i>
                <span class="sidebar-label text-sm">Match History</span>
            </a>

            {{-- ── Business ── --}}
            <div class="sidebar-section-text text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-5">Business</div>
            <div class="sidebar-section-line"></div>

            <a href="{{ route('admin.analytics') }}" class="flex items-center gap-3 h-10 mx-2 px-3 rounded-lg transition-colors {{ request()->routeIs('admin.analytics') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/5' }}" title="Analytics">
                <i data-lucide="bar-chart-2" class="w-5 h-5 flex-shrink-0 {{ request()->routeIs('admin.analytics') ? 'text-white' : 'text-gray-500' }}"></i>
                <span class="sidebar-label text-sm">Analytics</span>
            </a>

            <a href="{{ route('admin.subscription-tiers.index') }}" class="flex items-center gap-3 h-10 mx-2 px-3 rounded-lg transition-colors {{ request()->routeIs('admin.subscription-tiers.*') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/5' }}" title="Subscription Tiers">
                <i data-lucide="layers" class="w-5 h-5 flex-shrink-0 {{ request()->routeIs('admin.subscription-tiers.*') ? 'text-white' : 'text-gray-500' }}"></i>
                <span class="sidebar-label text-sm">Subscription Tiers</span>
            </a>

            <a href="{{ route('admin.billing') }}" class="flex items-center gap-3 h-10 mx-2 px-3 rounded-lg transition-colors {{ request()->routeIs('admin.billing') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/5' }}" title="Billing">
                <i data-lucide="credit-card" class="w-5 h-5 flex-shrink-0 {{ request()->routeIs('admin.billing') ? 'text-white' : 'text-gray-500' }}"></i>
                <span class="sidebar-label text-sm">Billing</span>
            </a>

            {{-- Money Pool collapsible group --}}
            <div class="mx-2">
                <button onclick="toggleSidebarGroup('pool-group')" class="flex items-center gap-3 h-10 w-full px-3 rounded-lg transition-colors {{ $poolGroupActive ? 'bg-white/10 text-white font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/5' }}" title="Money Pool">
                    <i data-lucide="landmark" class="w-5 h-5 flex-shrink-0 {{ $poolGroupActive ? 'text-white' : 'text-gray-500' }}"></i>
                    <span class="sidebar-label text-sm flex-1 text-left">Money Pool</span>
                    <span class="sidebar-label"><i data-lucide="chevron-down" class="w-3.5 h-3.5 transition-transform duration-200 {{ $poolGroupActive ? 'rotate-180' : '' }}" id="pool-group-chevron"></i></span>
                </button>
                <div id="pool-group" class="sidebar-sub-items {{ $poolGroupActive ? 'sub-open' : '' }}">
                    <div class="ml-4 mt-0.5 space-y-0.5 border-l border-gray-700 pl-3 py-1">
                        <a href="{{ route('admin.pool.dashboard') }}" class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors {{ request()->routeIs('admin.pool.dashboard') ? 'text-white font-semibold bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5' }}">
                            <i data-lucide="gauge" class="w-3.5 h-3.5 flex-shrink-0 {{ request()->routeIs('admin.pool.dashboard') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Dashboard</span>
                        </a>
                        <a href="{{ route('admin.pool.transactions') }}" class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors {{ request()->routeIs('admin.pool.transactions') ? 'text-white font-semibold bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5' }}">
                            <i data-lucide="list" class="w-3.5 h-3.5 flex-shrink-0 {{ request()->routeIs('admin.pool.transactions') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Transactions</span>
                        </a>
                        <a href="{{ route('admin.pool.disputes') }}" class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors {{ request()->routeIs('admin.pool.disputes*') ? 'text-white font-semibold bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5' }}">
                            <i data-lucide="alert-triangle" class="w-3.5 h-3.5 flex-shrink-0 {{ request()->routeIs('admin.pool.disputes*') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Disputes</span>
                        </a>
                    </div>
                </div>
            </div>

            {{-- ── System ── --}}
            <div class="sidebar-section-text text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-5">System</div>
            <div class="sidebar-section-line"></div>

            <a href="{{ route('admin.reports') }}" class="flex items-center gap-3 h-10 mx-2 px-3 rounded-lg transition-colors {{ request()->routeIs('admin.reports') || request()->routeIs('admin.blocks') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/5' }}" title="Reports">
                <i data-lucide="shield-alert" class="w-5 h-5 flex-shrink-0 {{ request()->routeIs('admin.reports') || request()->routeIs('admin.blocks') ? 'text-white' : 'text-gray-500' }}"></i>
                <span class="sidebar-label text-sm">Reports</span>
            </a>

            <a href="{{ route('admin.audit-logs') }}" class="flex items-center gap-3 h-10 mx-2 px-3 rounded-lg transition-colors {{ request()->routeIs('admin.audit-logs') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/5' }}" title="Audit Logs">
                <i data-lucide="book-lock" class="w-5 h-5 flex-shrink-0 {{ request()->routeIs('admin.audit-logs') ? 'text-white' : 'text-gray-500' }}"></i>
                <span class="sidebar-label text-sm">Audit Logs</span>
            </a>

            <a href="{{ route('admin.testing-tools') }}" class="flex items-center gap-3 h-10 mx-2 px-3 rounded-lg transition-colors {{ request()->routeIs('admin.testing-tools') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/5' }}" title="Testing Tools">
                <i data-lucide="flask-conical" class="w-5 h-5 flex-shrink-0 {{ request()->routeIs('admin.testing-tools') ? 'text-white' : 'text-gray-500' }}"></i>
                <span class="sidebar-label text-sm">Testing Tools</span>
            </a>

            {{-- ── Personal ── --}}
            <div class="sidebar-section-text text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-5">Personal</div>
            <div class="sidebar-section-line"></div>

            <a href="{{ route('admin.profile') }}" class="flex items-center gap-3 h-10 mx-2 px-3 rounded-lg transition-colors {{ request()->routeIs('admin.profile') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/5' }}" title="Profile">
                <i data-lucide="user-circle" class="w-5 h-5 flex-shrink-0 {{ request()->routeIs('admin.profile') ? 'text-white' : 'text-gray-500' }}"></i>
                <span class="sidebar-label text-sm">Profile</span>
            </a>

            <a href="{{ route('admin.notifications') }}" class="flex items-center gap-3 h-10 mx-2 px-3 rounded-lg transition-colors {{ request()->routeIs('admin.notifications') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/5' }}" title="Notifications">
                <i data-lucide="bell" class="w-5 h-5 flex-shrink-0 {{ request()->routeIs('admin.notifications') ? 'text-white' : 'text-gray-500' }}"></i>
                <span class="sidebar-label text-sm">Notifications</span>
            </a>

            <a href="{{ route('admin.settings') }}" class="flex items-center gap-3 h-10 mx-2 px-3 rounded-lg transition-colors {{ request()->routeIs('admin.settings') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/5' }}" title="Settings">
                <i data-lucide="settings" class="w-5 h-5 flex-shrink-0 {{ request()->routeIs('admin.settings') ? 'text-white' : 'text-gray-500' }}"></i>
                <span class="sidebar-label text-sm">Settings</span>
            </a>
        </nav>

        <!-- User Profile Footer -->
        <div class="flex-shrink-0 border-t border-gray-800 bg-gray-900/80">
            <div class="flex items-center h-14">
                <div class="w-[72px] flex items-center justify-center flex-shrink-0">
                    <div class="w-9 h-9 rounded-full bg-[#F6CFBF] flex items-center justify-center text-[#E75234] font-bold text-sm">
                        {{ strtoupper(substr(Auth::user()->name ?? Auth::user()->email, 0, 2)) }}
                    </div>
                </div>
                <div class="sidebar-label min-w-0 pr-3">
                    <p class="text-sm font-semibold text-gray-200 truncate">{{ Auth::user()->name ?? 'Admin' }}</p>
                    <p class="text-xs text-gray-500 truncate">{{ Auth::user()->email }}</p>
                </div>
            </div>
        </div>
    </aside>

    <!-- Sidebar tooltip element -->
    <div id="sidebar-tooltip" class="sidebar-tooltip"></div>

    <div id="main-content">
        <header class="flex justify-between items-center sticky top-0 z-10 bg-white shadow-sm border-b border-gray-100 px-6 lg:px-8 py-4">
            <button id="mobile-menu-btn" class="lg:hidden text-gray-600">
                <i data-lucide="menu" class="w-6 h-6"></i>
            </button>

            <button onclick="toggleSidebarPin()" class="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Toggle sidebar">
                <i data-lucide="panel-left" class="w-5 h-5"></i>
            </button>

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
                    <li>
                        <a href="{{ route('admin.testing-tools') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.testing-tools') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                            <i data-lucide="flask-conical" class="w-5 h-5 {{ request()->routeIs('admin.testing-tools') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Testing Tools</span>
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

        // ═══════════════ PawFilter: Unified Filter Bar System ═══════════════
        const PawFilter = {
            toggle() {
                const panel = document.getElementById('filterPanel');
                const btn = document.getElementById('filterToggleBtn');
                if (!panel) return;

                const isCollapsed = panel.style.maxHeight === '0px' || panel.style.opacity === '0';

                if (isCollapsed) {
                    // Expand
                    panel.style.maxHeight = panel.scrollHeight + 'px';
                    panel.style.opacity = '1';
                    setTimeout(() => {
                        panel.style.maxHeight = 'none';
                    }, 300);
                    btn?.classList.add('bg-[#FFF5F2]', 'border-[#E75234]/20', 'text-[#E75234]');
                    btn?.classList.remove('bg-gray-50', 'border-gray-200', 'text-gray-600');
                } else {
                    // Collapse
                    panel.style.maxHeight = panel.scrollHeight + 'px';
                    requestAnimationFrame(() => {
                        panel.style.maxHeight = '0px';
                        panel.style.opacity = '0';
                    });
                    btn?.classList.remove('bg-[#FFF5F2]', 'border-[#E75234]/20', 'text-[#E75234]');
                    btn?.classList.add('bg-gray-50', 'border-gray-200', 'text-gray-600');
                }
            },

            setDatePreset(preset) {
                const startInput = document.getElementById('filterStartDate');
                const endInput = document.getElementById('filterEndDate');
                if (!startInput || !endInput) return;

                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];

                if (preset === 'today') {
                    startInput.value = todayStr;
                    endInput.value = todayStr;
                } else if (preset === 'all') {
                    startInput.value = '';
                    endInput.value = '';
                } else {
                    const days = parseInt(preset);
                    const start = new Date(now);
                    start.setDate(start.getDate() - days);
                    startInput.value = start.toISOString().split('T')[0];
                    endInput.value = todayStr;
                }

                // Update preset button states
                document.querySelectorAll('.paw-date-preset').forEach(btn => {
                    const btnPreset = btn.getAttribute('data-preset');
                    if (btnPreset === preset) {
                        btn.classList.add('bg-[#E75234]', 'text-white', 'border-[#E75234]', 'shadow-sm');
                        btn.classList.remove('bg-white', 'text-gray-500', 'border-gray-200');
                    } else {
                        btn.classList.remove('bg-[#E75234]', 'text-white', 'border-[#E75234]', 'shadow-sm');
                        btn.classList.add('bg-white', 'text-gray-500', 'border-gray-200');
                    }
                });
            },

            clearPresets() {
                document.querySelectorAll('.paw-date-preset').forEach(btn => {
                    btn.classList.remove('bg-[#E75234]', 'text-white', 'border-[#E75234]', 'shadow-sm');
                    btn.classList.add('bg-white', 'text-gray-500', 'border-gray-200');
                });
            },

            loadBreeds(species) {
                const breedInput = document.querySelector('input[name="breed"]');
                if (!breedInput) return;

                // Remove existing datalist if any
                let datalist = document.getElementById('breedSuggestions');
                if (!datalist) {
                    datalist = document.createElement('datalist');
                    datalist.id = 'breedSuggestions';
                    breedInput.parentNode.appendChild(datalist);
                    breedInput.setAttribute('list', 'breedSuggestions');
                }

                datalist.innerHTML = '';

                if (!species) return;

                fetch(`{{ route('admin.pets.breeds') }}?species=${encodeURIComponent(species)}`)
                    .then(res => res.json())
                    .then(breeds => {
                        breeds.forEach(breed => {
                            const option = document.createElement('option');
                            option.value = breed;
                            datalist.appendChild(option);
                        });
                    })
                    .catch(err => console.error('Failed to load breeds:', err));
            }
        };

        // ═══════════════ SweetAlert Confirm Helper ═══════════════
        /**
         * Auto-intercept forms/buttons with data-confirm="message" attribute.
         * Also provides PawConfirm(options) for programmatic use.
         *
         * Usage on forms:    <form data-confirm="Are you sure?" data-confirm-title="Delete?" data-confirm-icon="warning" data-confirm-btn="Yes, delete">
         * Usage on buttons:  <button data-confirm="Are you sure?" data-confirm-action="submitMyForm()">
         */
        function PawConfirm({
            title,
            text,
            icon,
            confirmText,
            cancelText
        }) {
            return Swal.fire({
                title: title || 'Are you sure?',
                text: text || '',
                icon: icon || 'warning',
                showCancelButton: true,
                confirmButtonColor: '#E75234',
                cancelButtonColor: '#6b7280',
                confirmButtonText: confirmText || 'Yes, proceed',
                cancelButtonText: cancelText || 'Cancel',
                customClass: {
                    popup: 'rounded-xl',
                    confirmButton: 'rounded-lg',
                    cancelButton: 'rounded-lg',
                }
            });
        }

        // Auto-attach to all forms with data-confirm
        document.addEventListener('submit', function(e) {
            const form = e.target;
            const msg = form.getAttribute('data-confirm');
            if (!msg) return;

            // Prevent if not already confirmed
            if (form.dataset.confirmed === 'true') {
                form.dataset.confirmed = '';
                return; // allow submission
            }

            e.preventDefault();

            PawConfirm({
                title: form.getAttribute('data-confirm-title') || 'Confirm Action',
                text: msg,
                icon: form.getAttribute('data-confirm-icon') || 'warning',
                confirmText: form.getAttribute('data-confirm-btn') || 'Yes, proceed',
            }).then((result) => {
                if (result.isConfirmed) {
                    form.dataset.confirmed = 'true';
                    form.submit();
                }
            });
        });

        // Show SweetAlert error toast (replaces alert() calls)
        function PawAlert(message, icon = 'error', title = '') {
            Swal.fire({
                icon: icon,
                title: title || (icon === 'error' ? 'Error' : icon === 'success' ? 'Success' : 'Notice'),
                text: message,
                confirmButtonColor: '#E75234',
                customClass: {
                    popup: 'rounded-xl',
                    confirmButton: 'rounded-lg',
                }
            });
        }

        // ═══════════════ Collapsible Icon-Rail Sidebar ═══════════════
        let sidebarPinned = localStorage.getItem('sidebar-pinned') === 'true';
        let sidebarHoverTimer = null;
        let sidebarLeaveTimer = null;

        function initSidebar() {
            const sb = document.getElementById('sidebar');
            const mc = document.getElementById('main-content');
            if (!sb || !mc) return;

            // Disable transitions for initial paint
            sb.style.transition = 'none';
            mc.style.transition = 'none';

            if (sidebarPinned) {
                sb.classList.add('sidebar-expanded', 'sidebar-pinned');
                mc.classList.add('content-expanded');
                updatePinIcon(true);
            }

            // Re-enable transitions after paint
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    sb.style.transition = '';
                    mc.style.transition = '';
                });
            });

            // Tooltip for collapsed items
            initSidebarTooltips();
        }

        function expandSidebar() {
            const sb = document.getElementById('sidebar');
            if (!sb) return;
            sb.classList.add('sidebar-expanded');
            lucide.createIcons();
        }

        function collapseSidebar() {
            const sb = document.getElementById('sidebar');
            if (!sb || sidebarPinned) return;
            sb.classList.remove('sidebar-expanded');
        }

        function sidebarMouseEnter() {
            clearTimeout(sidebarHoverTimer);
            clearTimeout(sidebarLeaveTimer);
            if (sidebarPinned) return;
            sidebarHoverTimer = setTimeout(() => expandSidebar(), 200);
        }

        function sidebarMouseLeave() {
            clearTimeout(sidebarHoverTimer);
            clearTimeout(sidebarLeaveTimer);
            if (sidebarPinned) return;
            sidebarLeaveTimer = setTimeout(() => collapseSidebar(), 150);
            // Hide tooltip
            const tip = document.getElementById('sidebar-tooltip');
            if (tip) tip.classList.remove('show');
        }

        function toggleSidebarPin(e) {
            if (e) e.stopPropagation();
            sidebarPinned = !sidebarPinned;
            localStorage.setItem('sidebar-pinned', sidebarPinned.toString());

            const sb = document.getElementById('sidebar');
            const mc = document.getElementById('main-content');

            if (sidebarPinned) {
                sb?.classList.add('sidebar-expanded', 'sidebar-pinned');
                mc?.classList.add('content-expanded');
            } else {
                sb?.classList.remove('sidebar-pinned');
                mc?.classList.remove('content-expanded');
                // Collapse if mouse not over sidebar
                if (sb && !sb.matches(':hover')) {
                    sb.classList.remove('sidebar-expanded');
                }
            }
            updatePinIcon(sidebarPinned);
        }

        function updatePinIcon(pinned) {
            const btn = document.getElementById('sidebar-pin-btn');
            if (!btn) return;
            if (pinned) {
                btn.classList.add('bg-white/20', 'text-white');
                btn.classList.remove('text-white/60');
                btn.title = 'Unpin sidebar';
            } else {
                btn.classList.remove('bg-white/20', 'text-white');
                btn.classList.add('text-white/60');
                btn.title = 'Pin sidebar';
            }
        }

        function toggleSidebarGroup(groupId) {
            const group = document.getElementById(groupId);
            const chevron = document.getElementById(groupId + '-chevron');
            if (!group) return;

            // Desktop groups use 'sub-open' class, mobile uses 'hidden'
            if (group.classList.contains('sidebar-sub-items')) {
                group.classList.toggle('sub-open');
            } else {
                group.classList.toggle('hidden');
            }

            if (chevron) chevron.classList.toggle('rotate-180');
            lucide.createIcons();
        }

        function initSidebarTooltips() {
            const sb = document.getElementById('sidebar');
            const tip = document.getElementById('sidebar-tooltip');
            if (!sb || !tip) return;

            const items = sb.querySelectorAll('a[title], button[title]');
            items.forEach(item => {
                item.addEventListener('mouseenter', function() {
                    if (sb.classList.contains('sidebar-expanded')) return;
                    const rect = item.getBoundingClientRect();
                    tip.textContent = item.getAttribute('title');
                    tip.style.top = (rect.top + rect.height / 2 - 12) + 'px';
                    tip.classList.add('show');
                });
                item.addEventListener('mouseleave', function() {
                    tip.classList.remove('show');
                });
            });
        }

        document.addEventListener('DOMContentLoaded', initSidebar);

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
    <!-- Stats Detail Modal -->
    <div id="statsDetailModal" class="hidden fixed inset-0 z-[60] overflow-y-auto bg-gray-900/60 backdrop-blur-sm transition-opacity duration-200">
        <div class="flex items-center justify-center min-h-screen px-4 py-8">
            <div class="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col relative overflow-hidden">
                <!-- Accent bar -->
                <div class="h-1 bg-gradient-to-r from-[#E75234] via-orange-400 to-amber-400 flex-shrink-0"></div>
                <!-- Header -->
                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-lg bg-[#E75234]/10 flex items-center justify-center flex-shrink-0">
                            <svg class="w-5 h-5 text-[#E75234]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h2 id="statsDetailTitle" class="text-lg font-bold text-gray-900">Loading...</h2>
                    </div>
                    <button onclick="closeStatsDetail()" class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500 transition-all duration-150" title="Close">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <!-- Body -->
                <div id="statsDetailBody" class="px-6 py-5 overflow-y-auto flex-1">
                    <div class="flex flex-col items-center justify-center py-12 gap-3">
                        <div class="animate-spin rounded-full h-8 w-8 border-2 border-[#E75234] border-t-transparent"></div>
                        <p class="text-sm text-gray-400">Loading details...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const STATS_DETAIL_URL = "{{ route('admin.stats.detail', ['type' => '__TYPE__']) }}";

        function openStatsDetail(type) {
            const modal = document.getElementById('statsDetailModal');
            const body = document.getElementById('statsDetailBody');
            const title = document.getElementById('statsDetailTitle');

            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            title.textContent = 'Loading...';
            body.innerHTML = '<div class="flex flex-col items-center justify-center py-12 gap-3"><div class="animate-spin rounded-full h-8 w-8 border-2 border-[#E75234] border-t-transparent"></div><p class="text-sm text-gray-400">Loading details...</p></div>';

            // Grab current date filters from URL params
            const urlParams = new URLSearchParams(window.location.search);
            let fetchUrl = STATS_DETAIL_URL.replace('__TYPE__', type);
            const qp = [];
            if (urlParams.get('start_date')) qp.push('start_date=' + urlParams.get('start_date'));
            if (urlParams.get('end_date')) qp.push('end_date=' + urlParams.get('end_date'));
            if (qp.length) fetchUrl += '?' + qp.join('&');

            fetch(fetchUrl, {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                })
                .then(r => {
                    if (!r.ok) throw new Error('Failed to load');
                    return r.json();
                })
                .then(data => renderStatsDetail(data))
                .catch(err => {
                    body.innerHTML = '<div class="text-center py-12"><svg class="w-12 h-12 mx-auto mb-3 text-red-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg><p class="font-medium text-red-500">Failed to load details</p><p class="text-sm text-gray-400 mt-1">' + err.message + '</p></div>';
                });
        }

        function renderStatsDetail(data) {
            const title = document.getElementById('statsDetailTitle');
            const body = document.getElementById('statsDetailBody');
            title.textContent = data.title || 'Details';

            const colorConfig = {
                green: {
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    text: 'text-green-700',
                    badge: 'bg-green-500'
                },
                emerald: {
                    bg: 'bg-emerald-50',
                    border: 'border-emerald-200',
                    text: 'text-emerald-700',
                    badge: 'bg-emerald-500'
                },
                blue: {
                    bg: 'bg-blue-50',
                    border: 'border-blue-200',
                    text: 'text-blue-700',
                    badge: 'bg-blue-500'
                },
                red: {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    text: 'text-red-700',
                    badge: 'bg-red-500'
                },
                yellow: {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    text: 'text-yellow-700',
                    badge: 'bg-yellow-500'
                },
                amber: {
                    bg: 'bg-amber-50',
                    border: 'border-amber-200',
                    text: 'text-amber-700',
                    badge: 'bg-amber-500'
                },
                purple: {
                    bg: 'bg-purple-50',
                    border: 'border-purple-200',
                    text: 'text-purple-700',
                    badge: 'bg-purple-500'
                },
                orange: {
                    bg: 'bg-orange-50',
                    border: 'border-orange-200',
                    text: 'text-orange-700',
                    badge: 'bg-orange-500'
                },
                pink: {
                    bg: 'bg-pink-50',
                    border: 'border-pink-200',
                    text: 'text-pink-700',
                    badge: 'bg-pink-500'
                },
                sky: {
                    bg: 'bg-sky-50',
                    border: 'border-sky-200',
                    text: 'text-sky-700',
                    badge: 'bg-sky-500'
                },
                violet: {
                    bg: 'bg-violet-50',
                    border: 'border-violet-200',
                    text: 'text-violet-700',
                    badge: 'bg-violet-500'
                },
                gray: {
                    bg: 'bg-gray-50',
                    border: 'border-gray-200',
                    text: 'text-gray-700',
                    badge: 'bg-gray-500'
                },
            };

            let html = '';

            // Summary breakdown cards
            if (data.breakdown && data.breakdown.length) {
                const cols = Math.min(data.breakdown.length, 4);
                html += '<div class="mb-6"><p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Summary Breakdown</p>';
                html += '<div class="grid grid-cols-2 sm:grid-cols-' + cols + ' gap-3">';
                data.breakdown.forEach(b => {
                    const c = colorConfig[b.color] || colorConfig.gray;
                    html += '<div class="' + c.bg + ' border ' + c.border + ' rounded-xl p-4">' +
                        '<div class="flex items-center gap-2 mb-1.5">' +
                        '<span class="w-2 h-2 rounded-full ' + c.badge + ' flex-shrink-0"></span>' +
                        '<p class="text-xs font-semibold ' + c.text + ' opacity-80 truncate">' + b.label + '</p>' +
                        '</div>' +
                        '<p class="text-xl font-bold ' + c.text + '">' + b.count + '</p>' +
                        '</div>';
                });
                html += '</div></div>';
            }

            // Records table
            if (data.columns && data.columns.length && data.records && data.records.length) {
                const hasRowColors = data.rowColors && data.rowColors.length;
                const pillColors = {
                    green: 'bg-green-100 text-green-700 ring-green-600/20',
                    emerald: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
                    blue: 'bg-blue-100 text-blue-700 ring-blue-600/20',
                    red: 'bg-red-100 text-red-700 ring-red-600/20',
                    yellow: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
                    amber: 'bg-amber-100 text-amber-700 ring-amber-600/20',
                    purple: 'bg-purple-100 text-purple-700 ring-purple-600/20',
                    orange: 'bg-orange-100 text-orange-700 ring-orange-600/20',
                    pink: 'bg-pink-100 text-pink-700 ring-pink-600/20',
                    sky: 'bg-sky-100 text-sky-700 ring-sky-600/20',
                    violet: 'bg-violet-100 text-violet-700 ring-violet-600/20',
                    gray: 'bg-gray-100 text-gray-700 ring-gray-600/20',
                };
                const rowBgColors = {
                    green: 'bg-green-50/50',
                    emerald: 'bg-emerald-50/50',
                    blue: 'bg-blue-50/50',
                    red: 'bg-red-50/50',
                    yellow: 'bg-yellow-50/40',
                    amber: 'bg-amber-50/50',
                    purple: 'bg-purple-50/50',
                    orange: 'bg-orange-50/50',
                    pink: 'bg-pink-50/50',
                    sky: 'bg-sky-50/50',
                    violet: 'bg-violet-50/50',
                    gray: 'bg-gray-50/50',
                };
                const borderColors = {
                    green: 'border-green-400',
                    emerald: 'border-emerald-400',
                    blue: 'border-blue-400',
                    red: 'border-red-400',
                    yellow: 'border-yellow-400',
                    amber: 'border-amber-400',
                    purple: 'border-purple-400',
                    orange: 'border-orange-400',
                    pink: 'border-pink-400',
                    sky: 'border-sky-400',
                    violet: 'border-violet-400',
                    gray: 'border-gray-400',
                };

                html += '<div class="mb-2"><p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Records</p>';
                html += '<div class="border border-gray-200 rounded-xl overflow-hidden">';
                html += '<table class="w-full text-sm">';
                html += '<thead><tr class="bg-gray-50/80">';
                data.columns.forEach(c => {
                    html += '<th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">' + c + '</th>';
                });
                html += '</tr></thead><tbody>';
                data.records.forEach((row, idx) => {
                    const rColor = hasRowColors ? data.rowColors[idx] : null;
                    let rowClasses = 'transition-colors';
                    if (rColor) {
                        rowClasses += ' border-l-4 ' + (borderColors[rColor] || 'border-gray-400') + ' ' + (rowBgColors[rColor] || 'bg-gray-50/50') + ' hover:brightness-[0.97]';
                    } else {
                        rowClasses += ' ' + (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40') + ' hover:bg-blue-50/40';
                    }
                    html += '<tr class="' + rowClasses + '">';
                    row.forEach((cell, i) => {
                        const isColorCol = (data.colorColumn !== undefined && i === data.colorColumn && rColor);
                        if (isColorCol) {
                            const pill = pillColors[rColor] || pillColors.gray;
                            html += '<td class="px-4 py-3"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ' + pill + '">' + (cell ?? '—') + '</span></td>';
                        } else {
                            const cls = i === 0 ? 'font-semibold text-gray-900' : 'text-gray-600';
                            html += '<td class="px-4 py-3 ' + cls + '">' + (cell ?? '<span class="text-gray-300">—</span>') + '</td>';
                        }
                    });
                    html += '</tr>';
                });
                html += '</tbody></table></div></div>';
            } else if (!data.records || !data.records.length) {
                html += '<div class="text-center py-10 border border-dashed border-gray-200 rounded-xl"><svg class="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M12 13.875V3.375"/></svg><p class="font-medium text-gray-400">No records found</p><p class="text-xs text-gray-300 mt-1">Try adjusting the date range</p></div>';
            }

            body.innerHTML = html;
        }

        function closeStatsDetail() {
            const modal = document.getElementById('statsDetailModal');
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }

        // Close on click outside
        document.getElementById('statsDetailModal')?.addEventListener('click', function(e) {
            if (e.target === this) closeStatsDetail();
        });

        // Close on Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !document.getElementById('statsDetailModal').classList.contains('hidden')) {
                closeStatsDetail();
            }
        });
    </script>

    @stack('scripts')
</body>

</html>