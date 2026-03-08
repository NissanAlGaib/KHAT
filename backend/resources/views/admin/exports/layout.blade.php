<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>@yield('title')</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; vertical-align: top; }
        /* made a header row match PawLink brand color */
        th { background-color: #E75234; font-weight: bold; color: white; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        h1 { font-size: 18px; margin-bottom: 5px; color: #E75234; }
        .meta { font-size: 10px; color: #666; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .badge { padding: 2px 5px; border-radius: 3px; font-size: 9px; color: white; display: inline-block; }
        .badge-green { background-color: #10b981; }
        .badge-red { background-color: #ef4444; }
        .badge-yellow { background-color: #f59e0b; color: black; }
        .badge-gray { background-color: #6b7280; }
        /* added a logo header */
        .header-logos { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .header-logos img { height: 40px; border-radius: 50%; 
            object-fit: cover; 
        }
    </style>
</head>
<body>
    <!-- added a logo header -->
    {{-- company/app logos, paths use public_path so DomPDF can load on server --}}
    <div class="header-logos">
        <img src="{{ public_path('images/khat_logo.png') }}" alt="KHAT logo">
        <img src="{{ public_path('images/pawlink_logo.png') }}" alt="PawLink logo">
    </div>
    <h1>@yield('title')</h1>
    <div class="meta">Generated on: {{ now()->format('M d, Y h:i A') }} by {{ Auth::user()->name }}</div>
    @yield('content')
</body>
</html>
