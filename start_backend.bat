@echo off
echo ========================================
echo   DEMARRAGE DU BACKEND SNERTP
echo ========================================
echo.
echo Demarrage du serveur Django...
echo Backend sera accessible sur: http://127.0.0.1:8000/
echo.
echo Comptes de test:
echo - Username: receptionniste
echo - Password: password123
echo.
echo - Username: admin  
echo - Password: admin123
echo.
echo API Endpoints:
echo - Login: POST http://127.0.0.1:8000/api/auth/login/
echo - Echantillons: GET http://127.0.0.1:8000/api/echantillons/
echo - Admin: http://127.0.0.1:8000/admin/
echo.
echo ========================================

cd backend
python manage.py runserver 8000