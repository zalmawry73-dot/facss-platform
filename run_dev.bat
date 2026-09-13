@echo off
chcp 65001 >nul
title FACSS Dev Runner - وضع التطوير

echo =====================================================================
echo    تشغيل المنصة في وضع التطوير (Development Mode with Hot-Reload)
echo =====================================================================
echo.

cd /d "%~dp0"

echo [1/2] التحقق من تشغيل قاعدة البيانات PostgreSQL على المنفذ 5433...
netstat -ano | findstr :5433 >nul
if %errorlevel% equ 0 (
    echo    ✓ قاعدة البيانات تعمل بالفعل على المنفذ 5433.
) else (
    echo    جاري تشغيل خادم PostgreSQL المحلي...
    start /min "FACSS_PostgreSQL" "C:\Program Files\PostgreSQL\16\bin\postgres.exe" -D "%~dp0db_cluster"
    timeout /t 3 /nobreak >nul
    echo    ✓ تم بدء تشغيل قاعدة البيانات بنجاح.
)

echo.
echo [2/2] بدء خادم التطوير (npm run dev)...
echo    الرابط المحلي: http://localhost:3000
echo.

start http://localhost:3000
npm run dev
pause
