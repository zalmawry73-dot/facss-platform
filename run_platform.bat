@echo off
chcp 65001 >nul
title FACSS Platform Runner - المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية

echo =====================================================================
echo    تشغيل منصة المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية
echo    Integrated Center for Security, Safety & Field Studies — Starting
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
echo [2/2] بدء تشغيل خادم المنصة (Next.js) على المنفذ 3000...
echo    الرابط المحلي: http://localhost:3000
echo    لوحة الإدارة: http://localhost:3000/admin
echo.
echo اضغط Ctrl+C لإيقاف الخادم عند الانتهاء.
echo =====================================================================
echo.

start http://localhost:3000
npm start
pause
