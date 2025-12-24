@echo off
echo ========================================
echo   DEMARRAGE DU SYSTEME SNERTP
echo ========================================

echo.
echo 1. Demarrage du backend Django...
start "Backend Django" cmd /k "cd backend && python manage.py runserver 8000"

echo.
echo 2. Attente de 5 secondes...
timeout /t 5 /nobreak > nul

echo.
echo 3. Demarrage du frontend React...
start "Frontend React" cmd /k "npm run dev"

echo.
echo ========================================
echo   SERVEURS DEMARRES
echo ========================================
echo.
echo Backend:  http://127.0.0.1:8000/
echo Frontend: http://localhost:5173/
echo Admin:    http://127.0.0.1:8000/admin/
echo API Doc:  http://127.0.0.1:8000/swagger/
echo.
echo Comptes de test:
echo - receptionniste / password123
echo - admin / admin123
echo.
pause