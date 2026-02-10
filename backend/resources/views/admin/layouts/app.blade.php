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

        <nav class="flex-grow p-4 overflow-y-auto">
            <h3 class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">Working space</h3>
            <ul class="space-y-1">
                <li>
                    <a href="{{ route('admin.dashboard') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.dashboard') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <i data-lucide="layout-dashboard" class="w-5 h-5 {{ request()->routeIs('admin.dashboard') ? 'text-white' : 'text-gray-500' }}"></i>
                        <span>Dashboard</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.users.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.users.*') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <i data-lucide="users" class="w-5 h-5 {{ request()->routeIs('admin.users.*') ? 'text-white' : 'text-gray-500' }}"></i>
                        <span>User Management</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.pets.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.pets.*') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <i data-lucide="paw-print" class="w-5 h-5 {{ request()->routeIs('admin.pets.*') ? 'text-white' : 'text-gray-500' }}"></i>
                        <span>Pet Management</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.vaccine-protocols.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.vaccine-protocols.*') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <i data-lucide="syringe" class="w-5 h-5 {{ request()->routeIs('admin.vaccine-protocols.*') ? 'text-white' : 'text-gray-500' }}"></i>
                        <span>Vaccine Protocols</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.vaccination-shots.pending') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.vaccination-shots.*') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <i data-lucide="clipboard-check" class="w-5 h-5 {{ request()->routeIs('admin.vaccination-shots.*') ? 'text-white' : 'text-gray-500' }}"></i>
                        <span>Shot Verification</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.matches') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.matches') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <i data-lucide="history" class="w-5 h-5 {{ request()->routeIs('admin.matches') ? 'text-white' : 'text-gray-500' }}"></i>
                        <span>Match History</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.analytics') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.analytics') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <i data-lucide="bar-chart-2" class="w-5 h-5 {{ request()->routeIs('admin.analytics') ? 'text-white' : 'text-gray-500' }}"></i>
                        <span>Analytics</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.billing') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.billing') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <i data-lucide="file-text" class="w-5 h-5 {{ request()->routeIs('admin.billing') ? 'text-white' : 'text-gray-500' }}"></i>
                        <span>Subscription and Billing</span>
                    </a>
                </li>
                <li>
                    <a href="{{ route('admin.tickets') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.tickets') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                        <i data-lucide="ticket" class="w-5 h-5 {{ request()->routeIs('admin.tickets') ? 'text-white' : 'text-gray-500' }}"></i>
                        <span>Tickets</span>
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
                <h3 class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">Working space</h3>
                <ul class="space-y-1">
                    <li>
                        <a href="{{ route('admin.dashboard') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.dashboard') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                            <i data-lucide="layout-dashboard" class="w-5 h-5 {{ request()->routeIs('admin.dashboard') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Dashboard</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.users.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.users.*') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                            <i data-lucide="users" class="w-5 h-5 {{ request()->routeIs('admin.users.*') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>User Management</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.pets.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.pets.*') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                            <i data-lucide="paw-print" class="w-5 h-5 {{ request()->routeIs('admin.pets.*') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Pet Management</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.vaccine-protocols.index') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.vaccine-protocols.*') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                            <i data-lucide="syringe" class="w-5 h-5 {{ request()->routeIs('admin.vaccine-protocols.*') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Vaccine Protocols</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.vaccination-shots.pending') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.vaccination-shots.*') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                            <i data-lucide="clipboard-check" class="w-5 h-5 {{ request()->routeIs('admin.vaccination-shots.*') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Shot Verification</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.matches') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.matches') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                            <i data-lucide="history" class="w-5 h-5 {{ request()->routeIs('admin.matches') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Match History</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.analytics') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.analytics') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                            <i data-lucide="bar-chart-2" class="w-5 h-5 {{ request()->routeIs('admin.analytics') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Analytics</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.billing') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.billing') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                            <i data-lucide="file-text" class="w-5 h-5 {{ request()->routeIs('admin.billing') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Subscription and Billing</span>
                        </a>
                    </li>
                    <li>
                        <a href="{{ route('admin.tickets') }}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg {{ request()->routeIs('admin.tickets') ? 'bg-white/10 text-white font-semibold border-l-[3px] border-[#E75234]' : 'text-gray-400 hover:text-white hover:bg-white/10 font-medium' }}">
                            <i data-lucide="ticket" class="w-5 h-5 {{ request()->routeIs('admin.tickets') ? 'text-white' : 'text-gray-500' }}"></i>
                            <span>Tickets</span>
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