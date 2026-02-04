@echo off
echo ============================================
echo   CineBook - Movie Booking Website
echo   Starting Local Server...
echo ============================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting server with Python...
    echo.
    echo Website will be available at: http://localhost:8000
    echo Press Ctrl+C to stop the server
    echo.
    python -m http.server 8000
) else (
    echo Python not found. Trying alternative method...
    echo.
    
    REM Try using PowerShell to start a simple HTTP server
    echo Starting server with PowerShell...
    echo.
    echo Website will be available at: http://localhost:8000
    echo Press Ctrl+C to stop the server
    echo.
    
    powershell -Command "$listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:8000/'); $listener.Start(); Write-Host 'Server started at http://localhost:8000'; Write-Host 'Press Ctrl+C to stop...'; while ($listener.IsListening) { $context = $listener.GetContext(); $response = $context.Response; $file = '.\index.html'; if (Test-Path $file) { $content = [System.IO.File]::ReadAllBytes($file); $response.ContentType = 'text/html'; $response.ContentLength64 = $content.Length; $response.OutputStream.Write($content, 0, $content.Length); }; $response.Close(); }"
)

pause
