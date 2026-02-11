@echo off
echo Starting Breed Identifier API...
start "Breed API Server" cmd /k "python main.py"
timeout /t 5
echo starting tunnel...
start "Public URL Tunnel" cmd /k "lt --port 5000"
echo.
echo ========================================================
echo 1. Wait for the tunnel window to open
echo 2. Copy the URL (e.g. https://moody-cat-42.loca.lt)
echo 3. Paste it into your backend/.env file:
echo    BREED_API_URL=https://your-url.loca.lt
echo ========================================================
pause
