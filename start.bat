@echo off
echo ========================================
echo   Demarrage du Systeme Laboratoire
echo ========================================

echo.
echo 1. Demarrage du backend Django...
start "Backend Django" cmd /k "cd backend && python manage.py runserver"

echo.
echo 2. Attente de 5 secondes pour le backend...
timeout /t 5 /nobreak > nul

echo.
echo 3. Demarrage du frontend React...
start "Frontend React" cmd /k "cd /d c:\Users\HP\Desktop\MOI\maxime-app && npm run dev"

echo.
echo ========================================
echo   Les deux serveurs sont demarres !
echo ========================================
echo.
echo Backend : http://127.0.0.1:8000/
echo Frontend : http://localhost:3000/
echo.
echo Appuyez sur une touche pour fermer...
pause > nul