<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>KHAT Admin Login</title>

    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        body { font-family: 'Inter', sans-serif; }
        .fade-enter {
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        }

        .fade-enter-active {
            opacity: 1;
        }
        
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUp 0.5s ease-out forwards; }
    </style>
</head>

<body class="bg-white font-sans overflow-hidden">

    <div class="flex h-screen">
        <div class="w-full lg:w-1/2 flex flex-col h-full bg-white">

            <div class="flex-grow flex flex-col justify-center px-8 md:px-16 lg:px-24 animate-slide-up">
                <div class="w-full max-w-md mx-auto">

                    <h1 class="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
                    <p class="text-gray-500 mb-6 text-sm">Please enter your admin credentials.</p>

                    @if ($errors->any())
                    <div class="mb-4 rounded-xl bg-red-50 border border-red-200 p-4">
                        <div class="flex">
                            <div class="ml-3">
                                <h3 class="text-sm font-semibold text-red-800">
                                    Authentication Error
                                </h3>
                                <div class="mt-2 text-sm text-red-700">
                                    <ul class="list-disc pl-5 space-y-1">
                                        @foreach ($errors->all() as $error)
                                        <li>{{ $error }}</li>
                                        @endforeach
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    @endif

                    <form id="loginForm" class="space-y-4" action="{{ url('/admin/login') }}" method="POST">
                        @csrf

                        <div>
                            <label class="block text-gray-700 font-medium mb-1 text-sm">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value="{{ old('email') }}"
                                placeholder="Enter your email"
                                required
                                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition-all placeholder-gray-400 text-sm" />
                        </div>

                        <div>
                            <label class="block text-gray-700 font-medium mb-1 text-sm">Password</label>
                            <div class="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    required
                                    class="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E75234] focus:border-transparent transition-all placeholder-gray-400 text-sm" />
                                <button
                                    type="button"
                                    onclick="togglePassword()"
                                    class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                    <i id="icon-eye" data-lucide="eye" class="w-[18px] h-[18px]"></i>
                                    <i id="icon-eye-off" data-lucide="eye-off" class="hidden w-[18px] h-[18px]"></i>
                                </button>
                            </div>
                        </div>

                        <div class="flex justify-between items-center text-xs sm:text-sm">
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    id="remember"
                                    name="remember"
                                    type="checkbox"
                                    class="w-4 h-4 accent-[#E75234] rounded border-gray-300" />
                                <span class="text-gray-600 font-medium">Remember me</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            class="w-full bg-[#E75234] hover:bg-[#d14024] text-white py-3 rounded-xl font-bold text-base shadow-lg shadow-[#E75234]/30 transition-all active:scale-[0.98]">
                            Login
                        </button>
                    </form>
                </div>
            </div>
        </div>

        <div class="hidden lg:flex w-1/2 bg-[#FDF4F2] flex-col items-center justify-center relative overflow-hidden">
            <!-- Decorative Blobs -->
            <div class="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[#E75234] opacity-10 blur-3xl"></div>
            <div class="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#E75234] opacity-10 blur-3xl"></div>

            <div class="relative z-10 text-center">

                <div class="mb-8 mx-auto flex items-center justify-center">
                    <h2 class="text-5xl font-extrabold text-[#E75234] tracking-tight">KHAT</h2>
                </div>

                <h2 class="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                    Admin Panel
                </h2>
                <p class="text-xl text-gray-600 font-medium">
                    Manage your pet matchmaking platform
                </p>
            </div>
        </div>
    </div>

    <script>
        // Initialize Icons
        lucide.createIcons();

        // State Variables
        let showPassword = false;

        // DOM Elements
        const passwordInput = document.getElementById('password');
        const iconEye = document.getElementById('icon-eye');
        const iconEyeOff = document.getElementById('icon-eye-off');

        // Toggle Password Visibility
        function togglePassword() {
            showPassword = !showPassword;

            passwordInput.type = showPassword ? 'text' : 'password';

            if (showPassword) {
                iconEye.classList.add('hidden');
                iconEyeOff.classList.remove('hidden');
            } else {
                iconEye.classList.remove('hidden');
                iconEyeOff.classList.add('hidden');
            }
        }
    </script>
</body>

</html>