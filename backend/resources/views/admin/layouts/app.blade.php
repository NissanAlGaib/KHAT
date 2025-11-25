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

    <style>
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
    </style>
    @stack('styles')
</head>

<body class="bg-gray-50 font-sans">

    <!-- Sidebar (Desktop) -->
    <aside id="sidebar" class="hidden lg:flex w-64 h-screen bg-white shadow-sm flex-col fixed top-0 left-0 z-20">
        <div class="p-6 flex items-center justify-center border-b border-gray-100">
            <h1 class="text-xl font-semibold text-orange-500">KHAT Admin</h1>
        </div>

        <nav class="flex-grow p-4 overflow-y-auto">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Working space</h3>
            <ul class="space-y-1">
                <li>
                    <a href="{{ route('admin.dashboard') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.dashboard') ? 'bg-[#FDF4F2] text-[#E75234] font-bold' : 'text-gray-600 hover:bg-gray-100 font-medium' }}">
                        <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
                        <span>Dashboard</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.users.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.users.*') ? 'bg-[#FDF4F2] text-[#E75234] font-bold' : 'text-gray-600 hover:bg-gray-100 font-medium' }}">
                        <i data-lucide="users" class="w-5 h-5"></i>
                        <span>User Management</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.pets.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.pets.*') ? 'bg-[#FDF4F2] text-[#E75234] font-bold' : 'text-gray-600 hover:bg-gray-100 font-medium' }}">
                        <i data-lucide="paw-print" class="w-5 h-5"></i>
                        <span>Pet Management</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.matches') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.matches') ? 'bg-[#FDF4F2] text-[#E75234] font-bold' : 'text-gray-600 hover:bg-gray-100 font-medium' }}">
                        <i data-lucide="history" class="w-5 h-5"></i>
                        <span>Match History</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.analytics') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.analytics') ? 'bg-[#FDF4F2] text-[#E75234] font-bold' : 'text-gray-600 hover:bg-gray-100 font-medium' }}">
                        <i data-lucide="bar-chart-2" class="w-5 h-5"></i>
                        <span>Analytics</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.billing') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.billing') ? 'bg-[#FDF4F2] text-[#E75234] font-bold' : 'text-gray-600 hover:bg-gray-100 font-medium' }}">
                        <i data-lucide="file-text" class="w-5 h-5"></i>
                        <span>Subscription and Billing</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.tickets') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.tickets') ? 'bg-[#FDF4F2] text-[#E75234] font-bold' : 'text-gray-600 hover:bg-gray-100 font-medium' }}">
                        <i data-lucide="ticket" class="w-5 h-5"></i>
                        <span>Tickets</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.audit-logs') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.audit-logs') ? 'bg-[#FDF4F2] text-[#E75234] font-bold' : 'text-gray-600 hover:bg-gray-100 font-medium' }}">
                        <i data-lucide="book-lock" class="w-5 h-5"></i>
                        <span>Audit Logs</span>
                    </a>
                </li>
            </ul>

            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2">Personal</h3>
            <ul class="space-y-1">
                <li>
                    <a href="{{ route('admin.profile') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.profile') ? 'bg-[#FDF4F2] text-[#E75234] font-bold' : 'text-gray-600 hover:bg-gray-100 font-medium' }}">
                        <i data-lucide="user-circle" class="w-5 h-5"></i>
                        <span>Profile Settings</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.notifications') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.notifications') ? 'bg-[#FDF4F2] text-[#E75234] font-bold' : 'text-gray-600 hover:bg-gray-100 font-medium' }}">
                        <i data-lucide="bell" class="w-5 h-5"></i>
                        <span>Notifications</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.settings') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.settings') ? 'bg-[#FDF4F2] text-[#E75234] font-bold' : 'text-gray-600 hover:bg-gray-100 font-medium' }}">
                        <i data-lucide="settings" class="w-5 h-5"></i>
                        <span>Settings</span>
                    </a>
                </li>
            </ul>
        </nav>

        <!-- User Profile -->
        <div class="p-4 border-t border-gray-100">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-[#F6CFBF] flex items-center justify-center text-[#E75234] font-bold">
                    {{ strtoupper(substr(Auth::user()->name ?? Auth::user()->email, 0, 2)) }}
                </div>
                <div>
                    <p class="text-sm font-semibold text-gray-800">{{ Auth::user()->name ?? 'Admin' }}</p>
                    <p class="text-xs text-gray-500">{{ Auth::user()->email }}</p>
                </div>
            </div>
        </div>
    </aside>

    <div class="lg:ml-64">
        <header class="flex justify-between items-center sticky top-0 z-10 bg-white shadow-md border-b border-gray-200 px-6 lg:px-8 py-4">
            <button id="mobile-menu-btn" class="lg:hidden text-gray-600">
                <i data-lucide="menu" class="w-6 h-6"></i>
            </button>

            <div class="hidden lg:block"></div>

            <div class="flex items-center gap-4">
                <div class="relative hidden sm:block">
                    <i data-lucide="search" class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
                    <input type="search" placeholder="Search..." class="pl-10 pr-4 py-2.5 w-full max-w-xs md:max-w-sm lg:w-72 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
                </div>

                <button class="text-gray-500 hover:text-gray-700">
                    <i data-lucide="bell" class="w-6 h-6"></i>
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

        <main class="p-6 lg:p-10">
            @yield('content')
        </main>
    </div>

    <!-- Mobile Menu Overlay -->
    <div id="mobile-menu" class="hidden fixed inset-0 z-30 bg-white lg:hidden">
        <aside class="w-64 h-screen bg-white shadow-sm flex flex-col">
            <div class="p-6 flex items-center justify-between border-b border-gray-100">
                <h1 class="text-xl font-semibold text-orange-500">KHAT Admin</h1>
                <button id="close-menu-btn" class="text-gray-600">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>

            <nav class="flex-grow p-4 overflow-y-auto">
                <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Working space</h3>
                <ul class="space-y-1">
                    <li>
                        <a href="{{ route('admin.dashboard') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.dashboard') ? 'bg-[#FDF4F2] text-[#E75234] font-bold' : 'text-gray-600 hover:bg-gray-100 font-medium' }}">
                            <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
                            <span>Dashboard</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.users.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.users.*') ? 'bg-[#FDF4F2] text-[#E75234] font-bold' : 'text-gray-600 hover:bg-gray-100 font-medium' }}">
                            <i data-lucide="users" class="w-5 h-5"></i>
                            <span>User Management</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.pets.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.pets.*') ? 'bg-[#FDF4F2] text-[#E75234] font-bold' : 'text-gray-600 hover:bg-gray-100 font-medium' }}">
                            <i data-lucide="paw-print" class="w-5 h-5"></i>
                            <span>Pet Management</span>
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>
    </div>

    <script>
        lucide.createIcons();

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
    </script>
    @stack('scripts')
</body>

</html>