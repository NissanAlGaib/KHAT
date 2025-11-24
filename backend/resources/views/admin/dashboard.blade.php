<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>KHAT Admin Dashboard</title>

    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>

    <style>
        /* Custom scrollbar for webkit browsers */
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
    </style>
</head>

<body class="bg-gray-50 font-sans">

    <!-- Sidebar (Desktop) -->
    <aside id="sidebar" class="hidden lg:flex w-64 h-screen bg-white shadow-sm flex-col fixed top-0 left-0 z-20">
        <div class="p-6 flex items-center justify-center border-b border-gray-100">
            <h1 class="text-xl font-semibold text-orange-500">KHAT Admin</h1>
        </div>

        <!-- Navigation -->
        <nav class="flex-grow p-4 overflow-y-auto">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Working space</h3>
            <ul class="space-y-1">
                <li>
                    <a href="{{ route('admin.dashboard') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#FDF4F2] text-[#E75234] font-bold">
                        <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
                        <span>Dashboard</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.users.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
                        <i data-lucide="users" class="w-5 h-5"></i>
                        <span>User Management</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.pets.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
                        <i data-lucide="paw-print" class="w-5 h-5"></i>
                        <span>Pet Management</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.matches') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
                        <i data-lucide="history" class="w-5 h-5"></i>
                        <span>Match History</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.analytics') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
                        <i data-lucide="bar-chart-2" class="w-5 h-5"></i>
                        <span>Analytics</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.billing') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
                        <i data-lucide="file-text" class="w-5 h-5"></i>
                        <span>Subscription and Billing</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.tickets') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
                        <i data-lucide="ticket" class="w-5 h-5"></i>
                        <span>Tickets</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.audit-logs') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
                        <i data-lucide="book-lock" class="w-5 h-5"></i>
                        <span>Audit Logs</span>
                    </a>
                </li>
            </ul>

            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2">Personal</h3>
            <ul class="space-y-1">
                <li>
                    <a href="{{ route('admin.profile') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
                        <i data-lucide="user-circle" class="w-5 h-5"></i>
                        <span>Profile Settings</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.notifications') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
                        <i data-lucide="bell" class="w-5 h-5"></i>
                        <span>Notifications</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.settings') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
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

            <!-- Left: Mobile Menu Button -->
            <button id="mobile-menu-btn" class="lg:hidden text-gray-600">
                <i data-lucide="menu" class="w-6 h-6"></i>
            </button>

            <!-- Spacer for desktop to push right-group -->
            <div class="hidden lg:block"></div>

            <!-- Right Group: Search + Icons -->
            <div class="flex items-center gap-4">
                <!-- Search Bar -->
                <div class="relative hidden sm:block">
                    <i data-lucide="search" class="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
                    <input type="search" placeholder="Search..." class="pl-10 pr-4 py-2.5 w-full max-w-xs md:max-w-sm lg:w-72 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E75234]">
                </div>

                <!-- Bell Icon -->
                <button class="text-gray-500 hover:text-gray-700">
                    <i data-lucide="bell" class="w-6 h-6"></i>
                </button>

                <!-- User Icon -->
                <div class="w-9 h-9 rounded-full bg-[#F6CFBF] flex items-center justify-center text-[#E75234] font-bold text-sm">
                    {{ strtoupper(substr(Auth::user()->name ?? Auth::user()->email, 0, 2)) }}
                </div>

                <!-- Logout Form -->
                <form action="{{ url('/admin/logout') }}" method="POST" class="inline">
                    @csrf
                    <button type="submit" class="text-sm text-[#E75234] hover:text-[#c03e25] font-semibold">
                        Logout
                    </button>
                </form>
            </div>
        </header>

        <!-- Main Content -->
        <main class="p-6 lg:p-10">

            <!-- Dashboard Overview -->
            <h1 class="text-3xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>

            <!-- Stats Cards (Row 1) -->
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                <!-- Card 1: Total Users -->
                <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-sm font-semibold text-gray-500">Total Users</span>
                        <i data-lucide="users" class="w-5 h-5 text-gray-400"></i>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 mb-1">3,321</p>
                    <span class="text-sm text-green-500 font-medium">+12.5% vs. last month</span>
                </div>
                <!-- Card 2: Verified Breeders -->
                <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-sm font-semibold text-gray-500">Verified Breeders</span>
                        <i data-lucide="check-circle" class="w-5 h-5 text-gray-400"></i>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 mb-1">1,220</p>
                    <span class="text-sm text-green-500 font-medium">+8.2% vs. last month</span>
                </div>
                <!-- Card 3: Verified Shooters -->
                <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-sm font-semibold text-gray-500">Verified Shooters</span>
                        <i data-lucide="shield-check" class="w-5 h-5 text-gray-400"></i>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 mb-1">1,536</p>
                    <span class="text-sm text-red-500 font-medium">-5.0% vs. last week</span>
                </div>
                <!-- Card 4: Active Pets -->
                <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-sm font-semibold text-gray-500">Active Pets</span>
                        <i data-lucide="paw-print" class="w-5 h-5 text-gray-400"></i>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 mb-1">432</p>
                    <span class="text-sm text-red-500 font-medium">-5.0% vs. last week</span>
                </div>
            </div>

            <!-- Stats Cards (Row 2) -->
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <!-- Card 5: Disabled Pets -->
                <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-sm font-semibold text-gray-500">Disabled Pets</span>
                        <i data-lucide="shield-off" class="w-5 h-5 text-gray-400"></i>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 mb-1">35</p>
                    <span class="text-sm text-green-500 font-medium">+20% vs. last week</span>
                </div>
                <!-- Card 6: Cooldown Pets -->
                <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-sm font-semibold text-gray-500">Cooldown Pets</span>
                        <i data-lucide="clock" class="w-5 h-5 text-gray-400"></i>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 mb-1">235</p>
                    <span class="text-sm text-green-500 font-medium">+15.1% vs. last month</span>
                </div>
                <!-- Card 7: Standard Subscribers -->
                <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-sm font-semibold text-gray-500">Standard Subscribers</span>
                        <i data-lucide="user" class="w-5 h-5 text-gray-400"></i>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 mb-1">1,435</p>
                    <span class="text-sm text-green-500 font-medium">+15.1% vs. last month</span>
                </div>
                <!-- Card 8: Premium Subscribers -->
                <div class="bg-white p-5 rounded-xl shadow-sm border border-gray-50">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-sm font-semibold text-gray-500">Premium Subscribers</span>
                        <i data-lucide="crown" class="w-5 h-5 text-gray-400"></i>
                    </div>
                    <p class="text-3xl font-bold text-gray-900 mb-1">1,642</p>
                    <span class="text-sm text-green-500 font-medium">+15.1% vs. last month</span>
                </div>
            </div>

            <!-- Platform Analytics -->
            <h1 class="text-3xl font-bold text-gray-900 mb-6">Platform Analytics</h1>

            <!-- Charts (Grid) -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <!-- Main Chart (Placeholder) -->
                <div class="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-50">
                    <h3 class="font-semibold text-gray-800 mb-4">Monthly New Users</h3>
                    <div class="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span class="text-gray-400">Chart placeholder - Integrate your analytics</span>
                    </div>
                </div>

                <!-- Side Charts (Stacked) -->
                <div class="lg:col-span-1 flex flex-col gap-6">

                    <!-- Bar Chart (Placeholder) -->
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-50">
                        <h3 class="font-semibold text-gray-800 mb-4">Breeding Matches Trend</h3>
                        <div class="h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span class="text-gray-400">Chart placeholder</span>
                        </div>
                    </div>

                    <!-- Doughnut Chart (Placeholder) -->
                    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-50">
                        <h3 class="font-semibold text-gray-800 mb-4">Revenue by Subscription Tier</h3>
                        <div class="h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span class="text-gray-400">Chart placeholder</span>
                        </div>
                    </div>

                </div>
            </div>
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

            <!-- Mobile Navigation -->
            <nav class="flex-grow p-4 overflow-y-auto">
                <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Working space</h3>
                <ul class="space-y-1">
                    <li>
                        <a href="{{ route('admin.dashboard') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#FDF4F2] text-[#E75234] font-bold">
                            <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
                            <span>Dashboard</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.users.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
                            <i data-lucide="users" class="w-5 h-5"></i>
                            <span>User Management</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.pets.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
                            <i data-lucide="paw-print" class="w-5 h-5"></i>
                            <span>Pet Management</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.matches') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
                            <i data-lucide="history" class="w-5 h-5"></i>
                            <span>Match History</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.analytics') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
                            <i data-lucide="bar-chart-2" class="w-5 h-5"></i>
                            <span>Analytics</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.billing') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
                            <i data-lucide="file-text" class="w-5 h-5"></i>
                            <span>Subscription and Billing</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.tickets') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
                            <i data-lucide="ticket" class="w-5 h-5"></i>
                            <span>Tickets</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.audit-logs') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
                            <i data-lucide="book-lock" class="w-5 h-5"></i>
                            <span>Audit Logs</span>
                        </a>
                    </li>
                </ul>
                <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-2">Personal</h3>
                <ul class="space-y-1">
                    <li>
                        <a href="{{ route('admin.profile') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
                            <i data-lucide="user-circle" class="w-5 h-5"></i>
                            <span>Profile Settings</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.notifications') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
                            <i data-lucide="bell" class="w-5 h-5"></i>
                            <span>Notifications</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.settings') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
                            <i data-lucide="settings" class="w-5 h-5"></i>
                            <span>Settings</span>
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>
    </div>

    <!-- JAVASCRIPT -->
    <script>
        // Initialize Icons
        lucide.createIcons();

        // Mobile Menu Toggle
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
</body>

</html>